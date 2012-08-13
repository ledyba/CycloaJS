
/**
 * @constructor
 */
cycloa.FastMachine = function(board){

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

this.ZNFlagCache = cycloa.FastMachine.ZNFlagCache;
this.TransTable = cycloa.FastMachine.TransTable;
this.RESET_CLOCK = 6;
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
this.screenBuffer = new ArrayBuffer(240 * 240);
this.screenBuffer8 = new Uint8Array(this.screenBuffer);
this.screenBuffer32 = new Uint32Array(this.screenBuffer);
this.internalVram = new Uint8Array(0x800);
this.spRam = new Uint8Array(256);
this.palette = new Uint8Array(32);
this.spriteTable = new Array(8);
for(var i=0; i< 8; ++i){
	this.spriteTable[i] = new Object;
}
	
	/* Video init */
	
	/**
	 * カセット
	 * @type {cycloa.Board}
	 */
	this.board = board;

	this.run = function () {

this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
/**
 * @const
 * @type {Number}
 */
var inst = this.TransTable[this.read(this.PC)];

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;
			var clockDelta = 0;
// http://www.llx.com/~nparker/a2/opcodes.html
switch( inst & 15 ){
		case 0: { /* Immediate */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;

		break;
	}
		case 1: { /* Zeropage */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;

		break;
	}
		case 2: { /* ZeropageX */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;

		break;
	}
		case 3: { /* ZeropageY */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.Y) & 0xff);
			
			this.PC = pc + 2;

		break;
	}
		case 4: { /* Absolute */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;

		break;
	}
		case 5: { /* AbsoluteX */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = this.read(pc+1) | (this.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + this.X;
			if(((addr ^ addr_base) & 0x0100) !== 0) clockDelta += (1);
			
			this.PC = pc + 3;

		break;
	}
		case 6: { /* AbsoluteY */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = this.read(pc+1) | (this.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + this.Y;
			if(((addr ^ addr_base) & 0x0100) !== 0) clockDelta += (1);
			
			this.PC = pc + 3;

		break;
	}
		case 7: { /* Indirect */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = this.read(pc+1) | (this.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = this.read(addr_base) | (this.read((addr_base & 0xff00) | ((addr_base+1) & 0x00ff)) << 8); //bug of NES
			
			this.PC = pc + 3;

		break;
	}
		case 8: { /* IndirectX */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (this.read(pc+1) + this.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = this.read(addr_base) | (this.read((addr_base+1)&0xff) << 8);
			
			this.PC = pc + 2;

		break;
	}
		case 9: { /* IndirectY */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = this.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( this.read(addr_base) | (this.read((addr_base+1)&0xff) << 8) ) + this.Y;
			
			this.PC = pc + 2;

		break;
	}
		case 10: { /* Relative */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = this.read(pc+1);
			/**
			 * @const
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
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];		break;}
		case 1: {  /* LDX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.read(addr)];		break;}
		case 2: {  /* LDY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.read(addr)];		break;}
		case 3: {  /* STA */
			this.write(addr, this.A);		break;}
		case 4: {  /* STX */
			this.write(addr, this.X);		break;}
		case 5: {  /* STY */
			this.write(addr, this.Y);		break;}
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
			 * @const
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (a + val + (p & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (p & 0xbe)
				| ((((a ^ val) & 0x80) ^ 0x80) & ((a ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];
		break;}
		case 13: {  /* AND */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];		break;}
		case 14: {  /* ASL */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			this.P = (this.P & 0xFE) | val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val << 1;
			this.write(addr, shifted);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted & 0xff];
		break;}
		case 15: {  /* ASL_ */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var a = this.A;
			this.P = (this.P & 0xFE) | (a & 0xff) >> 7;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = (a << 1) & 0xff];
		break;}
		case 16: {  /* BIT */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			this.P = (this.P & 0x3d)
				| (val & 0xc0)
				| (this.ZNFlagCache[this.A & val] & 0x2);
		break;}
		case 17: {  /* CMP */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 18: {  /* CPX */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.X - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 19: {  /* CPY */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.Y - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 20: {  /* DEC */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);
		break;}
		case 21: {  /* DEX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = (this.X-1)&0xff];		break;}
		case 22: {  /* DEY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = (this.Y-1)&0xff];		break;}
		case 23: {  /* EOR */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];		break;}
		case 24: {  /* INC */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);
		break;}
		case 25: {  /* INX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = (this.X+1)&0xff];		break;}
		case 26: {  /* INY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = (this.Y+1)&0xff];		break;}
		case 27: {  /* LSR */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			this.P = (this.P & 0xFE) | (val & 0x01);
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val >> 1;
			this.write(addr, shifted);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
		break;}
		case 28: {  /* LSR_ */
			
			this.P = (this.P & 0xFE) | (this.A & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A >>= 1];
		break;}
		case 29: {  /* ORA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];		break;}
		case 30: {  /* ROL */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (p & 0x01);
			this.P = (p & 0xFE) | (val >> 7);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);
		break;}
		case 31: {  /* ROL_ */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @const
			 * @type {Number}
			 */
			var p = this.P;
			this.P = (p & 0xFE) | ((a & 0xff) >> 7);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = (a << 1) | (p & 0x01)];
		break;}
		case 32: {  /* ROR */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((p & 0x01) << 7);
			this.P = (p & 0xFE) | (val & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);
		break;}
		case 33: {  /* ROR_ */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @const
			 * @type {Number}
			 */
			this.P = (p & 0xFE) | (a & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = ((a >> 1) & 0x7f) | ((p & 0x1) << 7)];
		break;}
		case 34: {  /* SBC */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var p = this.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var a = this.A;
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (a - val - ((p & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (p & 0xbe)
				| ((a ^ val) & (a ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];
		break;}
		case 35: {  /* PHA */
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), this.A);		break;}
		case 36: {  /* PHP */
			
			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), this.P | 0x10);
		break;}
		case 37: {  /* PLA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff)))];		break;}
		case 38: {  /* PLP */
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff)));
			if((this.P & 0x4) && !(val & 0x4)){
				// FIXME: ここどうする？？
				//this.needStatusRewrite = true;
				//this.newStatus =val;
				this.P = val;
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
			//this.needStatusRewrite = true;
			//this.newStatus = this.P & (0xfb);
			this.P &= 0xfb;
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
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), ((this.PC >> 8) & 0xFF));
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), (this.PC & 0xFF));
			this.P |= 0x10;
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), (this.P));
			this.P |= 0x4;
			this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));
		break;}
		case 47: {  /* NOP */
					break;}
		case 48: {  /* RTS */
			
			this.PC = (/* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) | (/* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) << 8)) + 1;
		break;}
		case 49: {  /* RTI */
			
			this.P = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff)));
			this.PC = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) | (/* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) << 8);
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
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), ((stored_pc >> 8) & 0xFF));
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), (stored_pc & 0xFF));
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



this.nowX += clockDelta;
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
		var _color = 0 | palette[32];
		var _color32 = _color << 24 | _color << 16 | _color << 8 | _color;
		for(var i=((nowY-1) << 4), max=i+64; i<max; ++i) screenBuffer32[i] = _color32;
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
		this.videoFairy.dispatchRendering(screenBuffer, this.paletteMask);
		this.nowOnVBnank = true;
		this.spriteAddr = 0;//and typically contains 00h at the begin of the VBlank periods
	}else if(nowY === 242){
		// NESDEV: These occur during VBlank. The VBlank flag of the PPU is pulled low during scanline 241, so the VBlank NMI occurs here.
		// EVERYNES: http://nocash.emubase.de/everynes.htm#ppudimensionstimings
		// とあるものの…BeNesの実装だともっと後に発生すると記述されてる。詳しくは以下。
		// なお、$2002のレジスタがHIGHになった後にVBLANKを起こさないと「ソロモンの鍵」にてゲームが始まらない。
		// (NMI割り込みがレジスタを読み込みフラグをリセットしてしまう上、NMI割り込みが非常に長く、クリアしなくてもすでにVBLANKが終わった後に返ってくる)
		//nowOnVBlankフラグの立ち上がり後、数クロックでNMIが発生。
		if(this.executeNMIonVBlank){
			this.reserveNMI();
		}
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


return clockDelta;
	};



this.reserveNMI = function () {
	this.NMI = true;
};
this.reserveIRQ = function () {
	this.IRQ = true;
};
this.releaseNMI = function () {
	this.NMI = false;
};
this.releaseIRQ = function () {
	this.IRQ = false;
},
/**
 * データからアドレスを読み込む
 * @function
 * @param {Number} addr
 * @return {Number} data
 */
this.read = function (addr) {
	switch((addr & 0xE000) >> 14){
		case 0:{
			return this.ram[addr & 0x7ff];
			break;
		}
		case 1:{
			return 0;
			break;
		}
		case 2:{
			return this.board.rom[addr & 0x3fff];
			break;
		}
		case 3:{
			return this.board.rom[addr & 0x3fff];
			break;
		}
	}
	return this.board.readCPU(addr);
},
/**
 * 書き込む
 * @function
 * @param {Number} addr
 * @param {Number} val
 */
this.write = function (addr, val) {
	switch((addr & 0xE000) >> 14){
		case 0:{
			this.ram[addr & 0x1fff] = val;
			break;
		}
		case 1:{
			break;
		}
		case 2:{
			break;
		}
		case 3:{
			break;
		}
	}
};

this.onHardResetCPU = function(){
		//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
		this.P = 0x24;
		this.A = 0x0;
		this.X = 0x0;
		this.Y = 0x0;
		this.SP = 0xfd;
		this.write(0x4017, 0x00);
		this.write(0x4015, 0x00);
		this.PC = (this.read(0xFFFC) | (this.read(0xFFFD) << 8));

		this.NMI = false;
		this.IRQ = false;
};

this.onResetCPU = function () {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.consumeClock(cycloa.core.RESET_CLOCK);
	this.SP -= 0x03;
	this.P |= this.Flag.I;
	this.write(0x4015, 0x0);
	this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));

	this.NMI = false;
	this.IRQ = false;
};
	




this.onHardResetVideo = function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	for(var i=0;i< 2048;++i) {
		this.internalVram[i] = 0;
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
	if(!this.backgroundVisibility){
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
				this.screenBuffer8[buffOffset+renderX] = this.palette[paletteOffset+color] | 128;
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
		var layerMask = slot.isForeground ? 192 : 64;
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
				var isEmpty = (target & LayerBitMask) === 0;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isBackgroundDrawn = (target & LayerBitMask) === 128;
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
			var isEmpty = (target & LayerBitMask) === 0;
			/**
			 * @type {boolean} bool
			 * @const
			 */
			var isBackgroundDrawn = (target & LayerBitMask) === 128;
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

	
	this.consumeClock = function (clk) {
		this.board.consumeClock(clk);
	},
	/**
	 * @function
	 */
	this.onHardReset = function () {
		this.onHardResetCPU();
		this.onHardResetVideo();
	};
	this.onReset = function () {
		this.onResetCPU();
		this.onResetVideo();
	};
	this.onVBlank = function(){
	}
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
	
