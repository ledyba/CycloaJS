"use strict";
var cycloa;
if(!cycloa) cycloa = new Object;
/**
 * エミュレータ本体の名前空間
 * @type {Object}
 * @namespace
 * @const
 */
cycloa.core = new Object;

/**
 * プロセッサの身体部分を表すクラスです。
 * @class
 * @constructor
 * @const
 */
cycloa.core.Processor = function() {
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
	 *実際の命令の実行の移譲先
	 * @type {cycloa.core.Spirit}
	 */
	this.spirit = undefined;
	/**
	 *実際のIO処理の移譲先
	 * @type {cycloa.Board}
	 */
	this.board = undefined;
};

/**
 * @const
 * @type {Object}
 */
cycloa.core.Processor.prototype = {
	reserveNMI: function(){
		if(cycloa.debug) {
			assertFalse(this.NMI);
		}
		this.NMI = true;
	},
	reserveIRQ: function() {
		if(cycloa.debug) {
			assertFalse(this.IRQ);
		}
		this.IRQ = true;
	},
	releaseNMI: function() {
		if(cycloa.debug) {
			assertTrue(this.NMI);
		}
		this.NMI = false;
	},
	releaseIRQ: function(){
		if(cycloa.debug) {
			assertTrue(this.IRQ);
		}
		this.IRQ = false;
	},
	/**
	 * CPUの命令を実際に実行するスピリットを接続する
	 * @function
	 * @param {cycloa.core.Spirit} spirit
	 */
	attachSpirit: function(spirit){
		this.spirit = spirit;
		this.spirit.connectProcessor(this);
	},
	/**
	 * このプロセッサを実装する基盤オブジェクトをセットする
	 * @function
	 * @param {cycloa.core.Board} board
	 */
	connectBoard: function(board) {
		this.board = board;
	},
	/**
	 * CPUの命令を実行する
	 * @function
	 */
	run: function(){
		this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
		this.spirit.run();
	},
	/**
	 * データからアドレスを読み込む
	 * @function
	 * @param {Number} addr
	 * @return {Number} data
	 */
	read: function(addr){
		return this.board.readCPU(addr);
	},
	/**
	 * 書き込む
	 * @function
	 * @param {Number} addr
	 * @param {Number} val
	 */
	write: function(addr, val) {
		this.board.writeCPU(addr, val);
	},
	consumeClock: function(clk){
		this.board.consumeClock(clk);
	},
	/**
	 * @function
	 */
	onHardReset: function () {
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
	},
	onReset: function() {
		//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
		//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
		this.consumeClock(cycloa.core.RESET_CLOCK);
		this.SP -= 0x03;
		this.P |= this.FLAG.I;
		this.write(0x4015, 0x0);
		this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));

		this.NMI = false;
		this.IRQ = false;
	}
};

/**
 * プロセッサの動作方式を抽象化するクラス。
 * 上のProcessorにアタッチして下さい。
 * @class
 * @const
 * @constructor
 */
cycloa.core.Spirit = function () {
	/**
	 * @type {cycloa.core.Processor}
	 * @protected
	 */
	this.pr = undefined;
};

cycloa.core.Spirit.prototype = {
	/**
	 * Processorと接続する
	 * @param {cycloa.core.Processor} p
	 * @final
	 */
	connectProcessor: function(p){
		this.pr = p;
	},
	/**
	 * 命令を実行する。実装してください。
	 */
	run: function(){
		throw cycloa.err.CoreException("Please implement");
	}
};

