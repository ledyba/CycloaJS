%# -*- encoding: utf-8 -*-
% isFirstChannel = args[:isFirstChannel]
% prefix=isFirstChannel ? "__rectangle0__" : "__rectangle1__"

this.<%= prefix %>analyzeVolumeRegister = function(/* uint8_t */ reg) {
	this.<%= prefix %>decayCounter = this.<%= prefix %>volumeOrDecayRate = reg & 15;
	this.<%= prefix %>decayEnabled = (reg & 16) == 0;
	this.<%= prefix %>loopEnabled = (reg & 32) == 32;
	switch(reg >> 6)
	{
	case 0:
		this.<%= prefix %>dutyRatio = 2;
		break;
	case 1:
		this.<%= prefix %>dutyRatio = 4;
		break;
	case 2:
		this.<%= prefix %>dutyRatio = 8;
		break;
	case 3:
		this.<%= prefix %>dutyRatio = 12;
		break;
	}
};
this.<%= prefix %>analyzeSweepRegister = function(/* uint8_t */ reg) {
	this.<%= prefix %>sweepShiftAmount = reg & 7;
	this.<%= prefix %>sweepIncreased = (reg & 0x8) === 0x0;
	this.<%= prefix %>sweepCounter = this.<%= prefix %>sweepUpdateRatio = (reg >> 4) & 3;
	this.<%= prefix %>sweepEnabled = (reg&0x80) === 0x80;
};
this.<%= prefix %>analyzeFrequencyRegister = function(/* uint8_t */ reg)
{
	this.<%= prefix %>frequency = (this.<%= prefix %>frequency & 0x0700) | (reg);
}
this.<%= prefix %>analyzeLengthRegister = function(/* uint8_t */ reg) {
	this.<%= prefix %>frequency = (this.<%= prefix %>frequency & 0x00ff) | ((reg & 7) << 8);
	this.<%= prefix %>lengthCounter = this.LengthCounterConst[reg >> 3];
	//Writing to the length registers restarts the length (obviously),
	//and also restarts the duty cycle (channel 1,2 only),
	this.<%= prefix %>dutyCounter = 0;
	//and restarts the decay volume (channel 1,2,4 only).
	this.<%= prefix %>decayReloaded = true;
};
this.<%= prefix %>setEnabled = function(/* bool */ enabled) {
	if(!enabled){
		this.<%= prefix %>lengthCounter = 0;
	}
};
this.<%= prefix %>isEnabled = function() {
	return this.<%= prefix %>lengthCounter != 0 && this.<%= prefix %>frequency >= 0x8 && this.<%= prefix %>frequency  < 0x800;
};
this.<%= prefix %>onHardReset = function() {
	this.<%= prefix %>volumeOrDecayRate = 0;
	this.<%= prefix %>decayReloaded = false;
	this.<%= prefix %>decayEnabled = false;
	this.<%= prefix %>decayVolume = 0;
	this.<%= prefix %>dutyRatio = 0;
	this.<%= prefix %>freqCounter = 0;
	this.<%= prefix %>dutyCounter = 0;
	this.<%= prefix %>decayCounter = 0;
	this.<%= prefix %>sweepEnabled = 0;
	this.<%= prefix %>sweepShiftAmount = 0;
	this.<%= prefix %>sweepIncreased = false;
	this.<%= prefix %>sweepUpdateRatio = 0;
	this.<%= prefix %>sweepCounter = 0;
	this.<%= prefix %>frequency = 0;
	this.<%= prefix %>loopEnabled = false;
	this.<%= prefix %>lengthCounter = 0;
};
this.<%= prefix %>onReset = function(){
	this.<%= prefix %>onHardReset();
};
