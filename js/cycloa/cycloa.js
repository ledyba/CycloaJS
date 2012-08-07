"use strict";

/**
 * cycloa名前空間本体
 * @type {Object}
 */
var cycloa  = {
	debug: false
};
/**
 * エミュレータ本体の名前空間
 * @type {Object}
 * @constant
 */
cycloa.core = {};

/**
 * @class
 * @constructor
 * @constant
 */
cycloa.core.Board = function(){

};

/**
 * プロセッサの身体部分を表すクラスです。
 * @class
 * @constructor
 * @constant
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
	this.reserveNMI = function(){
		if(cycloa.debug) {
			assertFalse(this.NMI);
		}
		this.NMI = true;
	};
	this.reserveIRQ = function() {
		if(cycloa.debug) {
			assertFalse(this.IRQ);
		}
		this.IRQ = true;
	};
	this.releaseNMI = function() {
		if(cycloa.debug) {
			assertTrue(this.NMI);
		}
		this.NMI = false;
	};
	this.releaseIRQ = function(){
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
	this.attachSpirit = function(spirit){
		this.spirit = spirit;
		this.spirit.connectProcessor(this);
	};
	/**
	 * このプロセッサを実装する基盤オブジェクトをセットする
	 * @function
	 * @param {cycloa.core.Board} board
	 */
	this.connectBoard = function(board) {
		this.board = board;
	};
	/**
	 * CPUの命令を実行する
	 * @function
	 */
	this.run = function(){
		this.P |= this.FLAG.ALWAYS_SET; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
		this.spirit.run();
	};
	/**
	 * データからアドレスを読み込む
	 * @function
	 * @param {Number} addr
	 * @return {Number} data
	 */
	this.read = function(addr){
		return this.board.readCPU(addr);
	};
	/**
	 * 書き込む
	 * @function
	 * @param {Number} addr
	 * @param {Number} val
	 */
	this.write = function(addr, val) {
		this.board.writeCPU(addr, val);
	};
	this.consumeClock = function(clk){

	};
	/**
	 * @function
	 */
	this.onHardReset = function () {
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
	this.onReset = function() {
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
};

/**
 * Pレジスタのフラグ
 * @constant
 * @type {Object}
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
 * @constant
 * @type {Uint8Array}
 */
cycloa.core.Processor.ZNFlagCache = new Uint8Array()([
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
 * @constant
 * @type {Uint8Array}
 */
cycloa.core.Processor.CycleTable = new Uint8Array()([
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
 * @constant
 * @type {Number}
 */
cycloa.core.Processor.RESET_CLOCK = 6;

/**
 * プロセッサの動作方式を抽象化するクラス。
 * 上のProcessorにアタッチして下さい。
 * @class
 * @constant
 * @constructor
 */
cycloa.core.ProcessorSpirit = function () {
	/**
	 * @type {cycloa.core.Processor}
	 * @protected
	 */
	this.p = undefined;
	/**
	 * Processorと接続する
	 * @param {cycloa.core.Processor} p
	 */
	this.connectProcessor = function(p){
		this.p = p;
	};
	this.run = function(){
		throw new cycloa.exc.NotImplementedException("Please implement ProcessorSpirit#run");
	};
};