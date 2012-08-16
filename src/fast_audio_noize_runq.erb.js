%# -*- encoding: utf-8 -*-

if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

