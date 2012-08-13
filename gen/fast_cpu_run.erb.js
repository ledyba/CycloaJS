%# -*- encoding: utf-8 -*-

this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用
/**
 * @const
 * @type {Number}
 */
var inst = this.TransTable[this.read(this.PC)];
<%= CPU::AddrMode::Init() %>
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


