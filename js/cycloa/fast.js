
/**
 * @constructor
 */
cycloa.FastMachine = function(videoFairy, audioFairy, pad1Fairy, pad2Fairy) {
	this.tracer = new cycloa.Tracer(this);
	this.videoFairy = videoFairy;
	this.audioFairy = audioFairy;
	this.pad1Fairy = pad1Fairy || new cycloa.AbstractPadFairy();
	this.pad2Fairy = pad2Fairy || new cycloa.AbstractPadFairy();
	
	this.pad1Idx = 0;
	this.pad2Idx = 0;

/** @type {Number} */
this.A = 0;
/** @type {Number} */
this.X = 0;
/** @type {Number} */
this.Y = 0;
/** @type {Number} */
this.PC = 0;
/** @type {Number} */
this.SP = 0;
/** @type {Number} */
this.P = 0;
/** @type {Boolean} */
this.NMI = false;
/** @type {Boolean} */
this.IRQ = false;
/**
 * @const
 * @type {Uint8Array}
*/
this.ram = new Uint8Array(new ArrayBuffer(0x800));
this.rom = new Array(32);

this.ZNFlagCache = cycloa.FastMachine.ZNFlagCache;
this.TransTable = cycloa.FastMachine.TransTable;
this.MAX_INST_LENGTH = 3;



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
this.screenBuffer = new ArrayBuffer(256 * 240);
this.screenBuffer8 = new Uint8Array(this.screenBuffer);
this.screenBuffer32 = new Uint32Array(this.screenBuffer);
this.spRam = new Uint8Array(256);
this.palette = new Uint8Array(9*4);
this.spriteTable = new Array(8);
for(var i=0; i< 8; ++i){
	this.spriteTable[i] = new Object;
}

this.pattern = new Array(0x10);


this.LengthCounterConst = cycloa.FastMachine.LengthCounterConst;



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

	this.reservedClockDelta = 0;
	this.run = function () {
		
/**
 * @type {Number}
 */
var clockDelta;var rom = this.rom; var ram = this.ram;

		var palette = this.palette; var vramMirroring = this.vramMirroring; var pattern = this.pattern; var screenBuffer8 = this.screenBuffer8;var screenBuffer32 = this.screenBuffer32;
		var audioFairy = this.audioFairy; var __audio__enabled = audioFairy.enabled; var __audio__data=audioFairy.data; var __audio__data__length = audioFairy.dataLength;
		var _run = true;
		var reservedClockDelta = this.reservedClockDelta;
		while(_run) {
			//console.log(this.tracer.decode());

this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用


clockDelta = reservedClockDelta; reservedClockDelta = 0;

if(this.NMI){
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	//from http://nesdev.parodius.com/6502_cpu.txt
	clockDelta += (7);;
	this.P &= 239;
	 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.PC >> 8;	 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.PC;	 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.P;;
	this.P |= 4;
	//this.PC = (this.read(0xFFFA) | (this.read(0xFFFB) << 8));
	this.PC = (this.rom[31][0x3FA]| (this.rom[31][0x3FB] << 8));
	this.NMI = false;
}else if(this.IRQ){
	this.onIRQ();
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	//from http://nesdev.parodius.com/6502_cpu.txt
	if((this.P & 4) !== 4){
		clockDelta += (7);;
		this.P &= 239;
		 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.PC >> 8;		 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.PC;		 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.P;		this.P |= 4;
		//this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));
		this.PC = (this.rom[31][0x3FE] | (this.rom[31][0x3FF] << 8));
	}
}

if(this.needStatusRewrite){
	this.P = this.newStatus;
	this.needStatusRewrite = false;
}


			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

var opbyte;

switch((pc & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		opbyte = ram[pc & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		opbyte = this.readVideoReg(pc);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(pc === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			opbyte =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(pc === 0x4016){
			opbyte = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(pc === 0x4017){
			opbyte = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+pc.toString(16));
		}else{
			opbyte = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		opbyte = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		opbyte = rom[(pc>>10) & 31][pc & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		opbyte = rom[(pc>>10) & 31][pc & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		opbyte = rom[(pc>>10) & 31][pc & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		opbyte = rom[(pc>>10) & 31][pc & 0x3ff];
		break;
	}
}
/**
 * @const
 * @type {Number}
 */
var inst = this.TransTable[opbyte];
// http://www.llx.com/~nparker/a2/opcodes.html
switch( inst & 15 ){
		case 0: { /* Immediate */
			
			/**
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;

		break;
	}
		case 1: { /* Zeropage */
			
			/**
			 * @type {Number}
			 */
			var addr_base = pc+1;
			var addr;
			
switch((addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr = ram[addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr = this.readVideoReg(addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base === 0x4016){
			addr = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base === 0x4017){
			addr = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base.toString(16));
		}else{
			addr = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
}

			
			this.PC = pc + 2;

		break;
	}
		case 2: { /* ZeropageX */
			
			var addr_base = pc+1;
			
switch((addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base = ram[addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base = this.readVideoReg(addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base === 0x4016){
			addr_base = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base === 0x4017){
			addr_base = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base.toString(16));
		}else{
			addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (addr_base + this.X) & 0xff;
			
			this.PC = pc + 2;

		break;
	}
		case 3: { /* ZeropageY */
			
			var addr_base = pc+1;
			
switch((addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base = ram[addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base = this.readVideoReg(addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base === 0x4016){
			addr_base = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base === 0x4017){
			addr_base = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base.toString(16));
		}else{
			addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (addr_base + this.Y) & 0xff;
			
			this.PC = pc + 2;

		break;
	}
		case 4: { /* Absolute */
			
			var addr_base1 = pc+1;
			
switch((addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base1 = ram[addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base1 = this.readVideoReg(addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base1 === 0x4016){
			addr_base1 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base1 === 0x4017){
			addr_base1 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base1.toString(16));
		}else{
			addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
}

			var addr_base2 = pc+2;
			
switch((addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base2 = ram[addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base2 = this.readVideoReg(addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base2 === 0x4016){
			addr_base2 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base2 === 0x4017){
			addr_base2 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base2.toString(16));
		}else{
			addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (addr_base1 | (addr_base2 << 8));
			
			this.PC = pc + 3;

		break;
	}
		case 5: { /* AbsoluteX */
			
			var addr_base1 = pc+1;
			
switch((addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base1 = ram[addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base1 = this.readVideoReg(addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base1 === 0x4016){
			addr_base1 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base1 === 0x4017){
			addr_base1 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base1.toString(16));
		}else{
			addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
}

			var addr_base2 = pc+2;
			
switch((addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base2 = ram[addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base2 = this.readVideoReg(addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base2 === 0x4016){
			addr_base2 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base2 === 0x4017){
			addr_base2 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base2.toString(16));
		}else{
			addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (addr_base1 | (addr_base2 << 8)) + this.X;
			if(((addr ^ addr_base) & 0x0100) !== 0) clockDelta += (1);
			
			this.PC = pc + 3;

		break;
	}
		case 6: { /* AbsoluteY */
			
			var addr_base1 = pc+1;
			
switch((addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base1 = ram[addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base1 = this.readVideoReg(addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base1 === 0x4016){
			addr_base1 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base1 === 0x4017){
			addr_base1 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base1.toString(16));
		}else{
			addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
}

			var addr_base2 = pc+2;
			
switch((addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base2 = ram[addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base2 = this.readVideoReg(addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base2 === 0x4016){
			addr_base2 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base2 === 0x4017){
			addr_base2 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base2.toString(16));
		}else{
			addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (addr_base1 | (addr_base2 << 8)) + this.Y;
			if(((addr ^ addr_base) & 0x0100) !== 0) clockDelta += (1);
			
			this.PC = pc + 3;

		break;
	}
		case 7: { /* Indirect */
			
			var addr_base1 = pc+1;
			
switch((addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base1 = ram[addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base1 = this.readVideoReg(addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base1 === 0x4016){
			addr_base1 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base1 === 0x4017){
			addr_base1 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base1.toString(16));
		}else{
			addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base1 = rom[(addr_base1>>10) & 31][addr_base1 & 0x3ff];
		break;
	}
}

			var addr_base2 = pc+2;
			
switch((addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base2 = ram[addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base2 = this.readVideoReg(addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base2 === 0x4016){
			addr_base2 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base2 === 0x4017){
			addr_base2 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base2.toString(16));
		}else{
			addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base2 = rom[(addr_base2>>10) & 31][addr_base2 & 0x3ff];
		break;
	}
}

			var addr_base3 = (addr_base1 | (addr_base2 << 8));

			var addr_base4;
			
switch((addr_base3 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base4 = ram[addr_base3 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base4 = this.readVideoReg(addr_base3);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base3 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base4 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base3 === 0x4016){
			addr_base4 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base3 === 0x4017){
			addr_base4 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base3.toString(16));
		}else{
			addr_base4 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base4 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base4 = rom[(addr_base3>>10) & 31][addr_base3 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base4 = rom[(addr_base3>>10) & 31][addr_base3 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base4 = rom[(addr_base3>>10) & 31][addr_base3 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base4 = rom[(addr_base3>>10) & 31][addr_base3 & 0x3ff];
		break;
	}
}

			var addr_base5 = (addr_base3 & 0xff00) | ((addr_base3+1) & 0x00ff) /* bug of NES */;
			
switch((addr_base5 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base5 = ram[addr_base5 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base5 = this.readVideoReg(addr_base5);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base5 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base5 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base5 === 0x4016){
			addr_base5 = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base5 === 0x4017){
			addr_base5 = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base5.toString(16));
		}else{
			addr_base5 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base5 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base5 = rom[(addr_base5>>10) & 31][addr_base5 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base5 = rom[(addr_base5>>10) & 31][addr_base5 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base5 = rom[(addr_base5>>10) & 31][addr_base5 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base5 = rom[(addr_base5>>10) & 31][addr_base5 & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = addr_base4 | (addr_base5 << 8); 
			
			this.PC = pc + 3;

		break;
	}
		case 8: { /* IndirectX */
			
			/**
			 * @type {Number}
			 */
			var addr_base = pc+1;
			
switch((addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base = ram[addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base = this.readVideoReg(addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base === 0x4016){
			addr_base = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base === 0x4017){
			addr_base = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base.toString(16));
		}else{
			addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
}

			addr_base = (addr_base + this.X) & 0xff;
			/**
			 * @type {Number}
			 */
			var addr = ram[addr_base] | (ram[(addr_base + 1) & 0xff] << 8);
			
			this.PC = pc + 2;

		break;
	}
		case 9: { /* IndirectY */
			
			/**
			 * @type {Number}
			 */
			var addr_base = pc+1;
			
switch((addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base = ram[addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base = this.readVideoReg(addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base === 0x4016){
			addr_base = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base === 0x4017){
			addr_base = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base.toString(16));
		}else{
			addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (ram[addr_base] | (ram[(addr_base + 1) & 0xff] << 8)) + this.Y;
			
			this.PC = pc + 2;

		break;
	}
		case 10: { /* Relative */
			
			/**
			 * @type {Number}
			 */
			var addr_base = pc+1;
			
switch((addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		addr_base = ram[addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		addr_base = this.readVideoReg(addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr_base === 0x4016){
			addr_base = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr_base === 0x4017){
			addr_base = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr_base.toString(16));
		}else{
			addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		addr_base = rom[(addr_base>>10) & 31][addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pc + 2;
			
			this.PC = pc + 2;

		break;
	}
		case 11: { /* None */
			
			
			this.PC = pc + 1;

		break;
	}
	default: { throw new cycloa.err.CoreException("Invalid opcode."); }
}
switch( (inst & 65520) >> 4 ){
		case 0: {  /* LDA */
			
var tmpA;

switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		tmpA = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		tmpA = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			tmpA =
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
			tmpA = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			tmpA = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			tmpA = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		tmpA = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		tmpA = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		tmpA = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		tmpA = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		tmpA = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = tmpA];
		break;}
		case 1: {  /* LDX */
			
var tmpX;

switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		tmpX = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		tmpX = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			tmpX =
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
			tmpX = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			tmpX = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			tmpX = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		tmpX = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		tmpX = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		tmpX = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		tmpX = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		tmpX = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = tmpX];
		break;}
		case 2: {  /* LDY */
			
var tmpY;

switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		tmpY = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		tmpY = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			tmpY =
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
			tmpY = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			tmpY = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			tmpY = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		tmpY = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		tmpY = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		tmpY = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		tmpY = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		tmpY = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = tmpY];
		break;}
		case 3: {  /* STA */
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = this.A;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, this.A);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = this.A & 15;			this.__rectangle0__decayEnabled = (this.A & 16) == 0;			this.__rectangle0__loopEnabled = (this.A & 32) == 32;			switch(this.A >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = this.A & 7;			this.__rectangle0__sweepIncreased = (this.A & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (this.A >> 4) & 3;			this.__rectangle0__sweepEnabled = (this.A&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (this.A);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((this.A & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[this.A >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = this.A & 15;			this.__rectangle1__decayEnabled = (this.A & 16) == 0;			this.__rectangle1__loopEnabled = (this.A & 32) == 32;			switch(this.A >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = this.A & 7;			this.__rectangle1__sweepIncreased = (this.A & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (this.A >> 4) & 3;			this.__rectangle1__sweepEnabled = (this.A&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (this.A);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((this.A & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[this.A >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((this.A & 128) == 128);			this.__triangle__linearCounterBuffer = this.A & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | this.A;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((this.A & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[this.A >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = this.A & 15;			this.__noize__decayEnabled = (this.A & 16) == 0;			this.__noize__loopEnabled = (this.A & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (this.A & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[this.A & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[this.A >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (this.A & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (this.A & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[this.A & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = this.A & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (this.A << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (this.A << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = this.A << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(this.A & 1)) this.__rectangle0__lengthCounter = 0;			if(!(this.A & 2)) this.__rectangle1__lengthCounter = 0;			if(!(this.A & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(this.A & 8)) this.__noize__lengthCounter = 0;			if(!(this.A & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((this.A & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(this.A & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((this.A & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, this.A); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, this.A);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, this.A);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, this.A);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, this.A);		break;	}}		break;}
		case 4: {  /* STX */
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = this.X;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, this.X);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = this.X & 15;			this.__rectangle0__decayEnabled = (this.X & 16) == 0;			this.__rectangle0__loopEnabled = (this.X & 32) == 32;			switch(this.X >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = this.X & 7;			this.__rectangle0__sweepIncreased = (this.X & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (this.X >> 4) & 3;			this.__rectangle0__sweepEnabled = (this.X&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (this.X);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((this.X & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[this.X >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = this.X & 15;			this.__rectangle1__decayEnabled = (this.X & 16) == 0;			this.__rectangle1__loopEnabled = (this.X & 32) == 32;			switch(this.X >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = this.X & 7;			this.__rectangle1__sweepIncreased = (this.X & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (this.X >> 4) & 3;			this.__rectangle1__sweepEnabled = (this.X&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (this.X);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((this.X & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[this.X >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((this.X & 128) == 128);			this.__triangle__linearCounterBuffer = this.X & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | this.X;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((this.X & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[this.X >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = this.X & 15;			this.__noize__decayEnabled = (this.X & 16) == 0;			this.__noize__loopEnabled = (this.X & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (this.X & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[this.X & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[this.X >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (this.X & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (this.X & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[this.X & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = this.X & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (this.X << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (this.X << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = this.X << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(this.X & 1)) this.__rectangle0__lengthCounter = 0;			if(!(this.X & 2)) this.__rectangle1__lengthCounter = 0;			if(!(this.X & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(this.X & 8)) this.__noize__lengthCounter = 0;			if(!(this.X & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((this.X & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(this.X & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((this.X & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, this.X); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, this.X);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, this.X);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, this.X);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, this.X);		break;	}}		break;}
		case 5: {  /* STY */
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = this.Y;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, this.Y);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = this.Y & 15;			this.__rectangle0__decayEnabled = (this.Y & 16) == 0;			this.__rectangle0__loopEnabled = (this.Y & 32) == 32;			switch(this.Y >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = this.Y & 7;			this.__rectangle0__sweepIncreased = (this.Y & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (this.Y >> 4) & 3;			this.__rectangle0__sweepEnabled = (this.Y&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (this.Y);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((this.Y & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[this.Y >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = this.Y & 15;			this.__rectangle1__decayEnabled = (this.Y & 16) == 0;			this.__rectangle1__loopEnabled = (this.Y & 32) == 32;			switch(this.Y >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = this.Y & 7;			this.__rectangle1__sweepIncreased = (this.Y & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (this.Y >> 4) & 3;			this.__rectangle1__sweepEnabled = (this.Y&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (this.Y);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((this.Y & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[this.Y >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((this.Y & 128) == 128);			this.__triangle__linearCounterBuffer = this.Y & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | this.Y;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((this.Y & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[this.Y >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = this.Y & 15;			this.__noize__decayEnabled = (this.Y & 16) == 0;			this.__noize__loopEnabled = (this.Y & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (this.Y & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[this.Y & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[this.Y >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (this.Y & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (this.Y & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[this.Y & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = this.Y & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (this.Y << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (this.Y << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = this.Y << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(this.Y & 1)) this.__rectangle0__lengthCounter = 0;			if(!(this.Y & 2)) this.__rectangle1__lengthCounter = 0;			if(!(this.Y & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(this.Y & 8)) this.__noize__lengthCounter = 0;			if(!(this.Y & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((this.Y & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(this.Y & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((this.Y & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, this.Y); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, this.Y);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, this.Y);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, this.Y);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, this.Y);		break;	}}		break;}
		case 6: {  /* TAX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.A];		break;}
		case 7: {  /* TAY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.A];		break;}
		case 8: {  /* TSX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.SP];		break;}
		case 9: {  /* TXA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.X];		break;}
		case 10: {  /* TXS */
			this.SP = this.X;		break;}
		case 11: {  /* TYA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.Y];		break;}
		case 12: {  /* ADC */
			
			/**
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var result = (a + val + (p & 0x1)) & 0xffff;
			/**
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (p & 0xbe)
				| ((((a ^ val) & 0x80) ^ 0x80) & ((a ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];
		break;}
		case 13: {  /* AND */
			
var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
;
/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= mem];
		break;}
		case 14: {  /* ASL */
			
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			this.P = (this.P & 0xFE) | val >> 7;
			/**
			 * @type {Number}
			 */
			var shifted = val << 1;
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = shifted << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, shifted);		break;	}}
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted & 0xff];
		break;}
		case 15: {  /* ASL_ */
			
			/**
			 * @type {Number}
			 */
			var a = this.A;
			this.P = (this.P & 0xFE) | (a & 0xff) >> 7;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = (a << 1) & 0xff];
		break;}
		case 16: {  /* BIT */
			
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			this.P = (this.P & 0x3d)
				| (val & 0xc0)
				| (this.ZNFlagCache[this.A & val] & 0x2);
		break;}
		case 17: {  /* CMP */
			
			var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var val = (this.A - mem) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 18: {  /* CPX */
			
			var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var val = (this.X - mem) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 19: {  /* CPY */
			
			var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var val = (this.Y - mem) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 20: {  /* DEC */
			
			/**
			 * @type {Number}
			 */
			var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			var val = (mem-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = val;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, val);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;			this.__rectangle0__decayEnabled = (val & 16) == 0;			this.__rectangle0__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = val & 7;			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;			this.__rectangle1__decayEnabled = (val & 16) == 0;			this.__rectangle1__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = val & 7;			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((val & 128) == 128);			this.__triangle__linearCounterBuffer = val & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[val >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;			this.__noize__decayEnabled = (val & 16) == 0;			this.__noize__loopEnabled = (val & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (val & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[val >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (val & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (val & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = val & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (val << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = val << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(val & 8)) this.__noize__lengthCounter = 0;			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((val & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(val & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((val & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, val); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, val);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, val);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, val);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, val);		break;	}}
		break;}
		case 21: {  /* DEX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = (this.X-1)&0xff];		break;}
		case 22: {  /* DEY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = (this.Y-1)&0xff];		break;}
		case 23: {  /* EOR */
			
var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
;
/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= mem];
		break;}
		case 24: {  /* INC */
			
			/**
			 * @type {Number}
			 */
			var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			var val = (mem+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = val;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, val);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;			this.__rectangle0__decayEnabled = (val & 16) == 0;			this.__rectangle0__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = val & 7;			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;			this.__rectangle1__decayEnabled = (val & 16) == 0;			this.__rectangle1__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = val & 7;			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((val & 128) == 128);			this.__triangle__linearCounterBuffer = val & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[val >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;			this.__noize__decayEnabled = (val & 16) == 0;			this.__noize__loopEnabled = (val & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (val & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[val >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (val & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (val & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = val & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (val << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = val << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(val & 8)) this.__noize__lengthCounter = 0;			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((val & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(val & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((val & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, val); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, val);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, val);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, val);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, val);		break;	}}
		break;}
		case 25: {  /* INX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = (this.X+1)&0xff];		break;}
		case 26: {  /* INY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = (this.Y+1)&0xff];		break;}
		case 27: {  /* LSR */
			
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			this.P = (this.P & 0xFE) | (val & 0x01);
			/**
			 * @type {Number}
			 */
			var shifted = val >> 1;
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = shifted << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, shifted);		break;	}}
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
		break;}
		case 28: {  /* LSR_ */
			
			this.P = (this.P & 0xFE) | (this.A & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A >>= 1];
		break;}
		case 29: {  /* ORA */
			
var mem; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
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
			mem = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			mem = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
;
/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= mem];
		break;}
		case 30: {  /* ROL */
			
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (p & 0x01);
			this.P = (p & 0xFE) | (val >> 7);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = shifted << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, shifted);		break;	}}
		break;}
		case 31: {  /* ROL_ */
			
			/**
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @type {Number}
			 */
			var p = this.P;
			this.P = (p & 0xFE) | ((a & 0xff) >> 7);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = (a << 1) | (p & 0x01)];
		break;}
		case 32: {  /* ROR */
			
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((p & 0x01) << 7);
			this.P = (p & 0xFE) | (val & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = shifted << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, shifted);		break;	}}
		break;}
		case 33: {  /* ROR_ */
			
			/**
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @type {Number}
			 */
			this.P = (p & 0xFE) | (a & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = ((a >> 1) & 0x7f) | ((p & 0x1) << 7)];
		break;}
		case 34: {  /* SBC */
			
			/**
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @type {Number}
			 */
			var val; 
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.readVideoReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
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
			val = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			val = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {Number}
			 */
			var result = (a - val - ((p & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (p & 0xbe)
				| ((a ^ val) & (a ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];
		break;}
		case 35: {  /* PHA */
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.A;		break;}
		case 36: {  /* PHP */
			
			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.P | 0x10;
		break;}
		case 37: {  /* PLA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = /* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)])];		break;}
		case 38: {  /* PLP */
			
			/**
			 * @type {Number}
			 */
			var val = /* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)]);
			if((this.P & 0x4) && !(val & 0x4)){
				// FIXME: ここどうする？？
				this.needStatusRewrite = true;
				this.newStatus =val;
				//this.P = val;
			}else{
				this.P = val;
			}
		break;}
		case 39: {  /* CLC */
			
			this.P &= (0xfe);
		break;}
		case 40: {  /* CLD */
			
			this.P &= (0xf7);
		break;}
		case 41: {  /* CLI */
			
			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			this.needStatusRewrite = true;
			this.newStatus = this.P & (0xfb);
			//this.P &= 0xfb;
		break;}
		case 42: {  /* CLV */
			
			this.P &= (0xbf);
		break;}
		case 43: {  /* SEC */
			
			this.P |= 0x1;
		break;}
		case 44: {  /* SED */
			
			this.P |= 0x8;
		break;}
		case 45: {  /* SEI */
			
			this.P |= 0x4;
		break;}
		case 46: {  /* BRK */
			
			//NES ON FPGAには、
			//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
			//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
			//DQ4はこうしないと、動かない。
			/*
			if(this.P & 0x4){
				return;
			}*/
			this.PC++;
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.PC >> 8;
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = this.PC;
			this.P |= 0x10;
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = (this.P);
			this.P |= 0x4;
			//this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));
			this.PC = (rom[31][0x3FE] | (rom[31][0x3FF] << 8));
		break;}
		case 47: {  /* NOP */
					break;}
		case 48: {  /* RTS */
			
			this.PC = (/* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)]) | (/* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)]) << 8)) + 1;
		break;}
		case 49: {  /* RTI */
			
			this.P = /* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)]);
			this.PC = /* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)]) | (/* ::CPU::Pop */ (ram[0x0100 | (++this.SP & 0xff)]) << 8);
		break;}
		case 50: {  /* JMP */
			
			this.PC = addr;
		break;}
		case 51: {  /* JSR */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var stored_pc = this.PC-1;
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = stored_pc >> 8;
			 /* ::CPU::Push */ ram[0x0100 | (this.SP-- & 0xff)] = stored_pc;
			this.PC = addr;
		break;}
		case 52: {  /* BCC */
			
			if(!(this.P & 0x1)){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 53: {  /* BCS */
			
			if(this.P & 0x1){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 54: {  /* BEQ */
			
			if(this.P & 0x2){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 55: {  /* BMI */
			
			if(this.P & 0x80){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 56: {  /* BNE */
			
			if(!(this.P & 0x2)){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 57: {  /* BPL */
			
			if(!(this.P & 0x80)){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 58: {  /* BVC */
			
			if(!(this.P & 0x40)){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
		case 59: {  /* BVS */
			
			if(this.P & 0x40){
				clockDelta += ((((this.PC ^ addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = addr;
			}
		break;}
}
clockDelta += (inst >> 16);



this.nowX += clockDelta * 3;
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
		this.spriteEval();
		if(this.backgroundVisibility || this.spriteVisibility) {
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
		this.videoFairy.dispatchRendering(screenBuffer8, this.paletteMask);
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


this.__audio__frameCnt += (clockDelta * 240);
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
			var shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += shift;
			}else{
				this.__rectangle1__frequency -= shift;
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
			var shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += shift;
			}else{
				this.__rectangle0__frequency -= shift;
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
			var shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += shift;
			}else{
				this.__rectangle1__frequency -= shift;
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
			var shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += shift;
			}else{
				this.__rectangle0__frequency -= shift;
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
			var shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += shift;
			}else{
				this.__rectangle1__frequency -= shift;
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
			var shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += shift;
			}else{
				this.__rectangle0__frequency -= shift;
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
			var shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += shift;
			}else{
				this.__rectangle1__frequency -= shift;
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
			var shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += shift;
			}else{
				this.__rectangle0__frequency -= shift;
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
this.__audio__clockCnt += (clockDelta * 22050);
while(this.__audio__clockCnt >= 1786840){
	/*unsigned int*/var processClock = 1786840 + this.__audio__leftClock;
	/*unsigned int*/var delta = (processClock / 22050) | 0;
	this.__audio__leftClock = processClock % 22050;
	this.__audio__clockCnt-= 1786840;
	/*int16_t*/ var sound = 0;

if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var nowCounter = this.__rectangle1__freqCounter + delta;
	this.__rectangle1__freqCounter = nowCounter % (this.__rectangle1__frequency + 1);
	this.__rectangle1__dutyCounter = (this.__rectangle1__dutyCounter + (nowCounter  / (this.__rectangle1__frequency + 1))) & 15;
	if(this.__rectangle1__dutyCounter < this.__rectangle1__dutyRatio){
		sound += this.__rectangle1__decayEnabled ? this.__rectangle1__decayVolume : this.__rectangle1__volumeOrDecayRate;
	}else{
		sound += this.__rectangle1__decayEnabled ? -this.__rectangle1__decayVolume : -this.__rectangle1__volumeOrDecayRate;
	}
}


if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var nowCounter = this.__rectangle0__freqCounter + delta;
	this.__rectangle0__freqCounter = nowCounter % (this.__rectangle0__frequency + 1);
	this.__rectangle0__dutyCounter = (this.__rectangle0__dutyCounter + (nowCounter  / (this.__rectangle0__frequency + 1))) & 15;
	if(this.__rectangle0__dutyCounter < this.__rectangle0__dutyRatio){
		sound += this.__rectangle0__decayEnabled ? this.__rectangle0__decayVolume : this.__rectangle0__volumeOrDecayRate;
	}else{
		sound += this.__rectangle0__decayEnabled ? -this.__rectangle0__decayVolume : -this.__rectangle0__volumeOrDecayRate;
	}
}

if(this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0){
	//freqが1や0だと、ここでもモデルが破綻する。FF1のOPで発生。
	/* unsigned int */ var nowCounter = this.__triangle__freqCounter + delta;
	var freq = this.__triangle__frequency + 1;
	this.__triangle__freqCounter = nowCounter % freq;
	sound += this.__triangle__waveForm[this.__triangle__streamCounter = (this.__triangle__streamCounter + (nowCounter  / freq)) & 31];
}

if(this.__noize__lengthCounter != 0){
	/* unsigned int */var nowCounter = this.__noize__freqCounter + delta;
	/* const uint16_t */var divFreq = this.__noize__frequency + 1;
	/* const uint8_t */var shiftAmount = this.__noize__modeFlag ? 6 : 1;
	//FIXME: frequencyが小さい時に此のモデルが破綻する
	var shiftReg = this.__noize__shiftRegister;
	while(nowCounter >= divFreq){
		nowCounter -= divFreq;
		shiftReg =(shiftReg >> 1) | (((shiftReg ^ (shiftReg >> shiftAmount))  & 1) << 14);
	}

	if(((shiftReg & 1) == 1)){
		sound += this.__noize__decayEnabled ? -this.__noize__decayVolume : -this.__noize__volumeOrDecayRate;
	}else{
		sound += this.__noize__decayEnabled ? this.__noize__decayVolume : this.__noize__volumeOrDecayRate;
	}

	this.__noize__freqCounter = nowCounter;
	this.__noize__shiftRegister = shiftReg;
}

if(this.__digital__sampleLength != 0){
	/*unsigned int*/ var nowCounter = this.__digital__freqCounter + delta;
	/*const uint16_t*/var divFreq = this.__digital__frequency + 1;
	while(nowCounter >= divFreq){
		nowCounter -= divFreq;
			if(this.__digital__sampleBufferLeft == 0){
				this.__digital__sampleLength--;
				var __val__;
				var addr = this.__digital__sampleAddr;
				
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__val__ = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__val__ = this.readVideoReg(addr);
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
			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
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
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
				this.__digital__sampleBuffer = __val__;

				if(this.__digital__sampleAddr >= 0xffff){
					this.__digital__sampleAddr = 0x8000;
				}else{
					this.__digital__sampleAddr++;
				}
				this.__digital__sampleBufferLeft = 7;
				reservedClockDelta += (4);				if(this.__digital__sampleLength == 0){
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
	this.__digital__freqCounter = nowCounter;
	sound += this.__digital__deltaCounter;
}

	if(__audio__enabled){
		__audio__data[audioFairy.dataIndex++] = sound / 100;
		if(audioFairy.dataIndex >= __audio__data__length){
			audioFairy.onDataFilled();
			__audio__data = audioFairy.data;
		}
	}
}


		}
		this.reservedClockDelta = reservedClockDelta;
		return _run;
	};



this.onHardResetCPU = function(){
		//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
		this.P = 0x24;
		this.A = 0x0;
		this.X = 0x0;
		this.Y = 0x0;
		this.SP = 0xfd;
		switch((0x4017 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[0x4017 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(0x4017, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4017 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = 0x00 << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4017, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4017, 0x00);		break;	}}		switch((0x4015 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[0x4015 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(0x4015, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4015 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = 0x00 << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4015, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4015, 0x00);		break;	}}		//this.PC = (this.read(0xFFFC) | (this.read(0xFFFD) << 8));
		this.PC = (this.rom[31][0x3FC]| (this.rom[31][0x3FD] << 8));

		this.NMI = false;
		this.IRQ = 0;
};

this.onResetCPU = function () {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.reservedClockDelta += 6;
	this.SP -= 0x03;
	this.P |= 4;
	switch((0x4015 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		ram[0x4015 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.writeVideoReg(0x4015, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4015 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var addrMask = 0x00 << 8;			var spRam = this.spRam;			var spriteAddr = this.spriteAddr;			for(var i=0;i<256;++i){				var __addr__ = addrMask | i;				var __val__;				switch((__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__val__ = ram[__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__val__ = this.readVideoReg(__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__val__ =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__addr__ === 0x4016){			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;		}else if(__addr__ === 0x4017){			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));		}else{			__val__ = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__val__ = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];		break;	}}				spRam[(spriteAddr+i) & 0xff] = __val__;			}			clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.pad1Idx = 0;				this.pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4015, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4015, 0x00);		break;	}}	//this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));
	this.PC = (this.rom[31][0x3FC]| (this.rom[31][0x3FD] << 8));

	this.NMI = false;
	this.IRQ = 0;
};




this.onHardResetVideo = function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	for(var i=0;i< 4;++i) {
		var iv = this.internalVram[i];
		for(var j=0;j<0x400; ++j){
			iv[j] = 0;
		}
	}
	for(var i=0;i< 256;++i) {
		this.spRam[i] = 0;
	}
	for(var i=0;i< 36;++i) {
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
				this.lostSprites = true;
				break;
			}
		}
	}
	//残りは無効化
	this.spriteHitCnt = _spriteHitCnt;
	for(var i=_spriteHitCnt;i< 8;i++){
		spriteTable[i].y=255;
	}
};

this.buildBgLine = function(){
	var palette = this.palette; var vramMirroring = this.vramMirroring; var pattern = this.pattern; var screenBuffer8 = this.screenBuffer8;var screenBuffer32 = this.screenBuffer32;	var _color = 0 | palette[32];
	if(!this.backgroundVisibility) {
		var _color32 = _color << 24 | _color << 16 | _color << 8 | _color;
		for(var i=((nowY-1) << 6), max=i+64; i<max; ++i) screenBuffer32[i] = _color32;
		return;
	}
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.nowY-1) << 8;
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
	
	var renderX=0;

	while(true){
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileNo = (((nameTableAddr & 0x3f00) !== 0x3f00) ? (nameTableAddr < 0x2000 ? pattern[(nameTableAddr >> 9) & 0xf][nameTableAddr & 0x1ff] : vramMirroring[(nameTableAddr >> 10) & 0x3][nameTableAddr & 0x3ff]) : ((nameTableAddr & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[nameTableAddr & 31]) );
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
					(((palAddr & 0x3f00) !== 0x3f00) ? (palAddr < 0x2000 ? pattern[(palAddr >> 9) & 0xf][palAddr & 0x1ff] : vramMirroring[(palAddr >> 10) & 0x3][palAddr & 0x3ff]) : ((palAddr & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[palAddr & 31]) )								>> (((tileYofScreen & 2) << 1) | (nameTableAddr & 2))
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
		var firstPlane = (((off & 0x3f00) !== 0x3f00) ? (off < 0x2000 ? pattern[(off >> 9) & 0xf][off & 0x1ff] : vramMirroring[(off >> 10) & 0x3][off & 0x3ff]) : ((off & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[off & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlaneAddr = off+8;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = (((secondPlaneAddr & 0x3f00) !== 0x3f00) ? (secondPlaneAddr < 0x2000 ? pattern[(secondPlaneAddr >> 9) & 0xf][secondPlaneAddr & 0x1ff] : vramMirroring[(secondPlaneAddr >> 10) & 0x3][secondPlaneAddr & 0x3ff]) : ((secondPlaneAddr & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[secondPlaneAddr & 31]) );
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
				screenBuffer8[buffOffset+renderX] = palette[paletteOffset+color] | 128;
			}else{
				screenBuffer8[buffOffset+renderX] = _color;
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

this.buildSpriteLine = function(){
	if(!this.spriteVisibility){
		return;
	}
	var palette = this.palette; var vramMirroring = this.vramMirroring; var pattern = this.pattern; var screenBuffer8 = this.screenBuffer8;var screenBuffer32 = this.screenBuffer32;	/**
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
	var buffOffset = (this.nowY-1) << 8;
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
		var firstPlane = (((off & 0x3f00) !== 0x3f00) ? (off < 0x2000 ? pattern[(off >> 9) & 0xf][off & 0x1ff] : vramMirroring[(off >> 10) & 0x3][off & 0x3ff]) : ((off & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[off & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlaneAddr = off+8;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = (((secondPlaneAddr & 0x3f00) !== 0x3f00) ? (secondPlaneAddr < 0x2000 ? pattern[(secondPlaneAddr >> 9) & 0xf][secondPlaneAddr & 0x1ff] : vramMirroring[(secondPlaneAddr >> 10) & 0x3][secondPlaneAddr & 0x3ff]) : ((secondPlaneAddr & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[secondPlaneAddr & 31]) );
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
				var target = this.screenBuffer8[buffOffset + slot.x + x];
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
					this.sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					screenBuffer8[buffOffset + slot.x + x] = palette[(slot.paletteNo<<2) + color] | layerMask;
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
				var target = this.screenBuffer8[buffOffset + slot.x + x];
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
					this.sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					screenBuffer8[buffOffset + slot.x + x] = palette[(slot.paletteNo<<2) + color] | layerMask;
				}
			}
		}
	}
};

this.writeVideoReg = function(/* uint16_t */ addr, /* uint8_t */ value) {
	var palette = this.palette; var vramMirroring = this.vramMirroring; var pattern = this.pattern; var screenBuffer8 = this.screenBuffer8;var screenBuffer32 = this.screenBuffer32;
	switch(addr & 0x07) {
		/* PPU Control and Status Registers */
		case 0x00: { //2000h - PPU Control Register 1 (W)
			this.executeNMIonVBlank = ((value & 0x80) === 0x80) ? true : false;
			this.spriteHeight = ((value & 0x20) === 0x20) ? 16 : 8;
			this.patternTableAddressBackground = (value & 0x10) << 8;
			this.patternTableAddress8x8Sprites = (value & 0x8) << 9;
			this.vramIncrementSize = ((value & 0x4) === 0x4) ? 32 : 1;
			this.vramAddrReloadRegister = (this.vramAddrReloadRegister & 0x73ff) | ((value & 0x3) << 10);
			break;
		}
		case 0x01: { //2001h - PPU Control Register 2 (W)
			this.colorEmphasis = value >> 5; //FIXME: この扱い、どーする？
			this.spriteVisibility = ((value & 0x10) === 0x10) ? true : false;
			this.backgroundVisibility = ((value & 0x08) == 0x08) ? true : false;
			this.spriteClipping = ((value & 0x04) === 0x04) ? false : true;
			this.backgroundClipping = ((value & 0x2) === 0x02) ? false : true;
			this.paletteMask = ((value & 0x1) === 0x01) ? 0x30 : 0x3f;
			break;
		}
		//case 0x02: //2002h - PPU Status Register (R)
		/* PPU SPR-RAM Access Registers */
		case 0x03: { //2003h - SPR-RAM Address Register (W)
			this.spriteAddr = value;
			break;
		}
		case 0x04: { //2004h - SPR-RAM Data Register (Read/Write)
			spRam[this.spriteAddr] = value;
			this.spriteAddr = (this.spriteAddr+1) & 0xff;
			break;
		}
		/* PPU VRAM Access Registers */
		case 0x05: { //PPU Background Scrolling Offset (W2)
			if(this.scrollRegisterWritten){ //Y
				this.vramAddrReloadRegister = (this.vramAddrReloadRegister & 0x8C1F) | ((value & 0xf8) << 2) | ((value & 7) << 12);
			}else{ //X
				this.vramAddrReloadRegister = (this.vramAddrReloadRegister & 0xFFE0) | value >> 3;
				this.horizontalScrollBits = value & 7;
			}
			this.scrollRegisterWritten = !this.scrollRegisterWritten;
			break;
		}
		case 0x06: { //VRAM Address Register (W2)
			if(this.vramAddrRegisterWritten){
				this.vramAddrReloadRegister = (this.vramAddrReloadRegister & 0x7f00) | value;
				this.vramAddrRegister = this.vramAddrReloadRegister & 0x3fff;
			} else {
				this.vramAddrReloadRegister =(this.vramAddrReloadRegister & 0x00ff) | ((value & 0x7f) << 8);
			}
			this.vramAddrRegisterWritten = !this.vramAddrRegisterWritten;
			break;
		}
		case 0x07: { //VRAM Read/Write Data Register (RW)
			this.writeVram(this.vramAddrRegister, value);
			this.vramAddrRegister = (this.vramAddrRegister + this.vramIncrementSize) & 0x3fff;
			break;
		}
		default: {
			throw new cycloa.err.CoreException("Invalid addr: 0x"+addr.toString(16));
		}
	}
};

this.readVideoReg = function(/* uint16_t */ addr)
{
	var palette = this.palette; var vramMirroring = this.vramMirroring; var pattern = this.pattern; var screenBuffer8 = this.screenBuffer8;var screenBuffer32 = this.screenBuffer32;	switch(addr & 0x07)
	{
		/* PPU Control and Status Registers */
		//case 0x00: //2000h - PPU Control Register 1 (W)
		//case 0x01: //2001h - PPU Control Register 2 (W)
		case 0x02: { //2002h - PPU Status Register (R)
			//from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			this.vramAddrRegisterWritten = false;
			this.scrollRegisterWritten = false;
			//Reading resets the 1st/2nd-write flipflop (used by Port 2005h and 2006h).
			/**
			 * @const
			 * @type {number} uint8_t
			 */
			var result =
					((this.nowOnVBnank) ? 128 : 0)
				|   ((this.sprite0Hit) ? 64 : 0)
				|   ((this.lostSprites) ? 32 : 0);
			this.nowOnVBnank = false;
			return result;
		}
		/* PPU SPR-RAM Access Registers */
		//case 0x03: //2003h - SPR-RAM Address Register (W)
		case 0x04: { //2004h - SPR-RAM Data Register (Read/Write)
			return this.spRam[this.spriteAddr];
		}
		/* PPU VRAM Access Registers */
		//case 0x05: //PPU Background Scrolling Offset (W2)
		//case 0x06: //VRAM Address Register (W2)
		case 0x07: { //VRAM Read/Write Data Register (RW)
			var vramAddrRegister = this.vramAddrRegister;
			if((vramAddrRegister & 0x3f00) !== 0x3f00){
				/**
				 * @type {number} uint8_t */
				var ret = this.vramBuffer;
				this.vramBuffer = (vramAddrRegister < 0x2000 ? pattern[(vramAddrRegister >> 9) & 0xf][vramAddrRegister & 0x1ff] : vramMirroring[(vramAddrRegister >> 10) & 0x3][vramAddrRegister & 0x3ff]);
				this.vramAddrRegister = (vramAddrRegister + this.vramIncrementSize) & 0x3fff;
				return ret;
			} else {
				/**
				 * @type {number} uint8_t */
				var ret = ((vramAddrRegister & 0x3 === 0) ? palette[32 | ((addr >> 2) & 3)] : palette[vramAddrRegister & 31]);
				this.vramBuffer = (vramAddrRegister < 0x2000 ? pattern[(vramAddrRegister >> 9) & 0xf][vramAddrRegister & 0x1ff] : vramMirroring[(vramAddrRegister >> 10) & 0x3][vramAddrRegister & 0x3ff]); //ミラーされてるVRAMにも同時にアクセスしなければならない。
				this.vramAddrRegister = (vramAddrRegister + this.vramIncrementSize) & 0x3fff;
				return ret;
			}
		}
		default: {
			return 0;
//			throw EmulatorException() << "Invalid addr: 0x" << std::hex << addr;
		}
	}
};


this.writeVramExternal = function(/* uint16_t */ addr, /* uint8_t */ value)
{
	if(addr < 0x2000) {
		//this.pattern[(addr >> 9) & 0xf][addr & 0x1ff] = value;
	} else {
		this.vramMirroring[(addr >> 10) & 0x3][addr & 0x3ff] = value;
	}
};


this.writeVram = function(/* uint16_t */ addr, /* uint8_t */ value) {
	if((addr & 0x3f00) !== 0x3f00){
		this.writeVramExternal(addr, value);
	}else{
		if((addr & 0x3) === 0){ /* writePalette */
			this.palette[32 | ((addr >> 2) & 3)] = value & 0x3f;
		}else{
			this.palette[addr & 31] = value & 0x3f;
		}
	}
};




this.__audio__onHardReset = function() {
	this.__audio__clockCnt = 0;
	this.__audio__leftClock = 0;

	this.__audio__frameIRQenabled = true;
	this.IRQ &= 254;

	this.__audio__isNTSCmode = true;
	this.__audio__frameIRQCnt = 0;
	this.__audio__frameCnt = 0;
};
this.__audio__onReset = function() {
};

this.readAudioReg = function(addr){
	if(addr === 0x4015){
	 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
		   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
		return
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
		return (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
	}else if(addr === 0x4017){
		return (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
	}else if(addr < 0x4018){
		throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
	}else{
		return this.readMapperRegisterArea(addr);
	}
};

this.writeAudioReg = function(addr, val){
		switch(addr & 0x1f) {
		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */
			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;
			this.__rectangle0__decayEnabled = (val & 16) == 0;
			this.__rectangle0__loopEnabled = (val & 32) == 32;
			switch(val >> 6)
			{
			case 0:
				this.__rectangle0__dutyRatio = 2;
				break;
			case 1:
				this.__rectangle0__dutyRatio = 4;
				break;
			case 2:
				this.__rectangle0__dutyRatio = 8;
				break;
			case 3:
				this.__rectangle0__dutyRatio = 12;
				break;
			}
			break;
		}
		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */
			this.__rectangle0__sweepShiftAmount = val & 7;
			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;
			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;
			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;
			break;
		}
		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */
			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);
			break;
		}
		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */
			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);
			this.__rectangle0__lengthCounter = this.LengthCounterConst[val >> 3];
			/* Writing to the length registers restarts the length (obviously),
			and also restarts the duty cycle (channel 1,2 only), */
			this.__rectangle0__dutyCounter = 0;
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__rectangle0__decayReloaded = true;
			break;
		}
		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */
			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;
			this.__rectangle1__decayEnabled = (val & 16) == 0;
			this.__rectangle1__loopEnabled = (val & 32) == 32;
			switch(val >> 6)
			{
			case 0:
				this.__rectangle1__dutyRatio = 2;
				break;
			case 1:
				this.__rectangle1__dutyRatio = 4;
				break;
			case 2:
				this.__rectangle1__dutyRatio = 8;
				break;
			case 3:
				this.__rectangle1__dutyRatio = 12;
				break;
			}
			break;
		}
		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */
			this.__rectangle1__sweepShiftAmount = val & 7;
			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;
			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;
			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;
			break;
		}
		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */
			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);
			break;
		}
		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */
			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);
			this.__rectangle1__lengthCounter = this.LengthCounterConst[val >> 3];
			/* Writing to the length registers restarts the length (obviously),
			and also restarts the duty cycle (channel 1,2 only), */
			this.__rectangle1__dutyCounter = 0;
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__rectangle1__decayReloaded = true;
			break;
		}
		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */
			this.__triangle__enableLinearCounter = ((val & 128) == 128);
			this.__triangle__linearCounterBuffer = val & 127;
			break;
		}
		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */
			/* unused */
			break;
		}
		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */
			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;
			break;
		}
		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */
			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);
			this.__triangle__lengthCounter = this.LengthCounterConst[val >> 3];
			/* Side effects 	Sets the halt flag */
			this.__triangle__haltFlag = true;
			break;
		}
		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */
			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;
			this.__noize__decayEnabled = (val & 16) == 0;
			this.__noize__loopEnabled = (val & 32) == 32;
			break;
		}
		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */
			/* unused */
			break;
		}
		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */
			this.__noize__modeFlag = (val & 128) == 128;
			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];
			break;
		}
		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */
			/* Writing to the length registers restarts the length (obviously), */
			this.__noize__lengthCounter = this.LengthCounterConst[val >> 3];
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__noize__decayReloaded = true;
			break;
		}
		/* ------------------------------------ DMC ----------------------------------------------------- */
		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */
			this.__digital__irqEnabled = (val & 128) == 128;
			if(!this.__digital__irqEnabled){
				 this.IRQ &= 253;
			}
			this.__digital__loopEnabled = (val & 64) == 64;
			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];
			break;
		}
		case 0x11: { /* 4011h - DMC Delta counter load register */
			this.__digital__deltaCounter = val & 0x7f;
			break;
		}
		case 0x12: { /* 4012h - DMC address load register */
			this.__digital__sampleAddr = 0xc000 | (val << 6);
			break;
		}
		case 0x13: { /* 4013h - DMC length register */
			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;
			break;
		}
		case 0x14: { /* 4014h execute Sprite DMA */
			/** @type {number} uint16_t */
			var rom = this.rom; var ram = this.ram;
			var addrMask = val << 8;
			var spRam = this.spRam;
			var spriteAddr = this.spriteAddr;
			for(var i=0;i<256;++i){
				var __addr__ = addrMask | i;
				var __val__;
				
switch((__addr__ & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__val__ = ram[__addr__ & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__val__ = this.readVideoReg(__addr__);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__addr__ === 0x4015){
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
		}else if(__addr__ === 0x4016){
			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(__addr__ === 0x4017){
			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__addr__.toString(16));
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
		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__val__ = rom[(__addr__>>10) & 31][__addr__ & 0x3ff];
		break;
	}
}

				spRam[(spriteAddr+i) & 0xff] = __val__;
			}
			clockDelta += 512;
			break;
		}
		/* ------------------------------ CTRL -------------------------------------------------- */
		case 0x15: { /* __audio__analyzeStatusRegister */
			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;
			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;
			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }
			if(!(val & 8)) this.__noize__lengthCounter = 0;
			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}
			break;
		}
		case 0x16: {
			if((val & 1) === 1){
				this.pad1Idx = 0;
				this.pad2Idx = 0;
			}
			break;
		}
		case 0x17: { /* __audio__analyzeLowFrequentryRegister */
			/* Any write to $4017 resets both the frame counter, and the clock divider. */
			if(val & 0x80) {
				this.__audio__isNTSCmode = false;
				this.__audio__frameCnt = 1786360;
				this.__audio__frameIRQCnt = 4;
			}else{
				this.__audio__isNTSCmode = true;
				this.__audio__frameIRQenabled = true;
				this.__audio__frameCnt =  1786360;
				this.__audio__frameIRQCnt = 3;
			}
			if((val & 0x40) === 0x40){
				this.__audio__frameIRQenabled = false;
				this.IRQ &= 254;
			}
			break;
		}
		default: {
			/* this.writeMapperRegisterArea(addr, val); */
			break;
		}
	}
};



this.__rectangle1__onHardReset = function() {
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
this.__rectangle1__onReset = function(){
	this.__rectangle1__onHardReset();
};


this.__rectangle0__onHardReset = function() {
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
this.__rectangle0__onReset = function(){
	this.__rectangle0__onHardReset();
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



this.__noize__onHardReset = function() {
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
this.__noize__onReset = function() {
	this.__noize__onHardReset();
};


this.__digital__isIRQEnabled = function()
{
	return this.__digital__irqEnabled;
}
this.__digital__onHardReset = function() {
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
this.__digital__onReset = function() {
	this.__digital__onHardReset();
};



this.__ioport__writeOutReg = function(val) {
};

this.__ioPort__readInputReg1 = function(){
	return 0;
};

this.__ioPort__readInputReg2 = function(){
	return 0;
};


	/**
	 * @function
	 */
	this.onHardReset = function () {
		this.onHardResetCPU();
		this.onHardResetVideo();
		this.__audio__onHardReset();
		this.__rectangle0__onHardReset();
		this.__rectangle1__onHardReset();
		this.__triangle__onHardReset();
		this.__noize__onHardReset();
		this.__digital__onHardReset();
	};
	this.onReset = function () {
		this.onResetCPU();
		this.onResetVideo();
		this.__audio__onReset();
		this.__rectangle0__onReset();
		this.__rectangle1__onReset();
		this.__triangle__onReset();
		this.__noize__onReset();
		this.__digital__onReset();
	};
	this.onVBlank = function(){
	};
	this.onIRQ = function(){
	};
	this.read = function(addr) { 
		var __val__;
		var rom = this.rom; var ram = this.ram;
		
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__val__ = ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__val__ = this.readVideoReg(addr);
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
			__val__ = (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			__val__ = (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
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
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__val__ = rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
;
		return __val__;
	};

	this.load = function(rom){
		cycloa.FastMachine.Mapper.init(this, rom);
	};
};

cycloa.FastMachine.Mapper = [
	/* mapper 0 */
	function(self){
		self.writeMapperCPU = function(/* uint8_t */ addr){
			/*do nothing!*/
		};
		var idx = 0;
		for(var i=0; i<32; ++i){
			self.rom[i] = self.prgRom.subarray(idx, idx+=1024);
			if(idx >= self.prgRom.length){
				idx = 0;
			}
		}
		var cidx = 0;
		for(var i=0;i<0x10; ++i){
			self.pattern[i] = self.chrRom.subarray(cidx, cidx += 512);
		}
	}
];

cycloa.FastMachine.Mapper.init = function(self, data) {
	// カートリッジの解釈
	cycloa.FastMachine.Mapper.load(self, data);
	// デフォルト関数のインジェクション
	cycloa.FastMachine.Mapper.initDefault(self);
	// マッパー関数のインジェクション
	cycloa.FastMachine.Mapper[self.mapperNo](self);
	
	self.changeMirrorType(self.mirrorType);
};

cycloa.FastMachine.Mapper.initDefault = function(self){
	self.vramMirroring = new Array(4);
	self.internalVram = new Array(4);
	for(var i=0;i<4;++i){
		self.internalVram[i] = new Uint8Array(0x400);
	}
	self.changeMirrorType = function(/* NesFile::MirrorType */ mirrorType) {
		this.mirrorType = mirrorType;
		switch(mirrorType)
		{
		case 3: {
			this.vramMirroring[0] = this.internalVram[0];
			this.vramMirroring[1] = this.internalVram[0];
			this.vramMirroring[2] = this.internalVram[0];
			this.vramMirroring[3] = this.internalVram[0];
			break;
		}
		case 4: {
			this.vramMirroring[0] = this.internalVram[1];
			this.vramMirroring[1] = this.internalVram[1];
			this.vramMirroring[2] = this.internalVram[1];
			this.vramMirroring[3] = this.internalVram[1];
			break;
		}
		case 0: {
			this.vramMirroring[0] = this.internalVram[1];
			this.vramMirroring[1] = this.internalVram[2];
			this.vramMirroring[2] = this.internalVram[3];
			this.vramMirroring[3] = this.internalVram[4];
			break;
		}
		case 2: {
			this.vramMirroring[0] = this.internalVram[0];
			this.vramMirroring[1] = this.internalVram[0];
			this.vramMirroring[2] = this.internalVram[1];
			this.vramMirroring[3] = this.internalVram[1];
			break;
		}
		case 1: {
			this.vramMirroring[0] = this.internalVram[0];
			this.vramMirroring[1] = this.internalVram[1];
			this.vramMirroring[2] = this.internalVram[0];
			this.vramMirroring[3] = this.internalVram[1];
			break;
		}
		default: {
			throw new cycloa.err.CoreException("Invalid mirroring type!");
		}
		}
	};
};

cycloa.FastMachine.Mapper.load = function(self, data){
	var data8 = new Uint8Array(data);
	/* check NES data8 */
	if(!(data8[0] === 0x4e && data8[1]===0x45 && data8[2]===0x53 && data8[3] == 0x1a)){
		throw new cycloa.err.CoreException("[FIXME] Invalid header!!");
	}
	self.prgSize = 16384 * data8[4];
	self.chrSize = 8192 * data8[5];
	self.prgPageCnt = data8[4];
	self.chrPageCnt = data8[5];
	self.mapperNo = ((data8[6] & 0xf0)>>4) | (data8[7] & 0xf0);
	self.trainerFlag = (data8[6] & 0x4) === 0x4;
	self.sramFlag = (data8[6] & 0x2) === 0x2;
	if((data8[6] & 0x8) == 0x8){
		self.mirrorType = 0;
	}else{
		self.mirrorType = (data8[6] & 0x1) == 0x1 ? 1 : 2;
	}
	/**
	 * @type {number} uint32_t
	 */
	var fptr = 0x10;
	if(self.trainerFlag){
		if(fptr + 512 > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
		self.trainer = new Uint8Array(data, fptr, 512);
		fptr += 512;
	}
	/* read PRG ROM */
	if(fptr + self.prgSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	self.prgRom = new Uint8Array(data, fptr, self.prgSize);
	fptr += self.prgSize;

	if(fptr + self.chrSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	//else if(fptr + self.chrSize < data.byteLength) throw cycloa.err.CoreException("[FIXME] Invalid file size; too long!");

	self.chrRom = new Uint8Array(data, fptr, self.chrSize);
};

cycloa.FastMachine.ZNFlagCache = new Uint8Array([
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

cycloa.FastMachine.TransTable = new Uint32Array([459499, 393688, 255, 255, 255, 197073, 327905, 255, 197195, 131536, 131323, 255, 255, 262612, 393444, 255, 131994, 328153, 255, 255, 255, 262610, 393442, 255, 131707, 262614, 255, 255, 255, 262613, 393445, 255, 394036, 393432, 255, 255, 196865, 196817, 328161, 255, 262763, 131280, 131579, 255, 262404, 262356, 393700, 255, 131962, 327897, 255, 255, 255, 262354, 393698, 255, 131771, 262358, 255, 255, 255, 262357, 393701, 255, 394011, 393592, 255, 255, 255, 196977, 328113, 255, 197179, 131440, 131531, 255, 197412, 262516, 393652, 255, 132010, 328057, 255, 255, 255, 262514, 393650, 255, 131739, 262518, 255, 255, 255, 262517, 393653, 255, 393995, 393416, 255, 255, 255, 196801, 328193, 255, 262747, 131264, 131611, 255, 328487, 262340, 393732, 255, 132026, 327881, 255, 255, 255, 262338, 393730, 255, 131803, 262342, 255, 255, 255, 262341, 393733, 255, 255, 393272, 255, 255, 196689, 196657, 196673, 255, 131435, 255, 131227, 255, 262228, 262196, 262212, 255, 131914, 327737, 255, 255, 262226, 262194, 262211, 255, 131259, 262198, 131243, 255, 255, 262197, 255, 255, 131104, 393224, 131088, 255, 196641, 196609, 196625, 255, 131195, 131072, 131179, 255, 262180, 262148, 262164, 255, 131930, 327689, 255, 255, 262178, 262146, 262163, 255, 131755, 262150, 131211, 255, 262181, 262149, 262166, 255, 131376, 393496, 255, 255, 196913, 196881, 328001, 255, 131499, 131344, 131419, 255, 262452, 262420, 393540, 255, 131978, 327961, 255, 255, 255, 262418, 393538, 255, 131723, 262422, 255, 255, 255, 262421, 393541, 255, 131360, 393768, 255, 255, 196897, 197153, 328065, 255, 131483, 131616, 131835, 255, 262436, 262692, 393604, 255, 131946, 328233, 255, 255, 255, 262690, 393602, 255, 131787, 262694, 255, 255, 255, 262693, 393605, 255]);

cycloa.FastMachine.LengthCounterConst = [
		0x0A,0xFE,0x14,0x02,0x28,0x04,0x50,0x06,
		0xA0,0x08,0x3C,0x0A,0x0E,0x0C,0x1A,0x0E,
		0x0C,0x10,0x18,0x12,0x30,0x14,0x60,0x16,
		0xC0,0x18,0x48,0x1A,0x10,0x1C,0x20,0x1E
];
	
