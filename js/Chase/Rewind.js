if (typeof (console) === "undefined") var console = {
	log: function() {}
};
// Toggle between Pause and Play modes.
var pausePlayStop = function(stop) {
	var d = document.getElementById("pausePlayStop");
	if (stop) {
		MIDI.Player.stop();
		d.src = "images/play.png";
	} else if (MIDI.Player.playing) {
		d.src = "images/play.png";
		MIDI.Player.pause(true);
	} else {
		d.src = "images/pause.png";
		MIDI.Player.resume();
	}
};
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
	for (var n = 0; n < 88; n++) {
		var d = document.createElement("div");
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
			/// this sets up the MIDI.Player and gets things going...
			player = MIDI.Player;
			player.timeWarp = 1; // speed the song is played back
			player.loadFile("ff10.mid", player.start);

			/// control the piano keys colors
			var colorMap = MIDI.Synesthesia.map();
			player.addListener(function(data) {
				var pianoKey = data.note - 21;
				var d = colorElements[pianoKey];
				if (d) {
					if (data.message === 144) {
						var map = colorMap[data.note - 27];
						if (map) d.style.background = map.hex;
						d.style.color = "#fff";
					} else {
						d.style.background = "";
						d.style.color = "";
					}
				}
			});
			///
			//ColorSphereBackground();
			MIDIPlayerPercentage(player);
		}
	});
});

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
		if (now === end) { // go to next song
			var id = ++songid % song.length;
			player.loadFile("ff10.mid", player.start); // load MIDI
		}
		// display the information to the user
		timeCursor.style.width = (percent * 100) + "%";
		time1.innerHTML = timeFormatting(now);
		time2.innerHTML = "-" + timeFormatting(end - now);
	});
};