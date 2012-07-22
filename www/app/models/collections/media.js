define([
  'Underscore',
  'Backbone',
  'models/medium'
], function(_, Backbone, Medium){
  
  var Media = Backbone.Collection.extend({
    
    model:  Medium,
    url:    "media",
    sync:   Backbone.readOnlySync,
    
    parse:  function(response) {
      return response.media.items;
    },
    
    getLocal: function() {
      return this.find(function(medium){
        return medium.isLocal();
      });
    },
    
    updateAll: function(data) {
      var Media = this;
      
      var ids = [];
      // Create new and update existing media
      _.each(data, function(m) {
        ids.push(m.id);
        var medium = Media.get(m.id);
        if (medium)
          medium.set(m);
        else
          Media.create(m);
      });
      
      // Remove media which are not present anymore
      this.each(function(m){
        if (ids.indexOf(m.id) == -1)
          m.destroy();
      });
      
      this.trigger('reset');
    }
    
  });
  
  return new Media;
  
});