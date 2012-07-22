var Communicator = new JS.Class({
  
  // Constructor
  initialize: function(address, application) {
    this.address = address;
    this.application = application;
    this.connect();
  },

  // Connect to the websocket and set callbacks
  connect: function() {
    
    // Do not (re)connect if ready
    if (this.ready()) return;

    // Open socket
    try {
      Logger.info("Communicator:: connecting to websocket at " + this.address + "...");
      this._websocket = new WebSocket(this.address);
    }
    catch(err) {
      Logger.error("Communicator:: unable to open websocket to " + this.address + " (" + err + ")");
    }

    // Set callbacks
    var communicator = this;
    this._websocket.onopen = function(ev){
      Logger.info("Communicator:: websocket opened");
    };
    this._websocket.onerror = function(ev){
      Logger.error("Communicator:: ERROR on websocket: " + ev.data);
      spawnThread(2000, communicator, 'connect');
    };
    this._websocket.onclose = function(ev){
      Logger.warn("Communicator:: websocket closed");
      spawnThread(communicator, 'disconnected', ev.data);
      spawnThread(2000, communicator, 'connect');
    };
    this._websocket.onmessage = function(ev){
      Logger.debug("Communicator:: received message over websocket");
      spawnThread(communicator, 'process', ev.data);
    };

  },

  // Returns whether the websocket has established a connection
  ready: function() {
    return this._websocket && this._websocket.readyState == 1;
  },
  
  // Called when we are disconnected from the server
  disconnected: function() {
    this.application.disconnected();
  },

  // Send the given object to the server. If the second paramater is true, the message is sent as
  // an AJAX request and the response is immediately processed. If not, the message is sent over the
  // websocket.
  send: function(msg, ajax) {
    
    Logger.debug("Communicator:: sending object below using " + (ajax ? "ajax" : "websocket"));
    Logger.debug(msg);
    
    // Convert to JSON
    msg = JSON.stringify(msg);

    // Send using ajax
    if (ajax) {
      $.post("/post", {
        method:   'post',
        data:     msg,
        success:  this.process,
        error:    function(jqXHR, textStatus, errorThrown) {
          Logger.error("Communicator:: sending failed over ajax: " + errorThrown);
        }
      });
    }

    // Send using websocket
    else {
      try {
        if (this.ready())
          this._websocket.send(msg);
        else
          console.error("Communicator:: sending failed over websocket: connection not ready");
      }
      catch(err) {
        console.error("Communicator:: sending failed over websocket: " + err);
      }
    }

  },

  // Processes the given message
  process: function(msg) {
    
    // Convert to JS object if needed
    if (typeof msg == "string")
      msg = JSON.parse(msg); // Much faster then $.parseJSON
    
    Logger.debug("Communicator:: processing object below");
    Logger.debug(msg);
    
    // Give the message to the application for further processing
    this.application.process(msg);
  }


});