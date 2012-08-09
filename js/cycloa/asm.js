"use strict";

var cycloa;
if(!cycloa) cycloa = new Object;
/**
 * アセンブラに関する定数などのための名前空間
 * @type {Object}
 * @namespace
 */
if(!cycloa.asm) cycloa.asm = new Object;
/**
 * オペコード一覧
 * @const
 * @type {Object}
 * @enum {Number}
 */
cycloa.asm.opcode = {
	LDA:0,
	LDX:1,
	LDY:2,
	STA:3,
	STX:4,
	STY:5,
	TAX:6,
	TAY:7,
	TSX:8,
	TXA:9,
	TXS:10,
	TYA:11,
	ADC:12,
	AND:13,
	ASL:14,
	BIT:15,
	CMP:16,
	CPX:17,
	CPY:18,
	DEC:19,
	DEX:20,
	DEY:21,
	EOR:22,
	INC:23,
	INX:24,
	INY:25,
	LSR:26,
	ORA:27,
	ROL:28,
	ROR:29,
	SBC:30,
	PHA:31,
	PHP:32,
	PLA:33,
	PLP:34,
	CLC:35,
	CLD:36,
	CLI:37,
	CLV:38,
	SEC:39,
	SED:40,
	SEI:41,
	BRK:42,
	NOP:43,
	RTS:44,
	RTI:45,
	JMP:46,
	JSR:47,
	BCC:48,
	BCS:49,
	BEQ:50,
	BMI:51,
	BNE:52,
	BPL:53,
	BVC:54,
	BVS:55
};
/**
 * @const
 * @type {String[]}
 */
cycloa.asm.opcode_sym = [
	'LDA',
	'LDX',
	'LDY',
	'STA',
	'STX',
	'STY',
	'TAX',
	'TAY',
	'TSX',
	'TXA',
	'TXS',
	'TYA',
	'ADC',
	'AND',
	'ASL',
	'BIT',
	'CMP',
	'CPX',
	'CPY',
	'DEC',
	'DEX',
	'DEY',
	'EOR',
	'INC',
	'INX',
	'INY',
	'LSR',
	'ORA',
	'ROL',
	'ROR',
	'SBC',
	'PHA',
	'PHP',
	'PLA',
	'PLP',
	'CLC',
	'CLD',
	'CLI',
	'CLV',
	'SEC',
	'SED',
	'SEI',
	'BRK',
	'NOP',
	'RTS',
	'RTI',
	'JMP',
	'JSR',
	'BCC',
	'BCS',
	'BEQ',
	'BMI',
	'BNE',
	'BPL',
	'BVC',
	'BVS'
];
/**
 * アドレッシングモード一覧
 * @type {Object}
 * @const
 * @enum {Number}
 */
cycloa.asm.addr_mode = {
	None:0,
	Immediate:1,
	ZeroPage:2,
	ZeroPageX:3,
	ZeroPageY:4,
	Absolute:5,
	AbsoluteX:6,
	AbsoluteY:7,
	Indirect:8,
	IndirectX:9,
	IndirectY:10,
	Relative:11
};
/**
 * @const
 * @type {String[]}
 */
cycloa.asm.addr_mode_sym = [
	undefined,
	'  Imm',
	' Zero',
	'ZeroX',
	'ZeroY',
	'  Abs',
	' AbsX',
	' AbsY',
	'  Ind',
	' IndX',
	' IndY',
	'  Rel'
];
/**
 * アドレッシングモードごとのオペランドバイト数の一覧
 * @type {Object}
 * @const
 */
cycloa.asm.operand_size = {
	None:0,
	Immediate:1,
	ZeroPage:1,
	ZeroPageX:1,
	ZeroPageY:1,
	Absolute:2,
	AbsoluteX:2,
	AbsoluteY:2,
	Indirect:2,
	IndirectX:1,
	IndirectY:1,
	Relative:1
};

/**
 *
 * @type {Function[]}
 */
