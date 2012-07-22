(function(){
  
  Touchee.Overlay = {
    
    init: function() {
      this.overlay = $('#overlay').bind('mouseup touchend', this.doTouch);
      this.callbacks = [];
    },
    
    touch: function(func) {
      this.callbacks.push(func);
    },
    
    show: function(visible, func) {
      if (typeof visible == 'function') {
        func = visible;
        visible = true;
      }
      
      if (typeof visible == 'undefined')
        return this.overlay.is(':visible');
      else if (visible) {
        this.overlay.show();
        if (typeof func == 'function')
          this.touch(func);
      }
      else
        this.overlay.hide();
    },
    
    doTouch: function(ev) {
      var cbs = Touchee.Overlay.callbacks;
      for(i in cbs)
        cbs[i].call(this, ev);
      Touchee.Overlay.show(false);
      Touchee.Overlay.callbacks = [];
      return false;
    }
    
  }
  
})(jQuery);