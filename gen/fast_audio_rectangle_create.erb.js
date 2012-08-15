%# -*- encoding: utf-8 -*-
% isFirstChannel = args[:isFirstChannel]
% prefix=isFirstChannel ? "__rectangle0__" : "__rectangle1__"

if(this.<%= prefix %>lengthCounter != 0 && this.<%= prefix %>frequency >= 0x8 && this.<%= prefix %>frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var nowCounter = this.<%= prefix %>freqCounter + delta;
	this.<%= prefix %>freqCounter = nowCounter % (this.<%= prefix %>frequency + 1);
	this.<%= prefix %>dutyCounter = (this.<%= prefix %>dutyCounter + (nowCounter  / (this.<%= prefix %>frequency + 1))) & 15;
	if(this.<%= prefix %>dutyCounter < this.<%= prefix %>dutyRatio){
		sound += this.<%= prefix %>decayEnabled ? this.<%= prefix %>decayVolume : this.<%= prefix %>volumeOrDecayRate;
	}else{
		sound += this.<%= prefix %>decayEnabled ? -this.<%= prefix %>decayVolume : -this.<%= prefix %>volumeOrDecayRate;
	}
}

