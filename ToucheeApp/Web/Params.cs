using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using HttpServer;

namespace Touchee.Web {
    public class Params {

        protected Dictionary<string, IParameter> _params = new Dictionary<string, IParameter>();
        public Params() { }
        public Params(IParameterCollection parameters) {
            foreach (var item in parameters)
                _params[item.Name] = item;
        }

        public bool ContainsKey(string key) {
            return _params.ContainsKey(key);
        }
        public IParameter this[string key] {
            get {
                return _params[key];
            }
            set {
                _params[key] = value;
            }
        }
        public void Set(string key, string value) {
            _params[key] = new Parameter(key, value);
        }
        public void Each(Action<IParameter> action) {
            foreach(var item in _params)
                action(item.Value);
        }

    }
}
