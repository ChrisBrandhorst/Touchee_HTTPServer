Action = {
  CONFIG:     'config',
  STATUS:     'status',
  CONTROLLER: 'controller',
  SELECT:     'select',
  VOLUME:     'volume',
  POSITION:   'position',
  PREV:       'prev',
  NEXT:       'next',
  PLAY:       'play',
  PAUSE:      'pause',
  REPEAT:     'repeat',
  SHUFFLE:    'shuffle'
};

Status = {
  LOADING:  'loading',
  LOADED:   'loaded'
};

CollectionType = {
  ALBUM:  'album'
};

var Application = new JS.Singleton({

  // Default options for the application
  defaultOptions: {
    animate:  true,
    logLevel: Logger.levels.error
  },

  // If we are on windows or not
  windows:    navigator.platform.match(/win/i),


  // Start
  start: function(options) {
    
    // Set options
    this.options = $.extend(this.defaultOptions, options || {});
    
    // Set log level
    Logger.level(this.options.logLevel);
    
    // Set animation
    if (this.windows) {
      this.options.animate = false;
      $('body').addClass('windows');
    }
    if (this.options.animate === true)
      $('body').addClass('animated');
    
    // Get configuration from server
    Logger.debug("Application:: getting app config...");
    $.ajax({
      url:      "/config",
      dataType: 'json',
      async:    false,
      success:  function(data) {
        Logger.debug("Application:: received app config");
        Application.config = data;
      },
      error: function(jqXHR, textStatus, errorThrown) {
        var err = "Unable to get configuration:\n\n" + errorThrown;
        return Logger.error(err) && alert(err) && false;
      }
    });
    
    // Start the communicator
    this.communicator = new Communicator(this.config.websocket, this);
    
    
    // Debug stuff
    // $('#nowplaying_artist_collection').click(function(){
    //   $(document.body).toggleClass('portrait');
    //   $(window).trigger('resize');
    // });
    $('#nowplaying_footer .perspective').click(function(){
      var np = $('#nowplaying');
      var isFlipped = np.hasClass('flip');
      np.removeClass(isFlipped ? 'flip' : 'unflip');
      np.addClass(isFlipped ? 'unflip' : 'flip');
    });
    $('#nowplaying_footer [data-button=back]').click(function(){
      $('#nowplaying').removeClass('visible');
    });
    $('#controls .nowplaying_artwork').click(function(){
      $('#nowplaying').removeClass('invisible').addClass('visible');
    })
    $('#nowplaying > .perspective > .nowplaying_artwork').click(function(){
      $('#nowplaying').toggleClass('expanded');
    });
    
  },
  
  // Process a message from the server
  process: function(msg) {
    var controller, collection;
    
    // If a message is a response to a request
    if (msg.request) {
    
      // Check if request of incoming response was the last request sent
      if (this.lastTimestamp && this.lastTimestamp > msg.request.timestamp) {
        Logger.info("Application:: throwing away delayed response");
        return;
      }
      
      switch(msg.request.action) {
      
        // The configuration for the application
        case Action.CONFIG:
          this.config = msg.result;
          this.library = new Library(this.config);
          break;
        
        // The contents of a controller
        case Action.CONTROLLER:
          if (controller = this.library.controllers[msg.result.controller])
            controller.collections(msg.result);
          break;
        
        // Some content was selected
        case Action.SELECT:
          if (collection = this.library.getCollection(msg.request.path[0], msg.request.controller))
            collection.setContent(msg);
          break;
        
        // Status update
        case Action.STATUS:
          PlaybackStatus.update(msg.result);
          break;
        
      }
    }
    
    // Pushed messages
    else {
      switch(msg.action) {
        
        // Volume broadcast
        case Action.VOLUME:
          Volume.set(msg.value, msg.muted);
          break;
        
        // Position broadcast
        case Action.POSITION:
          PlaybackStatus.position(parseInt(msg.value));
          break;
      }
    }
    
  },
  
  // Simple action message
  action: function(action) {
    this.send({action:action});
  },
  
  // Get the data for the given controller
  controller: function(controller) {
    this.send({
      action:     Action.CONTROLLER,
      controller: controller.id
    });
  },

  // Get the data for the given collection
  collection: function(collection, viewmode) {
    this.send({
      action:     Action.SELECT,
      controller: collection.controller.id,
      path:       [collection.id],
      viewmode:   viewmode || collection.viewmode()
    });
  },
  
  // Get the data for the given item, when browsing
  item: function(page, item) {
    var path = page.collection.currentPath();
    path.push(item);
    this.send({
      action:     Action.SELECT,
      controller: page.collection.controller.id,
      viewmode:   page.collection.viewmode(),
      path:       path
    });
  },
  
  // Select some item from the now playing list
  select: function(controller, collection, id) {
    this.send({
      action:     Action.SELECT,
      controller: controller,
      path:       ['-1', collection, id]
    });
  },
  
  // Gets the status from the server
  status: function() {
    this.send({action:Action.STATUS});
  },
  
  // Sets the volume on the server
  volume: function(vol, muted) {
    var obj = {action:Action.VOLUME};
    if (typeof vol == 'number')     obj.value = Math.max(0, Math.min(100, Number(vol)));
    if (typeof muted == 'boolean')  obj.muted = muted;
    this.send(obj);
  },
  
  // Sets the current position on the server
  position: function(pos) {
    this.send({
      action: Action.POSITION,
      value:  pos
    })
  },
  
  // Send a message with timestamp
  send: function(msg) {
    msg.timestamp = new Date().getTime();
    this.lastTimestamp = msg.timestamp;
    this.communicator.send(msg);
  },
  
  // Shows the fullscreen overlay. The callback is called when the overlay is clicked / touched
  overlay: function(callback) {
    var overlay = $('#overlay');
    $('#overlay').show().bind(iAd.START_EVENT, function(ev){
      if (callback.apply(this, arguments) !== false)
        overlay.hide();
    });
  },
  
  // Resets the UI when disconnected
  disconnected: function() {
    PlaybackStatus.reset();
    if (this.library)
      this.library.clear();
  }
  
  
});

