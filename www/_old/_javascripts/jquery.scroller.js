(function($){
  
  var Scroller = {
    
    // Init the scroller!
    init: function(options) {
      this.each(function(){
        var $this = $(this);
        
        // Clear element and set class
        $this.empty().addClass('scroller');
        
        // Add overlay
        var overlay = $("<div/>");
        $this.append(overlay);
                
        // Add alphabet
        var alphabet = $("<ul/>").addClass('alphabet');
        var addLetter = function(letter) { alphabet.append("<li>" + letter + "</li>"); };
        addLetter('#');
        for(c = 65; c < 65 + 26; c++)
          addLetter(String.fromCharCode(c));
        $this.append(alphabet);
        
        // Add scrollbar
        $this.append( $("<ul/>").addClass('bar') );
        
        // Set scrollbar as default
        $this.addClass('bar');
        
      });
      
      options = $.extend({}, options);
      
      var hoverFunc = function(ev){
        var $this = $(this);
        if (!$this.hasClass('hover')) return;
        
        // Get Y position
        var y = (
          typeof ev == 'number' ?
            ev : 
            (ev.originalEvent && ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY)
          ) - $this.offset().top;
        var response;
        
        // Return position as fraction of height
        if ($this.hasClass('bar')) {
          var top = $.numFromCSS( $this.find('.bar').css('background-position').match(/(\d)px/)[1] ) + 8;
          response = (y - top) / ($this.outerHeight() - 2 * top);
        }
        
        // Return hovered letter
        else if ($this.hasClass('alphabet')) {
          
          // Get height and position of first letter
          var alphabet = $this.children('.alphabet').first();
          var first = alphabet.children().first();
          var height = first.outerHeight();
          var top = first.position().top;
          
          // Calculate which letter we've got
          var i = Math.floor( (y - top) / height );
          
          if (i >= 0)
            response = alphabet.children().eq(i).text().toLowerCase();
        }
        
        // Return value
        if (response && typeof options.onhover == 'function')
          options.onhover.call(this, response);
        
      };
      
      this.
        bind('mousedown.scroller touchstart.scroller', function(ev){
          $(this).addClass('hover');
          hoverFunc.call(this, ev.originalEvent && ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY );
          return false;
        }).
        bind('mousemove.alphabet touchmove.alphabet', hoverFunc).
        bind('mouseleave.alphabet mouseup.alphabet touchend.alphabet touchcancel.alphabet', function(){
          $(this).removeClass('hover');
        });
      
      $(window).bind('resize.scroller', {scroller:this}, Scroller.resize);
      Scroller.resize({data:{scroller:this}});
    },
    
    resize: function(ev) {
      
      // Don't resize too often
      var now = new Date();
      if (Scroller.resizeTime && now - Scroller.resizeTime < 50) {
        if (Scroller.resizeTimeout) {
          clearTimeout(Scroller.resizeTimeout);
          delete Scroller.resizeTimeout;
        }
        Scroller.resizeTimeout = setTimeout(Scroller.resize, 50);
        return;
      }
      Scroller.resizeTime = now;
      
      // Resize each scroller in selector
      ev.data.scroller.each(function(){
        $this = $(this);
        
        // Set complete height
        var height = $this.parent().innerHeight();
        var marginTop = $.numFromCSS($this.css('margin-top'));
        var fullHeight = height - marginTop * 2;
        $this.css('height', fullHeight + 'px');
        
        // Set alphabet
        var alphabet = $this.children('.alphabet').first();
        var chars = alphabet.children();
        var lineHeight = Math.floor( fullHeight / chars.length );
        chars.css('lineHeight', lineHeight + 'px');
        alphabet.css('marginTop', (fullHeight - lineHeight * chars.length) / 2);
        
        // Set bar
        var bar = $this.children('.bar').first();
        var bgHeight = 15;
        var dotCount = Math.floor(fullHeight / bgHeight);
        var top = (fullHeight - bgHeight * dotCount) / 2;
        bar.css('background-position', "center " + top + "px, center " + top + "px, center " + (top + (dotCount - 1) * bgHeight) + "px");
        
      });
      
    },
    
    alphabet: function(alph) {
      if (alph)
        this.removeClass('bar').addClass('alphabet');
      else
        this.removeClass('alphabet').addClass('bar');
      return this;
    }
    
  };
  
  // Set scroller as jQ function
  $.fn.scroller = function( method ) {
    if ( Scroller[method] )
      return Scroller[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    else if ( typeof method === 'object' || ! method )
      return Scroller.init.apply( this, arguments );
    else
      $.error( 'Method ' +  method + ' does not exist on jQuery.scroller' );
  };
  
})(jQuery);