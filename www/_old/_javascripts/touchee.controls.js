(function(){
  
  Touchee.Controls = {
    
    // Init the controls
    init: function() {
      
      // Set callbacks on the buttons
      var buttons = 'prev play pause next repeat shuffle'.split(' ');
      for(i in buttons)
        $('.button.' + buttons[i]).bind('mouseup touchend', this.clickedButton);
      
      // Init volume stuff
      this.Volume.init();
      
      // Show nowplaying on touching nowplaying area
      $('#browser .nowplaying .nowplaying_artwork, #nowplaying .button.back').bind('mouseup touchend', this.switchArea);
      
      // Set now playing flip action
      $('#nowplaying').find('.button.flip, .button.nowplaying_artwork').bind('mouseup touchend', function(){
        $('#nowplaying').toggleClass('flipped');
        return false;
      });
      $('#nowplaying_perspective > .nowplaying_artwork').bind('mouseup touchend', function(){
        $('#nowplaying').toggleClass('initial');
        return false;
      });
      
      // Set nowplaying list scrolling
      $('#nowplaying_list_container').inertscroll({
        up: Touchee.Content.act
      });
    },
    
    // All slider-related stuff
    Slider: {
      
      // Whether the slider is showing time (true) or pieces (false)
      isTime: true,
      
      // Init the slider with a given max and value and whether it represents time
      set: function(time, max, val) {
        this.isTime = time || false;
        var max = Math.ceil(Number(max || 0));
        this.slider = $('.nowplaying_slider');
        this.slider.slider({
          range:  'min',
          min:    0,
          max:    max,
          start:  this.start,
          slide:  this.slide,
          change: this.change,
          stop:   this.stop,
          value:  val || 0
        });
        
        $('.nowplaying_position').text(this.convertVal(val));
        $('.nowplaying_duration').text(this.convertVal(max));
      },
      
      // Gets or sets the value of the slider
      val: function(val) {
        if (!this.slider) return;
        if (typeof val == 'undefined')
          return this.slider.slider('value');
        else {
          val = Math.floor(Number(val));
          this.slider.each(function(){
            $(this).slider('value', val);
          });
          return val;
        }
      },
      
      // Destroy the slider functionality
      destroy: function(enable) {
        $('.nowplaying_slider').slider('destroy');
        $('.nowplaying_position').html("&nbsp;");
        $('.nowplaying_duration').html("&nbsp;");
      },
      
      // Converts the given (should be integer) value to a time if necessary
      convertVal: function(val) {
        if (this.isTime) {
          var hours = Math.floor(val / (60 * 60));
          var divisor_for_minutes = val % (60 * 60);
          var minutes = Math.floor(divisor_for_minutes / 60);
          var divisor_for_seconds = divisor_for_minutes % 60;
          var seconds = Math.ceil(divisor_for_seconds);
          var ret = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
          if (hours > 0) ret = hours + ":" + (minutes < 10 ? "0" : "") + ret;
          return ret;
        }
        else
          return val;
      },
      
      // This event is triggered when the user starts sliding
      start: function(ev, ui) {
        Touchee.Controls.Slider.sliding = true;
        Touchee.Controls.clearPositionTimeout();
      },
      
      // This event is triggered on every mouse move during slide
      slide: function(ev, ui) {
        $('.nowplaying_position').text(Touchee.Controls.Slider.convertVal(ui.value));
        Touchee.Commands.send({action:'position', value:ui.value});
      },
      
      // This event is triggered on slide stop, or if the value is changed programmatically (by the value method)
      change: function(ev, ui) {
        $('.nowplaying_position').text(Touchee.Controls.Slider.convertVal(ui.value));
      },
      
      // This event is triggered when the user stops sliding
      stop: function(ev, ui) {
        // Touchee.Commands.send({action:'position', value:ui.value});
        //if (!this.paused) this.setPositionTimeout();
        Touchee.Controls.Slider.sliding = false;
        Touchee.Commands.send({action:'status'});
      }
      
    },
    
    // All volume-related stuff
    Volume: {
      
      // 
      init: function() {
        
        // Show volume popup when clicked on button
        $('#volume_button').bind('mouseup touchend', function(ev){
          // Show overlay and hide popup when clicked on overlay
          Touchee.Overlay.show(function(){
            $('#volume_popup').hide();
          });
          $('#volume_popup').show();
          ev.preventDefault();
          return false;
        });
        
        // Set volume slider
        $('.volume_slider').append( $("<div/>") );
        this.slider = $('.volume_slider > div').slider({
          range:  'min',
          min:    0,
          max:    100,
          value:  0,
          slide: function(ev, ui){ Touchee.Commands.send({action:'volume',value:ui.value}); },
          start: function(){ Touchee.Controls.Volume.sliding = true; },
          stop:  function(ev, ui){
            Touchee.Controls.Volume.sliding = false;
            Touchee.Commands.status();
          }
        });
        
      },
      
      // Sets the volume
      set: function(val) {
        this.slider.each(function(){
          $(this).slider('value', parseInt(val));
        });
      }
      
    },
    
    // Sets which item is currently playing
    setStatus: function(data) {
      if (!Touchee.Controls.Slider.sliding && !Touchee.Controls.Volume.sliding) {
        $('.nowplaying_title').html(!data.title || data.title == "" ? "&nbsp;" : data.title);
        $('#nowplaying_artist').html(!data.artist || data.artist == "" ? "&nbsp;" : data.artist);
        $('#nowplaying_collection').html(!data.collection || data.collection == "" ? "&nbsp;" : data.collection);
        
        $('#nowplaying_artist_collection').html(
          data.artist + (data.artist + data.collection != "" ? " - " : "") + data.collection
        );
        
        if (data.total == 0)
          this.Slider.destroy();
        else
          this.Slider.set(data.isTimed, data.total, data.position || 0);

        // Play/pause buttons and position
        if (data.paused || data.stopped)  {
          $('.pause').hide();
          $('.play').show();
          this.paused = true;
          this.clearPositionTimeout();
        }
        else {
          $('.pause').show();
          $('.play').hide();
          this.paused = false;
          this.setPositionTimeout();
        }
        
        // Shuffle / repeat
        $('.shuffle').toggleClass('on', data.shuffle);
        $('.repeat').toggleClass('on', data.repeat == 1);
        $('.repeat').toggleClass('on_1', data.repeat == 2);
        
        // Destroy slider is we are not playing
        if (data.index == -1 || data.stopped)
          this.Slider.destroy();
        
        // Set volume
        this.Volume.set(data.volume);
        
        // Set now playing list
        if (this.nowPlayingListID != data.nowPlayingListID) {
          this.nowPlayingListID == data.nowPlayingListID;

          $('#nowplaying_list_container > table').
            empty().
            append(
              $('#nowplayingListTemplate').tmpl( data )
            );
        }
        
        // Set now playing icons and artwork
        this.nowPlayingID = data.id;
        if (data.id > 0)
          $('#nowplaying_count').html(data.counter).show();
        else
          $('#nowplaying_count').hide();
        Touchee.Controls.setNowPlaying();

        if (data.artworkID > 0) {
          if (this.artworkID != data.artworkID) {
            $('#nowplaying_perspective > .nowplaying_artwork').css('background-image', "url(/artwork/" + data.artworkID + "/original)");
            $('.nowplaying_artwork.button').css('background-image', "url(/artwork/" + data.artworkID + ")");
          }
        }
        else {
          $('.nowplaying_artwork').removeAttr('data-id').css('background-image', "");
        }
        this.artworkID = data.artworkID;
        
      }
    
    },
    
    // Increase the position by 1 second
    increasePosition: function() {
      Touchee.Controls.Slider.val( Touchee.Controls.Slider.val() + 1 );
      Touchee.Controls.setPositionTimeout();
    },
    
    // Sets the position timeout
    setPositionTimeout: function() {
      if (!this.positionTimeout || this.positionTimeout.cleared)
        this.positionTimeout = new Timeout(this.increasePosition, 1000, this);
    },
    
    // Clears the position timeout
    clearPositionTimeout: function() {
      if (this.positionTimeout)
        this.positionTimeout.clear();
    },
    
    // Clicked a button
    clickedButton: function(ev) {
      Touchee.Commands.control($(ev.target).closest('.button').attr('data-button'));
      ev.preventDefault();
    },

    // Set now playing indicators based on the currently playing track
    setNowPlaying: function() {

      // Remove speaker icons from track lists
      $('p.playing').each(function(){
        var $this = $(this);
        $this.replaceWith( $this.text() );
      });
      
      // Remove other playing indicators
      $('.playing').removeClass('playing');

      // If we have something playing
      if (this.nowPlayingID > 0) {
        
        // Add simple now playing to rows
        $('[data-id=' + this.nowPlayingID + ']').addClass('playing');
        
        // Add speaker to track list
        $('br.playing, hr.playing').each(function(){
          var $this = $(this);
          var numberNode = $this.closest('tr').find('td:nth-child(2)')[0].childNodes[$this.prevAll().length*2];
          $(numberNode).replaceWith( $('<p>').addClass('playing').text( $(numberNode).text()) );
        });

      }
    },
    
    // 
    switchArea: function() {
      
      var nowplaying = $('#nowplaying');
      if (!nowplaying.hasClass('active'))
        nowplaying[0].style.display = 'block';
      else
        setTimeout(function(){
          nowplaying[0].style.display = 'none';
          $('#nowplaying').addClass('initial');
          $('#nowplaying').removeClass('flipped');
        }, 750);
      setTimeout(function(){
        nowplaying.toggleClass('active');
      },0);

      return false;
    }
    
  }
  
})(jQuery);

function Timeout(fn, interval, scope) {
  var timeout = this;
  var id = setTimeout(function(){
    timeout.clear();
    fn.call(scope);
  }, interval);
  this.cleared = false;
  this.clear = function () {
    this.cleared = true;
    clearTimeout(id);
  };
}