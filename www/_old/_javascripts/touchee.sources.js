(function(){
  
  Touchee.Sources = {
    
    // Init sources
    init: function() {
      // Set the container
      this.container = $('#sources > ul').empty();
      
      // Bind mousedown actions on viewmode buttons
      $('#viewmodes').bind('mousedown touchstart', Touchee.Sources.selectViewmode);
      
      $(window).resize(function(ev){return Touchee.Sources.resize.call(Touchee.Sources, ev);});
    },
    
    // Do interial scrolling for each new list of collections
    // Bind mouseup actions on collections
    initSourceScroll: function(source) {
      var $source = $(source);
      $source.inertscroll({
        down:   function(ev) {
          var li = $(ev.target).closest('li');
          
          if (!li.hasClass('selected')) {
            li.addClass('selected');
            $source.data('selected', li);
          }
        },
        start:  function(ev) {
          var li = $source.data('selected');
          if (li) {
            li.removeClass('selected');
            $source.removeData('selected');
          }
        },
        up:     function(ev) {
          var li = $source.data('selected');
          if (li) {
            Touchee.Sources.selectCollection(li);
            $source.removeData('selected');
          }
        }
      });
    },
    
    // Intelligently set the given controllers
    // If one already exists, leave it be
    setControllers: function(controllers) {
      // Add controllers
      var row;
      for(klass in controllers) {
        row = $('<li><h1>' + controllers[klass] + '</h1><div><ul></ul></div></li>').addClass(klass).attr('data-id', klass)
        this.container.append(row);
        Touchee.Sources.initSourceScroll(row.find('div'));
      }
      
      // Add callbacks
      this.container.find('> li h1').bind('mousedown touchstart', Touchee.Sources.selectController);
      // this.container.find('> li ul').bind('mousedown touchstart', Touchee.Sources.selectCollection);
    },
    
    // One of the controllers is selected
    selectController: function(target) {
      var target = $(target.target || target).closest('li');
      
      // Return if already opened
      if (target.hasClass('selected')) return false;
      
      var container = target.closest('ul');
      var oldOpen = container.find('> li.selected').removeClass('selected').find('> div');
      var itemHeight = target.outerHeight();
      var targetHeight =
        container.parent().height() - 
        itemHeight * (container.children('li').length);
      
      target.addClass('selected').find('> div').css('padding-bottom', '1px').animate({
        height: [targetHeight + 'px', 'linear']
      }, {
        duration: 200,
        step: function(now, fx) {
          oldOpen.css('height', targetHeight - Math.ceil(now) + 'px');
        },
        complete: function() {
          target.find('> div').css('padding-bottom', 0);//.scrollview();
        }
      });
      
      // If the last item is open, do not round the border
      var last = container.find('li').last();
      if (target[0] == last[0]) last.find('h1').removeClass('rounded');
      else                      last.find('h1').addClass('rounded');
      
      // Tell the command-station that the controller was selected
      if (target.attr('data-id') == 'music')
        Touchee.Commands.selected(Touchee.CONTROLLER, target.attr('data-id'));
      
      // Cancel event bubbling
      if (target.preventDefault) target.preventDefault();
      return false;
    },
    
    // Selects the first controller
    selectFirstController: function() {
      this.container.find('> li > h1').first().mousedown();
    },
    
    
    
    // Sets the content of one of the controllers
    setCollections: function(data) {
      var controller = this.container.find('li[data-id=' + data.id + ']');
      if (controller.length == 0) return;
      var collections = controller.find('div > ul').first();
      var selectedID = collections.children('li.selected').attr('data-id');

      var c, l, firstNew = null;
      for(i in data.collections) {
        c = data.collections[i];
        l = $('<li/>').attr('data-id', c.id).addClass(c.type).text(c.name);
        if (c.id == selectedID) l.addClass('selected');
        if (firstNew == null) firstNew = l;
        collections.append(l);
      }

      if (firstNew == null)
        collections.empty();
      else
        firstNew.prevAll().remove();

    },
    
    // Selects one of the collections
    selectCollection: function(target) {
      var target = $(target.target || target).closest('li');
      var container = target.closest('div');
      
      // Select the clicked element
      target.addClass('selected').siblings().removeClass('selected');
      
      // Tell the command-station that the collection was selected
      if (target.attr('data-id'))
        Touchee.Commands.selected(Touchee.COLLECTION, target.attr('data-id'));
    },
    
    
    
    // Set the given viewmodes in the filters-area
    setViewmodes: function(viewmodes, selected) {
      var container = $('#viewmodes');
      container.empty();
      for(id in viewmodes)
        container.append($('<li/>').attr('data-id', id).addClass(selected == id ? 'selected' : '').html(viewmodes[id]));
    },
    
    // Selects one of the viewmodes
    selectViewmode: function(target) {
      var target = $(target.target || target).closest('li');
      target.addClass('selected').siblings().removeClass('selected');
      
      // Tell the command-station that the viewmode was selected
      Touchee.Commands.selected(Touchee.VIEWMODE, target.attr('data-id'));
      
      // Cancel event bubbling
      if (target.preventDefault) target.preventDefault();
      return false;
    },


    // Resizes the sources view to fit in the current view
    resize: function(ev) {
      var selected = this.container.find('li.selected');
      var headerHeight = selected.children('h1').outerHeight();
      this.container.hide();
      selected.children('div').height(
        this.container.parent().height() - this.container.children('li').length * headerHeight
      );
      this.container.show();
    }
    
  }
  
})(jQuery);