using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Drawing;

using Torshify;
using Touchee.Artwork;

namespace Touchee.Spotify {


    /// <remarks>
    /// 
    /// </remarks>
    public class Spotify : Base, IPlugin, IContentsPlugin {

        /// <summary>
        /// Empty constructor
        /// </summary>
        public Spotify() { }


        #region Static properties

        /// <summary>
        /// The base path for Spotify stuff
        /// </summary>
        internal static readonly string BasePath = Path.Combine(Environment.CurrentDirectory, @"tmp\spotify");

        /// <summary>
        /// The path to which libspotify stores its cache
        /// </summary>
        internal static readonly string CachePath = Path.Combine(BasePath, "cache");

        /// <summary>
        /// The path to which libspotify stores its settings
        /// </summary>
        internal static readonly string SettingsPath = Path.Combine(BasePath, "settings");

        #endregion


        #region Privates

        // The configuration
        internal static dynamic Config;

        // The key
        byte[] _key;

        #endregion


        #region Properties

        /// <summary>
        /// The currently used Spotify session
        /// </summary>
        public ISession Session { get; private set; }

        #endregion


        #region IPlugin implementation


        // The name of the plugin
        public string Name { get { return "Spotify"; } }


        /// <summary>
        /// Start the plugin
        /// </summary>
        /// <param name="config">The configuration object for this plugin</param>
        /// <returns>Always true</returns>
        public bool Start(dynamic config) {
            Config = config;

            // Check for key presence
            string keyString = config.GetString("key");
            if (keyString == null) {
                Log("No key given in config.", Logger.LogLevel.Error);
                return false;
            }

            // Parse the bytes
            byte[] keyBytes = new byte[0];
            try {
                keyBytes = keyString.Trim(new char[] { ' ', '\n' }).Split(' ').Select(c => Convert.ToByte(c, 16)).ToArray();
            }
            catch (Exception) {
                Log("Error in parsing key", Logger.LogLevel.Error);
                return false;
            }

            // Store the key
            _key = keyBytes;

            // Check for username and password
            if (config.GetString("username") == null || config.GetString("password") == null) {
                Log("Username and/or password not given in config", Logger.LogLevel.Error);
                return false;
            }
            
            // Init session

            new System.Threading.Thread(() => {

                Session = SessionManager.Instance.Init(_key);
                SessionManager.Instance.Login(
                    config.GetString("username")
                );

            }).Start();

            return true;
        }


        /// <summary>
        /// Disable the plugin
        /// </summary>
        /// <returns>Always true</returns>
        public bool Shutdown() {

            // TODO:
            // Stop playing
            // Logout

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
        /// <param name="filter">The filter object which contains the parameters with which to query for items</param>
        /// <returns>The results</returns>
        public IEnumerable<IItem> GetItems(IContainer container, Options filter) {
            return null;
        }

        /// <summary>
        /// Gets the contents object for the given parameters
        /// </summary>
        /// <param name="container">The container for which the contents should be retreived</param>
        /// <param name="filter">The filter object which contains the parameters with which to query for items</param>
        /// <returns>The results</returns>
        public Contents GetContents(IContainer container, Options filter) {
            return null;
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
        public ArtworkStatus GetArtwork(IContainer container, Options filter, out Image artwork) {
            artwork = null;
            return ArtworkStatus.Unavailable;
        }


        #endregion









    }


}
