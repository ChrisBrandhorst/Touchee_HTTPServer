using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.ITunes.Media {
    
    public class MasterPlaylist : Playlist {

        public MasterPlaylist(Medium medium) : base(medium) { }
        public MasterPlaylist(Medium medium, string persistentID, string name, IEnumerable<string> trackIDs) : base(medium, persistentID, name, trackIDs) { }

        public override int Order { get { return 0; } }
        public override string Type { get { return ContainerType.Master; } }

        /// <summary>
        /// String array containing names of views by which the contents can be viewed
        /// The first view should be the default one
        /// </summary>
        public override string[] ViewTypes {
            get {
                return new string[]{
                    Types.Track,
                    Types.Artist,
                    Types.Album,
                    Types.Genre
                };
            }
        }

    }

}
