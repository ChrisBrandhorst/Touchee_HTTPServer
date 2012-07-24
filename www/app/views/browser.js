define([
  'jquery',
  'Underscore',
  'Backbone',
  'views/contents/list'
], function($, _, Backbone, ContentsListView) {
  
  var BrowserView =  Backbone.View.extend({
    
    el:             $('#browser'),
    containerViews: {},
    
    events: {
      'click [data-href]': 'followNonAnchor'
    },
    
    
    initialize: function(params) {
      this.$containersViews = this.$('> div');
    },
    
    
    hasViews: function(container) {
      var views = this.containerViews[container.id];
      return views ? _.isEmpty(views) : false;
    },
    
    
    getContainerView: function(container, type) {
      var views = this.containerViews[container.id];
      return views ? views[type] : null;
    },
    
    
    getOrCreateContainerView: function(container, type) {
      var views = this.containerViews[container.id];
      if (!views)
        views = this.containerViews[container.id] = {};
      
      var view = views[type];
      if (!view)
        view = views[type] = new ContentsListView({
          container:  container,
          type:       type
        });
      return view;
    },
    
    
    activateContainerView: function(view) {
      if (!view.$el.parent().length)
        this.$containersViews.append(view.$el);
      // We add class hidden instead of hide/show, because the scroll positions are lost otherwise...
      view.$el.removeClass('hidden').siblings('.contents').addClass('hidden');
      this.setViewButtons(view);
      this.activeContainerView = view;
    },
    
    
    setViewButtons: function(view) {
      if (view == this.activeContainerView) return;
      this.activeContainerView = view;
      var viewTypes = view.container.get('viewTypes');
      
      var $footer = this.$('> footer');
      $footer.find('> nav, > h1').remove();
      
      if (viewTypes.length == 1)
        $footer.append('<h1>' + T.T.viewTypes[viewTypes[0]] + '</h1>');
      else {
        $nav = $('<nav/>').appendTo($footer);
        _.each(viewTypes, function(v){
          var $button = $('<a class="button"/>')
            .text( T.T.viewTypes[v] )
            .attr('href', "#" + view.container.url() + "/contents/type:" + v);
          if (view.type == v) $button.addClass('selected');
          $nav.append($button);
        });
      }
      
    },
    
    
    followNonAnchor: function(ev) {
      window.trigger('navigate', $(ev.target).closest('[data-href]'));
    }
    
    
  });
  
  return new BrowserView();
});