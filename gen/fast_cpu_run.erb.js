%# -*- encoding: utf-8 -*-

this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用

<%= CPU::Init() %>
<%= Video::Init() %>

if(this.NMI){
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	//from http://nesdev.parodius.com/6502_cpu.txt
	<%= CPU::ConsumeClock '7' %>;
	this.P &= <%= ((~Opcode::Flag[:B]) & 0xff).to_s %>;
	<%= CPU::Push "(this.PC >> 8) & 0xFF" %>
	<%= CPU::Push "this.PC & 0xFF" %>
	<%= CPU::Push "this.P" %>;
	this.P |= <%= Opcode::Flag[:I] %>;
	//this.PC = (this.read(0xFFFA) | (this.read(0xFFFB) << 8));
	this.PC = (this.rom[31][0x3FA]| (this.rom[31][0x3FB] << 8));
	this.NMI = false;
}else if(this.IRQ){
	this.onIRQ();
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	//from http://nesdev.parodius.com/6502_cpu.txt
	if((this.P & <%= Opcode::Flag[:I] %>) === <%= Opcode::Flag[:I] %>){
		return;
	}
	<%= CPU::ConsumeClock '7' %>;
	this.P &= <%= ((~Opcode::Flag[:B]) & 0xff).to_s %>;
	<%= CPU::Push "(this.PC >> 8) & 0xFF" %>
	<%= CPU::Push "this.PC & 0xFF" %>
	<%= CPU::Push "this.P" %>
	this.P |= <%= Opcode::Flag[:I] %>;
	//this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));
	this.PC = (this.rom[31][0x3FE] | (this.rom[31][0x3FF] << 8));
}

if(this.needStatusRewrite){
	this.P = this.newStatus;
	this.needStatusRewrite = false;
}

<%= CPU::AddrMode::Init() %>

var opbyte;
<%= CPU::MemRead("pc", "opbyte") %>
/**
 * @const
 * @type {Number}
 */
var inst = this.TransTable[opbyte];
// http://www.llx.com/~nparker/a2/opcodes.html
switch( inst & <%= CPU::Middle::AddrModeMask %> ){
%	CPU::Middle::AddrMode.each do |addr, code|
		case <%= code %>: { /* <%= addr %> */
			<%= CPU::AddrMode::method(addr).call %>
		break;
	}
%	end
	default: { throw new cycloa.err.CoreException("Invalid opcode."); }
}
switch( (inst & <%= CPU::Middle::InstModeMask %>) >> 4 ){
%	CPU::Middle::InstMode.each do |opsym, code|
		case <%= code>>4 %>: {  /* <%= opsym %> */
			<%= CPU::Inst::method(opsym).call %>
		break;}
%	end
}
<%= CPU::ConsumeClock "inst >> #{CPU::Middle::ClockShift}" %>


