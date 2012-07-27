var cycloa  = {};
/**
 * エミュレータ本体の名前空間
 * @type {Object}
 */
cycloa.core = {};
/**
 * 例外用の名前空間
 * @type {Object}
 */
cycloa.exc = {};
/**
 * 例外のベースクラスです
 * @param {String} message メッセージ
 * @constructor
 * @class
 */
cycloa.exc.Exception = function (message) {
	/**
	 * 例外のメッセージのインスタンス
	 * @type {String}
	 */
	this.message = message;
	/**
	 * 例外のメッセージを返します。
	 * @return {String}
	 */
	this.getMessage = function (){
		return this.message;
	}
};
/**
 * エミュレータのコアで発生した例外です
 * @param {String} message
 * @constructor
 * @class
 */
cycloa.exc.CoreException = function (message) {
	this.prototype = new Exception("[CoreException] "+ message);
};
/**
 * 実装するべきメソッドを実装してない例外です
 * @param {String} message
 * @constructor
 * @class
 */
cycloa.exc.NotImplementedError = function (message) {
	this.prototype = new Excption("[NotImplementedException] "+message);
};
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

