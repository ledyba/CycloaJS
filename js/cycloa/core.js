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
		this.P |= cycloa.core.FLAG.ALWAYS_SET; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
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
	run: function(){ throw new cycloa.err.NotImplementedException("Please implement ProcessorSpirit#run"); },
};

/**
 * @extends cycloa.core.Spirit
 * @class
 * @constructor
 */
cycloa.core.InterpreterSpirit = function(){
	cycloa.core.Spirit.call(this);
};

cycloa.core.InterpreterSpirit.prototype = {
	/**
	 * @const
	 * @type {*}
	 * @private
	 */
	__proto__: cycloa.core.Spirit.prototype,
	/**
	 *
	 * @override cycloa.core.ProcessorSpirit.run
	 */
	run: function(){
		/** @const
		 * @type {Number} */
		var opcode = this.pr.read(this.pr.PC++);
		/**
		 * @const
		 * @type {Function}
		 */
		var func = cycloa.core.ActionTable[opcode];
		if(!func){
			throw new cycloa.err.CoreException("Unknwon opcode: "+opcode);
		}
		func.call(this);
	},
	/**@private
	 * @function
	 * @param {Number} val */
	push: function(val) {
		this.pr.write(0x0100 | ((this.pr.SP--) & 0xff), val);
	},
	/**@private
	 * @function
	 * @return {Number} */
	pop: function() {
		return this.pr.read(0x0100 | ((++this.pr.SP) & 0xff));
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrImmediate: function() {
		return this.pr.PC++;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsolute: function() {
		return this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPage: function() {
		return this.pr.read(this.pr.PC++);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPageIdxX: function() {
		return (this.pr.read(this.pr.PC++) + this.pr.X) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPageIdxY: function() {
		return (this.pr.read(this.pr.PC++) + this.pr.Y) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIdxX: function() {
		/** @const
		 *  @type {Number} */
		var orig = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.pr.X;
		if(((addr ^ orig) & 0x0100) != 0){
			this.pr.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIdxY: function() {
		/** @const
		 *  @type {Number} */
		var orig = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.pr.Y;
		if(((addr ^ orig) & 0x0100) != 0){
			this.pr.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrRelative: function() {
		/** @const
		 *  @type {Number} */
		var offset = this.pr.read(this.pr.PC++);
		return (offset >= 128 ? (offset-256) : offset) + this.pr.PC;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrIndirectX: function() {
		/** @const
		 *  @type {Number} */
		var idx = (this.pr.read(this.pr.PC++) + this.pr.X) & 0xff;
		return this.pr.read(idx) | (this.pr.read((idx+1)&0xff) << 8);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrIndirectY: function() {
		/** @const
		 *  @type {Number} */
		var idx = this.pr.read(this.pr.PC++);
		/** @const
		 *  @type {Number} */
		var orig = this.pr.read(idx) | (this.pr.read((idx+1)&0xff) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.pr.Y;
		if(((addr ^ orig) & 0x0100) != 0){
			this.pr.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIndirect: function() { // used only in JMP
		/** @const
		 *  @type {Number} */
		var srcAddr = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		return this.pr.read(srcAddr) | (this.pr.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
	},
	updateFlagZN: function(val){
		this.pr.P = (this.pr.P & 0x7D) | cycloa.core.ZNFlagCache[val&0xff];
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LDA: function(addr){
		this.updateFlagZN(this.pr.A = this.pr.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LDY: function(addr) {
		this.updateFlagZN(this.pr.Y = this.pr.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LDX: function(addr) {
		this.updateFlagZN(this.pr.X = this.pr.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	STA: function(addr) {
		this.pr.write(addr, this.pr.A);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	STX: function(addr) {
		this.pr.write(addr, this.pr.X);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	STY: function(addr) {
		this.pr.write(addr, this.pr.Y);
	},
	/**@private
	 * @function */
	TXA: function() {
		this.updateFlagZN(this.pr.A = this.pr.X);
	},
	/**@private
	 * @function */
	TYA: function() {
		this.updateFlagZN(this.pr.A = this.pr.Y);
	},
	/**@private
	 * @function */
	TXS: function() {
		this.pr.SP = this.pr.X;
	},
	/**@private
	 * @function */
	TAY: function() {
		this.updateFlagZN(this.pr.Y = this.pr.A);
	},
	/**@private
	 * @function */
	TAX: function() {
		this.updateFlagZN(this.pr.X = this.pr.A);
	},
	/**@private
	 * @function */
	TSX: function() {
		this.updateFlagZN(this.pr.X = this.pr.SP);
	},
	/**@private
	 * @function */
	PHP: function() {
		this.push(this.pr.P | cycloa.core.FLAG.B); // bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	},
	/**@private
	 * @function */
	PLP: function() {
		/**@const
		 * @type {Number} */
		var newP = this.pop();
		if((this.pr.P & cycloa.core.FLAG.I) == cycloa.core.FLAG.I && (newP & cycloa.core.FLAG.I) == 0){
			// FIXME: ここどうする？？
			//this.pr.needStatusRewrite = true;
			//this.pr.newStatus =newP;
			this.pr.P = newP;
		}else{
			this.pr.P = newP;
		}
	},
	/**@private
	 * @function */
	PHA: function() {
		this.push(this.pr.A);
	},
	/**@private
	 * @function */
	PLA: function() {
		this.updateFlagZN(this.pr.A = this.pop());
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ADC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.pr.read(addr);
		/**@const
		 * @type {Number} */
		var result = (this.pr.A + val + (this.pr.P & cycloa.core.FLAG.C)) & 0xffff;
		/**@const
		 * @type {Number} */
		var newA = result & 0xff;
		this.pr.P = (this.pr.P & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.C))
			| ((((this.pr.A ^ val) & 0x80) ^ 0x80) & ((this.pr.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
			| ((result >> 8) & cycloa.core.FLAG.C); //set C flag
		this.updateFlagZN(this.pr.A = newA);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	SBC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.pr.read(addr);
		/**@const
		 * @type {Number} */
		var result = (this.pr.A - val - ((this.pr.P & cycloa.core.FLAG.C) ^ cycloa.core.FLAG.C)) & 0xffff;
		/**@const
		 * @type {Number} */
		var newA = result & 0xff;
		this.pr.P = (this.pr.P & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.C))
			| ((this.pr.A ^ val) & (this.pr.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
			| (((result >> 8) & cycloa.core.FLAG.C) ^ cycloa.core.FLAG.C);
		this.updateFlagZN(this.pr.A = newA);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	CPX: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.pr.X - this.pr.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.pr.P = (this.pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	CPY: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.pr.Y - this.pr.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.pr.P = (this.pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	CMP: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.pr.A - this.pr.read(addr)) & 0xffff;
		this.updateFlagZN(val & 0xff);
		this.pr.P = (this.pr.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	AND: function(addr) {
		this.updateFlagZN(this.pr.A &= this.pr.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	EOR: function(addr) {
		this.updateFlagZN(this.pr.A ^= this.pr.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ORA: function(addr) {
		this.updateFlagZN(this.pr.A |= this.pr.read(addr));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BIT: function(addr) {
		/**@const
		 * @type {Number} */
		var val = this.pr.read(addr);
		this.pr.P = (this.pr.P & (0xff & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.N | cycloa.core.FLAG.Z)))
			| (val & (cycloa.core.FLAG.V | cycloa.core.FLAG.N))
			| (cycloa.core.ZNFlagCache[this.pr.A & val] & cycloa.core.FLAG.Z);
	},
	/**@private
	 * @function */
	ASL_: function() {
		this.pr.P = (this.pr.P & 0xFE) | (this.pr.A & 0xff) >> 7;
		this.updateFlagZN(this.pr.A = (this.pr.A << 1) & 0xff);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ASL: function(addr) {
		var val = this.pr.read(addr);
		this.pr.P = (this.pr.P & 0xFE) | val >> 7;
		val <<= 1;
		this.pr.write(addr, val);
		this.updateFlagZN(val);
	},
	/**@private
	 * @function */
	LSR_: function() {
		this.pr.P = (this.pr.P & 0xFE) | (this.pr.A & 0x01);
		this.pr.A >>= 1;
		this.updateFlagZN(this.pr.A);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	LSR: function(addr) {
		var val = this.pr.read(addr);
		this.pr.P = (this.pr.P & 0xFE) | (val & 0x01);
		val >>= 1;
		this.pr.write(addr, val);
		this.updateFlagZN(val);
	},
	/**@private
	 * @function */
	ROL_: function() {
		var carry = (this.pr.A & 0xff) >> 7;
		this.pr.A = (this.pr.A << 1) | (this.pr.P & 0x01);
		this.pr.P = (this.pr.P & 0xFE) | carry;
		this.updateFlagZN(this.pr.A);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ROL: function(addr) {
		var val = this.pr.read(addr);
		/**@const
		 * @type {Number} */
		var carry = val >> 7;
		val = ((val << 1) & 0xff) | (this.pr.P & 0x01);
		this.pr.P = (this.pr.P & 0xFE) | carry;
		this.updateFlagZN(val);
		this.pr.write(addr, val);
	},
	/**@private
	 * @function */
	ROR_: function() {
		this.pr.P = (this.pr.P & 0xFE) | (this.pr.A & 0x01);
		this.updateFlagZN( this.pr.A = ((this.pr.A >> 1) & 0xff) | ((this.pr.P & 0x01) << 7) );
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	ROR: function(addr) { //FIXME: オーバーロード
		var val = this.pr.read(addr);
		/**@const
		 * @type {Number} */
		var carry = val & 0x01;
		val = (val >> 1) | ((this.pr.P & 0x01) << 7);
		this.pr.P = (this.pr.P & 0xFE) | carry;
		this.updateFlagZN(val);
		this.pr.write(addr, val);
	},
	/**@private
	 * @function */
	INX: function() {
		this.updateFlagZN(this.pr.X = (this.pr.X+1)&0xff);
	},
	/**@private
	 * @function */
	INY: function() {
		this.updateFlagZN(this.pr.Y = (this.pr.Y+1)&0xff);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	INC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.pr.read(addr)+1) & 0xff;
		this.updateFlagZN(val);
		this.pr.write(addr, val);
	},
	/**@private
	 * @function */
	DEX: function() {
		this.updateFlagZN(this.pr.X = (this.pr.X-1)&0xff);
	},
	/**@private
	 * @function */
	DEY: function() {
		this.updateFlagZN(this.pr.Y = (this.pr.Y-1)&0xff);
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	DEC: function(addr) {
		/**@const
		 * @type {Number} */
		var val = (this.pr.read(addr)-1) & 0xff;
		this.updateFlagZN(val);
		this.pr.write(addr, val);
	},
	/**@private
	 * @function */
	CLC: function() {
		this.pr.P &= ~(cycloa.core.FLAG.C);
	},
	/**@private
	 * @function */
	CLI: function() {
		// http://twitter.com/#!/KiC6280/status/112348378100281344
		// http://twitter.com/#!/KiC6280/status/112351125084180480
		//FIXME
		//this.pr.needStatusRewrite = true;
		//this.pr.newStatus = this.pr.P & ~(cycloa.core.FLAG.I);
		this.p.P &= ~(cycloa.core.FLAG.I);
	},
	/**@private
	 * @function */
	CLV: function() {
		this.pr.P &= ~(cycloa.core.FLAG.V);
	},
	/**@private
	 * @function */
	CLD: function() {
		this.pr.P &= ~(cycloa.core.FLAG.D);
	},
	/**@private
	 * @function */
	SEC: function() {
		this.pr.P |= cycloa.core.FLAG.C;
	},
	/**@private
	 * @function */
	SEI: function() {
		this.pr.P |= cycloa.core.FLAG.I;
	},
	/**@private
	 * @function */
	SED: function() {
		this.pr.P |= cycloa.core.FLAG.D;
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
		this.pr.PC++;
		this.push((this.pr.PC >> 8) & 0xFF);
		this.push(this.pr.PC & 0xFF);
		this.pr.P |= cycloa.core.FLAG.B;
		this.push(this.pr.P);
		this.pr.P |= cycloa.core.FLAG.I;
		this.pr.PC = (this.pr.read(0xFFFE) | (this.pr.read(0xFFFF) << 8));
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BCC: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.C) == 0){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BCS: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.C) == cycloa.core.FLAG.C){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BEQ: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.Z) == cycloa.core.FLAG.Z){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BNE: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.Z) == 0){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BVC: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.V) == 0){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BVS: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.V) == cycloa.core.FLAG.V){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BPL: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.N) == 0){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	BMI: function(addr) {
		if((this.pr.P & cycloa.core.FLAG.N) == cycloa.core.FLAG.N){
			if(((this.pr.PC ^ addr) & 0x0100) != 0){
				this.pr.consumeClock(2);
			}else{
				this.pr.consumeClock(1);
			}
			this.pr.PC = addr;
		}
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	JSR: function(addr) {
		this.pr.PC--;
		this.push((this.pr.PC >> 8) & 0xFF);
		this.push(this.pr.PC & 0xFF);
		this.pr.PC = addr;
	},
	/**@private
	 * @function
	 * @param {Number} addr */
	JMP: function(addr) {
		this.pr.PC = addr;
	},
	/**@private
	 * @function */
	RTI: function() {
		this.pr.P = this.pop();
		this.pr.PC = this.pop() | (this.pop() << 8);
	},
	/**@private
	 * @function */
	RTS: function() {
		this.pr.PC = (this.pop() | (this.pop() << 8)) + 1;
	}
};

/**
 * @extends cycloa.core.Spirit
 * @constructor
 */
cycloa.core.TraceSpirit = function() {
	cycloa.core.Spirit.call(this);
};
cycloa.core.TraceSpirit.prototype = {
	__proto__: cycloa.core.Spirit.prototype,
	/**
	 * @nosideeffects
	 * @param {Number} num
	 * @param {Number} len
	 * @return {String}
	 */
	formatHex: function(num, len){
		return ("0000" + num.toString(16)).slice(-(len/4));
	},
	formatMachineStatus: function(){

	},
	/**
	 * @override cycloa.core.Spirit.run
	 * @nosideeffects
	 */
	run: function(){
		/** @const
		 * @type {Number} */
		var opcode = this.pr.read(this.pr.PC);
		var str = this.formatHex(this.pr.PC, 16)+"  "+this.formatHex(opcode, 8)+" ";
		/**
		 * @const
		 * @type {Function}
		 */
		var func = cycloa.core.ActionTable[opcode];
		if(!func){
			return str+"     ???";
		}
		return str+func.call(this);
	},
	/**@private
	 * @function
	 * @param {Number} val */
	push: function(val) {
		this.pr.write(0x0100 | ((this.pr.SP--) & 0xff), val);
	},
	/**@private
	 * @function
	 * @return {Number} */
	pop: function() {
		return this.pr.read(0x0100 | ((this.pr.SP++) & 0xff));
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrImmediate: function() {
		return this.pr.PC++;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsolute: function() {
		return this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPage: function() {
		return this.pr.read(this.pr.PC++);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPageIdxX: function() {
		return (this.pr.read(this.pr.PC++) + this.pr.X) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeroPageIdxY: function() {
		return (this.pr.read(this.pr.PC++) + this.pr.Y) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIdxX: function() {
		/** @const
		 *  @type {Number} */
		var orig = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.pr.X;
		if(((addr ^ orig) & 0x0100) != 0){
			this.pr.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIdxY: function() {
		/** @const
		 *  @type {Number} */
		var orig = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.pr.Y;
		if(((addr ^ orig) & 0x0100) != 0){
			this.pr.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrRelative: function() {
		/** @const
		 *  @type {Number} */
		var offset = this.pr.read(this.pr.PC++);
		return (offset >= 128 ? (offset-256) : offset) + this.pr.PC;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrIndirectX: function() {
		/** @const
		 *  @type {Number} */
		var idx = (this.pr.read(this.pr.PC++) + this.pr.X) & 0xff;
		return this.pr.read(idx) | (this.pr.read((idx+1)&0xff) << 8);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrIndirectY: function() {
		/** @const
		 *  @type {Number} */
		var idx = this.pr.read(this.pr.PC++);
		/** @const
		 *  @type {Number} */
		var orig = this.pr.read(idx) | (this.pr.read((idx+1)&0xff) << 8);
		/** @const
		 *  @type {Number} */
		var addr = orig + this.pr.Y;
		if(((addr ^ orig) & 0x0100) != 0){
			this.pr.consumeClock(1);
		}
		return addr;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrAbsoluteIndirect: function() { // used only in JMP
		/** @const
		 *  @type {Number} */
		var srcAddr = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		return this.pr.read(srcAddr) | (this.pr.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
	}
};

/**
 * Pレジスタのフラグ
 * @const
 * @type {Object}
 * @enum {Number}
 */
cycloa.core.FLAG = {
	C: 1,
	Z: 2,
	I: 4,
	D: 8,
	B: 16, // not used in NES
	ALWAYS_SET: 32,
	V: 64,
	N: 128
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
 * 命令ごとに必要なクロック数
 * @const
 * @type {Uint8Array}
 */
cycloa.core.CycleTable = new Uint8Array([
	7, 6, 2, 8, 3, 3, 5, 5,3, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
	6, 6, 2, 8, 3, 3, 5, 5,4, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
	6, 6, 2, 8, 3, 3, 5, 5,3, 2, 2, 2, 3, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
	6, 6, 2, 8, 3, 3, 5, 5,4, 2, 2, 2, 5, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
	2, 6, 2, 6, 3, 3, 3, 3,2, 2, 2, 2, 4, 4, 4, 4,
	2, 5, 2, 6, 4, 4, 4, 4,2, 4, 2, 5, 5, 4, 5, 5,
	2, 6, 2, 6, 3, 3, 3, 3,2, 2, 2, 2, 4, 4, 4, 4,
	2, 5, 2, 5, 4, 4, 4, 4,2, 4, 2, 4, 4, 4, 4, 4,
	2, 6, 2, 8, 3, 3, 5, 5,2, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
	2, 6, 3, 8, 3, 3, 5, 5,2, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7
]);

/**
 * @const
 * @type {Number}
 */
cycloa.core.RESET_CLOCK = 6;

/**
 * @const
 * @type {Function[]}
 */
cycloa.core.ActionTable = [
	function(){return this.BRK() /* 0x0, BRK, nil */;},
	function(){return this.ORA(this.addrIndirectX()) /* 0x1, ORA, IndirectX */;},
	undefined,
	undefined,
	undefined,
	function(){return this.ORA(this.addrZeroPage()) /* 0x5, ORA, Zeropage */;},
	function(){return this.ASL(this.addrZeroPage()) /* 0x6, ASL, Zeropage */;},
	undefined,
	function(){return this.PHP() /* 0x8, PHP, nil */;},
	function(){return this.ORA(this.addrImmediate()) /* 0x9, ORA, Immediate */;},
	function(){return this.ASL_() /* 0xa, ASL, nil */;},
	undefined,
	undefined,
	function(){return this.ORA(this.addrAbsolute()) /* 0xd, ORA, Absolute */;},
	function(){return this.ASL(this.addrAbsolute()) /* 0xe, ASL, Absolute */;},
	undefined,
	function(){return this.BPL(this.addrRelative()) /* 0x10, BPL, Immediate */;},
	function(){return this.ORA(this.addrIndirectY()) /* 0x11, ORA, IndirectY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.ORA(this.addrZeroPageIdxX()) /* 0x15, ORA, ZeropageX */;},
	function(){return this.ASL(this.addrZeroPageIdxX()) /* 0x16, ASL, ZeropageX */;},
	undefined,
	function(){return this.CLC() /* 0x18, CLC, nil */;},
	function(){return this.ORA(this.addrAbsoluteIdxY()) /* 0x19, ORA, AbsoluteY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.ORA(this.addrAbsoluteIdxX()) /* 0x1d, ORA, AbsoluteX */;},
	function(){return this.ASL(this.addrAbsoluteIdxX()) /* 0x1e, ASL, AbsoluteX */;},
	undefined,
	function(){return this.JSR(this.addrAbsolute()) /* 0x20, JSR, Absolute */;},
	function(){return this.AND(this.addrIndirectX()) /* 0x21, AND, IndirectX */;},
	undefined,
	undefined,
	function(){return this.BIT(this.addrZeroPage()) /* 0x24, BIT, Zeropage */;},
	function(){return this.AND(this.addrZeroPage()) /* 0x25, AND, Zeropage */;},
	function(){return this.ROL(this.addrZeroPage()) /* 0x26, ROL, Zeropage */;},
	undefined,
	function(){return this.PLP() /* 0x28, PLP, nil */;},
	function(){return this.AND(this.addrImmediate()) /* 0x29, AND, Immediate */;},
	function(){return this.ROL_() /* 0x2a, ROL, nil */;},
	undefined,
	function(){return this.BIT(this.addrAbsolute()) /* 0x2c, BIT, Absolute */;},
	function(){return this.AND(this.addrAbsolute()) /* 0x2d, AND, Absolute */;},
	function(){return this.ROL(this.addrAbsolute()) /* 0x2e, ROL, Absolute */;},
	undefined,
	function(){return this.BMI(this.addrRelative()) /* 0x30, BMI, Immediate */;},
	function(){return this.AND(this.addrIndirectY()) /* 0x31, AND, IndirectY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.AND(this.addrZeroPageIdxX()) /* 0x35, AND, ZeropageX */;},
	function(){return this.ROL(this.addrZeroPageIdxX()) /* 0x36, ROL, ZeropageX */;},
	undefined,
	function(){return this.SEC() /* 0x38, SEC, nil */;},
	function(){return this.AND(this.addrAbsoluteIdxY()) /* 0x39, AND, AbsoluteY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.AND(this.addrAbsoluteIdxX()) /* 0x3d, AND, AbsoluteX */;},
	function(){return this.ROL(this.addrAbsoluteIdxX()) /* 0x3e, ROL, AbsoluteX */;},
	undefined,
	function(){return this.RTI() /* 0x40, RTI, nil */;},
	function(){return this.EOR(this.addrIndirectX()) /* 0x41, EOR, IndirectX */;},
	undefined,
	undefined,
	undefined,
	function(){return this.EOR(this.addrZeroPage()) /* 0x45, EOR, Zeropage */;},
	function(){return this.LSR(this.addrZeroPage()) /* 0x46, LSR, Zeropage */;},
	undefined,
	function(){return this.PHA() /* 0x48, PHA, nil */;},
	function(){return this.EOR(this.addrImmediate()) /* 0x49, EOR, Immediate */;},
	function(){return this.LSR_() /* 0x4a, LSR, nil */;},
	undefined,
	function(){return this.JMP(this.addrAbsolute()) /* 0x4c, JMP, Absolute */;},
	function(){return this.EOR(this.addrAbsolute()) /* 0x4d, EOR, Absolute */;},
	function(){return this.LSR(this.addrAbsolute()) /* 0x4e, LSR, Absolute */;},
	undefined,
	function(){return this.BVC(this.addrRelative()) /* 0x50, BVC, Immediate */;},
	function(){return this.EOR(this.addrIndirectY()) /* 0x51, EOR, IndirectY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.EOR(this.addrZeroPageIdxX()) /* 0x55, EOR, ZeropageX */;},
	function(){return this.LSR(this.addrZeroPageIdxX()) /* 0x56, LSR, ZeropageX */;},
	undefined,
	function(){return this.CLI() /* 0x58, CLI, nil */;},
	function(){return this.EOR(this.addrAbsoluteIdxY()) /* 0x59, EOR, AbsoluteY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.EOR(this.addrAbsoluteIdxX()) /* 0x5d, EOR, AbsoluteX */;},
	function(){return this.LSR(this.addrAbsoluteIdxX()) /* 0x5e, LSR, AbsoluteX */;},
	undefined,
	function(){return this.RTS() /* 0x60, RTS, nil */;},
	function(){return this.ADC(this.addrIndirectX()) /* 0x61, ADC, IndirectX */;},
	undefined,
	undefined,
	undefined,
	function(){return this.ADC(this.addrZeroPage()) /* 0x65, ADC, Zeropage */;},
	function(){return this.ROR(this.addrZeroPage()) /* 0x66, ROR, Zeropage */;},
	undefined,
	function(){return this.PLA() /* 0x68, PLA, nil */;},
	function(){return this.ADC(this.addrImmediate()) /* 0x69, ADC, Immediate */;},
	function(){return this.ROR_() /* 0x6a, ROR, nil */;},
	undefined,
	function(){return this.JMP(this.addrAbsoluteIndirect()) /* 0x6c, JMP, Indirect */;},
	function(){return this.ADC(this.addrAbsolute()) /* 0x6d, ADC, Absolute */;},
	function(){return this.ROR(this.addrAbsolute()) /* 0x6e, ROR, Absolute */;},
	undefined,
	function(){return this.BVS(this.addrRelative()) /* 0x70, BVS, Immediate */;},
	function(){return this.ADC(this.addrIndirectY()) /* 0x71, ADC, IndirectY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.ADC(this.addrZeroPageIdxX()) /* 0x75, ADC, ZeropageX */;},
	function(){return this.ROR(this.addrZeroPageIdxX()) /* 0x76, ROR, ZeropageX */;},
	undefined,
	function(){return this.SEI() /* 0x78, SEI, nil */;},
	function(){return this.ADC(this.addrAbsoluteIdxY()) /* 0x79, ADC, AbsoluteY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.ADC(this.addrAbsoluteIdxX()) /* 0x7d, ADC, AbsoluteX */;},
	function(){return this.ROR(this.addrAbsoluteIdxX()) /* 0x7e, ROR, AbsoluteX */;},
	undefined,
	undefined,
	function(){return this.STA(this.addrIndirectX()) /* 0x81, STA, IndirectX */;},
	undefined,
	undefined,
	function(){return this.STY(this.addrZeroPage()) /* 0x84, STY, Zeropage */;},
	function(){return this.STA(this.addrZeroPage()) /* 0x85, STA, Zeropage */;},
	function(){return this.STX(this.addrZeroPage()) /* 0x86, STX, Zeropage */;},
	undefined,
	function(){return this.DEY() /* 0x88, DEY, nil */;},
	undefined,
	function(){return this.TXA() /* 0x8a, TXA, nil */;},
	undefined,
	function(){return this.STY(this.addrAbsolute()) /* 0x8c, STY, Absolute */;},
	function(){return this.STA(this.addrAbsolute()) /* 0x8d, STA, Absolute */;},
	function(){return this.STX(this.addrAbsolute()) /* 0x8e, STX, Absolute */;},
	undefined,
	function(){return this.BCC(this.addrRelative()) /* 0x90, BCC, Immediate */;},
	function(){return this.STA(this.addrIndirectY()) /* 0x91, STA, IndirectY */;},
	undefined,
	undefined,
	function(){return this.STY(this.addrZeroPageIdxX()) /* 0x94, STY, ZeropageX */;},
	function(){return this.STA(this.addrZeroPageIdxX()) /* 0x95, STA, ZeropageX */;},
	function(){return this.STX(this.addrZeroPageIdxY()) /* 0x96, STX, ZeropageY */;},
	undefined,
	function(){return this.TYA() /* 0x98, TYA, nil */;},
	function(){return this.STA(this.addrAbsoluteIdxY()) /* 0x99, STA, AbsoluteY */;},
	function(){return this.TXS() /* 0x9a, TXS, nil */;},
	undefined,
	undefined,
	function(){return this.STA(this.addrAbsoluteIdxX()) /* 0x9d, STA, AbsoluteX */;},
	undefined,
	undefined,
	function(){return this.LDY(this.addrImmediate()) /* 0xa0, LDY, Immediate */;},
	function(){return this.LDA(this.addrIndirectX()) /* 0xa1, LDA, IndirectX */;},
	function(){return this.LDX(this.addrImmediate()) /* 0xa2, LDX, Immediate */;},
	undefined,
	function(){return this.LDY(this.addrZeroPage()) /* 0xa4, LDY, Zeropage */;},
	function(){return this.LDA(this.addrZeroPage()) /* 0xa5, LDA, Zeropage */;},
	function(){return this.LDX(this.addrZeroPage()) /* 0xa6, LDX, Zeropage */;},
	undefined,
	function(){return this.TAY() /* 0xa8, TAY, nil */;},
	function(){return this.LDA(this.addrImmediate()) /* 0xa9, LDA, Immediate */;},
	function(){return this.TAX() /* 0xaa, TAX, nil */;},
	undefined,
	function(){return this.LDY(this.addrAbsolute()) /* 0xac, LDY, Absolute */;},
	function(){return this.LDA(this.addrAbsolute()) /* 0xad, LDA, Absolute */;},
	function(){return this.LDX(this.addrAbsolute()) /* 0xae, LDX, Absolute */;},
	undefined,
	function(){return this.BCS(this.addrRelative()) /* 0xb0, BCS, Immediate */;},
	function(){return this.LDA(this.addrIndirectY()) /* 0xb1, LDA, IndirectY */;},
	undefined,
	undefined,
	function(){return this.LDY(this.addrZeroPageIdxX()) /* 0xb4, LDY, ZeropageX */;},
	function(){return this.LDA(this.addrZeroPageIdxX()) /* 0xb5, LDA, ZeropageX */;},
	function(){return this.LDX(this.addrZeroPageIdxY()) /* 0xb6, LDX, ZeropageY */;},
	undefined,
	function(){return this.CLV() /* 0xb8, CLV, nil */;},
	function(){return this.LDA(this.addrAbsoluteIdxY()) /* 0xb9, LDA, AbsoluteY */;},
	function(){return this.TSX() /* 0xba, TSX, nil */;},
	undefined,
	function(){return this.LDY(this.addrAbsoluteIdxX()) /* 0xbc, LDY, AbsoluteX */;},
	function(){return this.LDA(this.addrAbsoluteIdxX()) /* 0xbd, LDA, AbsoluteX */;},
	function(){return this.LDX(this.addrAbsoluteIdxY()) /* 0xbe, LDX, AbsoluteY */;},
	undefined,
	function(){return this.CPY(this.addrImmediate()) /* 0xc0, CPY, Immediate */;},
	function(){return this.CMP(this.addrIndirectX()) /* 0xc1, CMP, IndirectX */;},
	undefined,
	undefined,
	function(){return this.CPY(this.addrZeroPage()) /* 0xc4, CPY, Zeropage */;},
	function(){return this.CMP(this.addrZeroPage()) /* 0xc5, CMP, Zeropage */;},
	function(){return this.DEC(this.addrZeroPage()) /* 0xc6, DEC, Zeropage */;},
	undefined,
	function(){return this.INY() /* 0xc8, INY, nil */;},
	function(){return this.CMP(this.addrImmediate()) /* 0xc9, CMP, Immediate */;},
	function(){return this.DEX() /* 0xca, DEX, nil */;},
	undefined,
	function(){return this.CPY(this.addrAbsolute()) /* 0xcc, CPY, Absolute */;},
	function(){return this.CMP(this.addrAbsolute()) /* 0xcd, CMP, Absolute */;},
	function(){return this.DEC(this.addrAbsolute()) /* 0xce, DEC, Absolute */;},
	undefined,
	function(){return this.BNE(this.addrRelative()) /* 0xd0, BNE, Immediate */;},
	function(){return this.CMP(this.addrIndirectY()) /* 0xd1, CMP, IndirectY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.CMP(this.addrZeroPageIdxX()) /* 0xd5, CMP, ZeropageX */;},
	function(){return this.DEC(this.addrZeroPageIdxX()) /* 0xd6, DEC, ZeropageX */;},
	undefined,
	function(){return this.CLD() /* 0xd8, CLD, nil */;},
	function(){return this.CMP(this.addrAbsoluteIdxY()) /* 0xd9, CMP, AbsoluteY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.CMP(this.addrAbsoluteIdxX()) /* 0xdd, CMP, AbsoluteX */;},
	function(){return this.DEC(this.addrAbsoluteIdxX()) /* 0xde, DEC, AbsoluteX */;},
	undefined,
	function(){return this.CPX(this.addrImmediate()) /* 0xe0, CPX, Immediate */;},
	function(){return this.SBC(this.addrIndirectX()) /* 0xe1, SBC, IndirectX */;},
	undefined,
	undefined,
	function(){return this.CPX(this.addrZeroPage()) /* 0xe4, CPX, Zeropage */;},
	function(){return this.SBC(this.addrZeroPage()) /* 0xe5, SBC, Zeropage */;},
	function(){return this.INC(this.addrZeroPage()) /* 0xe6, INC, Zeropage */;},
	undefined,
	function(){return this.INX() /* 0xe8, INX, nil */;},
	function(){return this.SBC(this.addrImmediate()) /* 0xe9, SBC, Immediate */;},
	function(){return this.NOP() /* 0xea, NOP, nil */;},
	undefined,
	function(){return this.CPX(this.addrAbsolute()) /* 0xec, CPX, Absolute */;},
	function(){return this.SBC(this.addrAbsolute()) /* 0xed, SBC, Absolute */;},
	function(){return this.INC(this.addrAbsolute()) /* 0xee, INC, Absolute */;},
	undefined,
	function(){return this.BEQ(this.addrRelative()) /* 0xf0, BEQ, Immediate */;},
	function(){return this.SBC(this.addrIndirectY()) /* 0xf1, SBC, IndirectY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.SBC(this.addrZeroPageIdxX()) /* 0xf5, SBC, ZeropageX */;},
	function(){return this.INC(this.addrZeroPageIdxX()) /* 0xf6, INC, ZeropageX */;},
	undefined,
	function(){return this.SED() /* 0xf8, SED, nil */;},
	function(){return this.SBC(this.addrAbsoluteIdxY()) /* 0xf9, SBC, AbsoluteY */;},
	undefined,
	undefined,
	undefined,
	function(){return this.SBC(this.addrAbsoluteIdxX()) /* 0xfd, SBC, AbsoluteX */;},
	function(){return this.INC(this.addrAbsoluteIdxX()) /* 0xfe, INC, AbsoluteX */;},
	undefined
];
