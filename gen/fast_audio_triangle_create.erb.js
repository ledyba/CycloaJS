if(this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0){
	//freqが1や0だと、ここでもモデルが破綻する。FF1のOPで発生。
	/* unsigned int */ var nowCounter = this.__triangle__freqCounter + delta;
	var freq = this.__triangle__frequency + 1;
	this.__triangle__freqCounter = nowCounter % freq;
	sound += this.__triangle__waveForm[this.__triangle__streamCounter = (this.__triangle__streamCounter + (nowCounter  / freq)) & 31];
}