cycloa.core.PrecompileSpirit = function(pr){
	cycloa.core.Spirit.call(this);
	this.run = function(){
		var i=5000;
		while(i-- > 0){
			this[pr.read(pr.PC++)]();
		}
		return undefined;
	};
var ZNFlagCache = cycloa.core.ZNFlagCache;
this[0x0] = function() { /* 0x0, BRK None */
pr.consumeClock(7);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			//NES ON FPGAには、
			//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
			//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
			//DQ4はこうしないと、動かない。
			/*
			if((pr.P & 0x4) == 0x4){
				return;
			}*/
			pr.PC++;
			 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), ((pr.PC >> 8) & 0xFF));
			 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), (pr.PC & 0xFF));
			pr.P |= 0x10;
			 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), (pr.P));
			pr.P |= 0x4;
			pr.PC = (pr.read(0xFFFE) | (pr.read(0xFFFF) << 8));
};
this[0x1] = function() { /* 0x1, ORA IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0x2] = function() { /* 0x2, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x2");
};
this[0x3] = function() { /* 0x3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x3");
};
this[0x4] = function() { /* 0x4, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x4");
};
this[0x5] = function() { /* 0x5, ORA Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0x6] = function() { /* 0x6, ASL Zeropage */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val << 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted & 0xff];
};
this[0x7] = function() { /* 0x7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x7");
};
this[0x8] = function() { /* 0x8, PHP None */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), pr.P | 0x10);
};
this[0x9] = function() { /* 0x9, ORA Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0xa] = function() { /* 0xa, ASL None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P = (pr.P & 0xFE) | (pr.A & 0xff) >> 7;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = (pr.A << 1) & 0xff];
};
this[0xb] = function() { /* 0xb, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xb");
};
this[0xc] = function() { /* 0xc, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xc");
};
this[0xd] = function() { /* 0xd, ORA Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0xe] = function() { /* 0xe, ASL Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val << 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted & 0xff];
};
this[0xf] = function() { /* 0xf, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xf");
};
this[0x10] = function() { /* 0x10, BPL Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(!(pr.P & 0x80)){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0x11] = function() { /* 0x11, ORA IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0x12] = function() { /* 0x12, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x12");
};
this[0x13] = function() { /* 0x13, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x13");
};
this[0x14] = function() { /* 0x14, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x14");
};
this[0x15] = function() { /* 0x15, ORA ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0x16] = function() { /* 0x16, ASL ZeropageX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val << 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted & 0xff];
};
this[0x17] = function() { /* 0x17, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x17");
};
this[0x18] = function() { /* 0x18, CLC None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P &= (0xfe);
};
this[0x19] = function() { /* 0x19, ORA AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0x1a] = function() { /* 0x1a, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x1a");
};
this[0x1b] = function() { /* 0x1b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x1b");
};
this[0x1c] = function() { /* 0x1c, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x1c");
};
this[0x1d] = function() { /* 0x1d, ORA AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A |= pr.read(addr)];
};
this[0x1e] = function() { /* 0x1e, ASL AbsoluteX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val << 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted & 0xff];
};
this[0x1f] = function() { /* 0x1f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x1f");
};
this[0x20] = function() { /* 0x20, JSR Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			pr.PC--;
			 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), ((pr.PC >> 8) & 0xFF));
			 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), (pr.PC & 0xFF));
			pr.PC = addr;
};
this[0x21] = function() { /* 0x21, AND IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x22] = function() { /* 0x22, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x22");
};
this[0x23] = function() { /* 0x23, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x23");
};
this[0x24] = function() { /* 0x24, BIT Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0x3d)
				| (val & 0xc0)
				| (ZNFlagCache[pr.A & val] & 0x2);
};
this[0x25] = function() { /* 0x25, AND Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x26] = function() { /* 0x26, ROL Zeropage */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (pr.P & 0x01);
			pr.P = (pr.P & 0xFE) | carry;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x27] = function() { /* 0x27, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x27");
};
this[0x28] = function() { /* 0x28, PLP None */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = /* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff)));
			if((pr.P & 0x4) == 0x4 && (val & 0x4) == 0){
				// FIXME: ここどうする？？
				//pr.needStatusRewrite = true;
				//pr.newStatus =val;
				pr.P = val;
			}else{
				pr.P = val;
			}
};
this[0x29] = function() { /* 0x29, AND Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x2a] = function() { /* 0x2a, ROL None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			/**
			 * @const
			 * @type {Number}
			 */
			var carry = (pr.A & 0xff) >> 7;
			pr.A = (pr.A << 1) | (pr.P & 0x01);
			pr.P = (pr.P & 0xFE) | carry;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A];
};
this[0x2b] = function() { /* 0x2b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x2b");
};
this[0x2c] = function() { /* 0x2c, BIT Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0x3d)
				| (val & 0xc0)
				| (ZNFlagCache[pr.A & val] & 0x2);
};
this[0x2d] = function() { /* 0x2d, AND Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x2e] = function() { /* 0x2e, ROL Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (pr.P & 0x01);
			pr.P = (pr.P & 0xFE) | carry;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x2f] = function() { /* 0x2f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x2f");
};
this[0x30] = function() { /* 0x30, BMI Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(pr.P & 0x80){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0x31] = function() { /* 0x31, AND IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x32] = function() { /* 0x32, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x32");
};
this[0x33] = function() { /* 0x33, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x33");
};
this[0x34] = function() { /* 0x34, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x34");
};
this[0x35] = function() { /* 0x35, AND ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x36] = function() { /* 0x36, ROL ZeropageX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (pr.P & 0x01);
			pr.P = (pr.P & 0xFE) | carry;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x37] = function() { /* 0x37, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x37");
};
this[0x38] = function() { /* 0x38, SEC None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P |= 0x1;
};
this[0x39] = function() { /* 0x39, AND AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x3a] = function() { /* 0x3a, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x3a");
};
this[0x3b] = function() { /* 0x3b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x3b");
};
this[0x3c] = function() { /* 0x3c, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x3c");
};
this[0x3d] = function() { /* 0x3d, AND AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A &= pr.read(addr)];
};
this[0x3e] = function() { /* 0x3e, ROL AbsoluteX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (pr.P & 0x01);
			pr.P = (pr.P & 0xFE) | carry;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x3f] = function() { /* 0x3f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x3f");
};
this[0x40] = function() { /* 0x40, RTI None */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P = /* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff)));
			pr.PC = /* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff))) | (/* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff))) << 8);
};
this[0x41] = function() { /* 0x41, EOR IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x42] = function() { /* 0x42, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x42");
};
this[0x43] = function() { /* 0x43, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x43");
};
this[0x44] = function() { /* 0x44, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x44");
};
this[0x45] = function() { /* 0x45, EOR Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x46] = function() { /* 0x46, LSR Zeropage */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | (val & 0x01);
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val >> 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
};
this[0x47] = function() { /* 0x47, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x47");
};
this[0x48] = function() { /* 0x48, PHA None */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

 /* Push */ pr.write(0x0100 | (pr.SP-- & 0xff), pr.A);
};
this[0x49] = function() { /* 0x49, EOR Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x4a] = function() { /* 0x4a, LSR None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P = (pr.P & 0xFE) | (pr.A & 0x01);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A >>= 1];
};
this[0x4b] = function() { /* 0x4b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x4b");
};
this[0x4c] = function() { /* 0x4c, JMP Absolute */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			pr.PC = addr;
};
this[0x4d] = function() { /* 0x4d, EOR Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x4e] = function() { /* 0x4e, LSR Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | (val & 0x01);
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val >> 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
};
this[0x4f] = function() { /* 0x4f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x4f");
};
this[0x50] = function() { /* 0x50, BVC Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(!(pr.P & 0x40)){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0x51] = function() { /* 0x51, EOR IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x52] = function() { /* 0x52, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x52");
};
this[0x53] = function() { /* 0x53, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x53");
};
this[0x54] = function() { /* 0x54, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x54");
};
this[0x55] = function() { /* 0x55, EOR ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x56] = function() { /* 0x56, LSR ZeropageX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | (val & 0x01);
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val >> 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
};
this[0x57] = function() { /* 0x57, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x57");
};
this[0x58] = function() { /* 0x58, CLI None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			//pr.needStatusRewrite = true;
			//pr.newStatus = pr.P & (0xfb);
			pr.P &= 0xfb;
};
this[0x59] = function() { /* 0x59, EOR AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x5a] = function() { /* 0x5a, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x5a");
};
this[0x5b] = function() { /* 0x5b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x5b");
};
this[0x5c] = function() { /* 0x5c, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x5c");
};
this[0x5d] = function() { /* 0x5d, EOR AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A ^= pr.read(addr)];
};
this[0x5e] = function() { /* 0x5e, LSR AbsoluteX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			pr.P = (pr.P & 0xFE) | (val & 0x01);
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val >> 1;
			pr.write(addr, shifted);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
};
this[0x5f] = function() { /* 0x5f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x5f");
};
this[0x60] = function() { /* 0x60, RTS None */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.PC = (/* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff))) | (/* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff))) << 8)) + 1;
};
this[0x61] = function() { /* 0x61, ADC IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x62] = function() { /* 0x62, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x62");
};
this[0x63] = function() { /* 0x63, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x63");
};
this[0x64] = function() { /* 0x64, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x64");
};
this[0x65] = function() { /* 0x65, ADC Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x66] = function() { /* 0x66, ROR Zeropage */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			pr.P = (pr.P & 0xFE) | carry;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((pr.P & 0x01) << 7);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x67] = function() { /* 0x67, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x67");
};
this[0x68] = function() { /* 0x68, PLA None */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = /* Pop */ (pr.read(0x0100 | (++pr.SP & 0xff)))];
};
this[0x69] = function() { /* 0x69, ADC Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x6a] = function() { /* 0x6a, ROR None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			/**
			 * @const
			 * @type {Number}
			 */
			var carry = pr.A & 0x01;
			pr.A = ( ((pr.A >> 1) & 0x7f) | ((pr.P & 0x1) << 7) );
			pr.P = (pr.P & 0xFE) | carry;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[ pr.A ];
};
this[0x6b] = function() { /* 0x6b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x6b");
};
this[0x6c] = function() { /* 0x6c, JMP Indirect */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base & 0xff00) | ((addr_base+1) & 0x00ff)) << 8); //bug of NES
			
			pr.PC = pc + 3;


			pr.PC = addr;
};
this[0x6d] = function() { /* 0x6d, ADC Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x6e] = function() { /* 0x6e, ROR Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			pr.P = (pr.P & 0xFE) | carry;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((pr.P & 0x01) << 7);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x6f] = function() { /* 0x6f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x6f");
};
this[0x70] = function() { /* 0x70, BVS Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(pr.P & 0x40){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0x71] = function() { /* 0x71, ADC IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x72] = function() { /* 0x72, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x72");
};
this[0x73] = function() { /* 0x73, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x73");
};
this[0x74] = function() { /* 0x74, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x74");
};
this[0x75] = function() { /* 0x75, ADC ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x76] = function() { /* 0x76, ROR ZeropageX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			pr.P = (pr.P & 0xFE) | carry;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((pr.P & 0x01) << 7);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x77] = function() { /* 0x77, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x77");
};
this[0x78] = function() { /* 0x78, SEI None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P |= 0x4;
};
this[0x79] = function() { /* 0x79, ADC AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x7a] = function() { /* 0x7a, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x7a");
};
this[0x7b] = function() { /* 0x7b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x7b");
};
this[0x7c] = function() { /* 0x7c, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x7c");
};
this[0x7d] = function() { /* 0x7d, ADC AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A + val + (pr.P & 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((((pr.A ^ val) & 0x80) ^ 0x80) & ((pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0x7e] = function() { /* 0x7e, ROR AbsoluteX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var carry = val & 0x01;
			pr.P = (pr.P & 0xFE) | carry;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((pr.P & 0x01) << 7);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[shifted];
			pr.write(addr, shifted);
};
this[0x7f] = function() { /* 0x7f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x7f");
};
this[0x80] = function() { /* 0x80, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x80");
};
this[0x81] = function() { /* 0x81, STA IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;

pr.write(addr, pr.A);
};
this[0x82] = function() { /* 0x82, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x82");
};
this[0x83] = function() { /* 0x83, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x83");
};
this[0x84] = function() { /* 0x84, STY Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

pr.write(addr, pr.Y);
};
this[0x85] = function() { /* 0x85, STA Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

pr.write(addr, pr.A);
};
this[0x86] = function() { /* 0x86, STX Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

pr.write(addr, pr.X);
};
this[0x87] = function() { /* 0x87, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x87");
};
this[0x88] = function() { /* 0x88, DEY None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = (pr.Y-1)&0xff];
};
this[0x89] = function() { /* 0x89, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x89");
};
this[0x8a] = function() { /* 0x8a, TXA None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.X];
};
this[0x8b] = function() { /* 0x8b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x8b");
};
this[0x8c] = function() { /* 0x8c, STY Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

pr.write(addr, pr.Y);
};
this[0x8d] = function() { /* 0x8d, STA Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

pr.write(addr, pr.A);
};
this[0x8e] = function() { /* 0x8e, STX Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

pr.write(addr, pr.X);
};
this[0x8f] = function() { /* 0x8f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x8f");
};
this[0x90] = function() { /* 0x90, BCC Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(!(pr.P & 0x1)){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0x91] = function() { /* 0x91, STA IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;

pr.write(addr, pr.A);
};
this[0x92] = function() { /* 0x92, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x92");
};
this[0x93] = function() { /* 0x93, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x93");
};
this[0x94] = function() { /* 0x94, STY ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

pr.write(addr, pr.Y);
};
this[0x95] = function() { /* 0x95, STA ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

pr.write(addr, pr.A);
};
this[0x96] = function() { /* 0x96, STX ZeropageY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.Y) & 0xff);
			
			pr.PC = pc + 2;

pr.write(addr, pr.X);
};
this[0x97] = function() { /* 0x97, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x97");
};
this[0x98] = function() { /* 0x98, TYA None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.Y];
};
this[0x99] = function() { /* 0x99, STA AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

pr.write(addr, pr.A);
};
this[0x9a] = function() { /* 0x9a, TXS None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

pr.SP = pr.X;
};
this[0x9b] = function() { /* 0x9b, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x9b");
};
this[0x9c] = function() { /* 0x9c, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x9c");
};
this[0x9d] = function() { /* 0x9d, STA AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

pr.write(addr, pr.A);
};
this[0x9e] = function() { /* 0x9e, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x9e");
};
this[0x9f] = function() { /* 0x9f, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0x9f");
};
this[0xa0] = function() { /* 0xa0, LDY Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = pr.read(addr)];
};
this[0xa1] = function() { /* 0xa1, LDA IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xa2] = function() { /* 0xa2, LDX Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.read(addr)];
};
this[0xa3] = function() { /* 0xa3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xa3");
};
this[0xa4] = function() { /* 0xa4, LDY Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = pr.read(addr)];
};
this[0xa5] = function() { /* 0xa5, LDA Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xa6] = function() { /* 0xa6, LDX Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.read(addr)];
};
this[0xa7] = function() { /* 0xa7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xa7");
};
this[0xa8] = function() { /* 0xa8, TAY None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = pr.A];
};
this[0xa9] = function() { /* 0xa9, LDA Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xaa] = function() { /* 0xaa, TAX None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.A];
};
this[0xab] = function() { /* 0xab, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xab");
};
this[0xac] = function() { /* 0xac, LDY Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = pr.read(addr)];
};
this[0xad] = function() { /* 0xad, LDA Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xae] = function() { /* 0xae, LDX Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.read(addr)];
};
this[0xaf] = function() { /* 0xaf, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xaf");
};
this[0xb0] = function() { /* 0xb0, BCS Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(pr.P & 0x1){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0xb1] = function() { /* 0xb1, LDA IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xb2] = function() { /* 0xb2, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xb2");
};
this[0xb3] = function() { /* 0xb3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xb3");
};
this[0xb4] = function() { /* 0xb4, LDY ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = pr.read(addr)];
};
this[0xb5] = function() { /* 0xb5, LDA ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xb6] = function() { /* 0xb6, LDX ZeropageY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.Y) & 0xff);
			
			pr.PC = pc + 2;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.read(addr)];
};
this[0xb7] = function() { /* 0xb7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xb7");
};
this[0xb8] = function() { /* 0xb8, CLV None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P &= (0xbf);
};
this[0xb9] = function() { /* 0xb9, LDA AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xba] = function() { /* 0xba, TSX None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.SP];
};
this[0xbb] = function() { /* 0xbb, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xbb");
};
this[0xbc] = function() { /* 0xbc, LDY AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = pr.read(addr)];
};
this[0xbd] = function() { /* 0xbd, LDA AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = pr.read(addr)];
};
this[0xbe] = function() { /* 0xbe, LDX AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = pr.read(addr)];
};
this[0xbf] = function() { /* 0xbf, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xbf");
};
this[0xc0] = function() { /* 0xc0, CPY Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.Y - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xc1] = function() { /* 0xc1, CMP IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xc2] = function() { /* 0xc2, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xc2");
};
this[0xc3] = function() { /* 0xc3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xc3");
};
this[0xc4] = function() { /* 0xc4, CPY Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.Y - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xc5] = function() { /* 0xc5, CMP Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xc6] = function() { /* 0xc6, DEC Zeropage */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)-1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xc7] = function() { /* 0xc7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xc7");
};
this[0xc8] = function() { /* 0xc8, INY None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.Y = (pr.Y+1)&0xff];
};
this[0xc9] = function() { /* 0xc9, CMP Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xca] = function() { /* 0xca, DEX None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = (pr.X-1)&0xff];
};
this[0xcb] = function() { /* 0xcb, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xcb");
};
this[0xcc] = function() { /* 0xcc, CPY Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.Y - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xcd] = function() { /* 0xcd, CMP Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xce] = function() { /* 0xce, DEC Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)-1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xcf] = function() { /* 0xcf, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xcf");
};
this[0xd0] = function() { /* 0xd0, BNE Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(!(pr.P & 0x2)){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0xd1] = function() { /* 0xd1, CMP IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xd2] = function() { /* 0xd2, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xd2");
};
this[0xd3] = function() { /* 0xd3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xd3");
};
this[0xd4] = function() { /* 0xd4, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xd4");
};
this[0xd5] = function() { /* 0xd5, CMP ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xd6] = function() { /* 0xd6, DEC ZeropageX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)-1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xd7] = function() { /* 0xd7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xd7");
};
this[0xd8] = function() { /* 0xd8, CLD None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P &= (0xf7);
};
this[0xd9] = function() { /* 0xd9, CMP AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xda] = function() { /* 0xda, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xda");
};
this[0xdb] = function() { /* 0xdb, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xdb");
};
this[0xdc] = function() { /* 0xdc, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xdc");
};
this[0xdd] = function() { /* 0xdd, CMP AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.A - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xde] = function() { /* 0xde, DEC AbsoluteX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)-1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xdf] = function() { /* 0xdf, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xdf");
};
this[0xe0] = function() { /* 0xe0, CPX Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.X - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xe1] = function() { /* 0xe1, SBC IndirectX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (pr.read(pc+1) + pr.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xe2] = function() { /* 0xe2, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xe2");
};
this[0xe3] = function() { /* 0xe3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xe3");
};
this[0xe4] = function() { /* 0xe4, CPX Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.X - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xe5] = function() { /* 0xe5, SBC Zeropage */
pr.consumeClock(3);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xe6] = function() { /* 0xe6, INC Zeropage */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1));
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)+1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xe7] = function() { /* 0xe7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xe7");
};
this[0xe8] = function() { /* 0xe8, INX None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;

/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.X = (pr.X+1)&0xff];
};
this[0xe9] = function() { /* 0xe9, SBC Immediate */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xea] = function() { /* 0xea, NOP None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


};
this[0xeb] = function() { /* 0xeb, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xeb");
};
this[0xec] = function() { /* 0xec, CPX Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.X - pr.read(addr)) & 0xffff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val & 0xff];
			pr.P = (pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
this[0xed] = function() { /* 0xed, SBC Absolute */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xee] = function() { /* 0xee, INC Absolute */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pr.read(pc+1) | (pr.read(pc+2) << 8));
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)+1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xef] = function() { /* 0xef, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xef");
};
this[0xf0] = function() { /* 0xf0, BEQ Relative */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pr.PC;
			
			pr.PC = pc + 2;


			if(pr.P & 0x2){
				pr.consumeClock( (((pr.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );
				pr.PC = addr;
			}
};
this[0xf1] = function() { /* 0xf1, SBC IndirectY */
pr.consumeClock(5);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( pr.read(addr_base) | (pr.read((addr_base+1)&0xff) << 8) ) + pr.Y;
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xf2] = function() { /* 0xf2, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xf2");
};
this[0xf3] = function() { /* 0xf3, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xf3");
};
this[0xf4] = function() { /* 0xf4, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xf4");
};
this[0xf5] = function() { /* 0xf5, SBC ZeropageX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xf6] = function() { /* 0xf6, INC ZeropageX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((pr.read(pc) + pr.X) & 0xff);
			
			pr.PC = pc + 2;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)+1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xf7] = function() { /* 0xf7, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xf7");
};
this[0xf8] = function() { /* 0xf8, SED None */
pr.consumeClock(2);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			
			pr.PC = pc + 1;


			pr.P |= 0x8;
};
this[0xf9] = function() { /* 0xf9, SBC AbsoluteY */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.Y;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xfa] = function() { /* 0xfa, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xfa");
};
this[0xfb] = function() { /* 0xfb, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xfb");
};
this[0xfc] = function() { /* 0xfc, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xfc");
};
this[0xfd] = function() { /* 0xfd, SBC AbsoluteX */
pr.consumeClock(4);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = pr.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (pr.A - val - ((pr.P & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			pr.P = (pr.P & 0xbe)
				| ((pr.A ^ val) & (pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[pr.A = newA];
};
this[0xfe] = function() { /* 0xfe, INC AbsoluteX */
pr.consumeClock(6);

			/**
			 * @const
			 * @type {Number}
			 */
			var pc = pr.PC;

			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = pr.read(pc+1) | (pr.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + pr.X;
			if(((addr ^ addr_base) & 0x0100) != 0) pr.consumeClock(1);
			
			pr.PC = pc + 3;


			/**
			 * @const
			 * @type {Number}
			 */
			var val = (pr.read(addr)+1) & 0xff;
			/* UpdateFlag */ pr.P = (pr.P & 0x7D) | ZNFlagCache[val];
			pr.write(addr, val);
};
this[0xff] = function() { /* 0xff, UNDEFINED NONE */
throw new cycloa.err.CoreException("Invalid opcode: 0xff");
};

};

cycloa.core.PrecompileSpirit.prototype.__proto__= cycloa.core.Spirit.prototype;

/**
 * @extends cycloa.core.Spirit
 * @constructor
 */
cycloa.core.TraceSpirit = function() {
	cycloa.core.Spirit.call(this);
	/**
	 * 逆アセンブラ用の命令
	 * @type {Uint8Array}
	 * @private
	 */
	this.code_ = new Uint8Array(cycloa.core.MAX_INST_LENGTH);
	/**
	 * 命令のコードをどれくらい読んだかを管理するインデックス
	 * @type {Number}
	 * @private
	 */
	this.code_idx_ = 0;
	/**
	 *
	 * @type {*}
	 * @private
	 */
	this.addr_ = undefined;
	this.addr_repr_ = undefined;
	this.addr_resolved_repr_ = undefined;
};
cycloa.core.TraceSpirit.prototype = {
	__proto__: cycloa.core.Spirit.prototype,
	/**
	 * @override cycloa.core.Spirit.run
	 */
	run: function(){
		this.code_idx_ = 0;
		this.readCode_(1);
		var inst_repr = cycloa.core.DecodeFuncTable[this.opcode_ = this.pr.read(this.pr.PC)].call(this);
		var inst = "$"+cycloa.util.formatHex(this.pr.PC,16)+":";
		for(var i= 0,max = cycloa.core.MAX_INST_LENGTH;i<max;++i){
			inst += i<this.code_idx_ ? cycloa.util.formatHex(this.code_[i])+" " : "   ";
		}
		inst += " "+inst_repr;
		var regstr = "";
		regstr +=  "A: "+cycloa.util.formatHex(this.pr.A, 8);
		regstr += " X: "+cycloa.util.formatHex(this.pr.X, 8);
		regstr += " Y: "+cycloa.util.formatHex(this.pr.Y, 8);
		regstr += " S: "+cycloa.util.formatHex(this.pr.SP, 8);
		regstr += " P:";
		regstr += (this.pr.P & cycloa.core.FLAG.N) ? 'N' : 'n';
		regstr += (this.pr.P & cycloa.core.FLAG.V) ? 'V' : 'v';
		regstr += (this.pr.P & cycloa.core.FLAG.ALWAYS_SET) ? 'U' : 'u';
		regstr += (this.pr.P & cycloa.core.FLAG.B) ? 'B' : 'b';
		regstr += (this.pr.P & cycloa.core.FLAG.D) ? 'D' : 'd';
		regstr += (this.pr.P & cycloa.core.FLAG.I) ? 'I' : 'i';
		regstr += (this.pr.P & cycloa.core.FLAG.Z) ? 'Z' : 'z';
		regstr += (this.pr.P & cycloa.core.FLAG.C) ? 'C' : 'c';
		return (inst+"                                             ").slice(0,43)+regstr;
	},
	readCode_: function(size){
		for(var i=this.code_idx_, max = this.code_idx_+size;i <max; ++i){
			this.code_[i] = this.pr.read(this.pr.PC+i);
		}
		this.code_idx_ += size;
	},
	formatResolvedAddr_: function(){
		return " = #$"+cycloa.util.formatHex(this.pr.read(this.addr_));
	},
	addrImmediate: function() {
		this.readCode_(2);
		this.addr_ = this.pr.PC+1;
		this.addr_repr_ = "#$"+cycloa.util.formatHex(this.pr.read(this.pr.PC+1));
		this.addr_resolved_repr_ = "";
	},
	addrZeropage: function() {
		this.readCode_(2);
		this.addr_ = this.pr.read(this.pr.PC+1);
		this.addr_repr_ = "$"+cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrZeropageX: function() {
		this.readCode_(2);
		var base = this.pr.read(this.pr.PC+1);
		this.addr_ = (base + this.pr.X) & 0xff;
		this.addr_repr_ =	"$"+cycloa.util.formatHex(base)+",X @ $"+cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrZeropageY: function() {
		this.readCode_(2);
		var base = this.pr.read(this.pr.PC+1);
		this.addr_ = (base + this.pr.Y) & 0xff;
		this.addr_repr_ =	"$"+cycloa.util.formatHex(base)+",Y @ $"+cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrAbsolute: function() {
		this.readCode_(3);
		this.addr_ = this.pr.read(this.pr.PC+1) | (this.pr.read(this.pr.PC+2) << 8);
		this.addr_repr_ = "$"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrAbsoluteX: function() {
		this.readCode_(3);
		var base = (this.pr.read(this.pr.PC+1) | (this.pr.read(this.pr.PC+2) << 8));
		this.addr_ = (base + this.pr.X) & 0xffff;
		this.addr_repr_ = "$"+cycloa.util.formatHex(base, 16)+",X @ $"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrAbsoluteY: function() {
		this.readCode_(3);
		var base = (this.pr.read(this.pr.PC+1) | (this.pr.read(this.pr.PC+2) << 8));
		this.addr_ = (base + this.pr.Y) & 0xffff;
		this.addr_repr_ = "$"+cycloa.util.formatHex(base, 16)+",Y @ $"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrIndirect: function() { // used only in JMP
		this.readCode_(3);
		/** @const
		 *  @type {Number} */
		var base = this.pr.read(this.pr.PC+1) | (this.pr.read(this.pr.PC+2) << 8);
		this.addr_ = this.pr.read(base) | (this.pr.read((base & 0xff00) | ((base+1) & 0x00ff)) << 8); //bug of NES
		this.addr_repr_ = "($"+cycloa.util.formatHex(base, 16)+") @ $"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrIndirectX: function() {
		this.readCode_(2);
		/** @const
		 *  @type {Number} */
		var base = (this.pr.read(this.pr.PC+1) + this.pr.X) & 0xff;
		this.addr_ = this.pr.read(base) | (this.pr.read((base+1)&0xff) << 8);
		this.addr_repr_ = "($"+cycloa.util.formatHex(base)+",X) @ $"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrIndirectY: function() {
		this.readCode_(2);
		/** @const
		 *  @type {Number} */
		var base = this.pr.read(this.pr.PC+1);
		this.addr_ = ((this.pr.read(base) | (this.pr.read((base+1)&0xff) << 8))+this.pr.Y);
		this.addr_repr_ = "($"+cycloa.util.formatHex(base)+"),Y @ $"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	},
	addrRelative: function() {
		this.readCode_(2);
		/** @const
		 *  @type {Number} */
		var offset = this.pr.read(this.pr.PC+1);
		this.addr_ = ((offset >= 128 ? (offset-256) : offset) + this.pr.PC+2) & 0xffff;
		this.addr_repr_ = "$"+cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = "";
	},
	LDA: function(){
		return "LDA "+this.addr_repr_+this.addr_resolved_repr_;
	},
	LDY: function() {
		return "LDY "+this.addr_repr_+this.addr_resolved_repr_
	},
	LDX: function() {
		return "LDX "+this.addr_repr_+this.addr_resolved_repr_
	},
	STA: function() {
		return "STA "+this.addr_repr_+this.addr_resolved_repr_
	},
	STX: function() {
		return "STX "+this.addr_repr_+this.addr_resolved_repr_
	},
	STY: function() {
		return "STY "+this.addr_repr_+this.addr_resolved_repr_
	},
	TXA_: function() {
		return "TXA";
	},
	TYA_: function() {
		return "TYA";
	},
	TXS_: function() {
		return "TXS";
	},
	TAY_: function() {
		return "TAY";
	},
	TAX_: function() {
		return "TAX";
	},
	TSX_: function() {
		return "TSX";
	},
	PHP_: function() {
		return "PHP";
	},
	PLP_: function() {
		return "PLP";
	},
	PHA_: function() {
		return "PHA";
	},
	PLA_: function() {
		return "PLA";
	},
	ADC: function() {
		return "ADC "+this.addr_repr_+this.addr_resolved_repr_
	},
	SBC: function() {
		return "SBC "+this.addr_repr_+this.addr_resolved_repr_
	},
	CPX: function() {
		return "CPX "+this.addr_repr_+this.addr_resolved_repr_
	},
	CPY: function() {
		return "CPY "+this.addr_repr_+this.addr_resolved_repr_
	},
	CMP: function() {
		return "CMP "+this.addr_repr_+this.addr_resolved_repr_
	},
	AND: function() {
		return "AND "+this.addr_repr_+this.addr_resolved_repr_
	},
	EOR: function() {
		return "EOR "+this.addr_repr_+this.addr_resolved_repr_
	},
	ORA: function() {
		return "ORA "+this.addr_repr_+this.addr_resolved_repr_
	},
	BIT: function() {
		return "BIT "+this.addr_repr_+this.addr_resolved_repr_
	},
	ASL_: function() {
		return "ASL $registerA";
	},
	ASL: function() {
		return "ASL "+this.addr_repr_+this.addr_resolved_repr_
	},
	LSR_: function() {
		return "LSR $registerA";
	},
	LSR: function() {
		return "LSR "+this.addr_repr_+this.addr_resolved_repr_
	},
	ROL_: function() {
		return "ROL $registerA";
	},
	ROL: function() {
		return "ROL "+this.addr_repr_+this.addr_resolved_repr_
	},
	ROR_: function() {
		return "ROR $registerA";
	},
	ROR: function() {
		return "ROR "+this.addr_repr_+this.addr_resolved_repr_
	},
	INX_: function() {
		return "INX";
	},
	INY_: function() {
		return "INY";
	},
	INC: function() {
		return "INC "+this.addr_repr_+this.addr_resolved_repr_
	},
	DEX_: function() {
		return "DEX";
	},
	DEY_: function() {
		return "DEY";
	},
	DEC: function() {
		return "DEC "+this.addr_repr_+this.addr_resolved_repr_
	},
	CLC_: function() {
		return "CLC";
	},
	CLI_: function() {
		return "CLI";
	},
	CLV_: function() {
		return "CLV";
	},
	CLD_: function() {
		return "CLD";
	},
	SEC_: function() {
		return "SEC";
	},
	SEI_: function() {
		return "SEI";
	},
	SED_: function() {
		return "SED";
	},
	NOP_: function() {
		return "NOP";
	},
	BRK_: function() {
		return "BRK";
	},
	BCC: function() {
		return "BCC "+this.addr_repr_;
	},
	BCS: function() {
		return "BCS "+this.addr_repr_;
	},
	BEQ: function() {
		return "BEQ "+this.addr_repr_;
	},
	BNE: function() {
		return "BNE "+this.addr_repr_;
	},
	BVC: function() {
		return "BVC "+this.addr_repr_;
	},
	BVS: function() {
		return "BVS "+this.addr_repr_;
	},
	BPL: function() {
		return "BPL "+this.addr_repr_;
	},
	BMI: function() {
		return "BMI "+this.addr_repr_;
	},
	JSR: function() {
		return "JSR "+this.addr_repr_;
	},
	JMP: function() {
		return "JMP "+this.addr_repr_;
	},
	RTI_: function() {
		return "RTI";
	},
	RTS_: function() {
		return "RTS";
	},
	onInvalidOpcode: function(){
		return "UNDEFINED";
	}
};

/**
 * 演算結果ごとのZNフラグの値
 * @const
 * @type {Uint8Array}
 */
cycloa.core.ZNFlagCache = new Uint8Array([
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

/**
 * @const
 * @type {Number}
 */
cycloa.core.RESET_CLOCK = 6;

cycloa.core.MAX_INST_LENGTH=3;
