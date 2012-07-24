using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Dynamic;

namespace Touchee {

    public class Contents {

        public Container Container { get; set; }
        public string[] Keys { get; set; }
        public object Data { get; set; }
        public ExpandoObject Meta { get; set; }

        public Contents(Container container) {
            this.Container = container;
        }
        public Contents(Container container, string[] keys, object data, ExpandoObject meta) : this(container) {
            this.Keys = keys;
            this.Data = data;
            this.Meta = meta;
        }

    }


}
