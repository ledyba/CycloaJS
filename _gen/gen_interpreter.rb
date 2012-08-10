# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";

Target="this"

module Generator
	FLAG = {
		:C=> 1,
		:Z=> 2,
		:I=> 4,
		:D=> 8,
		:B=> 16, # not used in NES
		:ALWAYS_SET=> 32,
		:V=> 64,
		:N=> 128
	};
	CYCLE = [
		7, 6, 2, 8, 3, 3, 5, 5,3, 2, 2, 2, 4, 4, 6, 6,
		2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
		6, 6, 2, 8, 3, 3, 5, 5,4, 2, 2, 2, 4, 4, 6, 6,
		2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
		6, 6, 2, 8, 3, 3, 5, 5,3, 2, 2, 2, 3, 4, 6, 6,
		2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
		6, 6, 2, 8, 3, 3, 5, 5,4, 2, 2, 2, 5, 4, 6, 6,
		2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
		2, 6, 2, 6, 3, 3, 3, 3,2, 2, 2, 2, 4, 4, 4, 4,
		2, 5, 2, 6, 4, 4, 4, 4,2, 4, 2, 5, 5, 4, 5, 5,
		2, 6, 2, 6, 3, 3, 3, 3,2, 2, 2, 2, 4, 4, 4, 4,
		2, 5, 2, 5, 4, 4, 4, 4,2, 4, 2, 4, 4, 4, 4, 4,
		2, 6, 2, 8, 3, 3, 5, 5,2, 2, 2, 2, 4, 4, 6, 6,
		2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7,
		2, 6, 3, 8, 3, 3, 5, 5,2, 2, 2, 2, 4, 4, 6, 6,
		2, 5, 2, 8, 4, 4, 6, 6,2, 4, 2, 7, 4, 4, 6, 7
	];
	module AddrMode
		def self.CrossCheck()
			"if(((addr ^ addr_base) & 0x0100) != 0) #{Target}.consumeClock(1);"
		end
		def self.Init()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var pc = #{Target}.PC;
"""
		end
		def self.excelPC(size)
"""
			#{Target}.PC = pc + #{size};