cycloa.asm.addr_decoder = [
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr){ /* NONE */
		return undefined;
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* Immediate */
		return (pr.PC+1) & 0xffff;
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* ZeroPage */
		return pr.read(pr.PC+1);
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* ZeroPageX */
		return (pr.read(pr.PC+1) + pr.X) & 0xff;
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) {  /* ZeroPageY */
		return (pr.read(pr.PC+1) + pr.Y) & 0xff;
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* Absolute */
		return pr.read(pr.PC+1) | (pr.read(pr.PC+2) << 8);
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* AbsoluteX */
		return ((pr.read(pr.PC+1) | (pr.read(pr.PC+2) << 8)) + pr.X) & 0xffff;
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* AbsoluteY */
		return (pr.read(pr.PC+1) | (pr.read(pr.PC+2) << 8) + pr.Y) & 0xffff;
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* Indirect */ // used only in JMP
		/** @const
		 *  @type {Number} */
		var srcAddr = pr.read(pr.PC+1) | (pr.read(pr.PC+2) << 8);
		return pr.read(srcAddr) | (pr.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* IndirectX */
		/** @const
		 *  @type {Number} */
		var idx = (pr.read(pr.PC+1) + pr.X) & 0xff;
		return pr.read(idx) | (pr.read((idx+1)&0xff) << 8);
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* IndirectY */
		/** @const
		 *  @type {Number} */
		var idx = pr.read(pr.PC+1);
		return ((pr.read(idx) | (pr.read((idx+1)&0xff) << 8))+pr.Y);
	},
	/**
	 * @param {cycloa.core.Processor} pr
	 * @nosideeffects
	 * @return {Number}
	 */
	function(pr) { /* Relative */
		/** @const
		 *  @type {Number} */
		var offset = pr.read(pr.PC+1);
		return ((offset >= 128 ? (offset-256) : offset) + pr.PC) & 0xffff;
	}
];

/**
 * 命令デコードテーブル
 * @type {Object[]}
 * @const
 */
