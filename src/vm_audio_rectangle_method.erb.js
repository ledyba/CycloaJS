%# -*- encoding: utf-8 -*-
% isFirstChannel = args[:isFirstChannel]
% prefix=isFirstChannel ? "__rectangle0__" : "__rectangle1__"

<%= MachineName %>.prototype.<%= prefix %>onHardReset = function() {
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
<%= MachineName %>.prototype.<%= prefix %>onReset = function(){
	this.<%= prefix %>onHardReset();
};
