using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Web.Controllers {

    public class ControlController : ApplicationController {
        public override object Clone() { return new ControlController(); }


        /// <summary>
        /// Plays the given item
        /// </summary>
        public void Play() {

            var filter = Filter.Build(GetStringParam("filter"));

            int containers_id = GetIntParam("container");
            if (containers_id == 0) return;
            var container = Container.Find(containers_id);
;

        }


    }

}
