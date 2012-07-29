using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.ITunes.Media {

    public class Webcast : Track, IWebcast {

        public string Meta {
            get { return null; }
        }

        public IList<StreamInfo> Streams {
            get { throw new NotImplementedException(); }
        }
    }

}
