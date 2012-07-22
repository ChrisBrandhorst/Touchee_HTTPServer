var JS_PATH = "javascripts/";
var JS_LIB_PATH = JS_PATH + "lib/";
var JS_MODELS_PATH = JS_PATH + "models/";
// var JQ_LIBS = ['jquery.tmpl', 'iad.extensions', 'jquery.bufferedcontent', 'jquery.scroller'];

JS.Packages(function(){with(this){
  
  // file(JS_LIB_PATH + "jquery.min.js")
  //   .provides('jQuery')
  //   .setup(function(){
  //     var path;
  //     for (i in JQ_LIBS) {
  //       path = JS_LIB_PATH + JQ_LIBS[i] + ".js";
  //       console.log("Loading & executing " + path);
  //       $.holdReady(true);
  //       $.getScript(path, function(){
  //         $.holdReady(false);
  //       });
  //     }
  //   });
  
  file(JS_PATH + "application.js")
    .provides('Application')
    .requires('JS.Singleton',
              'Logger')
    .uses(    'jQuery',
              'Communicator',
              'Library',
              'Controls',
              'Volume',
              'PlaybackStatus');
  
  file(JS_MODELS_PATH + "logger.js")
    .provides('Logger')
    .requires('JS.Singleton');

  file(JS_MODELS_PATH + "communicator.js")
    .provides('Communicator')
    .requires('JS.Class');

  file(JS_MODELS_PATH + "controls.js")
    .provides('Controls')
    .requires('JS.Singleton');

  file(JS_MODELS_PATH + "volume.js")
    .provides('Volume')
    .requires('JS.Singleton');

  file(JS_MODELS_PATH + "playback_status.js")
    .provides('PlaybackStatus')
    .requires('JS.Singleton');
    
  file(JS_MODELS_PATH + "library.js")
    .provides('Library')
    .uses('Controller')
    .requires('JS.Class');

  file(JS_MODELS_PATH + "controller.js")
    .provides('Controller')
    .uses('Collection')
    .requires('JS.Class');
  
  file(JS_MODELS_PATH + "collection.js")
    .provides('Collection')
    .uses(    'Page',
              'SimpleListPage',
              'TiledListPage',
              'GroupedListPage',
              'AlbumPage')
    .requires('JS.Class');
  
  file(JS_MODELS_PATH + "page.js")
    .provides('Page')
    .requires('JS.Class');
  
  file(JS_MODELS_PATH + "simple_list_page.js")
    .provides('SimpleListPage')
    .requires('Page');
  
  file(JS_MODELS_PATH + "tiled_list_page.js")
    .provides('TiledListPage')
    .requires('Page');
  
  file(JS_MODELS_PATH + "grouped_list_page.js")
    .provides('GroupedListPage')
    .requires('Page');
  
  file(JS_MODELS_PATH + "album_page.js")
    .provides('AlbumPage')
    .requires('Page');
    
}});


