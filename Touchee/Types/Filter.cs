using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Touchee {

    /// <summary>
    /// Filter object for incoming requests
    /// </summary>
    public class Filter : Dictionary<string, string> {


        /// <summary>
        /// Builds a filter object from the given string
        /// </summary>
        /// <param name="filterString">The filter string to build the filter object from</param>
        /// <returns>A filter object</returns>
        public static Filter Build(string filterString) {
            var filter = new Filter();

            if (String.IsNullOrWhiteSpace(filterString))
                return filter;

            try {
                filter = new Filter(
                    Regex
                        .Split(filterString, "(?<!\\\\),")
                        .Select(f =>
                            f.Split(new char[]{':'}, 2)
                         )
                        .ToDictionary(f =>
                            f[0].ToLower(), f => Regex.Unescape(f[1])
                        )
                );
            }
            catch (Exception) { }

            return filter;
        }

        Filter() : base() { }
        public Filter(Dictionary<string, string> filter) : base(filter) { }


        public int TryGetInt(string key, out int value) {
            value = 0;
            if (this.ContainsKey(key))
                Int32.TryParse(this[key], out value);
            return value;
        }

        public int GetInt(string key) {
            var value = 0;
            this.TryGetInt(key, out value);
            return value;
        }


    }

}

