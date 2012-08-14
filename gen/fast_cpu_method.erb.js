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
};
/**
 * 書き込む
 * @function
 * @param {Number} addr
 * @param {Number} val
 */
this.write = function (addr, val) {
	switch((addr & 0xE000) >> 13){
		case 0:{ /* 0x0000 -> 0x2000 */
			this.ram[addr & 0x1fff] = val;
			break;
		}
		case 1:{ /* 0x2000 -> 0x4000 */
			this.writeVideoReg(addr, val);
			break;
		}
		case 2:{ /* 0x4000 -> 0x6000 */
			break;
		}
		case 3:{ /* 0x6000 -> 0x8000 */
			break;
		}
		case 4:{ /* 0x8000 -> 0xA000 */
			this.writeMapperCPU(addr, val);
			break;
		}
		case 5:{ /* 0xA000 -> 0xC000 */
			this.writeMapperCPU(addr, val);
			break;
		}
		case 6:{ /* 0xC000 -> 0xE000 */
			this.writeMapperCPU(addr, val);
			break;
		}
		case 7:{ /* 0xE000 -> 0xffff */
			this.writeMapperCPU(addr, val);
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
		//this.PC = (this.read(0xFFFC) | (this.read(0xFFFD) << 8));
		this.PC = (this.rom[31][0x3FC]| (this.rom[31][0x3FD] << 8));

		this.NMI = false;
		this.IRQ = false;
};

this.onResetCPU = function () {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.consumeClock(cycloa.core.RESET_CLOCK);
	this.SP -= 0x03;
	this.P |= <%= Opcode::Flag[:I] %>;
	this.write(0x4015, 0x0);
	//this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));
	this.PC = (this.rom[31][0x3FC]| (this.rom[31][0x3FD] << 8));

	this.NMI = false;
	this.IRQ = false;
};

