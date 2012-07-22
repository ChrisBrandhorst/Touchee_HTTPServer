// _size:               size of viewport
// _contentSize:        size of contents
// contentSize:         size of contents
// adjustedContentSize: max of viewport & contents size

iAd.ScrollView.CONTENT_TOUCHES_DELAY = 0;

iAd.ScrollIndicator.prototype.setWidth = function (a) {
    this.middle.style.width = a - iAd.ScrollIndicator.END_SIZE * 2 + 'px';
    this.end.style.webkitTransform = "translate3d(" + (a - iAd.ScrollIndicator.END_SIZE) + "px,0,0)";
    this._width = a
};
iAd.ScrollIndicator.prototype.setHeight = function (a) {
    this.middle.style.height = a - iAd.ScrollIndicator.END_SIZE * 2 + 'px';
    this.end.style.webkitTransform = "translate3d(0," + (a - iAd.ScrollIndicator.END_SIZE) + "px,0)";
    this._height = a
};

iAd.ScrollView.prototype.refreshContentSize = function() {
  this.setContentSize(new iAd.Size(this._hostingLayer.scrollWidth, this._hostingLayer.scrollHeight));
};

iAd.ScrollView.prototype.resize = function(size) {
  
  if (!(size instanceof iAd.Size))
    size = new iAd.Size(this.layer.offsetWidth, this.layer.offsetHeight);
  
  this._hostingLayer.style.width = size.width + 'px';
  this._hostingLayer.style.height = '';
  this._hostingLayer.style.height = this._hostingLayer.scrollHeight + 'px';
  var newContentSize = new iAd.Size(size.width, this._hostingLayer.scrollHeight);
  
  this.setContentOffset(
    new iAd.Point(0, Math.min(
      this._contentOffset.y,
      newContentSize.height
    ))
  );
  
  this._size = size;
  this.setContentSize(newContentSize);
  this.adjustContentSize(false);
  this.refreshContentSize();
  
};

iAd.ScrollView.prototype.clearScrollContent = function() {
  this._hostingLayer.innerHTML = "";
};

iAd.ScrollView.prototype.append = function(content) {
  if (iAd.Utils.objectIsString(content))
    this._hostingLayer.innerHTML += content;
  else if (content instanceof Element)
    this._hostingLayer.appendChild(content);
  else if (jQuery && (content instanceof jQuery))
    $(this._hostingLayer).append(content);
  this.refreshContentSize();
};

iAd.ScrollView.prototype.setScrollContent = function(content) {
  this.clearScrollContent();
  this.addScrollContent(content);
};


(function($){
  
  var ScrollView = {
    
    AdClass: 'ad-scroll-view',
    
    init: function(options) {
      
      options = $.extend({
        selectedClass:  'selected',
        selectable:     'tr, li',
        keepSelection:  true,
        select:         function(){}
      }, options);
      
      return this.each(function(){
        var view = this._scrollview;
        var $this = $(this);
        
        // Refresh
        if (view instanceof iAd.ScrollView) {
          view.resize();
          // view.refreshContentSize();
        }
        
        // Create
        else {
          if (!this.id)
            this.id = 'scroll_view_' + ($('.' + ScrollView.AdClass).length + 1);
          this._scrollview = view = new iAd.ScrollView('#' + this.id);
          view.horizontalScrollEnabled = options.horizontal ? true : false;
          view.refreshContentSize();
          
          // Set selection stuff
          var oldSelection;
          var newSelection;
          
          $this
            .bind(iAd.START_EVENT, function(ev){
              var newS = $(ev.target).closest(options.selectable);
              if (newS.length) {
                var old = $this.find('.' + options.selectedClass).first();
                if (old.length) {
                  if (old[0] == newS[0]) return;
                  oldSelection = old.removeClass(options.selectedClass);
                }
                newSelection = newS.addClass(options.selectedClass);
              }
            })
            .bind(iAd.END_EVENT, function(ev){
              // Only called when we have not been dragging
              if (newSelection) {
                if (!options.keepSelection)
                  newSelection.removeClass(options.selectedClass);
                newSelection = null;
                if (typeof options.select == 'function')
                  options.select.call($(ev.target).closest(options.selectable), ev, $this);
              }
              oldSelection = null;
            })
            .bind(iAd.ScrollView.WILL_BEGIN_DRAGGING, function(){
              if (newSelection) {
                newSelection.removeClass(options.selectedClass);
                newSelection = null;
              }
            })
            .bind(iAd.ScrollView.DID_END_DRAGGING, function(){
              if (oldSelection) {
                oldSelection.addClass(options.selectedClass);
                oldSelection = null;
              }
            });
          
        }
        
      });
    },
    
    scrollTop: function(y) {
      if (typeof y != 'number')
        return this[0]._scrollview._contentOffset.y;
      else {
        this[0]._scrollview.setContentOffset(new iAd.Point(0, y));
        return this;
      }
    },
    
    object: function() {
      return this[0]._scrollview;
    },
    
    setResize: function() {
      $(window).delaybind('resize.scrollview', function(ev){
        var elements = document.getElementsByClassName(ScrollView.AdClass);
        for (var i = 0; i < elements.length; i++)
          elements[i]._scrollview.resize();
      }, 100);
      
    }
    
  };
  
  
  // Set scrollview as jQ function
  $.fn.scrollview = function( method ) {
    if ( ScrollView[method] )
      return ScrollView[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    else if ( typeof method === 'object' || ! method )
      return ScrollView.init.apply( this, arguments );
    else
      $.error( 'Method ' +  method + ' does not exist on jQuery.scrollview' );
  };
  
  // Do on window resize
  ScrollView.setResize();
  
})(jQuery);