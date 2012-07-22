(function(){
  
  Touchee.Action = {
    CONFIG:     'config',
    STATUS:     'status',
    CONTROLLER: 'controller',
    COLLECTION: 'collection'
  };

  Touchee.Commands = {
    
    ACT:            'act',
    QUERY:          'query',
    MORE:           'more',
    ARTWORK:        'artwork',
    STATUS_LOADING: 'loading',
    STATUS_LOADED:  'loaded',
    STATUS_ERROR:   'error',
    
    // Init the commands module
    init: function() {
      
      // Connect to the websocket server
      this.connect();
    },
    
    // Connect to the websocket server
    connect: function() {
      try {
        this.ws = new WebSocket(Touchee.options.host);
      }
      catch(err) {
        console.error("connect :: failed for " + Touchee.options.host);
      }
      this.ws.onopen = function(){};
      this.ws.onclose = function(){};
      this.ws.onmessage = function(ev){ Touchee.Commands.process(ev.data); };
    },
    
    // Send a message to the server
    send: function(message, ajax) {

      console.log("send :: sending object below using " + (ajax ? "ajax" : "websocket"));
      console.log(message);

      // Send using ajax
      if (ajax) {
        $.post("/post", {
          method:   'post',
          data:     JSON.stringify(message),
          success:  Touchee.Commands.process,
          error:    function(jqXHR, textStatus, errorThrown) {
            console.error("send :: failed over ajax: " + errorThrown);
          }
        });
      }

      // Send using websocket
      else {
        try {
          if (this.ws && this.ws.readyState == 1)
            this.ws.send(JSON.stringify(message));
          else
            console.error("send :: failed over ws: connection not ready");
        }
        catch(err) {
          console.error("send :: failed over ws: " + err);
        }
      }

    },

    // Bla
    bla: function(action, value) {
      var message;

      switch(action) {
        
        // A controller was selected
        case Touchee.Action.CONTROLLER:
          message = {
            action:     action,
            controller: value
          }
          break;
        
        // A collection was selected
        // A viewmode was chosen
        // A query was run
        case Touchee.Action.COLLECTION:
          message = {
            action:     action,
            controller: value
          }
          break;

      }

      if (message)
        this.send(message);
    },



    
    // Reload the current view
    reload: function() {
      Touchee.Commands.selected(
        Touchee.Commands.QUERY,
        Touchee.Status.get().query,
        true
      );
    },

    // Receives info on what item was selected from the interface
    selected: function(type, target, force) {
      // if (typeof type == 'undefined' || typeof target == 'undefined') return;
      
      console.log("selected :: " + type + " " + target);
      
      var status;
      Touchee.Status.setScrollTop( Touchee.Content.activeContainer().scrollTop() );
      
      switch(type) {
        
        case Touchee.CONTROLLER:
          if (!Touchee.Status.setController(target) && !force) break;
          this.send({
            action:     this.CONTROLLER,
            controller: target
          });
          break;
          
        case Touchee.COLLECTION:
          if (!Touchee.Status.setCollection(target) && !force) break;
          status = Touchee.Status.get();
          this.send({
            action:       this.ACT,
            type:         type,
            query:        status.query,
            controller:   status.controller,
            collection:   status.collection,
            viewmode:     status.viewmode,
            // item:         status.item
          });
          break;
          
        case Touchee.VIEWMODE:
          if (!Touchee.Status.setViewmode(target) && !force) break;
          status = Touchee.Status.get();
          this.send({
            action:       this.ACT,
            type:         Touchee.COLLECTION,
            query:        status.query,
            controller:   status.controller,
            collection:   status.collection,
            viewmode:     status.viewmode,
            item:         status.item
          });
          break;
        
        case this.QUERY:
          status = Touchee.Status.get();
          if (status.collection) {
            if (!Touchee.Status.setQuery(target) && !force) break;
            status = Touchee.Status.get();
            this.send({
              action:       this.ACT,
              type:         status.item ? Touchee.ITEM : Touchee.COLLECTION,
              query:        status.query,
              controller:   status.controller,
              collection:   status.collection,
              viewmode:     status.viewmode,
              //item:         status.item
            });
          }
          else if (target != "") {
            Touchee.Search.clear(true);
          }
          break;
        
        case this.MORE:
          status = Touchee.Status.get();
          this.send({
            action:       this.ACT,
            type:         status.item ? Touchee.ITEM : Touchee.COLLECTION,
            query:        status.query,
            controller:   status.controller,
            collection:   status.collection,
            viewmode:     status.viewmode,
            offset:       target
          });
          break;
          
        default:
          status = Touchee.Status.get();
          if (status.collection) {
            if (!Touchee.Status.setItem(target) && !force) break;
            status = Touchee.Status.get();
            this.send({
              action:       this.ACT,
              type:         type,
              query:        status.query,
              controller:   status.controller,
              collection:   status.collection,
              viewmode:     status.viewmode,
              item:         status.item
            });
          }
          break;
          
      }
    },
    
    // Fire the search query on the current selection
    query: function(text) {
      console.log("query :: " + text);
      this.selected(this.QUERY, text);
    },
    
    // Called when a control button is pressed
    control: function(control) {
      this.send({action:control});
    },
    
    // Get status
    status: function() {
      this.send({action:'status'});
    },

    // Process incoming data
    process: function(data) { 
      if (typeof data == "string")
        data = JSON.parse(data);
        // data = $.parseJSON(data);
      
      console.log("process :: processing object below");
      console.log(data);
      
      switch(data.action) {
        
        // Initial configuration
        case Touchee.CONFIG:
          
          // Init the status object with the given data
          Touchee.Status.init(data);
          
          // Set the controllers in the interface and select the first
          Touchee.Sources.setControllers(data.controllers);
          Touchee.Sources.selectFirstController();
          break;
          
          
        // Collections for a certain controller were sent
        case Touchee.CONTROLLER:
          // Add viewmodes & collections to status object
          Touchee.Status.storeController(data);
          // Set the collections for the controller in the interface
          Touchee.Sources.setCollections(data);
          break;
          
          
        // Act: got data for a specific media item
        case this.ACT:
          // Get active container
          var activeContainer = Touchee.Content.activeContainer();

          // Check if data is valid for current status
          if (!Touchee.Status.processable(data)) return;
          var status = Touchee.Status.get();

          this.showResult(data, activeContainer, status);
          break;
        
        // Artwork was updated
        case this.ARTWORK:
          Touchee.Content.gotArtwork(data);
          break;
        
        // Playback status
        case this.STATUS:
          Touchee.Controls.setStatus(data);
          break;
        
      }
      
    },
    
    
    showResult: function(data, container, status) {
      
      // Get active container and status
      var activeContainer = container || Touchee.Content.activeContainer();
      var status = status || Touchee.Status.get();
      
      // Act on specific types
      switch(data.type) {
        
        // Process the reception of a collection
        case Touchee.COLLECTION:
          var buildStart = new Date();
          Touchee.Content.set(data, status.viewmode ? status.scrollTop : 0, data.item);
          console.log("process :: content set in " + (new Date() - buildStart) + " ms");
          break;
        
        // Show an album as a popup
        case Touchee.ALBUM:
          if (data.status == "loaded")
            Touchee.Content.showAlbum(data.result, activeContainer);
          break;
        
      } // switch
    }
    
  }
  
})(jQuery);