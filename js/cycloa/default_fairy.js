"use strict";

/**
 * @constructor
 * */
cycloa.AbstractAudioFairy = function(){
	this.enabled = false;//supported or not.
	this.data = undefined;//audio data buffer to fill
	this.dataLength = 0;//length of the buffer
	this.dataIndex = undefined;// the index of the buffer
};

//called when all data buffer has been filled.
cycloa.AbstractAudioFairy.prototype.onDataFilled = function(){
};

/**
 * @constructor
 * */
cycloa.AbstractVideoFairy = function(){
	this.dispatchRendering = function(/* Uint8Array */ nesBuffer, /* Uint8 */ paletteMask){}; //called on vsync
};

/**
 * @constructor
 * */
cycloa.AbstractPadFairy = function(){
};

cycloa.AbstractPadFairy.prototype.A=0;
cycloa.AbstractPadFairy.prototype.B=1;
cycloa.AbstractPadFairy.prototype.SELECT=2;
cycloa.AbstractPadFairy.prototype.START=3;
cycloa.AbstractPadFairy.prototype.UP=4;
cycloa.AbstractPadFairy.prototype.DOWN=5;
cycloa.AbstractPadFairy.prototype.LEFT=6;
cycloa.AbstractPadFairy.prototype.RIGHT=7;
cycloa.AbstractPadFairy.prototype.TOTAL=8;
cycloa.AbstractPadFairy.prototype.MASK_A=1;
cycloa.AbstractPadFairy.prototype.MASK_B=2;
cycloa.AbstractPadFairy.prototype.MASK_SELECT=4;
cycloa.AbstractPadFairy.prototype.MASK_START=8;
cycloa.AbstractPadFairy.prototype.MASK_UP=16;
cycloa.AbstractPadFairy.prototype.MASK_DOWN=32;
cycloa.AbstractPadFairy.prototype.MASK_LEFT=64;
cycloa.AbstractPadFairy.prototype.MASK_RIGHT=128;
cycloa.AbstractPadFairy.prototype.MASK_ALL=255;
cycloa.AbstractPadFairy.prototype.state = 0; //button state

