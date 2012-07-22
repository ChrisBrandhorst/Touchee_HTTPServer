using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee.Web.Messages;

namespace Touchee.Web.Controllers {

    public class ServerInfoController : ApplicationController {
        public override object Clone() { return new ServerInfoController(); }
        
        public ServerInfoMessage Index() {
            return Library.ServerInfo();
        }
    }

}
