using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee {

    public interface IMediumWatcher {
        bool Watch(Medium medium);
        bool UnWatch(Medium medium);
    }

}
