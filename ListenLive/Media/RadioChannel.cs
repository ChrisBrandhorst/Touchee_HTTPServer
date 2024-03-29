﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee;

namespace ListenLive {

    /// <remarks>
    /// Represents a radio channel from the ListLive.eu site
    /// </remarks>
    public class RadioChannel : Collectable<RadioChannel>, IWebcast, IComparable {


        #region Statics

        /// <summary>
        /// Finds or creates a radio channel with the given name
        /// </summary>
        /// <param name="name">The name of the channel</param>
        /// <param name="genre">The genre of the channel</param>
        /// <param name="website">The website of the channel</param>
        /// <returns>The found or created radio channel</returns>
        public static RadioChannel FindOrCreateByName(string name, string genre, string website) {
            var channel = RadioChannel.FirstOrDefault(c => c.Name == name);
            return channel ?? new RadioChannel(name, genre, website);
        }

        #endregion


        #region Privates

        /// <summary>
        /// The streams which are available for this channel
        /// </summary>
        ISet<StreamInfo> _streams = new SortedSet<StreamInfo>();

        #endregion


        #region Constructors

        /// <summary>
        /// Creates a new RadioChannel object
        /// </summary>
        /// <param name="name">The name of the channel</param>
        /// <param name="genre">The genre of the channel</param>
        /// <param name="website">The website of the channel</param>
        public RadioChannel(string name, string genre, string website) {
            this.Name = name;
            this.SortName = Util.ToSortName(name);
            this.Genre = genre;
            this.Website = website;
        }

        #endregion


        #region IWebCast implementation

        /// <summary>
        /// The title of this stream
        /// </summary>
        public string Name { get; protected set; }

        /// <summary>
        /// The sorted title of this stream
        /// </summary>
        public string SortName { get; protected set; }

        /// <summary>
        /// The genre of this stream
        /// </summary>
        public string Genre { get; protected set; }

        /// <summary>
        /// A string defining the website for this stream
        /// </summary>
        public string Website { get; protected set; }

        /// <summary>
        /// The meta-text for this stream
        /// </summary>
        public string Meta { get; set; }

        /// <summary>
        /// The streams from which this webcast can be streamed
        /// </summary>
        public ISet<StreamInfo> Streams { get { return _streams; } }

        #endregion


        #region IItem implementation

        /// <summary>
        /// The application-wide, unique key string for this item
        /// </summary>
        public string UniqueKey { get { return "radiochannel=" + this.Name; } }

        #endregion


        #region ICompareable implementation

        /// <summary>
        /// Comparetor
        /// </summary>
        public int CompareTo(object obj) {
            return this.SortName.CompareToCustom(((IWebcast)obj).SortName);
        }

        #endregion


    }

}
