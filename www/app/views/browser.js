define([
  'jquery',
  'Underscore',
  'Backbone',
  'views/contents/list'
], function($, _, Backbone, ContentsListView) {
  
  var BrowserView =  Backbone.View.extend({
    
    el:             $('#browser'),
    containerViews: {},
    
    initialize: function(params) {
      this.$containersViews = this.$('> div');
    },
    
    getContainerView: function(container, view) {
      var key = [container.id, view].join("_");
      return this.containerViews[key];
    },
    
    getOrCreateContainerView: function(container, view) {
      var key = [container.id, view].join("_");
      if (!this.containerViews[key])
        this.containerViews[key] = new ContentsListView({
          container:  container,
          view:       view
        });
      this.containerViews[key].$el.attr('data-key', key);
      return this.containerViews[key];
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
      var views = view.container.get('views');
      
      var $footer = this.$('> footer');
      $footer.find('> nav, > h1').remove();
      
      if (views.length == 1)
        $footer.append('<h1>' + T.T.views[views[0]] + '</h1>');
      else {
        $nav = $('<nav/>').appendTo($footer);
        _.each(views, function(v){
          var $button = $('<a class="button"/>')
            .text( T.T.views[v] )
            .attr('href', "#" + view.container.url() + "/contents/" + v);
          if (view.view == v) $button.addClass('selected');
          $nav.append($button);
        });
      }
      
    },
    
    
    
    
    events: {
      'click [data-href]': 'followNonAnchor'
    },
    
    followNonAnchor: function(ev) {
      window.trigger('navigate', $(ev.target).closest('[data-href]'));
    }
    
    
  });
  
  return new BrowserView();
});