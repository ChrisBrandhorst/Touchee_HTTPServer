using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee {

    public enum StreamEncoding {
        MP3,
        HEAAC,
        WindowsMedia
    }

    public class StreamInfo {
        public string Location { get; protected set; }
        public StreamEncoding Encoding { get; protected set; }
        public StreamInfo(string location, StreamEncoding encoding) {
            this.Location = location;
            this.Encoding = encoding;
        }
    }

}
