# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";

Target="this"

module Generator
	module Middle
	    TransTable = [0xff]*0x100;
		AddrMode = {
			:Immediate => 0,
			:Zeropage => 1,
			:ZeropageX => 2,
			:ZeropageY => 3,
			:Absolute => 4,
			:AbsoluteX => 5,
			:AbsoluteY => 6,
			:Indirect => 7,
			:IndirectX => 8,
			:IndirectY => 9,
			:Relative => 10,
			:None => 11
		};
		AddrModeMask = 0xf;
		InstMode = {
            :LDA => 0,
            :LDX => 16,
            :LDY => 32,
            :STA => 48,
            :STX => 64,
            :STY => 80,
            :TAX => 96,
            :TAY => 112,
            :TSX => 128,
            :TXA => 144,
            :TXS => 160,
            :TYA => 176,
            :ADC => 192,
            :AND => 208,
            :ASL => 224,
            :ASL_ => 240,
            :BIT => 256,
            :CMP => 272,
            :CPX => 288,
            :CPY => 304,
            :DEC => 320,
            :DEX => 336,
            :DEY => 352,
            :EOR => 368,
            :INC => 384,
            :INX => 400,
            :INY => 416,
            :LSR => 432,
            :LSR_ => 448,
            :ORA => 464,
            :ROL => 480,
            :ROL_ => 496,
            :ROR => 512,
            :ROR_ => 528,
            :SBC => 544,
            :PHA => 560,
            :PHP => 576,
            :PLA => 592,
            :PLP => 608,
            :CLC => 624,
            :CLD => 640,
            :CLI => 656,
            :CLV => 672,
            :SEC => 688,
            :SED => 704,
            :SEI => 720,
            :BRK => 736,
            :NOP => 752,
            :RTS => 768,
            :RTI => 784,
            :JMP => 800,
            :JSR => 816,
            :BCC => 832,
            :BCS => 848,
            :BEQ => 864,
            :BMI => 880,
            :BNE => 896,
            :BPL => 912,
            :BVC => 928,
            :BVS => 944,
		};
		InstModeMask = 0xfff0;
		ClockShift = 16;
        Opcode::eachInst do |b, opsym, addr|
            next if addr.nil? or opsym.nil?
            TransTable[b] = Generator::Middle::AddrMode[addr] | Generator::Middle::InstMode[opsym] | ((Opcode::Cycle[b])<< Generator::Middle::ClockShift);
        end
	end

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
		def self.TXA()
			UpdateFlag("#{Target}.A = #{Target}.X");
		end
		def self.TYA()
			UpdateFlag("#{Target}.A = #{Target}.Y");
		end
		def self.TXS()
			"#{Target}.SP = #{Target}.X;";
		end
		def self.TAY()
			UpdateFlag("#{Target}.Y = #{Target}.A");
		end
		def self.TAX()
			UpdateFlag("#{Target}.X = #{Target}.A");
		end
		def self.TSX()
			UpdateFlag("#{Target}.X = #{Target}.SP");
		end
		def self.PHP()
"""
			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			#{Push("#{Target}.P | 0x#{Opcode::Flag[:B].to_s(16)}")}
"""
		end
		def self.PLP()
