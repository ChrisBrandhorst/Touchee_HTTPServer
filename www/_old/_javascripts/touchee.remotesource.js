(function($){
  
  Touchee.RemoteSource = {
    
    STATUS_NONE: 'none',
    
    init: function(options) {
      return this.each(function(){
        var $this = $(this);
        $this.
          addClass('remotesource').
          attr('id', "remotesource_" + options.id).
          bind('mousedown.remotesource touchstart.remotesource', Touchee.RemoteSource.click).
          text('...').
          data({
            remotesource: options.id,
            collection:   options.collection,
            click:        options.click
          });
        
      });
    },
    
    find: function(id) {
      return $('#remotesource_' + id);
    },
    
    set: function(data) {
      
      switch(data.status) {
        case Touchee.RemoteSource.STATUS_NONE:
          this.text("...").removeClass('results loading');
          break;
        case Touchee.Commands.STATUS_LOADING:
          this.text("...").removeClass('results').addClass('loading');
          break;
        case Touchee.Commands.STATUS_ERROR:
          this.text("err").removeClass('loading results');
          break;
        case Touchee.Commands.STATUS_LOADED:
          if (data.resultCount > 0)
            this.text(data.resultCount).removeClass('loading').addClass('results');
          else
            this.text("none").removeClass('results loading');
          break;
      }
      
      this.data('data', data);
      
      return this;
    },
    
    click: function(ev) {
      var loader = $(ev.target).closest(':data(remotesource)');
      loader.toggleClass('selected');
      if (loader.data('click'))
        loader.data('click').call(loader, loader.hasClass('selected'), loader.hasClass('results'));
    },
    
    hide: function() { return this.hide(); },
    show: function() { return this.show(); }
    
  };
  
  // Set remotesource as jQ function
  $.fn.remotesource = function( method ) {
    if ( Touchee.RemoteSource[method] )
      return Touchee.RemoteSource[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    else if ( typeof method === 'object' || ! method )
      return Touchee.RemoteSource.init.apply( this, arguments );
    else
      $.error( 'Method ' +  method + ' does not exist on jQuery.remotesource' );
  };
  
})(jQuery);