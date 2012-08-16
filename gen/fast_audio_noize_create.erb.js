if(this.__noize__lengthCounter != 0){
	/* unsigned int */var nowCounter = this.__noize__freqCounter + delta;
	/* const uint16_t */var divFreq = this.__noize__frequency + 1;
	/* const uint8_t */var shiftAmount = this.__noize__modeFlag ? 6 : 1;
	//FIXME: frequencyが小さい時に此のモデルが破綻する
	var shiftReg = this.__noize__shiftRegister;
	while(nowCounter >= divFreq){
		nowCounter -= divFreq;
		shiftReg =(shiftReg >> 1) | (((shiftReg ^ (shiftReg >> shiftAmount))  & 1) << 14);
	}

	if(((shiftReg & 1) == 1)){
		sound += this.__noize__decayEnabled ? -this.__noize__decayVolume : -this.__noize__volumeOrDecayRate;
	}else{
		sound += this.__noize__decayEnabled ? this.__noize__decayVolume : this.__noize__volumeOrDecayRate;
	}

	this.__noize__freqCounter = nowCounter;
	this.__noize__shiftRegister = shiftReg;
}

