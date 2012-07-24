define([
  'jquery',
  'Underscore',
  'Backbone',
  'logger',
  'models/collections/media',
  'models/collections/containers',
  'models/contents',
  'models/filter',
  'models/control_request',
  'views/media/list',
  'views/media/show',
  'views/browser'
], function($, _, Backbone, Logger,
            Media, Containers,
            Contents, Filter, ControlRequest,
            MediaListView, MediumShowView,
            BrowserView
){
  
  var AppRouter = Backbone.Router.extend({
    
    
    routes: {
      "":                                                   "root",
      "media/:mid/containers":                              "containers",
      "media/:mid/groups/:group/containers":                "containers",
      "media/:mid/containers/:cid/contents":                "container",
      // "media/:mid/containers/:cid/contents/:type":          "container",
      // "media/:mid/containers/:cid/contents/:type/*filter":  "container",
      "media/:mid/containers/:cid/contents/:viewType/*filter":  "container",
      "control/:command/container/:cid/*filter":                "control"
    },
    
    
    initialize: function() {
      
      // Build media view list
      this.mediaListView = new MediaListView({collection:Media});
      
      // Get all media, redirecting to the local medium on success
      var _this = this;
      Media.fetch({success:function(){
        var localMedium = Media.getLocal();
        if (localMedium)
          _this.navigate("media/" + localMedium.id + "/containers", true);
      }});
      
      // Bind global navigate event
      _.extend(window, Backbone.Events);
      window.on('navigate', function(url){
        if (typeof url == 'string')
          this.navigate(url, {trigger:true});
      }, this);
      
      // Always go to root
      // this.navigate("");
      window.location.hash = "";
    },
    
    
    // Root method
    root: function() {
      if (!this.mediaListView.isEmpty())
        this.mediaListView.activate('first');
    },
    
    
    // A medium was selected from the nav list
    containers: function(mediumID, group) {
      var medium = this.getMedium(mediumID);
      if (!medium) return;
      
      var key = [medium.id, group].join("_"),
          view = _.bind(this.mediaListView.getPage, this.mediaListView, key)();
      if (!view) {
        view = new MediumShowView({model:medium,contentType:group});
        this.mediaListView.storePage(key, view);
      }
      this.mediaListView.activate(view);
    },
    
    
    // Show the contents of a single container 
    container: function(mediumID, containerID, viewType, filter) {
      filter = new Filter(decodeURIComponent(filter || ""));
      
      // Get the medium
      var medium = this.getMedium(mediumID);
      if (!medium) return;
      
      // Get the container
      var container = medium.containers.get(containerID);
      if (!container)
        return Logger.error("Container with id " + containerID + " cannot be found. Removed?");
      
      // Set default view type if not present
      viewType = viewType || container.get('viewTypes')[0];
      if (!viewType)
        return Logger.error("No view type specified for container " + containerID);
      
      var containerView;
      
      // If this is the first view we open for this container
      if (!BrowserView.hasViews(container)) {
        // Get or create the view which contains the contents pages for this container / view type combo
        containerView = BrowserView.getOrCreateContainerView(container, viewType);
        // Activate it
        BrowserView.activateContainerView(containerView);
      }
      
      // Else, get the currently active view
      else
        containerView = BrowserView.activeContainerView;
      
      // If the given view already contains the requested filter, activate that page
      
      var existingPage;
      if (existingPage = containerView.getPage(viewType))
        return containerView.activate(existingPage);
      
      // Check which module we must load
      var module = container.get('module');
      if (!module) {
        var contentType = container.get('contentType');
        if (_.include(Touchee.knownContentTypes, contentType))
          module = contentType
      }
      var modulePath = module ? 'modules/' + module + '/module' : 'lib/touchee.module';
      
      // Get the processing module
      require([modulePath], function(Module){
        Module.name = module;
        Module.setContentPage(containerView, viewType, filter);
      });
      
    },
    
    
    // Send a control command to the server
    control: function(command, containerID, filter) {
      new ControlRequest({
        command:    command,
        container:  containerID,
        filter:     new Filter(filter || "")
      }).save();
    },
    
    
    // Safely get the medium with the given ID
    getMedium: function(mediumID) {
      var medium = Media.get(mediumID);
      if (!medium) {
        this.navigate("", {trigger:true});
        Logger.error("Medium with id " + mediumID + " cannot be found. Removed? Going back to root");
        return false;
      }
      return medium;
    }
    
    
  });
  
  
  var initialize = function(baseURL) {
    var app_router = new AppRouter();
    Backbone.history.start({root:baseURL});
  };
  return {
    initialize: initialize
  };
  
});