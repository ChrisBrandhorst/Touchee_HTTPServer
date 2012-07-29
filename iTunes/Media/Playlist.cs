using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee;
using System.Xml.Linq;

namespace Touchee.ITunes.Media {

    /// <remarks>
    /// Represents an iTunes playlist
    /// </remarks>
    public class Playlist : Container, IPlaylist {


        #region Statics

        /// <summary>
        /// Builds a new playlist object
        /// </summary>
        /// <param name="medium">The medium the playlist belongs to</param>
        /// <param name="persistentID">The persistent ID of the playlist</param>
        /// <param name="name">The name of the playlist</param>
        /// <param name="trackIDs">List of IDs of tracks which are part of the playlist</param>
        /// <param name="master">Whether the playlist should be a master playlist</param>
        public static Playlist Build(Medium medium, string persistentID, string name, IEnumerable<string> trackIDs, bool master) {
            return master ? new MasterPlaylist(medium, persistentID, name, trackIDs) : new Playlist(medium, persistentID, name, trackIDs);
        }

        /// <summary>
        /// Gets or creates the playlist corresponding to the given parameters
        /// </summary>
        /// <param name="medium">The medium the playlist belongs to</param>
        /// <param name="persistentID">The persistent ID of the playlist</param>
        /// <param name="name">The name of the playlist</param>
        /// <param name="trackIDs">List of IDs of tracks which are part of the playlist</param>
        /// <param name="master">Whether the playlist should be a master playlist</param>
        /// <returns>The corresponding Touchee playlist</returns>
        public static Playlist CreateOrUpdate(Medium medium, string persistentID, string name, IEnumerable<string> trackIDs, bool master) {
            Playlist playlist;
            var newPlaylist = Playlist.Build(medium, persistentID, name, trackIDs, master);

            if (Playlist.ExistsBySourceID(persistentID)) {
                playlist = Playlist.FindBySourceID<Playlist>(persistentID);
                playlist.Update(newPlaylist);
            }
            else {
                playlist = newPlaylist;
                playlist.Save();
            }

            return playlist;
        }


        #endregion


        #region Constructors

        /// <summary>
        /// Base constructor
        /// </summary>
        /// <param name="medium">The medium this playlist belongs to</param>
        public Playlist(Medium medium) : base("Playlist", medium) {
            this.Medium = medium;
        }


        /// <summary>
        /// Constructs a new playlist object
        /// </summary>
        /// <param name="medium">The medium the playlist belongs to</param>
        /// <param name="persistentID">The persistent ID of the playlist</param>
        /// <param name="name">The name of the playlist</param>
        /// <param name="trackIDs">List of IDs of tracks which are part of the playlist</param>
        public Playlist(Medium medium, string persistentID, string name, IEnumerable<string> trackIDs) : this(medium) {
            this.PersistentID = persistentID;
            this.Name = name;
            this.SetTracks(trackIDs.ToList());
        }

        #endregion


        #region Updates

        /// <summary>
        /// Updates the properties for this playlist to match the values of the given object
        /// </summary>
        /// <param name="playlist">The playlist which property values should be copied</param>
        public void Update(Playlist playlist) {
            this.PersistentID = playlist.PersistentID;
            this.Name = playlist.Name;
            this.Tracks = new List<ITrack>(playlist.Tracks);
            this.Save();
        }
        

        /// <summary>
        /// Sets the tracks for this playlist based on a list of track IDs
        /// </summary>
        /// <param name="trackIDs">A list of trackIDs</param>
        void SetTracks(IEnumerable<string> trackIDs) {
            this.Tracks = trackIDs.Select(t => Track.FindBySourceID(t));
        }

        #endregion


        #region Properties

        /// <summary>
        /// The persistend ID of this playlist
        /// </summary>
        public string PersistentID { get; protected set; }

        /// <summary>
        /// The tracks contained in this playlist
        /// </summary>
        public IEnumerable<ITrack> Tracks { get; protected set; }

        #endregion


        #region Overrides

        /// <summary>
        /// Returns the item with the given item ID
        /// </summary>
        /// <param name="itemID">The ID of the item to return</param>
        /// <returns>The item with the given ID, or null if it does not exist</returns>
        public override IItem GetItem(int itemID) {
            return this.Tracks.FirstOrDefault(t => ((Track)t).ID == itemID) as IItem;
        }

        public override object SourceID { get { return PersistentID; } }
        public override string Type { get { return ContainerType.Playlist; } }
        public override string ContentType { get { return ContainerContentType.Music; } }

        #endregion


        /// <summary>
        /// String array containing names of views by which the contents can be viewed
        /// The first view should be the default one
        /// </summary>
        public override string[] ViewTypes { get {
            return new string[]{
                Types.Track
            };
        } }


    }

}
