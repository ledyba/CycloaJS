"use strict";

/**
 * cycloa名前空間本体
 * @namespace
 * @type {Object}
 */
var cycloa = {};
/**
 * エラークラスの名前空間
 * @type {Object}
 * @namespace
 */
cycloa.err = {};
/**
 * ユーティリティの名前空間
 * @type {Object}
 */
cycloa.util = {};
cycloa.debug = false;

cycloa.NesPalette = new Uint32Array([
		0x787878, 0x2000B0, 0x2800B8, 0x6010A0, 0x982078, 0xB01030, 0xA03000, 0x784000,
		0x485800, 0x386800, 0x386C00, 0x306040, 0x305080, 0x000000, 0x000000, 0x000000,
		0xB0B0B0, 0x4060F8, 0x4040FF, 0x9040F0, 0xD840C0, 0xD84060, 0xE05000, 0xC07000,
		0x888800, 0x50A000, 0x48A810, 0x48A068, 0x4090C0, 0x000000, 0x000000, 0x000000,
		0xFFFFFF, 0x60A0FF, 0x5080FF, 0xA070FF, 0xF060FF, 0xFF60B0, 0xFF7830, 0xFFA000,
		0xE8D020, 0x98E800, 0x70F040, 0x70E090, 0x60D0E0, 0x787878, 0x000000, 0x000000,
		0xFFFFFF, 0x90D0FF, 0xA0B8FF, 0xC0B0FF, 0xE0B0FF, 0xFFB8E8, 0xFFC8B8, 0xFFD8A0,
		0xFFF090, 0xC8F080, 0xA0F0A0, 0xA0FFC8, 0xA0FFF0, 0xA0A0A0, 0x000000, 0x000000
]);


"use strict";
/**
 * 例外のベースクラスです
 * @param {string} name 例外クラス名
 * @param {string} message メッセージ
 * @const
 * @constructor
 */
cycloa.err.Exception = function (name, message) {
	/**
	 * 例外のメッセージのインスタンス
	 * @type {string}
	 * @const
	 * @private
	 */
	/**
	 * @const
	 * @type {string}
	 */
	this.name = name;
	this.message = "["+name.toString()+"] "+message;
};
cycloa.err.Exception.prototype.toString = function(){
	return this.message;
};
/**
 * エミュレータのコアで発生した例外です
 * @param {string} message
 * @constructor
 * @extends cycloa.err.Exception
 */
cycloa.err.CoreException = function (message) {
	cycloa.err.Exception.call(this, "CoreException", message);
};
cycloa.err.CoreException.prototype = {
	__proto__ : cycloa.err.Exception.prototype
};
/**
 * 実装するべきメソッドを実装してない例外です
 * @param {string} message
 * @constructor
 * @extends cycloa.err.Exception
 */
cycloa.err.NotImplementedException = function (message) {
	cycloa.err.Exception.call(this, "NotImplementedException", message);
};
cycloa.err.NotImplementedException.prototype = {
	__proto__: cycloa.err.Exception.prototype
};
/**
 * サポートしてない事を示す例外です
 * @param {string} message
 * @constructor
 */
cycloa.err.NotSupportedException = function ( message ) {
	cycloa.err.Exception.call(this, "NotSupportedException", message);
};
cycloa.err.NotSupportedException.prototype = {
	__proto__: cycloa.err.Exception.prototype
};


/**
 * @param {number} num
 * @param {number} [len = 8]
 * @return {string}
 */
cycloa.util.formatHex = function(num, len){
	len = len || 8;
	return ("0000" + num.toString(16).toUpperCase()).slice(-(len>>2));
};
"use strict";

/**
 * @constructor
 */
