%# -*- encoding: utf-8 -*-
% isFirstChannel = args[:isFirstChannel]
% prefix=isFirstChannel ? "__rectangle0__" : "__rectangle1__"

if(this.<%= prefix %>lengthCounter != 0 && !this.<%= prefix %>loopEnabled){
	this.<%= prefix %>lengthCounter--;
}
if(this.<%= prefix %>sweepEnabled){
	if(this.<%= prefix %>sweepCounter == 0){
		this.<%= prefix %>sweepCounter = this.<%= prefix %>sweepUpdateRatio;
		if(this.<%= prefix %>lengthCounter != 0 && this.<%= prefix %>sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var <%= prefix %>shift = (this.<%= prefix %>frequency >> this.<%= prefix %>sweepShiftAmount);
			if(this.<%= prefix %>sweepIncreased){
				this.<%= prefix %>frequency += <%= prefix %>shift;
			}else{
				this.<%= prefix %>frequency -= <%= prefix %>shift;
% if isFirstChannel
					this.<%= prefix %>frequency--;
% end
			}
		}
	}else{
		this.<%= prefix %>sweepCounter--;
	}
}

