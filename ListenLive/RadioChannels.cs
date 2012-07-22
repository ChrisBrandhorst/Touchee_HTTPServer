using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee;

namespace ListenLive {

    public class RadioChannels : Container {

        public bool WithArtwork { get; protected set; }
        public IEnumerable<RadioChannel> Channels { get; protected set; }

        public RadioChannels(string name, Medium medium, bool withArtwork) : base(name, medium) {
            this.WithArtwork = withArtwork;
            this.Channels = new SortedSet<RadioChannel>(new RadioChannelsComparer());
        }

        public override int Order { get { return 100; } }
        public override string Type { get { return ContainerType.Radio; } }
        public override string ContentType { get { return ContainerContentType.Music; } }
        public override string[] Views {
            get {
                return WithArtwork
                    ? new string[] { Types.Channel, Types.Genre }
                    : new string[] { Types.Genre };

            }
        }

        public override IItem GetItem(int itemID) {
            return this.Channels.FirstOrDefault(t => ((RadioChannel)t).ID == itemID) as IItem;
        }

        public void Update(IEnumerable<RadioChannel> channels) {
            this.Channels = new SortedSet<RadioChannel>(channels, new RadioChannelsComparer());
        }
        
    }

    public class RadioChannelsComparer : IComparer<RadioChannel> {
        public int Compare(RadioChannel x, RadioChannel y) {
            if (!Util.FirstIsAlpha(x.SortName))
                return 1;
            else if (!Util.FirstIsAlpha(y.SortName))
                return -1;
            else
                return x.SortName.CompareTo(y.SortName);
        }
    }

}
