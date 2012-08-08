# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";

MODE_TO_FUNC = {
	:Immediate => "addrImmediate",
	:Relative => "addrRelative",
	:Zeropage  => "addrZeroPage",
	:ZeropageX => "addrZeroPageIdxX",
	:ZeropageY => "addrZeroPageIdxY",
	:Absolute  => "addrAbsolute",
	:AbsoluteX => "addrAbsoluteIdxX",
	:AbsoluteY => "addrAbsoluteIdxY",
	:Indirect  => "addrAbsoluteIndirect",
	:IndirectX => "addrIndirectX",
	:IndirectY => "addrIndirectY",
	:nil => nil
}

Functions = [nil]*0x100;

def makeClos(isBranch)
	return Proc.new { |opsym, modes|
		nil_only = true;
		modes.each{ |k,v|
			nil_only &= (k == :nil) || v.nil?
		}
		modes.each { |mode, op|
			if op.nil?
				next
			end
			addrFunc = MODE_TO_FUNC[(isBranch && mode == :Immediate) ? :Relative : mode];
			if addrFunc.nil?
				if nil_only
					Functions[op] = "this.#{opsym}(); /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
				else
					Functions[op] = "this.#{opsym}_(); /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
				end
			else
				Functions[op] = "this.#{opsym}(this.#{addrFunc}()); /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
			end
		}
	};
end


Opcode::NORMAL_OPCODE_TABLE.each &makeClos(false)
Opcode::JUMP_OPCODE_TABLE.each &makeClos(true)

puts "["
Functions.each_index { |i|
	func = Functions[i]
	if func.nil?
		puts "\tundefined,"
	else
		puts "\tfunction(){#{func}},"
	end
}
puts "]"



