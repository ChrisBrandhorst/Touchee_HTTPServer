using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using System.Drawing;
using System.IO;
using System.Xml.Linq;
using System.Threading;
using MayoSolutions.iTunes.ITCParser;

using Touchee.Artwork;

namespace Touchee.ITunes {

    /// <summary>
    /// The media types used
    /// </summary>
    public static class Types {
        //public const string Tracks = "tracks";
        public const string Track = "track";
        //public const string Artists = "artists";
        public const string Artist = "artist";
        //public const string Albums = "albums";
        public const string Album = "album";
        //public const string Genres = "genres";
        public const string Genre = "genre";
    }


    public class ITunes : Base, IPlugin, IContentsPlugin {

        public ITunes() {}


        #region Properties

        internal static dynamic Config;
        Controller _controller;
        static string _libraryXMLPath;
        static string _libraryPersistentID;
        static string _artworkDir;

        #endregion


        #region IPlugin implementation


        // The name of the plugin
        public string Name { get { return "iTunes"; } }


        /// <summary>
        /// Start the plugin
        /// </summary>
        /// <param name="config">The configuration object for this plugin</param>
        /// <returns>Always true</returns>
        public bool Start(dynamic config) {
            Config = config;
            _controller = new Controller();
            return true;
        }


        /// <summary>
        /// Disable the plugin
        /// </summary>
        /// <returns>Always true</returns>
        public bool Shutdown() {
            return true;
        }


        #endregion


        #region IContentsPlugin implementation

        /// <summary>
        /// Whether the data this plugin serves requires a custom frontend, or the default frontend
        /// for the different containers.
        /// </summary>
        public bool CustomFrontend { get { return false; } }
        
        /// <summary>
        /// Gets the items collection for the given parameters
        /// </summary>
        /// <param name="container">The container for which the items should be retreived</param>
        /// <param name="view">How to view the results</param>
        /// <param name="query">The filter object</param>
        /// <returns>The results</returns>
        public IEnumerable<IItem> GetItems(IContainer container, Filter filter) {
            return _controller.GetItems(container, filter);
        }

        /// <summary>
        /// Gets the contents object for the given parameters
        /// </summary>
        /// <param name="container">The container for which the contents should be retreived</param>
        /// <param name="view">How to view the results</param>
        /// <param name="query">The filter object</param>
        /// <returns>The results</returns>
        public Contents GetContents(IContainer container, Filter filter) {
            return _controller.GetContents(container, filter);
        }

        /// <summary>
        /// Returns unavailable, so the default Touchee artwork process is used
        /// </summary>
        /// <returns>ArtworkStatus.Unavailable</returns>
        public ArtworkStatus GetArtwork(IContainer container, IItem item, out Image artwork) {
            artwork = null;
            return ArtworkStatus.Unavailable;
        }

        /// <summary>
        /// Returns unavailable, so the default Touchee artwork process is used
        /// </summary>
        /// <returns>ArtworkStatus.Unavailable</returns>
        public ArtworkStatus GetArtwork(IContainer container, Filter filter, out Image artwork) {
            artwork = null;
            return ArtworkStatus.Unavailable;
        }


        #endregion


        #region Library XML helpers


        /// <summary>
        /// Gets the library XML Path
        /// This method first checks a previously stored path, then the config and then iTunes
        /// </summary>
        public static string LibraryXMLPath {
            get {
                if (!String.IsNullOrWhiteSpace(_libraryXMLPath))
                    return _libraryXMLPath;
                else if (Config != null && !String.IsNullOrWhiteSpace(Config.libraryXmlPath))
                    _libraryXMLPath = Config.libraryXmlPath;
                else
                    _libraryXMLPath = Application.LibraryXMLPath;
                return _libraryXMLPath;
            }
        }


        /// <summary>
        /// Gets the library XML XDocument
        /// </summary>
        public static XDocument GetLibraryXML() {

            // Check if file exists
            if (!File.Exists(LibraryXMLPath)) {
                Logger.Log("iTunes XML library cannot be found at " + LibraryXMLPath, Logger.LogLevel.Error);
                return null;
            }

            // Load file
            XDocument libraryXMLDoc;
            while (true) {
                try {
                    libraryXMLDoc = XDocument.Load(LibraryXMLPath);
                    break;
                }
                catch (IOException) {
                    Thread.Sleep(100);
                }
            }

            // Store library persistent ID
            _libraryPersistentID = (string)libraryXMLDoc.Element("plist").Element("dict").Elements("key").First(e => e.Value == "Library Persistent ID").ElementsAfterSelf().First();
            _artworkDir = Path.Combine(new FileInfo(_libraryXMLPath).DirectoryName, "Album Artwork", "Cache", _libraryPersistentID);
            if (!Directory.Exists(_artworkDir)) _artworkDir = null;

            return libraryXMLDoc;
        }


        #endregion





        #region ITC stuff

        //public static Bitmap GetArtworkForAlbum(Media.Track track) {
        //    return GetArtworkForAlbum(track.AlbumArtist, track.Album);
        //}
        //public static Bitmap GetArtworkForAlbum(string albumArtist, string album) {

        //    // Check if we have an artwork dir
        //    if (String.IsNullOrWhiteSpace(_artworkDir)) return null;

        //    // Get all tracks
        //    var tracks = Media.Track.Where(t => t.AlbumArtist == albumArtist && t.Album == album);

        //    // Loop through all tracks and find the ITC2 file corresponding to the track
        //    string path = null;
        //    foreach (var t in tracks) {
        //        var p = Path.Combine(
        //            _artworkDir,
        //            Convert.ToInt32(t.PersistentID[15].ToString(), 16).ToString("D2"),
        //            Convert.ToInt32(t.PersistentID[14].ToString(), 16).ToString("D2"),
        //            Convert.ToInt32(t.PersistentID[13].ToString(), 16).ToString("D2"),
        //            String.Format("{0}-{1}.itc2", _libraryPersistentID, t.PersistentID)
        //        );
        //        if (File.Exists(p)) {
        //            path = p;
        //            break;
        //        }
        //    }

        //    // If we have no path, return null
        //    if (path == null) return null;

        //    var image = ITCFile.GetImage(path);
        //    image.Save(@"C:\Users\HT\Desktop\bla.png", System.Drawing.Imaging.ImageFormat.Png);
        //    return null;
        //}
        #endregion


    }

}
