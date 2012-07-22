using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee.Web;
using Touchee.Web.Messages;
using Touchee.Artwork;
using System.Drawing;
using System.IO;
using System.Threading;

namespace Touchee {

    /// <remarks>
    /// 
    /// </remarks>
    public class Library : Base {


        #region Singleton

        /// <summary>
        /// Private constructor
        /// </summary>
        Library() { }

        /// <summary>
        /// The singleton instance of the library
        /// </summary>
        public static Library Instance = new Library();

        #endregion


        #region Private vars

        /// <summary>
        /// The server used to communicate changes in the library
        /// </summary>
        protected Server _server;

        /// <summary>
        /// List of current medium wathcers
        /// </summary>
        List<IMediumWatcher> _mediumWatchers;

        /// <summary>
        /// List of current media watchers
        /// </summary>
        List<IMediaWatcher> _mediaWatchers;

        /// <summary>
        /// Timespan representing the period that should be waited before retrying a non-available artwork
        /// </summary>
        TimeSpan _artworkRetryPeriod;

        #endregion


        #region Init

        /// <summary>
        /// Initialises the library
        /// </summary>
        /// <param name="mediaWatcherPollingInterval">The interval at which to look for modified media</param>
        public void Init(Server server, int mediaWatcherPollingInterval) {
            _server = server;

            // Set retry period from config
            int period;
            Program.Config.TryGetInt("artwork.retryPeriod", out period);
            _artworkRetryPeriod = new TimeSpan(0, 0, period);

            // Instantiate all available MediumWatchers
            // These watch the Medium instances and generate Containers
            _mediumWatchers = Util.InstantiateAllImplementations<IMediumWatcher>();
            Medium.AfterCreate += new Collectable<Medium>.ItemEventHandler(Medium_AfterCreate);
            Medium.AfterDispose += new Collectable<Medium>.ItemEventHandler(Medium_AfterDispose);

            // Watch for container changes
            Container.AfterCreate += new Collectable<Container>.ItemEventHandler(Container_AfterCreate);
            Container.AfterUpdate += new Collectable<Container>.ItemEventHandler(Container_AfterUpdate);
            Container.AfterDispose += new Collectable<Container>.ItemEventHandler(Container_AfterDispose);

            // Build local medium
            string name = Program.Config.GetString("name", "Touchee");
            new Medium(name, MediumType.Local).Save();
            new Medium("Radio", MediumType.Radio).Save();

            // Instantiate all available MediaWatchers
            // These generate Medium instances
            _mediaWatchers = Util.InstantiateAllImplementations<IMediaWatcher>();

            // Start media detection
            _mediaWatchers.ForEach(w => w.Watch(mediaWatcherPollingInterval));
        }

        #endregion


        #region Event handlers

        /// <summary>
        /// Called when a medium has been detected. Presents this medium to all watchers.
        /// If any watcher watches the medium, the media list is broadcasted.
        /// </summary>
        void Medium_AfterCreate(object sender, Collectable<Medium>.ItemEventArgs e) {
            var beingWatched = false;
            _mediumWatchers.ForEach(w => beingWatched |= w.Watch(e.Item));
            if (beingWatched)
                _server.Broadcast(Media());
        }


        /// <summary>
        /// Called when a medium has been removed. Presents this medium to all watchers.
        /// If any watcher watches was watching the medium, the media list is broadcasted.
        /// </summary>
        void Medium_AfterDispose(object sender, Collectable<Medium>.ItemEventArgs e) {
            var beingWatched = false;
            _mediumWatchers.ForEach(w => beingWatched |= w.UnWatch(e.Item));
            if (beingWatched)
                _server.Broadcast(Media());
        }


        /// <summary>
        /// Called when a container has been created. All containers of the corresponding
        /// medium are broadcasted, in order to update the complete list.
        /// </summary>
        void Container_AfterCreate(object sender, Collectable<Container>.ItemEventArgs e) {
            _server.Broadcast(Containers(e.Item.Medium));
        }

        /// <summary>
        /// Called when a container has been changed. All containers of the corresponding
        /// medium are broadcasted, in order to update the complete list.
        /// </summary>
        void Container_AfterUpdate(object sender, Collectable<Container>.ItemEventArgs e) {
            _server.Broadcast(Containers(e.Item.Medium));
        }

        /// <summary>
        /// Called when a container has been removed. All containers of the corresponding
        /// medium are broadcasted, in order to update the complete list.
        /// </summary>
        void Container_AfterDispose(object sender, Collectable<Container>.ItemEventArgs e) {
            _server.Broadcast(Containers(e.Item.Medium));
        }



