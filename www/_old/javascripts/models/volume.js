var Volume = new JS.Singleton({
  
  muted: false,
  
  // Constructor
  initialize: function() {
    
    // Init volume popup
    this.$element = $('#volume_popup');
    $('button.volume').bind(iAd.START_EVENT, this.method('toggle'));
    
    // Set slider
    var slider = $('<div/>')
      .appendTo( $('.volume_slider') )
      .slider({
        range:  'min',
        min:    0,
        max:    100,
        value:  50,
        slide: function(ev, ui) { Application.volume(ui.value); },
        start: function() { Volume._sliding = true; },
        stop:  function(ev, ui) { Volume._sliding = false; }
      });
    this.sliders = $('.volume_slider > div');
    
    // Set mute button
    this.muteButton = this.$element.find('button[data-button=mute]')
      .bind(iAd.START_EVENT, function(){
        Volume.muted = !Volume.muted;
        Application.volume(null, Volume.muted);
      });
    
  },
  
  // Sets the volume value and muting
  set: function(val, muted) {
    if (!this._sliding)
      this.sliders.each(function(){$(this).slider('value', parseInt(val));});
    this.muteButton.toggleClass('active', this.muted = muted);
  },
  
  // Toggles the volume popup
  toggle: function(ev) {
    
    // Function for hiding the volume popup
    var hideVolume = function() {
      $('body').unbind(iAd.START_EVENT + '.volume_popup');
      Volume.$element.hide();
    };
    
    // If visible, hide it
    if (this.$element.is(':visible'))
      return hideVolume();
    
    // Show overlay and add callback for closing the popup
    Application.overlay(hideVolume);
    
    // Show the popup
    this.$element.show();
    
    // Cancel event, otherwise it will be immediately hidden
    ev.stopPropagation();
  }
  
  
});