cycloa.Tracer = function (machine) {
	this.m = machine;
	/**
	 * 逆アセンブラ用の命令
	 * @type {Uint8Array}
	 * @private
	 */
	this.code_ = new Uint8Array(3 /*MAX_INST_LENGTH*/);
	/**
	 * 命令のコードをどれくらい読んだかを管理するインデックス
	 * @type {number}
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
	/**
	 */
	this.decode = function () {
		var inst_repr = this[this.opcode_ = this.m.read(this.m.PC)]();
		var inst = "$" + cycloa.util.formatHex(this.m.PC, 16) + ":";
		for (var i = 0, max = 3; i < max; ++i) {
			inst += i < this.code_idx_ ? cycloa.util.formatHex(this.code_[i]) + " " : "   ";
		}
		inst += " " + inst_repr;
		var regstr = "";
		regstr += "A: " + cycloa.util.formatHex(this.m.A, 8);
		regstr += " X: " + cycloa.util.formatHex(this.m.X, 8);
		regstr += " Y: " + cycloa.util.formatHex(this.m.Y, 8);
		regstr += " S: " + cycloa.util.formatHex(this.m.SP, 8);
		regstr += " P:";
		regstr += (this.m.P & 0x80) ? 'N' : 'n';
		regstr += (this.m.P & 0x40) ? 'V' : 'v';
		regstr += (this.m.P & 0x20) ? 'U' : 'u';
		regstr += (this.m.P & 0x10) ? 'B' : 'b';
		regstr += (this.m.P & 0x08) ? 'D' : 'd';
		regstr += (this.m.P & 0x04) ? 'I' : 'i';
		regstr += (this.m.P & 0x02) ? 'Z' : 'z';
		regstr += (this.m.P & 0x01) ? 'C' : 'c';
		return (inst + "                                             ").slice(0, 43) + regstr;
	};
	this.readCode_ = function (size) {
		for (var i = 0; i < size; ++i) {
			this.code_[i] = this.m.read(this.m.PC + i);
		}
		this.code_idx_ = size;
	};
	this.formatResolvedAddr_ = function () {
		return " = #$" + cycloa.util.formatHex(this.m.read(this.addr_));
	};
	this.addrNone = function(){
		this.readCode_(1);
		this.addr_repr_ = "";
		this.addr_resolved_repr_ = "";
	};
	this.addrImmediate = function () {
		this.readCode_(2);
		this.addr_ = this.m.PC + 1;
		this.addr_repr_ = "#$" + cycloa.util.formatHex(this.m.read(this.m.PC + 1));
		this.addr_resolved_repr_ = "";
	};
	this.addrZeropage = function () {
		this.readCode_(2);
		this.addr_ = this.m.read(this.m.PC + 1);
		this.addr_repr_ = "$" + cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrZeropageX = function () {
		this.readCode_(2);
		var base = this.m.read(this.m.PC + 1);
		this.addr_ = (base + this.m.X) & 0xff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base) + ",X @ $" + cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrZeropageY = function () {
		this.readCode_(2);
		var base = this.m.read(this.m.PC + 1);
		this.addr_ = (base + this.m.Y) & 0xff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base) + ",Y @ $" + cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrAbsolute = function () {
		this.readCode_(3);
		this.addr_ = this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8);
		this.addr_repr_ = "$" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrAbsoluteX = function () {
		this.readCode_(3);
		var base = (this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8));
		this.addr_ = (base + this.m.X) & 0xffff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base, 16) + ",X @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrAbsoluteY = function () {
		this.readCode_(3);
		var base = (this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8));
		this.addr_ = (base + this.m.Y) & 0xffff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base, 16) + ",Y @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrIndirect = function () { // used only in JMP
		this.readCode_(3);
		/** @const
		 *  @type {number} */
		var base = this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8);
		this.addr_ = this.m.read(base) | (this.m.read((base & 0xff00) | ((base + 1) & 0x00ff)) << 8); //bug of NES
		this.addr_repr_ = "($" + cycloa.util.formatHex(base, 16) + ") @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrIndirectX = function () {
		this.readCode_(2);
		/** @const
		 *  @type {number} */
		var base = (this.m.read(this.m.PC + 1) + this.m.X) & 0xff;
		this.addr_ = this.m.read(base) | (this.m.read((base + 1) & 0xff) << 8);
		this.addr_repr_ = "($" + cycloa.util.formatHex(base) + ",X) @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrIndirectY = function () {
		this.readCode_(2);
		/** @const
		 *  @type {number} */
		var base = this.m.read(this.m.PC + 1);
		this.addr_ = ((this.m.read(base) | (this.m.read((base + 1) & 0xff) << 8)) + this.m.Y);
		this.addr_repr_ = "($" + cycloa.util.formatHex(base) + "),Y @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrRelative = function () {
		this.readCode_(2);
		/** @const
		 *  @type {number} */
		var offset = this.m.read(this.m.PC + 1);
		this.addr_ = ((offset >= 128 ? (offset - 256) : offset) + this.m.PC + 2) & 0xffff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = "";
	};
	this.LDA = function () {
		return "LDA " + this.addr_repr_ + this.addr_resolved_repr_;
	};
	this.LDY = function () {
		return "LDY " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.LDX = function () {
		return "LDX " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.STA = function () {
		return "STA " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.STX = function () {
		return "STX " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.STY = function () {
		return "STY " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.TXA_ = function () {
		return "TXA";
	};
	this.TYA_ = function () {
		return "TYA";
	};
	this.TXS_ = function () {
		return "TXS";
	};
	this.TAY_ = function () {
		return "TAY";
	};
	this.TAX_ = function () {
		return "TAX";
	};
	this.TSX_ = function () {
		return "TSX";
	};
	this.PHP_ = function () {
		return "PHP";
	};
	this.PLP_ = function () {
		return "PLP";
	};
	this.PHA_ = function () {
		return "PHA";
	};
	this.PLA_ = function () {
		return "PLA";
	};
	this.ADC = function () {
		return "ADC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.SBC = function () {
		return "SBC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CPX = function () {
		return "CPX " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CPY = function () {
		return "CPY " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CMP = function () {
		return "CMP " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.AND = function () {
		return "AND " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.EOR = function () {
		return "EOR " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ORA = function () {
		return "ORA " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.BIT = function () {
		return "BIT " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ASL_ = function () {
		return "ASL $registerA";
	};
	this.ASL = function () {
		return "ASL " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.LSR_ = function () {
		return "LSR $registerA";
	};
	this.LSR = function () {
		return "LSR " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ROL_ = function () {
		return "ROL $registerA";
	};
	this.ROL = function () {
		return "ROL " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ROR_ = function () {
		return "ROR $registerA";
	};
	this.ROR = function () {
		return "ROR " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.INX_ = function () {
		return "INX";
	};
	this.INY_ = function () {
		return "INY";
	};
	this.INC = function () {
		return "INC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.DEX_ = function () {
		return "DEX";
	};
	this.DEY_ = function () {
		return "DEY";
	};
	this.DEC = function () {
		return "DEC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CLC_ = function () {
		return "CLC";
	};
	this.CLI_ = function () {
		return "CLI";
	};
	this.CLV_ = function () {
		return "CLV";
	};
	this.CLD_ = function () {
		return "CLD";
	};
	this.SEC_ = function () {
		return "SEC";
	};
	this.SEI_ = function () {
		return "SEI";
	};
	this.SED_ = function () {
		return "SED";
	};
	this.NOP_ = function () {
		return "NOP";
	};
	this.BRK_ = function () {
		return "BRK";
	};
	this.BCC = function () {
		return "BCC " + this.addr_repr_;
	};
	this.BCS = function () {
		return "BCS " + this.addr_repr_;
	};
	this.BEQ = function () {
		return "BEQ " + this.addr_repr_;
	};
	this.BNE = function () {
		return "BNE " + this.addr_repr_;
	};
	this.BVC = function () {
		return "BVC " + this.addr_repr_;
	};
	this.BVS = function () {
		return "BVS " + this.addr_repr_;
	};
	this.BPL = function () {
		return "BPL " + this.addr_repr_;
	};
	this.BMI = function () {
		return "BMI " + this.addr_repr_;
	};
	this.JSR = function () {
		return "JSR " + this.addr_repr_;
	};
	this.JMP = function () {
		return "JMP " + this.addr_repr_;
	};
	this.RTI_ = function () {
		return "RTI";
	};
	this.RTS_ = function () {
		return "RTS";
	};
	this.onInvalidOpcode = function () {
		return "UNDEFINED";
	};
	this[0x0] = function() { return this.BRK_(this.addrNone()); }; /* 0x0, BRK None */
	this[0x1] = function() { return this.ORA(this.addrIndirectX()); }; /* 0x1, ORA IndirectX */
	this[0x2] = function() { return this.onInvalidOpcode(); };
	this[0x3] = function() { return this.onInvalidOpcode(); };
	this[0x4] = function() { return this.onInvalidOpcode(); };
	this[0x5] = function() { return this.ORA(this.addrZeropage()); }; /* 0x5, ORA Zeropage */
	this[0x6] = function() { return this.ASL(this.addrZeropage()); }; /* 0x6, ASL Zeropage */
	this[0x7] = function() { return this.onInvalidOpcode(); };
	this[0x8] = function() { return this.PHP_(this.addrNone()); }; /* 0x8, PHP None */
	this[0x9] = function() { return this.ORA(this.addrImmediate()); }; /* 0x9, ORA Immediate */
	this[0xa] = function() { return this.ASL_(this.addrNone()); }; /* 0xa, ASL None */
	this[0xb] = function() { return this.onInvalidOpcode(); };
	this[0xc] = function() { return this.onInvalidOpcode(); };
	this[0xd] = function() { return this.ORA(this.addrAbsolute()); }; /* 0xd, ORA Absolute */
	this[0xe] = function() { return this.ASL(this.addrAbsolute()); }; /* 0xe, ASL Absolute */
	this[0xf] = function() { return this.onInvalidOpcode(); };
	this[0x10] = function() { return this.BPL(this.addrRelative()); }; /* 0x10, BPL Relative */
	this[0x11] = function() { return this.ORA(this.addrIndirectY()); }; /* 0x11, ORA IndirectY */
	this[0x12] = function() { return this.onInvalidOpcode(); };
	this[0x13] = function() { return this.onInvalidOpcode(); };
	this[0x14] = function() { return this.onInvalidOpcode(); };
	this[0x15] = function() { return this.ORA(this.addrZeropageX()); }; /* 0x15, ORA ZeropageX */
	this[0x16] = function() { return this.ASL(this.addrZeropageX()); }; /* 0x16, ASL ZeropageX */
	this[0x17] = function() { return this.onInvalidOpcode(); };
	this[0x18] = function() { return this.CLC_(this.addrNone()); }; /* 0x18, CLC None */
	this[0x19] = function() { return this.ORA(this.addrAbsoluteY()); }; /* 0x19, ORA AbsoluteY */
	this[0x1a] = function() { return this.onInvalidOpcode(); };
	this[0x1b] = function() { return this.onInvalidOpcode(); };
	this[0x1c] = function() { return this.onInvalidOpcode(); };
	this[0x1d] = function() { return this.ORA(this.addrAbsoluteX()); }; /* 0x1d, ORA AbsoluteX */
	this[0x1e] = function() { return this.ASL(this.addrAbsoluteX()); }; /* 0x1e, ASL AbsoluteX */
	this[0x1f] = function() { return this.onInvalidOpcode(); };
	this[0x20] = function() { return this.JSR(this.addrAbsolute()); }; /* 0x20, JSR Absolute */
	this[0x21] = function() { return this.AND(this.addrIndirectX()); }; /* 0x21, AND IndirectX */
	this[0x22] = function() { return this.onInvalidOpcode(); };
	this[0x23] = function() { return this.onInvalidOpcode(); };
	this[0x24] = function() { return this.BIT(this.addrZeropage()); }; /* 0x24, BIT Zeropage */
	this[0x25] = function() { return this.AND(this.addrZeropage()); }; /* 0x25, AND Zeropage */
	this[0x26] = function() { return this.ROL(this.addrZeropage()); }; /* 0x26, ROL Zeropage */
	this[0x27] = function() { return this.onInvalidOpcode(); };
	this[0x28] = function() { return this.PLP_(this.addrNone()); }; /* 0x28, PLP None */
	this[0x29] = function() { return this.AND(this.addrImmediate()); }; /* 0x29, AND Immediate */
	this[0x2a] = function() { return this.ROL_(this.addrNone()); }; /* 0x2a, ROL None */
	this[0x2b] = function() { return this.onInvalidOpcode(); };
	this[0x2c] = function() { return this.BIT(this.addrAbsolute()); }; /* 0x2c, BIT Absolute */
	this[0x2d] = function() { return this.AND(this.addrAbsolute()); }; /* 0x2d, AND Absolute */
	this[0x2e] = function() { return this.ROL(this.addrAbsolute()); }; /* 0x2e, ROL Absolute */
	this[0x2f] = function() { return this.onInvalidOpcode(); };
	this[0x30] = function() { return this.BMI(this.addrRelative()); }; /* 0x30, BMI Relative */
	this[0x31] = function() { return this.AND(this.addrIndirectY()); }; /* 0x31, AND IndirectY */
	this[0x32] = function() { return this.onInvalidOpcode(); };
	this[0x33] = function() { return this.onInvalidOpcode(); };
	this[0x34] = function() { return this.onInvalidOpcode(); };
	this[0x35] = function() { return this.AND(this.addrZeropageX()); }; /* 0x35, AND ZeropageX */
	this[0x36] = function() { return this.ROL(this.addrZeropageX()); }; /* 0x36, ROL ZeropageX */
	this[0x37] = function() { return this.onInvalidOpcode(); };
	this[0x38] = function() { return this.SEC_(this.addrNone()); }; /* 0x38, SEC None */
	this[0x39] = function() { return this.AND(this.addrAbsoluteY()); }; /* 0x39, AND AbsoluteY */
	this[0x3a] = function() { return this.onInvalidOpcode(); };
	this[0x3b] = function() { return this.onInvalidOpcode(); };
	this[0x3c] = function() { return this.onInvalidOpcode(); };
	this[0x3d] = function() { return this.AND(this.addrAbsoluteX()); }; /* 0x3d, AND AbsoluteX */
	this[0x3e] = function() { return this.ROL(this.addrAbsoluteX()); }; /* 0x3e, ROL AbsoluteX */
	this[0x3f] = function() { return this.onInvalidOpcode(); };
	this[0x40] = function() { return this.RTI_(this.addrNone()); }; /* 0x40, RTI None */
	this[0x41] = function() { return this.EOR(this.addrIndirectX()); }; /* 0x41, EOR IndirectX */
	this[0x42] = function() { return this.onInvalidOpcode(); };
	this[0x43] = function() { return this.onInvalidOpcode(); };
	this[0x44] = function() { return this.onInvalidOpcode(); };
	this[0x45] = function() { return this.EOR(this.addrZeropage()); }; /* 0x45, EOR Zeropage */
	this[0x46] = function() { return this.LSR(this.addrZeropage()); }; /* 0x46, LSR Zeropage */
	this[0x47] = function() { return this.onInvalidOpcode(); };
	this[0x48] = function() { return this.PHA_(this.addrNone()); }; /* 0x48, PHA None */
	this[0x49] = function() { return this.EOR(this.addrImmediate()); }; /* 0x49, EOR Immediate */
	this[0x4a] = function() { return this.LSR_(this.addrNone()); }; /* 0x4a, LSR None */
	this[0x4b] = function() { return this.onInvalidOpcode(); };
	this[0x4c] = function() { return this.JMP(this.addrAbsolute()); }; /* 0x4c, JMP Absolute */
	this[0x4d] = function() { return this.EOR(this.addrAbsolute()); }; /* 0x4d, EOR Absolute */
	this[0x4e] = function() { return this.LSR(this.addrAbsolute()); }; /* 0x4e, LSR Absolute */
	this[0x4f] = function() { return this.onInvalidOpcode(); };
	this[0x50] = function() { return this.BVC(this.addrRelative()); }; /* 0x50, BVC Relative */
	this[0x51] = function() { return this.EOR(this.addrIndirectY()); }; /* 0x51, EOR IndirectY */
	this[0x52] = function() { return this.onInvalidOpcode(); };
	this[0x53] = function() { return this.onInvalidOpcode(); };
	this[0x54] = function() { return this.onInvalidOpcode(); };
	this[0x55] = function() { return this.EOR(this.addrZeropageX()); }; /* 0x55, EOR ZeropageX */
	this[0x56] = function() { return this.LSR(this.addrZeropageX()); }; /* 0x56, LSR ZeropageX */
	this[0x57] = function() { return this.onInvalidOpcode(); };
	this[0x58] = function() { return this.CLI_(this.addrNone()); }; /* 0x58, CLI None */
	this[0x59] = function() { return this.EOR(this.addrAbsoluteY()); }; /* 0x59, EOR AbsoluteY */
	this[0x5a] = function() { return this.onInvalidOpcode(); };
	this[0x5b] = function() { return this.onInvalidOpcode(); };
	this[0x5c] = function() { return this.onInvalidOpcode(); };
	this[0x5d] = function() { return this.EOR(this.addrAbsoluteX()); }; /* 0x5d, EOR AbsoluteX */
	this[0x5e] = function() { return this.LSR(this.addrAbsoluteX()); }; /* 0x5e, LSR AbsoluteX */
	this[0x5f] = function() { return this.onInvalidOpcode(); };
	this[0x60] = function() { return this.RTS_(this.addrNone()); }; /* 0x60, RTS None */
	this[0x61] = function() { return this.ADC(this.addrIndirectX()); }; /* 0x61, ADC IndirectX */
	this[0x62] = function() { return this.onInvalidOpcode(); };
	this[0x63] = function() { return this.onInvalidOpcode(); };
	this[0x64] = function() { return this.onInvalidOpcode(); };
	this[0x65] = function() { return this.ADC(this.addrZeropage()); }; /* 0x65, ADC Zeropage */
	this[0x66] = function() { return this.ROR(this.addrZeropage()); }; /* 0x66, ROR Zeropage */
	this[0x67] = function() { return this.onInvalidOpcode(); };
	this[0x68] = function() { return this.PLA_(this.addrNone()); }; /* 0x68, PLA None */
	this[0x69] = function() { return this.ADC(this.addrImmediate()); }; /* 0x69, ADC Immediate */
	this[0x6a] = function() { return this.ROR_(this.addrNone()); }; /* 0x6a, ROR None */
	this[0x6b] = function() { return this.onInvalidOpcode(); };
	this[0x6c] = function() { return this.JMP(this.addrIndirect()); }; /* 0x6c, JMP Indirect */
	this[0x6d] = function() { return this.ADC(this.addrAbsolute()); }; /* 0x6d, ADC Absolute */
	this[0x6e] = function() { return this.ROR(this.addrAbsolute()); }; /* 0x6e, ROR Absolute */
	this[0x6f] = function() { return this.onInvalidOpcode(); };
	this[0x70] = function() { return this.BVS(this.addrRelative()); }; /* 0x70, BVS Relative */
	this[0x71] = function() { return this.ADC(this.addrIndirectY()); }; /* 0x71, ADC IndirectY */
	this[0x72] = function() { return this.onInvalidOpcode(); };
	this[0x73] = function() { return this.onInvalidOpcode(); };
	this[0x74] = function() { return this.onInvalidOpcode(); };
	this[0x75] = function() { return this.ADC(this.addrZeropageX()); }; /* 0x75, ADC ZeropageX */
	this[0x76] = function() { return this.ROR(this.addrZeropageX()); }; /* 0x76, ROR ZeropageX */
	this[0x77] = function() { return this.onInvalidOpcode(); };
	this[0x78] = function() { return this.SEI_(this.addrNone()); }; /* 0x78, SEI None */
	this[0x79] = function() { return this.ADC(this.addrAbsoluteY()); }; /* 0x79, ADC AbsoluteY */
	this[0x7a] = function() { return this.onInvalidOpcode(); };
	this[0x7b] = function() { return this.onInvalidOpcode(); };
	this[0x7c] = function() { return this.onInvalidOpcode(); };
	this[0x7d] = function() { return this.ADC(this.addrAbsoluteX()); }; /* 0x7d, ADC AbsoluteX */
	this[0x7e] = function() { return this.ROR(this.addrAbsoluteX()); }; /* 0x7e, ROR AbsoluteX */
	this[0x7f] = function() { return this.onInvalidOpcode(); };
	this[0x80] = function() { return this.onInvalidOpcode(); };
	this[0x81] = function() { return this.STA(this.addrIndirectX()); }; /* 0x81, STA IndirectX */
	this[0x82] = function() { return this.onInvalidOpcode(); };
	this[0x83] = function() { return this.onInvalidOpcode(); };
	this[0x84] = function() { return this.STY(this.addrZeropage()); }; /* 0x84, STY Zeropage */
	this[0x85] = function() { return this.STA(this.addrZeropage()); }; /* 0x85, STA Zeropage */
	this[0x86] = function() { return this.STX(this.addrZeropage()); }; /* 0x86, STX Zeropage */
	this[0x87] = function() { return this.onInvalidOpcode(); };
	this[0x88] = function() { return this.DEY_(this.addrNone()); }; /* 0x88, DEY None */
	this[0x89] = function() { return this.onInvalidOpcode(); };
	this[0x8a] = function() { return this.TXA_(this.addrNone()); }; /* 0x8a, TXA None */
	this[0x8b] = function() { return this.onInvalidOpcode(); };
	this[0x8c] = function() { return this.STY(this.addrAbsolute()); }; /* 0x8c, STY Absolute */
	this[0x8d] = function() { return this.STA(this.addrAbsolute()); }; /* 0x8d, STA Absolute */
	this[0x8e] = function() { return this.STX(this.addrAbsolute()); }; /* 0x8e, STX Absolute */
	this[0x8f] = function() { return this.onInvalidOpcode(); };
	this[0x90] = function() { return this.BCC(this.addrRelative()); }; /* 0x90, BCC Relative */
	this[0x91] = function() { return this.STA(this.addrIndirectY()); }; /* 0x91, STA IndirectY */
	this[0x92] = function() { return this.onInvalidOpcode(); };
	this[0x93] = function() { return this.onInvalidOpcode(); };
	this[0x94] = function() { return this.STY(this.addrZeropageX()); }; /* 0x94, STY ZeropageX */
	this[0x95] = function() { return this.STA(this.addrZeropageX()); }; /* 0x95, STA ZeropageX */
	this[0x96] = function() { return this.STX(this.addrZeropageY()); }; /* 0x96, STX ZeropageY */
	this[0x97] = function() { return this.onInvalidOpcode(); };
	this[0x98] = function() { return this.TYA_(this.addrNone()); }; /* 0x98, TYA None */
	this[0x99] = function() { return this.STA(this.addrAbsoluteY()); }; /* 0x99, STA AbsoluteY */
	this[0x9a] = function() { return this.TXS_(this.addrNone()); }; /* 0x9a, TXS None */
	this[0x9b] = function() { return this.onInvalidOpcode(); };
	this[0x9c] = function() { return this.onInvalidOpcode(); };
	this[0x9d] = function() { return this.STA(this.addrAbsoluteX()); }; /* 0x9d, STA AbsoluteX */
	this[0x9e] = function() { return this.onInvalidOpcode(); };
	this[0x9f] = function() { return this.onInvalidOpcode(); };
	this[0xa0] = function() { return this.LDY(this.addrImmediate()); }; /* 0xa0, LDY Immediate */
	this[0xa1] = function() { return this.LDA(this.addrIndirectX()); }; /* 0xa1, LDA IndirectX */
	this[0xa2] = function() { return this.LDX(this.addrImmediate()); }; /* 0xa2, LDX Immediate */
	this[0xa3] = function() { return this.onInvalidOpcode(); };
	this[0xa4] = function() { return this.LDY(this.addrZeropage()); }; /* 0xa4, LDY Zeropage */
	this[0xa5] = function() { return this.LDA(this.addrZeropage()); }; /* 0xa5, LDA Zeropage */
	this[0xa6] = function() { return this.LDX(this.addrZeropage()); }; /* 0xa6, LDX Zeropage */
	this[0xa7] = function() { return this.onInvalidOpcode(); };
	this[0xa8] = function() { return this.TAY_(this.addrNone()); }; /* 0xa8, TAY None */
	this[0xa9] = function() { return this.LDA(this.addrImmediate()); }; /* 0xa9, LDA Immediate */
	this[0xaa] = function() { return this.TAX_(this.addrNone()); }; /* 0xaa, TAX None */
	this[0xab] = function() { return this.onInvalidOpcode(); };
	this[0xac] = function() { return this.LDY(this.addrAbsolute()); }; /* 0xac, LDY Absolute */
	this[0xad] = function() { return this.LDA(this.addrAbsolute()); }; /* 0xad, LDA Absolute */
	this[0xae] = function() { return this.LDX(this.addrAbsolute()); }; /* 0xae, LDX Absolute */
	this[0xaf] = function() { return this.onInvalidOpcode(); };
	this[0xb0] = function() { return this.BCS(this.addrRelative()); }; /* 0xb0, BCS Relative */
	this[0xb1] = function() { return this.LDA(this.addrIndirectY()); }; /* 0xb1, LDA IndirectY */
	this[0xb2] = function() { return this.onInvalidOpcode(); };
	this[0xb3] = function() { return this.onInvalidOpcode(); };
	this[0xb4] = function() { return this.LDY(this.addrZeropageX()); }; /* 0xb4, LDY ZeropageX */
	this[0xb5] = function() { return this.LDA(this.addrZeropageX()); }; /* 0xb5, LDA ZeropageX */
	this[0xb6] = function() { return this.LDX(this.addrZeropageY()); }; /* 0xb6, LDX ZeropageY */
	this[0xb7] = function() { return this.onInvalidOpcode(); };
	this[0xb8] = function() { return this.CLV_(this.addrNone()); }; /* 0xb8, CLV None */
	this[0xb9] = function() { return this.LDA(this.addrAbsoluteY()); }; /* 0xb9, LDA AbsoluteY */
	this[0xba] = function() { return this.TSX_(this.addrNone()); }; /* 0xba, TSX None */
	this[0xbb] = function() { return this.onInvalidOpcode(); };
	this[0xbc] = function() { return this.LDY(this.addrAbsoluteX()); }; /* 0xbc, LDY AbsoluteX */
	this[0xbd] = function() { return this.LDA(this.addrAbsoluteX()); }; /* 0xbd, LDA AbsoluteX */
	this[0xbe] = function() { return this.LDX(this.addrAbsoluteY()); }; /* 0xbe, LDX AbsoluteY */
	this[0xbf] = function() { return this.onInvalidOpcode(); };
	this[0xc0] = function() { return this.CPY(this.addrImmediate()); }; /* 0xc0, CPY Immediate */
	this[0xc1] = function() { return this.CMP(this.addrIndirectX()); }; /* 0xc1, CMP IndirectX */
	this[0xc2] = function() { return this.onInvalidOpcode(); };
	this[0xc3] = function() { return this.onInvalidOpcode(); };
	this[0xc4] = function() { return this.CPY(this.addrZeropage()); }; /* 0xc4, CPY Zeropage */
	this[0xc5] = function() { return this.CMP(this.addrZeropage()); }; /* 0xc5, CMP Zeropage */
	this[0xc6] = function() { return this.DEC(this.addrZeropage()); }; /* 0xc6, DEC Zeropage */
	this[0xc7] = function() { return this.onInvalidOpcode(); };
	this[0xc8] = function() { return this.INY_(this.addrNone()); }; /* 0xc8, INY None */
	this[0xc9] = function() { return this.CMP(this.addrImmediate()); }; /* 0xc9, CMP Immediate */
	this[0xca] = function() { return this.DEX_(this.addrNone()); }; /* 0xca, DEX None */
	this[0xcb] = function() { return this.onInvalidOpcode(); };
	this[0xcc] = function() { return this.CPY(this.addrAbsolute()); }; /* 0xcc, CPY Absolute */
	this[0xcd] = function() { return this.CMP(this.addrAbsolute()); }; /* 0xcd, CMP Absolute */
	this[0xce] = function() { return this.DEC(this.addrAbsolute()); }; /* 0xce, DEC Absolute */
	this[0xcf] = function() { return this.onInvalidOpcode(); };
	this[0xd0] = function() { return this.BNE(this.addrRelative()); }; /* 0xd0, BNE Relative */
	this[0xd1] = function() { return this.CMP(this.addrIndirectY()); }; /* 0xd1, CMP IndirectY */
	this[0xd2] = function() { return this.onInvalidOpcode(); };
	this[0xd3] = function() { return this.onInvalidOpcode(); };
	this[0xd4] = function() { return this.onInvalidOpcode(); };
	this[0xd5] = function() { return this.CMP(this.addrZeropageX()); }; /* 0xd5, CMP ZeropageX */
	this[0xd6] = function() { return this.DEC(this.addrZeropageX()); }; /* 0xd6, DEC ZeropageX */
	this[0xd7] = function() { return this.onInvalidOpcode(); };
	this[0xd8] = function() { return this.CLD_(this.addrNone()); }; /* 0xd8, CLD None */
	this[0xd9] = function() { return this.CMP(this.addrAbsoluteY()); }; /* 0xd9, CMP AbsoluteY */
	this[0xda] = function() { return this.onInvalidOpcode(); };
	this[0xdb] = function() { return this.onInvalidOpcode(); };
	this[0xdc] = function() { return this.onInvalidOpcode(); };
	this[0xdd] = function() { return this.CMP(this.addrAbsoluteX()); }; /* 0xdd, CMP AbsoluteX */
	this[0xde] = function() { return this.DEC(this.addrAbsoluteX()); }; /* 0xde, DEC AbsoluteX */
	this[0xdf] = function() { return this.onInvalidOpcode(); };
	this[0xe0] = function() { return this.CPX(this.addrImmediate()); }; /* 0xe0, CPX Immediate */
	this[0xe1] = function() { return this.SBC(this.addrIndirectX()); }; /* 0xe1, SBC IndirectX */
	this[0xe2] = function() { return this.onInvalidOpcode(); };
	this[0xe3] = function() { return this.onInvalidOpcode(); };
	this[0xe4] = function() { return this.CPX(this.addrZeropage()); }; /* 0xe4, CPX Zeropage */
	this[0xe5] = function() { return this.SBC(this.addrZeropage()); }; /* 0xe5, SBC Zeropage */
	this[0xe6] = function() { return this.INC(this.addrZeropage()); }; /* 0xe6, INC Zeropage */
	this[0xe7] = function() { return this.onInvalidOpcode(); };
	this[0xe8] = function() { return this.INX_(this.addrNone()); }; /* 0xe8, INX None */
	this[0xe9] = function() { return this.SBC(this.addrImmediate()); }; /* 0xe9, SBC Immediate */
	this[0xea] = function() { return this.NOP_(this.addrNone()); }; /* 0xea, NOP None */
	this[0xeb] = function() { return this.onInvalidOpcode(); };
	this[0xec] = function() { return this.CPX(this.addrAbsolute()); }; /* 0xec, CPX Absolute */
	this[0xed] = function() { return this.SBC(this.addrAbsolute()); }; /* 0xed, SBC Absolute */
	this[0xee] = function() { return this.INC(this.addrAbsolute()); }; /* 0xee, INC Absolute */
	this[0xef] = function() { return this.onInvalidOpcode(); };
	this[0xf0] = function() { return this.BEQ(this.addrRelative()); }; /* 0xf0, BEQ Relative */
	this[0xf1] = function() { return this.SBC(this.addrIndirectY()); }; /* 0xf1, SBC IndirectY */
	this[0xf2] = function() { return this.onInvalidOpcode(); };
	this[0xf3] = function() { return this.onInvalidOpcode(); };
	this[0xf4] = function() { return this.onInvalidOpcode(); };
	this[0xf5] = function() { return this.SBC(this.addrZeropageX()); }; /* 0xf5, SBC ZeropageX */
	this[0xf6] = function() { return this.INC(this.addrZeropageX()); }; /* 0xf6, INC ZeropageX */
	this[0xf7] = function() { return this.onInvalidOpcode(); };
	this[0xf8] = function() { return this.SED_(this.addrNone()); }; /* 0xf8, SED None */
	this[0xf9] = function() { return this.SBC(this.addrAbsoluteY()); }; /* 0xf9, SBC AbsoluteY */
	this[0xfa] = function() { return this.onInvalidOpcode(); };
	this[0xfb] = function() { return this.onInvalidOpcode(); };
	this[0xfc] = function() { return this.onInvalidOpcode(); };
	this[0xfd] = function() { return this.SBC(this.addrAbsoluteX()); }; /* 0xfd, SBC AbsoluteX */
	this[0xfe] = function() { return this.INC(this.addrAbsoluteX()); }; /* 0xfe, INC AbsoluteX */
	this[0xff] = function() { return this.onInvalidOpcode(); };
};


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
	var handler;
	while(__vm__run) {
		if(this.NMI){
			handler = this.__handler__['NMI'];
			if(handler){
				handler.call(this.__handler_obj__, __video__nowY,this);
			}
		}
		if(this.IRQ){
			handler = this.__handler__['IRQ'];
			if(handler){
				handler.call(this.__handler_obj__, __video__nowY,this);
			}
		}
		handler = this.__handler__[__video__nowY];
		if(handler){
			handler.call(this.__handler_obj__, __video__nowY,this);
		}
		__vm__clockDelta = __vm__reservedClockDelta; __vm__reservedClockDelta = 0;
		++__video__nowY;
		__video__reservedClock += 341;
		__vm__clockDelta += (__video__reservedClock / 3) | 0;
		__video__reservedClock %= 3;
		this.__video__nowY = __video__nowY;
		this.__video__nowX = 0;
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
			__vm__run = false;
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
	var handler = this.__handler__['onReset'];
	if(handler){
		handler.call(this.__handler_obj__, 0, this);
	}
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
	var handler = this.__handler__['onReset'];
	if(handler){
		handler.call(this.__handler_obj__, 0, this);
	}
};
cycloa.ScriptMachine.prototype.onVBlank = function(){
};
cycloa.ScriptMachine.prototype.onIRQ = function(){
};
cycloa.ScriptMachine.prototype.read = function(addr) {
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	switch((sym & 0xE000) >> 13){
	case 0: /* 0x0000 -> 0x2000 */
		return __cpu__ram[addr & 0x7ff];
	case 1: /* 0x2000 -> 0x4000 */
		return this.__video__readReg(addr);
	case 2: /* 0x4000 -> 0x6000 */
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
			return (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			return (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			return 0;
//            return this.readMapperRegisterArea(addr);
		}
	case 3: /* 0x6000 -> 0x8000 */
		return 0;
	case 4: /* 0x8000 -> 0xA000 */
		return __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
	case 5: /* 0xA000 -> 0xC000 */
		return __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
	case 6: /* 0xC000 -> 0xE000 */
		return __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
	case 7: /* 0xE000 -> 0xffff */
		return __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
	}
};

cycloa.ScriptMachine.prototype.write = function(addr, val) {
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
   	switch((addr & 0xE000) >> 13) {
   	case 0: /* 0x0000 -> 0x2000 */
   		__cpu__ram[addr & 0x1fff] = val;
   		break;
   	case 1: /* 0x2000 -> 0x4000 */
   		this.__video__writeReg(addr, val);
   		break;
   	case 2: /* 0x4000 -> 0x6000 */
   		switch(addr & 0x1f) {
   		case 0x0:  /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */
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
   		case 0x1:  /* 4001h - APU Sweep Channel 1 (Rectangle) */
   			this.__rectangle0__sweepShiftAmount = val & 7;
   			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;
   			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;
   			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;
   			break;
   		case 0x2:  /* 4002h - APU Frequency Channel 1 (Rectangle) */
   			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);
   			break;
   		case 0x3:  /* 4003h - APU Length Channel 1 (Rectangle) */
   			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);
   			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[val >> 3];
   			/* Writing to the length registers restarts the length (obviously),
   			   and also restarts the duty cycle (channel 1,2 only), */
   			this.__rectangle0__dutyCounter = 0;
   			/* and restarts the decay volume (channel 1,2,4 only). */
   			this.__rectangle0__decayReloaded = true;
   			break;
   		case 0x4:  /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */
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
   		case 0x5:  /* 4005h - APU Sweep Channel 2 (Rectangle) */
   			this.__rectangle1__sweepShiftAmount = val & 7;
   			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;
   			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;
   			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;
   			break;
   		case 0x6:  /* 4006h - APU Frequency Channel 2 (Rectangle) */
   			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);
   			break;
   		case 0x7:  /* 4007h - APU Length Channel 2 (Rectangle) */
   			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);
   			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[val >> 3];
   			/* Writing to the length registers restarts the length (obviously),
   			   and also restarts the duty cycle (channel 1,2 only), */
   			this.__rectangle1__dutyCounter = 0;
   			/* and restarts the decay volume (channel 1,2,4 only). */
   			this.__rectangle1__decayReloaded = true;
   			break;
   		case 0x8:  /* 4008h - APU Linear Counter Channel 3 (Triangle) */
   			this.__triangle__enableLinearCounter = ((val & 128) == 128);
   			this.__triangle__linearCounterBuffer = val & 127;
   			break;
   		case 0x9:  /* 4009h - APU N/A Channel 3 (Triangle) */
   			/* unused */
   			break;
   		case 0xA:  /* 400Ah - APU Frequency Channel 3 (Triangle) */
   			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;
   			break;
   		case 0xB:  /* 400Bh - APU Length Channel 3 (Triangle) */
   			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);
   			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[val >> 3];
   			/* Side effects 	Sets the halt flag */
   			this.__triangle__haltFlag = true;
   			break;
   		case 0xC:  /* 400Ch - APU Volume/Decay Channel 4 (Noise) */
   			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;
   			this.__noize__decayEnabled = (val & 16) == 0;
   			this.__noize__loopEnabled = (val & 32) == 32;
   			break;
   		case 0xd:  /* 400Dh - APU N/A Channel 4 (Noise) */
   			/* unused */
   			break;
   		case 0xe:  /* 400Eh - APU Frequency Channel 4 (Noise) */
   			this.__noize__modeFlag = (val & 128) == 128;
   			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];
   			break;
   		case 0xF: /* 400Fh - APU Length Channel 4 (Noise) */
   			/* Writing to the length registers restarts the length (obviously), */
   			this.__noize__lengthCounter = this.__audio__LengthCounterConst[val >> 3];
   			/* and restarts the decay volume (channel 1,2,4 only). */
   			this.__noize__decayReloaded = true;
   			break;
   			/* ------------------------------------ DMC ----------------------------------------------------- */
   		case 0x10:  /* 4010h - DMC Play mode and DMA frequency */
   			this.__digital__irqEnabled = (val & 128) == 128;
   			if(!this.__digital__irqEnabled){
				this.IRQ &= 253;
   			}
   			this.__digital__loopEnabled = (val & 64) == 64;
   			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];
   			break;
   		case 0x11:  /* 4011h - DMC Delta counter load register */
   			this.__digital__deltaCounter = val & 0x7f;
   			break;
   		case 0x12:  /* 4012h - DMC address load register */
   			this.__digital__sampleAddr = 0xc000 | (val << 6);
   			break;
   		case 0x13:  /* 4013h - DMC length register */
   			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;
   			break;
   		case 0x14: /* 4014h execute Sprite DMA */
   			/** @type {number} uint16_t */
   			var __audio__dma__addrMask = val << 8;
   			var __video__spRam = this.__video__spRam;
   			var __video__spriteAddr = this.__video__spriteAddr;
   			for(var i=0;i<256;++i){
   				__video__spRam[(__video__spriteAddr+i) & 0xff] = this.read(__audio__dma__addrmask | i)
   			}
   			__vm__clockDelta += 512;
   			break;
   			/* ------------------------------ CTRL -------------------------------------------------- */
   		case 0x15:  /* __audio__analyzeStatusRegister */
   			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;
   			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;
   			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }
   			if(!(val & 8)) this.__noize__lengthCounter = 0;
   			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}
   			break;
   		case 0x16:
   			if((val & 1) === 1){
   				this.__pad__pad1Idx = 0;
   				this.__pad__pad2Idx = 0;
   			}
   			break;
   		case 0x17:  /* __audio__analyzeLowFrequentryRegister */
   			/* Any write to $4017 resets both the frame counter, and the clock divider. */
   			if(val & 0x80) {
   				this.__audio__isNTSCmode = false;
   				this.__audio__frameCnt = 1786360;
   				this.__audio__frameIRQCnt = 4;
   			}else{
   				this.__audio__isNTSCmode = true;
   				this.__audio__frameIRQenabled = true;
   				this.__audio__frameCnt = 1786360;
   				this.__audio__frameIRQCnt = 3;
   			}
   			if((val & 0x40) === 0x40){
   				this.__audio__frameIRQenabled = false;
				this.IRQ &= 254;
   			}
   			break;
   		default:
   			/* this.writeMapperRegisterArea(addr, val); */
   			break;
		}
		break;
   		case 3: /* 0x6000 -> 0x8000 */
   			break;
   		case 4: /* 0x8000 -> 0xA000 */
			__cpu__rom[(addr>>10) & 31][addr & 0x3ff] = val;
   			break;
   		case 5: /* 0xA000 -> 0xC000 */
			__cpu__rom[(addr>>10) & 31][addr & 0x3ff] = val;
   			break;
   		case 6: /* 0xC000 -> 0xE000 */
			__cpu__rom[(addr>>10) & 31][addr & 0x3ff] = val;
   			break;
   		case 7: /* 0xE000 -> 0xffff */
			__cpu__rom[(addr>>10) & 31][addr & 0x3ff] = val;
   			break;
   		}
};

cycloa.ScriptMachine.prototype.load = function(script) {
	this.__handler__ = {};
	this.__handler_obj__ = {};
	for(var i=0;i<32;++i){
		this.__cpu__rom[i] = new Uint8Array(1024);
	}
	for(var i=0;i<this.__video__pattern.length; ++i){
		this.__video__pattern[i] = new Uint8Array(512);
	}
	this.__video__changeMirrorType(2);
	eval(script);
};

cycloa.ScriptMachine.prototype.registerHandler = function(e, func) {
	this.__handler__[e] = func;
}

cycloa.ScriptMachine.prototype.removeHandler = function(e) {
	delete this.__handler__[e];
}

cycloa.ScriptMachine.prototype.invokeScript = function(scanline) {
}


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
		this.__video__pattern[(addr >> 9) & 0xf][addr & 0x1ff] = value;
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
	this.IRQ &= 253;	this.__digital__loopEnabled = false;
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



cycloa.ScriptMachine.prototype.loadAsciiChr = function(){
	this.write(0x2006, 0x00);
	this.write(0x2006, 0x00);
	for(var i=0;i<this.ASCII_CHR.length;++i){
		this.write(0x2007, this.ASCII_CHR[i]);
	}
};

cycloa.ScriptMachine.prototype.ASCII_CHR = new Uint8Array([
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x18,0x18,0x18,0x18,0x18,0x00,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x14,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x28,0x7c,0x28,0x28,0x7c,0x28,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0x3f,0x3f,0x7e,0x2a,0x3f,0x7c,0x28,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x02,0x44,0x3f,0x3f,0x52,0x25,0x45,0x3f,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x18,0x24,0x28,0x18,0x1a,0x26,0x3a,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x08,0x10,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x0c,0x10,0x30,0x20,0x30,0x18,0x0c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x18,0x0c,0x06,0x02,0x02,0x06,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x08,0x49,0x3e,0x08,0x14,0x22,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x08,0x08,0x7e,0x08,0x08,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x00,0x00,0x00,0x10,0x10,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x00,0x7e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x00,0x00,0x00,0x00,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x08,0x08,0x10,0x10,0x20,0x20,0x40,0x40,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0xc4,0x84,0x3f,0x3f,0x3f,0x6c,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x64,0x04,0x04,0x08,0x18,0x30,0x3e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0x04,0x04,0x3c,0x34,0x04,0x04,0x7c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x18,0x18,0x28,0x68,0x7e,0x08,0x08,0x08,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7e,0x40,0x40,0x7c,0x04,0x04,0x04,0x7c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x1c,0x34,0x20,0x20,0x3c,0x24,0x24,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3e,0x22,0x22,0x22,0x06,0x04,0x04,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3e,0x26,0x2c,0x38,0x6c,0x44,0x7c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x38,0x6c,0x4c,0x4c,0x3c,0x08,0x08,0x08,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x10,0x00,0x00,0x00,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x08,0x00,0x00,0x00,0x08,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x0c,0x10,0x20,0x60,0x38,0x0c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x3e,0x00,0x00,0x3e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x30,0x1c,0x04,0x06,0x0e,0x38,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3e,0x22,0x1e,0x10,0x10,0x10,0x00,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x42,0x3f,0x3f,0x3f,0x3f,0x46,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x08,0x18,0x38,0x28,0x6c,0x7c,0x46,0x42,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3e,0x22,0x2e,0x38,0x2e,0x22,0x22,0x3e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x1c,0x26,0x20,0x20,0x20,0x3e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x7c,0x44,0x44,0x44,0x4c,0x3f,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x3e,0x20,0x3c,0x20,0x20,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x3e,0x20,0x20,0x3c,0x20,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x3e,0x20,0x6c,0x46,0x66,0x3a,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x42,0x42,0x42,0x7e,0x42,0x42,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x38,0x10,0x10,0x10,0x10,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x3e,0x08,0x08,0x08,0x58,0x70,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x26,0x2c,0x38,0x38,0x2c,0x22,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x20,0x20,0x20,0x20,0x20,0x3e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x76,0x36,0x36,0x3e,0x2a,0x62,0x03,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x32,0x32,0x3a,0x2a,0x2e,0x26,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x3e,0x22,0x62,0x42,0x6e,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0x44,0x44,0x7c,0x40,0x40,0x40,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0xc4,0x84,0x3f,0x3f,0x3f,0x3f,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3e,0x22,0x22,0x22,0x3e,0x2c,0x26,0x22,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0x46,0x42,0x7c,0x04,0x3f,0x3f,0x3f,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7e,0x10,0x10,0x10,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x42,0x42,0x42,0x46,0x44,0x64,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x42,0x62,0x26,0x24,0x34,0x18,0x18,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3f,0x3f,0x3f,0x6a,0x6a,0x6e,0x26,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x42,0x46,0x64,0x2c,0x38,0x1c,0x36,0x62,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3f,0x3f,0x6c,0x28,0x18,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7f,0x03,0x06,0x0c,0x18,0x10,0x60,0x3f,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x1c,0x10,0x10,0x10,0x10,0x10,0x10,0x1c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x40,0x60,0x20,0x30,0x18,0x08,0x04,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x04,0x04,0x04,0x04,0x04,0x04,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x08,0x14,0x22,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x1f,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x10,0x08,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x78,0xcc,0x8c,0x3f,0x3f,0x36,0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x20,0x20,0x38,0x28,0x2c,0x24,0x78,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x38,0x68,0x40,0x40,0x60,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x04,0x04,0x3c,0x2c,0x2c,0x28,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x64,0x44,0x5c,0x40,0x60,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x1c,0x14,0x10,0x3c,0x10,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x44,0x44,0x7c,0x04,0x04,0x0c,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x10,0x10,0x1e,0x12,0x12,0x12,0x12,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x10,0x00,0x10,0x10,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x04,0x00,0x04,0x04,0x0c,0x78,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x20,0x28,0x30,0x30,0x28,0x24,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x10,0x10,0x10,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x2a,0x55,0x55,0x15,0x15,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x10,0x1e,0x12,0x12,0x12,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x3e,0x62,0x42,0x42,0x44,0x7c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x22,0x26,0x24,0x38,0x20,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x38,0x48,0x48,0x78,0x08,0x08,0x08,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x2c,0x38,0x20,0x20,0x20,0x20,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x0c,0x10,0x10,0x1c,0x04,0x24,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x08,0x28,0x3c,0x08,0x0c,0x06,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x12,0x12,0x12,0x12,0x1e,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x22,0x24,0x28,0x28,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x54,0x54,0x54,0x54,0x7e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x64,0x2c,0x18,0x38,0x6c,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x32,0x1c,0x04,0x0c,0x08,0x38,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x00,0x00,0x1e,0x06,0x0c,0x18,0x12,0x1e,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3c,0x20,0x20,0x20,0x60,0x20,0x20,0x3c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x7c,0x04,0x04,0x04,0x06,0x04,0x04,0x7c,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x15,0x2a,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
	0x3f,0x3f,0x3f,0x3f,0x3f,0x3f,0x3f,0x3f,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
]);
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * @constructor
 * */
function VideoFairy() {
	this.screen_ = document.getElementById('nes_screen');
	this.zoomed_ = false;
	this.ctx_ = this.screen_.getContext('2d');
	this.image_ = this.ctx_.createImageData(256, 240);
	this.palette_ = cycloa.NesPalette;
	this.prevBuffer_ = new Uint8Array(256*240);
	for (var i = 0; i < 256 * 240; ++i) {
		this.image_.data[(i << 2) + 3] = 0xff;
	}
}
VideoFairy.prototype.__proto__ = cycloa.AbstractVideoFairy.prototype;
VideoFairy.prototype.dispatchRendering = function (/* const uint8_t*/ nesBuffer, /* const uint8_t */ paletteMask) {
	var dat = this.image_.data;
	var palette = this.palette_;
	var prevBuffer = this.prevBuffer_;
	var pixel;
	for (var i = 0; i < 61440 /* = 256*240 */; ++i) {
		//TODO: 最適化
		pixel = nesBuffer[i] & paletteMask;
		if(pixel != prevBuffer[i]){
			var idx = i << 2, color = palette[pixel];
			dat[idx    ] = (color >> 16) & 0xff;
			dat[idx + 1] = (color >> 8) & 0xff;
			dat[idx + 2] = color & 0xff;
			prevBuffer[i] = pixel;
		}
	}
	this.ctx_.putImageData(this.image_, 0, 0);
};
VideoFairy.prototype.recycle = function(){
	this.ctx_.fillStyle="#000000";
	this.ctx_.fillRect(0, 0, 256, 240);
	var prevBuffer = this.prevBuffer_;
	for(var i=0;i < 240*256; ++i){
		prevBuffer[i] = 0xff;
	}
};
VideoFairy.prototype.zoom = function(){
	if(this.zoomed_){
		$("#nes_screen").animate({width: 256, height: 240});
	}else{
		$("#nes_screen").animate({width: 512, height: 480});
	}
	this.zoomed_ = !this.zoomed_;
};
/**
 * @constructor
 * */
function AudioFairy() {
	this.SAMPLE_RATE_ = 22050;
	this.dataLength = (this.SAMPLE_RATE_ / 4) | 0;
	this.enabled = false;
	var audioContext = window.AudioContext;
	if (audioContext) {
		this.enabled = true;
		this.context_ = new audioContext();
		this.dataIndex = 0;
		this.initBuffer = function () {
			this.buffer_ = this.context_.createBuffer(1, this.dataLength, this.SAMPLE_RATE_);
			this.data = this.buffer_.getChannelData(0);
		};
		this.onDataFilled = function () {
			var src = this.context_.createBufferSource();
			src.loop = false;
			src.connect(this.context_.destination);
			src.buffer = this.buffer_;
			src.start(0);
			this.initBuffer();
			this.dataIndex = 0;
		};
		this.initBuffer();
	}else{
		log.info("Audio is not available");
	}
}

AudioFairy.prototype.__proto__ = cycloa.AbstractAudioFairy.prototype;
AudioFairy.prototype.recycle = function(){
	this.dataIndex = 0;
};
/**
 * @constructor
 * */
function PadFairy($dom) {
	this.state = 0;
	var self = this;
	$dom.bind("keydown", function(e){
		switch (e.keyCode) {
			case 38:
				self.state |= self.MASK_UP;
				e.preventDefault();
				break;
			case 40:
				self.state |= self.MASK_DOWN;
				e.preventDefault();
				break;
			case 37:
				self.state |= self.MASK_LEFT;
				e.preventDefault();
				break;
			case 39:
				self.state |= self.MASK_RIGHT;
				e.preventDefault();
				break;
			case 90:
				self.state |= self.MASK_A;
				e.preventDefault();
				break;
			case 88:
				self.state |= self.MASK_B;
				e.preventDefault();
				break;
			case 32:
				self.state |= self.MASK_SELECT;
				e.preventDefault();
				break;
			case 13:
				self.state |= self.MASK_START;
				e.preventDefault();
				break;
		}
	});
	$dom.bind("keyup", function(e){
		switch (e.keyCode) {
			case 38:
				self.state &= ~self.MASK_UP;
				e.preventDefault();
				break;
			case 40:
				self.state &= ~self.MASK_DOWN;
				e.preventDefault();
				break;
			case 37:
				self.state &= ~self.MASK_LEFT;
				e.preventDefault();
				break;
			case 39:
				self.state &= ~self.MASK_RIGHT;
				e.preventDefault();
				break;
			case 90:
				self.state &= ~self.MASK_A;
				e.preventDefault();
				break;
			case 88:
				self.state &= ~self.MASK_B;
				e.preventDefault();
				break;
			case 32:
				self.state &= ~self.MASK_SELECT;
				e.preventDefault();
				break;
			case 13:
				self.state &= ~self.MASK_START;
				e.preventDefault();
				break;
		}
	});
}
PadFairy.prototype.__proto__ = cycloa.AbstractPadFairy.prototype;
/**
 * @constructor
 * */
PadFairy.prototype.recycle = function(){
	this.state = 0;
};
cycloa.calc_fps_mode = true;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
	if(cycloa.calc_fps_mode){
		return function(callback){
			window.setTimeout(callback, 0);
		};
	}
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * @constructor
 * */
function NesController(){
	this.videoFairy_ = new VideoFairy();
	this.audioFairy_ = new AudioFairy();
	this.padFairy_ = new PadFairy($("#nes_screen"));
	this.machine_ = new cycloa.ScriptMachine(this.videoFairy_, this.audioFairy_, this.padFairy_);
	this.running_ = false;
	this.loaded_ = false;
	this.total_frame_ = 0;
}
NesController.prototype.load = function(dat){
	this.machine_.load(dat);
	if(!this.loaded_){
		this.machine_.onHardReset();
	}else{
		this.machine_.onReset();
	}
	this.loaded_ = true;
	if(!this.running_){
		this.start();
	}
	return true;
};
NesController.prototype.start = function(){
	if(this.running_){
		$("#state").text("VM already running! Please stop the machine before loading another script.");
		return false;
	}
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a script.");
		return false;
	}
	this.running_ = true;
	var self = this;
	var cnt = 0;
	var state = $("#state");
	var loop = function () {
		if(self.running_) window.requestAnimFrame(loop);
		self.machine_.run();
		cnt++;
		if (cnt >= 30) {
			var now = new Date();
			self.total_frame_ += cnt;
			var str = "fps: " + (cnt * 1000 / (now - beg)).toFixed(2);
			if(cycloa.calc_fps_mode){
				str += " / avg: "+(self.total_frame_ * 1000/(now-startTime)).toFixed(2);
			}
			state.text(str);
			beg = now;
			cnt = 0;
		}
	};
	var beg = new Date();
	var startTime = beg
	loop();
	return true;
};
NesController.prototype.stop = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running_ = false;
	return true;
};
NesController.prototype.hardReset = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine_.onHardReset();
	return true;
};
NesController.prototype.reset = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine_.onReset();
	return true;
};
NesController.prototype.zoom = function(){
	this.videoFairy_.zoom();
};

var nesController;

(function(){
	$(document).ready(function(){
		$("#nes_hardreset").bind("click", function(){nesController.hardReset();});
		$("#nes_reset").bind("click", function(){nesController.reset();});
		$("#nes_stop").bind("click", function(){
			if(nesController.stop()){
				$("#nes_start").removeClass("disable");
				$("#nes_stop").addClass("disable");
			}
		});
		var editor;
		$.ajax({
			url: 'script/sample.js',
			dataType: 'text',
			success: function(data, dataType) {
				$("#editor").text(data);
				editor = ace.edit("editor");
				editor.setTheme("ace/theme/twilight");
				editor.getSession().setMode("ace/mode/javascript");
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				$("#state").text("Oops. failed to load sample script. code:"+textStatus);
			}
		});
		
		$("#nes_start").bind("click", function(){
			if(nesController.load(editor.getValue())) {
				$("#nes_stop").removeClass("disable");
				$("#nes_start").addClass("disable");
			}
		});

		$("#screen_zoom").bind("click", function(){
			nesController.zoom();
		});

		$("#nes_stop").addClass("disable");
		$("#nes_start").removeClass("disable");

		nesController = new NesController();
		$("#state").text("Initialized.");
	});
}());
