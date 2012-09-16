
/**
 * スクリプトでプログラムが書ける謎マシン
 * @constructor
 */
cycloa.ScriptMachine = function(videoFairy, audioFairy, pad1Fairy, pad2Fairy) {
this.tracer = new cycloa.Tracer(this);

/** @type {number} */
this.A = 0;
/** @type {number} */
this.X = 0;
/** @type {number} */
this.Y = 0;
/** @type {number} */
this.PC = 0;
/** @type {number} */
this.SP = 0;
/** @type {number} */
this.P = 0;
/**
 * @const
 * @type {Uint8Array}
 */
this.__cpu__ram = new Uint8Array(new ArrayBuffer(0x800));
this.__cpu__rom = new Array(32);

this.__cpu__ZNFlagCache = cycloa.ScriptMachine.ZNFlagCache;
this.__cpu__TransTable = cycloa.ScriptMachine.TransTable;



this.__video__videoFairy = videoFairy;

this.__video__isEven = false;
this.__video__nowY = 0;
this.__video__nowX = 0;
this.__video__spriteHitCnt = 0;
this.__video__executeNMIonVBlank = false;
this.__video__spriteHeight = 8;
this.__video__patternTableAddressBackground = 0;
this.__video__patternTableAddress8x8Sprites = 0;
this.__video__vramIncrementSize = 1;
this.__video__colorEmphasis = 0;
this.__video__spriteVisibility = false;
this.__video__backgroundVisibility = false;
this.__video__spriteClipping = false;
this.__video__backgroundClipping = false;
this.__video__paletteMask = 0;
this.__video__nowOnVBnank = false;
this.__video__sprite0Hit = false;
this.__video__lostSprites = false;
this.__video__vramBuffer = 0;
this.__video__spriteAddr = 0;
this.__video__vramAddrRegister = 0x0;
this.__video__vramAddrReloadRegister = 0;
this.__video__horizontalScrollBits = 0;
this.__video__scrollRegisterWritten = false;
this.__video__vramAddrRegisterWritten = false;
this.__video__screenBuffer = new ArrayBuffer(256 * 240);
this.__video__screenBuffer8 = new Uint8Array(this.__video__screenBuffer);
this.__video__screenBuffer32 = new Uint32Array(this.__video__screenBuffer);
this.__video__spRam = new Uint8Array(256);
this.__video__palette = new Uint8Array(9*4);
this.__video__spriteTable = new Array(8);
for(var i=0; i< 8; ++i){
	this.__video__spriteTable[i] = {};
}

this.__video__pattern = new Array(0x10);

this.__video__vramMirroring = new Array(4);
this.__video__internalVram = new Array(4);
for(var i=0;i<4;++i){
	this.__video__internalVram[i] = new Uint8Array(0x400);
}


this.__audio__audioFairy = audioFairy;

this.__audio__LengthCounterConst = cycloa.ScriptMachine.LengthCounterConst;


// __rectangle1__ do nothing


// __rectangle1__ do nothing


this.__triangle__waveForm = [
		  0x0,0x1,0x2,0x3,0x4,0x5,0x6,0x7,0x8,0x9,0xA,0xB,0xC,0xD,0xE,0xF,
		  0xF,0xE,0xD,0xC,0xB,0xA,0x9,0x8,0x7,0x6,0x5,0x4,0x3,0x2,0x1,0x0
];



this.__noize__FrequencyTable = [
		4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068 //NTSC
		//4, 7, 14, 30, 60, 88, 118, 148, 188, 236, 354, 472, 708,  944, 1890, 3778 //PAL
];

this.__digital__FrequencyTable = [
		428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106,  84,  72,  54 //NTSC
		//398, 354, 316, 298, 276, 236, 210, 198, 176, 148, 132, 118,  98,  78,  66,  50
];
this.__pad__pad1Fairy = pad1Fairy || new cycloa.AbstractPadFairy();
this.__pad__pad2Fairy = pad2Fairy || new cycloa.AbstractPadFairy();

this.__pad__pad1Idx = 0;
this.__pad__pad2Idx = 0;


this.__vm__reservedClockDelta = 0;
/** @type {boolean} */
this.NMI = false;
/** @type {boolean} */
this.IRQ = false;

this.__video__reservedClock = 0;
};

/**
 * VMを１フレーム分実行する
 */
