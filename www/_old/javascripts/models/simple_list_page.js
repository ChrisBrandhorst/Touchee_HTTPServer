var SimpleListPage = new JS.Class(Page, {
  
  // Constructor
  initialize: function() {
    this.callSuper();
  },
  
  // Build the simple list
  _build: function() {
    var page = this;
    var items = this.items;
    
    this.$content[0].innerHTML += '<table class="buffered"></table>';
    this.$content.append('<div class="count">' + items.length + ' ' + this.data.result.collectionType + '</div>');
    
    this.$content.bufferedcontent({
      minCount:   100,
      rows:       20,
      scrollview: {
        keepSelection: false,
        select: function(ev, scrollview) {
          page._select(this, this.attr('data-id'));
        }
      },
      data: function(container, containerIndex, start, end) {
        return typeof end == 'number' ? items.slice(start, end + 1) : items[start];
      },
      count: function(container, containerIndex) {
        return items.length;
      },
      template: function(container, containerIndex, data, itemIndex) {
        return ['<tr data-id="', data[0], '"', (PlaybackStatus.currentItem == data[0] ? ' class="playing"' : ''), '><td>', data[1], '</td><td>', data[2], '</td><td>', data[3], '</td><td>', data[5], '</td></tr>'].join("");
      },
      positionEl: '<table class="position"><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table>',
      position: function(container, containerIndex, itemIndex, positionEl) {
        var data = items[itemIndex];
        positionEl[0].rows[0].cells[1].innerText = data[2];
      }
      
      // or: data: [[data,data],[data,data]] for two containers
      
    });
    
    
  },
  
  // Scroll the view
  scrollTo: function(response) {
    this.$content.bufferedcontent('scrollTo', response);
  }
  
  
});