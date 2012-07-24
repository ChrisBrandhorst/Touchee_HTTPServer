using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Dynamic;

using Touchee.ITunes.Media;

namespace Touchee.ITunes {

    public class Controller {


        /// <summary>
        /// The available track sort styles
        /// </summary>
        public enum TrackSortStyle {
            None,
            Name,
            Album
        }


        /// <summary>
        /// Gets the items collection for the given parameters
        /// </summary>
        /// <param name="container">The container for which the items should be retreived</param>
        /// <param name="view">How to view the results</param>
        /// <param name="query">The filter object</param>
        /// <returns>The results</returns>
        public IEnumerable<IItem> GetItems(IContainer container, Filter filter) {
            var tracks = GetTracks(container, filter);
            return tracks == null ? null : tracks.Cast<IItem>();
        }


        /// <summary>
        /// Gets the contents object for the given parameters
        /// </summary>
        /// <param name="container">The container for which the contents should be retreived</param>
        /// <param name="view">How to view the results</param>
        /// <param name="query">The filter object</param>
        /// <returns>The results</returns>
        public Contents GetContents(IContainer container, Filter filter) {
            var tracks = GetTracks(container, filter);
            if (tracks == null) return null;
            var playlist = (Playlist)container;
            return BuildContents(tracks, filter, playlist);
        }


        /// <summary>
        /// Gets the tracks collection for the given parameters
        /// </summary>
        /// <param name="container">The container for which the tracks should be retreived</param>
        /// <param name="view">How to view the results</param>
        /// <param name="query">The filter object</param>
        /// <returns>The results</returns>
        IEnumerable<ITrack> GetTracks(IContainer container, Filter filter) {

            // Check if we have a playlist, just to be sure
            if (!(container is Playlist)) return null;

            // Get playlist
            var playlist = (Playlist)container;

            // Get all tracks
            var tracks = playlist.Tracks;

            // Filter tracks
            tracks = FilterTracks(tracks, filter);

            // Return tracks
            return tracks;
        }


        /// <summary>
        /// Filters the given collection of tracks by the given filter
        /// </summary>
        /// <param name="tracks">The tracks to filter</param>
        /// <param name="filter">The filter to use</param>
        /// <returns>A IEnumerable of filtered tracks</returns>
        IEnumerable<ITrack> FilterTracks(IEnumerable<ITrack> tracks, Filter filter) {

            foreach (var key in filter.Keys) {
                var value = filter[key];

                switch (key) {

                    case "album":
                        tracks = tracks.Where(t => Util.Equals(t.Album, value, true));
                        break;
                        
                    case "artist":
                        tracks = value == "" ? tracks.Where(t => t.Album != null) : tracks.Where(t => Util.Equals(t.AlbumArtist, value));
                        break;

                    case "genre":
                        tracks = tracks.Where(t => Util.Equals(t.Genre, value, true));
                        break;

                    case "query":
                        tracks = tracks.Where(t => t.Album.Matches(value) || t.Artist.Matches(value) || t.Name.Matches(value));
                        break;

                    case "albumid":
                        tracks = tracks.Where(t => t.AlbumID == value);
                        break;
                }
            }
        
            return tracks;
        }


        /// <summary>
        /// Builds the contents object
        /// </summary>
        /// <param name="tracks">The tracks source</param>
        /// <param name="filter">The request filter</param>
        /// <param name="playlist">The playlist the tracks are sources from</param>
        /// <returns>A filled contents object</returns>
        Contents BuildContents(IEnumerable<ITrack> tracks, Filter filter, Playlist playlist) {

            // Get type
            var type = (filter.ContainsKey("type") ? filter["type"] : playlist.ViewTypes.FirstOrDefault()) ?? Types.Track;

            // Create contents instance
            var contents = new Contents(playlist);

            // Set meta data
            dynamic meta = new ExpandoObject();
            contents.Meta = meta;
            meta.Shuffable = type == Types.Track;
            meta.SortedByAlpha = playlist is MasterPlaylist;

            // Get the data for the given type
            switch(type) {
                case Types.Track:
                    bool getAlbum = filter.ContainsKey("albumid");

                    var sortStyle = TrackSortStyle.None;
                    if (getAlbum || filter.ContainsKey("artist"))
                        sortStyle = TrackSortStyle.Album;
                    else if (playlist is MasterPlaylist)
                        sortStyle = TrackSortStyle.Name;

                    contents.Data = GetTracksData(tracks, sortStyle);
                    contents.Keys = new string[] { "id", "name", "artist", "album", "albumArtist", "number", "duration", "index" };
                    if (getAlbum) {
                        meta.Albumid = filter["albumid"];
                        //meta.TotalDuration = tracks.Aggregate<ITrack, TimeSpan>(new TimeSpan(0), (total, t) => total + t.Duration).ToStringShort();
                    }
                    break;
                case Types.Album:
                    contents.Data = GetAlbumsData(tracks);
                    contents.Keys = new string[] { "id", "album", "artist", "artworkid", "index" };
                    break;
                case Types.Artist:
                    contents.Data = GetArtistsData(tracks);
                    contents.Keys = new string[] { "artist", "albums", "tracks", "index" };
                    break;
                case Types.Genre:
                    contents.Data = GetGenresData(tracks);
                    contents.Keys = new string[] { "genre", "index" };
                    break;
            }

            return contents;
        }


