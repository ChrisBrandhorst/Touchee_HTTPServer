(function($){
  
  $.fn.delay = function(ev, callback, delay) {
    return this.each(function(){
      var $this = $(this);
      $this.data('delay', {});
      $this.bind(ev, function(){
        var status = $this.data('delay');
        var now = new Date();
        
        if (status.lastTime && now - status.lastTime < delay) {
          if (status.timeout) {
            clearTimeout(status.timeout);
            delete status.timeout;
          }
          status.timeout = setTimeout(function(){
            callback.call($this[0]);
          }, delay);
        }
        status.lastTime = now;
      
      });
    });
  };
  
  
})(jQuery);
