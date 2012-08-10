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
	 * カセット
	 * @type {cycloa.Board}
	 */
	this.board = board;
	this.run = function () {
		this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
		this[this.read(this.PC)]();
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
		return this.board.readCPU(addr);
	},
	/**
	 * 書き込む
	 * @function
	 * @param {Number} addr
	 * @param {Number} val
	 */
	this.write = function (addr, val) {
		this.board.writeCPU(addr, val);
	};
	this.consumeClock = function (clk) {
		this.board.consumeClock(clk);
	},
	/**
	 * @function
	 */
	this.onHardReset = function () {
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
	this.onReset = function () {
		//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
		//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
		this.consumeClock(cycloa.core.RESET_CLOCK);
		this.SP -= 0x03;
		this.P |= this.FLAG.I;
		this.write(0x4015, 0x0);
		this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));

		this.NMI = false;
		this.IRQ = false;
	};
	
		
		this[0] = function() { /* 0x0,BRK None */
		
			this.consumeClock(7);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			//NES ON FPGAには、
			//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
			//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
			//DQ4はこうしないと、動かない。
			/*
			if((this.P & 0x4) == 0x4){
				return;
			}*/
			this.PC++;
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), ((this.PC >> 8) & 0xFF));
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), (this.PC & 0xFF));
			this.P |= 0x10;
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), (this.P));
			this.P |= 0x4;
			this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));

		
		};
	
		
		this[1] = function() { /* 0x1,ORA IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[2] = function() { /* 0x2,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x2");
		
		};
	
		
		this[3] = function() { /* 0x3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x3");
		
		};
	
		
		this[4] = function() { /* 0x4,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x4");
		
		};
	
		
		this[5] = function() { /* 0x5,ORA Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[6] = function() { /* 0x6,ASL Zeropage */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
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

		
		};
	
		
		this[7] = function() { /* 0x7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x7");
		
		};
	
		
		this[8] = function() { /* 0x8,PHP None */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), this.P | 0x10);

		
		};
	
		
		this[9] = function() { /* 0x9,ORA Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[10] = function() { /* 0xa,ASL None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P = (this.P & 0xFE) | (this.A & 0xff) >> 7;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = (this.A << 1) & 0xff];

		
		};
	
		
		this[11] = function() { /* 0xb,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xb");
		
		};
	
		
		this[12] = function() { /* 0xc,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xc");
		
		};
	
		
		this[13] = function() { /* 0xd,ORA Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[14] = function() { /* 0xe,ASL Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
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

		
		};
	
		
		this[15] = function() { /* 0xf,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xf");
		
		};
	
		
		this[16] = function() { /* 0x10,BPL Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(!(this.P & 0x80)){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[17] = function() { /* 0x11,ORA IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[18] = function() { /* 0x12,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x12");
		
		};
	
		
		this[19] = function() { /* 0x13,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x13");
		
		};
	
		
		this[20] = function() { /* 0x14,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x14");
		
		};
	
		
		this[21] = function() { /* 0x15,ORA ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[22] = function() { /* 0x16,ASL ZeropageX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
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

		
		};
	
		
		this[23] = function() { /* 0x17,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x17");
		
		};
	
		
		this[24] = function() { /* 0x18,CLC None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P &= (0xfe);

		
		};
	
		
		this[25] = function() { /* 0x19,ORA AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[26] = function() { /* 0x1a,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x1a");
		
		};
	
		
		this[27] = function() { /* 0x1b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x1b");
		
		};
	
		
		this[28] = function() { /* 0x1c,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x1c");
		
		};
	
		
		this[29] = function() { /* 0x1d,ORA AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A |= this.read(addr)];
		
		};
	
		
		this[30] = function() { /* 0x1e,ASL AbsoluteX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
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

		
		};
	
		
		this[31] = function() { /* 0x1f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x1f");
		
		};
	
		
		this[32] = function() { /* 0x20,JSR Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			this.PC--;
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), ((this.PC >> 8) & 0xFF));
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), (this.PC & 0xFF));
			this.PC = addr;

		
		};
	
		
		this[33] = function() { /* 0x21,AND IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[34] = function() { /* 0x22,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x22");
		
		};
	
		
		this[35] = function() { /* 0x23,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x23");
		
		};
	
		
		this[36] = function() { /* 0x24,BIT Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			this.P = (this.P & 0x3d)
				| (val & 0xc0)
				| (this.ZNFlagCache[this.A & val] & 0x2);

		
		};
	
		
		this[37] = function() { /* 0x25,AND Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[38] = function() { /* 0x26,ROL Zeropage */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (this.P & 0x01);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[39] = function() { /* 0x27,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x27");
		
		};
	
		
		this[40] = function() { /* 0x28,PLP None */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff)));
			if((this.P & 0x4) == 0x4 && (val & 0x4) == 0){
				// FIXME: ここどうする？？
				//this.needStatusRewrite = true;
				//this.newStatus =val;
				this.P = val;
			}else{
				this.P = val;
			}

		
		};
	
		
		this[41] = function() { /* 0x29,AND Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[42] = function() { /* 0x2a,ROL None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = (this.A & 0xff) >> 7;
			this.A = (this.A << 1) | (this.P & 0x01);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A];

		
		};
	
		
		this[43] = function() { /* 0x2b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x2b");
		
		};
	
		
		this[44] = function() { /* 0x2c,BIT Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			this.P = (this.P & 0x3d)
				| (val & 0xc0)
				| (this.ZNFlagCache[this.A & val] & 0x2);

		
		};
	
		
		this[45] = function() { /* 0x2d,AND Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[46] = function() { /* 0x2e,ROL Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (this.P & 0x01);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[47] = function() { /* 0x2f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x2f");
		
		};
	
		
		this[48] = function() { /* 0x30,BMI Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(this.P & 0x80){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[49] = function() { /* 0x31,AND IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[50] = function() { /* 0x32,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x32");
		
		};
	
		
		this[51] = function() { /* 0x33,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x33");
		
		};
	
		
		this[52] = function() { /* 0x34,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x34");
		
		};
	
		
		this[53] = function() { /* 0x35,AND ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[54] = function() { /* 0x36,ROL ZeropageX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (this.P & 0x01);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[55] = function() { /* 0x37,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x37");
		
		};
	
		
		this[56] = function() { /* 0x38,SEC None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P |= 0x1;

		
		};
	
		
		this[57] = function() { /* 0x39,AND AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[58] = function() { /* 0x3a,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x3a");
		
		};
	
		
		this[59] = function() { /* 0x3b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x3b");
		
		};
	
		
		this[60] = function() { /* 0x3c,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x3c");
		
		};
	
		
		this[61] = function() { /* 0x3d,AND AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A &= this.read(addr)];
		
		};
	
		
		this[62] = function() { /* 0x3e,ROL AbsoluteX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (this.P & 0x01);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[63] = function() { /* 0x3f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x3f");
		
		};
	
		
		this[64] = function() { /* 0x40,RTI None */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff)));
			this.PC = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) | (/* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) << 8);

		
		};
	
		
		this[65] = function() { /* 0x41,EOR IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[66] = function() { /* 0x42,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x42");
		
		};
	
		
		this[67] = function() { /* 0x43,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x43");
		
		};
	
		
		this[68] = function() { /* 0x44,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x44");
		
		};
	
		
		this[69] = function() { /* 0x45,EOR Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[70] = function() { /* 0x46,LSR Zeropage */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
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

		
		};
	
		
		this[71] = function() { /* 0x47,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x47");
		
		};
	
		
		this[72] = function() { /* 0x48,PHA None */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			 /* Push */ this.write(0x0100 | (this.SP-- & 0xff), this.A);
		
		};
	
		
		this[73] = function() { /* 0x49,EOR Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[74] = function() { /* 0x4a,LSR None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P = (this.P & 0xFE) | (this.A & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A >>= 1];

		
		};
	
		
		this[75] = function() { /* 0x4b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x4b");
		
		};
	
		
		this[76] = function() { /* 0x4c,JMP Absolute */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			this.PC = addr;

		
		};
	
		
		this[77] = function() { /* 0x4d,EOR Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[78] = function() { /* 0x4e,LSR Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
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

		
		};
	
		
		this[79] = function() { /* 0x4f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x4f");
		
		};
	
		
		this[80] = function() { /* 0x50,BVC Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(!(this.P & 0x40)){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[81] = function() { /* 0x51,EOR IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[82] = function() { /* 0x52,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x52");
		
		};
	
		
		this[83] = function() { /* 0x53,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x53");
		
		};
	
		
		this[84] = function() { /* 0x54,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x54");
		
		};
	
		
		this[85] = function() { /* 0x55,EOR ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[86] = function() { /* 0x56,LSR ZeropageX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
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

		
		};
	
		
		this[87] = function() { /* 0x57,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x57");
		
		};
	
		
		this[88] = function() { /* 0x58,CLI None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			//this.needStatusRewrite = true;
			//this.newStatus = this.P & (0xfb);
			this.P &= 0xfb;

		
		};
	
		
		this[89] = function() { /* 0x59,EOR AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[90] = function() { /* 0x5a,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x5a");
		
		};
	
		
		this[91] = function() { /* 0x5b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x5b");
		
		};
	
		
		this[92] = function() { /* 0x5c,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x5c");
		
		};
	
		
		this[93] = function() { /* 0x5d,EOR AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A ^= this.read(addr)];
		
		};
	
		
		this[94] = function() { /* 0x5e,LSR AbsoluteX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
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

		
		};
	
		
		this[95] = function() { /* 0x5f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x5f");
		
		};
	
		
		this[96] = function() { /* 0x60,RTS None */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.PC = (/* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) | (/* Pop */ (this.read(0x0100 | (++this.SP & 0xff))) << 8)) + 1;

		
		};
	
		
		this[97] = function() { /* 0x61,ADC IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[98] = function() { /* 0x62,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x62");
		
		};
	
		
		this[99] = function() { /* 0x63,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x63");
		
		};
	
		
		this[100] = function() { /* 0x64,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x64");
		
		};
	
		
		this[101] = function() { /* 0x65,ADC Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[102] = function() { /* 0x66,ROR Zeropage */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((this.P & 0x01) << 7);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[103] = function() { /* 0x67,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x67");
		
		};
	
		
		this[104] = function() { /* 0x68,PLA None */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = /* Pop */ (this.read(0x0100 | (++this.SP & 0xff)))];
		
		};
	
		
		this[105] = function() { /* 0x69,ADC Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[106] = function() { /* 0x6a,ROR None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = this.A & 0x01;
			this.A = ( ((this.A >> 1) & 0x7f) | ((this.P & 0x1) << 7) );
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[ this.A ];

		
		};
	
		
		this[107] = function() { /* 0x6b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x6b");
		
		};
	
		
		this[108] = function() { /* 0x6c,JMP Indirect */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			this.PC = addr;

		
		};
	
		
		this[109] = function() { /* 0x6d,ADC Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[110] = function() { /* 0x6e,ROR Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((this.P & 0x01) << 7);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[111] = function() { /* 0x6f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x6f");
		
		};
	
		
		this[112] = function() { /* 0x70,BVS Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(this.P & 0x40){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[113] = function() { /* 0x71,ADC IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[114] = function() { /* 0x72,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x72");
		
		};
	
		
		this[115] = function() { /* 0x73,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x73");
		
		};
	
		
		this[116] = function() { /* 0x74,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x74");
		
		};
	
		
		this[117] = function() { /* 0x75,ADC ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[118] = function() { /* 0x76,ROR ZeropageX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((this.P & 0x01) << 7);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[119] = function() { /* 0x77,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x77");
		
		};
	
		
		this[120] = function() { /* 0x78,SEI None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P |= 0x4;

		
		};
	
		
		this[121] = function() { /* 0x79,ADC AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[122] = function() { /* 0x7a,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x7a");
		
		};
	
		
		this[123] = function() { /* 0x7b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x7b");
		
		};
	
		
		this[124] = function() { /* 0x7c,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x7c");
		
		};
	
		
		this[125] = function() { /* 0x7d,ADC AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A + val + (this.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((((this.A ^ val) & 0x80) ^ 0x80) & ((this.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[126] = function() { /* 0x7e,ROR AbsoluteX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((this.P & 0x01) << 7);
			this.P = (this.P & 0xFE) | carry;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[shifted];
			this.write(addr, shifted);

		
		};
	
		
		this[127] = function() { /* 0x7f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x7f");
		
		};
	
		
		this[128] = function() { /* 0x80,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x80");
		
		};
	
		
		this[129] = function() { /* 0x81,STA IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			this.write(addr, this.A);
		
		};
	
		
		this[130] = function() { /* 0x82,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x82");
		
		};
	
		
		this[131] = function() { /* 0x83,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x83");
		
		};
	
		
		this[132] = function() { /* 0x84,STY Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			this.write(addr, this.Y);
		
		};
	
		
		this[133] = function() { /* 0x85,STA Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			this.write(addr, this.A);
		
		};
	
		
		this[134] = function() { /* 0x86,STX Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			this.write(addr, this.X);
		
		};
	
		
		this[135] = function() { /* 0x87,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x87");
		
		};
	
		
		this[136] = function() { /* 0x88,DEY None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = (this.Y-1)&0xff];
		
		};
	
		
		this[137] = function() { /* 0x89,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x89");
		
		};
	
		
		this[138] = function() { /* 0x8a,TXA None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.X];
		
		};
	
		
		this[139] = function() { /* 0x8b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x8b");
		
		};
	
		
		this[140] = function() { /* 0x8c,STY Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			this.write(addr, this.Y);
		
		};
	
		
		this[141] = function() { /* 0x8d,STA Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			this.write(addr, this.A);
		
		};
	
		
		this[142] = function() { /* 0x8e,STX Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			this.write(addr, this.X);
		
		};
	
		
		this[143] = function() { /* 0x8f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x8f");
		
		};
	
		
		this[144] = function() { /* 0x90,BCC Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(!(this.P & 0x1)){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[145] = function() { /* 0x91,STA IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			this.write(addr, this.A);
		
		};
	
		
		this[146] = function() { /* 0x92,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x92");
		
		};
	
		
		this[147] = function() { /* 0x93,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x93");
		
		};
	
		
		this[148] = function() { /* 0x94,STY ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			this.write(addr, this.Y);
		
		};
	
		
		this[149] = function() { /* 0x95,STA ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			this.write(addr, this.A);
		
		};
	
		
		this[150] = function() { /* 0x96,STX ZeropageY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.Y) & 0xff);
			
			this.PC = pc + 2;


			
			this.write(addr, this.X);
		
		};
	
		
		this[151] = function() { /* 0x97,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x97");
		
		};
	
		
		this[152] = function() { /* 0x98,TYA None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.Y];
		
		};
	
		
		this[153] = function() { /* 0x99,STA AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			this.write(addr, this.A);
		
		};
	
		
		this[154] = function() { /* 0x9a,TXS None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			this.SP = this.X;
		
		};
	
		
		this[155] = function() { /* 0x9b,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x9b");
		
		};
	
		
		this[156] = function() { /* 0x9c,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x9c");
		
		};
	
		
		this[157] = function() { /* 0x9d,STA AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			this.write(addr, this.A);
		
		};
	
		
		this[158] = function() { /* 0x9e,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x9e");
		
		};
	
		
		this[159] = function() { /* 0x9f,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0x9f");
		
		};
	
		
		this[160] = function() { /* 0xa0,LDY Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.read(addr)];
		
		};
	
		
		this[161] = function() { /* 0xa1,LDA IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[162] = function() { /* 0xa2,LDX Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.read(addr)];
		
		};
	
		
		this[163] = function() { /* 0xa3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xa3");
		
		};
	
		
		this[164] = function() { /* 0xa4,LDY Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.read(addr)];
		
		};
	
		
		this[165] = function() { /* 0xa5,LDA Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[166] = function() { /* 0xa6,LDX Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.read(addr)];
		
		};
	
		
		this[167] = function() { /* 0xa7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xa7");
		
		};
	
		
		this[168] = function() { /* 0xa8,TAY None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.A];
		
		};
	
		
		this[169] = function() { /* 0xa9,LDA Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[170] = function() { /* 0xaa,TAX None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.A];
		
		};
	
		
		this[171] = function() { /* 0xab,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xab");
		
		};
	
		
		this[172] = function() { /* 0xac,LDY Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.read(addr)];
		
		};
	
		
		this[173] = function() { /* 0xad,LDA Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[174] = function() { /* 0xae,LDX Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.read(addr)];
		
		};
	
		
		this[175] = function() { /* 0xaf,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xaf");
		
		};
	
		
		this[176] = function() { /* 0xb0,BCS Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(this.P & 0x1){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[177] = function() { /* 0xb1,LDA IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[178] = function() { /* 0xb2,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xb2");
		
		};
	
		
		this[179] = function() { /* 0xb3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xb3");
		
		};
	
		
		this[180] = function() { /* 0xb4,LDY ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.read(addr)];
		
		};
	
		
		this[181] = function() { /* 0xb5,LDA ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[182] = function() { /* 0xb6,LDX ZeropageY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.Y) & 0xff);
			
			this.PC = pc + 2;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.read(addr)];
		
		};
	
		
		this[183] = function() { /* 0xb7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xb7");
		
		};
	
		
		this[184] = function() { /* 0xb8,CLV None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P &= (0xbf);

		
		};
	
		
		this[185] = function() { /* 0xb9,LDA AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[186] = function() { /* 0xba,TSX None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.SP];
		
		};
	
		
		this[187] = function() { /* 0xbb,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xbb");
		
		};
	
		
		this[188] = function() { /* 0xbc,LDY AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = this.read(addr)];
		
		};
	
		
		this[189] = function() { /* 0xbd,LDA AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = this.read(addr)];
		
		};
	
		
		this[190] = function() { /* 0xbe,LDX AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = this.read(addr)];
		
		};
	
		
		this[191] = function() { /* 0xbf,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xbf");
		
		};
	
		
		this[192] = function() { /* 0xc0,CPY Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.Y - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[193] = function() { /* 0xc1,CMP IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[194] = function() { /* 0xc2,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xc2");
		
		};
	
		
		this[195] = function() { /* 0xc3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xc3");
		
		};
	
		
		this[196] = function() { /* 0xc4,CPY Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.Y - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[197] = function() { /* 0xc5,CMP Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[198] = function() { /* 0xc6,DEC Zeropage */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[199] = function() { /* 0xc7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xc7");
		
		};
	
		
		this[200] = function() { /* 0xc8,INY None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.Y = (this.Y+1)&0xff];
		
		};
	
		
		this[201] = function() { /* 0xc9,CMP Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[202] = function() { /* 0xca,DEX None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = (this.X-1)&0xff];
		
		};
	
		
		this[203] = function() { /* 0xcb,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xcb");
		
		};
	
		
		this[204] = function() { /* 0xcc,CPY Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.Y - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[205] = function() { /* 0xcd,CMP Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[206] = function() { /* 0xce,DEC Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[207] = function() { /* 0xcf,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xcf");
		
		};
	
		
		this[208] = function() { /* 0xd0,BNE Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(!(this.P & 0x2)){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[209] = function() { /* 0xd1,CMP IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[210] = function() { /* 0xd2,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xd2");
		
		};
	
		
		this[211] = function() { /* 0xd3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xd3");
		
		};
	
		
		this[212] = function() { /* 0xd4,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xd4");
		
		};
	
		
		this[213] = function() { /* 0xd5,CMP ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[214] = function() { /* 0xd6,DEC ZeropageX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[215] = function() { /* 0xd7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xd7");
		
		};
	
		
		this[216] = function() { /* 0xd8,CLD None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P &= (0xf7);

		
		};
	
		
		this[217] = function() { /* 0xd9,CMP AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[218] = function() { /* 0xda,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xda");
		
		};
	
		
		this[219] = function() { /* 0xdb,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xdb");
		
		};
	
		
		this[220] = function() { /* 0xdc,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xdc");
		
		};
	
		
		this[221] = function() { /* 0xdd,CMP AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.A - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[222] = function() { /* 0xde,DEC AbsoluteX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[223] = function() { /* 0xdf,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xdf");
		
		};
	
		
		this[224] = function() { /* 0xe0,CPX Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.X - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[225] = function() { /* 0xe1,SBC IndirectX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[226] = function() { /* 0xe2,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xe2");
		
		};
	
		
		this[227] = function() { /* 0xe3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xe3");
		
		};
	
		
		this[228] = function() { /* 0xe4,CPX Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.X - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[229] = function() { /* 0xe5,SBC Zeropage */
		
			this.consumeClock(3);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[230] = function() { /* 0xe6,INC Zeropage */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1));
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[231] = function() { /* 0xe7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xe7");
		
		};
	
		
		this[232] = function() { /* 0xe8,INX None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.X = (this.X+1)&0xff];
		
		};
	
		
		this[233] = function() { /* 0xe9,SBC Immediate */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[234] = function() { /* 0xea,NOP None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
		
		};
	
		
		this[235] = function() { /* 0xeb,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xeb");
		
		};
	
		
		this[236] = function() { /* 0xec,CPX Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.X - this.read(addr)) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);

		
		};
	
		
		this[237] = function() { /* 0xed,SBC Absolute */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[238] = function() { /* 0xee,INC Absolute */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (this.read(pc+1) | (this.read(pc+2) << 8));
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[239] = function() { /* 0xef,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xef");
		
		};
	
		
		this[240] = function() { /* 0xf0,BEQ Relative */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			if(this.P & 0x2){
				this.consumeClock( (((this.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				this.PC = addr;
			}

		
		};
	
		
		this[241] = function() { /* 0xf1,SBC IndirectY */
		
			this.consumeClock(5);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[242] = function() { /* 0xf2,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xf2");
		
		};
	
		
		this[243] = function() { /* 0xf3,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xf3");
		
		};
	
		
		this[244] = function() { /* 0xf4,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xf4");
		
		};
	
		
		this[245] = function() { /* 0xf5,SBC ZeropageX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[246] = function() { /* 0xf6,INC ZeropageX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((this.read(pc+1) + this.X) & 0xff);
			
			this.PC = pc + 2;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[247] = function() { /* 0xf7,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xf7");
		
		};
	
		
		this[248] = function() { /* 0xf8,SED None */
		
			this.consumeClock(2);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
			
			this.PC = pc + 1;


			
			
			this.P |= 0x8;

		
		};
	
		
		this[249] = function() { /* 0xf9,SBC AbsoluteY */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[250] = function() { /* 0xfa,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xfa");
		
		};
	
		
		this[251] = function() { /* 0xfb,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xfb");
		
		};
	
		
		this[252] = function() { /* 0xfc,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xfc");
		
		};
	
		
		this[253] = function() { /* 0xfd,SBC AbsoluteX */
		
			this.consumeClock(4);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = this.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (this.A - val - ((this.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			this.P = (this.P & 0xbe)
				| ((this.A ^ val) & (this.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[this.A = newA];

		
		};
	
		
		this[254] = function() { /* 0xfe,INC AbsoluteX */
		
			this.consumeClock(6);
			
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = this.PC;

			
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
			if(((addr ^ addr_base) & 0x0100) != 0) this.consumeClock(1);
			
			this.PC = pc + 3;


			
			
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (this.read(addr)+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | this.ZNFlagCache[val];
			this.write(addr, val);

		
		};
	
		
		this[255] = function() { /* 0xff,UNDEFINED NONE */
		
			throw new cycloa.err.CoreException("Invalid opcode: 0xff");
		
		};
	
	this.ZNFlagCache = cycloa.FastMachine.ZNFlagCache;
	this.RESET_CLOCK = 6;
	this.MAX_INST_LENGTH = 3;
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
	