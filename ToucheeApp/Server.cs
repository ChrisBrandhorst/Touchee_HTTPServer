using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Touchee.Web;
using Touchee.Web.Messages;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Touchee {

    /// <remarks>
    /// The master server
    /// </remarks>
    public class Server : Base {

        // Private vars
        Web.WebServer _httpServer;
        Web.WebsocketServer _websocketServer;
        string _hostname;
        int _httpServerPort;
        int _websocketPort;
        

        /// <summary>
        /// Initialises a new server instance
        /// </summary>
        /// <param name="documentRoot">The document root of the HTTP server</param>
        /// <param name="httpServerPort">The port at which the HTTP server should run</param>
        /// <param name="websocketPort">The port at which the websocket server should run</param>
        /// 
        public Server(string documentRoot, int httpServerPort, int websocketPort) {

            // Get valid hostname
            _hostname = null;
            try {
                _hostname = System.Net.Dns.GetHostName().ToLower();
                Log("Host is " + _hostname);
            }
            catch (System.Net.Sockets.SocketException e) {
                throw new Exception("Cannot get a valid hostname for websocket server", e);
            }

            // Set local parameters
            _httpServerPort = httpServerPort;
            _websocketPort = websocketPort;

            // Init HTTP server
            _httpServer = new Web.WebServer(documentRoot);

            // Init websocket server
            _websocketServer = new Web.WebsocketServer(_hostname, websocketPort);
        }


        /// <summary>
        /// Start the server by starting the HTTP server, the websocket server and the media detector.
        /// </summary>
        /// <returns>true when the server was successfully started</returns>
        public bool Start() {

            // Start HTTP server
            try {
                _httpServer.Start(_httpServerPort);
                Log("HTTP server started");
            }
            catch (Exception e) {
                Log("Could not start HTTP server", e, Logger.LogLevel.Fatal);
                return false;
            }
            
            // Start websocket server
            try {
                _websocketServer.Start();
                Logger.Log("Websocket server started");
            }
            catch (Exception e) {
                Log("Could not start websocket server", e, Logger.LogLevel.Fatal);
                return false;
            }

            return true;
        }


        #region Messages

        /// <summary>
        /// Converts the given message to a JSON representation
        /// </summary>
        /// <param name="message">The message to be serialized</param>
        /// <returns>The message in JSON form</returns>
        public static string Serialize(Message message) {
            var dict = new Dictionary<string, Message>();
            dict[message.GetType().Name.Replace("Message", "").FirstToLower()] = message;

            return JsonConvert.SerializeObject(
                dict,
                Formatting.None,
                new JsonSerializerSettings {
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                }
            );
        }


        /// <summary>
        /// The server info
        /// </summary>
        public ServerInfoMessage ServerInfo { get {
            DateTime now = DateTime.UtcNow;
            return new ServerInfoMessage() {
                Name            = Program.Config.GetString("name", "Touchee"),
                WelcomeMessage  = Program.Config.GetString("welcomeMessage", "Welcome to Touchee"),
                Hostname        = _hostname,
                WebsocketPort   = _websocketPort,
                UtcTime         = (long)now.TimeStamp(),
                UtcOffset       = (long)TimeZone.CurrentTimeZone.GetUtcOffset(now).TotalMilliseconds,
                Devices         = Program.Config.GetValue("devices", null)
            };
        } }


        #endregion


        #region Communication


        /// <summary>
        /// Sends a message to a client as JSON over the websocket
        /// </summary>
        /// <param name="client">The client to send the message to</param>
        /// <param name="message">The message to send</param>
        public void Send(Client client, Message message) {
            client.Send(Serialize(message));
        }


        /// <summary>
        /// Sends a message to all clients as JSON over the websocket
        /// </summary>
        /// <param name="message">The message to send</param>
        public void Broadcast(Message message) {
            var serialized = Serialize(message);
            Client.ForEach(c => c.Send(serialized));
        }


        #endregion


    }


    /// <remarks>
    /// Custom JSON serializer used for HTML Encoding strings.
    /// </remarks>
    internal class ToucheeJsonConverter : JsonConverter {
        public override bool CanConvert(Type objectType) {
            return typeof(string).IsAssignableFrom(objectType);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) {
            return HttpUtility.HtmlDecode(existingValue.ToString());
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            writer.WriteValue( HttpUtility.HtmlEncode(value.ToString()) );
        }
    }

}
