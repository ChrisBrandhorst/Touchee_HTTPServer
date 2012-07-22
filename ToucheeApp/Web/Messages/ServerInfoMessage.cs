using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Web.Messages {

    public class ServerInfoMessage : Message {

        public string Name { get; set; }
        public string WelcomeMessage { get; set; }
        public string Hostname { get; set; }
        public int WebsocketPort { get; set; }
        public ArrayList Devices { get; set; }
        public long UtcTime { get; set; }
        public long UtcOffset { get; set; }

    }

}
