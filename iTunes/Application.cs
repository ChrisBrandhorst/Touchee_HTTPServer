using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using System.Runtime.InteropServices;

using System.Diagnostics;
using System.Threading;
using System.IO;

using iTunesLib;

namespace Touchee.ITunes {
    
    /// <remarks>
    /// Contains various usefull functions for the iTunes module
    /// </remarks>
    public static class Application {

        // Storage for the current active COM object
        static iTunesApp _app;


        /// <summary>
        /// Gets whether iTunes is currently running
        /// </summary>
        public static bool IsRunning {
            get {
                Process[] proc = Process.GetProcessesByName("iTunes");
                return proc.Length > 0;
            }
        }


        /// <summary>
        /// Starts iTunes
        /// </summary>
        public static void Start() {
            if (_app == null) {
                Bind();
                Hide();
            }
        }


        /// <summary>
        /// Hides the iTunes windows, if the application is active
        /// </summary>
        public static void Hide() {
            if (_app != null) {
                foreach (IITWindow w in _app.Windows)
                    if (w.Visible) w.Minimized = true;
            }
        }


        /// <summary>
        /// Kills a running iTunes instance, if any
        /// </summary>
        public static void Quit() {
            if (_app != null) {
                _app.Quit();
                UnBind();
            }
        }


        /// <summary>
        /// Create bindings to the iTunes application through a COM object
        /// </summary>
        static void Bind() {
            if (_app == null) {
                Logger.Log("Binding");
                _app = new iTunesApp();
                _app.OnAboutToPromptUserToQuitEvent += () => Quit();
                if (BecameAvailable != null)
                    BecameAvailable.Invoke(new ITunesApplicationEventArgs(_app));
            }
        }


        /// <summary>
        /// Unbind the available COM bindings with the iTunes application
        /// </summary>
        static void UnBind() {
            if (_app != null) {
                Logger.Log("Unbinding");
                if (BecomesUnavailable != null)
                    BecomesUnavailable.Invoke(new ITunesApplicationEventArgs(_app));
                Marshal.FinalReleaseComObject(_app);
                _app = null;
            }
        }
        

        /// <summary>
        /// The path of the XML library file
        /// </summary>
        public static string LibraryXMLPath {
            get {

                // First look at the default location
                string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyMusic), "iTunes", "iTunes Music Library.xml");

                // If the file does not exist at that location, find it by starting and calling iTunes
                if (!File.Exists(path)) {
                    bool runningBefore = _app != null;
                    if (!runningBefore)
                        Start();
                    // Get the path
                    path = _app.LibraryXMLPath;
                    if (!runningBefore)
                        Quit();
                }

                // If that file truely exists, return it
                return File.Exists(path) ? path : null;
            }
        }


        /// <summary>
        /// Gets the string hex value of the given object's persistent ID
        /// </summary>
        /// <param name="iTunesObject">An ITunes object</param>
        /// <returns>The persistent ID as a string hex</returns>
        public static string GetPersistentID(IITObject iTunesObject) {
            if (_app == null)
                throw new ITunesNotRunningException();

            int high, low;
            _app.GetITObjectPersistentIDs(iTunesObject, out high, out low);

            return high.ToString("X") + low.ToString("X");
        }


        
        #region Eventhandlers

        public delegate void ITunesApplicationEventHandler(ITunesApplicationEventArgs e);
        public class ITunesApplicationEventArgs : EventArgs {
            public iTunesApp Application { get; protected set; }
            public ITunesApplicationEventArgs(iTunesApp application) {
                this.Application = application;
            }
        }
        public static event ITunesApplicationEventHandler BecameAvailable;
        public static event ITunesApplicationEventHandler BecomesUnavailable;

        #endregion

        
    }

    public class ITunesNotRunningException : Exception {
        public ITunesNotRunningException() : base() { }
    }


}
