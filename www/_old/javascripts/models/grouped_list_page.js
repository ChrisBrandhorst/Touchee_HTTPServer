var GroupedListPage = new JS.Class(Page, {
  
  // Constructor
  initialize: function(id, type, data, collection) {
    this.callSuper();
  },
  
  // Build the tiled list
  _build: function() {
    var page = this;
    var beAwesome = false;
    
    // Append initial item list
    this.$content.append(this._buildGroups(this.items));
    
    this.$content.bufferedcontent({
      minCount:   150,
      rows:       20,
      scrollview: {
        selectable: 'tr',
        keepSelection: false,
        select: function(ev, scrollview) {
          page._select(this, this.attr('data-id'));
        }
      },
      count: function(container, containerIndex) {
        return container.items.translation.length;
      },
      template: function(container, containerIndex, data, itemIndex) {
        return '<li style="min-height:0"></li>';
      },
      render: function(container, containerIndex, start, end) {
        
        var groups = container.items.groups;
        var items = container.items.items;
        var html = [], group, item;

        var translation = container.items.translation;
        groupStart = translation[start];
        groupEnd = translation[end];
        
        for (var i = groupStart; i <= groupEnd; i++) {
          group = groups[i];
          html.push('<li><img src="/artwork/'+ group[0] + '" /><h4>', group[1], '</h4><table>');
          
          for (var j = group[4], c = group[4] + group[5]; j < c; j++) {
            item = items[j];
            html.push('<tr data-id="', item[0], '"', (PlaybackStatus.currentItem == item[0] ? ' class="playing"' : ''), '><td>', item[4], '</td><td>', item[1], '</td><td>', item[5], '</td></tr>');
          }
          
          html.push('</table></li>');
        }
        
        var marginTop = translation.indexOf(groupStart) * 42;
        var marginBottom = (container.items.translation.length - end - 1) * 42;
        
        // container.style.marginTop = marginTop + 'px';
        // container.innerHTML = html.join("");
        // container.style.marginBottom = marginBottom + 'px';
        
        if (container.nextSibling)
          container.nextSibling.style.marginTop = marginTop + marginBottom + 'px';
        else
          container.parentNode.style.paddingBottom = marginTop + marginBottom + 'px';
        container.innerHTML = html.join("");
        container.style.webkitTransform = "translateY(" + marginTop + "px)";
        
        // if (page.scrollview)
        //   page._scrollFunc.call(page);
      },
      positionEl: '<h4 class="position" />',
      position: function(container, containerIndex, itemIndex, positionEl) {
        positionEl[0].innerText = container.items.groups[container.items.translation[itemIndex]][1];
      }
    });
    
    
    if (beAwesome) {
      // Set clones used for scrolling effects
      this.hideTransform = "translateX(100%)";
      this.headerClone = $('<h4/>').addClass('clone').css('webkitTransform', this.hideTransform).appendTo(this.$content)[0];
      this.imgClone = $('<img src="images/transparent.png"/>').addClass('clone').css('opacity', 0).appendTo(this.$content)[0];
      
      // Set scrolling awesomeness callback
      this.$content.bind(iAd.ScrollView.DID_SCROLL, this.method('_scrollFunc'));
    }
  },
  
  // Method for fancy header- and albumart stickyness
  _scrollFunc: function() {
    
    var hideTransform = this.hideTransform;
    var headerClone = this.headerClone;
    var imgClone = this.imgClone;
    var scrollY = this.scrollview._contentOffset.y;
    var groups = this.scrollview._hostingLayer.getElementsByTagName('li');
    var i = 0, topElement, nextElement;
    
    // Get the first listitem whose top line is in view
    while((nextElement = groups[i]) && nextElement.offsetTop <= scrollY) i++;
    
    // We are interested in the item before that one
    if (i > 0) topElement = groups[i - 1];
    
    // If we have a top element, do cool stuff with the header
    if (topElement) {
      // Get the header element from the list item
      var header = topElement.childNodes[1];

      // If the topElement is within the header height of the top, push the previous header up
      if (topElement.offsetTop + topElement.offsetHeight - scrollY < header.offsetHeight) {
        header.style.webkitTransform = "translateY(" + (topElement.offsetHeight - header.offsetHeight) + "px)"
        setTimeout(function(){headerClone.style.webkitTransform = hideTransform;},25);
      }
      else {
        headerClone.innerHTML = header.innerHTML;
        headerClone.style.webkitTransform = "";
        header.style.webkitTransform = "";
      }
    }
    
    // If we have no element, the header clone is hidden
    // and the original is restored
    else {
      headerClone.style.webkitTransform = hideTransform;
      nextElement.childNodes[1].style.webkitTransform = "";
    }
    
    // Get the list item which contains the relevant image
    var imgElement, imgI;
    if (nextElement && nextElement.offsetTop - scrollY < 9) {
      imgElement = nextElement;
      imgI = i;
    }
    else {
      imgElement = topElement;
      imgI = i - 1;
    }
    
    // If we do not have an element, we have not passed the first element, so hide the clone
    if (!imgElement) {
      nextElement.childNodes[0].style.opacity = 1;
      nextElement.childNodes[0].style.webkitTransform = "";
      setTimeout(function(){imgClone.style.opacity = 0;},25);
      return;
    }
    
    // Get the image
    var img = imgElement.childNodes[0];
    
    // If the image approaches the bottom of the containing element, pin it to the bottom
    // And show the next image
    if (img.parentNode.offsetTop + img.parentNode.offsetHeight - scrollY - 9 < img.offsetHeight) {
      img.style.webkitTransform = "translateY(" + (img.parentNode.offsetHeight - img.offsetHeight) + "px)";
      img.style.opacity = 1;
      setTimeout(function(){imgClone.style.opacity = 0;},25);
      
      if (groups[imgI + 1]) {
        groups[imgI + 1].childNodes[0].style.opacity = 1;
        groups[imgI + 1].childNodes[0].style.webkitTransform = "";
      }
      
    }
    
    // If we are within 9px of the top, show the clone
    else if (img.parentNode.offsetTop - scrollY < 9) {
      img.style.opacity = 0;
      imgClone.src = img.src;
      imgClone.style.opacity = 1;
    }
  },
  
  // Build one set of groups
  _buildGroups: function(items) {
    var $groups = $('<ul class="buffered" />');
    var translation = [];
    
    // Loop through groups
    var group;
    for (var i = 0, l = items.groups.length; i < l; i++) {
      group = items.groups[i];
      // Push the group ID into the array at least 5 times
      for (var j = 0, c = Math.max(group[5], 4) + 1; j < c; j++)
        translation.push(Number(i));
    }
    
    items.translation = translation;
    $groups[0].items = items;
    
    return $groups;
  },
  
  // Append content to this view
  append: function(msg) {
    var hasResults = msg.result.content.groups.length > 0;
    
    if (hasResults)
      this.scrollview.append(
        this._buildGroups(msg.result.content)
      );
    else if (msg.source)
      this.scrollview.append( $('<div class="count">no results</div>') );
    
    this.$content.bufferedcontent('refresh');
  },
  
  // Scroll the view
  scrollTo: function(response) {
    this.scrollTop(
      response * this.$content.scrollview('object')._hostingLayer.offsetHeight
    );
  }
  
});