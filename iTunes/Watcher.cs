using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee;
using iTunesLib;
using System.IO;
using System.Xml.Linq;
using System.Threading;
using System.Diagnostics;
using Touchee.ITunes.Media;

namespace Touchee.ITunes {

    /// <remarks>
    /// Watches the ITunes Library
    /// </remarks>
    public class Watcher : Base, IMediumWatcher {

        Medium _localMedium;
        Medium _webMedium;
        WebcastContainer _webcastContainer;

        /// <summary>
        /// Constructor
        /// </summary>
        public Watcher() { }


        /// <summary>
        /// Start watching the given medium. Only if a medium with type Local is given, is iTunes going to be watched.
        /// </summary>
        /// <param name="medium">The Medium to watch</param>
        public bool Watch(Medium medium) {

            // TODO: Check if the itunes plugin is disabled
            
            // First, collect all media
            if (medium.Type == MediumType.Local && _localMedium == null)
                _localMedium = medium;
            else if (medium.Type == MediumType.Web && _webMedium == null)
                _webMedium = medium;
            else
                return false;

            // Bail out if we do not have both media
            if (_localMedium == null || _webMedium == null) return false;

            // Do initial library load
            LoadLibrary();

            // Watch library xml for any changes
            var file = new FileInfo(ITunes.LibraryXMLPath);
            var watcher = new FileSystemWatcher(file.DirectoryName, file.Name);
            watcher.Changed += new FileSystemEventHandler(LibraryXMLChanged);
            watcher.EnableRaisingEvents = true;

            return true;
        }


        /// <summary>
        /// Stop watching the given medium
        /// </summary>
        /// <param name="medium">The medium to stop watching</param>
        public bool UnWatch(Medium medium) {
            if (_localMedium == medium) {
                _localMedium = null;
                // TODO: clear containers
                // For now, we can assume this call is never made, since the local
                // medium will never be ejected
                return true;
            }
            else if (_webMedium == medium) {
                _webMedium = null;
                return true;
            }
            return false;
        }


        /// <summary>
        /// Called when the library XML file has been changed
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        void LibraryXMLChanged(object sender, FileSystemEventArgs e) {
            LoadLibrary();
        }


        /// <summary>
        /// Loads the iTunes library in its whole, by using the library XML document.
        /// </summary>
        /// <param name="libraryXMLPath">The path to the library XML</param>
        void LoadLibrary() {

            Stopwatch sw = new Stopwatch();
            sw.Start();

            // Load file
            XDocument libraryXMLDoc = ITunes.GetLibraryXML();

            // Check if document was returned
            if (libraryXMLDoc == null) {
                Log("iTunes XML library cannot be loaded", Logger.LogLevel.Error);
                return;
            }

            #region Tracks

            // Get all persistent IDs of the current tracks
            var deletedTracks = Track.All().ToList().Select(t => t.PersistentID).ToList();
            
            // Get all track nodes, without the movies
            var trackNodes = from track in libraryXMLDoc.Element("plist").Element("dict").Element("dict").Elements("dict")
                             where !track.Elements("key").Any(e => e.Value == "Movie")
                             select new {
                                 PersistentID = (string)track.Elements("key").First(e => e.Value == "Persistent ID").ElementsAfterSelf().First(),
                                 Track = track
                             };

            // Map track IDs to their persistent IDs, the latter which are used in Touchee
            var trackIDs = new string[trackNodes.Count() * 4];

            // Loop through all tracks
            Track toucheeTrack;
            foreach (var trackNode in trackNodes) {
                // Create or update the track in memory
                toucheeTrack = Track.CreateOrUpdate(trackNode.PersistentID, trackNode.Track);
                // Remove the persistent id from the deleted tracks list, to indicate it is still present
                deletedTracks.Remove(trackNode.PersistentID);

                // Map trackID to persitentID
                if (toucheeTrack.TrackID >= trackIDs.Length)
                    Array.Resize(ref trackIDs, trackIDs.Length * 2);

                // Only save trackIDs (for gathering playlists) if we have a filetrack
                if (toucheeTrack is FileTrack)
                    trackIDs[toucheeTrack.TrackID] = toucheeTrack.PersistentID;
            }

            #endregion


            #region Webcasts

            // Find al webcasts
            var webcasts = Track.All<Webcast>();

            // If we have any
            if (webcasts.Count() > 0) {
                
                // Build the container if not present
                if (_webcastContainer == null)
                    _webcastContainer = new WebcastContainer("Library", _webMedium);

                // Set the items
                _webcastContainer.Update(webcasts);
                _webcastContainer.Save();
            }

            // Else, remove the container
            else if (_webcastContainer != null) {
                _webcastContainer.Dispose();
                _webcastContainer = null;
            }

            #endregion


            #region Playlists

            // Get all persistent IDs of the current tracks
            var deletedPlaylists = Playlist.All<Playlist>().ToList().Select(p => p.PersistentID).ToList();

            // Get all playlists
            var playlistNodes = from playlist in libraryXMLDoc.Element("plist").Element("dict").Element("array").Elements("dict")
                                where !playlist.Elements("key").Any(e => e.Value == "Distinguished Kind")
                                    && !playlist.Elements("key").Any(e => e.Value == "Smart Info")
                                select new {
                                    PersistentID = (string)playlist.Elements("key").First(e => e.Value == "Playlist Persistent ID").ElementsAfterSelf().First(),
                                    Name = (string)playlist.Elements("key").First(e => e.Value == "Name").ElementsAfterSelf().First(),
                                    TrackIDs = playlist.Element("array") == null ? new List<string>() : playlist.Element("array").Descendants("integer").Select(e => trackIDs[(int)e]).Where(t => t != null),
                                    Master = playlist.Elements("key").Any(e => e.Value == "Master")
                                };

            // Loop through all playlists
            foreach (var playlistNode in playlistNodes) {
                // Create or update the playlist in memory
                Playlist.CreateOrUpdate(_localMedium, playlistNode.PersistentID, playlistNode.Name, playlistNode.TrackIDs, playlistNode.Master);
                // Remove the persistent id from the deleted playlists list, to indicate it is still present
                deletedPlaylists.Remove(playlistNode.PersistentID);
            }

            #endregion

            sw.Stop();
            Log(String.Format("Loaded {0} tracks and {1} playlists in {2}ms", trackNodes.Count(), playlistNodes.Count(), sw.ElapsedMilliseconds));

            // Force clearing of memory
            trackNodes = null;
            playlistNodes = null;
            libraryXMLDoc = null;
            System.GC.Collect();


        }
        

    }

}
