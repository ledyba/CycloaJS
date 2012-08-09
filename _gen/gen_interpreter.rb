# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";

Target="pr"

module Generator
	module AddrMode
		def self.CrossCheck()
			"if(((addr ^ base) & 0x0100) != 0) #{Target}.consumeClock(1);"
		end
		def self.Immediate()
			"addr = (#{Target}.PC++);"
		end

		def self.Zeropage()
			"addr = (#{Target}.read(#{Target}.PC++));"
		end
		def self.ZeropageX()
			"addr = ((#{Target}.read(#{Target}.PC++) + #{Target}.X) & 0xff);";
		end
		def self.ZeropageY()
			"addr = ((#{Target}.read(#{Target}.PC++) + #{Target}.Y) & 0xff);";
		end
		def self.Absolute()
			"addr = (#{Target}.read(#{Target}.PC++) | (#{Target}.read(#{Target}.PC++) << 8));";
		end
		def self.AbsoluteX()
"""
			base = #{Target}.read(#{Target}.PC++) | (#{Target}.read(#{Target}.PC++) << 8);
			addr = base + #{Target}.X;
			#{CrossCheck()}
"""
		end
		def self.AbsoluteY()
"""
			base = #{Target}.read(#{Target}.PC++) | (#{Target}.read(#{Target}.PC++) << 8);
			addr = base + #{Target}.Y;
			#{CrossCheck()}
"""
		end
		def self.Indirect()
"""
			base = #{Target}.read(#{Target}.PC++) | (#{Target}.read(#{Target}.PC++) << 8);
			addr = #{Target}.read(base) | (#{Target}.read((base & 0xff00) | ((base+1) & 0x00ff)) << 8); //bug of NES
"""
		end
		def self.IndirectX()
"""
			base = (#{Target}.read(#{Target}.PC++) + #{Target}.X) & 0xff;
			addr = #{Target}.read(base) | (#{Target}.read((base+1)&0xff) << 8);
"""
		end
		def self.IndirectY()
"""
			base = #{Target}.read(#{Target}.PC++);
			base = #{Target}.read(base) | (#{Target}.read((base+1)&0xff) << 8);
			addr = base + #{Target}.Y;
"""
		end
		def self.Relative()
"""
			base = #{Target}.read(#{Target}.PC++);
			addr = (base >= 128 ? (base-256) : base) + #{Target}.PC;
"""
		end
		def self.None()
			"";
		end
	end
	module Inst
		def self.Push(val)
			" /* Push */ #{Target}.write(0x0100 | (#{Target}.SP-- & 0xff), #{val});";
		end
		def self.Pop()
			"(#{Target}.read(0x0100 | (++#{Target}.SP & 0xff))) /* Pop */";
		end
		def self.UpdateFlag(val)
			"(#{Target}.P = (#{Target}.P & 0x7D) | ZNFlagCache[#{val}&0xff]); /* UpdateFlag */";
		end
		def self.LDA()
			UpdateFlag("#{Target}.A = #{Target}.read(addr)");
		end
		def self.LDY()
			UpdateFlag("#{Target}.Y = #{Target}.read(addr)");
		end
		def self.LDX()
			UpdateFlag("#{Target}.X = #{Target}.read(addr)");
		end
		def self.STA()
			"#{Target}.write(addr, #{Target}.A);"
		end
		def self.STX()
			"#{Target}.write(addr, #{Target}.X);"
		end
		def self.STY()
			"#{Target}.write(addr, #{Target}.Y);"
		end
		def self.TXA_()
			UpdateFlag("#{Target}.A = #{Target}.X");
		end
		def self.TYA_()
			UpdateFlag("#{Target}.A = #{Target}.Y");
		end
		def self.TXS_()
			"#{Target}.SP = #{Target}.X;";
		end
		def self.TAY_()
			UpdateFlag("#{Target}.Y = #{Target}.A");
		end
		def self.TAX_()
			UpdateFlag("#{Target}.X = #{Target}.A");
		end
		def self.TSX_()
			UpdateFlag("#{Target}.X = #{Target}.SP");
		end
		def self.PHP_()
"""
			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			#{Push("#{Target}.P | cycloa.core.FLAG.B")}
"""
		end
		def self.PLP_()
"""
			val = #{Pop()};
			if((#{Target}.P & cycloa.core.FLAG.I) == cycloa.core.FLAG.I && (val & cycloa.core.FLAG.I) == 0){
				// FIXME: ここどうする？？
				//#{Target}.needStatusRewrite = true;
				//#{Target}.newStatus =val;
				#{Target}.P = val;
			}else{
				#{Target}.P = val;
			}
"""
		end
		def self.PHA_()
			Push("#{Target}.A");
		end
		def self.PLA_()
			UpdateFlag("#{Target}.A = #{Pop()}");
		end
		def self.ADC()
