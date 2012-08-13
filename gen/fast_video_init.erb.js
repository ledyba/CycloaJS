%# -*- encoding: utf-8 -*-

this.isEven = false;
this.nowY = 0;
this.nowX = 0;
this.spriteHitCnt = 0;
this.executeNMIonVBlank = false;
this.spriteHeight = 8;
this.patternTableAddressBackground = 0;
this.patternTableAddress8x8Sprites = 0;
this.vramIncrementSize = 1;
this.colorEmphasis = 0;
this.spriteVisibility = false;
this.backgroundVisibility = false;
this.spriteClipping = false;
this.backgroundClipping = false;
this.paletteMask = 0;
this.nowOnVBnank = false;
this.sprite0Hit = false;
this.lostSprites = false;
this.vramBuffer = 0;
this.spriteAddr = 0;
this.vramAddrRegister = 0x0;
this.vramAddrReloadRegister = 0;
this.horizontalScrollBits = 0;
this.scrollRegisterWritten = false;
this.vramAddrRegisterWritten = false;
this.screenBuffer = new ArrayBuffer(<%= Video::ScreenHeight %> * <%= Video::ScreenHeight %>);
this.screenBuffer8 = new Uint8Array(this.screenBuffer);
this.screenBuffer32 = new Uint32Array(this.screenBuffer);
this.internalVram = new Uint8Array(0x800);
this.spRam = new Uint8Array(256);
this.palette = new Uint8Array(32);
this.spriteTable = new Array(<%= Video::DefaultSpriteCnt %>);
for(var i=0; i< <%= Video::DefaultSpriteCnt %>; ++i){
	this.spriteTable[i] = new Object;
}