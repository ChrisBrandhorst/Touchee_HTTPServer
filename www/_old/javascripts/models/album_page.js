var AlbumPage = new JS.Class(Page, {
  
  // Constructor
  initialize: function() {
    this.callSuper();
  },
  
  // Show album popup
  _doBuild: function() {
    
    // Build template
    this.$element = $('#albumTemplate').tmpl(this.data.result).data('object', this);
    this.$content = this.$element.children().first();
    
    // Append page to the view
    this.$content.addClass('invisible');
    this.$element.appendTo( this.collection.$content );
    PlaybackStatus.setPlaying(this.$content);
    
    // Set scrolling in album
    this.$content.find('.scrollview').scrollview({
      selectable:     'tr',
      keepSelection:  false,
      select: function(ev, scrollview) {
        page._select(this, this.attr('data-id'));
      }
    });
    
    // Set close callback on overlay
    var page = this;
    this.$element.bind(iAd.START_EVENT, function(ev){
      if (!$(ev.target).closest('.album').length)
        page.collection.back(page);
    });
  },
  
  //
  animate: function(back) {
    
    // Hide album
    if (back === true) {
      this.$element.unbind();
      this.$content
        .removeClass('flip')
        .css('-webkit-transform', this.oldTransform);
      var page = this;
      setTimeout(function(){
        page.selectedItem.removeClass('invisible');
        setTimeout(function(){
          page.$element.remove();
        },25);
      }, Application.options.animate ? 750 : 0);
      
      return;
    }
    
    // Get previous page
    var prevPage = this.prev();
    
    // Get the element that was clicked upon in the previous page
    this.selectedItem = prevPage.$content.find('[data-id=' + this.data.request.path[this.data.request.path.length - 1] + ']');
    
    // Get position in view of selected item
    var selectedPos = this.selectedItem.position();
    var selectedPosInView = {
      left: selectedPos.left,
      top:  selectedPos.top - Math.round(prevPage.scrollTop())
    };
    
    // Set placeholder position
    this.$content.css(selectedPosInView);
    
    // Do positioning
    var actualTop = selectedPosInView.top + this.$content.css('marginTop').numberValue();
    var actualLeft = selectedPosInView.left + this.$content.css('marginLeft').numberValue();
    var selectedMarginTop = this.selectedItem.css('marginTop').numberValue();
    var selectedMarginLeft = this.selectedItem.css('marginLeft').numberValue();
    
    var diffY = Math.min(
      prevPage.$content[0].clientHeight - this.$content[0].offsetHeight - selectedMarginTop,
      Math.max(selectedMarginTop, actualTop)
    ) - actualTop;
    var diffX = Math.min(
      prevPage.$content[0].offsetWidth - this.$content[0].offsetWidth - selectedMarginLeft * 2,
      Math.max(selectedMarginLeft, actualLeft)
    ) - actualLeft;
    
    // Store old transform
    this.oldTransform = this.$content.css('-webkit-transform');
    
    // Flip it!
    this.selectedItem.addClass('invisible');
    this.$content
      .removeClass('invisible')
      .addClass('flip')
      .css('-webkit-transform', "scale(1,1) translate(" + diffX + "px," + diffY + "px)");
    
  }
  
});