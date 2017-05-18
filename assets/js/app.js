$(function() {

  var $main = $("#main");
  var $body = $("body");

  var arrAjaxCalls = [];

  const HTML_SPINNER = "<i class='fa fa-circle-o-notch fa-spin'></i>";
  const initalStreamersObj = { streamers: ["freecodecamp"] };

  const urlTwitchChannels = 'http://wind-bow.glitch.me/twitch-api/channels/';
  const urlTwitchStreams = 'https://wind-bow.glitch.me/twitch-api/streams/';

  var streamers = [];

  const timerIcon = '<i class="fa fa-refresh"></i> ';
  const timerText = 'min since last Refresh';

  var minutesSinceRefresh = 0,
  timer;

  function setRefreshTimer() {
    clearInterval (timer);

    minutesSinceRefresh = 0;
    $("#btnRefresh").html(timerIcon + minutesSinceRefresh + timerText);

    timer = setInterval ( function(){
      minutesSinceRefresh++;
      $("#btnRefresh").html(timerIcon + minutesSinceRefresh + timerText);
    }, 60000);
  }

  $("#btnRefresh").click(function () {
    $('form')[0].reset();
    $("#btnMore").click();
    loadStreamers();
  });

  $("#btlDelErrors").click(function () {
    var streamerObj= JSON.parse(localStorage.getItem('myStreamers'));

    for (var i = 0; i < streamers.length; i++) {
      if (streamers[i].error) {
        streamerObj.streamers.splice(streamers[i].key);
      }
    }

    localStorage.setItem('myStreamers', JSON.stringify(streamerObj));

    $('form')[0].reset();
    $("#btnMore").click();
    loadStreamers();
  });

  $("#btnResetDefault").click(function () {
    localStorage.setItem('myStreamers', '');

    $('form')[0].reset();
    $("#btnMore").click();
    loadStreamers();
  });

  $(".btnFilter").click(function () {
    if ($(this).hasClass('active')) {
      $('.btnFilter').removeClass('active');
      $('article', $main).show();
    }
    else {
      $('.btnFilter').removeClass('active');
      $('article', $main).hide();
      $('article.' + $(this).data('filter'), $main).show();
      $(this).addClass('active');
    }

    if ($('article:visible').length > 0) {
      $body.removeClass('no-streamers-to-show');
    }
    else {
      $body.addClass('no-streamers-to-show');
    }
  });

  $('form').submit(function (ev) {
    ev.preventDefault();

    var streamerObj= JSON.parse(localStorage.getItem('myStreamers'));
    streamerObj.streamers.push($('#username').val().trim());
    localStorage.setItem('myStreamers', JSON.stringify(streamerObj));

    this.reset();

    $("#btnMore").click();
    loadStreamers();
  });

  $('body').on('click', '[data-key]', function() {
    var streamerObj = JSON.parse(localStorage.getItem('myStreamers'));

    streamerObj.streamers.splice($(this).data("key"), 1);

    localStorage.setItem('myStreamers', JSON.stringify(streamerObj));

    $('span.closer').click();

    loadStreamers();
  });

  function loadStreamers() {

    if (!localStorage.getItem('myStreamers')) {
      localStorage.setItem('myStreamers', JSON.stringify(initalStreamersObj));
    }

    var streamerObj = JSON.parse(localStorage.getItem('myStreamers'));
    streamers = [];

    $main.html("");

    $body.addClass('loading');

    // Map returned deferred objects
    var deferreds = streamerObj.streamers.map(function(streamer, key) {
      var current;
      var ajax1 = $.ajax({
        url: urlTwitchChannels + streamer,
        method: 'get',
        dataType: 'json'
      }),
      ajax2 = ajax1.then(function(data) {
        if (data) {
          data.key = key;

          if (!data.logo) {
            data.cssClass = 'no-image';
            data.logo = 'images/Glitch_No_Logo.png';
          }

          if (data.error) {
            data.cssClass = 'doesnt-exist';
            data.logo = 'images/Glitch_Doesnt_Exist.png';
            data.display_name = data.error;
          }
          current = data;
          streamers.push(data);
        }

        return $.ajax({
          url: urlTwitchStreams + streamer,
          dataType: 'json'
        });
      });

      ajax2.done(function(data) {
        if (data.stream) {
          current.stream = data.stream;
          current.iconClass = "online";
          current.isOnline = true;
        }
        else {
          current.iconClass = "offline";
          current.isOnline = false;
        }
      });

      return ajax2;
    });

    $.when.apply($, deferreds).then(function() {
      var source   = $("#streamer-template").html();
      template = Handlebars.compile(source),
      html = template({streamers: streamers});

      if (streamers.length > 0) {
        $body.removeClass('no-streamers-to-show');
      }
      else {
        $body.addClass('no-streamers-to-show');
      }

      $main.html(html);

      window.setTimeout(function() {
        $body.removeClass('loading');
      }, 666);

      setRefreshTimer();

      $.initPopTrox();
    });
  }

  window.setTimeout(function() {
    loadStreamers();
  }, 310);
});
