if(this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0){
	//freqが1や0だと、ここでもモデルが破綻する。FF1のOPで発生。
	/* unsigned int */ var __triangle__nowCounter = this.__triangle__freqCounter + __audio__delta;
	var __triangle__freq = this.__triangle__frequency + 1;
	this.__triangle__freqCounter = __triangle__nowCounter % __triangle__freq;
	__audio__sound += this.__triangle__waveForm[this.__triangle__streamCounter = (this.__triangle__streamCounter + (__triangle__nowCounter  / __triangle__freq)) & 31];
}