"""
			val = #{Target}.read(addr);
			var result = (#{Target}.A + val + (#{Target}.P & cycloa.core.FLAG.C)) & 0xffff;
			var newA = result & 0xff;
			#{Target}.P = (#{Target}.P & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.C))
				| ((((#{Target}.A ^ val) & 0x80) ^ 0x80) & ((#{Target}.A ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & cycloa.core.FLAG.C); //set C flag
			#{UpdateFlag "#{Target}.A = newA"}
"""
		end
		def self.SBC()
"""
			val = #{Target}.read(addr);
			var result = (#{Target}.A - val - ((#{Target}.P & cycloa.core.FLAG.C) ^ cycloa.core.FLAG.C)) & 0xffff;
			var newA = result & 0xff;
			#{Target}.P = (#{Target}.P & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.C))
				| ((#{Target}.A ^ val) & (#{Target}.A ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & cycloa.core.FLAG.C) ^ cycloa.core.FLAG.C);
			#{UpdateFlag "#{Target}.A = newA"}
"""
		end
		def self.CPX()
"""
			val = (#{Target}.X - #{Target}.read(addr)) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.CPY()
"""
			val = (#{Target}.Y - #{Target}.read(addr)) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.CMP()
"""
			val = (#{Target}.A - #{Target}.read(addr)) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.AND
			UpdateFlag("#{Target}.A &= #{Target}.read(addr)")
		end
		def self.EOR
			UpdateFlag("#{Target}.A ^= #{Target}.read(addr)")
		end
		def self.ORA
			UpdateFlag("#{Target}.A |= #{Target}.read(addr)")
		end
		def self.BIT
"""
			val = #{Target}.read(addr);
			#{Target}.P = (#{Target}.P & (0xff & ~(cycloa.core.FLAG.V | cycloa.core.FLAG.N | cycloa.core.FLAG.Z)))
				| (val & (cycloa.core.FLAG.V | cycloa.core.FLAG.N))
				| (ZNFlagCache[#{Target}.A & val] & cycloa.core.FLAG.Z);
"""
		end
		def self.ASL_
"""
			#{Target}.P = (#{Target}.P & 0xFE) | (#{Target}.A & 0xff) >> 7;
			#{UpdateFlag("#{Target}.A = (#{Target}.A << 1) & 0xff")}
"""
		end
		def self.ASL
"""
			var val = #{Target}.read(addr);
			#{Target}.P = (#{Target}.P & 0xFE) | val >> 7;
			val <<= 1;
			#{Target}.write(addr, val);
			#{UpdateFlag("val")}
"""
		end
		def self.LSR_
"""
			#{Target}.P = (#{Target}.P & 0xFE) | (#{Target}.A & 0x01);
			#{Target}.A >>= 1;
			#{UpdateFlag("#{Target}.A")}
"""
		end
		def self.LSR
"""
			val = #{Target}.read(addr);
			#{Target}.P = (#{Target}.P & 0xFE) | (val & 0x01);
			val >>= 1;
			#{Target}.write(addr, val);
			#{UpdateFlag("val")}
"""
		end
		def self.ROL_
"""
			var carry = (#{Target}.A & 0xff) >> 7;
			#{Target}.A = (#{Target}.A << 1) | (#{Target}.P & 0x01);
			#{Target}.P = (#{Target}.P & 0xFE) | carry;
			#{UpdateFlag("#{Target}.A")}
"""
		end
		def self.ROL
"""
			val = #{Target}.read(addr);
			var carry = val >> 7;
			val = ((val << 1) & 0xff) | (#{Target}.P & 0x01);
			#{Target}.P = (#{Target}.P & 0xFE) | carry;
			#{UpdateFlag("val")}
			#{Target}.write(addr, val);
"""
		end
		def self.ROR_
"""
			var carry = #{Target}.A & 0x01;
			#{Target}.A = ( ((#{Target}.A >> 1) & 0x7f) | ((#{Target}.P & 0x1) << 7) );
			#{Target}.P = (#{Target}.P & 0xFE) | carry;
			#{UpdateFlag(" #{Target}.A ")}
"""
		end
		def self.ROR
"""
			var val = #{Target}.read(addr);
			/**@const
			 * @type {Number} */
			var carry = val & 0x01;
			val = (val >> 1) | ((#{Target}.P & 0x01) << 7);
			#{Target}.P = (#{Target}.P & 0xFE) | carry;
			#{UpdateFlag("val")}
			#{Target}.write(addr, val);
"""
		end
		def self.INX_
			UpdateFlag("#{Target}.X = (#{Target}.X+1)&0xff")
		end
		def self.INY_
			UpdateFlag("#{Target}.Y = (#{Target}.Y+1)&0xff")
		end
		def self.INC
"""
			var val = (#{Target}.read(addr)+1) & 0xff;
			#{UpdateFlag("val")}
			#{Target}.write(addr, val);
"""
		end
		def self.DEX_
			UpdateFlag("#{Target}.X = (#{Target}.X-1)&0xff")
		end
		def self.DEY_
			UpdateFlag("#{Target}.Y = (#{Target}.Y-1)&0xff")
		end
		def self.DEC
"""
			var val = (#{Target}.read(addr)-1) & 0xff;
			#{UpdateFlag("val")}
			#{Target}.write(addr, val);
"""
		end
		def self.CLC_
"""
			#{Target}.P &= ~(cycloa.core.FLAG.C);
"""
		end
		def self.CLI_
"""
			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			//#{Target}.needStatusRewrite = true;
			//#{Target}.newStatus = #{Target}.P & ~(cycloa.core.FLAG.I);
			this.p.P &= ~(cycloa.core.FLAG.I);
"""
		end
		def self.CLV_
"""
			#{Target}.P &= ~(cycloa.core.FLAG.V);
"""
		end
		def self.CLD_
"""
			#{Target}.P &= ~(cycloa.core.FLAG.D);
"""
		end
		def self.SEC_
"""
			#{Target}.P |= cycloa.core.FLAG.C;
"""
		end
		def self.SEI_
"""
			#{Target}.P |= cycloa.core.FLAG.I;
"""
		end
		def self.SED_
"""
			#{Target}.P |= cycloa.core.FLAG.D;
"""
		end
		def self.NOP_
			""
		end
		def self.BRK_()
"""
			//NES ON FPGAには、
			//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
			//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
			//DQ4はこうしないと、動かない。
			/*
			if((#{Target}.P & cycloa.core.FLAG.I) == cycloa.core.FLAG.I){
				return;
			}*/
			#{Target}.PC++;
			#{Push "((#{Target}.PC >> 8) & 0xFF)"}
			#{Push "(#{Target}.PC & 0xFF)"}
			#{Target}.P |= cycloa.core.FLAG.B;
			#{Push "(#{Target}.P)"}
			#{Target}.P |= cycloa.core.FLAG.I;
			#{Target}.PC = (#{Target}.read(0xFFFE) | (#{Target}.read(0xFFFF) << 8));
"""
		end
		def self.CrossCheck()
			"#{Target}.consumeClock( (((#{Target}.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );"
		end
		def self.BCC
"""
			if((#{Target}.P & cycloa.core.FLAG.C) == 0){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BCS
"""
			if((#{Target}.P & cycloa.core.FLAG.C) == cycloa.core.FLAG.C){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BEQ
"""
			if((#{Target}.P & cycloa.core.FLAG.Z) == cycloa.core.FLAG.Z){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BNE
"""
			if((#{Target}.P & cycloa.core.FLAG.Z) == 0){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BVC
"""
			if((#{Target}.P & cycloa.core.FLAG.V) == 0){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BVS
"""
			if((#{Target}.P & cycloa.core.FLAG.V) == cycloa.core.FLAG.V){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BPL
"""
			if((#{Target}.P & cycloa.core.FLAG.N) == 0){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BMI
"""
			if((#{Target}.P & cycloa.core.FLAG.N) == cycloa.core.FLAG.N){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.JSR
"""
			#{Target}.PC--;
			#{Push "((#{Target}.PC >> 8) & 0xFF)"}
			#{Push "(#{Target}.PC & 0xFF)"}
			#{Target}.PC = addr;
"""
		end
		def self.JMP
"""
			#{Target}.PC = addr;
"""
		end
			def self.RTI_
"""
			#{Target}.P = #{Pop()};
			#{Target}.PC = #{Pop()} | (#{Pop()} << 8);
"""
		end
		def self.RTS_
"""
			#{Target}.PC = (#{Pop()} | (#{Pop()} << 8)) + 1;
"""
		end
	end
end

puts "var addr, base, val;"
puts "var ZNFlagCache = cycloa.core.ZNFlagCache;"

Opcode::each{ |b, opcode, addr|
	bsym = "0x#{b.to_s(16)}";
	puts "this[#{bsym}] = function() { /* #{bsym}, #{opcode ? opcode : 'UNDEFINED'} #{addr ? addr : 'NONE'} */"
	if opcode.nil?
		puts "throw new cycloa.err.CoreException(\"Invalid opcode: 0x#{b.to_s(16)}\");"
	else
		puts Generator::AddrMode::method(addr).call
		opsym = ((opcode.to_s)+(addr == :None ? "_" : "")).to_sym
		puts Generator::Inst::method(opsym).call
	end
	puts "};"
}


