"use strict";

var cycloa;
if(!cycloa) cycloa = {};
/**
 * 例外用の名前空間
 * @type {Object}
 * @const
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
cycloa.exc.NotImplementedException = function (message) {
	this.prototype = new Excption("[NotImplementedException] "+message);
};