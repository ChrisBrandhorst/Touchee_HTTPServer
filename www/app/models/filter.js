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
    
    
    // Constructor
    initialize: function(filter) {
      this.set(filter || {});
    },
    
    
    // Extends the filter with the given filter
    set: function(attributes, options) {
      if (typeof attributes == 'string')
        attributes = parse(attributes);
      return Backbone.Model.prototype.set.call(this, attributes, options);
    },
    
    
    // // Outputs an escaped string representation of the filter
    // // with optional filter additions
    // toString: function(attributes) {
    //   if (typeof attributes == 'string')
    //     attributes = parse(attributes);
    //   return _.map(
    //     _.extend({}, this.toJSON(), attributes || {}),
    //     function(value, key) {
    //       return [key, value.toString().replace(',', "\\,")].join(':');
    //     }
    //   ).join(',');
    // },
    
    
    // Ouputs an ordered, escaped string representation of the filter
    // with optional filter additions
    toString: function(attributes) {
      if (typeof attributes == 'string')
        attributes = parse(attributes);
      
      var filter = _.extend({}, this.toJSON(), attributes || {});
      
      return _.map(
        _.keys(filter).sort(),
        function(key) {
          return [key, filter[key].toString().replace(',', "\\,")].join(':');
        }
      ).join(',');
    }
    
    
  });
  
  return Filter;
  
});