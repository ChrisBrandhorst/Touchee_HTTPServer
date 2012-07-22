using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee {

    public enum ItemChangeTypes {
        Stored,
        Changed,
        Deleted
    }

    /// <remarks>
    /// Instances of subclasses of this class are automatically assigned IDs and can be retrieved by calling
    /// the static Get and All methods of the class.
    /// </remarks>
    public abstract class Collectable<T> : Base, IDisposable, ICollectable {
        
        // Activerecord functions
        protected static Dictionary<int, object> _collection = new Dictionary<int, object>();
        public static T Get(int id) { return (T)_collection[id]; }
        public static T[] All { get { return _collection.Values.Cast<T>().ToArray(); } }
        public static IEnumerable<T> Where(Func<T, bool> pred) {
            return _collection.Values.Cast<T>().Where(pred);
        }
        public static T FirstOrDefault(Func<T, bool> pred) {
            return _collection.Values.Cast<T>().FirstOrDefault(pred);
        }
        public static bool Any(Func<T, bool> pred) {
            return _collection.Values.Cast<T>().Any(pred);
        }

        // Events
        public delegate void ItemEventHandler(object sender, ItemEventArgs e);
        public class ItemEventArgs : EventArgs {
            public ItemChangeTypes ChangeType { get; protected set; }
            public T Item { get; protected set; }
            public ItemEventArgs(ItemChangeTypes changeType, object item) {
                this.ChangeType = changeType;
                this.Item = (T)item;
            }
        }
        public static event ItemEventHandler ItemStored;
        public static event ItemEventHandler ItemChanged;
        public static event ItemEventHandler ItemDeleted;

        // Stuff for automatic ID counting
        public int ID { get; private set; }
        protected static int _nextID = 1;

        // Store the object in the collection, giving it an ID
        public void Store() {
            if (ID == 0) {
                ID = _nextID++;
                _collection[ID] = this;
                if (Collectable<T>.ItemStored != null)
                    Collectable<T>.ItemStored.Invoke(this, new ItemEventArgs(ItemChangeTypes.Stored, this));
            }
        }

        // Fire modification event
        public void Changed() {
            if (Collectable<T>.ItemChanged != null)
                Collectable<T>.ItemChanged.Invoke(this, new ItemEventArgs(ItemChangeTypes.Changed, this));
        }

        // Disposing
        public bool Disposed { get; protected set; }
        public void Dispose() {
            if (_collection.ContainsKey(this.ID))
                _collection.Remove(this.ID);
            this.Disposed = true;
            if (Collectable<T>.ItemDeleted != null)
                Collectable<T>.ItemDeleted.Invoke(this, new ItemEventArgs(ItemChangeTypes.Deleted, this));
        }

    }
}
