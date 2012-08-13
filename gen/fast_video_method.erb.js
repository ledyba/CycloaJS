%# -*- encoding: utf-8 -*-

this.onHardResetVideo = function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	for(var i=0;i< <%= Video::VramSize %>;++i) {
		this.internalVram[i] = 0;
	}
	for(var i=0;i< <%= Video::SpRamSize %>;++i) {
		this.spRam[i] = 0;
	}
	for(var i=0;i< <%= Video::PaletteSize %>;++i) {
		this.palette[i] = 0;
	}
	this.nowY=0;
	this.nowX=0;
	//0x2000
	this.executeNMIonVBlank = false;
	this.spriteHeight = 8;
	this.patternTableAddressBackground = 0x0000;
	this.patternTableAddress8x8Sprites = 0x0000;
	this.vramIncrementSize = 1;
	//0x2005 & 0x2000
	this.vramAddrReloadRegister = 0x0000;
	this.horizontalScrollBits = 0;
	//0x2001
	this.colorEmphasis = 0;
	this.spriteVisibility = false;
	this.backgroundVisibility = false;
	this.spriteClipping = true;
	this.backgroundClipping = true;
	this.paletteMask = 0x3f;
	//0x2003
	this.spriteAddr = 0;
	//0x2005/0x2006
	this.vramAddrRegisterWritten = false;
	this.scrollRegisterWritten = false;
	//0x2006
	this.vramAddrRegister = 0;
};
this.onResetVideo = function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	//0x2000
	this.executeNMIonVBlank = false;
	this.spriteHeight = 8;
	this.patternTableAddressBackground = 0x0000;
	this.patternTableAddress8x8Sprites = 0x0000;
	this.vramIncrementSize = 1;
	//0x2005 & 0x2000
	this.vramAddrReloadRegister = 0x0000;
	this.horizontalScrollBits = 0;
	//0x2001
	this.colorEmphasis = 0;
	this.spriteVisibility = false;
	this.backgroundVisibility = false;
	this.spriteClipping = true;
	this.backgroundClipping = true;
	this.paletteMask = 0x3f;
	//0x2005/0x2006
	this.vramAddrRegisterWritten = false;
	this.scrollRegisterWritten = false;
	//0x2007
	this.vramBuffer = 0;
};

this.spriteEval = function() {
	/**
	 * @type {Uint8Array}
	 * @const
	 */
	var spRam = this.spRam;
	/**
	 * @type {number}
	 * @const
	 */
	var y = this.nowY-1;
	/** @type {number} */
	var _spriteHitCnt = 0;
	this.lostSprites = false;
	/**
	 * @type {number}
	 * @const
	 */
	var _sprightHeight = this.spriteHeight;
	/**
	 * @type {boolean}
	 * @const
	 */	
	var bigSprite = _sprightHeight === 16;
	/**
	 * @type {object[]}
	 * @const
	 */
	var spriteTable = this.spriteTable;
	/**
	 * @type {number}
	 * @const
	 */
	var spriteTileAddrBase = this.patternTableAddress8x8Sprites;
	for(var i=0;i<256;i+=4){
		/** @type {number} */
		var spY = spRam[i]+1;
		/** @type {number} */
		var spYend = spY+_sprightHeight;
		/** @type {boolean} */
		var hit = false;
		if(spY <= y && y < spYend){//Hit!
			if(_spriteHitCnt < <%= Video::DefaultSpriteCnt %>){
				hit = true;
				/** type {object} */
				var slot = spriteTable[_spriteHitCnt];
				slot.idx = i>>2;
				slot.y = spY;
				slot.x = spRam[i+3];
				if(bigSprite){
					//8x16
					/**
					 * @type {number}
					 * @const
					 */
					var val = spRam[i+1];
					slot.tileAddr = (val & 1) << 12 | (val & 0xfe) << 4;
				}else{
					//8x8
					slot.tileAddr = (spRam[i+1] << 4) | spriteTileAddrBase;
				}
				/**
				 * @type {number}
				 * @const
				 */
				var attr = spRam[i+2];
				slot.paletteNo = 4 | (attr & 3);
				slot.isForeground = (attr & (1<<5)) === 0;
				slot.flipHorizontal = (attr & (1<<6)) !== 0;
				slot.flipVertical = (attr & (1<<7)) !== 0;
				_spriteHitCnt++;
			}else{
				//本当はもっと複雑な仕様みたいなものの、省略。
				//http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation
				this.lostSprites = true;
				break;
			}
		}
	}
	//残りは無効化
	this.spriteHitCnt = _spriteHitCnt;
	for(var i=_spriteHitCnt;i< <%= Video::DefaultSpriteCnt %>;i++){
		spriteTable[i].y=255;
	}
};

