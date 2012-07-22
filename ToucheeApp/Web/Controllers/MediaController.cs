using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee.Web.Messages;

namespace Touchee.Web.Controllers {

    public class MediaController : ApplicationController {
        public override object Clone() { return new MediaController(); }

        public Message Index() {
            return Library.Media();
        }

    }

}