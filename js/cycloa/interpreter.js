"use strict";

/**
 * @extends cycloa.core.ProcessorSpirit
 * @class
 * @constructor
 */
cycloa.core.InterpreterSpirit = function(){
	cycloa.core.ProcessorSpirit.apply(this);
};
/**
 * @const
 * @type {*}
 * @private
 */
cycloa.core.InterpreterSpirit.prototype.__proto__ = cycloa.core.ProcessorSpirit.prototype;
/**
 *
 * @override cycloa.core.ProcessorSpirit.run
 */
cycloa.core.InterpreterSpirit.prototype.run = function(){
	/** @const
	 * @type {Number} */
	var opcode = this.p.read(this.p.PC++);
	/**
	 * @const
	 * @type {Function}
	 */
	var func = this.OperationTable[opcode];
	if(!func){
		throw new cycloa.exc.CoreException("Unknwon opcode: "+opcode);
	}
	func(this);
};
/**@private
 * @function
 * @param {Number} val */
cycloa.core.InterpreterSpirit.prototype.push = function(val) {
	this.p.write(0x0100 | ((this.p.SP--) & 0xff), val);
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.pop = function() {
	return this.p.read(0x0100 | ((this.p.SP++) & 0xff));
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrImmediate = function() {
	return this.p.PC++;
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrAbsolute = function() {
	return this.p.read(this.p.PC++) | (this.p.read(this.p.PC++) << 8);
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrZeroPage = function() {
	return this.p.read(this.PC++);
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrZeroPageIdxX = function() {
	return (this.p.read(this.p.PC++) + this.p.X) & 0xff;
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrZeroPageIdxY = function() {
	return (this.p.read(this.p.PC++) + this.p.Y) & 0xff;
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrAbsoluteIdxX = function() {
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
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrAbsoluteIdxY = function() {
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
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrRelative = function() {
	/** @const
	 *  @type {Number} */
	var offset = this.p.read(this.PC++);
	return (offset >= 128 ? (offset-256) : offset) + this.p.PC;
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrIndirectX = function() {
	/** @const
	 *  @type {Number} */
	var idx = (this.p.read(this.p.PC++) + this.p.X) & 0xff;
	return this.p.read(idx) | (this.p.read((idx+1)&0xff) << 8);
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrIndirectY = function() {
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
};
/**@private
 * @function
 * @return {Number} */
cycloa.core.InterpreterSpirit.prototype.addrAbsoluteIndirect = function() { // used only in JMP
	/** @const
	 *  @type {Number} */
	var srcAddr = this.p.read(this.PC++) | (this.p.read(this.PC++) << 8);
	return this.p.read(srcAddr) | (this.p.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
};
cycloa.core.InterpreterSpirit.prototype.updateFlagZN = function(val){
	this.p.P = (this.p.P & 0x7D) | cycloa.core.Processor.ZNFlagCache[val&0xff];
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.LDA = function(addr){
	this.updateFlagZN(this.p.A = this.p.read(addr));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.LDY = function(addr) {
	this.updateFlagZN(this.p.Y = this.p.read(addr));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.LDX = function(addr) {
	this.updateFlagZN(this.p.X = this.p.read(addr));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.STA = function(addr) {
	this.p.write(addr, this.p.A);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.STX = function(addr) {
	this.p.write(addr, this.p.X);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.STY = function(addr) {
	this.p.write(addr, this.p.Y);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.TXA = function() {
	this.updateFlagZN(this.p.A = this.p.X);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.TYA = function() {
	this.updateFlagZN(this.p.A = this.p.Y);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.TXS = function() {
	this.p.SP = this.p.X;
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.TAY = function() {
	this.updateFlagZN(this.p.Y = this.p.A);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.TAX = function() {
	this.updateFlagZN(this.p.X = this.p.A);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.TSX = function() {
	this.updateFlagZN(this.p.X = this.p.SP);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.PHP = function() {
	this.push(this.p.P | cycloa.core.Processor.FLAG.B); // bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.PLP = function() {
	/**@const
	 * @type {Number} */
	var newP = this.pop();
	if((this.p.P & cycloa.core.Processor.FLAG.I) == cycloa.core.Processor.FLAG.I && (newP & cycloa.core.Processor.FLAG.I) == 0){
		// FIXME: ここどうする？？
		this.p.needStatusRewrite = true;
		this.p.newStatus =newP;
	}else{
		this.p.P = newP;
	}
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.PHA = function() {
	this.push(this.p.A);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.PLA = function() {
	this.p.updateFlagZN(this.p.A = this.pop());
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.ADC = function(addr) {
	/**@const
	 * @type {Number} */
	var val = this.p.read(addr);
	/**@const
	 * @type {Number} */
	var result = (this.p.A + val + (this.p.P & cycloa.core.Processor.FLAG.C)) & 0xffff;
	/**@const
	 * @type {Number} */
	var newA = result & 0xff;
	this.p.P = (this.p.P & ~(cycloa.core.Processor.FLAG.V | cycloa.core.Processor.FLAG.C))
		| ((((this.p.A ^ val) & 0x80) ^ 0x80) & ((this.p.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
		| ((result >> 8) & cycloa.core.Processor.FLAG.C); //set C flag
	this.updateFlagZN(this.p.A = newA);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.SBC = function(addr) {
	/**@const
	 * @type {Number} */
	var val = this.p.read(addr);
	/**@const
	 * @type {Number} */
	var result = (this.p.A - val - ((this.p.P & cycloa.core.Processor.FLAG.C) ^ cycloa.core.Processor.FLAG.C)) & 0xffff;
	/**@const
	 * @type {Number} */
	var newA = result & 0xff;
	this.p.P = (this.p.P & ~(cycloa.core.Processor.FLAG.V | cycloa.core.Processor.FLAG.C))
		| ((this.p.A ^ val) & (this.p.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
		| (((result >> 8) & cycloa.core.Processor.FLAG.C) ^ cycloa.core.Processor.FLAG.C);
	this.updateFlagZN(this.p.A = newA);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.CPX = function(addr) {
	/**@const
	 * @type {Number} */
	var val = (this.p.X - this.p.read(addr)) & 0xffff;
	this.updateFlagZN(val & 0xff);
	this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.CPY = function(addr) {
	/**@const
	 * @type {Number} */
	var val = (this.p.Y - this.p.read(addr)) & 0xffff;
	this.updateFlagZN(val & 0xff);
	this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.CMP = function(addr) {
	/**@const
	 * @type {Number} */
	var val = (this.p.A - this.p.read(addr)) & 0xffff;
	this.updateFlagZN(val & 0xff);
	this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.AND = function(addr) {
	this.updateFlagZN(this.p.A &= this.p.read(addr));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.EOR = function(addr) {
	this.updateFlagZN(this.p.A ^= this.p.read(addr));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.ORA = function(addr) {
	this.updateFlagZN(this.p.A |= this.p.read(addr));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BIT = function(addr) {
	/**@const
	 * @type {Number} */
	var val = this.p.read(addr);
	this.p.P = (this.p.P & (0xff & ~(cycloa.core.Processor.FLAG.V | cycloa.core.Processor.FLAG.N | cycloa.core.Processor.FLAG.Z)))
		| (val & (cycloa.core.Processor.FLAG.V | cycloa.core.Processor.FLAG.N))
		| (cycloa.core.Processor.ZNFlagCache[this.p.A & val] & cycloa.core.Processor.FLAG.Z);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.ASL_ = function() {
	this.p.P = (this.p.P & 0xFE) | (this.p.A & 0xff) >> 7;
	this.updateFlagZN((this.p.A <<= 1) & 0xff);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.ASL = function(addr) {
	var val = this.p.read(addr);
	this.p.P = (this.p.P & 0xFE) | val >> 7;
	val <<= 1;
	this.p.write(addr, val);
	this.updateFlagZN(val);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.LSR_ = function() {
	this.p.P = (this.p.P & 0xFE) | (this.p.A & 0x01);
	this.p.A >>= 1;
	this.updateFlagZN(this.p.A);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.LSR = function(addr) {
	var val = this.p.read(addr);
	this.p.P = (this.p.P & 0xFE) | (val & 0x01);
	val >>= 1;
	this.p.write(addr, val);
	this.updateFlagZN(val);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.ROL_ = function() {
	var carry = (this.p.A & 0xff) >> 7;
	this.p.A = (this.p.A << 1) | (this.p.P & 0x01);
	this.p.P = (this.p.P & 0xFE) | carry;
	this.updateFlagZN(this.p.A);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.ROL = function(addr) {
	var val = this.p.read(addr);
	/**@const
	 * @type {Number} */
	var carry = val >> 7;
	val = ((val << 1) & 0xff) | (this.p.P & 0x01);
	this.p.P = (this.p.P & 0xFE) | carry;
	this.updateFlagZN(val);
	this.p.write(addr, val);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.ROR_ = function() {
	this.p.P = (this.p.P & 0xFE) | (this.p.A & 0x01);
	this.updateFlagZN( this.p.A = ((this.p.A >> 1) & 0xff) | ((this.p.P & 0x01) << 7) );
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.ROR = function(addr) { //FIXME: オーバーロード
	var val = this.p.read(addr);
	/**@const
	 * @type {Number} */
	var carry = val & 0x01;
	val = (val >> 1) | ((this.p.P & 0x01) << 7);
	this.p.P = (this.p.P & 0xFE) | carry;
	this.updateFlagZN(val);
	this.p.write(addr, val);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.INX = function() {
	this.updateFlagZN(++this.p.X);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.INY = function() {
	this.updateFlagZN(++this.p.Y);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.INC = function(addr) {
	/**@const
	 * @type {Number} */
	var val = (this.p.read(addr)+1) & 0xff;
	this.updateFlagZN(val);
	this.p.write(addr, val);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.DEX = function() {
	this.updateFlagZN(--this.p.X);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.DEY = function() {
	this.updateFlagZN(--this.p.Y);
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.DEC = function(addr) {
	/**@const
	 * @type {Number} */
	var val = (this.p.read(addr)-1) & 0xff;
	this.updateFlagZN(val);
	this.p.write(addr, val);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.CLC = function() {
	this.p.P &= ~(cycloa.core.Processor.FLAG.C);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.CLI = function() {
	// http://twitter.com/#!/KiC6280/status/112348378100281344
	// http://twitter.com/#!/KiC6280/status/112351125084180480
	this.p.needStatusRewrite = true;
	this.p.newStatus = this.p.P & ~(cycloa.core.Processor.FLAG.I);
	//this.p.P &= ~(cycloa.core.Processor.FLAG.I);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.CLV = function() {
	this.p.P &= ~(cycloa.core.Processor.FLAG.V);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.CLD = function() {
	this.p.P &= ~(cycloa.core.Processor.FLAG.D);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.SEC = function() {
	this.p.P |= cycloa.core.Processor.FLAG.C;
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.SEI = function() {
	this.p.P |= cycloa.core.Processor.FLAG.I;
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.SED = function() {
	this.p.P |= cycloa.core.Processor.FLAG.D;
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.NOP = function() {
	//NOP。そう、何もしない。
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.BRK = function() {
	//NES ON FPGAには、
	//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
	//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
	//DQ4はこうしないと、動かない。
	/*
	 if((this.p.P & cycloa.core.Processor.FLAG.I) == cycloa.core.Processor.FLAG.I){
	 return;
	 }*/
	this.p.PC++;
	this.push((this.p.PC >> 8) & 0xFF);
	this.push(this.p.PC & 0xFF);
	this.p.P |= cycloa.core.Processor.FLAG.B;
	this.push(this.p.P);
	this.p.P |= cycloa.core.Processor.FLAG.I;
	this.p.PC = (this.p.read(0xFFFE) | (this.p.read(0xFFFF) << 8));
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BCC = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.C) == 0){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BCS = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.C) == cycloa.core.Processor.FLAG.C){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BEQ = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.Z) == cycloa.core.Processor.FLAG.Z){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BNE = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.Z) == 0){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BVC = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.V) == 0){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BVS = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.V) == cycloa.core.Processor.FLAG.V){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BPL = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.N) == 0){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.BMI = function(addr) {
	if((this.p.P & cycloa.core.Processor.FLAG.N) == cycloa.core.Processor.FLAG.N){
		if(((this.p.PC ^ addr) & 0x0100) != 0){
			this.p.consumeClock(2);
		}else{
			this.p.consumeClock(1);
		}
		this.p.PC = addr;
	}
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.JSR = function(addr) {
	this.p.PC--;
	this.push((this.p.PC >> 8) & 0xFF);
	this.push(this.p.PC & 0xFF);
	this.p.PC = addr;
};
/**@private
 * @function
 * @param {Number} addr */
cycloa.core.InterpreterSpirit.prototype.JMP = function(addr) {
	this.p.PC = addr;
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.RTI = function() {
	this.p.P = this.pop();
	this.p.PC = this.pop() | (this.pop() << 8);
};
/**@private
 * @function */
cycloa.core.InterpreterSpirit.prototype.RTS = function() {
	this.p.PC = this.pop() | (this.pop() << 8) + 1;
};

/**
 * @const
 * @type {Function[]}
 */
cycloa.core.InterpreterSpirit.OperationTable = [
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BRK(); /* 0x0, BRK, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrIndirectX()); /* 0x1, ORA, IndirectX */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrZeropage()); /* 0x5, ORA, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ASL(this_.addrZeropage()); /* 0x6, ASL, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.PHP(); /* 0x8, PHP, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrImmediate()); /* 0x9, ORA, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ASL_(); /* 0xa, ASL, nil */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrAbsolute()); /* 0xd, ORA, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ASL(this_.addrAbsolute()); /* 0xe, ASL, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BPL(this_.addrImmediate()); /* 0x10, BPL, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrIndirectY()); /* 0x11, ORA, IndirectY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrZeropageX()); /* 0x15, ORA, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ASL(this_.addrZeropageX()); /* 0x16, ASL, ZeropageX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CLC(); /* 0x18, CLC, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrAbsoluteY()); /* 0x19, ORA, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ORA(this_.addrAbsoluteX()); /* 0x1d, ORA, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ASL(this_.addrAbsoluteX()); /* 0x1e, ASL, AbsoluteX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.JSR(this_.addrAbsolute()); /* 0x20, JSR, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrIndirectX()); /* 0x21, AND, IndirectX */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BIT(this_.addrZeropage()); /* 0x24, BIT, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrZeropage()); /* 0x25, AND, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROL(this_.addrZeropage()); /* 0x26, ROL, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.PLP(); /* 0x28, PLP, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrImmediate()); /* 0x29, AND, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROL_(); /* 0x2a, ROL, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BIT(this_.addrAbsolute()); /* 0x2c, BIT, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrAbsolute()); /* 0x2d, AND, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROL(this_.addrAbsolute()); /* 0x2e, ROL, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BMI(this_.addrImmediate()); /* 0x30, BMI, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrIndirectY()); /* 0x31, AND, IndirectY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrZeropageX()); /* 0x35, AND, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROL(this_.addrZeropageX()); /* 0x36, ROL, ZeropageX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SEC(); /* 0x38, SEC, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrAbsoluteY()); /* 0x39, AND, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.AND(this_.addrAbsoluteX()); /* 0x3d, AND, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROL(this_.addrAbsoluteX()); /* 0x3e, ROL, AbsoluteX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.RTI(); /* 0x40, RTI, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrIndirectX()); /* 0x41, EOR, IndirectX */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrZeropage()); /* 0x45, EOR, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LSR(this_.addrZeropage()); /* 0x46, LSR, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.PHA(); /* 0x48, PHA, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrImmediate()); /* 0x49, EOR, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LSR_(); /* 0x4a, LSR, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.JMP(this_.addrAbsolute()); /* 0x4c, JMP, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrAbsolute()); /* 0x4d, EOR, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LSR(this_.addrAbsolute()); /* 0x4e, LSR, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BVC(this_.addrImmediate()); /* 0x50, BVC, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrIndirectY()); /* 0x51, EOR, IndirectY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrZeropageX()); /* 0x55, EOR, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LSR(this_.addrZeropageX()); /* 0x56, LSR, ZeropageX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CLI(); /* 0x58, CLI, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrAbsoluteY()); /* 0x59, EOR, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.EOR(this_.addrAbsoluteX()); /* 0x5d, EOR, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LSR(this_.addrAbsoluteX()); /* 0x5e, LSR, AbsoluteX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.RTS(); /* 0x60, RTS, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrIndirectX()); /* 0x61, ADC, IndirectX */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrZeropage()); /* 0x65, ADC, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROR(this_.addrZeropage()); /* 0x66, ROR, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.PLA(); /* 0x68, PLA, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrImmediate()); /* 0x69, ADC, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROR_(); /* 0x6a, ROR, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.JMP(this_.addrIndirect()); /* 0x6c, JMP, Indirect */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrAbsolute()); /* 0x6d, ADC, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROR(this_.addrAbsolute()); /* 0x6e, ROR, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BVS(this_.addrImmediate()); /* 0x70, BVS, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrIndirectY()); /* 0x71, ADC, IndirectY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrZeropageX()); /* 0x75, ADC, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROR(this_.addrZeropageX()); /* 0x76, ROR, ZeropageX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SEI(); /* 0x78, SEI, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrAbsoluteY()); /* 0x79, ADC, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ADC(this_.addrAbsoluteX()); /* 0x7d, ADC, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.ROR(this_.addrAbsoluteX()); /* 0x7e, ROR, AbsoluteX */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrIndirectX()); /* 0x81, STA, IndirectX */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STY(this_.addrZeropage()); /* 0x84, STY, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrZeropage()); /* 0x85, STA, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STX(this_.addrZeropage()); /* 0x86, STX, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.DEY(); /* 0x88, DEY, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.TXA(); /* 0x8a, TXA, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STY(this_.addrAbsolute()); /* 0x8c, STY, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrAbsolute()); /* 0x8d, STA, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STX(this_.addrAbsolute()); /* 0x8e, STX, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BCC(this_.addrImmediate()); /* 0x90, BCC, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrIndirectY()); /* 0x91, STA, IndirectY */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STY(this_.addrZeropageX()); /* 0x94, STY, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrZeropageX()); /* 0x95, STA, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STX(this_.addrZeropageY()); /* 0x96, STX, ZeropageY */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.TYA(); /* 0x98, TYA, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrAbsoluteY()); /* 0x99, STA, AbsoluteY */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.TXS(); /* 0x9a, TXS, nil */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.STA(this_.addrAbsoluteX()); /* 0x9d, STA, AbsoluteX */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDY(this_.addrImmediate()); /* 0xa0, LDY, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrIndirectX()); /* 0xa1, LDA, IndirectX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDX(this_.addrImmediate()); /* 0xa2, LDX, Immediate */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDY(this_.addrZeropage()); /* 0xa4, LDY, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrZeropage()); /* 0xa5, LDA, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDX(this_.addrZeropage()); /* 0xa6, LDX, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.TAY(); /* 0xa8, TAY, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrImmediate()); /* 0xa9, LDA, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.TAX(); /* 0xaa, TAX, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDY(this_.addrAbsolute()); /* 0xac, LDY, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrAbsolute()); /* 0xad, LDA, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDX(this_.addrAbsolute()); /* 0xae, LDX, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BCS(this_.addrImmediate()); /* 0xb0, BCS, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrIndirectY()); /* 0xb1, LDA, IndirectY */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDY(this_.addrZeropageX()); /* 0xb4, LDY, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrZeropageX()); /* 0xb5, LDA, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDX(this_.addrZeropageY()); /* 0xb6, LDX, ZeropageY */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CLV(); /* 0xb8, CLV, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrAbsoluteY()); /* 0xb9, LDA, AbsoluteY */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.TSX(); /* 0xba, TSX, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDY(this_.addrAbsoluteX()); /* 0xbc, LDY, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDA(this_.addrAbsoluteX()); /* 0xbd, LDA, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.LDX(this_.addrAbsoluteY()); /* 0xbe, LDX, AbsoluteY */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CPY(this_.addrImmediate()); /* 0xc0, CPY, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrIndirectX()); /* 0xc1, CMP, IndirectX */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CPY(this_.addrZeropage()); /* 0xc4, CPY, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrZeropage()); /* 0xc5, CMP, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.DEC(this_.addrZeropage()); /* 0xc6, DEC, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.INY(); /* 0xc8, INY, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrImmediate()); /* 0xc9, CMP, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.DEX(); /* 0xca, DEX, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CPY(this_.addrAbsolute()); /* 0xcc, CPY, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrAbsolute()); /* 0xcd, CMP, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.DEC(this_.addrAbsolute()); /* 0xce, DEC, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BNE(this_.addrImmediate()); /* 0xd0, BNE, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrIndirectY()); /* 0xd1, CMP, IndirectY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrZeropageX()); /* 0xd5, CMP, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.DEC(this_.addrZeropageX()); /* 0xd6, DEC, ZeropageX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CLD(); /* 0xd8, CLD, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrAbsoluteY()); /* 0xd9, CMP, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CMP(this_.addrAbsoluteX()); /* 0xdd, CMP, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.DEC(this_.addrAbsoluteX()); /* 0xde, DEC, AbsoluteX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CPX(this_.addrImmediate()); /* 0xe0, CPX, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrIndirectX()); /* 0xe1, SBC, IndirectX */},
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CPX(this_.addrZeropage()); /* 0xe4, CPX, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrZeropage()); /* 0xe5, SBC, Zeropage */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.INC(this_.addrZeropage()); /* 0xe6, INC, Zeropage */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.INX(); /* 0xe8, INX, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrImmediate()); /* 0xe9, SBC, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.NOP(); /* 0xea, NOP, nil */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.CPX(this_.addrAbsolute()); /* 0xec, CPX, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrAbsolute()); /* 0xed, SBC, Absolute */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.INC(this_.addrAbsolute()); /* 0xee, INC, Absolute */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.BEQ(this_.addrImmediate()); /* 0xf0, BEQ, Immediate */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrIndirectY()); /* 0xf1, SBC, IndirectY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrZeropageX()); /* 0xf5, SBC, ZeropageX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.INC(this_.addrZeropageX()); /* 0xf6, INC, ZeropageX */},
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SED(); /* 0xf8, SED, nil */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrAbsoluteY()); /* 0xf9, SBC, AbsoluteY */},
	undefined,
	undefined,
	undefined,
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.SBC(this_.addrAbsoluteX()); /* 0xfd, SBC, AbsoluteX */},
	/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){this_.INC(this_.addrAbsoluteX()); /* 0xfe, INC, AbsoluteX */},
	undefined
];