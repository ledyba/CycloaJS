/**
 * @param {number} num
 * @param {number} [len = 8]
 * @return {string}
 */
cycloa.util.formatHex = function(num, len){
	len = len || 8;
	return ("0000" + num.toString(16).toUpperCase()).slice(-(len>>2));
};
