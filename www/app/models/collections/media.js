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
    }
    
  });
  
  return new Media;
  
});