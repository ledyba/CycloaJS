%# -*- encoding: utf-8 -*-

this.__video__nowX += __vm__clockDelta * <%= Video::ClockFactor %>;
while(this.__video__nowX >= 341){
	this.__video__nowX -= 341;
	/**
	 * @const
	 * @type {number}
	 */
	var __video__nowY = (++this.__video__nowY);
	if(__video__nowY <= 240){
		/**
		 * @const
		 * @type {Uint8Array}
		 */
		this.__video__spriteEval();
		if(this.__video__backgroundVisibility || this.__video__spriteVisibility) {
			// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			this.__video__vramAddrRegister = (this.__video__vramAddrRegister & 0x7BE0) | (this.__video__vramAddrReloadRegister & 0x041F);
			this.__video__buildBgLine();
			this.__video__buildSpriteLine();
			var __video__vramAddrRegister = this.__video__vramAddrRegister + (1 << 12);
			__video__vramAddrRegister += (__video__vramAddrRegister & 0x8000) >> 10;
			__video__vramAddrRegister &= 0x7fff;
			if((__video__vramAddrRegister & 0x03e0) === 0x3c0){
				__video__vramAddrRegister &= 0xFC1F;
				__video__vramAddrRegister ^= 0x800;
			}
			this.__video__vramAddrRegister = __video__vramAddrRegister;
		}
	}else if(__video__nowY === 241){
		//241: The PPU just idles during this scanline. Despite this, this scanline still occurs before the VBlank flag is set.
		this.__video__videoFairy.dispatchRendering(__video__screenBuffer8, this.__video__paletteMask);
		__vm__run = false;
		this.__video__nowOnVBnank = true;
		this.__video__spriteAddr = 0;//and typically contains 00h at the begin of the VBlank periods
	}else if(__video__nowY === 242){
		// NESDEV: These occur during VBlank. The VBlank flag of the PPU is pulled low during scanline 241, so the VBlank NMI occurs here.
		// EVERYNES: http://nocash.emubase.de/everynes.htm#ppudimensionstimings
		// とあるものの…BeNesの実装だともっと後に発生すると記述されてる。詳しくは以下。
		// なお、$2002のレジスタがHIGHになった後にVBLANKを起こさないと「ソロモンの鍵」にてゲームが始まらない。
		// (NMI割り込みがレジスタを読み込みフラグをリセットしてしまう上、NMI割り込みが非常に長く、クリアしなくてもすでにVBLANKが終わった後に返ってくる)
		//nowOnVBlankフラグの立ち上がり後、数クロックでNMIが発生。
		this.NMI = this.__video__executeNMIonVBlank; /* reserve NMI if emabled */
		this.onVBlank();
	}else if(__video__nowY <= 261){
		//nowVBlank.
	}else if(__video__nowY === 262){
		this.__video__nowOnVBnank = false;
		this.__video__sprite0Hit = false;
		this.__video__nowY = 0;
		if(!this.__video__isEven){
			this.__video__nowX++;
		}
		this.__video__isEven = !this.__video__isEven;
		// the reload value is automatically loaded into the Pointer at the end of the vblank period (vertical reload bits)
		// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
		if(this.__video__backgroundVisibility || this.__video__spriteVisibility){
			this.__video__vramAddrRegister = (this.__video__vramAddrRegister & 0x041F) | (this.__video__vramAddrReloadRegister & 0x7BE0);
		}
	}else{
		throw new cycloa.err.CoreException("Invalid scanline: "+this.__video__nowY);
	}
}

