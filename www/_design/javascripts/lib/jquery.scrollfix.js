/**
 * ScrollFix v0.1
 * http://www.joelambert.co.uk
 *
 * Copyright 2011, Joe Lambert.
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */
 
(function($){
  
  $.fn.scrollfix = function() {
    this.each(function(){
      new ScrollFix(this);
    });
  };
  
})(jQuery);