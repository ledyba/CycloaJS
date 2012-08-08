"use strict";
var cycloa;
if(!cycloa) cycloa = {};

/**
 * 例外用の名前空間
 * @type {Object}
 * @const
 * @namespace
 */
cycloa.exc = {};

/**
 * 例外のベースクラスです
 * @param {String} name 例外クラス名
 * @param {String} message メッセージ
 * @const
 * @constructor
 */
cycloa.exc.Exception = function (name, message) {
	/**
	 * 例外のメッセージのインスタンス
	 * @type {String}
	 * @const
	 * @private
	 */
	/**
	 * @const
	 * @type {String}
	 */
	this.name = name;
	this.message = "["+name.toString()+"] "+message;
};
cycloa.exc.Exception.prototype.toString = function(){
	return this.message;
};
/**
 * エミュレータのコアで発生した例外です
 * @param {String} message
 * @constructor
 * @extends cycloa.exc.Exception
 */
cycloa.exc.CoreException = function (message) {
	cycloa.exc.Exception.call(this, "CoreException", message);
};
cycloa.exc.CoreException.prototype = {
	__proto__ : cycloa.exc.Exception.prototype
};
/**
 * 実装するべきメソッドを実装してない例外です
 * @param {String} message
 * @constructor
 * @extends cycloa.exc.Exception
 */
cycloa.exc.NotImplementedException = function (message) {
	cycloa.exc.Exception.call(this, "NotImplementedException", message);
};
cycloa.exc.NotImplementedException.prototype = {
	__proto__: cycloa.exc.Exception.prototype
};
