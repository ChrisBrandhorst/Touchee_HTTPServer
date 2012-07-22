var Touchee = {};

(function(){
  
  Touchee.defaults = {
    host: "ws://10.61.1.23:8181/touchee" 
  };
  
  $.extend(Touchee, {
    
    VIEWMODE:   'viewmode',
    ITEM:       'item',
    
    ALBUM:      'album',
    ARTIST:     'artist',
    
    windows:    navigator.platform.match(/win/i),
    animate:    true,
    debug:      true,

    // Init the app
    init: function(options) {
      
      $('body').bind('touchstart', function(ev){
        ev.preventDefault();
      });

      if (Touchee.debug === false)
        console.log = function() {};
      Touchee.options = $.extend(Touchee.defaults, options);
      
      // Set platform
      if (Touchee.windows)
        Touchee.animate = false;
      else
        $('body').addClass('animated');
      
      // Initialise the modules
      Touchee.Controls.init();
      Touchee.Sources.init();
      Touchee.Builder.init();
      Touchee.Search.init();
      Touchee.Content.init();
      Touchee.Overlay.init();
      
      // Automatically receives config and status when connected
      Touchee.Commands.init();
      
      // Disable full page touch-scrolling
      //Touchee.Controls.switchArea();
      //$('#nowplaying > .nowplaying_artwork').mouseup();
      

      // Touchee.Controls.setStatus({
      //   title:        "The Day That Never Comes",
      //   artist:       "Metallica",
      //   collection:   "Death Magnetic (Guitar Hero Edition)",
      //   total:        254,
      //   isTimed:      true,
      //   position:     100,
      //   volume:       34,
      //   shuffle:      true,
      //   repeat:       2
      // });
      
      // $('.nowplaying_artwork').css('background-image', "url(http://www.freecodesource.com/album-cover/51lPLCgUGNL/Dire-Straits-Sultans-of-Swing---Very-Best-of.jpg)");
      
      // Touchee.Controls.switchArea();
      // $('#nowplaying_perspective > .nowplaying_artwork').mouseup();
      
    }
    
    
  });
  
  
})(jQuery);

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

$.numFromCSS = function(css) {
  return Number(css.replace(/[^0-9\.\-]+/, ""));
}