%# -*- encoding: utf-8 -*-
this.__audio__readReg = function(addr) {
 	// Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
	// If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared.
	/*uint8_t*/ var ret =
			(this.__rectangle0__isEnabled()	? 1 : 0)
			|	(this.__rectangle1__isEnabled() ? 2 : 0)
			|	(this.__triangle__isEnabled() ? 4 : 0)
			|	(this.__noize__isEnabled()	? 8 : 0)
			|	(this.__digital__isEnabled() ? 16 : 0)
			|	((<%= CPU::IsIRQPending(CPU::IRQ::FRAMECNT)%>) ? 64 : 0)
			|	(this.__digital__isIRQActive() ? 128 : 0)
	<%= CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) %>

	return ret;
};

this.__audio__onHardReset = function() {
	this.__audio__clockCnt = 0;
	this.__audio__leftClock = 0;

	this.__audio__frameIRQenabled = true;
	<%= CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) %>

	this.__audio__isNTSCmode = true;
	this.__audio__frameIRQCnt = 0;
	this.__audio__frameCnt = 0;
};
this.__audio__onReset = function() {
};
