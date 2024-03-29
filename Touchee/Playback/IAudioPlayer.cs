﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Playback {

    /// <remarks>
    /// Specifies a player which emits audio
    /// </remarks>
    public interface IAudioPlayer : IPlayer {

        // The volume of the LFE channel between and including 0 and 1
        double LFEVolume { get; set; }
    }

}
