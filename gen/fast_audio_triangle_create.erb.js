if(this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0){
	//freqが1や0だと、ここでもモデルが破綻する。FF1のOPで発生。
	/* unsigned int */ var nowCounter = this.__triangle__freqCounter + delta;
	this.__triangle__freqCounter = nowCounter % (this.__triangle__frequency + 1);
	this.__triangle__streamCounter = (this.__triangle__streamCounter + (nowCounter  / (this.__triangle__frequency + 1))) & 31;
	sound += this.__triangle__waveForm[this.__triangle__streamCounter];
}

