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
var current = "static/music/naruto.mid";
var path = "static/music/"
var music;
var roll;
var length;
var pixels = 2;
var dtimes = {};
function setup(){
				// Set up roll
				roll = $("#roll");
				music = player.data;
				length = player.endTime * 2 + "px";
				roll.css("left", "220px");
				roll.css("width", length);
			
				
				var time = 0;
				var notemap = new Array();
				for (var n = 0; n < music.length; n ++) 
				{
					var event = music[n][0].event;
					music[n][0].id = n;
					time = time + music[n][1];
					switch(event.subtype) {

						case 'noteOn':
							notemap["" + event.channel + " event " + event.noteNumber] = {time: time / 1000.0, id: n};
							break;

						case 'noteOff':
							if ( ("" + event.channel + " event " + event.noteNumber) in notemap && notemap["" + event.channel + " event " + event.noteNumber] != null)
							{
								// love the name
								notemapnote = notemap["" + event.channel + " event " + event.noteNumber];
								var dtime = time/1000.0 - notemapnote.time;
								notemap["" + event.channel + " event " + event.noteNumber] = null;
								
								// Start time and width or dtime
								var starttime = notemapnote.time;
								dtimes[notemapnote.id] = dtime;
								
								// Piano Roll Creation
								var noteId = event.noteNumber - 21;
								var offset = $('#'+noteId).offset();
								var $div = $("<div>", {class: "note", id: notemapnote.id+"-note"});
								$div.css("position", "absolute");
								$div.css("top", offset.top);
								$div.css("background-color", "#000");
								$div.css("width", dtime*1000+"px" );
								$div.css("left", starttime*1000+"px");
								roll.append($div);
							}
							break;
					}
						
					

				}
}
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
	for (var n = 87; n >= 0; n--) {
		var d = document.createElement("div");
		d.id = 87 - n;
		d.innerHTML = MIDI.noteToKey[n + 21];
		colorElements.push(d);
		colors.appendChild(d);
	}
	///
	MIDI.loader = new sketch.ui.Timer;
	MIDI.loadPlugin({
		soundfontUrl: "static/soundfont/",
		onprogress: function(state, progress) {
			MIDI.loader.setValue(progress * 100);
		},
		onsuccess: function() {

			// Sets up the MIDI.Player
			player = MIDI.Player;
			player.timeWarp = 1; 
			player.BPM = false;
			$("#dl").attr("href",current);
			player.loadFile(current, function(){

				setup();

			});

			// Control the piano keys colors
			var colorMap = MIDI.Synesthesia.map();
			player.addListener(function(data) {

				// Set up Piano Keys
				var pianoKey = data.note - 21;
				var d = colorElements[pianoKey];

				// Create Piano Key Div
				var map = colorMap[data.note - 27];

				if (d) {
					if (data.message === 144) {
						if (map) d.style.background = map.hex;
						d.style.color = "#fff";
						
						// Piano Roll
						$("#"+data.id+"-note").css("background-color", map.hex);
						// var divwidth = $("#"+data.id+"-note").css("width");
						// $("#roll").animate({left: -divwidth});
						

					} else {
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
var check = 0;
var MIDIPlayerPercentage = function(player) {
	// update the timestamp
	var time1 = document.getElementById("time1");
	var time2 = document.getElementById("time2");
	var capsule = document.getElementById("capsule");
	var timeCursor = document.getElementById("cursor");
	//
	eventjs.add(capsule, "drag", function(event, self) {
		eventjs.cancel(event);
		player.currentTime = (self.x) / 185 * player.endTime;
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
		if(check != now){
			$("#roll").animate({left: -now*1000+"px"}, 800);
		}
		check = now;
		
		// display the information to the user
		timeCursor.style.width = (percent * 100) + "%";
		time1.innerHTML = timeFormatting(now);
		time2.innerHTML = timeFormatting(end);
		player.end = end;
		$(".timer").html("");
		if(toggle == 1) $(".timer").html(timeFormatting(end - now));
	});
};

function uploadAudioFile(file,filename){
    var fd = new FormData();
    fd.append("upload_file", file);
	

	
	$.ajax({
          type : "POST",
          url : "http://localhost:5000/convert",
          data: fd,
		  crossDomain: true,
          contentType: 'application/json;charset=UTF-8',
         success: function(result) {
			 //alert("SUCCESS");
			 //console.log(result);
			 // Loaded midi file
			 current = result;
			 player.loadFile(current,setup);
			 //alert(file);
			 $("#dl").attr("href",current).attr("download", filename+".mid");
          },
		    processData: false,  // tell jQuery not to process the data
  contentType: false   // tell jQuery not to set contentType
		  
      });
}


$(document).ready(function() {
	var icon = $('.play');
	var unplayed = 0;
	$( "#roll" ).draggable({ axis: "x" });
	
	icon.click(function() {
		if(unplayed == 0){
			unplayed = 1;
			MIDI.Player.start();
		}
		toggle = (toggle + 1) %2;
		$(this).toggleClass('play', 10).toggleClass('pause', 10);
	});
	
	$('#file').change(function() {
		if($(".main-btn").hasClass("pause")){
			toggle = (toggle + 1) %2;
			$(".main-btn").toggleClass('play', 10).toggleClass('pause', 10);
		}
		
		check = 0;
		$("#roll").empty();
		var temp = $(this).val().replace(/C:\\fakepath\\/i, '');
		console.log(temp);
		$("#file-text").val(temp);
		
		
		uploadAudioFile($(this)[0].files[0],temp);
		//player.loadFile(path+temp,function(){

		//	setup();

		//});
	});
	
//	$('.file-button').on('change', function() {
//		$("#file-text").val(this.value);
//	});
	
  
});