cycloa.asm.decode_table = [
	{'opcode':cycloa.asm.opcode.BRK, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.ASL, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.PHP, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.ASL, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.ASL, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BPL, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.ASL, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	undefined,
	{'opcode':cycloa.asm.opcode.CLC, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ORA, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.ASL, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	undefined,
	{'opcode':cycloa.asm.opcode.JSR, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.BIT, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.ROL, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.PLP, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.ROL, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.BIT, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.ROL, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BMI, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.ROL, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	undefined,
	{'opcode':cycloa.asm.opcode.SEC, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.AND, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.ROL, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	undefined,
	{'opcode':cycloa.asm.opcode.RTI, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.LSR, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.PHA, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.LSR, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.JMP, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.LSR, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BVC, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.LSR, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	undefined,
	{'opcode':cycloa.asm.opcode.CLI, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.EOR, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.LSR, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	undefined,
	{'opcode':cycloa.asm.opcode.RTS, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.ROR, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.PLA, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.ROR, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.JMP, 'addr_mode':cycloa.asm.addr_mode.Indirect, 'operand_size':cycloa.asm.operand_size.Indirect},
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.ROR, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BVS, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.ROR, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	undefined,
	{'opcode':cycloa.asm.opcode.SEI, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.ADC, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.ROR, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.STY, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.STX, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.DEY, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.TXA, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.STY, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.STX, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BCC, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.STY, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.STX, 'addr_mode':cycloa.asm.addr_mode.ZeroPageY, 'operand_size':cycloa.asm.operand_size.ZeroPageY},
	undefined,
	{'opcode':cycloa.asm.opcode.TYA, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	{'opcode':cycloa.asm.opcode.TXS, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.STA, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.LDY, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	{'opcode':cycloa.asm.opcode.LDX, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	undefined,
	{'opcode':cycloa.asm.opcode.LDY, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.LDX, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.TAY, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.TAX, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.LDY, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.LDX, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BCS, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.LDY, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.LDX, 'addr_mode':cycloa.asm.addr_mode.ZeroPageY, 'operand_size':cycloa.asm.operand_size.ZeroPageY},
	undefined,
	{'opcode':cycloa.asm.opcode.CLV, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	{'opcode':cycloa.asm.opcode.TSX, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.LDY, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.LDA, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.LDX, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	{'opcode':cycloa.asm.opcode.CPY, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.CPY, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.DEC, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.INY, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.DEX, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.CPY, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.DEC, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BNE, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.DEC, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	undefined,
	{'opcode':cycloa.asm.opcode.CLD, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.CMP, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.DEC, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	undefined,
	{'opcode':cycloa.asm.opcode.CPX, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.IndirectX, 'operand_size':cycloa.asm.operand_size.IndirectX},
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.CPX, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	{'opcode':cycloa.asm.opcode.INC, 'addr_mode':cycloa.asm.addr_mode.ZeroPage, 'operand_size':cycloa.asm.operand_size.ZeroPage},
	undefined,
	{'opcode':cycloa.asm.opcode.INX, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.Immediate, 'operand_size':cycloa.asm.operand_size.Immediate},
	{'opcode':cycloa.asm.opcode.NOP, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	undefined,
	{'opcode':cycloa.asm.opcode.CPX, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	{'opcode':cycloa.asm.opcode.INC, 'addr_mode':cycloa.asm.addr_mode.Absolute, 'operand_size':cycloa.asm.operand_size.Absolute},
	undefined,
	{'opcode':cycloa.asm.opcode.BEQ, 'addr_mode':cycloa.asm.addr_mode.Relative, 'operand_size':cycloa.asm.operand_size.Relative},
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.IndirectY, 'operand_size':cycloa.asm.operand_size.IndirectY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	{'opcode':cycloa.asm.opcode.INC, 'addr_mode':cycloa.asm.addr_mode.ZeroPageX, 'operand_size':cycloa.asm.operand_size.ZeroPageX},
	undefined,
	{'opcode':cycloa.asm.opcode.SED, 'addr_mode':cycloa.asm.addr_mode.None, 'operand_size':cycloa.asm.operand_size.None},
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.AbsoluteY, 'operand_size':cycloa.asm.operand_size.AbsoluteY},
	undefined,
	undefined,
	undefined,
	{'opcode':cycloa.asm.opcode.SBC, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	{'opcode':cycloa.asm.opcode.INC, 'addr_mode':cycloa.asm.addr_mode.AbsoluteX, 'operand_size':cycloa.asm.operand_size.AbsoluteX},
	null
];

/**
 * @nosideeffects
 * @param {Number} num
 * @param {Number} len
 * @return {String}
 */
cycloa.asm.formatHex = function(num, len){
	return ("0000" + num.toString(16).toUpperCase()).slice(-(len/4));
};

/**
 *
 * @param {cycloa.core.Processor} pr
 * @param {Number} addr
 * @param {Number} inst
 * @return {String}
 */
cycloa.asm.formatInst = function(pr, addr, inst){
	var bin = inst.bin;

	var bin_str = "";
	for(var i=0; i<3; ++i){
		bin_str += i < bin.length ? cycloa.asm.formatHex(bin[i],8) +" " : "   ";
	}
	var opsym = inst.info ? cycloa.asm.opcode_sym[inst.info.opcode] : '???';

	var addrsym="";
	if(inst.info && inst.info.addr_mode !== cycloa.asm.addr_mode.None){
		var addr_mode = inst.info.addr_mode;
		var _addr = cycloa.asm.addr_decoder[addr_mode](pr);
		var _val = pr.read(_addr);
		addrsym =
				cycloa.asm.addr_mode_sym[addr_mode]+" "+
				("    " + cycloa.asm.formatHex(inst.operand_value, inst.info.operand_size*8)).slice(-4)+
				" => "+cycloa.asm.formatHex(_addr, 16)+" => "+cycloa.asm.formatHex(_val, 8);
	}
	var opstr = cycloa.asm.formatHex(addr, 16)+" "+bin_str+"  "+opsym+" "+addrsym;
	var regstr = "";
	regstr +=   "A: "+cycloa.asm.formatHex(pr.A, 8);
	regstr +=  " X: "+cycloa.asm.formatHex(pr.X, 8);
	regstr +=  " Y: "+cycloa.asm.formatHex(pr.Y, 8);
	regstr +=  " P: "+cycloa.asm.formatHex(pr.P, 8);
	regstr += " SP: "+cycloa.asm.formatHex(pr.SP, 8);
	return (opstr+"                                             ").slice(0,50)+regstr;
};

/**
 *
 * @param {Uint8Array} code
 * @param {Number} addr
 * @param {Number} [baseaddr = 0]
 * @return {Object}
 */
cycloa.asm.decode = function(code, addr, baseaddr){
	baseaddr |= 0;
	var offset = addr - baseaddr;
	var opcode = code[offset];
	if(opcode === undefined) throw new cycloa.err.CoreException("Invalid offset: 0x"+offset.toString(16)+" of 0x"+code.length.toString(16));
	var info = cycloa.asm.decode_table[opcode];

	var operand_value = undefined;
	var bin = undefined;

	if (info) {
		for(var i=0; i<info.operand_size; ++i){
			operand_value |= (code[offset+i+1] << (8*i));
		}
		if (info.addr_mode === cycloa.asm.addr_mode.Relative) {
			operand_value = operand_value >= 128 ? operand_value - 256 : operand_value;
		}
		bin = code.subarray(offset, offset+1+info.operand_size);
	}else{
		bin = code.subarray(offset, offset+1);
	}

	return {
		info: info,
		bin: bin,
		operand_value: operand_value
	};
};
