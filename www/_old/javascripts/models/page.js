var Page = new JS.Class({
  
  // Static methods
  extend: {
    
    // Global types of pages
    Types: {
      'simple_list':  ['tracks'],
      'grouped_list': ['artist', 'series_seasons'],
      'tiled_list':   ['artists', 'albums', 'streams', 'videos', 'films', 'series'],
      'album':        ['album']
    },
    
    // Which sets can be shuffled
    Shuffled: ['tracks', 'artist', 'genre', 'films', 'videos', 'series_seasons'],
    
    // Static function to get the correct page type given a collection type string
    getPageType: function(collectionType) {
      
      for(pageType in Page.Types)
        if (Page.Types[pageType].indexOf(collectionType) >= 0)
          return pageType;
    },
    
    // Static function to create a page from a given type string and result object
    create: function(msg, collection) {
      var id = msg.request.path[msg.request.path.length-1];
      var pageType = Page.getPageType(msg.result.collectionType);
      return new (window[pageType.camelize() + "Page"])(id, pageType, msg, collection);
    }
    
  },
  
  // Animation function or boolean indicating whether the collection should be in charge of animation
  animate: true,
  
  // Constructor
  initialize: function(id, type, data, collection) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.items = data.result.content;
    this.collection = collection;
    
    // Build element
    this._doBuild();
  },
  
  // Build the page element (used internally)
  // Assumes the _build method of the subclass sets this.scrollview
  _doBuild: function() {
    
    // Build template
    this.$element = $('#pageTemplate').tmpl().data('object', this);
    this.$content = this.$element.children('.content');
    
    // Set viewmodes
    var $vms = this.$element.find('.viewmodes');
    var $nav = this.$element.find('.navigation .controls');
    if (this.data.request.path.length == 1) {
      for (id in this.collection.viewmodes)
        $('<li/>').text(this.collection.viewmodes[id].capitalize()).attr('data-id', id).appendTo($vms);
      if ($vms.children().length > 1) {
        $vms.removeClass('hidden');
        $vms.find('[data-id=' + this.collection.viewmode() + ']').addClass('selected');
        $vms.bind(iAd.START_EVENT, this.method('viewmode'));
      }
      else
        $vms.remove();
      $nav.remove();
    }
    
    // Set navigation buttons
    else {
      $nav.removeClass('hidden');
      $vms.remove();
      $nav.find('h3').html(this.data.result.name);
      
      $nav.bind(iAd.END_EVENT, this.method('navigate'));
    }
    
    // Append page to the view
    this.$element
      .addClass(this.type + '_page ' + this.data.result.collectionType + ' invisible')
      .appendTo( this.collection.$content );
    
    // Add shuffle button if needed
    if (Page.Shuffled.indexOf(this.data.result.collectionType) > -1)
      this.$content.append('<div class="shuffle" />');
    
    // Do build for specific page type
    this._build();
    
    // Set scrollcontent
    this.scrollview = this.$content.scrollview('object');
    this.$scrollContent = $(this.scrollview._hostingLayer);
    
    // Add scroller
    var scroller = $('<div/>');
    var page = this;
    scroller.prependTo(this.$element).scroller({
      alphabet: this.data.alphabet,
      onhover:  function(response) {
        if (typeof page.scrollTo == 'function')
          page.scrollTo(response);
      }
    });
    
    // Show it
    this.$element.removeClass('invisible');
  },
  
  // Sets the viewmode for the given page based on the event triggered by pressing on a viewmode
  viewmode: function(ev) {
    var li = $(ev.target).closest('li');
    this.collection.viewmode(li.attr('data-id'));
  },
  
  // Bla
  navigate: function(ev) {
    switch($(ev.target).attr('data-button')) {
      
      case 'back':
        this.collection.back(this);
        break;
      
      case 'next':
        break;
      
      case 'prev':
        break;
      
    }
  },
  
  // Remove the current page from the view
  remove: function() {
    this.$element.remove();
  },
  
  // Called internally when an item is selected
  _select: function(item, id) {
    Application.item(this, id);
  },
  
  // Returns the previous page wihtin the collection
  prev: function() {
    return this.collection.prevPage(this);
  },
  
  // Gets or sets the vertical scroll position in pixels of the first buffered content
  scrollTop: function(pos) {
    return this.$content.scrollview('scrollTop', pos);
  },
  
  // Sets the sections for the given source on the page
  setSource: function(source) {
    if (source && !this.$scrollContent.children('h3.' + source).length) {
      var sourceHeader = $('<h3 class="source ' + source + '" data-source="' + source + '">' + source.capitalize() + '</h3>');
      this.scrollview.append(sourceHeader);
    }
  },
  
  // Sets the loading indicator for the given source
  setLoading: function(source, loading) {
    if (source) {
      var loadHeader = this.$scrollContent.children('.loading.' + source + '');
      if (!loading)
        loadHeader.remove();
      else if (!loadHeader.length && loading) {
        this.$scrollContent.children('.' + source).last().after('<div class="loading ' + source + '" data-source="' + source + '"/>')
        this.scrollview.refreshContentSize();
      }
    }
    else {
      // TODO: global loading
    }
  },
  
  // Destroy this page
  destroy: function() {
    this.$element.remove();
  }
  
});