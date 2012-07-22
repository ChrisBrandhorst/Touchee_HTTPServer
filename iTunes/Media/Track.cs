using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee;
using System.Xml.Linq;

namespace Touchee.ITunes.Media {

    /// <remarks>
    /// Represents an iTUnes track
    /// </remarks>
    public abstract class Track : Collectable<Track>, ITrack, IItem {


        #region Statics

        /// <summary>
        /// Create a track (file or url) based on a track node from the iTunes Library.
        /// </summary>
        /// <param name="libraryTrackNode">The XML node containing the data for the track</param>
        /// <returns>The created track</returns>
        public static Track Build(XElement libraryTrackNode) {
            
            // Check the type of the track
            var trackType = (string)libraryTrackNode.Elements("key").First(e => (string)e == "Track Type").ElementsAfterSelf().First();

            // Instantiate track based on type
            Track track;
            switch (trackType) {
                case "File":
                    track = new FileTrack();
                    break;
                case "URL":
                    track = new URLTrack();
                    break;
                default:
                    return null;
            }

            // Set the properties
            var childNodes = libraryTrackNode.Elements().ToList();
            var type = typeof(Track);
            for (int i = 0; i < childNodes.Count(); i += 2) {
                var key = childNodes[i].Value.Replace(" ", "");
                var prop = type.GetProperty(key);
                if (prop != null) {
                    var propType = prop.PropertyType;
                    if (propType == typeof(Int32))
                        prop.SetValue(track, (int)childNodes[i + 1], null);
                    else if (propType == typeof(string))
                        prop.SetValue(track, (string)childNodes[i + 1], null);
                }
            }

            return track;
        }


        /// <summary>
        /// Gets or creates a track
        /// </summary>
        /// <param name="persistentID">The persistent ID of the track to build</param>
        /// <param name="libraryTrackNode">The XML data for the track</param>
        /// <returns>The corresponding Touchee track</returns>
        public static Track CreateOrUpdate(string persistentID, XElement libraryTrackNode) {
            Track track;
            var newTrack = Track.Build(libraryTrackNode);
            if (newTrack == null)
                return null;

            if (Track.ExistsBySourceID<Track>(persistentID)) {
                track = Track.FindBySourceID<Track>(persistentID);
                track.Update(newTrack);
            }
            else {
                track = newTrack;
                track.Save();
            }

            return track;
        }

        #endregion


        #region Updates

        /// <summary>
        /// Updates the properties for this track to match the values of the given object
        /// </summary>
        /// <param name="track">The track which property values should be copied</param>
        public void Update(Track track) {
            this.TrackID = track.TrackID;
            this.PersistentID = track.PersistentID;
            this.Name = track.Name;
            this.Artist = track.Artist;
            this.Album = track.Album;
            this.AlbumArtist = track.AlbumArtist;
            this.Duration = track.Duration;
            this.TrackNumber = track.TrackNumber;
            this.DiscNumber = track.DiscNumber;
            this.Genre = track.Genre;
            this.Year = track.Year;
            this.Rating = track.Rating;
            this.Location = track.Location;
            this.Save();
        }

        #endregion
        

        #region Properties

        public int TrackID { get; protected set; }
        public string PersistentID { get; protected set; }
        public string Name { get; protected set; }
        public string Artist { get; protected set; }
        public string Album { get; protected set; }
        public int TrackNumber { get; protected set; }
        public int DiscNumber { get; protected set; }
        public string Genre { get; protected set; }
        public int Year { get; protected set; }
        public int Rating { get; protected set; }
        public string Location { get; protected set; }

        public string _albumArtist;
        public string AlbumArtist {
            get { return _albumArtist ?? Artist; }
            set { _albumArtist = value; }
        }

        string _sortName = "";
        public string SortName {
            get {
                if (_sortName == "") _sortName = Util.ToSortName(Name);
                return _sortName;
            }
            set { _sortName = String.IsNullOrWhiteSpace(value) ? null : value; }
        }
        string _sortArtist = "";
        public string SortArtist {
            get {
                if (_sortArtist == "") _sortArtist = Util.ToSortName(Artist);
                return _sortArtist;
            }
            set { _sortArtist = String.IsNullOrWhiteSpace(value) ? null : value; }
        }
        string _sortAlbum = "";
        public string SortAlbum {
            get {
                if (_sortAlbum == "") _sortAlbum = Util.ToSortName(Album);
                return _sortAlbum;
            }
            set { _sortAlbum = String.IsNullOrWhiteSpace(value) ? null : value; }
        }
        string _sortAlbumArtist = "";
        public string SortAlbumArtist {
            get {
                if (_sortAlbumArtist == "") _sortAlbumArtist = Util.ToSortName(AlbumArtist);
                return _sortAlbumArtist;
            }
            set { _sortAlbumArtist = String.IsNullOrWhiteSpace(value) ? null : value; }
        }
        string _sortGenre = "";
        public string SortGenre {
            get {
                if (_sortGenre == "") _sortGenre = Util.ToSortName(Genre);
                return _sortGenre;
            }
            set { _sortGenre = String.IsNullOrWhiteSpace(value) ? null : value; }
        }

        int _totalTime;
        public int TotalTime { set {
            _totalTime = value;
            Duration = TimeSpan.FromMilliseconds(value);
        } }
        public TimeSpan Duration { get; protected set; }

        #endregion 
        

        #region Overrides

        public override object SourceID { get { return PersistentID; } }

        #endregion


        /// <summary>
        /// The album ID of the track (combination of artist and album name)
        /// </summary>
        public string AlbumID { get {
            return (this.AlbumArtist + "=" + this.Album).GetInt64HashCode();
        } }


        #region IItem implementation

        /// <summary>
        /// The application-wide, unique key string for this item
        /// </summary>
        public string UniqueKey { get { return this.PersistentID; } }


        #endregion


    }

}