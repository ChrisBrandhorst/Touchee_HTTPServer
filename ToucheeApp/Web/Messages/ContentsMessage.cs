using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Web.Messages {

    public class ContentsMessage : Message {

        public int ContainerID { get; protected set; }
        public string Type { get; protected set; }
        public string[] Keys { get; protected set; }
        public object Data { get; protected set; }
        public object Meta { get; protected set; }

        public ContentsMessage(Container container, Contents contents) {
            this.ContainerID = container.ID;
            this.Type = contents.Type;
            this.Keys = contents.Keys;
            this.Data = contents.Data;
            this.Meta = contents.Meta;
        }

    }

}