        #endregion


        #region Messages

        /// <summary>
        /// Gets a message containing server info
        /// </summary>
        public ServerInfoMessage ServerInfo() {
            return _server.ServerInfo;
        }


        /// <summary>
        /// Gets a message containing information on all available media
        /// </summary>
        public MediaMessage Media() {
            var message = new MediaMessage();
            Medium.ForEach(m => message.Add(m));
            return message;
        }


        /// <summary>
        /// Gets a message containing information on all available containers of the given medium
        /// </summary>
        public ContainersMessage Containers(Medium medium) {
            var message = new ContainersMessage(medium);
            foreach (var c in medium.Containers)
                message.Add(c);
            return message;
        }


        /// <summary>
        /// Gets a message containing the content for the given container, type and filter combination
        /// </summary>
        public ContentsMessage Contents(Container container, string type, Filter filter) {
            var controller = Plugins.GetContentsPluginFor(container);
            if (controller == null)
                return null;
            
            var contents = controller.GetContents(container, type, filter);
            return contents == null ? null : new ContentsMessage(container, contents);
        }


        #endregion


        #region Artwork

        /// <summary>
        /// Contains the cached artwork results of artwork that is pending or not found
        /// </summary>
        Dictionary<string, ArtworkResult> _artworkResultCache = new Dictionary<string, ArtworkResult>();

        /// <summary>
        /// Gets the artwork for the given item
        /// </summary>
        /// <param name="container">The container in which the item resides</param>
        /// <param name="item">The item for which to find artwork</param>
        /// <param name="client">The client for which the artwork is retrieved</param>
        /// <param name="uri">The uri which was called</param>
        /// <returns>An ArtworkResult object containing the artwork and its status and type</returns>
        public ArtworkResult Artwork(IContainer container, IItem item, Client client, Uri uri) {
            // Build empty result object
            var noResult = new ArtworkResult();
            
            // No item? No result
            if (item == null) return noResult;

            // Get unique key
            var uniqueKey = ArtworkHelper.GetUniqueKey(item);
            if (uniqueKey == null) return noResult;

            // Return artwork for unique key
            return Artwork(container, uniqueKey, item, null, client, uri);
        }


        /// <summary>
        /// Gets the artwork for the given filter
        /// </summary>
        /// <param name="container">The container in which the item resides</param>
        /// <param name="filter">The filter for which to find artwork</param>
        /// <param name="client">The client for which the artwork is retrieved</param>
        /// <param name="uri">The uri which was called</param>
        /// <returns>An ArtworkResult object containing the artwork and its status and type</returns>
        public ArtworkResult Artwork(IContainer container, Filter filter, Client client, Uri uri) {

            // Get hash input from filter
            var uniqueKey = String.Join(",", 
                new SortedDictionary<string, string>(filter).Select(
                    kv => kv.Key + ":" + kv.Value
                )
            );

            // Return artwork for hash input
            return Artwork(container, uniqueKey, null, filter, client, uri);
        }


        /// <summary>
        /// Gets the artwork for the given unique key, which was sourced from the given item or filter.
        /// Either item or filter should be given.
        /// If the artwork is not found in the cache, the call is delegated to a thread to retrieve the
        /// item from a plugin or service.
        /// </summary>
        /// <param name="container">The container in which the artwork subject resides</param>
        /// <param name="uniqueKey">The hash input value of the artwork</param>
        /// <param name="item">The item for which to find artwork</param>
        /// <param name="filter">The filter for which to find artwork</param>
        /// <param name="client">The client for which the artwork is retrieved</param>
        /// <param name="uri">The uri which was called</param>
        /// <returns>An ArtworkResult object</returns>
        ArtworkResult Artwork(IContainer container, string uniqueKey, IItem item, Filter filter, Client client, Uri uri) {

            // Result var
            ArtworkResult result;

            // Check if this artwork is in the results cache
            // Artwork is only present there if was tried at least once and it is not (yet) available
            lock (_artworkResultCache) {
                if (_artworkResultCache.ContainsKey(uniqueKey)) {

                    // Get the result cache
                    result = _artworkResultCache[uniqueKey];

                    // If the artwork was previously unavailable, but the retry period has passed, remove it from the status list so we can retry it
                    if (result.Status == ArtworkStatus.Unavailable && result.DateTime + _artworkRetryPeriod < DateTime.Now)
                        _artworkResultCache.Remove(uniqueKey);

                    // Otherwise, return the existing status
                    else
                        return result;

                }
                else
                    result = new ArtworkResult();
            
            }

            // Check if we have any input
            if (item == null && filter == null) {
                Log("This should never happen! Y U implement wrong!?!?!?", Logger.LogLevel.Error);
                return result;
            }
            
            // Get form cache
            result = ArtworkHelper.GetFromCache(uniqueKey);

            // Set type
            result.Type = filter == null ? ArtworkHelper.GetDefaultArtworkType(item) : ArtworkHelper.GetDefaultArtworkType(filter);

            // We have cache!
            // TODO???: invalidate cache by checking creation date of cache file
            if (result.Artwork != null) {
                return result;
            }

            // No cache and no client (url must have been called from outside the app), so we make the client wait
            else if (client == null) {
                return GetNonCachedArtwork(result, container, uniqueKey, item, filter, client, uri);
            }

            // No cache but a client, get artwork in different thread to free HTTP request
            else {
                result.Status = ArtworkStatus.Pending;
                new Thread(() => GetNonCachedArtwork(result, container, uniqueKey, item, filter, client, uri)).Start();
                return result;
            }

        }


