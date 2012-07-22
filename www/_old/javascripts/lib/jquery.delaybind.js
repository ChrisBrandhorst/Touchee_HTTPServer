(function($){
  
  $.fn.delaybind = function(ev, callback, delay, data) {
    return this.each(function(){
      var $this = $(this);
      // $this.data('delay', {});
      var status = {};
      $this.bind(ev, function(ev){
        // var status = $this.data('delay');
        var now = new Date();
        
        // if (status.lastTime && now - status.lastTime < delay) {
          if (status.timeout) {
            clearTimeout(status.timeout);
            delete status.timeout;
          }
          status.timeout = setTimeout(function(){
            ev.data = data;
            callback.call($this[0], ev);
          }, delay);
        // }
        // status.lastTime = now;
      
      });
    });
  };
  
})(jQuery);
