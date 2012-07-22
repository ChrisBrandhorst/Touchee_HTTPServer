(function($){
  
  var InertScroll = {
    
    id:             'inertscroll',
    startDistance:  2, // px
    deceleration:   0.002, // px / ms
    
    // Init the intertial scrolling
    init: function(options) {
      options = $.extend({}, options || {});
      var $this;
      this.each(function(){
        $this = $(this);
        $this.addClass(InertScroll.id);
        $this.bind('touchstart mousedown', InertScroll.ontouchstart);
        $this.data(InertScroll.id, options);
      });
    },
    
    ontouchstart: function(ev) {
      var el = $(ev.target).closest('.' + InertScroll.id);
      var y = ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY;
      
      el.stop();
      
      var data = {
        element:      el,
        startY:       y,
        startScroll:  el.scrollTop(),
        lastY:        y,
        lastTime:     new Date(),
        scrolled:     false,
        speed:        0,
        downTimer:    null
      };
      
      $('body').
        bind('touchmove.' + InertScroll.id + ' mousemove.' + InertScroll.id, data, InertScroll.ontouchmove).
        bind('touchend.' + InertScroll.id + ' mouseup.' + InertScroll.id, data, InertScroll.ontouchend);
      
      // Callback for down
      var downCallback = el.data(InertScroll.id).down;
      if (downCallback) {
        // data.downCallback = downCallback;
        // data.downTimer = setTimeout(function(){
        //   downCallback.call(this, ev);
        //   delete data.downTimer;
        // }, 50);
        downCallback.call(this, ev);
      }
      
      ev.preventDefault();
      return false;
    },
    
    ontouchmove: function(ev) {
      var data = ev.data;
      var y = ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY;
      
      // Cancel down callback
      // if (data.downTimer) {
      //   clearTimeout(data.downTimer);
      //   delete data.downTimer;
      // }
      
      // Scrolling start offset
      if (!data.scrolled) {
        if (Math.abs(y - data.startY) < InertScroll.startDistance)
          return;
        else {
          data.scrolled = true;
          data.startY = y;
          
          // Callback for scroll started
          var startCallback = data.element.data(InertScroll.id).start;
          if (startCallback) startCallback.call(this, ev);
        }
      }
      
      // Do the scrolling
      //if (!data.bla)
        data.element[0].scrollTop = data.startScroll - (y - data.startY);
      
      //data.bla = data.bla ? false : true;

      // Calculate the speed
      var diffY = y - data.lastY;
      var now = new Date();
      var diffTime = now - data.lastTime;
      data.speed = diffY / diffTime;
      
      // Store data
      data.lastY = y;
      data.lastTime = now;
      
      ev.preventDefault();
      return false;
    },
    
    ontouchend: function(ev) {
      var data = ev.data;
      
      // Cancel down callback
      // if (data.downTimer) {
      //   clearTimeout(data.downTimer);
      //   delete data.downTimer;
      //   data.downCallback.call(this, ev);
      // }
      
      // var y = ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY;
      $.fx.interval = 30;
      // Inert if scrolled!
      if (data.scrolled) {
        // Set some stuff
        var startTime = new Date();
        var duration = Math.abs(data.speed / InertScroll.deceleration);
        
        // Start intertia
        data.element.animate({
          zoom: [0, 'linear']
        },{
          duration: duration,
          step: function(now, fx) {
            data.speed = (duration - ((new Date()) - startTime)) * InertScroll.deceleration * (data.speed > 0 ? 1 : -1);
            if (Math.abs(data.speed) < InertScroll.deceleration * $.fx.interval) {
              data.speed = 0;
              data.element.stop();
              return;
            }
            data.element.scrollTop( data.element.scrollTop() - data.speed * $.fx.interval );
          }
        });
      }
      
      // Remove scrolling settings
      data.scrolled = false;
      
      // Remove binds
      $('body').unbind('touchmove.' + InertScroll.id).
                unbind('mousemove.' + InertScroll.id).
                unbind('touchend.' + InertScroll.id).
                unbind('mouseup.' + InertScroll.id);
      
      // Do up callback
      var upCallback = data.element.data(InertScroll.id).up;
      if (upCallback) upCallback.call(this, ev);
      
      // Cancel propogation
      // ev.stopPropagation();
      ev.preventDefault();
      return false;
    }
    
  };
  
  // Set inertscroll as jQ function
  $.fn.inertscroll = function( method ) {
    if ( InertScroll[method] )
      return InertScroll[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    else if ( typeof method === 'object' || ! method )
      return InertScroll.init.apply( this, arguments );
    else
      $.error( 'Method ' +  method + ' does not exist on jQuery.inertscroll' );
  };
  
})(jQuery);