cycloa.calc_fps_mode = false;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
	if(cycloa.calc_fps_mode){
		return function(callback){
			window.setTimeout(callback, 0);
		};
	}
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * @constructor
 * */
function NesController(){
	this.videoFairy_ = new VideoFairy();
	this.audioFairy_ = new AudioFairy();
	this.padFairy_ = new PadFairy($(document));
	this.machine_ = new cycloa.VirtualMachine(this.videoFairy_, this.audioFairy_, this.padFairy_);
	this.running_ = false;
	this.loaded_ = false;
	this.total_frame_ = 0;
}
NesController.prototype.load = function(dat){
	this.machine_.load(dat);
	if(!this.loaded_){
		this.machine_.onHardReset();
	}else{
		this.machine_.onReset();
	}
	this.loaded_ = true;
	if(!this.running_){
		this.start();
	}
	return true;
};
NesController.prototype.start = function(){
	if(this.running_){
		$("#state").text("VM already running! Please stop the machine before loading another game.");
		return false;
	}
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running_ = true;
	var self = this;
	var cnt = 0;
	var state = $("#state");
	var loop = function () {
		if(self.running_) window.requestAnimFrame(loop);
		self.machine_.run();
		cnt++;
		if (cnt >= 30) {
			var now = new Date();
			self.total_frame_ += cnt;
			var str = "fps: " + (cnt * 1000 / (now - beg)).toFixed(2);
			if(cycloa.calc_fps_mode){
				str += " / avg: "+(self.total_frame_ * 1000/(now-startTime)).toFixed(2);
			}
			state.text(str);
			beg = now;
			cnt = 0;
		}
	};
	var beg = new Date();
	var startTime = beg
	loop();
	return true;
};
NesController.prototype.stop = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running_ = false;
	return true;
};
NesController.prototype.hardReset = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine_.onHardReset();
	return true;
};
NesController.prototype.reset = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine_.onReset();
	return true;
};
NesController.prototype.zoom = function(){
	this.videoFairy_.zoom();
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

		$("#screen_zoom").bind("click", function(){
			nesController.zoom();
		});

		$("#rom_sel")[0].selectedIndex  = 0;
		$("#nes_stop").removeClass("disable");
		$("#nes_start").addClass("disable");

		nesController = new NesController();
		$("#state").text("Initialized");
	});
}());
