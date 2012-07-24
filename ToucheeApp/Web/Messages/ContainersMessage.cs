using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Web.Messages {

    public class ContainersMessage : Message {

        public int MediumID { get; protected set; }
        public readonly List<ContainersMessageItem> Items = new List<ContainersMessageItem>();

        public ContainersMessage(Medium medium) {
            this.MediumID = medium.ID;
        }

        public void Add(Container container) {
            Items.Add(new ContainersMessageItem(container));
        }

        public class ContainersMessageItem {
            public int Id { get; protected set; }
            public string Name { get; protected set; }
            public string Type { get; protected set; }
            public string ContentType { get; protected set; }
            public string Module { get; protected set; }
            public string[] ViewTypes { get; protected set; }
            public ContainersMessageItem(Container container) {
                this.Id = container.ID;
                this.Name = container.Name;
                this.Type = container.Type.ToString();
                this.ContentType = container.ContentType.ToString();
                this.ViewTypes = container.ViewTypes;

                var plugin = Plugins.GetContentsPluginFor(container);
                if (plugin != null && plugin.CustomFrontend)
                    this.Module = plugin.GetType().Assembly.GetName().Name.ToUnderscore();
            }
        }

    }

}
