"use strict";

/**
 * cycloa名前空間本体
 * @namespace
 * @type {Object}
 */
var cycloa;
if(!cycloa) cycloa = {};

cycloa.debug = false;

/**
 * @class
 * @constructor
 * @const
 */
cycloa.Board = function(){
	/**
	 * @protected
	 * @type {cycloa.core.Processor}
	 */
	this.processor = undefined;
};
cycloa.Board.prototype = {
	/**
	 * @param {Number} addr
	 * @return {Number} data of the address
	 */
	readCPU: function(addr){
		throw new cycloa.exc.NotImplementedException("Please implement readCPU");
		return 0;
	},
	/**
	 * @param {Number} addr
	 * @param {Number} val
	 */
	writeCPU: function(addr, val){
		throw new cycloa.exc.NotImplementedException("Please implement writeCPU");
	},
	/**
	 *
	 */
	run: function(){
		throw new cycloa.exc.NotImplementedException("Please implement run");
	},
	/**
	 * @public
	 * @function
	 * @param {cycloa.core.Processor} processor
	 */
	attachProcessor: function(processor){
		this.processor = processor;
		this.processor.connectBoard(this);
	}
};

