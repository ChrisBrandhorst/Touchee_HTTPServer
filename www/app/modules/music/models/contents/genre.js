define([
  'Underscore',
  'Backbone',
  'models/contents'
], function(_, Backbone, Contents){
  
  var GenreContents = Contents.extend({
    
    getUrl: function(id) {
      return [this.url(), 'artist', this.filter.toString({genre:id})].join("/");
    }
    
  });
  
  return GenreContents;
  
});