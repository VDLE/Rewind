if (typeof (console) === "undefined") var console = {
	log: function() {}
};
var on = 0;
// Toggle between Pause and Play modes.
var pausePlayStop = function(stop) {
	var d = document.getElementById("pausePlayStop");
	if (stop) {
		MIDI.Player.stop();
	} else if (MIDI.Player.playing) {
		MIDI.Player.pause(true);
		on = 1;
	} else {
		MIDI.Player.resume();
		on = 0;
	}
};
var unique = 0;
var music;
eventjs.add(window, "load", function(event) {
	var link = document.createElement("link");
	link.href = "//fonts.googleapis.com/css?family=Oswald";
	link.ref = "stylesheet";
	link.type = "text/css";
	document.body.appendChild(link);
	var link = document.createElement("link");
	link.href = "//fonts.googleapis.com/css?family=Andada";
	link.ref = "stylesheet";
	link.type = "text/css";
	document.body.appendChild(link);
	
	/// load up the piano keys
	var colors = document.getElementById("colors");
	var colorElements = [];
	var dtimes = [];
	for (var n = 0; n < 88; n++) {
		var d = document.createElement("div");
		d.id = n;
		d.innerHTML = MIDI.noteToKey[n + 21];
		colorElements.push(d);
		colors.appendChild(d);
	}
	///
	MIDI.loader = new sketch.ui.Timer;
	MIDI.loadPlugin({
		soundfontUrl: "soundfont/",
		onprogress: function(state, progress) {
			MIDI.loader.setValue(progress * 100);
		},
		onsuccess: function() {

			// Sets up the MIDI.Player
			player = MIDI.Player;
			player.timeWarp = 1; 
			player.BPM = false;
			player.loadFile("frog.mid", function(){

				// Set up roll
				music = player.data;
				var time = 0;
				var notemap = new Array();
				for (var n = 0; n < music.length; n ++) 
				{
					var event = music[n][0].event;
					
					time = time + music[n][1];
					switch(event.subtype) {

						case 'noteOn':
							notemap["" + event.channel + " event " + event.noteNumber] = time / 1000.0;
							break;

						case 'noteOff':
							if ( ("" + event.channel + " event " + event.noteNumber) in notemap)
							{
								var dtime = time/1000.0 - notemap["" + event.channel + " event " + event.noteNumber] ;
								dtimes.push(dtime);
							}
							break;
					}

				}
			});

			// Control the piano keys colors
			var colorMap = MIDI.Synesthesia.map();
			player.addListener(function(data) {

				// Set up Piano Keys
				var pianoKey = data.note - 21;
				var d = colorElements[pianoKey];

				// Create Piano Key Div
				var map = colorMap[data.note - 27];
				var offset = $('#'+d.id).offset();
				var $div = $("<div>", {class: "note"});
				$div.css("top", offset.top);
				$div.css("background-color", map.hex);
				//var left = $div.offset().left;


				if (d) {
					if (data.message === 144) {
						//$("#pausePlayStop").addClass("pulse");
						if (map) d.style.background = map.hex;
						d.style.color = "#fff";

						// Piano Roll
						$("#color2").append($div);
						var width = $div.css("width").slice(0,-2);
						var dtime = dtimes.shift();
						$div.css("width", $(window).width() * dtime / player.end * 10 + "px" ) ;//width * dtimes.shift() + "px");
						$div.css("left", -($(window).width() * dtime / player.end * 10 - 35) + "px");
						$div.animate({
							left:"100%", 
							opacity:"show",
						},  ($(window).width() + ($(window).width() * dtime / player.end * 10 - 35) ) / .5,"linear")
						.promise().done(function(){
							$div.remove();
						});
					} else {

						// Bounce
						//var elm = document.getElementById("pausePlayStop");
						//var newone = elm.cloneNode(true);
						//elm.parentNode.replaceChild(newone, elm);
						
						// Reset Color
						d.style.background = "";
						d.style.color = "";
						

					}
				}
			});

			// Progress Bar
			MIDIPlayerPercentage(player);
		}
	});
});

var toggle = 0;
var MIDIPlayerPercentage = function(player) {
	// update the timestamp
	var time1 = document.getElementById("time1");
	var time2 = document.getElementById("time2");
	var capsule = document.getElementById("capsule");
	var timeCursor = document.getElementById("cursor");
	//
	eventjs.add(capsule, "drag", function(event, self) {
		eventjs.cancel(event);
		player.currentTime = (self.x) / 420 * player.endTime;
		if (player.currentTime < 0) player.currentTime = 0;
		if (player.currentTime > player.endTime) player.currentTime = player.endTime;
		if (self.state === "down") {
			player.pause(true);
		} else if (self.state === "up") {
			player.resume();
		}
	});

	function timeFormatting(n) {
		var minutes = n / 60 >> 0;
		var seconds = String(n - (minutes * 60) >> 0);
		if (seconds.length == 1) seconds = "0" + seconds;
		return minutes + ":" + seconds;
	};
	
	player.setAnimation(function(data, element) {
		var percent = data.now / data.end;
		var now = data.now >> 0; // where we are now
		var end = data.end >> 0; // end of song
		var events = data.events;

		// display the information to the user
		timeCursor.style.width = (percent * 100) + "%";
		time1.innerHTML = timeFormatting(now);
		time2.innerHTML = timeFormatting(end);
		player.end = end;
		$(".timer").html("");
		if(toggle == 1) $(".timer").html(timeFormatting(end - now));
	});
};

$(document).ready(function() {
	var icon = $('.play');
	var unplayed = 0;
	
	icon.click(function() {
	 if(unplayed == 0){
		 unplayed = 1;
		 MIDI.Player.start();
	 }
	 toggle = (toggle + 1) %2;
	 $(this).toggleClass('play', 10).toggleClass('pause', 10);
	});
  
});