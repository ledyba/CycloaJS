%# -*- encoding: utf-8 -*-

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
