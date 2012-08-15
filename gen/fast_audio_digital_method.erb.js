%# -*- encoding: utf-8 -*-

this.__digital__analyzeFrequencyRegister = function(/*uint8_t*/ value) {
	this.__digital__irqEnabled = (value & 128) == 128;
	if(!this.__digital__irqEnabled){
		<%= CPU::ReleaseIRQ(CPU::IRQ::DMC) %>
	}
	this.__digital__loopEnabled = (value & 64) == 64;
	this.__digital__frequency = this.__digital__FrequencyTable[value & 0xf];
};
this.__digital__analyzeDeltaCounterRegister = function(/*uint8_t*/ value) {
	this.__digital__deltaCounter = value & 0x7f;
};
this.__digital__analyzeSampleAddrRegister = function(/*uint8_t*/ value) {
	this.__digital__sampleAddr = 0xc000 | (value << 6);
};
this.__digital__analyzeSampleLengthRegister = function(/*uint8_t*/ value) {
	this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (value << 4) | 1;
};
this.__digital__setEnabled = function(/*bool*/ enabled)
{
	if(!enabled){
		this.__digital__sampleLength = 0;
	}else if(this.__digital__sampleLength == 0){
		this.__digital__sampleLength = this.__digital__sampleLengthBuffer;
	}
}
this.__digital__isEnabled = function()
{
	return this.__digital__sampleLength != 0;
}
this.__digital__isIRQEnabled = function()
{
	return this.__digital__irqEnabled;
}
this.__digital__isIRQActive = function()
{
	// 4015への書き込みでDMCもクリアする。。。
	// http://twitter.com/#!/KiC6280/status/112744625491554304
	// nesdevのフォーラムでもその書き込みばかり。
	/*bool*/ ret = <%= CPU::IsIRQPending(CPU::IRQ::DMC) %>;
	<%= CPU::ReleaseIRQ(CPU::IRQ::DMC) %>;
	return ret;
};
this.__digital__onHardReset = function() {
	this.__digital__irqEnabled = false;
	<%= CPU::ReleaseIRQ(CPU::IRQ::DMC) %>
	this.__digital__loopEnabled = false;
	this.__digital__frequency = 0;
	this.__digital__deltaCounter = 0;
	this.__digital__sampleAddr = 0xc000;
	this.__digital__sampleLength = 0;
	this.__digital__sampleLengthBuffer = 0;
	this.__digital__sampleBuffer = 0;
	this.__digital__sampleBufferLeft = 0;

	this.__digital__freqCounter = 0;
};
this.__digital__onReset = function() {
	this.__digital__onHardReset();
};