cycloa.ScriptMachine.prototype.run = function () {
	
/**
 * @type {number}
 */
var __cpu__ZNFlagCache = this.__cpu__ZNFlagCache; var __cpu__TransTable = this.__cpu__TransTable;var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;

	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;
	var __audio__audioFairy = this.__audio__audioFairy; var __audio__enabled = __audio__audioFairy.enabled; var __audio__data=__audio__audioFairy.data; var __audio__data__length = __audio__audioFairy.dataLength;
	var __vm__run = true;
	var __vm__clockDelta;
	var __vm__reservedClockDelta = this.__vm__reservedClockDelta;
	this.__vm__reservedClockDelta = 0;
	var __video__nowY = 0;
	var __video__reservedClock = this.__video__reservedClock;
	while(__vm__run) {
		__vm__clockDelta = __vm__reservedClockDelta; __vm__reservedClockDelta = 0;
		++__video__nowY;
		__video__reservedClock += 341;
		__vm__clockDelta += (__video__reservedClock / 3) | 0;
		__video__reservedClock %= 3;
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

	this.__audio__frameCnt += (__vm__clockDelta * 240);
while(this.__audio__frameCnt >= 1786840){
	this.__audio__frameCnt -= 1786840;
	if(this.__audio__isNTSCmode){
		this.__audio__frameIRQCnt ++;
		switch(this.__audio__frameIRQCnt){
		case 1:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 2:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			break;
		case 3:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 4:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			if(this.__audio__frameIRQenabled){
				this.IRQ |= 1;			}
			this.__audio__frameIRQCnt = 0;
			break;
		default:
			throw new cycloa.err.CoreException("FIXME Audio::run interrupt NTSC");
		}
	}else{
		this.__audio__frameIRQCnt ++;
		switch(this.__audio__frameIRQCnt){
		case 1:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 2:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			break;
		case 3:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 4:
			break;
		case 5:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			this.__audio__frameIRQCnt = 0;
			break;
		default:
			throw new cycloa.err.CoreException("FIXME Audio::run interrupt PAL");
		}
	}
}
this.__audio__clockCnt += (__vm__clockDelta * 22050);
while(this.__audio__clockCnt >= 1786840){
	/*unsigned int*/var __audio__processClock = 1786840 + this.__audio__leftClock;
	/*unsigned int*/var __audio__delta = (__audio__processClock / 22050) | 0;
	this.__audio__leftClock = __audio__processClock % 22050;
	this.__audio__clockCnt-= 1786840;
	/*int16_t*/ var __audio__sound = 0;

if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var __rectangle1__nowCounter = this.__rectangle1__freqCounter + __audio__delta;
	this.__rectangle1__freqCounter = __rectangle1__nowCounter % (this.__rectangle1__frequency + 1);
	this.__rectangle1__dutyCounter = (this.__rectangle1__dutyCounter + (__rectangle1__nowCounter  / (this.__rectangle1__frequency + 1))) & 15;
	if(this.__rectangle1__dutyCounter < this.__rectangle1__dutyRatio){
		__audio__sound += this.__rectangle1__decayEnabled ? this.__rectangle1__decayVolume : this.__rectangle1__volumeOrDecayRate;
	}else{
		__audio__sound += this.__rectangle1__decayEnabled ? -this.__rectangle1__decayVolume : -this.__rectangle1__volumeOrDecayRate;
	}
}


if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var __rectangle0__nowCounter = this.__rectangle0__freqCounter + __audio__delta;
	this.__rectangle0__freqCounter = __rectangle0__nowCounter % (this.__rectangle0__frequency + 1);
	this.__rectangle0__dutyCounter = (this.__rectangle0__dutyCounter + (__rectangle0__nowCounter  / (this.__rectangle0__frequency + 1))) & 15;
	if(this.__rectangle0__dutyCounter < this.__rectangle0__dutyRatio){
		__audio__sound += this.__rectangle0__decayEnabled ? this.__rectangle0__decayVolume : this.__rectangle0__volumeOrDecayRate;
	}else{
		__audio__sound += this.__rectangle0__decayEnabled ? -this.__rectangle0__decayVolume : -this.__rectangle0__volumeOrDecayRate;
	}
}

if(this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0){
	//freqが1や0だと、ここでもモデルが破綻する。FF1のOPで発生。
	/* unsigned int */ var __triangle__nowCounter = this.__triangle__freqCounter + __audio__delta;
	var __triangle__freq = this.__triangle__frequency + 1;
	this.__triangle__freqCounter = __triangle__nowCounter % __triangle__freq;
	__audio__sound += this.__triangle__waveForm[this.__triangle__streamCounter = (this.__triangle__streamCounter + (__triangle__nowCounter  / __triangle__freq)) & 31];
}

if(this.__noize__lengthCounter != 0){
	/* unsigned int */var __noize__nowCounter = this.__noize__freqCounter + __audio__delta;
	/* const uint16_t */var __noize__divFreq = this.__noize__frequency + 1;
	/* const uint8_t */var __noize__shiftAmount = this.__noize__modeFlag ? 6 : 1;
	//FIXME: frequencyが小さい時に此のモデルが破綻する
	var __noize__shiftReg = this.__noize__shiftRegister;
	while(__noize__nowCounter >= __noize__divFreq){
		__noize__nowCounter -= __noize__divFreq;
		__noize__shiftReg =(__noize__shiftReg >> 1) | (((__noize__shiftReg ^ (__noize__shiftReg >> __noize__shiftAmount))  & 1) << 14);
	}

	if(((__noize__shiftReg & 1) == 1)){
		__audio__sound += this.__noize__decayEnabled ? -this.__noize__decayVolume : -this.__noize__volumeOrDecayRate;
	}else{
		__audio__sound += this.__noize__decayEnabled ? this.__noize__decayVolume : this.__noize__volumeOrDecayRate;
	}

	this.__noize__freqCounter = __noize__nowCounter;
	this.__noize__shiftRegister = __noize__shiftReg;
}

if(this.__digital__sampleLength != 0){
	/*unsigned int*/ var __digital__nowCounter = this.__digital__freqCounter + __audio__delta;
	/*const uint16_t*/var __digital__divFreq = this.__digital__frequency + 1;
	while(__digital__nowCounter >= __digital__divFreq){
		__digital__nowCounter -= divFreq;
			if(this.__digital__sampleBufferLeft == 0){
				this.__digital__sampleLength--;
				var __val__;
				var __digital__addr = this.__digital__sampleAddr;
				
switch((__digital__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__digitl__val__ = __cpu__ram[__digital__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__digitl__val__ = this.__video__readReg(__digital__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__digital__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__digitl__val__ =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__digital__addr === 0x4016){
			__digitl__val__ = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__digital__addr === 0x4017){
			__digitl__val__ = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__digital__addr.toString(16));
		}else{
			__digitl__val__ = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__digitl__val__ = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
}
				this.__digital__sampleBuffer = __digitl__val__;

				if(this.__digital__sampleAddr >= 0xffff){
					this.__digital__sampleAddr = 0x8000;
				}else{
					this.__digital__sampleAddr++;
				}
				this.__digital__sampleBufferLeft = 7;
				__vm__reservedClockDelta += (4);				if(this.__digital__sampleLength == 0){
					if(this.__digital__loopEnabled){
						this.__digital__sampleLength = this.__digital__sampleLengthBuffer;
					}else if(this.__digital__irqEnabled){
						this.IRQ |= 2;					}else{
						break;
					}
				}
			}
			this.__digital__sampleBuffer = this.__digital__sampleBuffer >> 1;
			if((this.__digital__sampleBuffer & 1) == 1){
				if(this.__digital__deltaCounter < 126){
					this.__digital__deltaCounter+=2;
				}
			}else{
				if(this.__digital__deltaCounter > 1){
					this.__digital__deltaCounter-=2;
				}
			}
			this.__digital__sampleBufferLeft--;
	}
	this.__digital__freqCounter = __digitl__nowCounter;
	__audio__sound += this.__digital__deltaCounter;
}

	if(__audio__enabled){
		__audio__data[__audio__audioFairy.dataIndex++] = __audio__sound / 100;
		if(__audio__audioFairy.dataIndex >= __audio__data__length){
			__audio__audioFairy.onDataFilled();
			__audio__data = __audio__audioFairy.data;
		}
	}
}


	this.__vm__reservedClockDelta += __vm__reservedClockDelta;
	this.__video__reservedClock = __video__reservedClock;
	return __vm__run;
};

/**
 * 関数実行時に
 * @function
 */
cycloa.ScriptMachine.prototype.onHardReset = function () {
	this.NMI = false;
	this.IRQ = 0;
	this.onHardResetCPU();
	this.__video__onHardReset();
	this.__audio__onHardReset();
	this.__rectangle0__onHardReset();
	this.__rectangle1__onHardReset();
	this.__triangle__onHardReset();
	this.__noize__onHardReset();
	this.__digital__onHardReset();
};
cycloa.ScriptMachine.prototype.onReset = function () {
	this.NMI = false;
	this.IRQ = 0;
	this.onResetCPU();
	this.__video__onReset();
	this.__audio__onReset();
	this.__rectangle0__onReset();
	this.__rectangle1__onReset();
	this.__triangle__onReset();
	this.__noize__onReset();
	this.__digital__onReset();
};
cycloa.ScriptMachine.prototype.onVBlank = function(){
};
cycloa.ScriptMachine.prototype.onIRQ = function(){
};
cycloa.ScriptMachine.prototype.read = function(addr) { 
	var __val__;
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__val__ = __cpu__ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__val__ = this.__video__readReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__val__ =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr === 0x4016){
			__val__ = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			__val__ = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			__val__ = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__val__ = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
;
	return __val__;
};

cycloa.ScriptMachine.prototype.write = function(addr, val) {
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[addr & 0x1fff] = val;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(addr, val);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;			this.__rectangle0__decayEnabled = (val & 16) == 0;			this.__rectangle0__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = val & 7;			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;			this.__rectangle1__decayEnabled = (val & 16) == 0;			this.__rectangle1__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = val & 7;			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((val & 128) == 128);			this.__triangle__linearCounterBuffer = val & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;			this.__noize__decayEnabled = (val & 16) == 0;			this.__noize__loopEnabled = (val & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (val & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (val & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (val & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = val & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (val << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = val << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(val & 8)) this.__noize__lengthCounter = 0;			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((val & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(val & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((val & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, val); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, val);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, val);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, val);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, val);		break;	}};
};


cycloa.ScriptMachine.prototype.onHardResetCPU = function(){
		//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
		this.P = 0x24;
		this.A = 0x0;
		this.X = 0x0;
		this.Y = 0x0;
		this.SP = 0xfd;
		switch((0x4017 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[0x4017 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(0x4017, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4017 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = 0x00 << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4017, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4017, 0x00);		break;	}}		switch((0x4015 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[0x4015 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(0x4015, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4015 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = 0x00 << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4015, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4015, 0x00);		break;	}}		//this.PC = (this.read(0xFFFC) | (this.read(0xFFFD) << 8));
		this.PC = (this.__cpu__rom[31][0x3FC]| (this.__cpu__rom[31][0x3FD] << 8));

};

cycloa.ScriptMachine.prototype.onResetCPU = function () {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.__vm__reservedClockDelta += 6;
	this.SP -= 0x03;
	this.P |= 4;
	switch((0x4015 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[0x4015 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(0x4015, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4015 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = 0x00 << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4015, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4015, 0x00);		break;	}}	//this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));
	this.PC = (this.__cpu__rom[31][0x3FC]| (this.__cpu__rom[31][0x3FD] << 8));
};

cycloa.ScriptMachine.ZNFlagCache = new Uint8Array([
	0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80
]);

cycloa.ScriptMachine.TransTable = new Uint32Array([459499, 393688, 255, 255, 255, 197073, 327905, 255, 197195, 131536, 131323, 255, 255, 262612, 393444, 255, 131994, 328153, 255, 255, 255, 262610, 393442, 255, 131707, 262614, 255, 255, 255, 262613, 393445, 255, 394036, 393432, 255, 255, 196865, 196817, 328161, 255, 262763, 131280, 131579, 255, 262404, 262356, 393700, 255, 131962, 327897, 255, 255, 255, 262354, 393698, 255, 131771, 262358, 255, 255, 255, 262357, 393701, 255, 394011, 393592, 255, 255, 255, 196977, 328113, 255, 197179, 131440, 131531, 255, 197412, 262516, 393652, 255, 132010, 328057, 255, 255, 255, 262514, 393650, 255, 131739, 262518, 255, 255, 255, 262517, 393653, 255, 393995, 393416, 255, 255, 255, 196801, 328193, 255, 262747, 131264, 131611, 255, 328487, 262340, 393732, 255, 132026, 327881, 255, 255, 255, 262338, 393730, 255, 131803, 262342, 255, 255, 255, 262341, 393733, 255, 255, 393272, 255, 255, 196689, 196657, 196673, 255, 131435, 255, 131227, 255, 262228, 262196, 262212, 255, 131914, 327737, 255, 255, 262226, 262194, 262211, 255, 131259, 262198, 131243, 255, 255, 262197, 255, 255, 131104, 393224, 131088, 255, 196641, 196609, 196625, 255, 131195, 131072, 131179, 255, 262180, 262148, 262164, 255, 131930, 327689, 255, 255, 262178, 262146, 262163, 255, 131755, 262150, 131211, 255, 262181, 262149, 262166, 255, 131376, 393496, 255, 255, 196913, 196881, 328001, 255, 131499, 131344, 131419, 255, 262452, 262420, 393540, 255, 131978, 327961, 255, 255, 255, 262418, 393538, 255, 131723, 262422, 255, 255, 255, 262421, 393541, 255, 131360, 393768, 255, 255, 196897, 197153, 328065, 255, 131483, 131616, 131835, 255, 262436, 262692, 393604, 255, 131946, 328233, 255, 255, 255, 262690, 393602, 255, 131787, 262694, 255, 255, 255, 262693, 393605, 255]);



cycloa.ScriptMachine.prototype.__video__onHardReset= function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	for(var i=0;i< 4;++i) {
		var iv = this.__video__internalVram[i];
		for(var j=0;j<0x400; ++j){
			iv[j] = 0;
		}
	}
	for(var i=0;i< 256;++i) {
		this.__video__spRam[i] = 0;
	}
	for(var i=0;i< 36;++i) {
		this.__video__palette[i] = 0;
	}
	this.__video__nowY=0;
	this.__video__nowX=0;
	//0x2000
	this.__video__executeNMIonVBlank = false;
	this.__video__spriteHeight = 8;
	this.__video__patternTableAddressBackground = 0x0000;
	this.__video__patternTableAddress8x8Sprites = 0x0000;
	this.__video__vramIncrementSize = 1;
	//0x2005 & 0x2000
	this.__video__vramAddrReloadRegister = 0x0000;
	this.__video__horizontalScrollBits = 0;
	//0x2001
	this.__video__colorEmphasis = 0;
	this.__video__spriteVisibility = false;
	this.__video__backgroundVisibility = false;
	this.__video__spriteClipping = true;
	this.__video__backgroundClipping = true;
	this.__video__paletteMask = 0x3f;
	//0x2003
	this.__video__spriteAddr = 0;
	//0x2005/0x2006
	this.__video__vramAddrRegisterWritten = false;
	this.__video__scrollRegisterWritten = false;
	//0x2006
	this.__video__vramAddrRegister = 0;
};
cycloa.ScriptMachine.prototype.__video__onReset = function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	//0x2000
	this.__video__executeNMIonVBlank = false;
	this.__video__spriteHeight = 8;
	this.__video__patternTableAddressBackground = 0x0000;
	this.__video__patternTableAddress8x8Sprites = 0x0000;
	this.__video__vramIncrementSize = 1;
	//0x2005 & 0x2000
	this.__video__vramAddrReloadRegister = 0x0000;
	this.__video__horizontalScrollBits = 0;
	//0x2001
	this.__video__colorEmphasis = 0;
	this.__video__spriteVisibility = false;
	this.__video__backgroundVisibility = false;
	this.__video__spriteClipping = true;
	this.__video__backgroundClipping = true;
	this.__video__paletteMask = 0x3f;
	//0x2005/0x2006
	this.__video__vramAddrRegisterWritten = false;
	this.__video__scrollRegisterWritten = false;
	//0x2007
	this.__video__vramBuffer = 0;
};

cycloa.ScriptMachine.prototype.__video__spriteEval = function() {
	/**
	 * @type {Uint8Array}
	 * @const
	 */
	var spRam = this.__video__spRam;
	/**
	 * @type {number}
	 * @const
	 */
	var y = this.__video__nowY-1;
	/** @type {number} */
	var _spriteHitCnt = 0;
	this.__video__lostSprites = false;
	/**
	 * @type {number}
	 * @const
	 */
	var _sprightHeight = this.__video__spriteHeight;
	/**
	 * @type {boolean}
	 * @const
	 */	
	var bigSprite = _sprightHeight === 16;
	/**
	 * @type {object[]}
	 * @const
	 */
	var spriteTable = this.__video__spriteTable;
	/**
	 * @type {number}
	 * @const
	 */
	var spriteTileAddrBase = this.__video__patternTableAddress8x8Sprites;
	for(var i=0;i<256;i+=4){
		/** @type {number} */
		var spY = spRam[i]+1;
		/** @type {number} */
		var spYend = spY+_sprightHeight;
		/** @type {boolean} */
		var hit = false;
		if(spY <= y && y < spYend){//Hit!
			if(_spriteHitCnt < 8){
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
				this.__video__lostSprites = true;
				break;
			}
		}
	}
	//残りは無効化
	this.__video__spriteHitCnt = _spriteHitCnt;
	for(var i=_spriteHitCnt;i< 8;i++){
		spriteTable[i].y=255;
	}
};

cycloa.ScriptMachine.prototype.__video__buildBgLine = function(){
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;	var _color = 0 | __video__palette[32];
	if(!this.__video__backgroundVisibility) {
		var _color32 = _color << 24 | _color << 16 | _color << 8 | _color;
		for(var i=((nowY-1) << 6), max=i+64; i<max; ++i) screenBuffer32[i] = _color32;
		return;
	}
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.__video__nowY-1) << 8;
	/**
	 * @type {number} uint16_t
	 */
	var nameTableAddr = 0x2000 | (this.__video__vramAddrRegister & 0xfff);
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var offY = (this.__video__vramAddrRegister >> 12);
	/**
	 * @type {number} uint8_t
	 */
	var offX = this.__video__horizontalScrollBits;

	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var bgTileAddrBase = this.__video__patternTableAddressBackground;
	
	var renderX=0;

	while(true){
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileNo = (((nameTableAddr & 0x3f00) !== 0x3f00) ? (nameTableAddr < 0x2000 ? __video__pattern[(nameTableAddr >> 9) & 0xf][nameTableAddr & 0x1ff] : __video__vramMirroring[(nameTableAddr >> 10) & 0x3][nameTableAddr & 0x3ff]) : ((nameTableAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[nameTableAddr & 31]) );
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileYofScreen = (nameTableAddr & 0x03e0) >> 5;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var palAddr = ((nameTableAddr & 0x2f00) | 0x3c0 | ((tileYofScreen & 0x1C) << 1) | ((nameTableAddr >> 2) & 7));
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var palNo =
				(
					(((palAddr & 0x3f00) !== 0x3f00) ? (palAddr < 0x2000 ? __video__pattern[(palAddr >> 9) & 0xf][palAddr & 0x1ff] : __video__vramMirroring[(palAddr >> 10) & 0x3][palAddr & 0x3ff]) : ((palAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[palAddr & 31]) )								>> (((tileYofScreen & 2) << 1) | (nameTableAddr & 2))
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
		var firstPlane = (((off & 0x3f00) !== 0x3f00) ? (off < 0x2000 ? __video__pattern[(off >> 9) & 0xf][off & 0x1ff] : __video__vramMirroring[(off >> 10) & 0x3][off & 0x3ff]) : ((off & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[off & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlaneAddr = off+8;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = (((secondPlaneAddr & 0x3f00) !== 0x3f00) ? (secondPlaneAddr < 0x2000 ? __video__pattern[(secondPlaneAddr >> 9) & 0xf][secondPlaneAddr & 0x1ff] : __video__vramMirroring[(secondPlaneAddr >> 10) & 0x3][secondPlaneAddr & 0x3ff]) : ((secondPlaneAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[secondPlaneAddr & 31]) );
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
			if(color !== 0){
				__video__screenBuffer8[buffOffset+renderX] = __video__palette[paletteOffset+color] | 128;
			}else{
				__video__screenBuffer8[buffOffset+renderX] = _color;
			}
			renderX++;
			if(renderX >= 256){
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

cycloa.ScriptMachine.prototype.__video__buildSpriteLine = function(){
	if(!this.__video__spriteVisibility){
		return;
	}
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var y = this.__video__nowY-1;
	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var _spriteHeight = this.__video__spriteHeight;
	/**
	 * @type {boolean} bool
	 */
	var searchSprite0Hit = !this.__video__sprite0Hit;
	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var _spriteHitCnt = this.__video__spriteHitCnt;
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.__video__nowY-1) << 8;
	//readVram(this.__video__spriteTable[0].tileAddr); //FIXME: 読み込まないと、MMC4が動かない。
	for(var i=0;i<_spriteHitCnt;i++){
		/**
		 * @type {object} struct SpriteSlot&
		 * @const
		 */
		var slot = this.__video__spriteTable[i];
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
		var firstPlane = (((off & 0x3f00) !== 0x3f00) ? (off < 0x2000 ? __video__pattern[(off >> 9) & 0xf][off & 0x1ff] : __video__vramMirroring[(off >> 10) & 0x3][off & 0x3ff]) : ((off & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[off & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlaneAddr = off+8;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = (((secondPlaneAddr & 0x3f00) !== 0x3f00) ? (secondPlaneAddr < 0x2000 ? __video__pattern[(secondPlaneAddr >> 9) & 0xf][secondPlaneAddr & 0x1ff] : __video__vramMirroring[(secondPlaneAddr >> 10) & 0x3][secondPlaneAddr & 0x3ff]) : ((secondPlaneAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[secondPlaneAddr & 31]) );
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var _tmp_endX = 256-slot.x;
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var endX = _tmp_endX < 8 ? _tmp_endX : 8;//std::min(screenWidth-slot.x, 8);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var layerMask = slot.isForeground ? 192 : 64;
		if(slot.flipHorizontal){
			for(var x=0;x<endX;x++){
				/**
				 * @type {number} uint8_t
				 */
				var color = ((firstPlane >> x) & 1) | (((secondPlane >> x) & 1)<<1); //ここだけ違います
				/**
				 * @type {number} uint8_t
				 */
				var target = __video__screenBuffer8[buffOffset + slot.x + x];
				/**
				 * @type {boolean} bool
				 */
				var isEmpty = (target & 192) === 0;
				/**
				 * @type {boolean} bool
				 */
				var isBackgroundDrawn = (target & 192) === 128;
				/**
				 * @type {boolean} bool
				 */
				var isSpriteNotDrawn = (target & 64) === 0;
				if(searchSprite0Hit && (color !== 0 && isBackgroundDrawn)){
					this.__video__sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					__video__screenBuffer8[buffOffset + slot.x + x] = __video__palette[(slot.paletteNo<<2) + color] | layerMask;
				}
			}
		}else{
			for(var x=0;x<endX;x++){
				/**
				 * @type {number} uint8_t
				 * @const
				 */
				var color = ((firstPlane >> (7-x)) & 1) | (((secondPlane >> (7-x)) & 1)<<1); //ここだけ違います
				/**
				 * @type {number} uint8_t
				 * @const
				 */
				var target = __video__screenBuffer8[buffOffset + slot.x + x];
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isEmpty = (target & 192) === 0;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isBackgroundDrawn = (target & 192) === 128;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isSpriteNotDrawn = (target & 64) === 0;
				if(searchSprite0Hit && (color !== 0 && isBackgroundDrawn)){
					this.__video__sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					__video__screenBuffer8[buffOffset + slot.x + x] = __video__palette[(slot.paletteNo<<2) + color] | layerMask;
				}
			}
		}
	}
};

cycloa.ScriptMachine.prototype.__video__writeReg = function(/* uint16_t */ addr, /* uint8_t */ value) {
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;
	switch(addr & 0x07) {
		/* PPU Control and Status Registers */
		case 0x00: { //2000h - PPU Control Register 1 (W)
			this.__video__executeNMIonVBlank = ((value & 0x80) === 0x80) ? true : false;
			this.__video__spriteHeight = ((value & 0x20) === 0x20) ? 16 : 8;
			this.__video__patternTableAddressBackground = (value & 0x10) << 8;
			this.__video__patternTableAddress8x8Sprites = (value & 0x8) << 9;
			this.__video__vramIncrementSize = ((value & 0x4) === 0x4) ? 32 : 1;
			this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0x73ff) | ((value & 0x3) << 10);
			break;
		}
		case 0x01: { //2001h - PPU Control Register 2 (W)
			this.__video__colorEmphasis = value >> 5; //FIXME: この扱い、どーする？
			this.__video__spriteVisibility = ((value & 0x10) === 0x10) ? true : false;
			this.__video__backgroundVisibility = ((value & 0x08) == 0x08) ? true : false;
			this.__video__spriteClipping = ((value & 0x04) === 0x04) ? false : true;
			this.__video__backgroundClipping = ((value & 0x2) === 0x02) ? false : true;
			this.__video__paletteMask = ((value & 0x1) === 0x01) ? 0x30 : 0x3f;
			break;
		}
		//case 0x02: //2002h - PPU Status Register (R)
		/* PPU SPR-RAM Access Registers */
		case 0x03: { //2003h - SPR-RAM Address Register (W)
			this.__video__spriteAddr = value;
			break;
		}
		case 0x04: { //2004h - SPR-RAM Data Register (Read/Write)
			spRam[this.__video__spriteAddr] = value;
			this.__video__spriteAddr = (this.__video__spriteAddr+1) & 0xff;
			break;
		}
		/* PPU VRAM Access Registers */
		case 0x05: { //PPU Background Scrolling Offset (W2)
			if(this.__video__scrollRegisterWritten){ //Y
				this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0x8C1F) | ((value & 0xf8) << 2) | ((value & 7) << 12);
			}else{ //X
				this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0xFFE0) | value >> 3;
				this.__video__horizontalScrollBits = value & 7;
			}
			this.__video__scrollRegisterWritten = !this.__video__scrollRegisterWritten;
			break;
		}
		case 0x06: { //VRAM Address Register (W2)
			if(this.__video__vramAddrRegisterWritten){
				this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0x7f00) | value;
				this.__video__vramAddrRegister = this.__video__vramAddrReloadRegister & 0x3fff;
			} else {
				this.__video__vramAddrReloadRegister =(this.__video__vramAddrReloadRegister & 0x00ff) | ((value & 0x7f) << 8);
			}
			this.__video__vramAddrRegisterWritten = !this.__video__vramAddrRegisterWritten;
			break;
		}
		case 0x07: { //VRAM Read/Write Data Register (RW)
			this.__video__writeVram(this.__video__vramAddrRegister, value);
			this.__video__vramAddrRegister = (this.__video__vramAddrRegister + this.__video__vramIncrementSize) & 0x3fff;
			break;
		}
		default: {
			throw new cycloa.err.CoreException("Invalid addr: 0x"+addr.toString(16));
		}
	}
};

cycloa.ScriptMachine.prototype.__video__readReg = function(/* uint16_t */ addr)
{
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;	switch(addr & 0x07)
	{
		/* PPU Control and Status Registers */
		//case 0x00: //2000h - PPU Control Register 1 (W)
		//case 0x01: //2001h - PPU Control Register 2 (W)
		case 0x02: { //2002h - PPU Status Register (R)
			//from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			this.__video__vramAddrRegisterWritten = false;
			this.__video__scrollRegisterWritten = false;
			//Reading resets the 1st/2nd-write flipflop (used by Port 2005h and 2006h).
			/**
			 * @const
			 * @type {number} uint8_t
			 */
			var result =
					((this.__video__nowOnVBnank) ? 128 : 0)
				|   ((this.__video__sprite0Hit) ? 64 : 0)
				|   ((this.__video__lostSprites) ? 32 : 0);
			this.__video__nowOnVBnank = false;
			return result;
		}
		/* PPU SPR-RAM Access Registers */
		//case 0x03: //2003h - SPR-RAM Address Register (W)
		case 0x04: { //2004h - SPR-RAM Data Register (Read/Write)
			return this.__video__spRam[this.__video__spriteAddr];
		}
		/* PPU VRAM Access Registers */
		//case 0x05: //PPU Background Scrolling Offset (W2)
		//case 0x06: //VRAM Address Register (W2)
		case 0x07: { //VRAM Read/Write Data Register (RW)
			var vramAddrRegister = this.__video__vramAddrRegister;
			if((vramAddrRegister & 0x3f00) !== 0x3f00){
				/**
				 * @type {number} uint8_t */
				var ret = this.__video__vramBuffer;
				this.__video__vramBuffer = (vramAddrRegister < 0x2000 ? __video__pattern[(vramAddrRegister >> 9) & 0xf][vramAddrRegister & 0x1ff] : __video__vramMirroring[(vramAddrRegister >> 10) & 0x3][vramAddrRegister & 0x3ff]);
				this.__video__vramAddrRegister = (vramAddrRegister + this.__video__vramIncrementSize) & 0x3fff;
				return ret;
			} else {
				/**
				 * @type {number} uint8_t */
				var ret = ((vramAddrRegister & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[vramAddrRegister & 31]);
				this.__video__vramBuffer = (vramAddrRegister < 0x2000 ? __video__pattern[(vramAddrRegister >> 9) & 0xf][vramAddrRegister & 0x1ff] : __video__vramMirroring[(vramAddrRegister >> 10) & 0x3][vramAddrRegister & 0x3ff]); //ミラーされてるVRAMにも同時にアクセスしなければならない。
				this.__video__vramAddrRegister = (vramAddrRegister + this.__video__vramIncrementSize) & 0x3fff;
				return ret;
			}
		}
		default: {
			return 0;
//			throw EmulatorException() << "Invalid addr: 0x" << std::hex << addr;
		}
	}
};


cycloa.ScriptMachine.prototype.__video__writeVramExternal = function(/* uint16_t */ addr, /* uint8_t */ value)
{
	if(addr < 0x2000) {
		//this.__video__pattern[(addr >> 9) & 0xf][addr & 0x1ff] = value;
	} else {
		this.__video__vramMirroring[(addr >> 10) & 0x3][addr & 0x3ff] = value;
	}
};


cycloa.ScriptMachine.prototype.__video__writeVram = function(/* uint16_t */ addr, /* uint8_t */ value) {
	if((addr & 0x3f00) !== 0x3f00){
		this.__video__writeVramExternal(addr, value);
	}else{
		if((addr & 0x3) === 0){ /* writePalette */
			this.__video__palette[32 | ((addr >> 2) & 3)] = value & 0x3f;
		}else{
			this.__video__palette[addr & 31] = value & 0x3f;
		}
	}
};

/**
 * @type {number} mirrorType
 */
cycloa.ScriptMachine.prototype.__video__changeMirrorType = function(/* NesFile::MirrorType */ mirrorType) {
	this.__video__mirrorType = mirrorType;
	switch(mirrorType)
	{
	case 3: {
		this.__video__vramMirroring[0] = this.__video__internalVram[0];
		this.__video__vramMirroring[1] = this.__video__internalVram[0];
		this.__video__vramMirroring[2] = this.__video__internalVram[0];
		this.__video__vramMirroring[3] = this.__video__internalVram[0];
		break;
	}
	case 4: {
		this.__video__vramMirroring[0] = this.__video__internalVram[1];
		this.__video__vramMirroring[1] = this.__video__internalVram[1];
		this.__video__vramMirroring[2] = this.__video__internalVram[1];
		this.__video__vramMirroring[3] = this.__video__internalVram[1];
		break;
	}
	case 0: {
		this.__video__vramMirroring[0] = this.__video__internalVram[1];
		this.__video__vramMirroring[1] = this.__video__internalVram[2];
		this.__video__vramMirroring[2] = this.__video__internalVram[3];
		this.__video__vramMirroring[3] = this.__video__internalVram[4];
		break;
	}
	case 2: {
		this.__video__vramMirroring[0] = this.__video__internalVram[0];
		this.__video__vramMirroring[1] = this.__video__internalVram[0];
		this.__video__vramMirroring[2] = this.__video__internalVram[1];
		this.__video__vramMirroring[3] = this.__video__internalVram[1];
		break;
	}
	case 1: {
		this.__video__vramMirroring[0] = this.__video__internalVram[0];
		this.__video__vramMirroring[1] = this.__video__internalVram[1];
		this.__video__vramMirroring[2] = this.__video__internalVram[0];
		this.__video__vramMirroring[3] = this.__video__internalVram[1];
		break;
	}
	default: {
		throw new cycloa.err.CoreException("Invalid mirroring type!");
	}
	}
};



cycloa.ScriptMachine.prototype.__audio__onHardReset = function() {
	this.__audio__clockCnt = 0;
	this.__audio__leftClock = 0;

	this.__audio__frameIRQenabled = true;
	this.IRQ &= 254;

	this.__audio__isNTSCmode = true;
	this.__audio__frameIRQCnt = 0;
	this.__audio__frameCnt = 0;
};
cycloa.ScriptMachine.prototype.__audio__onReset = function() {
};

cycloa.ScriptMachine.LengthCounterConst = [
		0x0A,0xFE,0x14,0x02,0x28,0x04,0x50,0x06,
		0xA0,0x08,0x3C,0x0A,0x0E,0x0C,0x1A,0x0E,
		0x0C,0x10,0x18,0x12,0x30,0x14,0x60,0x16,
		0xC0,0x18,0x48,0x1A,0x10,0x1C,0x20,0x1E
];


cycloa.ScriptMachine.prototype.__rectangle1__onHardReset = function() {
	this.__rectangle1__volumeOrDecayRate = 0;
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayEnabled = false;
	this.__rectangle1__decayVolume = 0;
	this.__rectangle1__dutyRatio = 0;
	this.__rectangle1__freqCounter = 0;
	this.__rectangle1__dutyCounter = 0;
	this.__rectangle1__decayCounter = 0;
	this.__rectangle1__sweepEnabled = 0;
	this.__rectangle1__sweepShiftAmount = 0;
	this.__rectangle1__sweepIncreased = false;
	this.__rectangle1__sweepUpdateRatio = 0;
	this.__rectangle1__sweepCounter = 0;
	this.__rectangle1__frequency = 0;
	this.__rectangle1__loopEnabled = false;
	this.__rectangle1__lengthCounter = 0;
};
cycloa.ScriptMachine.prototype.__rectangle1__onReset = function(){
	this.__rectangle1__onHardReset();
};


cycloa.ScriptMachine.prototype.__rectangle0__onHardReset = function() {
	this.__rectangle0__volumeOrDecayRate = 0;
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayEnabled = false;
	this.__rectangle0__decayVolume = 0;
	this.__rectangle0__dutyRatio = 0;
	this.__rectangle0__freqCounter = 0;
	this.__rectangle0__dutyCounter = 0;
	this.__rectangle0__decayCounter = 0;
	this.__rectangle0__sweepEnabled = 0;
	this.__rectangle0__sweepShiftAmount = 0;
	this.__rectangle0__sweepIncreased = false;
	this.__rectangle0__sweepUpdateRatio = 0;
	this.__rectangle0__sweepCounter = 0;
	this.__rectangle0__frequency = 0;
	this.__rectangle0__loopEnabled = false;
	this.__rectangle0__lengthCounter = 0;
};
cycloa.ScriptMachine.prototype.__rectangle0__onReset = function(){
	this.__rectangle0__onHardReset();
};

cycloa.ScriptMachine.prototype.__triangle__onHardReset = function(){
	this.__triangle__haltFlag = false;
	this.__triangle__enableLinearCounter = false;
	this.__triangle__frequency = 0;
	this.__triangle__linearCounterBuffer = 0;
	this.__triangle__linearCounter = 0;
	this.__triangle__lengthCounter = 0;
	this.__triangle__freqCounter = 0;
	this.__triangle__streamCounter = 0;
}
cycloa.ScriptMachine.prototype.__triangle__onReset = function()
{
	this.__triangle__onHardReset();
}



cycloa.ScriptMachine.prototype.__noize__onHardReset = function() {
	//rand
	this.__noize__shiftRegister = 1<<14;
	this.__noize__modeFlag = false;

	//decay
	this.__noize__volumeOrDecayRate = false;
	this.__noize__decayReloaded = false;
	this.__noize__decayEnabled = false;

	this.__noize__decayCounter = 0;
	this.__noize__decayVolume = 0;
	//
	this.__noize__loopEnabled = false;
	this.__noize__frequency = 0;
	//
	this.__noize__lengthCounter = 0;
	//
	this.__noize__freqCounter = 0;
};
cycloa.ScriptMachine.prototype.__noize__onReset = function() {
	this.__noize__onHardReset();
};


cycloa.ScriptMachine.prototype.__digital__isIRQEnabled = function()
{
	return this.__digital__irqEnabled;
}
cycloa.ScriptMachine.prototype.__digital__onHardReset = function() {
	this.__digital__irqEnabled = false;
	this.IRQ &= 253;
	this.__digital__loopEnabled = false;
	this.__digital__frequency = 0;
	this.__digital__deltaCounter = 0;
	this.__digital__sampleAddr = 0xc000;
	this.__digital__sampleLength = 0;
	this.__digital__sampleLengthBuffer = 0;
	this.__digital__sampleBuffer = 0;
	this.__digital__sampleBufferLeft = 0;

	this.__digital__freqCounter = 0;
};
cycloa.ScriptMachine.prototype.__digital__onReset = function() {
	this.__digital__onHardReset();
};


/**
 * マッパーごとの初期化関数
 */
cycloa.ScriptMachine.Mapper = [];
cycloa.ScriptMachine.Mapper[0] = function(self){
	self.__mapper__writeMapperCPU = function(/* uint8_t */ addr){
		/*do nothing!*/
	};
	var idx = 0;
	for(var i=0; i<32; ++i){
		self.__cpu__rom[i] = self.__mapper__prgRom.subarray(idx, idx+=1024);
		if(idx >= self.__mapper__prgRom.length){
			idx = 0;
		}
	}
	var cidx = 0;
	for(var i=0;i<0x10; ++i){
		self.__video__pattern[i] = self.__mapper__chrRom.subarray(cidx, cidx += 512);
	}
};

/**
 * __cpu__romを解析してマッパーの初期化などを行う
 * @param {ArrayBuffer} __cpu__rom
 */
cycloa.ScriptMachine.prototype.load = function(rom){
	this.__mapper__parseROM(rom);
	// マッパー関数のインジェクション
	var mapperInit = cycloa.ScriptMachine.Mapper[this.__mapper__mapperNo];
	if(!mapperInit){
		throw new cycloa.err.NotSupportedException("Not supported mapper: "+this.__mapper__mapperNo);
	}
	mapperInit(this);
	this.__video__changeMirrorType(this.__mapper__mirrorType);
};

/**
 * __cpu__romをパースしてセットする
 * @param {ArrayBuffer} data
 */
cycloa.ScriptMachine.prototype.__mapper__parseROM = function(data){
	var data8 = new Uint8Array(data);
	/* check NES data8 */
	if(!(data8[0] === 0x4e && data8[1]===0x45 && data8[2]===0x53 && data8[3] == 0x1a)){
		throw new cycloa.err.CoreException("[FIXME] Invalid header!!");
	}
	this.__mapper__prgSize = 16384 * data8[4];
	this.__mapper__chrSize = 8192 * data8[5];
	this.__mapper__prgPageCnt = data8[4];
	this.__mapper__chrPageCnt = data8[5];
	this.__mapper__mapperNo = ((data8[6] & 0xf0)>>4) | (data8[7] & 0xf0);
	this.__mapper__trainerFlag = (data8[6] & 0x4) === 0x4;
	this.__mapper__sramFlag = (data8[6] & 0x2) === 0x2;
	if((data8[6] & 0x8) == 0x8){
		this.__mapper__mirrorType = 0;
	}else{
		this.__mapper__mirrorType = (data8[6] & 0x1) == 0x1 ? 1 : 2;
	}
	/**
	 * @type {number} uint32_t
	 */
	var fptr = 0x10;
	if(this.__mapper__trainerFlag){
		if(fptr + 512 > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
		this.__mapper__trainer = new Uint8Array(data, fptr, 512);
		fptr += 512;
	}
	/* read PRG __cpu__rom */
	if(fptr + this.__mapper__prgSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	this.__mapper__prgRom = new Uint8Array(data, fptr, this.__mapper__prgSize);
	fptr += this.__mapper__prgSize;

	if(fptr + this.__mapper__chrSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	else if(fptr + this.__mapper__chrSize < data.byteLength) throw cycloa.err.CoreException("[FIXME] Invalid file size; too long!");

	this.__mapper__chrRom = new Uint8Array(data, fptr, this.__mapper__chrSize);
};



