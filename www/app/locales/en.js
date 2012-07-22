Touchee.T = {
  
  unknown:  "Unknown",
  back:     "Back",
  
  shuffle:  "Shuffle",
  
  views: {
    track:    "Songs",
    artist:   "Artists",
    album:    "Albums",
    genre:    "Genres",
    channel:  "Channels"
  },
  
  items: {
    track: {
      one:    'song',
      more:   'songs'
    },
    artist: {
      one:    'artist',
      more:   'artists'
    },
    album: {
      one:    'album',
      more:   'albums'
    },
    genre: {
      one:    'genre',
      more:   'genres'
    }
  }
  
};


Touchee.t = function(item, options) {
  var trans = eval('Touchee.T.' + item);
  
  if (typeof options.count == 'number')
    trans = trans[options.count == 1 ? 'one' : 'more'];
  
  return trans;
};