"""
			/**
			 * @const
			 * @type {Number}
			 */
			var val = #{Pop()};
			if((#{Target}.P & 0x#{Opcode::Flag[:I].to_s(16)}) && !(val & 0x#{Opcode::Flag[:I].to_s(16)})){
				// FIXME: ここどうする？？
				//#{Target}.needStatusRewrite = true;
				//#{Target}.newStatus =val;
				#{Target}.P = val;
			}else{
				#{Target}.P = val;
			}
"""
		end
		def self.PHA()
			Push("#{Target}.A");
		end
		def self.PLA()
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
			var result = (a + val + (p & 0x#{Opcode::Flag[:C].to_s(16)})) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			#{Target}.P = (p & 0x#{((~(Opcode::Flag[:V] | Opcode::Flag[:C])) & 0xff).to_s(16)})
				| ((((a ^ val) & 0x80) ^ 0x80) & ((a ^ newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((result >> 8) & 0x#{Opcode::Flag[:C].to_s(16)}); //set C flag
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
			var result = (a - val - ((p & 0x#{Opcode::Flag[:C].to_s(16)}) ^ 0x#{Opcode::Flag[:C].to_s(16)})) & 0xffff;
			/**
			 * @const
			 * @type {Number}
			 */
			var newA = result & 0xff;
			#{Target}.P = (p & 0x#{((~(Opcode::Flag[:V]|Opcode::Flag[:C])) & 0xff).to_s(16)})
				| ((a ^ val) & (a ^ newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((result >> 8) & 0x#{Opcode::Flag[:C].to_s(16)}) ^ 0x#{Opcode::Flag[:C].to_s(16)});
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
			#{Target}.P = (#{Target}.P & 0x#{(0xff & ~(Opcode::Flag[:V] | Opcode::Flag[:N] | Opcode::Flag[:Z])).to_s(16)})
				| (val & 0x#{(Opcode::Flag[:V] | Opcode::Flag[:N]).to_s(16)})
				| (this.ZNFlagCache[#{Target}.A & val] & 0x#{Opcode::Flag[:Z].to_s(16)});
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
		def self.INX
			UpdateFlag("#{Target}.X = (#{Target}.X+1)&0xff")
		end
		def self.INY
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
		def self.DEX
			UpdateFlag("#{Target}.X = (#{Target}.X-1)&0xff")
		end
		def self.DEY
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
		def self.CLC
"""
			#{Target}.P &= (0x#{(~(Opcode::Flag[:C])&0xff).to_s(16)});
"""
		end
		def self.CLI
"""
			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			//#{Target}.needStatusRewrite = true;
			//#{Target}.newStatus = #{Target}.P & (0x#{(~(Opcode::Flag[:I])&0xff).to_s(16)});
			#{Target}.P &= 0x#{(~(Opcode::Flag[:I])&0xff).to_s(16)};
"""
		end
		def self.CLV
"""
			#{Target}.P &= (0x#{(~(Opcode::Flag[:V])&0xff).to_s(16)});
"""
		end
		def self.CLD
"""
			#{Target}.P &= (0x#{(~(Opcode::Flag[:D])&0xff).to_s(16)});
"""
		end
		def self.SEC
"""
			#{Target}.P |= 0x#{Opcode::Flag[:C].to_s(16)};
"""
		end
		def self.SEI
"""
			#{Target}.P |= 0x#{Opcode::Flag[:I].to_s(16)};
"""
		end
		def self.SED
"""
			#{Target}.P |= 0x#{Opcode::Flag[:D].to_s(16)};
"""
		end
		def self.NOP
			""
		end
		def self.BRK
"""
			//NES ON FPGAには、
			//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
			//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
			//DQ4はこうしないと、動かない。
			/*
			if((#{Target}.P & 0x#{Opcode::Flag[:I].to_s(16)}) == 0x#{Opcode::Flag[:I].to_s(16)}){
				return;
			}*/
			#{Target}.PC++;
			#{Push "((#{Target}.PC >> 8) & 0xFF)"}
			#{Push "(#{Target}.PC & 0xFF)"}
			#{Target}.P |= 0x#{Opcode::Flag[:B].to_s(16)};
			#{Push "(#{Target}.P)"}
			#{Target}.P |= 0x#{Opcode::Flag[:I].to_s(16)};
			#{Target}.PC = (#{Target}.read(0xFFFE) | (#{Target}.read(0xFFFF) << 8));
"""
		end
		def self.CrossCheck
			"#{Target}.consumeClock( (((#{Target}.PC ^ addr) & 0x0100) != 0) ? 2 : 1 );"
		end
		def self.BCC
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:C].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BCS
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:C].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BEQ
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:Z].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BNE
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:Z].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BVC
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:V].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BVS
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:V].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BPL
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:N].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = addr;
			}
"""
		end
		def self.BMI
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:N].to_s(16)}){
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
			def self.RTI
"""
			#{Target}.P = #{Pop()};
			#{Target}.PC = #{Pop()} | (#{Pop()} << 8);
"""
		end
		def self.RTS
"""
			#{Target}.PC = (#{Pop()} | (#{Pop()} << 8)) + 1;
"""
		end
	end
end


