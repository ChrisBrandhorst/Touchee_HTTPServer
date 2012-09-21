using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

using HttpServer;
using HttpServer.Modules;
using HttpServer.Messages;
using HttpServer.Sessions;

using Touchee.Web.Controllers;

namespace Touchee.Web.Modules {

    /// <summary>
    /// A controller module is a part of the ModelViewController design pattern.
    /// It gives you a way to create user friendly URLs.
    /// </summary>
    /// <remarks>
    /// The controller module uses the flyweight pattern which means that
    /// the memory usage will continue to increase until the module have
    /// enough objects in memory to serve all concurrent requests. The objects
    /// are reused and will not be freed.
    /// </remarks>
    /// <example>
    /// <code>
    /// ControllerModule module = new ControllerModule();
    /// module.Add(new UserController());
    /// module.Add(new SearchController());
    /// myWebsite.Add(module);
    /// </code>
    /// </example>
    public class RestControllerModule : IModule {

        #region class RestControllerContext
        private class RestControllerContext {
            public readonly Queue<RestRequestController> _queue = new Queue<RestRequestController>();
            private readonly RestRequestController _prototype;

            /// <summary>
            /// Initializes a new instance of the <see cref="RestControllerContext"/> class.
            /// </summary>
            /// <param name="prototype">A controller used to handle certain URLs. Will be cloned for each parallel request.</param>
            public RestControllerContext(RestRequestController prototype) {
                _prototype = prototype;
            }

            /// <summary>
            /// Prototype controller used for cloning.
            /// </summary>
            /// <value>The prototype.</value>
            public RestRequestController Prototype {
                get { return _prototype; }
            }

            /// <summary>
            /// Retrieve a previously created controller (or a new one if none exist).
            /// </summary>
            /// <returns></returns>
            public RestRequestController Pop() {
                lock (_queue) {
                    if (_queue.Count == 0)
                        return (RestRequestController)_prototype.Clone();
                    return _queue.Dequeue();
                }
            }

            /// <summary>
            /// Add a controller
            /// </summary>
            /// <param name="controller"></param>
            public void Push(RestRequestController controller) {
                lock (_queue) {
                    _queue.Enqueue(controller);
                }
            }
        }
        #endregion

        private readonly Dictionary<string, RestControllerContext> _controllers = new Dictionary<string, RestControllerContext>(StringComparer.CurrentCultureIgnoreCase);
        private readonly List<Route> _routes = new List<Route>();

        /// <summary>
        /// The controller module uses the prototype design pattern
        /// to be able to create new controller objects for requests
        /// if the stack is empty.
        /// </summary>
        /// <param name="prototype">A prototype which will be cloned for each request</param>
        /// <exception cref="ArgumentNullException"></exception>
        /// <exception cref="InvalidProgramException">If a controller with that name have been added already.</exception>
        /// <exception cref="InvalidOperationException">A controller with the same name exists.</exception>
        public void Add(RestRequestController prototype) {
            lock (_controllers) {
                if (_controllers.ContainsKey(prototype.ControllerName))
                    throw new InvalidOperationException("Controller with name '" + prototype.ControllerName + "' already exists.");

                _controllers.Add(prototype.ControllerName, new RestControllerContext(prototype));
            }
        }

        /// <summary>
        /// Get a prototype
        /// </summary>
        /// <param name="controllerName">in lowercase, without "Controller"</param>
        /// <returns>The controller if found; otherwise null.</returns>
        /// <example>
        /// <code>
        /// //fetches the class UserController
        /// RequestController userController = controllerModule["user"]; 
        /// </code>
        /// </example>
        public RestRequestController this[string controllerName] {
            get {
                if (string.IsNullOrEmpty(controllerName))
                    return null;

                lock (_controllers) {
                    if (_controllers.ContainsKey(controllerName))
                        return _controllers[controllerName].Prototype;
                    return null;
                }
            }
        }

        /// <summary>
        /// Adds a new route to the module
        /// </summary>
        /// <param name="route">A route</param>
        /// <exception cref="ArgumentNullException"></exception>
        public void Add(Route route) {
            _routes.Add(route);
        }




