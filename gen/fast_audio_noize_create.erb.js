if(this.__noize__lengthCounter != 0){
	/* unsigned int */var nowCounter = this.__noize__freqCounter + delta;
	/* const uint16_t */var divFreq = this.__noize__frequency + 1;
	/* const uint8_t */var shiftAmount = this.__noize__modeFlag ? 6 : 1;
	//FIXME: frequencyが小さい時に此のモデルが破綻する
	while(nowCounter >= divFreq){
		nowCounter -= divFreq;
		this.__noize__shiftRegister =(this.__noize__shiftRegister >> 1) | (((this.__noize__shiftRegister ^ (this.__noize__shiftRegister >> this.__noize__shiftAmount))  & 1) << 14);
	}
	this.__noize__freqCounter = nowCounter;
	if(((this.__noize__shiftRegister & 1) == 1)){
		sound += this.__noize__decayEnabled ? -this.__noize__decayVolume : -this.__noize__volumeOrDecayRate;
	}else{
		sound += this.__noize__decayEnabled ? this.__noize__decayVolume : this.__noize__volumeOrDecayRate;
	}
}

