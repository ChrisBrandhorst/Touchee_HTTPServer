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

            // Container id
            int containers_id = GetIntParam("container");

            // No params? Do unpause
            if (containers_id == 0) {
                Library.Play();
                return;
            }

            // Check container id
            if (!Container.Exists(containers_id)) return;

            // Get container
            var container = Container.Find(containers_id);

            // Build the filter
            var filter = Filter.Build(GetStringParam("filter"));

            // Play it
            Library.Play(container, filter);
        }



        public void Prev() {
            Library.Prev();
        }


        public void Next() {
            Library.Next();
        }


        public void Pause() {
            Library.Pause();
        }
        




    }

}