        /// <summary>
        /// Method that process the incoming request.
        /// </summary>
        /// <param name="context">Request context (contains request, response, HttpContext)</param>
        public ProcessingResult Process(RequestContext context) {

            // Get some vars
            var request = context.Request;
            var response = context.Response;
            var httpContext = context.HttpContext;
            string[] segments = request.Uri.GetSegments();

            // No segments? Do not process
            if (segments.Length == 0)
                return ProcessingResult.Continue;
            
            // Init more vars
            string controllerName = "";
            string actionName = "";
            RestRequestController controller = null;
            RestControllerContext controllerContext = null;
            int id = 0;
            Client client = null;
            Session session = null;

            // Set cookie and client
            var sessionCookie = request.Cookies.FirstOrDefault(c => c.Name == "ToucheeSession");
            if (sessionCookie == null) {
                session = new Session();
                //sessionStore.Save(session);
                response.Cookies.Add(new ResponseCookie("ToucheeSession", session.SessionId, DateTime.MinValue));
            }
            else {
                //session = sessionStore.Load(sessionCookie.Value);
                client = Client.FindBySesssionID(sessionCookie.Value);
            }

            // Build custom params object
            var parameters = new Params(request.Parameters);

            // TODO: check if we have a matching route
            switch (segments.Length) {

                // If we have only one part, that is a controller with action Index
                // /controller
                case 1:
                    controllerName = segments[0];
                    actionName = "index";
                    break;

                // When we have 2 parts and the second part is an int, do the Show action for that ID. Otherwise, the second part is the action
                // /controller/12
                case 2:
                    controllerName = segments[0];
                    actionName = int.TryParse(segments[1], out id) ? "show" : segments[1];
                    break;


                // In all other cases, we look at the last three parts
                default:
                    var last = segments.Skip(segments.Length - 3).ToArray();
                    
                    // If the last part is an int, that is the id
                    // .../12/controller/4
                    if (int.TryParse(last[2], out id)) {
                        controllerName = last[1];
                        actionName = "show";
                    }

                    // If the first of the last parts is an int, no id is given, so we have a collection action on a controller
                    // .../12/controller/action
                    else if (int.TryParse(last[0], out id)) {
                        controllerName = last[1];
                        actionName = last[2];
                        id = 0;
                    }

                    // If the middle one is an int, the first should be the controller and the last could be an action or a controller
                    // .../controller/12/action_or_controller
                    else if (int.TryParse(last[1], out id) && _controllers.ContainsKey(last[0])) {
                        controller = _controllers[last[0]].Prototype;

                        // If the last part is a method on the controller, do that
                        if (controller.HasMethod(last[2].ToCamelCase())) {
                            controllerName = last[0];
                            actionName = last[2];
                        }

                        // Else, the last part must be a controller
                        else if (_controllers.ContainsKey(last[2])) {
                            controllerName = last[2];
                            actionName = "index";
                            id = 0;
                        }

                        // Else, false alarm
                        else {
                        }

                    }

                    // Check the rest of the parts for IDs
                    int partID, tryID;
                    for (var i = 1; i < segments.Length; i++) {
                        if (int.TryParse(segments[i], out partID) && !int.TryParse(segments[i - 1], out tryID))
                            parameters.Set(segments[i - 1].ToLower() + "_id", partID.ToString());
                    }

                    break;
            }

            // Check if the controller exists and action is not empty
            if (string.IsNullOrEmpty(controllerName) || !_controllers.ContainsKey(controllerName) || string.IsNullOrEmpty(actionName))
                return ProcessingResult.Continue;

            // Get the controller context and set action name to camelcase
            controllerContext = _controllers[controllerName];
            actionName = actionName.ToCamelCase();

            // Set id in parameters
            if (id > 0)
                parameters.Set("id", id.ToString());

            // Check if controller has method
            if (!controllerContext.Prototype.HasMethod(actionName))
                return ProcessingResult.Continue;

            Logger.Log(String.Format("{0} - [{1}] \"{2} {3}\"", httpContext.RemoteEndPoint.Address, DateTime.UtcNow, request.Method, request.Uri.AbsolutePath));

            controller = null;
            bool ret = false;
            try {
                lock (context)
                    controller = controllerContext.Pop();
                controller.SetRequest(request, response, null, parameters, client);

                // Get controller response
                object result = controller.GetType().GetMethod(actionName).Invoke(controller, new object[0]);

                // Check result type
                var resultType = result == null ? null : result.GetType();

                // If we have a string response, set it
                string resultStr = null;
                if (resultType == typeof(String))
                    resultStr = (string)result;

                // If we have a bool response
                else if (resultType == typeof(bool))
                    ret = (bool)result;

                // If we have a message, we make a JSON response
                else if (result is Message) {
                    resultStr = Server.Serialize((Message)result);
                    response.ContentType = new HttpServer.Headers.ContentTypeHeader("application/json");
                }

                // If we have a result string, write it to the body
                if (resultStr != null) {
                    byte[] body = System.Text.Encoding.UTF8.GetBytes((string)resultStr);
                    response.Body.Write(body, 0, body.Length);
                    ret = true;
                }
                
                // If we have a body, but the response is not sent yet, do it now
                // This enables controllers to customize the response
                //if (response.Body.Length > 0 && !response.Sent)
                //    response.Send();

            }
            finally {
                if (controller != null) {
                    lock (controllerContext)
                        controllerContext.Push(controller);
                }
            }

            return ProcessingResult.SendResponse;
        }

    }
}