        /// <summary>
        /// Gets the artwork for the given unique key, which was sourced from the given item or filter.
        /// Either item or filter should be given. The artwork is sourced from a plugin or service.
        /// If artwork is found, it is stored in the cache and the client is notified of the availability.
        /// </summary>
        /// <param name="container">The container in which the artwork subject resides</param>
        /// <param name="uniqueKey">The unique key value of the artwork</param>
        /// <param name="item">The item for which to find artwork</param>
        /// <param name="filter">The filter for which to find artwork</param>
        /// <param name="client">The client for which the artwork is retrieved</param>
        /// <param name="uri">The uri which was called</param>
        /// <returns>An image if artwork was found, otherwise null</returns>
        ArtworkResult GetNonCachedArtwork(ArtworkResult result, IContainer container, string uniqueKey, IItem item, Filter filter, Client client, Uri uri) {

            // Artwork result object
            result.Status = ArtworkStatus.Pending;

            // Check if we have any input
            if (item == null && filter == null) {
                Log("This should never happen! Y U implement wrong!?!?!?", Logger.LogLevel.Error);
                return result;
            }

            // If we are already processing this image, bail out
            lock (_artworkResultCache) {
                if (_artworkResultCache.ContainsKey(uniqueKey)) {
                    Log("This should never happen! Y U implement wrong!?!?!?", Logger.LogLevel.Error);
                    return _artworkResultCache[uniqueKey];
                }
            }

            // Ensure pending artwork is always removed from the results cache
            try {
                
                // We are processing this image
                lock (_artworkResultCache) {
                    _artworkResultCache[uniqueKey] = result;
                }

                // Get the image from the plugin
                var plugin = Plugins.GetContentsPluginFor(container);
                if (plugin != null) {
                    Image artwork;
                    result.Status = filter == null ? plugin.GetArtwork(container, item, out artwork) : plugin.GetArtwork(container, filter, out artwork);
                    result.Artwork = artwork;
                }

                // No image yet? Get from artwork service
                if (result.Artwork == null)
                    result = filter == null ? ArtworkHelper.GetFromArtworkService(item) : ArtworkHelper.GetFromArtworkService(filter);

                // if we have an image, store it in cache
                if (result.Artwork != null) {

                    // Resize if image is too large
                    if (result.Artwork.Width > 1024 || result.Artwork.Height > 1024) {
                        using (var sourceArtwork = result.Artwork) {
                            result.Artwork = sourceArtwork.Resize(new Size(1024, 1024), ResizeMode.ContainAndShrink);
                        }
                    }

                    // Save to cache
                    ArtworkHelper.SaveToCache(result.Artwork, uniqueKey);
                }

                // Remove from cache if we have retrieved an image
                lock (_artworkResultCache) {
                    if (result.Status == ArtworkStatus.Retrieved)
                        _artworkResultCache.Remove(uniqueKey);
                }

                // Notify client we are done
                if (client != null)
                    _server.Send(client, new ArtworkMessage(uri.PathAndQuery, null));

            }

            // Ensure procesing status is removed when an exception occurs
            catch (Exception) {
                lock (_artworkResultCache) {
                    if (_artworkResultCache.ContainsKey(uniqueKey) && _artworkResultCache[uniqueKey].Status == ArtworkStatus.Pending)
                        _artworkResultCache.Remove(uniqueKey);
                }
            }

            return result;
        }




        #endregion


        #region Controlling


        
        public void Play(Container container, Filter filter) {
            var controller = Plugins.GetContentsPluginFor(container);
            if (controller == null)
                return;
        }


        #endregion

    }

}