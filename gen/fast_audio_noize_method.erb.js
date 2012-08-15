%# -*- encoding: utf-8 -*-

this.__noize__analyzeVolumeRegister = function(/*uint8_t*/ reg) {
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate = reg & 15;
	this.__noize__decayEnabled = (reg & 16) == 0;
	this.__noize__loopEnabled = (reg & 32) == 32;
};
this.__noize__analyzeFrequencyRegister = function(/*uint8_t*/ reg)
{
	this.__noize__modeFlag = (reg & 128) == 128;
	this.__noize__frequency = this.__noize__FrequencyTable[reg & 15];
};
this.__noize__analyzeLengthRegister = function(/* uint8_t */ reg) {
	//Writing to the length registers restarts the length (obviously),
	this.__noize__lengthCounter = this.LengthCounterConst[reg >> 3];
	//and restarts the decay volume (channel 1,2,4 only).
	this.__noize__decayReloaded = true;
};
this.__noize__setEnabled = function(/*bool*/ enabled) {
	if(!enabled){
		this.__noize__lengthCounter = 0;
	}
};
this.__noize__isEnabled = function() {
	return this.__noize__lengthCounter != 0;
};
this.__noize__onHardReset = function() {
	//rand
	this.__noize__shiftRegister = 1<<14;
	this.__noize__modeFlag = false;

	//decay
	this.__noize__volumeOrDecayRate = false;
	this.__noize__decayReloaded = false;
	this.__noize__decayEnabled = false;

	this.__noize__decayCounter = 0;
	this.__noize__decayVolume = 0;
	//
	this.__noize__loopEnabled = false;
	this.__noize__frequency = 0;
	//
	this.__noize__lengthCounter = 0;
	//
	this.__noize__freqCounter = 0;
};
this.__noize__onReset = function() {
	this.__noize__onHardReset();
};
