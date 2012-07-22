define([
  'Underscore',
  'Backbone'
], function(_, Backbone){
  
  
  // Parses an escaped filter string to an object
  var parse = function(str) {
    var parsed = {};
    
    // Because JS has no lookbehind, we need to fix escaped comma's
    var parts = str.split(',');
    for (var i = parts.length - 2; i >= 0; i--) {
      if (parts[i].match(/\\$/))
        parts[i] = parts[i].slice(0, -1) + ',' + parts.splice(i + 1, 1)[0];
    }
    
    // Split key value pairs
    _.each(parts, function(f){
      var kv = f.split(':');
      parsed[kv[0]] = kv.slice(1).join(':');
    });
    
    return parsed;
  };
  
  
  // Filter object
  var Filter = Backbone.Model.extend({
    
    
    // Internal data
    _filter: {},
    
    
    // Constructor
    initialize: function(filter) {
      this.extend(filter || {});
    },
    
    
    // Extends the filter with the given filter
    extend: function(filter) {
      if (typeof filter == 'string')
        filter = parse(filter);
      _.extend(this._filter, filter);
      return this._filter;
    },
    
    
    // Get the filter value for the given key
    get: function(key) {
      return this._filter[key];
    },
    
    
    // Outputs an escaped string representation of the filter
    // with optional filter additions
    toString: function(filter) {
      if (typeof filter == 'string')
        filter = parse(filter);
      return _.map(
        _.extend({}, this._filter, filter || {}),
        function(value, key) {
          return [key, value.toString().replace(',', "\\,")].join(':');
        }
      ).join(',');
    }
    
    
  });
  
  return Filter;
  
});