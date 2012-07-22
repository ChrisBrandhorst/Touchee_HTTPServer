define([
  'Underscore',
  'Backbone'
], function(_, Backbone){
  
  Backbone.readOnlySync = function(method, model, options) {
    if (method != 'read')
      return;
    else
      Backbone.sync.apply(this, arguments);
  };
  
  Backbone.View.prototype.dispose = function(){
    this.remove();
    this.unbind();
    if (typeof this.onDispose == 'function')
      this.onDispose();
  };
  
});