%# -*- encoding: utf-8 -*-

this.nowX += clockDelta * <%= Video::ClockFactor %>;
while(this.nowX >= 341){
	this.nowX -= 341;
	/**
	 * @const
	 * @type {number}
	 */
	var nowY = (++this.nowY);
	if(nowY <= 240){
		/**
		 * @const
		 * @type {Uint8Array}
		 */
		var screenBuffer8 = this.screenBuffer8;
		var screenBuffer32 = this.screenBuffer32
		var palette = this.palette;
		var _color = <%= Video::EmptyBit %> | <%= Video::Palette(8, 0) %>;
		var _color32 = _color << 24 | _color << 16 | _color << 8 | _color;
		for(var i=((nowY-1) << <%= Video::ScreenWidthShift-2 %>), max=i+<%= Video::ScreenWidth/4 %>; i<max; ++i) screenBuffer32[i] = _color32;
		this.spriteEval();
		if(this.backgroundVisibility || this.spriteVisibility){
			// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			this.vramAddrRegister = (this.vramAddrRegister & 0x7BE0) | (this.vramAddrReloadRegister & 0x041F);
			this.buildBgLine();
			this.buildSpriteLine();
			var vramAddrRegister = this.vramAddrRegister + (1 << 12);
			vramAddrRegister += (vramAddrRegister & 0x8000) >> 10;
			vramAddrRegister &= 0x7fff;
			if((vramAddrRegister & 0x03e0) === 0x3c0){
				vramAddrRegister &= 0xFC1F;
				vramAddrRegister ^= 0x800;
			}
			this.vramAddrRegister = vramAddrRegister;
		}
	}else if(nowY === 241){
		//241: The PPU just idles during this scanline. Despite this, this scanline still occurs before the VBlank flag is set.
		this.videoFairy.dispatchRendering(this.screenBuffer8, this.paletteMask);
		_run = false;
		this.nowOnVBnank = true;
		this.spriteAddr = 0;//and typically contains 00h at the begin of the VBlank periods
	}else if(nowY === 242){
		// NESDEV: These occur during VBlank. The VBlank flag of the PPU is pulled low during scanline 241, so the VBlank NMI occurs here.
		// EVERYNES: http://nocash.emubase.de/everynes.htm#ppudimensionstimings
		// とあるものの…BeNesの実装だともっと後に発生すると記述されてる。詳しくは以下。
		// なお、$2002のレジスタがHIGHになった後にVBLANKを起こさないと「ソロモンの鍵」にてゲームが始まらない。
		// (NMI割り込みがレジスタを読み込みフラグをリセットしてしまう上、NMI割り込みが非常に長く、クリアしなくてもすでにVBLANKが終わった後に返ってくる)
		//nowOnVBlankフラグの立ち上がり後、数クロックでNMIが発生。
		this.NMI = this.executeNMIonVBlank; /* reserve NMI if emabled */
		this.onVBlank();
	}else if(nowY <= 261){
		//nowVBlank.
	}else if(nowY === 262){
		this.nowOnVBnank = false;
		this.sprite0Hit = false;
		this.nowY = 0;
		if(!this.isEven){
			this.nowX++;
		}
		this.isEven = !this.isEven;
		// the reload value is automatically loaded into the Pointer at the end of the vblank period (vertical reload bits)
		// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
		if(this.backgroundVisibility || this.spriteVisibility){
			this.vramAddrRegister = (this.vramAddrRegister & 0x041F) | (this.vramAddrReloadRegister & 0x7BE0);
		}
	}else{
		throw new cycloa.err.CoreException("Invalid scanline: "+this.nowY);
	}
}

