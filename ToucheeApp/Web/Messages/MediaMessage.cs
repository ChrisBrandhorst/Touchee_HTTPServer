using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Web.Messages {

    public class MediaMessage : Message {
        
        public readonly List<MediaMessageItem> Items = new List<MediaMessageItem>();

        public void Add(Medium medium) {
            Items.Add(new MediaMessageItem(medium));
        }

        public class MediaMessageItem {
            public int Id { get; protected set; }
            public string Name { get; protected set; }
            public string Type { get; protected set; }
            public MediaMessageItem(Medium medium) {
                this.Id = medium.ID;
                this.Name = medium.Name;
                this.Type = medium.Type.ToString();
            }
        }

    }

}
