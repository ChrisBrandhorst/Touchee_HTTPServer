define([
  'Underscore',
  'Backbone',
  'models/filter'
], function(_, Backbone, Filter){
  
  var Contents = Backbone.Model.extend({
    
    
    url: function() { return this.container.url() + '/contents'; },
    
    
    // Attribute to use for generating URLs of items within these contents
    idAttribute: 'id',
    
    
    // Constructor
    initialize: function(params) {
      this.container = params.container;
      this.filter = new Filter(params.filter);
    },
    
    
    // Modified fetch method for including type and filter parameters
    fetch: function(options) {
      options = _.extend({}, options, { data: {
        type:   this.get('type'),
        filter: this.filter.toString()
      }});
      Backbone.Model.prototype.fetch.call(this, options);
    },
    
    
    // Modified parse method
    parse: function(response) {
      
      // Get meta data
      if (response.contents.meta) {
        this.meta = response.contents.meta;
        delete response.contents.meta;
      }
      
      // Set the keys
      if (response.contents.keys) {
        this.keys = {};
        _.each(response.contents.keys, function(key, i) {
          this.keys[key] = i;
        }, this);
        delete response.contents.keys;
      }
      
      // Delete unnecessary containerID
      delete response.contents.containerID;
      return response.contents;
    },
    
    
    // Build the URL for the given item
    getUrl: function(id) {
      return [this.url(), 'item', id].join("/");
    },
    
    
    // Get the title for this content object
    getTitle: function() {
      return T.T.views[ this.get('type') ].toTitleCase();
    },
    
    
    // Get the view type for this contents
    getViewType: function() {
      return this.get('type');
    }
    
    
  });
  
  return Contents;
});