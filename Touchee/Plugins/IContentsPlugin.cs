using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using System.Drawing;
using Touchee.Artwork;

namespace Touchee {

    public interface IContentsPlugin {
        bool CustomFrontend { get; }
        IEnumerable<IItem> GetItems(IContainer container, string type, Filter filter);
        Contents GetContents(IContainer container, string type, Filter filter);
        ArtworkStatus GetArtwork(IContainer container, IItem item, out Image artwork);
        ArtworkStatus GetArtwork(IContainer container, Filter filter, out Image artwork);
    }

}
