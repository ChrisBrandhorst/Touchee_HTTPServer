using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using System.IO;

using Un4seen.Bass;
using Un4seen.Bass.AddOn.Tags;
using Un4seen.Bass.AddOn.Mix;

namespace Touchee.Playback {
    
    /// <remarks>
    /// 
    /// </remarks>
    public class BassNetPlayer : Base, IImagePlayer, IPlugin {


        #region IPlugin implementation

        
        /// <summary>
        /// The name of this plugin
        /// </summary>
        public string Name { get { return "BASS.NET audio player"; } }


        /// <summary>
        /// Starts the plugin.
        /// </summary>
        /// <param name="config">The configuration object for this plugin</param>
        /// <returns>Always true</returns>
        public bool Start(dynamic config) {
            Bass.BASS_SetConfig(BASSConfig.BASS_CONFIG_NET_PLAYLIST, 1);
            Bass.BASS_PluginLoadDirectory("plugins\\bass");
            Bass.BASS_Init(-1, 44100, BASSInit.BASS_DEVICE_DEFAULT, IntPtr.Zero);
            return true;
        }


        /// <summary>
        /// Shuts down the plugin.
        /// </summary>
        /// <returns>True</returns>
        public bool Shutdown() {
            return true;
        }


        #endregion


        #region IPlayer implementation


        /// <summary>
        /// The item that is being played
        /// </summary>
        public IItem Item { get; protected set; }


        /// <summary>
        /// Returns whether this player can play the given item
        /// </summary>
        /// <param name="item">The item to play</param>
        /// <returns>True if the player can play the given item, otherwise false</returns>
        public bool CanPlay(IItem item) {
            return item is IFileTrack || item is IWebcast;
        }


        /// <summary>
        /// Plays the given item
        /// </summary>
        /// <param name="item">The item to play</param>
        public void Play(IItem item) {
            
            // Stop playing current stream
            //this.Stop();
            
            // Create stream
            this.CreateStream(item);

            //
            this.Item = item;
        }


        /// <summary>
        /// Pauses the current playback
        /// </summary>
        public void Pause() {
            Bass.BASS_Pause();
        }


        /// <summary>
        /// Resums playback if paused
        /// </summary>
        public void Play() {
            Bass.BASS_Start();
        }


        /// <summary>
        /// Stop the current playback
        /// </summary>
        public void Stop() {
            Bass.BASS_ChannelStop(_mixer);
            BassMix.BASS_Mixer_ChannelRemove(_currentStream);
            Bass.BASS_Stop();
            Bass.BASS_StreamFree(_currentStream);
            Bass.BASS_StreamFree(_mixer);
            _currentStream = -1;
            _mixer = -1;
        }


        /// <summary>
        /// Called when playback of the current item is finished
        /// </summary>
        public event PlayerPlaybackFinished PlaybackFinished;


        /// <summary>
        /// Called when the status of the player is updated
        /// </summary>
        public event PlayerStatusUpdated StatusUpdated;


        #endregion





        int _currentStream = -1;
        int _mixer = -1;
        SYNCPROC _channelEndCallback;




        protected virtual void CreateStream(IItem track) {
            int stream = 0;

            if (track is IWebcast) {

                var streams = ((IWebcast)track).Streams;
                foreach (var si in streams) {
                    var url = si.Uri.ToString();
                    stream = Bass.BASS_StreamCreateURL(url, 0, BASSFlag.BASS_STREAM_STATUS | BASSFlag.BASS_STREAM_DECODE | BASSFlag.BASS_SAMPLE_FLOAT, null, IntPtr.Zero);
                    Log(Bass.BASS_ErrorGetCode().ToString());
                    if (stream != 0) {
                        Un4seen.Bass.AddOn.Tags.TAG_INFO tagInfo = new TAG_INFO(url);
                        if (BassTags.BASS_TAG_GetFromURL(stream, tagInfo)) {
                            // display the tags...
                        }
                        break;
                    }
                }

            }

            else if (track is IFileTrack) {
                var path = Path.GetFullPath(((ITrack)track).Uri.GetComponents(UriComponents.Path, UriFormat.SafeUnescaped));
                stream = Bass.BASS_StreamCreateFile(path, 0, 0, BASSFlag.BASS_STREAM_STATUS | BASSFlag.BASS_STREAM_DECODE | BASSFlag.BASS_SAMPLE_FLOAT);
            }
            
            if (stream != 0)
                this.StreamCreated(track, stream);
        }


        protected virtual void StreamCreated(IItem track, int stream) {

            // Init mixer
            if (_mixer == -1) {
                _mixer = BassMix.BASS_Mixer_StreamCreate(44100, 2, BASSFlag.BASS_MIXER_END);
                
                // Set playback done callback on mixer
                _channelEndCallback = new SYNCPROC(ChannelEnd);
                Bass.BASS_ChannelSetSync(_mixer, BASSSync.BASS_SYNC_END | BASSSync.BASS_SYNC_MIXTIME, 0, _channelEndCallback, IntPtr.Zero);
            }

            // Load streamin mixer
            bool ok = BassMix.BASS_Mixer_StreamAddChannel(_mixer, stream, BASSFlag.BASS_STREAM_AUTOFREE);
            if (!ok) Log(Bass.BASS_ErrorGetCode().ToString(), Logger.LogLevel.Error);

            // Remove current channel from mixer
            if (_currentStream != -1) {
                BassMix.BASS_Mixer_ChannelRemove(_currentStream);
                Bass.BASS_StreamFree(_currentStream);
            }

            // 
            if (track is IWebcast) {
                SYNCPROC _mySync = new SYNCPROC(MetaSync);
                Bass.BASS_ChannelSetSync(_currentStream, BASSSync.BASS_SYNC_META, 0, _mySync, IntPtr.Zero);
            }

            // Play it!
            Bass.BASS_ChannelSetPosition(_mixer, 0);
            Bass.BASS_Start();
            Bass.BASS_ChannelPlay(_mixer, false);

            // Set current stuff
            _currentStream = stream;
        }


        void ChannelEnd(int handle, int channel, int data, IntPtr user) {
            if (PlaybackFinished != null)
                PlaybackFinished.Invoke(this, this.Item);
        }


        void MetaSync(int handle, int channel, int data, IntPtr user) {
            string[] tags = Bass.BASS_ChannelGetTagsMETA(channel);
            foreach (string tag in tags)
                Console.WriteLine(tag);
        }


    }



}
