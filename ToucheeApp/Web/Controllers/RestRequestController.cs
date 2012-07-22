using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using HttpServer;
using HttpServer.Sessions;

namespace Touchee.Web.Controllers {

    public abstract class RestRequestController : ICloneable {

        public abstract object Clone();

        string _controllerName;
        public string ControllerName { get {
            if (string.IsNullOrEmpty(_controllerName))
                _controllerName = GetType().Name.Replace("Controller", "").ToUnderscore();
            return _controllerName;
        } }

        protected IRequest Request;
        protected IResponse Response;
        protected Session Session;
        protected Params Params;
        protected Library Library;
        protected Client Client;
        public void SetRequest(IRequest request, IResponse response, Session session, Params parameters, Client client) {
            Request = request;
            Response = response;
            Session = session;
            Params = parameters;
            Client = client;
            Library = Library.Instance;
        }

        public bool TryGetIntParam(string key, out int result) {
            result = 0;
            return Params.ContainsKey(key) ? Int32.TryParse(Params[key].Value, out result) : false;
        }

        public int GetIntParam(string key) {
            var result = 0;
            TryGetIntParam(key, out result);
            return result;
        }

        public string GetStringParam(string key) {
            return Params.ContainsKey(key) ? Params[key].Value : null;
        }

    }

}
