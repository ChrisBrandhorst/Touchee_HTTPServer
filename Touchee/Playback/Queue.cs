using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Touchee.Playback {
    
    /// <remarks>
    /// Represents a playing queue
    /// </remarks>
    public class Queue : Base {


        #region Privates

        /// <summary>
        /// Contains the (possible shuffled) non-priority items
        /// </summary>
        List<IItem> _items;
        /// <summary>
        /// Contains the unshuffled non-priority items
        /// </summary>
        List<IItem> _itemsUnshuffled;
        /// <summary>
        /// Contains the priority items
        /// </summary>
        List<IItem> _itemsPriority;
        /// <summary>
        /// Contains the items to be played after the queue is finished
        /// </summary>
        List<IItem> _itemsAfterFinish;

        /// <summary>
        /// Shuffle value
        /// </summary>
        bool _shuffle = false;

        /// <summary>
        /// Index value
        /// </summary>
        int _index = -1;

        /// <summary>
        /// Whether we are playing a priority item
        /// </summary>
        bool _playingPriority = false;

        #endregion


        #region Properties

        /// <summary>
        /// The items in the queue in the order in which they will be played
        /// </summary>
        public IEnumerable<QueueItem> Items { get {
            var items = new List<QueueItem>();

            // Add previous and current items
            for (int i = 0; i <= Index; i++) {
                var item = _items[i];
                items.Add(new QueueItem() { Item = item, Status = i == Index ? QueueItemStatus.Current : QueueItemStatus.Previous });
            }

            // Add priority items
            foreach (var item in _itemsPriority)
                items.Add(new QueueItem() { Item = item, Status = QueueItemStatus.Priority });
            
            // Add pending items
            for (int i = Math.Max(0, Index); i < _items.Count; i++) {
                var item = _items[i];
                items.Add(new QueueItem() { Item = item, Status = QueueItemStatus.Pending });
            }

            // Add after finish item
            if (_itemsAfterFinish.Count > 0) {
                var item = _itemsAfterFinish.First();
                items.Add(new QueueItem() { Item = item, Status = QueueItemStatus.AfterFinish });
            }

            return items;
        } }


        /// <summary>
        /// Gets or sets the shuffling of the queue
        /// </summary>
        public bool Shuffle {
            get { return _shuffle; }
            set {
                if (_shuffle == value) return;
                if (_shuffle = value) {
                    var current = Current;
                    _items.Clear();
                    _items.AddRange(_itemsUnshuffled);
                    _items.RemoveAt(Index);
                    _items.Shuffle();
                    _items.Insert(0, current);
                    Index = 0;
                }
                else {
                    ResetItems();
                }
            }
        }


        /// <summary>
        /// The repeat mode of the queue
        /// </summary>
        public RepeatMode Repeat { get; set; }


        IItem _current;
        /// <summary>
        /// The current item in the queue
        /// </summary>
        public IItem Current {
            get {
                return _current;
            }
            protected set {
                _current = value;

                if (_current is ITrack)
                    Log((_current as ITrack).Name);
                else if (_current is IWebcast)
                    Log((_current as IWebcast).Name);

            }
        }


        /// <summary>
        /// The index of the current item in the queue
        /// </summary>
        public int Index {
            get { return _index; }
            set {
                _index = value >= 0 && value < _items.Count ? value : -1;
                Current = _index > -1 ? _items[_index] : null;
            }
        }


        #endregion


        #region Constructors

        /// <summary>
        /// Constructs a new, empty queue.
        /// </summary>
        public Queue() {
            Repeat = RepeatMode.Off;
            _items = new List<IItem>();
            _itemsUnshuffled = new List<IItem>();
            _itemsPriority = new List<IItem>();
            _itemsAfterFinish = new List<IItem>();
        }


        /// <summary>
        /// Constructs a new queue with one item in it.
        /// </summary>
        /// <param name="item">The item to add to the queue</param>
        public Queue(IItem item) : this() {
            _itemsUnshuffled.Add(item);
            ResetItems();
        }


        /// <summary>
        /// Constructs a new queue with a number of items in it.
        /// </summary>
        /// <param name="items">The initial set of items in the queue</param>
        public Queue(IEnumerable<IItem> items) : this() {
            _itemsUnshuffled.AddRange(items);
            ResetItems();
        }


        /// <summary>
        /// Constructs a new queue with one item in it.
        /// </summary>
        /// <param name="item">The item to add to the queue</param>
        /// <param name="index">The intial index of the queue</param>
        public Queue(IItem item, int index) : this(item) {
            Index = index;
        }


        /// <summary>
        /// Constructs a new queue with a number of items in it.
        /// </summary>
        /// <param name="items">The initial set of items in the queue</param>
        /// <param name="index">The intial index of the queue</param>
        public Queue(IEnumerable<IItem> items, int index) : this(items) {
            Index = index;
        }


        #endregion


        #region Enqueueing

        /// <summary>
        /// Queue a single item at the end of the priority queue
        /// </summary>
        /// <param name="item">The item to add</param>
        public void Enqueue(IItem item) {
            _itemsPriority.Add(item);
        }


        /// <summary>
        /// Queue a single item at a specific index of the priority queue
        /// </summary>
        /// <param name="item">The item to add</param>
        /// <param name="index">The index to add the item at</param>
        /// <exception cref="ArgumentOutOfRangeException">index is less than 0 -or- index is greater than Count.</exception>
        public void Enqueue(IItem item, int index) {
            _itemsPriority.Insert(index, item);
        }


        /// <summary>
        /// Queue a number of items at the end of the priority queue
        /// </summary>
        /// <param name="items">The items to add</param>
        public void Enqueue(IEnumerable<IItem> items) {
            _itemsPriority.AddRange(items);
        }
        

        /// <summary>
        /// Queue a number of items at the end of the priority queue
        /// </summary>
        /// <param name="items">The items to add</param>
        /// <param name="index">The index to add the items at</param>
        /// <exception cref="ArgumentOutOfRangeException">index is less than 0 -or- index is greater than Count.</exception>
        public void Enqueue(IEnumerable<IItem> items, int index) {
            _itemsPriority.InsertRange(index, items);
        }


        /// <summary>
        /// Moves the specified item in the priority queue to the specified index
        /// </summary>
        /// <param name="item">The item to move</param>
        /// <param name="index">The index to place the item at</param>
        /// <exception cref="ArgumentOutOfRangeException">item does not exist in the List</exception>
        /// <exception cref="ArgumentOutOfRangeException">to is not a valid index in the List</exception>
        public void MoveQueued(IItem item, int index) {
            this.MoveQueued(_itemsPriority.IndexOf(item), index);
        }


        /// <summary>
        /// Moves the item at the specied index in the priority queue to the target index
        /// </summary>
        /// <param name="from">The index of the item to move</param>
        /// <param name="to">The index to place the item at</param>
        /// <exception cref="ArgumentOutOfRangeException">from is not a valid index in the List</exception>
        /// <exception cref="ArgumentOutOfRangeException">to is not a valid index in the List</exception>
        public void MoveQueued(int from, int to) {
            this.Enqueue(_itemsPriority[from], to);
            _itemsPriority.RemoveAt(from);
        }


        /// <summary>
        /// Sets a single item to play after the current queue has been fully played
        /// </summary>
        /// <param name="item">The item to add</param>
        public void EnqueueAfterFinish(IItem item) {
            _itemsAfterFinish = new List<IItem>() { item };
        }


        /// <summary>
        /// Sets a number of items to play after the current queue has been fully played
        /// </summary>
        /// <param name="items">The items to add</param>
        public void EnqueueAfterFinish(IEnumerable<IItem> items) {
            _itemsAfterFinish = new List<IItem>(items);
        }


        #endregion


        #region Queue control


        /// <summary>
        /// Go to the previous item
        /// </summary>
        /// <returns>The new current item, or null if none</returns>
        public IItem Prev() {
            --Index;
            return Current;
        }


        /// <summary>
        /// Move to the next item
        /// </summary>
        /// <returns>The new current item, or null if none</returns>
        public IItem Next() {
            return this.Next(false);
        }


        /// <summary>
        /// Move to the next item
        /// </summary>
        /// <param name="ignoreRepeat">Whether the repeat property should be ignored when determining the nex item</param>
        /// <returns>The new current item, or null if none</returns>
        public IItem Next(bool ignoreRepeat) {

            // If we have a priority item, we play that first
            lock (_itemsPriority) {
                _playingPriority = _itemsPriority.Count > 0;
                if (_playingPriority) {
                    Current = _itemsPriority[0];
                    _itemsPriority.RemoveAt(0);
                    return Current;
                }
            }

            // No priority items, so we proceed with the 'normal' items
            int nextIndex = Index + 1;

            // Handle repeat
            switch (Repeat) {

                // Go to beginning when at the end of the list, regardless of ignoreRepeat
                case RepeatMode.All:
                    if (nextIndex == _items.Count)
                        nextIndex = 0;
                    break;

                // Repeat the current item, unless forced into next
                case RepeatMode.One:
                    if (!ignoreRepeat)
                        nextIndex = Index;
                    break;
                
            }

            // If we are at the end
            if (nextIndex == _items.Count) {

                if (_itemsAfterFinish.Count > 0) {
                    _itemsUnshuffled.Clear();
                    _itemsUnshuffled.AddRange(_itemsAfterFinish);
                    Shuffle = Shuffle;
                    nextIndex = 0;
                }
                else
                    nextIndex = -1;

            }

            // Set index and return current item
            Index = nextIndex;
            return Current;
        }


        /// <summary>
        /// Toggles the shuffle property
        /// </summary>
        /// <returns>The new value for the shuffle property</returns>
        public bool ToggleShuffle() {
            return Shuffle = !Shuffle;
        }


        /// <summary>
        /// Toggles the repeat property.
        /// Cycles in the order Alle, One, Off
        /// </summary>
        /// <returns>The new value for the repeat property</returns>
        public RepeatMode ToggleRepeat() {
            switch (Repeat) {
                case RepeatMode.Off:
                    Repeat = RepeatMode.All;
                    break;
                case RepeatMode.All:
                    Repeat = RepeatMode.One;
                    break;
                case RepeatMode.One:
                    Repeat = RepeatMode.Off;
                    break;
            }
            return Repeat;
        }

        #endregion


        #region Helpers

        void ResetItems() {
            Index = _itemsUnshuffled.IndexOf(Current);
            _items = new List<IItem>(_itemsUnshuffled);
        }

        #endregion


    }

}
