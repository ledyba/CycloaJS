"use strict";
var cycloa;
if(!cycloa) cycloa = {};
if(!cycloa.core) cycloa.core = {};

/**
 * @extends cycloa.core.ProcessorSpirit
 * @class
 * @constructor
 */
cycloa.core.InterpreterSpirit = function(){
	cycloa.core.ProcessorSpirit.apply(this);
};

cycloa.core.InterpreterSpirit.prototype = {
	/**
	 * @const
	 * @type {*}
	 * @private
	 */
	__proto__: cycloa.core.ProcessorSpirit.prototype,
	/**
	 *
	 * @override cycloa.core.ProcessorSpirit.run
	 */
	run: function(){
		/** @const
		 * @type {Number} */
		var opcode = this.p.read(this.p.PC++);
		/**
		 * @const
		 * @type {Function}
		 */
		var func = cycloa.core.InterpreterSpirit.OperationTable[opcode];
		if(!func){
			throw new cycloa.exc.CoreException("Unknwon opcode: "+opcode);
		}
		func.call(this);
	},
	/**@private
	 * @function
	 * @param {Number} val */
	push: function(val) {
		this.p.write(0x0100 | ((this.p.SP--) & 0xff), val);
	},
	/**@private
	 * @function
	 * @return {Number} */
	pop: function() {
		return this.p.read(0x0100 | ((this.p.SP++) & 0xff));
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrImmediate: function() {
		return this.p.PC++;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsolute: function() {
		return this.p.read(this.p.PC++) | (this.p.read(this.p.PC++) << 8);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPage: function() {
		return this.p.read(this.p.PC++);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPageIdxX: function() {
		return (this.p.read(this.p.PC++) + this.p.X) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPageIdxY: function() {
		return (this.p.read(this.p.PC++) + this.p.Y) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIdxX: function() {
		/** @const
		 *  @type {Number} */
		var orig = this.p.read(this.p.PC++) | (this.p.read(this.p.PC++) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.p.X;
		if(((addr ^ orig) & 0x0100) != 0){
			this.p.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIdxY: function() {
		/** @const
		 *  @type {Number} */
		var orig = this.p.read(this.p.PC++) | (this.p.read(this.p.PC++) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.p.Y;
		if(((addr ^ orig) & 0x0100) != 0){
			this.p.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrRelative: function() {
		/** @const
		 *  @type {Number} */
		var offset = this.p.read(this.p.PC++);
		return (offset >= 128 ? (offset-256) : offset) + this.p.PC;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrIndirectX: function() {
		/** @const
		 *  @type {Number} */
		var idx = (this.p.read(this.p.PC++) + this.p.X) & 0xff;
		return this.p.read(idx) | (this.p.read((idx+1)&0xff) << 8);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrIndirectY: function() {
		/** @const
		 *  @type {Number} */
		var idx = this.p.read(this.PC++);
		/** @const
		 *  @type {Number} */
		var orig = this.p.read(idx) | (this.p.read((idx+1)&0xff) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.Y;
		if(((addr ^ orig) & 0x0100) != 0){
			this.p.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIndirect: function() { // used only in JMP
		/** @const
		 *  @type {Number} */
		var srcAddr = this.p.read(this.PC++) | (this.p.read(this.PC++) << 8);
		return this.p.read(srcAddr) | (this.p.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
	},
	updateFlagZN: function(val){
		this.p.P = (this.p.P & 0x7D) | cycloa.core.ZNFlagCache[val&0xff];
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LDA: function(addr){
		this.updateFlagZN(this.p.A = this.p.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LDY: function(addr) {
		this.updateFlagZN(this.p.Y = this.p.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LDX: function(addr) {
		this.updateFlagZN(this.p.X = this.p.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	STA: function(addr) {
		this.p.write(addr, this.p.A);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	STX: function(addr) {
		this.p.write(addr, this.p.X);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	STY: function(addr) {
		this.p.write(addr, this.p.Y);
	},
	/**@private
	 * @function */
	TXA: function() {
		this.updateFlagZN(this.p.A = this.p.X);
	},
	/**@private
	 * @function */
	TYA: function() {
		this.updateFlagZN(this.p.A = this.p.Y);
	},
	/**@private
	 * @function */
	TXS: function() {
		this.p.SP = this.p.X;
	},
	/**@private
	 * @function */
	TAY: function() {
		this.updateFlagZN(this.p.Y = this.p.A);
	},
	/**@private
	 * @function */
	TAX: function() {
		this.updateFlagZN(this.p.X = this.p.A);
	},
	/**@private
	 * @function */
	TSX: function() {
		this.updateFlagZN(this.p.X = this.p.SP);
	},
	/**@private
	 * @function */
	PHP: function() {
		this.push(this.p.P | cycloa.core.FLAG.B); // bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	},
	/**@private
	 * @function */
	PLP: function() {
		/**@const
		 * @type {Number} */
		var newP = this.pop();
		if((this.p.P & cycloa.core.FLAG.I) == cycloa.core.FLAG.I && (newP & cycloa.core.FLAG.I) == 0){
			// FIXME: ここどうする？？
			this.p.needStatusRewrite = true;
			this.p.newStatus =newP;
		}else{
			this.p.P = newP;
		}
	},
	/**@private
	 * @function */
	PHA: function() {
		this.push(this.p.A);
	},
	/**@private
	 * @function */
	PLA: function() {
		this.p.updateFlagZN(this.p.A = this.pop());
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ADC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.p.read(addr);
		/**@const
		 * @type {Number} */
		var result = (this.p.A + val + (this.p.P & cycloa.core.FLAG.C)) & 0xffff;
		/**@const
		 * @type {Number} */
		var newA = result & 0xff;
		this.p.P = (this.p.P & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.C))
			| ((((this.p.A ^ val) & 0x80) ^ 0x80) & ((this.p.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
			| ((result >> 8) & cycloa.core.FLAG.C); //set C flag
		this.updateFlagZN(this.p.A = newA);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	SBC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.p.read(addr);
		/**@const
		 * @type {Number} */
		var result = (this.p.A - val - ((this.p.P & cycloa.core.FLAG.C) ^ cycloa.core.FLAG.C)) & 0xffff;
		/**@const
		 * @type {Number} */
		var newA = result & 0xff;
		this.p.P = (this.p.P & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.C))
			| ((this.p.A ^ val) & (this.p.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
			| (((result >> 8) & cycloa.core.FLAG.C) ^ cycloa.core.FLAG.C);
		this.updateFlagZN(this.p.A = newA);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	CPX: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.X - this.p.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	CPY: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.Y - this.p.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	CMP: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.A - this.p.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	AND: function(addr) {
		this.updateFlagZN(this.p.A &= this.p.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	EOR: function(addr) {
		this.updateFlagZN(this.p.A ^= this.p.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ORA: function(addr) {
		this.updateFlagZN(this.p.A |= this.p.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BIT: function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.p.read(addr);
		this.p.P = (this.p.P & (0xff & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.N | cycloa.core.FLAG.Z)))
			| (val & (cycloa.core.FLAG.V | cycloa.core.FLAG.N))
			| (cycloa.core.ZNFlagCache[this.p.A & val] & cycloa.core.FLAG.Z);
	},
	/**@private
	 * @function */
	ASL_: function() {
		this.p.P = (this.p.P & 0xFE) | (this.p.A & 0xff) >> 7;
		this.updateFlagZN((this.p.A <<= 1) & 0xff);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ASL: function(addr) {
		var val = this.p.read(addr);
		this.p.P = (this.p.P & 0xFE) | val >> 7;
		val <<= 1;
		this.p.write(addr, val);
		this.updateFlagZN(val);
	},
	/**@private
	 * @function */
	LSR_: function() {
		this.p.P = (this.p.P & 0xFE) | (this.p.A & 0x01);
		this.p.A >>= 1;
		this.updateFlagZN(this.p.A);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LSR: function(addr) {
		var val = this.p.read(addr);
		this.p.P = (this.p.P & 0xFE) | (val & 0x01);
		val >>= 1;
		this.p.write(addr, val);
		this.updateFlagZN(val);
	},
	/**@private
	 * @function */
	ROL_: function() {
		var carry = (this.p.A & 0xff) >> 7;
		this.p.A = (this.p.A << 1) | (this.p.P & 0x01);
		this.p.P = (this.p.P & 0xFE) | carry;
		this.updateFlagZN(this.p.A);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ROL: function(addr) {
		var val = this.p.read(addr);
		/**@const
		 * @type {Number} */
		var carry = val >> 7;
		val = ((val << 1) & 0xff) | (this.p.P & 0x01);
		this.p.P = (this.p.P & 0xFE) | carry;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	},
	/**@private
	 * @function */
	ROR_: function() {
		this.p.P = (this.p.P & 0xFE) | (this.p.A & 0x01);
		this.updateFlagZN( this.p.A = ((this.p.A >> 1) & 0xff) | ((this.p.P & 0x01) << 7) );
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ROR: function(addr) { //FIXME: オーバーロード
		var val = this.p.read(addr);
		/**@const
		 * @type {Number} */
		var carry = val & 0x01;
		val = (val >> 1) | ((this.p.P & 0x01) << 7);
		this.p.P = (this.p.P & 0xFE) | carry;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	},
	/**@private
	 * @function */
	INX: function() {
		this.updateFlagZN(++this.p.X);
	},
	/**@private
	 * @function */
	INY: function() {
		this.updateFlagZN(++this.p.Y);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	INC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.read(addr)+1) & 0xff;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	},
	/**@private
	 * @function */
	DEX: function() {
		this.updateFlagZN(--this.p.X);
	},
	/**@private
	 * @function */
	DEY: function() {
		this.updateFlagZN(--this.p.Y);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	DEC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.read(addr)-1) & 0xff;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	},
	/**@private
	 * @function */
	CLC: function() {
		this.p.P &= ~(cycloa.core.FLAG.C);
	},
	/**@private
	 * @function */
	CLI: function() {
		// http://twitter.com/#!/KiC6280/status/112348378100281344
		// http://twitter.com/#!/KiC6280/status/112351125084180480
		this.p.needStatusRewrite = true;
		this.p.newStatus = this.p.P & ~(cycloa.core.FLAG.I);
		//this.p.P &= ~(cycloa.core.FLAG.I);
	},
	/**@private
	 * @function */
	CLV: function() {
		this.p.P &= ~(cycloa.core.FLAG.V);
	},
	/**@private
	 * @function */
	CLD: function() {
		this.p.P &= ~(cycloa.core.FLAG.D);
	},
	/**@private
	 * @function */
	SEC: function() {
		this.p.P |= cycloa.core.FLAG.C;
	},
	/**@private
	 * @function */
	SEI: function() {
		this.p.P |= cycloa.core.FLAG.I;
	},
	/**@private
	 * @function */
	SED: function() {
		this.p.P |= cycloa.core.FLAG.D;
	},
	/**@private
	 * @function */
	NOP: function() {
		//NOP。そう、何もしない。
	},
	/**@private
	 * @function */
	BRK: function() {
		//NES ON FPGAには、
		//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
		//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
		//DQ4はこうしないと、動かない。
		/*
		 if((this.p.P & cycloa.core.FLAG.I) == cycloa.core.FLAG.I){
		 return;
		 }*/
		this.p.PC++;
		this.push((this.p.PC >> 8) & 0xFF);
		this.push(this.p.PC & 0xFF);
		this.p.P |= cycloa.core.FLAG.B;
		this.push(this.p.P);
		this.p.P |= cycloa.core.FLAG.I;
		this.p.PC = (this.p.read(0xFFFE) | (this.p.read(0xFFFF) << 8));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BCC: function(addr) {
		if((this.p.P & cycloa.core.FLAG.C) == 0){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BCS: function(addr) {
		if((this.p.P & cycloa.core.FLAG.C) == cycloa.core.FLAG.C){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BEQ: function(addr) {
		if((this.p.P & cycloa.core.FLAG.Z) == cycloa.core.FLAG.Z){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BNE: function(addr) {
		if((this.p.P & cycloa.core.FLAG.Z) == 0){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BVC: function(addr) {
		if((this.p.P & cycloa.core.FLAG.V) == 0){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BVS: function(addr) {
		if((this.p.P & cycloa.core.FLAG.V) == cycloa.core.FLAG.V){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BPL: function(addr) {
		if((this.p.P & cycloa.core.FLAG.N) == 0){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BMI: function(addr) {
		if((this.p.P & cycloa.core.FLAG.N) == cycloa.core.FLAG.N){
			if(((this.p.PC ^ addr) & 0x0100) != 0){
				this.p.consumeClock(2);
			}else{
				this.p.consumeClock(1);
			}
			this.p.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	JSR: function(addr) {
		this.p.PC--;
		this.push((this.p.PC >> 8) & 0xFF);
		this.push(this.p.PC & 0xFF);
		this.p.PC = addr;
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	JMP: function(addr) {
		this.p.PC = addr;
	},
	/**@private
	 * @function */
	RTI: function() {
		this.p.P = this.pop();
		this.p.PC = this.pop() | (this.pop() << 8);
	},
	/**@private
	 * @function */
	RTS: function() {
		this.p.PC = this.pop() | (this.pop() << 8) + 1;
	}
};
/**
 * @const
 * @type {Function[]}
 */
cycloa.core.InterpreterSpirit.OperationTable = [
	function(){this.BRK(); /* 0x0, BRK, nil */},
	function(){this.ORA(this.addrIndirectX()); /* 0x1, ORA, IndirectX */},
	undefined,
	undefined,
	undefined,
	function(){this.ORA(this.addrZeroPage()); /* 0x5, ORA, Zeropage */},
	function(){this.ASL(this.addrZeroPage()); /* 0x6, ASL, Zeropage */},
	undefined,
	function(){this.PHP(); /* 0x8, PHP, nil */},
	function(){this.ORA(this.addrImmediate()); /* 0x9, ORA, Immediate */},
	function(){this.ASL_(); /* 0xa, ASL, nil */},
	undefined,
	undefined,
	function(){this.ORA(this.addrAbsolute()); /* 0xd, ORA, Absolute */},
	function(){this.ASL(this.addrAbsolute()); /* 0xe, ASL, Absolute */},
	undefined,
	function(){this.BPL(this.addrRelative()); /* 0x10, BPL, Immediate */},
	function(){this.ORA(this.addrIndirectY()); /* 0x11, ORA, IndirectY */},
	undefined,
	undefined,
	undefined,
	function(){this.ORA(this.addrZeroPageIdxX()); /* 0x15, ORA, ZeropageX */},
	function(){this.ASL(this.addrZeroPageIdxX()); /* 0x16, ASL, ZeropageX */},
	undefined,
	function(){this.CLC(); /* 0x18, CLC, nil */},
	function(){this.ORA(this.addrAbsoluteIdxY()); /* 0x19, ORA, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	function(){this.ORA(this.addrAbsoluteIdxX()); /* 0x1d, ORA, AbsoluteX */},
	function(){this.ASL(this.addrAbsoluteIdxX()); /* 0x1e, ASL, AbsoluteX */},
	undefined,
	function(){this.JSR(this.addrAbsolute()); /* 0x20, JSR, Absolute */},
	function(){this.AND(this.addrIndirectX()); /* 0x21, AND, IndirectX */},
	undefined,
	undefined,
	function(){this.BIT(this.addrZeroPage()); /* 0x24, BIT, Zeropage */},
	function(){this.AND(this.addrZeroPage()); /* 0x25, AND, Zeropage */},
	function(){this.ROL(this.addrZeroPage()); /* 0x26, ROL, Zeropage */},
	undefined,
	function(){this.PLP(); /* 0x28, PLP, nil */},
	function(){this.AND(this.addrImmediate()); /* 0x29, AND, Immediate */},
	function(){this.ROL_(); /* 0x2a, ROL, nil */},
	undefined,
	function(){this.BIT(this.addrAbsolute()); /* 0x2c, BIT, Absolute */},
	function(){this.AND(this.addrAbsolute()); /* 0x2d, AND, Absolute */},
	function(){this.ROL(this.addrAbsolute()); /* 0x2e, ROL, Absolute */},
	undefined,
	function(){this.BMI(this.addrRelative()); /* 0x30, BMI, Immediate */},
	function(){this.AND(this.addrIndirectY()); /* 0x31, AND, IndirectY */},
	undefined,
	undefined,
	undefined,
	function(){this.AND(this.addrZeroPageIdxX()); /* 0x35, AND, ZeropageX */},
	function(){this.ROL(this.addrZeroPageIdxX()); /* 0x36, ROL, ZeropageX */},
	undefined,
	function(){this.SEC(); /* 0x38, SEC, nil */},
	function(){this.AND(this.addrAbsoluteIdxY()); /* 0x39, AND, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	function(){this.AND(this.addrAbsoluteIdxX()); /* 0x3d, AND, AbsoluteX */},
	function(){this.ROL(this.addrAbsoluteIdxX()); /* 0x3e, ROL, AbsoluteX */},
	undefined,
	function(){this.RTI(); /* 0x40, RTI, nil */},
	function(){this.EOR(this.addrIndirectX()); /* 0x41, EOR, IndirectX */},
	undefined,
	undefined,
	undefined,
	function(){this.EOR(this.addrZeroPage()); /* 0x45, EOR, Zeropage */},
	function(){this.LSR(this.addrZeroPage()); /* 0x46, LSR, Zeropage */},
	undefined,
	function(){this.PHA(); /* 0x48, PHA, nil */},
	function(){this.EOR(this.addrImmediate()); /* 0x49, EOR, Immediate */},
	function(){this.LSR_(); /* 0x4a, LSR, nil */},
	undefined,
	function(){this.JMP(this.addrAbsolute()); /* 0x4c, JMP, Absolute */},
	function(){this.EOR(this.addrAbsolute()); /* 0x4d, EOR, Absolute */},
	function(){this.LSR(this.addrAbsolute()); /* 0x4e, LSR, Absolute */},
	undefined,
	function(){this.BVC(this.addrRelative()); /* 0x50, BVC, Immediate */},
	function(){this.EOR(this.addrIndirectY()); /* 0x51, EOR, IndirectY */},
	undefined,
	undefined,
	undefined,
	function(){this.EOR(this.addrZeroPageIdxX()); /* 0x55, EOR, ZeropageX */},
	function(){this.LSR(this.addrZeroPageIdxX()); /* 0x56, LSR, ZeropageX */},
	undefined,
	function(){this.CLI(); /* 0x58, CLI, nil */},
	function(){this.EOR(this.addrAbsoluteIdxY()); /* 0x59, EOR, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	function(){this.EOR(this.addrAbsoluteIdxX()); /* 0x5d, EOR, AbsoluteX */},
	function(){this.LSR(this.addrAbsoluteIdxX()); /* 0x5e, LSR, AbsoluteX */},
	undefined,
	function(){this.RTS(); /* 0x60, RTS, nil */},
	function(){this.ADC(this.addrIndirectX()); /* 0x61, ADC, IndirectX */},
	undefined,
	undefined,
	undefined,
	function(){this.ADC(this.addrZeroPage()); /* 0x65, ADC, Zeropage */},
	function(){this.ROR(this.addrZeroPage()); /* 0x66, ROR, Zeropage */},
	undefined,
	function(){this.PLA(); /* 0x68, PLA, nil */},
	function(){this.ADC(this.addrImmediate()); /* 0x69, ADC, Immediate */},
	function(){this.ROR_(); /* 0x6a, ROR, nil */},
	undefined,
	function(){this.JMP(this.addrAbsoluteIndirect()); /* 0x6c, JMP, Indirect */},
	function(){this.ADC(this.addrAbsolute()); /* 0x6d, ADC, Absolute */},
	function(){this.ROR(this.addrAbsolute()); /* 0x6e, ROR, Absolute */},
	undefined,
	function(){this.BVS(this.addrRelative()); /* 0x70, BVS, Immediate */},
	function(){this.ADC(this.addrIndirectY()); /* 0x71, ADC, IndirectY */},
	undefined,
	undefined,
	undefined,
	function(){this.ADC(this.addrZeroPageIdxX()); /* 0x75, ADC, ZeropageX */},
	function(){this.ROR(this.addrZeroPageIdxX()); /* 0x76, ROR, ZeropageX */},
	undefined,
	function(){this.SEI(); /* 0x78, SEI, nil */},
	function(){this.ADC(this.addrAbsoluteIdxY()); /* 0x79, ADC, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	function(){this.ADC(this.addrAbsoluteIdxX()); /* 0x7d, ADC, AbsoluteX */},
	function(){this.ROR(this.addrAbsoluteIdxX()); /* 0x7e, ROR, AbsoluteX */},
	undefined,
	undefined,
	function(){this.STA(this.addrIndirectX()); /* 0x81, STA, IndirectX */},
	undefined,
	undefined,
	function(){this.STY(this.addrZeroPage()); /* 0x84, STY, Zeropage */},
	function(){this.STA(this.addrZeroPage()); /* 0x85, STA, Zeropage */},
	function(){this.STX(this.addrZeroPage()); /* 0x86, STX, Zeropage */},
	undefined,
	function(){this.DEY(); /* 0x88, DEY, nil */},
	undefined,
	function(){this.TXA(); /* 0x8a, TXA, nil */},
	undefined,
	function(){this.STY(this.addrAbsolute()); /* 0x8c, STY, Absolute */},
	function(){this.STA(this.addrAbsolute()); /* 0x8d, STA, Absolute */},
	function(){this.STX(this.addrAbsolute()); /* 0x8e, STX, Absolute */},
	undefined,
	function(){this.BCC(this.addrRelative()); /* 0x90, BCC, Immediate */},
	function(){this.STA(this.addrIndirectY()); /* 0x91, STA, IndirectY */},
	undefined,
	undefined,
	function(){this.STY(this.addrZeroPageIdxX()); /* 0x94, STY, ZeropageX */},
	function(){this.STA(this.addrZeroPageIdxX()); /* 0x95, STA, ZeropageX */},
	function(){this.STX(this.addrZeroPageIdxY()); /* 0x96, STX, ZeropageY */},
	undefined,
	function(){this.TYA(); /* 0x98, TYA, nil */},
	function(){this.STA(this.addrAbsoluteIdxY()); /* 0x99, STA, AbsoluteY */},
	function(){this.TXS(); /* 0x9a, TXS, nil */},
	undefined,
	undefined,
	function(){this.STA(this.addrAbsoluteIdxX()); /* 0x9d, STA, AbsoluteX */},
	undefined,
	undefined,
	function(){this.LDY(this.addrImmediate()); /* 0xa0, LDY, Immediate */},
	function(){this.LDA(this.addrIndirectX()); /* 0xa1, LDA, IndirectX */},
	function(){this.LDX(this.addrImmediate()); /* 0xa2, LDX, Immediate */},
	undefined,
	function(){this.LDY(this.addrZeroPage()); /* 0xa4, LDY, Zeropage */},
	function(){this.LDA(this.addrZeroPage()); /* 0xa5, LDA, Zeropage */},
	function(){this.LDX(this.addrZeroPage()); /* 0xa6, LDX, Zeropage */},
	undefined,
	function(){this.TAY(); /* 0xa8, TAY, nil */},
	function(){this.LDA(this.addrImmediate()); /* 0xa9, LDA, Immediate */},
	function(){this.TAX(); /* 0xaa, TAX, nil */},
	undefined,
	function(){this.LDY(this.addrAbsolute()); /* 0xac, LDY, Absolute */},
	function(){this.LDA(this.addrAbsolute()); /* 0xad, LDA, Absolute */},
	function(){this.LDX(this.addrAbsolute()); /* 0xae, LDX, Absolute */},
	undefined,
	function(){this.BCS(this.addrRelative()); /* 0xb0, BCS, Immediate */},
	function(){this.LDA(this.addrIndirectY()); /* 0xb1, LDA, IndirectY */},
	undefined,
	undefined,
	function(){this.LDY(this.addrZeroPageIdxX()); /* 0xb4, LDY, ZeropageX */},
	function(){this.LDA(this.addrZeroPageIdxX()); /* 0xb5, LDA, ZeropageX */},
	function(){this.LDX(this.addrZeroPageIdxY()); /* 0xb6, LDX, ZeropageY */},
	undefined,
	function(){this.CLV(); /* 0xb8, CLV, nil */},
	function(){this.LDA(this.addrAbsoluteIdxY()); /* 0xb9, LDA, AbsoluteY */},
	function(){this.TSX(); /* 0xba, TSX, nil */},
	undefined,
	function(){this.LDY(this.addrAbsoluteIdxX()); /* 0xbc, LDY, AbsoluteX */},
	function(){this.LDA(this.addrAbsoluteIdxX()); /* 0xbd, LDA, AbsoluteX */},
	function(){this.LDX(this.addrAbsoluteIdxY()); /* 0xbe, LDX, AbsoluteY */},
	undefined,
	function(){this.CPY(this.addrImmediate()); /* 0xc0, CPY, Immediate */},
	function(){this.CMP(this.addrIndirectX()); /* 0xc1, CMP, IndirectX */},
	undefined,
	undefined,
	function(){this.CPY(this.addrZeroPage()); /* 0xc4, CPY, Zeropage */},
	function(){this.CMP(this.addrZeroPage()); /* 0xc5, CMP, Zeropage */},
	function(){this.DEC(this.addrZeroPage()); /* 0xc6, DEC, Zeropage */},
	undefined,
	function(){this.INY(); /* 0xc8, INY, nil */},
	function(){this.CMP(this.addrImmediate()); /* 0xc9, CMP, Immediate */},
	function(){this.DEX(); /* 0xca, DEX, nil */},
	undefined,
	function(){this.CPY(this.addrAbsolute()); /* 0xcc, CPY, Absolute */},
	function(){this.CMP(this.addrAbsolute()); /* 0xcd, CMP, Absolute */},
	function(){this.DEC(this.addrAbsolute()); /* 0xce, DEC, Absolute */},
	undefined,
	function(){this.BNE(this.addrRelative()); /* 0xd0, BNE, Immediate */},
	function(){this.CMP(this.addrIndirectY()); /* 0xd1, CMP, IndirectY */},
	undefined,
	undefined,
	undefined,
	function(){this.CMP(this.addrZeroPageIdxX()); /* 0xd5, CMP, ZeropageX */},
	function(){this.DEC(this.addrZeroPageIdxX()); /* 0xd6, DEC, ZeropageX */},
	undefined,
	function(){this.CLD(); /* 0xd8, CLD, nil */},
	function(){this.CMP(this.addrAbsoluteIdxY()); /* 0xd9, CMP, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	function(){this.CMP(this.addrAbsoluteIdxX()); /* 0xdd, CMP, AbsoluteX */},
	function(){this.DEC(this.addrAbsoluteIdxX()); /* 0xde, DEC, AbsoluteX */},
	undefined,
	function(){this.CPX(this.addrImmediate()); /* 0xe0, CPX, Immediate */},
	function(){this.SBC(this.addrIndirectX()); /* 0xe1, SBC, IndirectX */},
	undefined,
	undefined,
	function(){this.CPX(this.addrZeroPage()); /* 0xe4, CPX, Zeropage */},
	function(){this.SBC(this.addrZeroPage()); /* 0xe5, SBC, Zeropage */},
	function(){this.INC(this.addrZeroPage()); /* 0xe6, INC, Zeropage */},
	undefined,
	function(){this.INX(); /* 0xe8, INX, nil */},
	function(){this.SBC(this.addrImmediate()); /* 0xe9, SBC, Immediate */},
	function(){this.NOP(); /* 0xea, NOP, nil */},
	undefined,
	function(){this.CPX(this.addrAbsolute()); /* 0xec, CPX, Absolute */},
	function(){this.SBC(this.addrAbsolute()); /* 0xed, SBC, Absolute */},
	function(){this.INC(this.addrAbsolute()); /* 0xee, INC, Absolute */},
	undefined,
	function(){this.BEQ(this.addrRelative()); /* 0xf0, BEQ, Immediate */},
	function(){this.SBC(this.addrIndirectY()); /* 0xf1, SBC, IndirectY */},
	undefined,
	undefined,
	undefined,
	function(){this.SBC(this.addrZeroPageIdxX()); /* 0xf5, SBC, ZeropageX */},
	function(){this.INC(this.addrZeroPageIdxX()); /* 0xf6, INC, ZeropageX */},
	undefined,
	function(){this.SED(); /* 0xf8, SED, nil */},
	function(){this.SBC(this.addrAbsoluteIdxY()); /* 0xf9, SBC, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	function(){this.SBC(this.addrAbsoluteIdxX()); /* 0xfd, SBC, AbsoluteX */},
	function(){this.INC(this.addrAbsoluteIdxX()); /* 0xfe, INC, AbsoluteX */},
	undefined
];

