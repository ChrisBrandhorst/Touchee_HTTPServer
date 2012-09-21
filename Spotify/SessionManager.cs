using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

using Torshify;

namespace Touchee.Spotify {
    
    internal class SessionManager : Base {


        #region Singleton

        /// <summary>
        /// Private constructor
        /// </summary>
        SessionManager() { }

        /// <summary>
        /// The singleton instance of the SessionManager
        /// </summary>
        public static SessionManager Instance = new SessionManager();

        #endregion


        #region Properties

        /// <summary>
        /// The currently used Spotify session
        /// </summary>
        public ISession Session { get; private set; }

        #endregion


        #region Privates

        // 
        string _username;

        #endregion


        /// <summary>
        /// Initialises a new Spotify session
        /// </summary>
        /// <param name="key">The application key to use</param>
        /// <returns>The created session</returns>
        public ISession Init(byte[] key) {

            Session = SessionFactory
                .CreateSession(
                    key,
                    Spotify.CachePath,
                    Spotify.SettingsPath,
                    "Touchee")
                .SetPreferredBitrate(Bitrate.Bitrate320k)
                .SetCacheSize(1024);

            Session.LoginComplete += Session_LoginComplete;
            Session.LogoutComplete += Session_LogoutComplete;
            Session.ConnectionError += Session_ConnectionError;
            Session.ConnectionStateUpdated += Session_ConnectionStateUpdated;
            Session.CredentialsBlobUpdated += Session_CredentialsBlobUpdated;
            
            return Session;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="username"></param>
        /// <param name="password"></param>
        public void Login(string username, string password = null) {

            // Store username
            _username = username;
            
            // Get the blob
            var blob = LoadCredentialsBlob();

            // If we have no password, but do have a blob, login with the blob
            if (password == null && blob != null) {
                Session.LoginWithBlob(_username, blob);
            }

            // Else, login with username / password
            else {

                // No password? Get it from user
                // TODO: what we should do is delay the login and enter password through web interface
                while (String.IsNullOrWhiteSpace(password))
                    password = Microsoft.VisualBasic.Interaction.InputBox("Enter password for Spotify user " + username, "Spotify Credentials");
                
                // Login
                Session.Login(_username, password, true);
            }

        }


        #region Credentials blob stuff


        /// <summary>
        /// Gets the credentials blob from the credentials blob file.
        /// </summary>
        /// <returns>The credentials blob string if found, otherwise null</returns>
        string LoadCredentialsBlob() {
            string credentialsBlob = null;
            string path = GetCredentialsBlobPath();
            try { credentialsBlob = File.Exists(path) ? File.ReadAllText(path) : null; }
            catch(Exception) {}
            return credentialsBlob;
        }


        /// <summary>
        /// Stores the credentials blob in the credentials blob file.
        /// </summary>
        /// <param name="credentialsBlob">The credentials blob to store.</param>
        void SaveCredentialsBlob(string credentialsBlob) {
            try { File.WriteAllText(GetCredentialsBlobPath(), credentialsBlob); }
            catch (Exception) { }
        }


        /// <summary>
        /// Gets the credentials blob path for the current username.
        /// </summary>
        string GetCredentialsBlobPath() {
            return Path.Combine(Spotify.SettingsPath, "Users", String.Format("{0}-user", _username), "blob");
        }


        /// <summary>
        /// The credentials blob data is saved when it has been changed.
        /// </summary>
        void Session_CredentialsBlobUpdated(object sender, CredentialsBlobEventArgs e) {
            SaveCredentialsBlob(e.Blob);
        }


        #endregion


        #region Connection / login callbacks


        /// <summary>
        /// Called when a successfull login has occured.
        /// This method gets called before the connection state is updated and before the corresponding event.
        /// </summary>
        void Session_LoginComplete(object sender, SessionEventArgs e) {
            Log("Login complete. Connection status is " + ((ISession)sender).ConnectionState.ToString());
        }
        

        /// <summary>
        /// Called when a connection error has occured.
        /// This method gets called before the connection state is updated and before the corresponding event.
        /// </summary>
        void Session_ConnectionError(object sender, SessionEventArgs e) {
            Log("Connection error. Connection state: " + ((ISession)sender).ConnectionState.ToString() + ". Error: " + e.Status.ToString());
        }


        /// <summary>
        /// Called when a logout has completed.
        /// This method gets called before the connection state is updated and before the corresponding event.
        /// </summary>
        void Session_LogoutComplete(object sender, SessionEventArgs e) {
            Log("Logged out. Connection state: " + ((ISession)sender).ConnectionState.ToString());
        }


        /// <summary>
        /// Called when the connection state is updated.
        /// </summary>
        void Session_ConnectionStateUpdated(object sender, SessionEventArgs e) {
            Log("Connection state: " + ((ISession)sender).ConnectionState.ToString());

            // TODO: if state is disconnected, we should reconnect
            // If state is loggedOut, logout was forced, so we do nothing
        }

        #endregion



    }

}
