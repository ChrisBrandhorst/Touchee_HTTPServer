var Collection = new JS.Class({
  
  viewmodes:  {},
  pages:      [],
  $content:   $('#content'),
  
  // Constructor
  initialize: function(controller, id, name, type, viewmodes) {
    this.controller = controller;
    this.id = id;
    this.name = name;
    this.type = type;
    this.viewmodes = viewmodes;
    this.$element = $('<li/>').addClass(type).text(name).data('object', this).attr('data-id', id);
  },
  
  // Get the currently opened path of the collection
  currentPath: function() {
    return $.map(this.pages, function(t){return t.id});
  },
  
  // Gets the page before the given page
  prevPage: function(page) {
    return this.pages[ this.pages.indexOf(page) - 1];
  },
  
  // Gets the final page for this collection
  lastPage: function() {
    return this.pages[this.pages.length - 1];
  },
  
  // Get or set the current viewmode of the collection
  viewmode: function(vm) {
    if (typeof vm != 'string') {
      if (!this._viewmode) {
        for (vm in this.viewmodes) break;
        this._viewmode = vm;
        // this._viewmode = 'albums';
      }
      return this._viewmode;
    }
    if (vm != this._viewmode)
      Application.collection(this, vm);
  },
  
  // Sets the content for this collection
  setContent: function(msg) {
    
    // Check whether the incoming path is equal to the current path
    var append = 
      Array.equals(msg.request.path, this.currentPath()) && 
      msg.request.viewmode == this.viewmode();
    
    // If we are not appending, add a new page
    if (!append) {
      if (msg.status == Status.LOADED) {
        this._viewmode = msg.request.viewmode;
        this.addPage(msg);
      }
    }
    
    // We are appending!
    else {
      var lastPage = this.lastPage();
      
      // Init source
      lastPage.setSource(msg.source);
      
      // Set loading indicator
      if (msg.status == Status.LOADING)
        lastPage.setLoading(msg.source, true);
      
      // Add content
      else if (msg.status == Status.LOADED) {
        lastPage.setLoading(msg.source, false);
        lastPage.append(msg);
      }
      
    }
    
  },
  
  // Adds a page to the content
  addPage: function(msg) {
    
    var animate = true;
    
    // Reduce the amount of pages in the view to the length of the path minus one
    var keepInView = msg.request.path.length - 1;
    if (keepInView < this.pages.length) {
      $.each(this.pages.splice(keepInView), function(i,page){ page.remove(); });
      animate = false;
    }
    
    // Create the page object
    var page = Page.create(msg, this);
    this.pages.push(page);
    
    // Animate into view
    if (animate) {
      if (typeof page.animate == 'function')  page.animate();
      else if (page.animate === true)         this.animate();
    }
  },
  
  // Go back one page with an animation
  back: function(fromPage) {
    if (this.pages.length == 0) return;
    if (typeof fromPage.animate == 'function')  fromPage.animate(true);
    else if (fromPage.animate === true)         this.animate(true);
    this.pages.pop();
  },
  
  // Animates the pages to the last or before-last page
  animate: function(back) {
    var pagesInDOM = $('.page', this.$content);
    pagesInDOM.css('webkitTransform', 'translateX(-' + (pagesInDOM.length - (back ? 2 : 1)) * 100 + '%)');
    
    if (back)
      setTimeout(function(){
        pagesInDOM.last().remove();
      }, pagesInDOM.css('-webkit-transition-duration').numberValue() * 1000);
  },
  
  // Destroy this collection
  destroy: function() {
    for (i in this.pages)
      this.pages[i].destroy();
    this.pages = [];
    this.$element.remove();
  }
  
});