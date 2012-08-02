"use strict";

var cycloa  = {};
/**
 * エミュレータ本体の名前空間
 * @type {Object}
 * @const
 */
cycloa.core = {};


/**
 * ビューのための名前空間
 * @type {Object}
 * @const
 */
cycloa.view = {};


/**
 * エミュレータ上のデバイスを抽象化します。
 * デバイスは信号線を持ち、デバッグウィンドウを表示でき、
 * さらにクロック数に応じて実行できます。
 * @constructor
 * @class
 */
cycloa.core.Device = function(){
	/**
	 * 新しくデバッグウィンドウを作成します。
	 * ここはフェアリーパターンで。
	 */
	this.newDebugWindow = function() {
		throw new cycloa.exc.NotImplementedError("Please implement this method.");
	};
	/**
	 * シグナルを列挙します。ビジュアライズ用？
	 */
	this.enumSignals = function () {
		throw new cycloa.exc.NotImplementedError("Please implement this method.");
	};
	this.connectSignals = function () {
	}
};
/**
 * プロセッサ、6502プロセッサを表すクラスです。
 * @class
 * @constructor
 */
cycloa.core.Processor = function() {
	this.prototype = new cycloa.core.Device();
};
