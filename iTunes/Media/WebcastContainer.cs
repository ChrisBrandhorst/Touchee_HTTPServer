using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.ITunes.Media {

    /// <remarks>
    /// A container for webcasts imported from iTunes
    /// </remarks>
    public class WebcastContainer : Container {


        #region Properties

        /// <summary>
        /// The webcasts in this container
        /// </summary>
        public IEnumerable<Webcast> Webcasts { get; protected set; }

        #endregion


        #region Overridden properties from Container

        /// <summary>
        /// The type of the container, e.g. what the container 'looks like'
        /// </summary>
        public override string Type { get { return ContainerType.Radio; } }

        /// <summary>
        /// The content type of the container, e.g. what kind of items reside inside this container
        /// </summary>
        public override string ContentType { get { return ContainerContentType.Music; } }

        /// <summary>
        /// String array containing names of views by which the contents can be viewed
        /// </summary>
        public override string[] ViewTypes {
            get {
                return new string[] { Types.Webcast };
            }
        }

        #endregion


        #region Constructors

        /// <summary>
        /// Constructs a new webcast container
        /// </summary>
        /// <param name="name">The name of the container</param>
        /// <param name="medium">The medium this container came from</param>
        public WebcastContainer(string name, Medium medium) : base(name, medium) {
            this.Webcasts = new SortedSet<Webcast>();
        }

        #endregion


        #region Public methods

        /// <summary>
        /// Returns the item with the given item ID
        /// </summary>
        /// <param name="itemID">The ID of the item to return</param>
        /// <returns>The item with the given ID, or null if it does not exist</returns>
        public override IItem GetItem(int itemID) {
            return this.Webcasts.FirstOrDefault(t => ((IItem)t).ID == itemID) as IItem;
        }


        /// <summary>
        /// Updates the list of webcasts with the given collection
        /// </summary>
        /// <param name="channels">The new set of webcasts</param>
        public void Update(IEnumerable<Webcast> channels) {
            this.Webcasts = new SortedSet<Webcast>(channels);
        }

        #endregion



    }

}
