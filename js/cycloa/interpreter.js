"use strict";

/**
 * @extends cycloa.core.ProcessorSpirit
 * @class
 * @constructor
 */
cycloa.core.InterpreterSpirit = function(){
	this.prototype = new cycloa.core.ProcessorSpirit();
	/**
	 *
	 * @override cycloa.core.ProcessorSpirit.run
	 */
	this.run = function(){
		/**
		 * @const
		 * @type {Number}
		 */
		var opcode = this.p.read(this.p.PC);
	};
	/**@private
	 * @function
	 * @param {Number} val */
	this.push = function(val) {
		this.p.write(0x0100 | ((this.p.SP--) & 0xff), val);
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.pop = function() {
		return this.p.read(0x0100 | ((this.p.SP++) & 0xff));
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrImmediate = function() {
		return this.p.PC++;
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrAbsolute = function() {
		return this.p.read(this.p.PC++) | (this.p.read(this.p.PC++) << 8);
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrZeroPage = function() {
		return this.p.read(this.PC++);
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrZeroPageIdxX = function() {
		return (this.p.read(this.p.PC++) + this.p.X) & 0xff;
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrZeroPageIdxY = function() {
		return (this.p.read(this.p.PC++) + this.p.Y) & 0xff;
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrAbsoluteIdxX = function() {
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
	this.addrAbsoluteIdxY = function() {
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
	this.addrRelative = function() {
		/** @const
		 *  @type {Number} */
		var offset = this.p.read(this.PC++);
		return (offset >= 128 ? (offset-256) : offset) + this.p.PC;
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrIndirectX = function() {
		/** @const
		 *  @type {Number} */
		var idx = (this.p.read(this.p.PC++) + this.p.X) & 0xff;
		return this.p.read(idx) | (this.p.read((idx+1)&0xff) << 8);
	};
	/**@private
	 * @function
	 * @return {Number} */
	this.addrIndirectY = function() {
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
	this.addrAbsoluteIndirect = function() { // used only in JMP
		/** @const
		 *  @type {Number} */
		var srcAddr = this.p.read(this.PC++) | (this.p.read(this.PC++) << 8);
		return this.p.read(srcAddr) | (this.p.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
	};
	this.updateFlagZN = function(val){
		this.p.P = (this.p.P & 0x7D) | cycloa.core.Processor.ZNFlagCache[val&0xff];
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.LDA = function(addr){
		this.updateFlagZN(this.p.A = this.p.read(addr));
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.LDY = function(addr) {
		this.updateFlagZN(this.p.Y = this.p.read(addr));
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.LDX = function(addr) {
		this.updateFlagZN(this.p.X = this.p.read(addr));
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.STA = function(addr) {
		this.p.write(addr, this.p.A);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.STX = function(addr) {
		this.p.write(addr, this.p.X);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.STY = function(addr) {
		this.p.write(addr, this.p.Y);
	};
	/**@private
	 * @function */
	this.TXA = function() {
		this.updateFlagZN(this.p.A = this.p.X);
	};
	/**@private
	 * @function */
	this.TYA = function() {
		this.updateFlagZN(this.p.A = this.p.Y);
	};
	/**@private
	 * @function */
	this.TXS = function() {
		this.p.SP = this.p.X;
	};
	/**@private
	 * @function */
	this.TAY = function() {
		this.updateFlagZN(this.p.Y = this.p.A);
	};
	/**@private
	 * @function */
	this.TAX = function() {
		this.updateFlagZN(this.p.X = this.p.A);
	};
	/**@private
	 * @function */
	this.TSX = function() {
		this.updateFlagZN(this.p.X = this.p.SP);
	};
	/**@private
	 * @function */
	this.PHP = function() {
		this.push(this.p.P | cycloa.core.Processor.FLAG.B); // bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	};
	/**@private
	 * @function */
	this.PLP = function() {
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
	this.PHA = function() {
		this.push(this.p.A);
	};
	/**@private
	 * @function */
	this.PLA = function() {
		this.p.updateFlagZN(this.p.A = this.pop());
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.ADC = function(addr) {
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
	this.SBC = function(addr) {
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
	this.CPX = function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.X - this.p.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.CPY = function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.Y - this.p.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.CMP = function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.A - this.p.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.p.P = (this.p.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.AND = function(addr) {
		this.updateFlagZN(this.p.A &= this.p.read(addr));
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.EOR = function(addr) {
		this.updateFlagZN(this.p.A ^= this.p.read(addr));
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.ORA = function(addr) {
		this.updateFlagZN(this.p.A |= this.p.read(addr));
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.BIT = function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.p.read(addr);
		this.p.P = (this.p.P & (0xff & ~(cycloa.core.Processor.FLAG.V | cycloa.core.Processor.FLAG.N | cycloa.core.Processor.FLAG.Z)))
			| (val & (cycloa.core.Processor.FLAG.V | cycloa.core.Processor.FLAG.N))
			| (cycloa.core.Processor.ZNFlagCache[this.p.A & val] & cycloa.core.Processor.FLAG.Z);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.ASL = function() { //FIXME: オーバーロード
		this.p.P = (this.p.P & 0xFE) | (this.p.A & 0xff) >> 7;
		this.updateFlagZN((this.p.A <<= 1) & 0xff);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.ASL = function(addr) { //FIXME: オーバーロード
		var val = this.p.read(addr);
		this.p.P = (this.p.P & 0xFE) | val >> 7;
		val <<= 1;
		this.p.write(addr, val);
		this.updateFlagZN(val);
	};
	/**@private
	 * @function */
	this.LSR = function() { //FIXME: オーバーロード
		this.p.P = (this.p.P & 0xFE) | (this.p.A & 0x01);
		this.p.A >>= 1;
		this.updateFlagZN(this.p.A);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.LSR = function(addr) { //FIXME: オーバーロード
		var val = this.p.read(addr);
		this.p.P = (this.p.P & 0xFE) | (val & 0x01);
		val >>= 1;
		this.p.write(addr, val);
		this.updateFlagZN(val);
	};
	/**@private
	 * @function */
	this.ROL = function() { //FIXME: オーバーロード
		var carry = (this.p.A & 0xff) >> 7;
		this.p.A = (this.p.A << 1) | (this.p.P & 0x01);
		this.p.P = (this.p.P & 0xFE) | carry;
		this.updateFlagZN(this.p.A);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.ROL = function(addr) { //FIXME: オーバーロード
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
	this.ROR = function() { //FIXME: オーバーロード
		this.p.P = (this.p.P & 0xFE) | (this.p.A & 0x01);
		this.updateFlagZN( this.p.A = ((this.p.A >> 1) & 0xff) | ((this.p.P & 0x01) << 7) );
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.ROR = function(addr) { //FIXME: オーバーロード
		var val = this.p.read(addr);
		/**@const
		 * @type {Number} */
		var carry = val & 0x01;
		val = (val >> 1) | ((this.p.P & 0x01) << 7);
		this.p.P = (this.p.P & 0xFE) | carry;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	}
	/**@private
	 * @function */
	this.INX = function() {
		this.updateFlagZN(++this.p.X);
	};
	/**@private
	 * @function */
	this.INY = function() {
		this.updateFlagZN(++this.p.Y);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.INC = function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.read(addr)+1) & 0xff;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	};
	/**@private
	 * @function */
	this.DEX = function() {
		this.updateFlagZN(--this.p.X);
	};
	/**@private
	 * @function */
	this.DEY = function() {
		this.updateFlagZN(--this.p.Y);
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.DEC = function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.p.read(addr)-1) & 0xff;
		this.updateFlagZN(val);
		this.p.write(addr, val);
	};
	/**@private
	 * @function */
	this.CLC = function() {
		this.p.P &= ~(cycloa.core.Processor.FLAG.C);
	};
	/**@private
	 * @function */
	this.CLI = function() {
		// http://twitter.com/#!/KiC6280/status/112348378100281344
		// http://twitter.com/#!/KiC6280/status/112351125084180480
		this.p.needStatusRewrite = true;
		this.p.newStatus = this.p.P & ~(cycloa.core.Processor.FLAG.I);
		//this.p.P &= ~(cycloa.core.Processor.FLAG.I);
	};
	/**@private
	 * @function */
	this.CLV = function() {
		this.p.P &= ~(cycloa.core.Processor.FLAG.V);
	};
	/**@private
	 * @function */
	this.CLD = function() {
		this.p.P &= ~(cycloa.core.Processor.FLAG.D);
	};
	/**@private
	 * @function */
	this.SEC = function() {
		this.p.P |= cycloa.core.Processor.FLAG.C;
	};
	/**@private
	 * @function */
	this.SEI = function() {
		this.p.P |= cycloa.core.Processor.FLAG.I;
	};
	/**@private
	 * @function */
	this.SED = function() {
		this.p.P |= cycloa.core.Processor.FLAG.D;
	};
	/**@private
	 * @function */
	this.NOP = function() {
		//NOP。そう、何もしない。
	};
	/**@private
	 * @function */
	this.BRK = function() {
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
	this.BCC = function(addr) {
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
	this.BCS = function(addr) {
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
	this.BEQ = function(addr) {
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
	this.BNE = function(addr) {
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
	this.BVC = function(addr) {
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
	this.BVS = function(addr) {
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
	this.BPL = function(addr) {
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
	this.BMI = function(addr) {
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
	this.JSR = function(addr) {
		this.p.PC--;
		this.push((this.p.PC >> 8) & 0xFF);
		this.push(this.p.PC & 0xFF);
		this.p.PC = addr;
	};
	/**@private
	 * @function
	 * @param {Number} addr */
	this.JMP = function(addr) {
		this.p.PC = addr;
	};
	/**@private
	 * @function */
	this.RTI = function() {
		this.p.P = this.pop();
		this.p.PC = this.pop() | (this.pop() << 8);
	};
	/**@private
	 * @function */
	this.RTS = function() {
		this.p.PC = this.pop() | (this.pop() << 8) + 1;
	};
};

cycloa.core.InterpreterSpirit.OperationTable = [

];


