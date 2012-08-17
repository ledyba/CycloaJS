function NesController(){
	this.videoFairy = new VideoFairy();
	this.audioFairy = new AudioFairy();
	this.padFairy = new PadFairy();
	this.machine = new cycloa.FastMachine(this.videoFairy, this.audioFairy, this.padFairy);
	this.running = false;
	this.loaded = false;
}
NesController.prototype.load = function(dat){
	this.machine.load(dat);
	if(!this.loaded){
		this.machine.onHardReset();
	}else{
		this.machine.onReset();
	}
	this.loaded = true;
	if(!this.running){
		this.start();
	}
	return true;
};
NesController.prototype.start = function(){
	if(this.running){
		$("#state").text("VM already running! Please stop the machine before loading another game.");
		return false;
	}
	if(!this.loaded){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running = true;
	var self = this;
	var cnt = 0;
	var state = $("#state");
	var loop = function () {
		if(self.running) window.requestAnimFrame(loop);
		self.machine.run();
		cnt++;
		if (cnt >= 30) {
			var now = new Date();
			state.text("fps: " + (cnt * 1000 / (now - beg)));
			beg = now;
			cnt = 0;
		}
	};
	var beg = new Date();
	loop();
	return true;
};
NesController.prototype.stop = function(){
	if(!this.loaded){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running = false;
	return true;
};
NesController.prototype.hardReset = function(){
	if(!this.loaded){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine.onHardReset();
	return true;
};
NesController.prototype.reset = function(){
	if(!this.loaded){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine.onReset();
	return true;
};

var nesController;

(function(){
	$(document).ready(function(){
		jQuery.event.props.push('dataTransfer');
		 $("html").bind("drop", function(e){
			e.stopPropagation();
			e.preventDefault();
			var file = e.dataTransfer.files[0];

			$("#state").text("Now loading...");
			var reader = new FileReader();
			reader.onload = function (dat) {
				nesController.load(dat.target.result);
				$("#state").text("done.");
			};
			reader.readAsArrayBuffer(file);
		});
		$("html").bind("dragenter dragover", false);

		$("#rom_sel").bind("change", function(e){
			var val = e.currentTarget.value;
			if(val){
				$("#state").text("Now loading...");
				var xhr = jQuery.ajaxSettings.xhr();
				xhr.open('GET', val, true);
				xhr.responseType = 'arraybuffer';
				xhr.onreadystatechange = function() {
					if (this.readyState === this.DONE) {
						if(this.status === 200){
							nesController.load(this.response);
						}else{
							$("#state").text("oops. Failed to load game... Status: "+this.status);
						}
					}
				};
				xhr.send();
			}
		});

		$("#nes_hardreset").bind("click", function(){nesController.hardReset();});
		$("#nes_reset").bind("click", function(){nesController.reset();});
		$("#nes_stop").bind("click", function(){
			if(nesController.stop()){
				$("#nes_start").removeClass("disable");
				$("#nes_stop").addClass("disable");
			}
		});
		$("#nes_start").bind("click", function(){
			if(nesController.start()){
				$("#nes_stop").removeClass("disable");
				$("#nes_start").addClass("disable");
			}
		});
		$("#nes_start").addClass("disable");

		nesController = new NesController();
	});
}());