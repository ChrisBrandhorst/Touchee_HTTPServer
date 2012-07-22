var Library = new JS.Class({

  // Hash containing controllers
  controllers: {},

  // Constructor
  initialize: function(config) {
    
    // Get the container from the UI
    this.$element = $('#library').empty().data('object', this);

    // Instantiate controllers and add them to UI
    var controller;
    for(id in config.controllers) {
      controller = new Controller(id, config.controllers[id]);
      this.controllers[id] = controller;
      this.$element.append(controller.$element);
    }

    // Bind callbacks to controller headers
    this.$element.find('h1').bind(iAd.START_EVENT, this.method('controller'));

    // Make sure library list is resized when window is
    $(window).resize(this.method('resize'));

    // Select first controller
    this.controller(this.$element.children().first());
  },

  // Get or set the currently selected controller
  controller: function(target) {
    var id, $li;

    // Get the selected li and id
    switch(typeof target) {

      // Getter
      case 'undefined':
        return this.$element.find('> li.selected').data('object');
        break;
      
      // Called with object (can be event, jQuery or DOM object)
      case 'object':
        $li = $(target.target || target).closest('li');
        id = $li.attr('data-id');
        break;
      
      // Called with controller ID as string
      case 'string':
        $li = this.$element.find('li[data-id=' + target + ']');
        id = target;
        break;
    }
    
    // Return if li is already selected
    if ($li.hasClass('selected')) return false;
    
    // Animate the opening of the controller
    var $selected = $li.siblings('.selected');
    if ($selected.length) {
      var targetHeight = $selected.children('div').outerHeight();
      var $ul = $li.children('div').css('height', targetHeight);
      
      setTimeout(function(){
        $li.addClass('selected');
        $selected.removeClass('selected');
        $selected.children('div').css('height', 0);
        $ul.css('height', '');
        
        $li.children('div').scrollview();
        
      }, $ul.css('-webkit-transition-duration').numberValue() * 1000);
    }
    else
      $li.addClass('selected').siblings().removeClass('selected');
    
    // Tell the command-station that the controller was selected
    Application.controller( $li.data('object') );
    
    return false;
  },
  
  // Get the given collection
  getCollection: function(collectionID, controllerID) {
    var coll;
    if (typeof controllerID != 'string') {
      for (id in this.controllers) {
        coll = this.getCollection(collectionID, id);
        if (coll) return coll;
      }
    }
    else {
      if (this.controllers[controllerID])
        coll = this.controllers[controllerID]._collections[collectionID]
      return coll;
    }
  },

  // Resizes the sources view to fit in the current view
  resize: function(ev) {
    var $selected = this.controller().$element;
    var headerHeight = $selected.children('h1').outerHeight();
    this.$element.hide();
    $selected.children('div').height(
      this.$element.parent().height() - this.$element.children('li').length * headerHeight
    );
    this.$element.show();
  },
  
  // Clears the library
  clear: function() {
    for (i in this.controllers)
      this.controllers[i].destroy();
  }

});