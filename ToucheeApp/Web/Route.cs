using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Web {

    public class Route {

        public string Controller { get; protected set; }
        public string Action { get; protected set; }
        protected string Pattern { get; set; }

        public Route(string pattern, string controller) : this(pattern, controller, null) { }
        public Route(string pattern, string controller, string action) {
            Pattern = pattern;
            Controller = controller;
            Action = action;
        }

        public bool Match(Uri uri) {
            return false;
        }

    }
}

