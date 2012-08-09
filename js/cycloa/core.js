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
		/**
		 * @const
		 * @type {Function}
		 */
		cycloa.core.DecodeFuncTable[this.opcode = this.pr.read(this.pr.PC++)].call(this);
	},
	onInvalidOpcode: function(){
		throw new cycloa.ecx.CoreException("Invalid opcode: "+cycloa.util.formatHex(this.opcode));
	},
	/**@private
	 * @function
	 * @param {Number} val */
	push: function(val) {
		this.pr.write(0x0100 | (this.pr.SP-- & 0xff), val);
	},
	/**@private
	 * @function
	 * @return {Number} */
	pop: function() {
		return this.pr.read(0x0100 | (++this.pr.SP & 0xff));
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
	addrZeropage: function() {
		return this.pr.read(this.pr.PC++);
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeropageX: function() {
		return (this.pr.read(this.pr.PC++) + this.pr.X) & 0xff;
	},
	/**@private
	 * @function
	 * @return {Number} */
	addrZeropageY: function() {
		return (this.pr.read(this.pr.PC++) + this.pr.Y) & 0xff;
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
	addrAbsoluteX: function() {
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
	addrIndirect: function() { // used only in JMP
		/** @const
		 *  @type {Number} */
		var srcAddr = this.pr.read(this.pr.PC++) | (this.pr.read(this.pr.PC++) << 8);
		return this.pr.read(srcAddr) | (this.pr.read((srcAddr & 0xff00) | ((srcAddr+1) & 0x00ff)) << 8); //bug of NES
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
	addrAbsoluteY: function() {
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
	addrRelative: function() {
		/** @const
		 *  @type {Number} */
		var offset = this.pr.read(this.pr.PC++);
		return (offset >= 128 ? (offset-256) : offset) + this.pr.PC;
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
	TXA_: function() {
		this.updateFlagZN(this.pr.A = this.pr.X);
	},
	/**@private
	 * @function */
	TYA_: function() {
		this.updateFlagZN(this.pr.A = this.pr.Y);
	},
	/**@private
	 * @function */
	TXS_: function() {
		this.pr.SP = this.pr.X;
	},
	/**@private
	 * @function */
	TAY_: function() {
		this.updateFlagZN(this.pr.Y = this.pr.A);
	},
	/**@private
	 * @function */
	TAX_: function() {
		this.updateFlagZN(this.pr.X = this.pr.A);
	},
	/**@private
	 * @function */
	TSX_: function() {
		this.updateFlagZN(this.pr.X = this.pr.SP);
	},
	/**@private
	 * @function */
	PHP_: function() {
		this.push(this.pr.P | cycloa.core.FLAG.B); // bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	},
	/**@private
	 * @function */
	PLP_: function() {
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
	PHA_: function() {
		this.push(this.pr.A);
	},
	/**@private
	 * @function */
	PLA_: function() {
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
	INX_: function() {
		this.updateFlagZN(this.pr.X = (this.pr.X+1)&0xff);
	},
	/**@private
	 * @function */
	INY_: function() {
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
	DEX_: function() {
		this.updateFlagZN(this.pr.X = (this.pr.X-1)&0xff);
	},
	/**@private
	 * @function */
	DEY_: function() {
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
	CLC_: function() {
		this.pr.P &= ~(cycloa.core.FLAG.C);
	},
	/**@private
	 * @function */
	CLI_: function() {
		// http://twitter.com/#!/KiC6280/status/112348378100281344
		// http://twitter.com/#!/KiC6280/status/112351125084180480
		//FIXME
		//this.pr.needStatusRewrite = true;
		//this.pr.newStatus = this.pr.P & ~(cycloa.core.FLAG.I);
		this.p.P &= ~(cycloa.core.FLAG.I);
	},
	/**@private
	 * @function */
	CLV_: function() {
		this.pr.P &= ~(cycloa.core.FLAG.V);
	},
	/**@private
	 * @function */
	CLD_: function() {
		this.pr.P &= ~(cycloa.core.FLAG.D);
	},
	/**@private
	 * @function */
	SEC_: function() {
		this.pr.P |= cycloa.core.FLAG.C;
	},
	/**@private
	 * @function */
	SEI_: function() {
		this.pr.P |= cycloa.core.FLAG.I;
	},
	/**@private
	 * @function */
	SED_: function() {
		this.pr.P |= cycloa.core.FLAG.D;
	},
	/**@private
	 * @function */
	NOP_: function() {
		//NOP。そう、何もしない。
	},
	/**@private
	 * @function */
	BRK_: function() {
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
	RTI_: function() {
		this.pr.P = this.pop();
		this.pr.PC = this.pop() | (this.pop() << 8);
	},
	/**@private
	 * @function */
	RTS_: function() {
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
 *
 * @type {Function[]}
 */
cycloa.core.DecodeFuncTable = [
	function(){return this.BRK_() /* 0x0, BRK */;},
	function(){return this.ORA(this.addrIndirectX()) /* 0x1, ORA, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ORA(this.addrZeropage()) /* 0x5, ORA, Zeropage */;},
	function(){return this.ASL(this.addrZeropage()) /* 0x6, ASL, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.PHP_() /* 0x8, PHP */;},
	function(){return this.ORA(this.addrImmediate()) /* 0x9, ORA, Immediate */;},
	function(){return this.ASL_() /* 0xa, ASL */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ORA(this.addrAbsolute()) /* 0xd, ORA, Absolute */;},
	function(){return this.ASL(this.addrAbsolute()) /* 0xe, ASL, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BPL(this.addrRelative()) /* 0x10, BPL, Relative */;},
	function(){return this.ORA(this.addrIndirectY()) /* 0x11, ORA, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ORA(this.addrZeropageX()) /* 0x15, ORA, ZeropageX */;},
	function(){return this.ASL(this.addrZeropageX()) /* 0x16, ASL, ZeropageX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CLC_() /* 0x18, CLC */;},
	function(){return this.ORA(this.addrAbsoluteY()) /* 0x19, ORA, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ORA(this.addrAbsoluteX()) /* 0x1d, ORA, AbsoluteX */;},
	function(){return this.ASL(this.addrAbsoluteX()) /* 0x1e, ASL, AbsoluteX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.JSR(this.addrAbsolute()) /* 0x20, JSR, Absolute */;},
	function(){return this.AND(this.addrIndirectX()) /* 0x21, AND, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.BIT(this.addrZeropage()) /* 0x24, BIT, Zeropage */;},
	function(){return this.AND(this.addrZeropage()) /* 0x25, AND, Zeropage */;},
	function(){return this.ROL(this.addrZeropage()) /* 0x26, ROL, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.PLP_() /* 0x28, PLP */;},
	function(){return this.AND(this.addrImmediate()) /* 0x29, AND, Immediate */;},
	function(){return this.ROL_() /* 0x2a, ROL */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BIT(this.addrAbsolute()) /* 0x2c, BIT, Absolute */;},
	function(){return this.AND(this.addrAbsolute()) /* 0x2d, AND, Absolute */;},
	function(){return this.ROL(this.addrAbsolute()) /* 0x2e, ROL, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BMI(this.addrRelative()) /* 0x30, BMI, Relative */;},
	function(){return this.AND(this.addrIndirectY()) /* 0x31, AND, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.AND(this.addrZeropageX()) /* 0x35, AND, ZeropageX */;},
	function(){return this.ROL(this.addrZeropageX()) /* 0x36, ROL, ZeropageX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.SEC_() /* 0x38, SEC */;},
	function(){return this.AND(this.addrAbsoluteY()) /* 0x39, AND, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.AND(this.addrAbsoluteX()) /* 0x3d, AND, AbsoluteX */;},
	function(){return this.ROL(this.addrAbsoluteX()) /* 0x3e, ROL, AbsoluteX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.RTI_() /* 0x40, RTI */;},
	function(){return this.EOR(this.addrIndirectX()) /* 0x41, EOR, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.EOR(this.addrZeropage()) /* 0x45, EOR, Zeropage */;},
	function(){return this.LSR(this.addrZeropage()) /* 0x46, LSR, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.PHA_() /* 0x48, PHA */;},
	function(){return this.EOR(this.addrImmediate()) /* 0x49, EOR, Immediate */;},
	function(){return this.LSR_() /* 0x4a, LSR */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.JMP(this.addrAbsolute()) /* 0x4c, JMP, Absolute */;},
	function(){return this.EOR(this.addrAbsolute()) /* 0x4d, EOR, Absolute */;},
	function(){return this.LSR(this.addrAbsolute()) /* 0x4e, LSR, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BVC(this.addrRelative()) /* 0x50, BVC, Relative */;},
	function(){return this.EOR(this.addrIndirectY()) /* 0x51, EOR, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.EOR(this.addrZeropageX()) /* 0x55, EOR, ZeropageX */;},
	function(){return this.LSR(this.addrZeropageX()) /* 0x56, LSR, ZeropageX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CLI_() /* 0x58, CLI */;},
	function(){return this.EOR(this.addrAbsoluteY()) /* 0x59, EOR, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.EOR(this.addrAbsoluteX()) /* 0x5d, EOR, AbsoluteX */;},
	function(){return this.LSR(this.addrAbsoluteX()) /* 0x5e, LSR, AbsoluteX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.RTS_() /* 0x60, RTS */;},
	function(){return this.ADC(this.addrIndirectX()) /* 0x61, ADC, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ADC(this.addrZeropage()) /* 0x65, ADC, Zeropage */;},
	function(){return this.ROR(this.addrZeropage()) /* 0x66, ROR, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.PLA_() /* 0x68, PLA */;},
	function(){return this.ADC(this.addrImmediate()) /* 0x69, ADC, Immediate */;},
	function(){return this.ROR_() /* 0x6a, ROR */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.JMP(this.addrIndirect()) /* 0x6c, JMP, Indirect */;},
	function(){return this.ADC(this.addrAbsolute()) /* 0x6d, ADC, Absolute */;},
	function(){return this.ROR(this.addrAbsolute()) /* 0x6e, ROR, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BVS(this.addrRelative()) /* 0x70, BVS, Relative */;},
	function(){return this.ADC(this.addrIndirectY()) /* 0x71, ADC, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ADC(this.addrZeropageX()) /* 0x75, ADC, ZeropageX */;},
	function(){return this.ROR(this.addrZeropageX()) /* 0x76, ROR, ZeropageX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.SEI_() /* 0x78, SEI */;},
	function(){return this.ADC(this.addrAbsoluteY()) /* 0x79, ADC, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.ADC(this.addrAbsoluteX()) /* 0x7d, ADC, AbsoluteX */;},
	function(){return this.ROR(this.addrAbsoluteX()) /* 0x7e, ROR, AbsoluteX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.STA(this.addrIndirectX()) /* 0x81, STA, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.STY(this.addrZeropage()) /* 0x84, STY, Zeropage */;},
	function(){return this.STA(this.addrZeropage()) /* 0x85, STA, Zeropage */;},
	function(){return this.STX(this.addrZeropage()) /* 0x86, STX, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.DEY_() /* 0x88, DEY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.TXA_() /* 0x8a, TXA */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.STY(this.addrAbsolute()) /* 0x8c, STY, Absolute */;},
	function(){return this.STA(this.addrAbsolute()) /* 0x8d, STA, Absolute */;},
	function(){return this.STX(this.addrAbsolute()) /* 0x8e, STX, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BCC(this.addrRelative()) /* 0x90, BCC, Relative */;},
	function(){return this.STA(this.addrIndirectY()) /* 0x91, STA, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.STY(this.addrZeropageX()) /* 0x94, STY, ZeropageX */;},
	function(){return this.STA(this.addrZeropageX()) /* 0x95, STA, ZeropageX */;},
	function(){return this.STX(this.addrZeropageY()) /* 0x96, STX, ZeropageY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.TYA_() /* 0x98, TYA */;},
	function(){return this.STA(this.addrAbsoluteY()) /* 0x99, STA, AbsoluteY */;},
	function(){return this.TXS_() /* 0x9a, TXS */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.STA(this.addrAbsoluteX()) /* 0x9d, STA, AbsoluteX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.LDY(this.addrImmediate()) /* 0xa0, LDY, Immediate */;},
	function(){return this.LDA(this.addrIndirectX()) /* 0xa1, LDA, IndirectX */;},
	function(){return this.LDX(this.addrImmediate()) /* 0xa2, LDX, Immediate */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.LDY(this.addrZeropage()) /* 0xa4, LDY, Zeropage */;},
	function(){return this.LDA(this.addrZeropage()) /* 0xa5, LDA, Zeropage */;},
	function(){return this.LDX(this.addrZeropage()) /* 0xa6, LDX, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.TAY_() /* 0xa8, TAY */;},
	function(){return this.LDA(this.addrImmediate()) /* 0xa9, LDA, Immediate */;},
	function(){return this.TAX_() /* 0xaa, TAX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.LDY(this.addrAbsolute()) /* 0xac, LDY, Absolute */;},
	function(){return this.LDA(this.addrAbsolute()) /* 0xad, LDA, Absolute */;},
	function(){return this.LDX(this.addrAbsolute()) /* 0xae, LDX, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BCS(this.addrRelative()) /* 0xb0, BCS, Relative */;},
	function(){return this.LDA(this.addrIndirectY()) /* 0xb1, LDA, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.LDY(this.addrZeropageX()) /* 0xb4, LDY, ZeropageX */;},
	function(){return this.LDA(this.addrZeropageX()) /* 0xb5, LDA, ZeropageX */;},
	function(){return this.LDX(this.addrZeropageY()) /* 0xb6, LDX, ZeropageY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CLV_() /* 0xb8, CLV */;},
	function(){return this.LDA(this.addrAbsoluteY()) /* 0xb9, LDA, AbsoluteY */;},
	function(){return this.TSX_() /* 0xba, TSX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.LDY(this.addrAbsoluteX()) /* 0xbc, LDY, AbsoluteX */;},
	function(){return this.LDA(this.addrAbsoluteX()) /* 0xbd, LDA, AbsoluteX */;},
	function(){return this.LDX(this.addrAbsoluteY()) /* 0xbe, LDX, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CPY(this.addrImmediate()) /* 0xc0, CPY, Immediate */;},
	function(){return this.CMP(this.addrIndirectX()) /* 0xc1, CMP, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.CPY(this.addrZeropage()) /* 0xc4, CPY, Zeropage */;},
	function(){return this.CMP(this.addrZeropage()) /* 0xc5, CMP, Zeropage */;},
	function(){return this.DEC(this.addrZeropage()) /* 0xc6, DEC, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.INY_() /* 0xc8, INY */;},
	function(){return this.CMP(this.addrImmediate()) /* 0xc9, CMP, Immediate */;},
	function(){return this.DEX_() /* 0xca, DEX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CPY(this.addrAbsolute()) /* 0xcc, CPY, Absolute */;},
	function(){return this.CMP(this.addrAbsolute()) /* 0xcd, CMP, Absolute */;},
	function(){return this.DEC(this.addrAbsolute()) /* 0xce, DEC, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BNE(this.addrRelative()) /* 0xd0, BNE, Relative */;},
	function(){return this.CMP(this.addrIndirectY()) /* 0xd1, CMP, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.CMP(this.addrZeropageX()) /* 0xd5, CMP, ZeropageX */;},
	function(){return this.DEC(this.addrZeropageX()) /* 0xd6, DEC, ZeropageX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CLD_() /* 0xd8, CLD */;},
	function(){return this.CMP(this.addrAbsoluteY()) /* 0xd9, CMP, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.CMP(this.addrAbsoluteX()) /* 0xdd, CMP, AbsoluteX */;},
	function(){return this.DEC(this.addrAbsoluteX()) /* 0xde, DEC, AbsoluteX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CPX(this.addrImmediate()) /* 0xe0, CPX, Immediate */;},
	function(){return this.SBC(this.addrIndirectX()) /* 0xe1, SBC, IndirectX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.CPX(this.addrZeropage()) /* 0xe4, CPX, Zeropage */;},
	function(){return this.SBC(this.addrZeropage()) /* 0xe5, SBC, Zeropage */;},
	function(){return this.INC(this.addrZeropage()) /* 0xe6, INC, Zeropage */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.INX_() /* 0xe8, INX */;},
	function(){return this.SBC(this.addrImmediate()) /* 0xe9, SBC, Immediate */;},
	function(){return this.NOP_() /* 0xea, NOP */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.CPX(this.addrAbsolute()) /* 0xec, CPX, Absolute */;},
	function(){return this.SBC(this.addrAbsolute()) /* 0xed, SBC, Absolute */;},
	function(){return this.INC(this.addrAbsolute()) /* 0xee, INC, Absolute */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.BEQ(this.addrRelative()) /* 0xf0, BEQ, Relative */;},
	function(){return this.SBC(this.addrIndirectY()) /* 0xf1, SBC, IndirectY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.SBC(this.addrZeropageX()) /* 0xf5, SBC, ZeropageX */;},
	function(){return this.INC(this.addrZeropageX()) /* 0xf6, INC, ZeropageX */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.SED_() /* 0xf8, SED */;},
	function(){return this.SBC(this.addrAbsoluteY()) /* 0xf9, SBC, AbsoluteY */;},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.onInvalidOpcode();},
	function(){return this.SBC(this.addrAbsoluteX()) /* 0xfd, SBC, AbsoluteX */;},
	function(){return this.INC(this.addrAbsoluteX()) /* 0xfe, INC, AbsoluteX */;},
	function(){return this.onInvalidOpcode();}
];

