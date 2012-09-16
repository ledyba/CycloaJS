%# -*- encoding: utf-8 -*-

/** @type {number} */
this.A = 0;
/** @type {number} */
this.X = 0;
/** @type {number} */
this.Y = 0;
/** @type {number} */
this.PC = 0;
/** @type {number} */
this.SP = 0;
/** @type {number} */
this.P = 0;
/**
 * @const
 * @type {Uint8Array}
 */
this.__cpu__ram = new Uint8Array(new ArrayBuffer(0x800));
this.__cpu__rom = new Array(32);

this.__cpu__ZNFlagCache = <%= MachineName %>.ZNFlagCache;
this.__cpu__TransTable = <%= MachineName %>.TransTable;

