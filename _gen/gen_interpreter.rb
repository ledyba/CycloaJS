# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";

MODE_TO_FUNC = {
	:Immediate => "addrImmediate",
	:Zeropage  => "addrZeropage",
	:ZeropageX => "addrZeropageX",
	:ZeropageY => "addrZeropageY",
	:Absolute  => "addrAbsolute",
	:AbsoluteX => "addrAbsoluteX",
	:AbsoluteY => "addrAbsoluteY",
	:Indirect  => "addrIndirect",
	:IndirectX => "addrIndirectX",
	:IndirectY => "addrIndirectY",
	:nil => nil
}

functions = [nil]*0x100;
clos = Proc.new { |opsym, modes|
	nil_only = true;
	modes.each{ |k,v|
		nil_only &= (k == :nil) || v.nil?
	}
	modes.each { |mode, op|
		if op.nil?
			next
		end
		addrFunc = MODE_TO_FUNC[mode];
		if addrFunc.nil?
			if nil_only
				functions[op] = "this_.#{opsym}(); /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
			else
				functions[op] = "this_.#{opsym}_(); /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
			end
		else
			functions[op] = "this_.#{opsym}(this_.#{addrFunc}()); /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
		end
	}
};

Opcode::NORMAL_OPCODE_TABLE.each &clos
Opcode::JUMP_OPCODE_TABLE.each &clos

puts "["
functions.each_index { |i|
	func = functions[i]
	if func.nil?
		puts "\tundefined,"
	else
		puts "\t/** @param {cycloa.core.InterpreterSpirit} this_ */ function(this_){#{func}},"
	end
}
puts "]"



