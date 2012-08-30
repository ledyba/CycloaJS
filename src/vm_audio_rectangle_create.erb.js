%# -*- encoding: utf-8 -*-
% isFirstChannel = args[:isFirstChannel]
% prefix=isFirstChannel ? "__rectangle0__" : "__rectangle1__"

if(this.<%= prefix %>lengthCounter != 0 && this.<%= prefix %>frequency >= 0x8 && this.<%= prefix %>frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var <%= prefix %>nowCounter = this.<%= prefix %>freqCounter + __audio__delta;
	this.<%= prefix %>freqCounter = <%= prefix %>nowCounter % (this.<%= prefix %>frequency + 1);
	this.<%= prefix %>dutyCounter = (this.<%= prefix %>dutyCounter + (<%= prefix %>nowCounter  / (this.<%= prefix %>frequency + 1))) & 15;
	if(this.<%= prefix %>dutyCounter < this.<%= prefix %>dutyRatio){
		__audio__sound += this.<%= prefix %>decayEnabled ? this.<%= prefix %>decayVolume : this.<%= prefix %>volumeOrDecayRate;
	}else{
		__audio__sound += this.<%= prefix %>decayEnabled ? -this.<%= prefix %>decayVolume : -this.<%= prefix %>volumeOrDecayRate;
	}
}

