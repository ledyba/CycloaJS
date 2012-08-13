%# -*- encoding: utf-8 -*-

this.reserveNMI = function () {
	this.NMI = true;
};
this.reserveIRQ = function () {
	this.IRQ = true;
};
this.releaseNMI = function () {
	this.NMI = false;
};
this.releaseIRQ = function () {
	this.IRQ = false;
},
/**
 * データからアドレスを読み込む
 * @function
 * @param {Number} addr
 * @return {Number} data
 */
this.read = function (addr) {
	switch((addr & 0xE000) >> 14){
		case 0:{
			return this.ram[addr & 0x7ff];
			break;
		}
		case 1:{
			return 0;
			break;
		}
		case 2:{
			return this.board.rom[addr & 0x3fff];
			break;
		}
		case 3:{
			return this.board.rom[addr & 0x3fff];
			break;
		}
	}
	return this.board.readCPU(addr);
},
/**
 * 書き込む
 * @function
 * @param {Number} addr
 * @param {Number} val
 */
this.write = function (addr, val) {
	switch((addr & 0xE000) >> 14){
		case 0:{
			this.ram[addr & 0x1fff] = val;
			break;
		}
		case 1:{
			break;
		}
		case 2:{
			break;
		}
		case 3:{
			break;
		}
	}
};

this.onHardResetCPU = function(){
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

this.onResetCPU = function () {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.consumeClock(cycloa.core.RESET_CLOCK);
	this.SP -= 0x03;
	this.P |= this.Flag.I;
	this.write(0x4015, 0x0);
	this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));

	this.NMI = false;
	this.IRQ = false;
};
	


