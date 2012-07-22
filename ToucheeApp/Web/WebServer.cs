using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using HttpServer;
using HttpServer.Modules;
using HttpServer.Routing;

using Touchee.Web.Controllers;
using Touchee.Web.Modules;

namespace Touchee.Web {

    /// <remarks>
    /// 
    /// </remarks>
    public class WebServer : Touchee.Base {

        // The HTTP server.
        HttpServer.Server _httpServer;

        /// <summary>
        /// Initialise a HTTP server
        /// </summary>
        /// <param name="path">The path to the web root of the http server</param>
        public WebServer(string path) {
            _httpServer = new HttpServer.Server();

            // Add the controller module and all controllers
            var controllerModule = new RestControllerModule();
            var cType = typeof(RestRequestController);
            AppDomain.CurrentDomain.GetAssemblies().ToList()
                .SelectMany(s => s.GetTypes())
                .Where(p => p.IsSubclassOf(cType) && p != cType && !p.IsAbstract)
                .ToList()
                .ForEach(t => controllerModule.Add((RestRequestController)Activator.CreateInstance(t)));
            _httpServer.Add(controllerModule);
            
            // Add the basic file module
            int cacheDuration = 2592000;
            Program.Config.TryGetInt("cacheDuration", out cacheDuration);
            var fileModule = new CachedFileModule(Math.Max(0, cacheDuration));
            fileModule.Resources.Add(new HttpServer.Resources.FileResources("/", path));
            _httpServer.Add(fileModule);
            
            // Set name
            string serverName;
            Program.Config.TryGetString("name", out serverName, "Touchee");
            _httpServer.ServerName = serverName;

            // Go to root
            _httpServer.Add(new SimpleRouter("/", "/index.html"));
        }


        /// <summary>
        /// Starts this Webserver at a given port.
        /// </summary>
        /// <param name="port">The port to start the web server on. Defaults to 80.</param>
        /// <exception cref="ArgumentException">When the web server could not be started on the given port.</exception>
        public void Start(int port = 80) {
            Log("Starting HTTP server on port " + port.ToString());
            _httpServer.Add(HttpListener.Create(System.Net.IPAddress.Any, port));
            _httpServer.Start(0);
        }



    }

}