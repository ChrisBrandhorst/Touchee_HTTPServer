using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee.Web.Messages;

namespace Touchee.Web.Controllers {

    public class ContainersController : ApplicationController {
        public override object Clone() { return new ContainersController(); }

        /// <summary>
        /// Get the list of all containers
        /// </summary>
        /// <returns></returns>
        public ContainersMessage Index() {
            int media_id = GetIntParam("media_id");
            if (media_id == 0) return null;

            var medium = Medium.Find(media_id);
            return Library.Containers(medium);
        }


        /// <summary>
        /// Gets the contents of the given container
        /// </summary>
        /// <returns></returns>
        public ContentsMessage Contents() {
            int containers_id = GetIntParam("containers_id");
            if (containers_id == 0) return null;
            var container = Container.Find(containers_id);

            return Library.Contents(
                container,
                Filter.Build( GetStringParam("filter") )
            );
        }



    }

}