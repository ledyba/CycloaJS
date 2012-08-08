"use strict";
/**
 * 例外用の名前空間
 * @type {Object}
 * @const
 * @namespace
 */
cycloa.exc = {};

/**
 * 例外のベースクラスです
 * @param {String} message メッセージ
 * @constructor
 * @class
 * @const
 */
cycloa.exc.Exception = function (message) {
	/**
	 * 例外のメッセージのインスタンス
	 * @type {String}
	 * @const
	 */
	this.message = message;
};
cycloa.exc.Exception.prototype = {
	/**
	 * 例外のメッセージを返します。
	 * @function
	 * @return {String}
	 */
	getMessage: function (){
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
	cycloa.exc.Exception.apply(this, "[CoreException] "+ message);
};
cycloa.exc.CoreException.prototype = {
	__proto__: cycloa.exc.Exception.prototype
};
/**
 * 実装するべきメソッドを実装してない例外です
 * @param {String} message
 * @constructor
 * @class
 */
cycloa.exc.NotImplementedException = function (message) {
	cycloa.exc.Exception.apply(this, "[NotImplementedException] "+ message);
};
cycloa.exc.NotImplementedException.prototype = {
	__proto__: cycloa.exc.Exception.prototype
};
