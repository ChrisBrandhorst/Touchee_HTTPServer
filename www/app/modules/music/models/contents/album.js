define([
  'Underscore',
  'Backbone',
  'models/contents'
], function(_, Backbone, Contents){
  
  var AlbumContents = Contents.extend({
    
    getUrl: function(id) {
      return [this.url(), 'track', this.filter.toString({albumid:id})].join("/");
    }
    
  });
  
  return AlbumContents;
  
});