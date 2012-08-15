this.__triangle__analyzeLinearCounterRegister = function(/* uint8_t */ value) {
	this.__triangle__enableLinearCounter = ((value & 128) == 128);
	this.__triangle__linearCounterBuffer = value & 127;
};
this.__triangle__analyzeFrequencyRegister = function(/* uint8_t */ value) {
	this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | value;
}
this.__triangle__analyzeLengthCounter = function(/* uint8_t */ value) {
	this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((value & 7) << 8);
	this.__triangle__lengthCounter = this.LengthCounterConst[value >> 3];
	//Side effects 	Sets the halt flag
	this.__triangle__haltFlag = true;
};
this.__triangle__onHardReset = function(){
	this.__triangle__haltFlag = false;
	this.__triangle__enableLinearCounter = false;
	this.__triangle__frequency = 0;
	this.__triangle__linearCounterBuffer = 0;
	this.__triangle__linearCounter = 0;
	this.__triangle__lengthCounter = 0;
	this.__triangle__freqCounter = 0;
	this.__triangle__streamCounter = 0;
}
this.__triangle__onReset = function()
{
	this.__triangle__onHardReset();
}
this.__triangle__isEnabled = function()
{
	return this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0;
}
