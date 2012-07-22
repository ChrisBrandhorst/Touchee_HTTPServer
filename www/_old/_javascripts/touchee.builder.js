(function(){
  
  String.prototype.truncate = function(length) {
    return this.length > length ? this.slice(0, length - 2) + "..." : this;
  }
  
  Touchee.Builder = {
    
    ROW_HEIGHT: 30,
    
    init: function() {
    },
    
    build: function(data) {
      var result;
      
      // Build items
      if ($.inArray(data.result.containerType, ['tracks', 'artist']) > -1) {
        result = this.buildTrackList(data.result);
      }
      
      else if ($.inArray(data.result.containerType, ['artists', 'albums']) > -1) {
        result = $('<ul />');
        this.buildLargeIconList(result, data.result);
      }
      
      return result;
      
      // Build artist / albums list (artists, albums)
      // Build tracks list (artist, playlist, tracks)
      // Build album popup (album)
    },
    
    // Large icon list
    buildLargeIconList: function(target, result) {
      target = target.position ? target[0] : target;
      var itemData, li, p;
      var doc = document;
      for(i in result[result.containerType]) {
        itemData = result[result.containerType][i];
        li = doc.createElement('li');
        li.setAttribute('data-id', itemData[0]);
        li.setAttribute('name', "letter-" + itemData[3]);
        li.setAttribute('data-text', itemData[1]);
        //li.setAttribute('style', "background-image:url(/artwork/" + itemData[0] + ");");
        li.textContent = itemData[1].truncate(19);
        p = doc.createElement('p');
        p.textContent = itemData[2].truncate(21);
        li.appendChild(p);
        target.appendChild(li);
      }
    },
    
    // Track list as table
    buildTrackList: function(result) {
      var target = $('<table cellpadding="0" cellspacing="0"><tr><td></td><td></td><td></td><td></td></tr></table>');
      
      var albums = [];
      var numbers = [];
      var names = [];
      var durations = [];
      var trackIDs = [];
      
      var marginTop = 0;
      
      var albumData, albumPart, durationPart, trackCount, trackData;
      
      // Loop through all albums
      for(i in result.albums) {
        // Set data
        albumData = result.albums[i];
        albumPart = [];
        durationPart = [];
        trackCount = albumData[4].length;
        
        // Build up album-info
        if (trackCount > 5) {
          albumPart.push('<strong name="album-'+albumData[0]+'" style="margin-top:'+marginTop+'px" data-id="' + albumData[0] + '" class="withimage">' + albumData[1] + '</strong>');
          marginTop = (trackCount - 6) * this.ROW_HEIGHT;
        }
        else {
          albumPart.push('<strong name="album-'+albumData[0]+'" style="margin-top:'+marginTop+'px">' + albumData[1] + '</strong>');
          marginTop = (trackCount - 1) * this.ROW_HEIGHT;
        }
        albumPart.push(albumData[2]);
        
        // Loop through all tracks
        for (j in albumData[4]) {
          trackData = albumData[4][j];
          
          trackIDs.push(trackData[0]);
          
          numbers.push(trackData[2]);
          names.push(trackData[1]);
          
          durationPart.push(trackData[3]);
          durationPart.push(
            '<' + (j < albumData[4].length - 1 ? 'br' : 'hr') + ' data-id="' + trackData[0] + '" name="album-' + albumData[0] + '" />'
          );
        }
        
        // Add album info to main arrays
        albums.push(albumPart.join(""));
        durations.push(
          // durationPart.join('<br name="album-' + albumData[0] + '" />') +
          // '<hr name="album-' + albumData[0] + '" />'
          durationPart.join("")
        );
      }
      
      var tds = target.find('td');
      tds[0].innerHTML = albums.join("");
      tds[1].innerHTML = numbers.join("<br/>");
      tds[2].innerHTML = names.join("<br/>");
      tds[3].innerHTML = durations.join("");
      
      target.data('trackIDs', trackIDs);
      
      return target;
    },
    
    // Album popup
    buildAlbum: function() {
      
    }
    
  }
  
})(jQuery);