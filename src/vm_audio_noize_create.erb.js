if(this.__noize__lengthCounter != 0){
	/* unsigned int */var __noize__nowCounter = this.__noize__freqCounter + __audio__delta;
	/* const uint16_t */var __noize__divFreq = this.__noize__frequency + 1;
	/* const uint8_t */var __noize__shiftAmount = this.__noize__modeFlag ? 6 : 1;
	//FIXME: frequencyが小さい時に此のモデルが破綻する
	var __noize__shiftReg = this.__noize__shiftRegister;
	while(__noize__nowCounter >= __noize__divFreq){
		__noize__nowCounter -= __noize__divFreq;
		__noize__shiftReg =(__noize__shiftReg >> 1) | (((__noize__shiftReg ^ (__noize__shiftReg >> __noize__shiftAmount))  & 1) << 14);
	}

	if(((__noize__shiftReg & 1) == 1)){
		__audio__sound += this.__noize__decayEnabled ? -this.__noize__decayVolume : -this.__noize__volumeOrDecayRate;
	}else{
		__audio__sound += this.__noize__decayEnabled ? this.__noize__decayVolume : this.__noize__volumeOrDecayRate;
	}

	this.__noize__freqCounter = __noize__nowCounter;
	this.__noize__shiftRegister = __noize__shiftReg;
}

