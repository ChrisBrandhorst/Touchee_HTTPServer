define([
  'jquery',
  'Underscore',
  'Backbone'
], function($, _, Backbone){
  
  var Container = Backbone.Model.extend({
    
    getArtworkUrl: function(options) {
      options = options || {};
      var item = options.item;
      if (item) delete options.item;
      options = $.param(options);
      return this.url() + "/contents/artwork?" + options + (options.length ? "&" : "") + "item=" + (item || "");
    }
    
  });
  
  return Container;
});