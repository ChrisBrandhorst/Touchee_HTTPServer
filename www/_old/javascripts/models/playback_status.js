var PlaybackStatus = new JS.Singleton({
  
  // Constructor
  initialize: function() {
    this.$pause = $('[data-button=pause]');
    this.$play = $('[data-button=play]');
    this.$prev = $('[data-button=prev]');
    this.$next = $('[data-button=next]');
    this.$repeat = $('[data-button=repeat]');
    this.$shuffle = $('[data-button=shuffle]');
    this.$transport = this.$pause.add(this.$play).add(this.$prev).add(this.$next).add(this.$repeat).add(this.$shuffle);
    this.$slider = $('.nowplaying_slider');
    this.$position = $('.nowplaying_position');
    this.$duration = $('.nowplaying_duration');
    this.$count = $('#nowplaying_count');
    this.$currentCollection = $('#nowplaying_list table');
    this.$currentCollectionScrollview = this.$currentCollection.parent();
    this.$smallArtwork = $('button.nowplaying_artwork')
    this.$largeArtwork = $('#nowplaying > .perspective > .nowplaying_artwork');
    this.$title = $('.nowplaying_title');
    this.$artist = $('.nowplaying_artist');
    this.$collection = $('.nowplaying_collection');
    this.$artist_collection = $('.nowplaying_artist_collection');
    
    // Bind prev, play, pause, next, shuffle & repeat buttons
    this.$prev.bind(iAd.START_EVENT, function(){ Application.action(Action.PREV); });
    this.$next.bind(iAd.START_EVENT, function(){ Application.action(Action.NEXT); });
    this.$play.bind(iAd.START_EVENT, function(){ Application.action(Action.PLAY); });
    this.$pause.bind(iAd.START_EVENT, function(){ Application.action(Action.PAUSE); });
    this.$repeat.bind(iAd.START_EVENT, function(){ Application.action(Action.REPEAT); });
    this.$shuffle.bind(iAd.START_EVENT, function(){ Application.action(Action.SHUFFLE); });
    
    // Select item in now playing collection list
    this.$currentCollectionScrollview.scrollview({
      selectable:     'tr',
      keepSelection:  false,
      select: function(ev, scrollview) {
        var id = this.attr('data-id').numberValue();
        // if (id == PlaybackStatus.currentItem) return;
        Application.select(
          PlaybackStatus.currentController,
          PlaybackStatus.currentCollection,
          this.attr('data-id').numberValue()
        );
      }
    });
    
    this.update();
  },
  
  // Update the displayed status
  update: function(status) {
    
    // We have no item, so reset it all!
    if (!status || !status.item) return this.reset();
    
    // If we now have an item, enable some stuff
    if (!this.currentItem) {
      
      // Enable the transport buttons
      this.$transport.prop('disabled', false);
      
      // Show the playlist counter
      this.$count.show();
    }
    
    // If the item that is playing has changed
    if (status.item != this.currentItem) {
      this.$title.html(status.title);
      this.$artist.html(status.artist);
      this.$collection.html(status.collectionName);
      this.$artist_collection.html(status.artist + " - " + status.collectionName);
      
      // Set the position sliders if we have a duration
      if (status.duration) {
        this.$duration.html(status.duration.secondsToTime());
        this.$slider.slider({
          range:  'min',
          min:    0,
          max:    status.duration,
          value:  status.position,
          start:  this.method('startSlide'),
          slide:  this.method('doSlide'),
          change: this.method('changeSlide'),
          stop:   this.method('stopSlide'),
        });
      }
      
      // Set the playlist counter
      this.$count.html(parseInt(status.playlistIndex) + 1 + " of " + status.playlistCount);
    }
    
    // Set the position
    if (status.duration)
      this.position(status.position);
    
    // Set play/pause buttons
    if (status.paused) {
      this.$pause.hide();
      this.$play.show();
      this.countPosition(false);
    }
    else {
      this.$pause.show();
      this.$play.hide();
      this.countPosition(true);
    }
    
    // Set repeat and shuffle status
    this.$repeat.toggleClass('on', status.repeat == 1)
                .toggleClass('on_1', status.repeat == 2);
    this.$shuffle.toggleClass('on', status.shuffle);
    
    // Set current collection info, this includes artwork
    if (this.currentCollection != status.collectionID && status.collection) {
      this.$currentCollection.html( $('#nowplayingListTemplate').tmpl(status) );
      this.$currentCollectionScrollview.scrollview();
      this.$smallArtwork.css('backgroundImage', "url(/artwork/" + status.collectionID + ")");
      this.$largeArtwork.css('backgroundImage', "url(/artwork/" + status.collectionID + "/original)");
    }
    
    this.currentItem = status.item;
    this.currentCollection = status.collectionID;
    this.currentController = status.controller;
    this.setPlaying();
    
  },
  
  // Resets everything to a non-playing state
  reset: function() {
    
    // Disable transport buttons
    this.$transport.prop('disabled', true);
    
    // Show play button
    this.$pause.hide();
    this.$play.show();
    
    // Reset shuffle and repeat
    this.$repeat.removeClass('on on_1');
    this.$shuffle.removeClass('on');
    
    // No sliding
    this.$slider.slider('destroy');
    this.$position.html("");
    this.$duration.html("");
    
    // No counter
    this.$count.hide();
    
    // Empty the current collection and artwork
    this.$currentCollection.html("");
    this.$currentCollectionScrollview.scrollview();
    this.$smallArtwork.css('backgroundImage', "");
    this.$largeArtwork.css('backgroundImage', "");
    
    // Nothing is playing
    this.$title.html("");
    this.$artist.html("");
    this.$collection.html("");
    this.$artist_collection.html("");
    this.currentItem = null;
    this.currentCollection = null;
    this.currentController = null;
    this.setPlaying();
  },
  
  // Gets or sets the current position
  position: function(pos) {
    if (typeof pos != 'number')
      return parseInt(this.$slider.slider('value'));
    else
      this.$slider.each(function(){ $(this).slider('value', pos); });
  },
  
  // This event is triggered when the user starts sliding
  startSlide: function(ev, ui) {
    this._slidingThroughPlayback = !!this.positionTimeout;
    this.countPosition(false);
  },
  
  // This event is triggered on every mouse move during slide
  doSlide: function(ev, ui) {
    this.$position.html(ui.value.secondsToTime());
    Application.position(ui.value);
  },
  
  // This event is triggered on slide stop, or if the value is changed programmatically (by the value method)
  changeSlide: function(ev, ui) {
    this.$position.html(ui.value.secondsToTime());
  },
  
  // This event is triggered when the user stops sliding
  stopSlide: function(ev, ui) {
    // request status
    if (this._slidingThroughPlayback)
      this.countPosition(true);
  },
  
  // Keeps track of progress
  countPosition: function(enable) {
    
    // Start position counter
    if (enable === true) {
      if (!this.positionTimeout || this.positionTimeout.cleared)
        this.positionTimeout = new Timeout(this.countPosition, 1000, this);
    }
    
    // Stop position counter
    else if (enable === false) {
      if (this.positionTimeout) {
        this.positionTimeout.clear();
        delete this.positionTimeout;
      }
    }
    
    // Up one
    else {
      this.position( this.position() + 1 );
      this.countPosition(true);
    }
    
  },
  
  // Set the currently playing item
  setPlaying: function(scope) {
    $('.playing').removeClass('playing');
    if (this.currentItem)
      $('[data-id=' + this.currentItem + ']', scope).addClass('playing');
  }
  
});