define([
  'jquery'
], function($){
  
  $.Event.prototype.getCoords = function() {
    if (this.originalEvent.targetTouches)
      return {x:this.originalEvent.targetTouches[0].pageX,y:this.originalEvent.targetTouches[0].pageY};
    else
      return {x:this.pageX,y:this.pageY};
  };
  
});