        /// <summary>
        /// Sorts the given tracks by track name
        /// </summary>
        /// <param name="tracks">The tracks to sort</param>
        /// <returns>The sorted tracks</returns>
        IEnumerable<ITrack> SortTracksByName(IEnumerable<ITrack> tracks) {
            return tracks
                .OrderBy(t => t.SortName == null)
                .ThenBy(t => !Util.FirstIsAlpha(t.SortName))
                .ThenBy(t => t.SortName);
        }


        /// <summary>
        /// Sorts the given tracks by album
        /// </summary>
        /// <param name="tracks">The tracks to sort</param>
        /// <returns>The sorted tracks</returns>
        IEnumerable<ITrack> SortTracksByAlbum(IEnumerable<ITrack> tracks) {
            return tracks
                .OrderBy(t => t.SortAlbum == null)
                .ThenBy(t => !Util.FirstIsAlpha(t.SortAlbum))
                .ThenBy(t => t.SortAlbum)
                .ThenBy(t => t.SortAlbumArtist == null)
                .ThenBy(t => t.SortAlbumArtist)
                .ThenBy(t => t.DiscNumber == 0)
                .ThenBy(t => t.DiscNumber)
                .ThenBy(t => t.TrackNumber == 0)
                .ThenBy(t => t.TrackNumber);
        }


        /// <summary>
        /// Retrieves an array of track data (id, name, artist, album, duration, index) for the given track set.
        /// The result is sorted by name of the track.
        /// </summary>
        /// <param name="tracks">The tracks source</param>
        /// <param name="sort">The sort type</param>
        /// <returns>An array of track data</returns>
        object GetTracksData(IEnumerable<ITrack> tracks, TrackSortStyle sortStyle) {
            switch (sortStyle) {
                case TrackSortStyle.Album:  tracks = SortTracksByAlbum(tracks); break;
                case TrackSortStyle.Name:   tracks = SortTracksByName(tracks);  break;
            }
            return tracks
                .Select(t => new object[]{
                    ((Collectable<Track>)t).ID,
                    t.Name,
                    t.Artist,
                    t.Album,
                    t.AlbumArtist,
                    t.TrackNumber,
                    t.Duration.ToStringShort(),
                    Util.GetIndex(sortStyle == TrackSortStyle.Album ? t.SortAlbum : t.SortName)
                });
        }


        /// <summary>
        /// Retrieves an array of album data (name, album artist, index) for the given track set
        /// </summary>
        /// <param name="tracks">The tracks source</param>
        /// <returns>An array of album data</returns>
        object GetAlbumsData(IEnumerable<ITrack> tracks) {
            var tracksList = tracks
                .OrderBy(t => t.SortAlbum == null)
                .ThenBy(t => !Util.FirstIsAlpha(t.SortAlbum))
                .ThenBy(t => t.SortAlbum)
                .ThenBy(t => t.SortAlbumArtist == null)
                .ThenBy(t => t.SortAlbumArtist);

            var albumsData = new List<object[]>();
            string album = "null", albumArtist = "null";
            foreach (var t in tracksList) {
                if (t.Album != album || t.AlbumArtist != albumArtist) {
                    album = t.Album;
                    albumArtist = t.AlbumArtist;
                    albumsData.Add(new object[] {
                        t.AlbumID,
                        t.Album,
                        t.AlbumArtist,
                        ((Collectable<Track>)t).ID,
                        Util.GetIndex(t.SortAlbum)
                    });
                }
            }

            return albumsData;
        }


        /// <summary>
        /// Retrieves an array of artist data (name, album count, track count, index) for the given track set
        /// </summary>
        /// <param name="tracks">The tracks source</param>
        /// <returns>An array of artist data</returns>
        object GetArtistsData(IEnumerable<ITrack> tracks) {
            var tracksList = tracks
                .OrderBy(t => t.SortAlbumArtist == null)
                .ThenBy(t => !Util.FirstIsAlpha(t.SortAlbumArtist))
                .ThenBy(t => t.SortAlbumArtist)
                .ThenBy(t => t.SortAlbum == null)
                .ThenBy(t => t.SortAlbum);

            var artistsData = new List<object[]>();
            string artist = "null", album = "null";
            int trackCount = 0, albumCount = 0;
            object[] artistData = null;
            foreach (var t in tracksList) {

                if (!Util.Equals(t.AlbumArtist, artist)) {
                    trackCount = 0;
                    albumCount = 0;
                    artist = t.AlbumArtist;
                    album = "null";
                    artistData = new object[]{
                        t.AlbumArtist,
                        albumCount,
                        trackCount,
                        Util.GetIndex(t.SortAlbumArtist)
                    };
                    artistsData.Add(artistData);
                }

                if (t.Album != album) {
                    albumCount += 1;
                    album = t.Album;
                    artistData[1] = albumCount;
                }

                trackCount += 1;
                artistData[2] = trackCount;
            }

            return artistsData;
        }


        /// <summary>
        /// Retrieves an array of genre data (name) for the given track set
        /// </summary>
        /// <param name="tracks">The tracks source</param>
        /// <returns>An array of genre data</returns>
        object GetGenresData(IEnumerable<ITrack> tracks) {
            return tracks
                .Select(t => t.Genre)
                .Distinct()
                .Where(t => t != null)
                .Select(g =>
                    new Tuple<string, string>(g, g.ToSortName())
                )
                .OrderBy(g => !Util.FirstIsAlpha(g.Item2))
                .ThenBy(g => g.Item2)
                .Select(g =>
                    new string[]{ g.Item1, Util.GetIndex(g.Item2) }
                );
        }


    }

}
