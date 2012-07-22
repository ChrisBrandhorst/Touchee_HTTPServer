using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace iTunes.Media {
    
    /// <remarks>
    /// Abstract class for easily retrieving data from the object
    /// </remarks>
    public abstract class LibraryItem : Dictionary<string, string> {

        // Utility functions for parsing the underlying values
        protected string GetString(string key) {
            return this.ContainsKey(key) ? this[key] : "";
        }
        protected int GetInt(string key, int defaultValue = -1) {
            int val;
            bool parsed = int.TryParse(GetString(key), out val);
            return parsed ? val : -defaultValue;
        }
        protected bool GetBool(string key) {
            bool val;
            bool parsed = bool.TryParse(GetString(key), out val);
            return parsed ? val : false;
        }


        
    }

}
