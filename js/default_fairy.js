var cycloa;
if(!cycloa) cycloa = {};

cycloa.AbstractAudioFairy = function(){
	this.enabled = false;//supported or not.
	this.data = undefind;//audio data buffer to fill
	this.dataLength = 0;//length of the buffer
	this.dataIndex = undefined;// the index of the buffer
	this.onDataFilled = function(){};//called when all data buffer has been filled.
};

cycloa.AbstractVideoFairy = function(){
	this.dispatchRendering = function(/* Uint8Array */ nesBuffer, /* Uint8 */ paletteMask){}; //called on vsync
};

cycloa.AbstractPadFairy = function(){
	this.A=0;
	this.B=1;
	this.SELECT=2;
	this.START=3;
	this.UP=4;
	this.DOWN=5;
	this.LEFT=6;
	this.RIGHT=7;
	this.TOTAL=8;
	this.MASK_A=1;
	this.MASK_B=2;
	this.MASK_SELECT=4;
	this.MASK_START=8;
	this.MASK_UP=16;
	this.MASK_DOWN=32;
	this.MASK_LEFT=64;
	this.MASK_RIGHT=128;
	this.MASK_ALL=255;
	this.state = 0; //button state
};