this.buildBgLine = function(){
	if(!this.backgroundVisibility){
		return;
	}
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.nowY-1) << <%= Video::ScreenWidthShift %>;
	/**
	 * @type {number} uint16_t
	 */
	var nameTableAddr = 0x2000 | (this.vramAddrRegister & 0xfff);
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var offY = (this.vramAddrRegister >> 12);
	/**
	 * @type {number} uint8_t
	 */
	var offX = this.horizontalScrollBits;

	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var bgTileAddrBase = this.patternTableAddressBackground;

	for(var /* uint16_t */ renderX=0;;){
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileNo = this.readVram(nameTableAddr);
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileYofScreen = (nameTableAddr & 0x03e0) >> 5;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var palNo =
				(
					this.readVram((nameTableAddr & 0x2f00) | 0x3c0 | ((tileYofScreen & 0x1C) << 1) | ((nameTableAddr >> 2) & 7))
								>> (((tileYofScreen & 2) << 1) | (nameTableAddr & 2))
				) & 0x3;
		//タイルのサーフェイスデータを取得
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var off = bgTileAddrBase | (tileNo << 4) | offY;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var firstPlane = this.readVram(off);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = this.readVram(off+8);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var paletteOffset = palNo << 2; /* *4 */
		//書く！
		for(var x=offX;x<8;x++){
			/**
			 * @type {number} uint8_t
			 * @const
			 */
			var color = ((firstPlane >> (7-x)) & 1) | (((secondPlane >> (7-x)) & 1)<<1);
			if(color != 0){
				this.screenBuffer8[buffOffset+renderX] = this.palette[paletteOffset+color] | <%= Video::BackgroundBit %>;
			}
			renderX++;
			if(renderX >= <%= Video::ScreenWidth %>){
				return;
			}
		}
		if((nameTableAddr & 0x001f) === 0x001f){
			nameTableAddr &= 0xFFE0;
			nameTableAddr ^= 0x400;
		}else{
			nameTableAddr++;
		}
		offX = 0;//次からは最初のピクセルから書ける。
	}
};

this.buildSpriteLine = function(){
	if(!this.spriteVisibility){
		return;
	}
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var y = this.nowY-1;
	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var _spriteHeight = this.spriteHeight;
	/**
	 * @type {boolean} bool
	 * @const
	 */
	var searchSprite0Hit = !this.sprite0Hit;
	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var _spriteHitCnt = this.spriteHitCnt;
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.nowY-1) << <%= Video::ScreenWidthShift %>;
	//readVram(this.spriteTable[0].tileAddr); //FIXME: 読み込まないと、MMC4が動かない。
	for(var i=0;i<_spriteHitCnt;i++){
		/**
		 * @type {object} struct SpriteSlot&
		 * @const
		 */
		var slot = this.spriteTable[i];
		searchSprite0Hit &= (slot.idx === 0);
		/**
		 * @type {number} uint16_t
		 */
		var offY = 0;

		if(slot.flipVertical){
			offY = _spriteHeight+slot.y-y-1;
		}else{
			offY = y-slot.y;
		}
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var off = slot.tileAddr | ((offY & 0x8) << 1) | (offY&7);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var firstPlane = this.readVram(off);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = this.readVram(off+8);
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var _tmp_endX = screenWidth-slot.x;
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var endX = screenWidth < 8 ? screenWidth : 8;//std::min(screenWidth-slot.x, 8);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var layerMask = slot.isForeground ? <%= Video::FrontSpriteBit %> : <%= Video::BackSpriteBit %>;
		if(slot.flipHorizontal){
			for(var x=0;x<endX;x++){
				/**
				 * @type {number} uint8_t
				 * @const
				 */
				var color = ((firstPlane >> x) & 1) | (((secondPlane >> x) & 1)<<1); //ここだけ違います
				/**
				 * @type {number} uint8_t
				 * @const
				 */
				var target = this.screenBuffer8[buffOffset + slot.x + x];
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isEmpty = (target & LayerBitMask) === <%= Video::EmptyBit %>;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isBackgroundDrawn = (target & LayerBitMask) === <%= Video::BackgroundBit %>;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isSpriteNotDrawn = (target & SpriteLayerBit) === 0;
				if(searchSprite0Hit && (color !== 0 && isBackgroundDrawn)){
					this.sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					this.screenBuffer8[buffOffset + slot.x + x] =
						this.palette[(slot.paletteNo<<2) + color] | layerMask;
					
				}
			}
		}else{
			/**
			 * @type {number} uint8_t
			 * @const
			 */
			var color = ((firstPlane >> (7-x)) & 1) | (((secondPlane >> (7-x)) & 1)<<1); //ここだけ違います
			/**
			 * @type {number} uint8_t
			 * @const
			 */
			var target = this.screenBuffer8[buffOffset + slot.x + x];
			/**
			 * @type {boolean} bool
			 * @const
			 */
			var isEmpty = (target & LayerBitMask) === <%= Video::EmptyBit %>;
			/**
			 * @type {boolean} bool
			 * @const
			 */
			var isBackgroundDrawn = (target & LayerBitMask) === <%= Video::BackgroundBit %>;
			/**
			 * @type {boolean} bool
			 * @const
			 */
			var isSpriteNotDrawn = (target & SpriteLayerBit) === 0;
			if(searchSprite0Hit && (color !== 0 && isBackgroundDrawn)){
				this.sprite0Hit = true;
				searchSprite0Hit = false;
			}
			if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
				this.screenBuffer8[buffOffset + slot.x + x] =
					this.palette[(slot.paletteNo<<2) + color] | layerMask;
				
			}
		}
	}
};
