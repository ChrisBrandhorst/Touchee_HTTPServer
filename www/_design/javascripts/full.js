$(document).ready(function(){
  
  // $('.scrollable').scrollfix();
  
  $('.nowplaying_slider > div').slider({
    value: 25,
    range: 'min'
  });
  
  $('.volume > div').slider({
    value: 50,
    range: 'min'
  });
  
  $('button[data-button=settings]').bind('touchstart', function(){
    window.location.reload();
  });
  
  $('#nowplaying_music button[data-button=list], #nowplaying_music button[data-button=artwork]').click(function(){
    $('#nowplaying_music').toggleClass('flip');
  });
  
  $('button[data-button=nowplaying]').click(function(){
    $('#browser').hide();
    $('#nowplaying_music').show();
  });
  
  $('button[data-button=back]').click(function(){
    $('#browser').show();
    $('#nowplaying_music').hide();
  });
  
  $('button[data-button=volume]').click(function(){
    $('#devices_popup').toggle();
  });
  
});