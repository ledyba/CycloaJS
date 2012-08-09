# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";


Functions = [nil]*0x100;

clos = Proc.new { |opsym, modes|
	nil_only = true;
	modes.each{ |k,v|
		nil_only &= (k == :nil) || v.nil?
	}
	modes.each { |mode, op|
		if op.nil?
			next
		end
		if mode == :nil
			Functions[op] = "this.#{opsym}_() /* 0x#{op.to_s(16)}, #{opsym} */"
		else
			Functions[op] = "this.#{opsym}(this.addr#{mode}()) /* 0x#{op.to_s(16)}, #{opsym}, #{mode} */"
		end
	}
};

Opcode::OPCODE_TABLE.each &clos

puts "["
Functions.each_index { |i|
	func = Functions[i]
	if func.nil?
		print "\tfunction(){return this.onInvalidOpcode();}"
	else
		print "\tfunction(){return #{func};}"
	end
	if i+1 < Functions.size
		puts ","
	end
}
puts "\n];"



