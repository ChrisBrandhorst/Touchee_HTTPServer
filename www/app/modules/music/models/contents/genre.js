define([
  'Underscore',
  'Backbone',
  'models/contents'
], function(_, Backbone, Contents){
  
  var GenreContents = Contents.extend({
    
    getUrl: function(id) {
      return [this.url(), this.filter.toString({type:'artist',genre:id})].join("/");
    }
    
  });
  
  return GenreContents;
  
});