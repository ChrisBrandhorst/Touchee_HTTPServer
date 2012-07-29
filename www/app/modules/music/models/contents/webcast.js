define([
  'Underscore',
  'Backbone',
  'models/contents'
], function(_, Backbone, Contents){
  
  var WebcastContents = Contents.extend({
    
    getUrl: function(id) {
      var filter = {};
      filter[this.idAttribute] = id;
      return ["control", "play", "container", this.container.id, this.filter.toString(filter)].join("/");
    }
    
  });
  
  return WebcastContents;
  
});