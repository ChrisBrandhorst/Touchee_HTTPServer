(function(){
  
  Touchee.Content = {
    
    init: function() {
      var $this = this;
      
      this.artworkSelection = $('#artwork_selection');
      this.rowSelection = $('#row_selection');
      this.contentElement = $('#content');
      
      // Init scrolling and clicking behaviour
      $('.content_container').inertscroll({
        down:   this.select,
        start:  this.deselect,
        up:     this.act
      });

      // Init scroller
      $('#scroller').scroller({
        onhover: function(response) {
          var container = $this.activeContainer();
          var pos = null;
          
          if (typeof response == 'string') {
            if (response == '#') pos = 0;
            else {
              var el = document.getElementsByName('letter-' + response)[0];
              if (el) pos = $(el).position().top + container.scrollTop();
            }
          }
          else {
            pos = response * (container[0].scrollHeight - container[0].clientHeight);
          }
          if (pos != null) {
            container.scrollTop(pos);
            container.scroll();
          }
        }
      });
      
      // Init navigation buttons
      var navButtons = "back prev next".split(' ');
      for (i in navButtons) {
        $('#nav_' + navButtons[i]).
          bind('mouseup touchend', this.Navigation[navButtons[i]]);
      }
      
      // Set action on scroll
      $('.content_container').delay('scroll', this.loadArtwork, 100);
    },
    
    // Caculates parameters needed for scrolling
    calculateScrollParams: function(container) {
      if (container instanceof jQuery) container = container[0];
      var $container = $(container);
      var section;
      var $item, itemHeight, itemWidth;
      
      if ( (section = $container.find('table.result_section')).length ) {
        itemHeight = $.numFromCSS( section.css('line-height') );
        itemWidth = container.clientWidth;
      }
      else if ( $container.find('ul.result_section').length ) {
        $item = $('li', $container).first();
        itemHeight = $item.outerHeight(true);
        itemWidth = $item.outerWidth(true);
      }
      
      var data = {
        horCount:   Math.floor(container.clientWidth / itemWidth),
        verCount:   Math.ceil(container.clientHeight / itemHeight) + 1,
        itemHeight: itemHeight
      };
      
      $container.data('scroll-params', data);
    },
    
    // Load the art for the container this function is called for
    loadArtwork: function() {
      var container = this instanceof jQuery ? this[0] : this;
      var $container = $(container);
      var data = $container.data('scroll-params');

      // Re-calculate scroll params (perhaps we have been rotated)
      Touchee.Content.calculateScrollParams($container);

      $container.find('.result_section').each(function(){
        var section = this;
        
        var firstLineInView = Math.floor( (container.scrollTop - this.offsetTop) / data.itemHeight);
        var first = firstLineInView * data.horCount;
        var last = first + data.verCount * data.horCount;
        
        if (last < 0) return;
        first = Math.max(first, 0);

        // Set album art in tracks list
        if (section.tagName.toLowerCase() == 'table') {
          var names = $.unique(
            $.map( $('td:nth-child(4)', section).find('br, hr').slice(first, last), function(el){
              return el.getAttribute('name');
            })
          );
          
          var artColumn = $('td:first-child', section);
          var span;
          $.each(names, function(i,name){
            Touchee.Content.setArtwork(artColumn.find('[name=' + name + ']')[0]);
          });
        }
        
        // Set album art in album-art list
        else if (section.tagName.toLowerCase() == 'ul') {
          $('li', section).slice(first, last).each(function(){
            Touchee.Content.setArtwork(this);
          });
        }
        
      });
      
    },

    // Sets the artwork for the given element
    setArtwork: function(el, hasArtwork) {
      // if (typeof el != 'object') {
      //   el = $('.content_container_full:visible').first().find('[data-id='+el+']')[0];
      // }
      
      var id = el.getAttribute('data-id');

      if (el.style.backgroundImage == "" && id && el.artworkLoading !== true && el.hasArtwork !== false) {
        el.artworkLoading = true;
        Touchee.Commands.send({action:'artwork',item:id});
      }
    },
    
    // Called when some artwork is received
    gotArtwork: function(data) {
      $('[data-id='+data.id+']').each(function(){
        this.artworkLoading = false;
        this.hasArtwork = data.hasArtwork;
        if (data.hasArtwork === true)
          this.style.backgroundImage = "url(data:image/jpeg;base64," + data.data + ")";
      });
    },

    // Shows an album
    showAlbum: function(content, container) {
      
      // Get important data
      var selected = container.data('selection').object;
      var position = selected.position();
      
      // Set the album HTML  
      var album = $('#albumTemplate').tmpl(content).appendTo(container);
      var newPos = {
        top: position.top + container.scrollTop(),
        left: position.left + container.scrollLeft()
      };
      album.css(newPos);
      this.setArtwork(album.find('.front')[0]);
      this.setArtwork(album.find('h1')[0]);
      
      // Init scrolling
      $('> .back > div', album).inertscroll({
        down:   Touchee.Content.select,
        start:  Touchee.Content.deselect,
        up:     Touchee.Content.act
      });
      
      // Set now playing
      album.find('tr[data-id=' + Touchee.Controls.nowPlayingID + ']').addClass('playing');

      // Do positioning
      var actualTop = position.top + $.numFromCSS(album.css('marginTop'));
      var actualLeft = position.left + $.numFromCSS(album.css('marginLeft'));
      var selectedMargin = $.numFromCSS(selected.css('marginTop'));
      
      var diffY = Math.min(
        container[0].clientHeight - album.outerHeight() - selectedMargin,
        Math.max(selectedMargin, actualTop)
      ) - actualTop;
      var diffX = Math.min(
        container[0].clientWidth - album.outerWidth() - selectedMargin * 2,
        Math.max(selectedMargin, actualLeft)
      ) - actualLeft;
      
      var oldTransform = album.css('-webkit-transform');
      
      // Hide album when clicked on parent container
      this.setOverlay(container, function(ev){
        container.unbind('mouseup.album touchend.album');
        Touchee.Status.setItem(null);
        album.
          removeClass('flip').
          css('-webkit-transform', oldTransform);
        setTimeout(function(){
          selected.removeClass('invisible');
          album.remove();
          Touchee.Content.deselect(selected);
        }, Touchee.animate ? 750 : 0);
      });
      
      // Flip it!
      selected.addClass('invisible');
      album.
        addClass('flip').
        css('-webkit-transform', "scale(1,1) translate(" + diffX + "px," + diffY + "px)");
      
    },
    
    // Set the given content in the view
    set: function(data, scrollTop, overlay) {
      var page = overlay ? 2 : 1;
      var content_page = $('#content_page_' + page);
      
      // Build resulting DOM-objects
      var result;
      if (data.result) {
        result = Touchee.Builder.build(data);
        result.addClass(data.result.containerType + " result_section");
        
        content_page.attr('data-container-type', data.result.containerType);
        content_page.attr('data-content-type', data.result.contentType);
      }
      
      // Add to existing results
      if (data.source) {
        
        // Generate container if not exists
        var sourceContainer = content_page.find('.source.' + data.source).first();
        var sourceHeader = sourceContainer.children('h2').first();
        var sourceContent = sourceHeader.next(':not(.loading, .more, .results)');
        if (!sourceContainer.length) {
          sourceContainer = $('<div/>').addClass('source ' + data.source).appendTo(content_page);
          sourceHeader = $('<h2/>').addClass('source ' + data.source).text(data.source.capitalize()).appendTo(sourceContainer);
        }
        
        // Show results
        if (data.result) {
          sourceContainer.find('.loading, .results, .more').remove();
          
          if (result.is('ul')) {
            if (!sourceContent.length)
              result.appendTo(sourceContainer);
            else
              sourceContent[0].innerHTML += result[0].innerHTML;
          }
          else
            result.appendTo(sourceContainer);
          
          // Set result count
          var resultCount;
          if (result.is('ul'))
            resultCount = sourceContainer.find('li').length;
          else {
            resultCount = 0;
            sourceContainer.find(':data(trackIDs)').each(function(){
              resultCount += $(this).data('trackIDs').length;
            });
          } 
          sourceContainer.append( $("<div/>").addClass('results').text(resultCount + " " + data.result.contentType + "s") );
          
          // Add more button
          if (data.nextOffset > 0)
            $("<div/>").addClass('more').bind('mouseup touchend', function(){
              Touchee.Commands.selected(Touchee.Commands.MORE, data.nextOffset);
            }).appendTo(sourceContainer);
        }
        
        // Show loading indicator
        else {
          if (!data.offset)
            sourceContainer.find(':not(h2)').remove();
          else
            sourceContainer.find('.loading, .more').remove();
          $("<div/>").addClass('loading').appendTo(sourceContainer);
        }
        
      }
      
      // Generate new view
      else {
        // Set object in view
        content_page[0].innerHTML = "";
        content_page[0].appendChild(result[0]);
        content_page[0].scrollTop = scrollTop;
        
        // Set results line
        var resultCount = result.is('ul') ? result.children('').length : result.data('trackIDs').length;
        content_page.append( $("<div/>").addClass('results').text(resultCount + " " + data.result.contentType + "s") );
      }
      
      // Set prev/next buttons
      if (page > 1) {
        this.Navigation.set( content_page.next('.content_container_full').data('selection') );
        $('#navigation').show();
        $('#viewmodes').hide();
      }
      // Set viewmode
      else {
        Touchee.Sources.setViewmodes(Touchee.status.controllers[data.controller].viewmodes, data.viewmode);
        $('#navigation').hide();
        $('#viewmodes').show();
      }
      
      // Hide other containers
      content_page.prevAll('.content_container_full').hide();
      
      // Show page
      content_page.show();
      
      // Show alphabet if available
      $('#scroller').show().scroller('alphabet', data.alphabet);
      
      // Calculate params for scrolling
      this.calculateScrollParams(content_page);
      
      // Do initial loading of images
      this.loadArtwork.call(content_page);
      
      // Do scrolling!
      // content_page.scrollview();
      
      // Set now playing
      Touchee.Controls.setNowPlaying();
    },
    
    // Gets the active container
    activeContainer: function() {
      return this.contentElement.find('.content_container:visible').first();
    },
    
    // Called when some item on the content container is to be selected
    select: function(ev) {
      var target = $(ev.target || ev);
      var container = Touchee.Content.getContainer(target);
      var containerType = container.attr('data-container-type');
      var contentType = container.attr('data-content-type');
      
      // Bail out when over count or loader
      if (target.closest('.loading, .results').length > 0 || target[0] == container[0]) return;
      
      // Album popup
      if ($.inArray(containerType, ['album']) > -1) {
        var selected = target.closest('tr');
        if (selected.length)
          selected.addClass('selected');
      }
      
      // Album art view
      if ($.inArray(containerType, ['artists', 'albums']) > -1) {
        var selected = target.closest('li');
        if (selected.length && !(containerType == 'albums' && $('.album:visible').length)) {
          var pos = selected.position();
          Touchee.Content.artworkSelection.css({
            left: pos.left,
            top:  pos.top + container.scrollTop()
          }).appendTo(container).show();
        }
      }
      
      // Tracks list view
      else if ($.inArray(containerType, ['tracks', 'artist']) > -1) {
        var table = target.closest('table');
        var x = (ev.originalEvent.touches ? ev.originalEvent.touches[0].pageX : ev.pageX) - container.offset().left;
        if (x < 150) return;
        var y = (ev.originalEvent.touches ? ev.originalEvent.touches[0].pageY : ev.pageY) - table.offset().top;
        
        var rowHeight = parseInt(table.css('line-height'));
        var row = Math.floor(y / rowHeight);
        var selected = table.data('trackIDs')[row];
        
        if (selected)
          Touchee.Content.rowSelection.
            css('top', row * rowHeight + table.position().top + container.scrollTop()).
            appendTo(container).show();
      }
      
      // Store stuff
      var isObject = typeof selected == 'object';
      var id = isObject ? selected.attr('data-id') : selected;
      
      // Do not store selection and remove old one if there is none
      if (typeof id == 'undefined') {
        container.removeData('selection');
        return;
      }
      
      // Set selected class if we have an object
      if (isObject) selected.addClass('selected');
      
      // Store the selection in the container
      var selectionObj = {
        containerType:  containerType,
        contentType:    contentType,
        id:             id,
        text:           isObject ? selected.attr('data-text') : id,
        object:         isObject ? selected : null
      };
      container.data('selection', selectionObj);
      
      //
      // if (ev.stopPropagation) ev.stopPropagation();
      
      return selectionObj;
    },
    
    // Called when some item on the content container is to be deselected
    deselect: function(ev, keepData) {
      var container = Touchee.Content.getContainer(ev);
      var selection = container.data('selection');
      if (selection && selection.object) selection.object.removeClass('selected');
      if (!keepData) container.removeData('selection');
      container.find('.selection').hide();
    },
    
    // Called when some item on the content container is to be acted upon
    act: function(ev) {
      var container = Touchee.Content.getContainer(ev);
      var selection = container.data('selection');
      
      if (selection) {
        Touchee.Commands.selected(selection.contentType, selection.id);
        Touchee.Content.deselect(ev, true);
      }
    },
    
    // Gets the content container for the given event
    getContainer: function(target) {
      return $(target.target || target).closest('.content_container');
    },
    
    // Sets an overlay for the given container. The given function is called when clicked on the overlay
    setOverlay: function(container, callback) {
      $('#content_container_overlay').
        css({
          width:  container.innerWidth(),
          height: container.innerHeight()
        }).
        bind('mouseup touchend', function(ev){
          callback.call(this);
          $('#content_container_overlay').hide();
          ev.stopPropagation();
          ev.preventDefault();
          return false;
        }).
        show();
    },
    
    Navigation: {
      
      set: function(selection) {
        this.selection = selection;
        $('#nav_back_type').text( selection.containerType.capitalize() );
        this.setButtons();
      },
      
      back: function() {
        $('.content_container_full:visible').first().hide().empty();
        
        var parentContainer = $('.content_container_full:visible');
        parentContainer.scrollTop(
          parentContainer.scrollTop() + 
          Touchee.Content.Navigation.selection.object.position().top
        );
        
        $('#navigation').hide();
        $('#viewmodes').show();
        
        Touchee.Status.setItem(null);
        Touchee.Content.deselect(parentContainer, false);
        Touchee.Commands.reload();
        
        return false;
      },
      
      prev: function(ev) { Touchee.Content.Navigation.skip(ev, 'prev'); return false; },
      next: function(ev) { Touchee.Content.Navigation.skip(ev, 'next'); return false; },
      skip: function(ev, direction) {
        if ($(ev.target).hasClass('disabled')) return;
        $('.content_container_full:visible').first().empty();
        var selection = Touchee.Content.select( this.selection.object[direction]() );
        Touchee.Commands.selected(selection.contentType, selection.id);
      },
      
      setButtons: function() {
        $('#nav_title').text( this.selection.text );
        $('#nav_prev').toggleClass('disabled', !this.selection.object.prevAll().length);
        $('#nav_next').toggleClass('disabled', !this.selection.object.nextAll().length);
      }
      
    }
    
    
  }
  
})(jQuery);