"""
		end
		def self.Immediate()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (pc+1);
			#{excelPC 2}
"""
		end

		def self.Zeropage()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (#{Target}.read(pc+1));
			#{excelPC 2}
"""
		end
		def self.ZeropageX()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((#{Target}.read(pc+1) + #{Target}.X) & 0xff);
			#{excelPC 2}
"""
		end
		def self.ZeropageY()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ((#{Target}.read(pc+1) + #{Target}.Y) & 0xff);
			#{excelPC 2}
"""
		end
		def self.Absolute()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (#{Target}.read(pc+1) | (#{Target}.read(pc+2) << 8));
			#{excelPC 3}
"""
		end
		def self.AbsoluteX()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = #{Target}.read(pc+1) | (#{Target}.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + #{Target}.X;
			#{CrossCheck()}
			#{excelPC 3}
"""
		end
		def self.AbsoluteY()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = #{Target}.read(pc+1) | (#{Target}.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = addr_base + #{Target}.Y;
			#{CrossCheck()}
			#{excelPC 3}
"""
		end
		def self.Indirect()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = #{Target}.read(pc+1) | (#{Target}.read(pc+2) << 8);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = #{Target}.read(addr_base) | (#{Target}.read((addr_base & 0xff00) | ((addr_base+1) & 0x00ff)) << 8); //bug of NES
			#{excelPC 3}
"""
		end
		def self.IndirectX()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = (#{Target}.read(pc+1) + #{Target}.X) & 0xff;
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = #{Target}.read(addr_base) | (#{Target}.read((addr_base+1)&0xff) << 8);
			#{excelPC 2}
"""
		end
		def self.IndirectY()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = #{Target}.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = ( #{Target}.read(addr_base) | (#{Target}.read((addr_base+1)&0xff) << 8) ) + #{Target}.Y;
			#{excelPC 2}
"""
		end
		def self.Relative()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var addr_base = #{Target}.read(pc+1);
			/**
			 * @const
			 * @type {Number}
			 */
			var addr = (addr_base >= 128 ? (addr_base-256) : addr_base) + pc + 2;
			#{excelPC 2}
"""
		end
		def self.None()
"""
			#{excelPC 1}
"""
		end
	end
	module Inst
		def self.Push(val)
			" /* Push */ #{Target}.write(0x0100 | (#{Target}.SP-- & 0xff), #{val});";
		end
		def self.Pop()
			"/* Pop */ (#{Target}.read(0x0100 | (++#{Target}.SP & 0xff)))";
		end
		def self.UpdateFlag(val)
			"/* UpdateFlag */ #{Target}.P = (#{Target}.P & 0x7D) | this.ZNFlagCache[#{val}];"
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
			#{Push("#{Target}.P | 0x#{FLAG[:B].to_s(16)}")}
"""
		end
		def self.PLP_()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Pop()};
			if((#{Target}.P & 0x#{FLAG[:I].to_s(16)}) == 0x#{FLAG[:I].to_s(16)} && (val & 0x#{FLAG[:I].to_s(16)}) == 0){
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
			/**
			 * @const
			 * @type {Number}
			 */
			var p = #{Target}.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var a = #{Target}.A;
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (a + val + (p & 0x#{FLAG[:C].to_s(16)})) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			#{Target}.P = (p & 0x#{((~(FLAG[:V] | FLAG[:C])) & 0xff).to_s(16)})
				| ((((a ^ val) & 0x80) ^ 0x80) & ((a ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x#{FLAG[:C].to_s(16)}); //set C flag
			#{UpdateFlag "#{Target}.A = newA"}
"""
		end
		def self.SBC()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var p = #{Target}.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var a = #{Target}.A;
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var result = (a - val - ((p & 0x#{FLAG[:C].to_s(16)}) ^ 0x#{FLAG[:C].to_s(16)})) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			#{Target}.P = (p & 0x#{((~(FLAG[:V]|FLAG[:C])) & 0xff).to_s(16)})
				| ((a ^ val) & (a ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x#{FLAG[:C].to_s(16)}) ^ 0x#{FLAG[:C].to_s(16)});
			#{UpdateFlag "#{Target}.A = newA"}
"""
		end
		def self.CPX()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (#{Target}.X - #{Target}.read(addr)) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.CPY()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (#{Target}.Y - #{Target}.read(addr)) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.CMP()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (#{Target}.A - #{Target}.read(addr)) & 0xffff;
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
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			#{Target}.P = (#{Target}.P & 0x#{(0xff & ~(FLAG[:V] | FLAG[:N] | FLAG[:Z])).to_s(16)})
				| (val & 0x#{(FLAG[:V] | FLAG[:N]).to_s(16)})
				| (this.ZNFlagCache[#{Target}.A & val] & 0x#{FLAG[:Z].to_s(16)});
"""
		end
		def self.ASL_
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var a = #{Target}.A;
			#{Target}.P = (#{Target}.P & 0xFE) | (a & 0xff) >> 7;
			#{UpdateFlag("#{Target}.A = (a << 1) & 0xff")}
"""
		end
		def self.ASL
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			#{Target}.P = (#{Target}.P & 0xFE) | val >> 7;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val << 1;
			#{Target}.write(addr, shifted);
			#{UpdateFlag("shifted & 0xff")}
"""
		end
		def self.LSR_
"""
			#{Target}.P = (#{Target}.P & 0xFE) | (#{Target}.A & 0x01);
			#{UpdateFlag("#{Target}.A >>= 1")}
"""
		end
		def self.LSR
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			#{Target}.P = (#{Target}.P & 0xFE) | (val & 0x01);
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = val >> 1;
			#{Target}.write(addr, shifted);
			#{UpdateFlag("shifted")}
"""
		end
		def self.ROL_
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var a = #{Target}.A;
			/**
			 * @const
			 * @type {Number}
			 */
			var p = #{Target}.P;
			#{Target}.P = (p & 0xFE) | ((a & 0xff) >> 7);
			#{UpdateFlag("#{Target}.A = (a << 1) | (p & 0x01)")}
"""
		end
		def self.ROL
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var p = #{Target}.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = ((val << 1) & 0xff) | (p & 0x01);
			#{Target}.P = (p & 0xFE) | (val >> 7);
			#{UpdateFlag("shifted")}
			#{Target}.write(addr, shifted);
"""
		end
		def self.ROR_
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var p = #{Target}.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var a = #{Target}.A;
			/**
			 * @const
			 * @type {Number}
			 */
			#{Target}.P = (p & 0xFE) | (a & 0x01);
			#{UpdateFlag("#{Target}.A = ((a >> 1) & 0x7f) | ((p & 0x1) << 7)")}
"""
		end
		def self.ROR
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Target}.read(addr);
			/**
			 * @const
			 * @type {Number}
			 */
			var p = #{Target}.P;
			/**
			 * @const
			 * @type {Number}
			 */
			var shifted = (val >> 1) | ((p & 0x01) << 7);
			#{Target}.P = (p & 0xFE) | (val & 0x01);
			#{UpdateFlag("shifted")}
			#{Target}.write(addr, shifted);
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
			/**
			 * @const
			 * @type {Number}
			 */
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
			/**
			 * @const
			 * @type {Number}
			 */
			var val = (#{Target}.read(addr)-1) & 0xff;
			#{UpdateFlag("val")}
			#{Target}.write(addr, val);
"""
		end
		def self.CLC_
"""
			#{Target}.P &= (0x#{(~(FLAG[:C])&0xff).to_s(16)});
"""
		end
		def self.CLI_
"""
			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			//#{Target}.needStatusRewrite = true;
			//#{Target}.newStatus = #{Target}.P & (0x#{(~(FLAG[:I])&0xff).to_s(16)});
			#{Target}.P &= 0x#{(~(FLAG[:I])&0xff).to_s(16)};
"""
		end
		def self.CLV_
"""
			#{Target}.P &= (0x#{(~(FLAG[:V])&0xff).to_s(16)});
"""
		end
		def self.CLD_
"""
			#{Target}.P &= (0x#{(~(FLAG[:D])&0xff).to_s(16)});
"""
		end
		def self.SEC_
"""
			#{Target}.P |= 0x#{FLAG[:C].to_s(16)};
"""
		end
		def self.SEI_
"""
			#{Target}.P |= 0x#{FLAG[:I].to_s(16)};
"""
		end
		def self.SED_
"""
			#{Target}.P |= 0x#{FLAG[:D].to_s(16)};
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
			if((#{Target}.P & 0x#{FLAG[:I].to_s(16)}) == 0x#{FLAG[:I].to_s(16)}){
				return;
			}*/
			#{Target}.PC++;
			#{Push "((#{Target}.PC >> 8) & 0xFF)"}
			#{Push "(#{Target}.PC & 0xFF)"}
			#{Target}.P |= 0x#{FLAG[:B].to_s(16)};
			#{Push "(#{Target}.P)"}
			#{Target}.P |= 0x#{FLAG[:I].to_s(16)};
			#{Target}.PC = (#{Target}.read(0xFFFE) | (#{Target}.read(0xFFFF) << 8));
"""
		end
		def self.CrossCheck()
			"#{Target}.consumeClock( (((#{Target}.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );"
		end
		def self.BCC
"""
			if(!(#{Target}.P & 0x#{FLAG[:C].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BCS
"""
			if(#{Target}.P & 0x#{FLAG[:C].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BEQ
"""
			if(#{Target}.P & 0x#{FLAG[:Z].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BNE
"""
			if(!(#{Target}.P & 0x#{FLAG[:Z].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BVC
"""
			if(!(#{Target}.P & 0x#{FLAG[:V].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BVS
"""
			if(#{Target}.P & 0x#{FLAG[:V].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BPL
"""
			if(!(#{Target}.P & 0x#{FLAG[:N].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BMI
"""
			if(#{Target}.P & 0x#{FLAG[:N].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.JSR
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var stored_pc = #{Target}.PC-1;
			#{Push "((stored_pc >> 8) & 0xFF)"}
			#{Push "(stored_pc & 0xFF)"}
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


require 'erb'
erb = ERB.new(File.read(ARGV[0], :encoding => "UTF-8"));
erb.filename = ARGV[0]
erb.run
