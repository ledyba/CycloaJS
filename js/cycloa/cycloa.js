"use strict";

/**
 * cycloa名前空間本体
 * @namespace
 * @type {Object}
 */
var cycloa  = {
	debug: false
};
/**
 * エミュレータ本体の名前空間
 * @type {Object}
 * @namespace
 * @const
 */
cycloa.core = {};

/**
 * @class
 * @constructor
 * @const
 */
cycloa.core.Board = function(){
	/**
	 * @protected
	 * @type {cycloa.core.Processor}
	 */
	this.processor = undefined;
};

/**
 * @param {Number} addr
 * @return {Number} data of the address
 */
cycloa.core.Board.prototype.readCPU = function(addr){
	throw new cycloa.exc.NotImplementedException("Please implement readCPU");
	return 0;
};
/**
 * @param {Number} addr
 * @param {Number} val
 */
cycloa.core.Board.prototype.writeCPU = function(addr, val){
	throw new cycloa.exc.NotImplementedException("Please implement writeCPU");
};
/**
 *
 */
cycloa.core.Board.prototype.run = function(){
	throw new cycloa.exc.NotImplementedException("Please implement run");
};

/**
 * @public
 * @function
 * @param {cycloa.core.Processor} processor
 */
cycloa.core.Board.prototype.attachProcessor = function(processor){
	this.processor = processor;
	this.processor.connectBoard(this);
};

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
	 * @type {cycloa.core.ProcessorSpirit}
	 */
	this.spirit = undefined;
	/**
	 *実際のIO処理の移譲先
	 * @type {cycloa.core.Board}
	 */
	this.board = undefined;
};

cycloa.core.Processor.prototype.reserveNMI = function(){
	if(cycloa.debug) {
		assertFalse(this.NMI);
	}
	this.NMI = true;
};
cycloa.core.Processor.prototype.reserveIRQ = function() {
	if(cycloa.debug) {
		assertFalse(this.IRQ);
	}
	this.IRQ = true;
};
cycloa.core.Processor.prototype.releaseNMI = function() {
	if(cycloa.debug) {
		assertTrue(this.NMI);
	}
	this.NMI = false;
};
cycloa.core.Processor.prototype.releaseIRQ = function(){
	if(cycloa.debug) {
		assertTrue(this.IRQ);
	}
	this.IRQ = false;
};
/**
 * CPUの命令を実際に実行するスピリットを接続する
 * @function
 * @param {cycloa.core.ProcessorSpirit} spirit
 */
cycloa.core.Processor.prototype.attachSpirit = function(spirit){
	this.spirit = spirit;
	this.spirit.connectProcessor(this);
};
/**
 * このプロセッサを実装する基盤オブジェクトをセットする
 * @function
 * @param {cycloa.core.Board} board
 */
cycloa.core.Processor.prototype.connectBoard = function(board) {
	this.board = board;
};
/**
 * CPUの命令を実行する
 * @function
 */
cycloa.core.Processor.prototype.run = function(){
	this.P |= cycloa.core.Processor.FLAG.ALWAYS_SET; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
	this.spirit.run();
};
/**
 * データからアドレスを読み込む
 * @function
 * @param {Number} addr
 * @return {Number} data
 */
cycloa.core.Processor.prototype.read = function(addr){
	return this.board.readCPU(addr);
};
/**
 * 書き込む
 * @function
 * @param {Number} addr
 * @param {Number} val
 */
cycloa.core.Processor.prototype.write = function(addr, val) {
	this.board.writeCPU(addr, val);
};
cycloa.core.Processor.prototype.consumeClock = function(clk){

};
/**
 * @function
 */
cycloa.core.Processor.prototype.onHardReset = function () {
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
cycloa.core.Processor.prototype.onReset = function() {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.consumeClock(this.RESET_CLOCK);
	this.SP -= 0x03;
	this.P |= this.FLAG.I;
	this.write(0x4015, 0x0);
	this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));

	this.NMI = false;
	this.IRQ = false;
};
/**
 * Pレジスタのフラグ
 * @const
 * @type {Object}
 * @enum {Number}
 */
cycloa.core.Processor.FLAG = {
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
cycloa.core.Processor.ZNFlagCache = new Uint8Array([
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
cycloa.core.Processor.CycleTable = new Uint8Array([
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
cycloa.core.Processor.RESET_CLOCK = 6;

/**
 * プロセッサの動作方式を抽象化するクラス。
 * 上のProcessorにアタッチして下さい。
 * @class
 * @const
 * @constructor
 */
cycloa.core.ProcessorSpirit = function () {
	/**
	 * @type {cycloa.core.Processor}
	 * @protected
	 */
	this.p = undefined;
};
/**
 * Processorと接続する
 * @param {cycloa.core.Processor} p
 */
cycloa.core.ProcessorSpirit.prototype.connectProcessor = function(p){
	this.p = p;
};
/**
 * 命令を実行する。実装してください。
 */
cycloa.core.ProcessorSpirit.prototype.run = function(){
	throw new cycloa.exc.NotImplementedException("Please implement ProcessorSpirit#run");
};
