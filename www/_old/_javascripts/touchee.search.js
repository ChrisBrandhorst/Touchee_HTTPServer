(function(){
  
  Touchee.Search = {
    
    init: function() {
      var $field = this.field = $('#query');
      
      $field.closest('form').submit(function(){
        $field.blur();
        return false;
      });
      
      $field.
        keyup(Touchee.Search.change).
        // bind('mousedown touchstart', Touchee.Search.mousedown).
        // bind('focus', function(){ $field.addClass('focus'); }).
        // bind('blur', function(){ $field.removeClass('focus'); }).
        addClass('placeholder').
        val($field.attr('data-placeholder')).
        data('close',
          $field.prev('a').hide().bind('mousedown touchstart', Touchee.Search.clear)
        );
    },
    
    // Catch keypress for querying
    change: function(ev) {
      if (Touchee.Search.timeout)
        clearTimeout(Touchee.Search.timeout);
      Touchee.Search.timeout = setTimeout(Touchee.Search.query, 500);
      if (Touchee.Search.field.val() != "")
        // Touchee.Search.field.addClass('filled');
        Touchee.Search.field.data('close').show();
      else
        // Touchee.Search.field.removeClass('filled');
        Touchee.Search.field.data('close').hide();
    },
    
    // Click on the 'clear text' icon
    // mousedown: function(ev) {
    //   var field = $(ev.target);
    //   var minLeft = field.offset().left + field.width() + Number(field.css('padding-left').replace('px', ""));
    //   if (ev.pageX > minLeft)
    //     Touchee.Search.clear();
    // },
    
    clear: function(blur) {
      Touchee.Search.field.val("");
      // Touchee.Search.field.removeClass('filled');
      Touchee.Search.field.data('close').hide();
      Touchee.Search.query();
      if (blur) Touchee.Search.field.blur();
      return false;
    },
    
    // Fire the query!
    query: function() {
      delete Touchee.Search.timeout;
      Touchee.Commands.query(Touchee.Search.field.val());
    }
    
  }
  
})(jQuery);