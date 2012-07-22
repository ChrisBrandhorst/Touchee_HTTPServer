var TiledListPage = new JS.Class(Page, {
  
  // Constructor
  initialize: function(id, type, data, collection) {
    this.callSuper();
  },
  
  // Build the tiled list
  _build: function() {
    var page = this;
    
    this.$content.append(this._buildTiles(this.items));
    this.$content.append('<div class="count">' + this.items.length + ' ' + this.data.result.collectionType + '</div>');
    
    this.$content.bufferedcontent({
      minCount:   100,
      rows:       4,
      scrollview: {
        keepSelection: false,
        select: function(ev, scrollview) {
          page._select(this, this.attr('data-id'));
        }
      },
      data: function(container, containerIndex, start, end) {
        return typeof end == 'number' ? container.items.slice(start, end + 1) : container.items[start];
      },
      count: function(container, containerIndex) {
        return container.items.length;
      },
      template: function(container, containerIndex, data, itemIndex) {
        return ['<li data-id="', data[0], '" style="background-image:url(/artwork/', data[0], ')"><p>', data[1], '</p><p>', data[2], '</p></li>'].join("");
      },
      positionEl: '<div class="position"><p></p><span><span></div>',
      position: function(container, containerIndex, itemIndex, positionEl) {
        var data = container.items[itemIndex];
        positionEl[0].childNodes[0].innerText = data[3];
        positionEl[0].childNodes[1].innerText = data[1];
      }
    });
    
  },
  
  // Build one set of tiles
  _buildTiles: function(items) {
    var $tiles = $('<ul class="buffered" />');
    $tiles[0].items = items;
    return $tiles;
  },
  
  // Append content to this view
  append: function(msg) {
    this.scrollview.append(
      this._buildAlbums(msg.result.content)
    );
  },
  
  // Scroll the view
  scrollTo: function(response) {
    for (i in this.items)
      if (this.items[i][3] == response)
        return this.$content.bufferedcontent('scrollTo', i, true);
  }
  
});