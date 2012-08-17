/**
 * @param {Number} num
 * @param {Number} [len = 8]
 * @return {String}
 */
cycloa.util.formatHex = function(num, len){
	len = len || 8;
	return ("0000" + num.toString(16).toUpperCase()).slice(-(len>>2));
};
