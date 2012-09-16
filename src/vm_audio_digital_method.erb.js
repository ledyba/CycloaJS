%# -*- encoding: utf-8 -*-

<%= MachineName %>.prototype.__digital__isIRQEnabled = function()
{
	return this.__digital__irqEnabled;
}
<%= MachineName %>.prototype.__digital__onHardReset = function() {
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
<%= MachineName %>.prototype.__digital__onReset = function() {
	this.__digital__onHardReset();
};

