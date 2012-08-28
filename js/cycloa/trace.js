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


