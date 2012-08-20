%# -*- encoding: utf-8 -*-
% isFirstChannel = args[:isFirstChannel]
% prefix=isFirstChannel ? "__rectangle0__" : "__rectangle1__"

if(this.<%= prefix %>decayCounter === 0){
	this.<%= prefix %>decayCounter = this.<%= prefix %>volumeOrDecayRate;
	if(this.<%= prefix %>decayVolume === 0){
		if(this.<%= prefix %>loopEnabled){
			this.<%= prefix %>decayVolume = 0xf;
		}
	}else{
		this.<%= prefix %>decayVolume--;
	}
}else{
	this.<%= prefix %>decayCounter--;
}
if(this.<%= prefix %>decayReloaded){
	this.<%= prefix %>decayReloaded = false;
	this.<%= prefix %>decayVolume = 0xf;
}

