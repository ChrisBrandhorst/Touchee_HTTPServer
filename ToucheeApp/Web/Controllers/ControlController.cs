using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee.Playback;

namespace Touchee.Web.Controllers {

    public class ControlController : ApplicationController {
        public override object Clone() { return new ControlController(); }


        /// <summary>
        /// Plays the given item
        /// </summary>
        public void Play() {

            // Get container or queue
            int containerID = GetIntParam("container");

            // If we have a container ID
            if (containerID > 0) {

                // Get container
                if (!Container.Exists(containerID)) return;
                var container = Container.Find(containerID);

                // Build the filter
                var filter = Options.Build(GetStringParam("filter"));

                // Play it
                Library.Play(container, filter);
            }
            
            // Else, do queue action
            else {
                var queue = GetQueue();
                if (queue != null)
                    Library.Play(queue);
            }

            // TODO: no params --> command on all queues
        }



        public void Prev() {
            var queue = GetQueue();
            if (queue != null)
                Library.Prev(queue);
        }


        public void Next() {
            var queue = GetQueue();
            if (queue != null)
                Library.Next(queue);
        }


        public void Pause() {
            var queue = GetQueue();
            if (queue != null)
                Library.Pause(queue);
        }


        Queue GetQueue() {
            int queueID = GetIntParam("queue");
            if (!(queueID > 0)) return null;
            return Queue.Exists(queueID) ? Queue.Find(queueID) : null;
        }


    }

}
