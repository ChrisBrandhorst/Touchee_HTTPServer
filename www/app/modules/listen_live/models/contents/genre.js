define([
  'Underscore',
  'Backbone',
  'models/contents'
], function(_, Backbone, Contents){
  
  var GenreContents = Contents.extend({
    
    getUrl: function(genre) {
      return [this.url(), 'channel', this.filter.toString({genre:genre})].join("/");
    }
    
  });
  
  return GenreContents;
  
});