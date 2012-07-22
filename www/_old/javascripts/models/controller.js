var Controller = new JS.Class({
  
  _collections: {},

  // Constructor
  initialize: function(id, name) {
    this.id = id;
    this.name = name;
    this.$element = $('#controllerTemplate').tmpl({id:id,name:name}).data('object', this);
    this._$list = this.$element.find('ul');
    
    // Set scrolling for controller
    var _this = this;
    var _selected;
    
  },

  // Get or set the collections for this controller
  collections: function(data) {
    if (typeof data != 'object' || !data.collections) return this._collections;
    
    // Loop through the given collections
    var updated = {}, collData, coll;
    for(i in data.collections) {
      collData = data.collections[i];
      coll = updated[collData.id] = this._collections[collData.id] || 
        new Collection(this, collData.id, collData.name, collData.type, collData.viewmodes);
      this._$list.append(coll.$element);
    }
    
    // Remove collections which are not available anymore
    for (i in this._collections) {
      collData = this._collections[i];
      if (!updated[collData.id])
        this._collections[collData.id].$element.remove();
    }
    this._collections = updated;
    
    // Update scrollview
    var controller = this;
    this.$element.children('div').scrollview({
      selectable: '.ad-scroll-view li',
      select: function(ev) {
        controller.collection.call(controller, this);
      }
    });
    
    // Select the first collection
    // this.collection(this._$list.children().first());
  },

  // Get or set the currently selected collection
  collection: function(target) {
    var id, $li;
    
    // Get the selected li and id
    switch(typeof target) {

      // Getter
      case 'undefined':
        return this._selected;
        break;
      
      // Called with object (can be event, jQuery, Collection or DOM object)
      case 'object':
        if (target.constructor == Collection) {
          $li = target.$element;
          id = target.id;
        }
        else {
          $li = $(target.target || target).closest('li');
          id = $li.attr('data-id');
        }
        break;
      
      // Called with controller ID as string
      case 'string':
        $li = this._$list.find('li[data-id=' + target + ']');
        id = target;
        break;
    }

    // Return if li is already selected
    var obj = $li.data('object');
    if (this._selected == obj) return false;
    this._selected = obj;
    
    // Select the clicked element if we do not have an event object
    if (!target.target)
      $li.addClass('selected').siblings().removeClass('selected');
    
    // Tell the command-station that the collection was selected
    console.warn("Telling application collection '" + obj.name + "' was selected")
    Application.collection(obj);
  },
  
  // Destroy this controller
  destroy: function() {
    for (i in this._collections)
      this._collections[i].destroy();
    this._collections = {};  
    this.$element.remove();
  }
  
});