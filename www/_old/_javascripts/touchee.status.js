(function(){
  
  Touchee.Status = {
    
    // Init the status object with the given data
    init: function(data) {
      
      Touchee.status = {
        controllers: {},
        controller: null
      };
      

      Touchee.status = {
        
        controllers:  {

          music: {
            
            collections: {
              12: {
                viewmodes: {
                  artist: {
                    
                  }
                },
                viewmode: 'artist'
              }
            },
            collection: 12

          },

          video: {
            
          }

        },
        controller:   'music',
        query:        null

      };



      for (id in data.controllers)
        Touchee.status.controllers[id] = {collections:{}};
    },
    
    // Gets the given status in short form
    get: function() {
      var controller = Touchee.status.controller;
      var controllerStatus = Touchee.status.controllers[controller];
      var collection, collectionStatus, viewmode, viewmodeStatus, item, scrollTop;
      
      if (controllerStatus) {
        collection = controllerStatus.collection;
        collectionStatus = controllerStatus.collections[collection];
        if (collectionStatus) {
          viewmode = collectionStatus.viewmode;
          viewmodeStatus = collectionStatus.viewmodes[viewmode];
          if (viewmodeStatus) {
            item = viewmodeStatus.item;
            scrollTop = viewmodeStatus.scrollTop;
          }
        }
      }
      
      return {
        query:        Touchee.status.query,
        controller:   controller,
        collection:   collection,
        viewmode:     viewmode,
        item:         item,
        scrollTop:    scrollTop
      };
    },


    
    // // Returns whether the data that is given can be processed. Only returns true if the current controller,
    // // collection and viewmode equal to the ones given in the data.
    // processable: function(data) {
    //   var status = this.get();
    //   return status.controller == data.controller &&
    //     (status.collection == data.collection || typeof status.collection == 'undefined') &&
    //     (status.viewmode == data.viewmode || typeof status.viewmode == 'undefined') &&
    //     // (status.item == data.item || typeof status.item == 'undefined') &&
    //     (status.query == data.query || typeof status.query == 'undefined');
    // },
    
    // // Set the given controller data
    // storeController: function(data) {
    //   var controllerStatus = Touchee.status.controllers[data.id];
      
    //   // Add viewmodes & collections to status object
    //   controllerStatus.viewmodes = data.viewmodes;
    //   var v; for(v in controllerStatus.viewmodes) break;
      
    //   for (i in data.collections) {
    //     controllerStatus.collections[ data.collections[i].id ] = {
    //       viewmode:       v,
    //       viewmodes:      {}
    //     };
    //   }
    // },
    
    // // Sets the given query
    // setQuery: function(query) {
    //   if (Touchee.status.query == query) return false;
    //   Touchee.status.query = query;
    //   return true;
    // },
    
    // // Selects the given controller
    // setController: function(controller) {
    //   if (Touchee.status.controller == controller) return false;
    //   Touchee.status.controller = controller;
    //   return true;
    // },
    
    // // Selects the given collection in the context of the current controller
    // setCollection: function(collection) {
    //   try {
    //     var controllerStatus = Touchee.status.controllers[Touchee.status.controller];
    //     if (controllerStatus.collections[collection]) {
    //       if (controllerStatus.collection == collection) return false;
    //       controllerStatus.collection = collection;
    //       return true;
    //     }
    //   }
    //   catch(e) { return false; }
    // },
    
    // // Selects the given viewmode in the context of the current collection
    // setViewmode: function(viewmode) {
    //   try {
    //     var controllerStatus = Touchee.status.controllers[Touchee.status.controller];
    //     if (controllerStatus.viewmodes[viewmode]) {
    //       if (controllerStatus.collections[controllerStatus.collection].viewmode == viewmode) return false;
    //       controllerStatus.collections[controllerStatus.collection].viewmode = viewmode;
    //       return true;
    //     }
    //   }
    //   catch(e) { return false; }
    // },
    
    // // Sets the given scrolltop in the context of the current collection
    // setScrollTop: function(scrollTop) {
    //   try {
    //     var controllerStatus = Touchee.status.controllers[Touchee.status.controller];
    //     var collectionStatus = controllerStatus.collections[controllerStatus.collection];
    //     var viewmodeStatus = collectionStatus.viewmodes[collectionStatus.viewmode];
    //     if (!viewmodeStatus) viewmodeStatus = collectionStatus.viewmodes[collectionStatus.viewmode] = {};
    //     viewmodeStatus.scrollTop = scrollTop;
    //     return true;
    //   }
    //   catch(e) { return false; }
    // },
    
    // // Sets the given item in the context of the current collection
    // setItem: function(item) {
    //   try {
    //     var controllerStatus = Touchee.status.controllers[Touchee.status.controller];
    //     var collectionStatus = controllerStatus.collections[controllerStatus.collection];
    //     var viewmodeStatus = collectionStatus.viewmodes[collectionStatus.viewmode];
    //     if (!viewmodeStatus) viewmodeStatus = collectionStatus.viewmodes[collectionStatus.viewmode] = {};
    //     // if (viewmodeStatus.item == item) return false;
    //     if (item)
    //       viewmodeStatus.item = item;
    //     else
    //       delete viewmodeStatus.item;
    //     return true;
    //   }
    //   catch(e) { return false; }
    // }
    
  }
  
})(jQuery);