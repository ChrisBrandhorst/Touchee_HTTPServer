// iAd.ScrollView.DESIRED_ANIMATION_FRAME_RATE = 1000 / 60; // 1000 / 60
// iAd.ScrollView.ACCELERATION = 15; // 15
// iAd.ScrollView.DECELERATION_FRICTION_FACTOR = 0.95; // 0.95
// iAd.ScrollView.PENETRATION_DECELERATION = 0.08; // 0.08
// iAd.ScrollView.PENETRATION_ACCELERATION = 0.15; // 0.15

(function($){
  
  var BufferedContent = {
    
    // Default options
    defaultOptions: {
      className:  'buffered',
      elements:   '.buffered',
      dummyData:  ["&nbsp;","&nbsp;","&nbsp;","&nbsp;","&nbsp;","&nbsp;","&nbsp;","&nbsp;","&nbsp;","&nbsp;"],
      minCount:   1000,
      rows:       30
    },
    
    // Initialization
    init: function(options) {
      options = $.extend({}, BufferedContent.defaultOptions, options);
      
      return this.each(function(){
        var $this = $(this);
        
        // Set scrollview on the containing element
        $this.scrollview(options.scrollview);
        var scrollview = $this.scrollview('object');
        
        // Store data in element
        var config = {
          options:        options,
          scrollview:     scrollview,
          $scrollContent: $(scrollview._hostingLayer)
        };
        $this.data('bufferedcontent', config);
        
        // Set scrollview callbacks for refreshing
        $this
          .bind(iAd.ScrollView.WILL_BEGIN_DRAGGING, function(ev){
            // console.warn('begin dragging');
            config.refreshCalled = false;
          })
          .bind(iAd.ScrollView.DID_END_DRAGGING, function(){
            // console.warn('end dragging');
            if (!scrollview.decelerating)
              $this.bufferedcontent('render');
          })
          .bind(iAd.ScrollView.DID_SCROLL, function(){
            config.scrolling = true;
            if ((!config.refreshCalled && scrollview.decelerating && Math.abs(scrollview.decelerationVelocity.y) < 10)) { // !scrollview.dragging || 
              config.refreshCalled = true;
              $this.bufferedcontent('render');
            }
            // if (!config.refreshCalled)
            //   BufferedContent.setPosition(config);
          })
          .bind(iAd.ScrollView.WILL_BEGIN_DECELERATING, function(){
            // console.warn('begin decelerate');
            // if (options.positionEl)
            //   options.positionEl.removeClass('invisible');
          })
          .bind(iAd.ScrollView.DID_END_DECELERATING, function(){
            // console.warn('end decelerate');
            if (!config.refreshCalled) {
              config.refreshCalled = true;
              $this.bufferedcontent('render');
            }
            config.scrolling = false;
          })
          .bind(iAd.END_EVENT, function(){
            if (config.scrolling) {
              config.refreshCalled = true;
              $this.bufferedcontent('render');
              config.scrolling = false;
            }
          });
        
        // Set resize callback to recalculate how many items can be displayed in the content area
        // $(window).bind('resize.bufferedcontent', function(ev){ BufferedContent.resize.call($this, ev); } );
        BufferedContent.bindResize($this);
        
        // Set position element
        // if (options.positionEl) {
        //   options.positionEl = $(options.positionEl);
        //   $this.prepend(options.positionEl);
        // }
        
        // Initial refresh
        $this.bufferedcontent('refresh', true);
      });
      
    },
    
    // Refreshes the content. Can be used when data has been changed.
    // - Re-gets all elements
    // - Re-renders the content
    // - Refreshes 
    // If full is true, the following actions are performed first (not necessary when 
    // only the data is changed):
    // - Recalculates the sizes of the items
    // - Resizes the entire content
    refresh: function(full) {
      
      // Loop through all buffered contents
      this.each(function(){
        var $this = $(this);
        
        // Get config
        var config = $this.data('bufferedcontent');
        
        config.buffer = config.buffer || {};
        config.afterRefresh = true;
        
        // Get all items which should be buffered
        var elements = typeof config.options.elements == 'string' ? config.$scrollContent.children(config.options.elements) : config.options.elements;
        
        // If there are none, select all elements with the tagname which is found first
        if (!elements.length) {
          elements = config.$scrollContent.children('table,ul,ol');
          elements = elements.filter(elements.first()[0].tagName).addClass(config.options.className);
        }
        config.elements = elements;
        
        // Do calculation and resize if we do a full refresh
        if (full) {
          $this.bufferedcontent('calculateItemSize');
          $this.bufferedcontent('resize');
        }
        
        // Count the total number of items
        var count = 0;
        config.elements.each(function(idx){
          count += config.options.count.call(this, this, idx);
        });
        config.buffer = count > config.options.minCount;
        
        // Render it!
        $this.bufferedcontent('render');
        config.afterRefresh = false;
        
      });
      
      this.data('bufferedcontent').scrollview.refreshContentSize();
      
      return this;
    },
    
    // Calculates the size of each item in the content
    calculateItemSize: function() {
      
      // Loop through all buffered contents
      return this.each(function(){
        
        // Get config
        var config = $(this).data('bufferedcontent');
        var sizes = {};
        
        // Loop through all container elements within the content
        config.elements.each(function(idx){
          var $container = $(this);
          var size;
          var dummy = null;
          
          // If we have no children, create a dummy
          if (!$container.children('tr, li').length) {
            dummy = $(config.options.template.call(this, this, idx, config.options.dummyData)).css('visibility','hidden');
            this.appendChild(dummy[0]);
          }
          
          // If we have a table, get the height based on the inner height of the table
          // and the number of rows
          if ($container.is('table')) {
            size = { height: $container.innerHeight() / $container.find('tr').length };
          }
          
          // If we have a list, get both the height and width including margin, border and padding
          else {
            var first = $container.children('li:first-child');
            size = {
              height: first.outerHeight(true),
              width:  first.outerWidth(true)
            }
          }
          
          // Remove the dummy if set
          if (dummy)
            dummy.remove();
          
          // Store the size for this container
          sizes[this] = size;
        });
        
        // Store the sizes of the containers in the config
        config.sizes = sizes;
      });
      
    },
    
    // Bind the resize handler
    // This function makes sure that the resize handler is not called unneeded and
    // ensures that removed elements are no longer resized.
    bindResize: function(bufferedcontent, remove) {
      if (remove) {
        this.boundForResize = this.boundForResize.not(bufferedcontent);
        if (!this.boundForResize.length) {
          $(window).unbind('resize.bufferedcontent');
          delete this.boundForResize;
        }
      }
      else {
        if (!this.boundForResize) {
          this.boundForResize = $();
          
          // 50 ms, so it is refreshed before scrollview is resized
          $(window).delaybind('resize.bufferedcontent', function(ev){
            BufferedContent.refresh.call(BufferedContent.boundForResize, ev);
            // Render again once it is resized, so we render the section which is in view after forced scroll
            setTimeout(function(){ BufferedContent.render.call(BufferedContent.boundForResize, ev); }, 100);
          }, 50);
        }
        this.boundForResize = this.boundForResize.add(bufferedcontent);
      }
      
    },
    
    // Called when the window is resized in order to resize the content
    // - Calculates how many items are viewed in the current size of the buffered content
    // - Re-renders
    // - Resizes the scrollview
    resize: function(ev) {
      // Loop through all buffered contents
      return this.each(function(){
        
        // Get config
        var config = $(this).data('bufferedcontent');
        
        // Remove from resize handler if we have no config (item was removed from DOM)
        if (!config)
          return BufferedContent.bindResize(this, true);
        
        // Get bounds and init capacities
        var bounds = {height: this.clientHeight, width: this.clientWidth };
        config.capacities = {};
        
        // Loop through all container elements within the content
        config.elements.each(function(idx){
          var capacity = {
            vert: Math.ceil(bounds.height / config.sizes[this].height + 1),
            hori: (
              this.tagName.toLowerCase() == 'table'
                ? 1
                : Math.floor(bounds.width / config.sizes[this].width)
            )
          };
          capacity.total = capacity.vert * capacity.hori;
          config.capacities[this] = capacity;
        });
        
      });
    },
    
    // Renders the visible portion of the view
    render: function() {
      var start = new Date();
      
      this.each(function(){
        var $this = $(this);
        var config = $this.data('bufferedcontent');
        
        // Get config
        var config = $(this).data('bufferedcontent');
        var scrollview = config.scrollview;
        var bounds = {height: this.clientHeight, width: this.clientWidth };
        
        // Check whether we need to render the content fully
        var fullRender = !config.buffer && config.afterRefresh;
        
        // Loop through all container elements within the content
        config.elements.each(function(idx){
          var firstInView, lastInView, capacity, size;
          
          // Get the total number of rows for this element
          var count = config.options.count.call(this, this, idx);
          
          // If we have a full render, the first and last in view are easily retrieved
          if (fullRender) {
            firstInView = 0;
            lastInView = count - 1;
          }
          
          // If we have to buffer the element
          else if (config.buffer) {
            
            // Get the sizes of the elements within and the capacity of the element
            size = config.sizes[this];
            capacity = config.capacities[this];
            
            // Calculate the first and last in view based on the viewport
            firstInView = Math.floor((scrollview._contentOffset.y - (this.offsetTop - this.style.marginTop.numberValue())) / size.height) * capacity.hori;
            lastInView = firstInView + capacity.vert * capacity.hori - 1;
            
            // Modify the first in view to take into account the additional rows
            firstInView = Math.max(0, firstInView - config.options.rows * capacity.hori);
            lastInView = Math.min(count - 1, lastInView + config.options.rows * capacity.hori);
            
            // Make sure all is within bounds
            firstInView = Math.min(count - 1, firstInView);
            lastInView = Math.max(0, lastInView);
            
            // If we have a table, make sure we always render an even amount (because of odd/even styling)
            if (firstInView % 2 > 0 && this.tagName.toLowerCase() == 'table')
              firstInView--;
          }
          
          // Render it!
          if (fullRender || config.buffer) {
            
            // Use custom rendered
            if (config.options.render) {
              config.options.render.call(this, this, idx, firstInView, lastInView);
            }
            
            // Use default rendering
            else if (config.options.data && config.options.template) {
              
              // Get the data
              var data = config.options.data.call(this, this, idx, firstInView, lastInView);
              
              // Build HTML, based on template
              var html = [];
              for(i = 0; i < data.length; i++)
                html.push(config.options.template.call(this, this, idx, data[i], firstInView + i));
              html = html.join("");
              
              // Set margins and HTML
              // if (!fullRender)
              //   this.style.marginTop = (firstInView / capacity.hori) * size.height + 'px';
              // this.innerHTML = html;
              // if (!fullRender)
              //   this.style.marginBottom = Math.ceil((count - 1 - lastInView) / capacity.hori) * size.height + 'px';
              
              document.getElementById('query').value = (new Date() - start);
              if (!fullRender) {
                var marginTop = (firstInView / capacity.hori) * size.height;
                var marginBottom = Math.ceil((count - 1 - lastInView) / capacity.hori) * size.height;
                if (this.nextSibling)
                  this.nextSibling.style.marginTop = marginTop + marginBottom + 'px';
                else
                  this.parentNode.style.paddingBottom = marginTop + marginBottom + 'px';
                this.style.webkitTransform = "translateY(" + marginTop + "px)";
              }
              this.innerHTML = html;
              
            }
          }
          
        });
        
        // Images
        // $('[data-image]', config.elements).each(function(){
        //   var item = this;
        //   var img = new Image();
        //   var src = item.getAttribute('data-image');
        //   img.onload = function() { item.style.backgroundImage = "url(" + src + ")"; };
        //   img.src = src;
        // });
        
        // Hide position element
        // if (config.options.positionEl)
        //   config.options.positionEl.addClass('invisible');
        
      });
      
      console.warn("Rendered in (ms): " + (new Date() - start));
      
      return this;
    },
    
    // Sets the position indicator
    // TODO: fix for multiple elements. Current setup is WRONG...
    setPosition: function(config) {
      if (typeof config.options.position != 'function') return;
      
      config.elements.each(function(idx){
        var firstInView, lastInView, capacity, size;
        var count = config.options.count.call(this, this, idx);
        var scrollview = config.scrollview;
        
        size = config.sizes[this];
        capacity = config.capacities[this];
      
        firstInView = Math.floor((scrollview._contentOffset.y - (this.offsetTop - this.style.marginTop.replace("px",''))) / size.height * capacity.hori);
        // firstInView = Math.max(0, firstInView);
        middleInView = firstInView + Math.floor(capacity.vert * capacity.hori / 2);
        
        if (middleInView >= 0 && middleInView < config.options.count.call(this, this, idx)) {
          config.options.position.call(this, this, idx, middleInView, config.options.positionEl);
          return;
        }
        
      });
    },
    
    // Scrolls the content to the given position (in portion of total height or item #)
    scrollTo: function(pos, isItemNo) {
      this.each(function(){
        var $this = $(this);
        var config = $this.data('bufferedcontent');
        
        if (isItemNo) {
          // Assumes there is only one list
          var element = config.elements[0];
          pos = Math.floor(pos / config.capacities[element].hori);
          pos = pos * config.sizes[element].height;
        }
        else {
          pos = pos * config.scrollview._hostingLayer.offsetHeight;
        }
        
        if (config.scrollCallbackTimeout) {
          clearTimeout(config.scrollCallbackTimeout);
          delete config.scrollCallbackTimeout;
        }
        config.scrollCallbackTimeout = setTimeout(function(){
          $this.scrollview('scrollTop', pos);
          $this.bufferedcontent('render');
        }, 10);
      });
    },
    
    // Gets or sets the vertical scroll posiiton in pixels
    scrollTop: function(pos) {
      var $this = $(this);
      if (typeof pos != 'number')
        return $this.scrollview('scrollTop');
      else {
        $this.scrollview('scrollTop', pos);
        $this.bufferedcontent('render');
      }
    }
    
  };
  
  
  
  // Set bufferedlist as jQ function
  $.fn.bufferedcontent = function( method ) {
    if ( BufferedContent[method] )
      return BufferedContent[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    else if ( typeof method === 'object' || ! method )
      return BufferedContent.init.apply( this, arguments );
    else
      $.error( 'Method ' +  method + ' does not exist on jQuery.bufferedcontent' );
  };
  
})(jQuery);
