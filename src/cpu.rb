# -*- encoding: utf-8 -*-
require File.dirname(__FILE__)+"/opcode_info.rb";

Target="this"

module CPU
	ResetClock = 6;
	def self.RunInit()
"""
/**
 * @type {number}
 */
var __cpu__ZNFlagCache = this.__cpu__ZNFlagCache; var __cpu__TransTable = this.__cpu__TransTable;#{UseMemory()}
"""
	end
	def self.UseMemory()
	"var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;"
	end
	def self.Init()
		""
	end
	module IRQ
		FRAMECNT = 1;
		DMC = 2;
		CARTRIDGE = 4;
	end
	def self.ReserveIRQ(devID)
		"this.IRQ |= #{(devID) & 0xff};"
	end
	def self.IsIRQPending(devID)
		"(this.IRQ & #{(devID) & 0xff})"
	end
	def self.ReleaseIRQ(devID)
		"this.IRQ &= #{(~devID) & 0xff};"
	end
	def self.MemWrite(addr, val)
	end
	#変数はaddrは複数参照するので、副作用を起こさないこと
	def self.MemRead(addr, store_sym)
		addrsym = addr;
"""
switch((#{addrsym} & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		#{store_sym} = __cpu__ram[#{addrsym} & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		#{store_sym} = this.__video__readReg(#{addrsym});
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(#{addr} === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			#{store_sym} =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|((#{ CPU::IsIRQPending(CPU::IRQ::FRAMECNT) }) ? 64 : 0)
					|(#{ CPU::IsIRQPending(CPU::IRQ::DMC) } ? 128 : 0);
			#{ CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) }
			#{ CPU::ReleaseIRQ(CPU::IRQ::DMC) }
		}else if(#{addr} === 0x4016){
			#{store_sym} = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(#{addr} === 0x4017){
			#{store_sym} = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+#{addr}.toString(16));
		}else{
			#{store_sym} = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		#{store_sym} = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		#{store_sym} = __cpu__rom[(#{addrsym}>>10) & 31][#{addrsym} & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		#{store_sym} = __cpu__rom[(#{addrsym}>>10) & 31][#{addrsym} & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		#{store_sym} = __cpu__rom[(#{addrsym}>>10) & 31][#{addrsym} & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		#{store_sym} = __cpu__rom[(#{addrsym}>>10) & 31][#{addrsym} & 0x3ff];
		break;
	}
}
"""
	end
	def self.MemWrite(addr, val)
"""
switch((#{addr} & 0xE000) >> 13) {
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__ram[#{addr} & 0x1fff] = #{val};
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		this.__video__writeReg(#{addr}, #{val});
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		switch(#{addr} & 0x1f) {
		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */
			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = #{val} & 15;
			this.__rectangle0__decayEnabled = (#{val} & 16) == 0;
			this.__rectangle0__loopEnabled = (#{val} & 32) == 32;
			switch(#{val} >> 6)
			{
			case 0:
				this.__rectangle0__dutyRatio = 2;
				break;
			case 1:
				this.__rectangle0__dutyRatio = 4;
				break;
			case 2:
				this.__rectangle0__dutyRatio = 8;
				break;
			case 3:
				this.__rectangle0__dutyRatio = 12;
				break;
			}
			break;
		}
		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */
			this.__rectangle0__sweepShiftAmount = #{val} & 7;
			this.__rectangle0__sweepIncreased = (#{val} & 0x8) === 0x0;
			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (#{val} >> 4) & 3;
			this.__rectangle0__sweepEnabled = (#{val}&0x80) === 0x80;
			break;
		}
		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */
			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (#{val});
			break;
		}
		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */
			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((#{val} & 7) << 8);
			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[#{val} >> 3];
			/* Writing to the length registers restarts the length (obviously),
			and also restarts the duty cycle (channel 1,2 only), */
			this.__rectangle0__dutyCounter = 0;
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__rectangle0__decayReloaded = true;
			break;
		}
		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */
			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = #{val} & 15;
			this.__rectangle1__decayEnabled = (#{val} & 16) == 0;
			this.__rectangle1__loopEnabled = (#{val} & 32) == 32;
			switch(#{val} >> 6)
			{
			case 0:
				this.__rectangle1__dutyRatio = 2;
				break;
			case 1:
				this.__rectangle1__dutyRatio = 4;
				break;
			case 2:
				this.__rectangle1__dutyRatio = 8;
				break;
			case 3:
				this.__rectangle1__dutyRatio = 12;
				break;
			}
			break;
		}
		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */
			this.__rectangle1__sweepShiftAmount = #{val} & 7;
			this.__rectangle1__sweepIncreased = (#{val} & 0x8) === 0x0;
			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (#{val} >> 4) & 3;
			this.__rectangle1__sweepEnabled = (#{val}&0x80) === 0x80;
			break;
		}
		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */
			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (#{val});
			break;
		}
		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */
			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((#{val} & 7) << 8);
			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[#{val} >> 3];
			/* Writing to the length registers restarts the length (obviously),
			and also restarts the duty cycle (channel 1,2 only), */
			this.__rectangle1__dutyCounter = 0;
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__rectangle1__decayReloaded = true;
			break;
		}
		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */
			this.__triangle__enableLinearCounter = ((#{val} & 128) == 128);
			this.__triangle__linearCounterBuffer = #{val} & 127;
			break;
		}
		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */
			/* unused */
			break;
		}
		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */
			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | #{val};
			break;
		}
		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */
			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((#{val} & 7) << 8);
			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[#{val} >> 3];
			/* Side effects 	Sets the halt flag */
			this.__triangle__haltFlag = true;
			break;
		}
		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */
			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = #{val} & 15;
			this.__noize__decayEnabled = (#{val} & 16) == 0;
			this.__noize__loopEnabled = (#{val} & 32) == 32;
			break;
		}
		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */
			/* unused */
			break;
		}
		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */
			this.__noize__modeFlag = (#{val} & 128) == 128;
			this.__noize__frequency = this.__noize__FrequencyTable[#{val} & 15];
			break;
		}
		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */
			/* Writing to the length registers restarts the length (obviously), */
			this.__noize__lengthCounter = this.__audio__LengthCounterConst[#{val} >> 3];
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__noize__decayReloaded = true;
			break;
		}
		/* ------------------------------------ DMC ----------------------------------------------------- */
		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */
			this.__digital__irqEnabled = (#{val} & 128) == 128;
			if(!this.__digital__irqEnabled){
				#{ CPU::ReleaseIRQ(CPU::IRQ::DMC) }
			}
			this.__digital__loopEnabled = (#{val} & 64) == 64;
			this.__digital__frequency = this.__digital__FrequencyTable[#{val} & 0xf];
			break;
		}
		case 0x11: { /* 4011h - DMC Delta counter load register */
			this.__digital__deltaCounter = #{val} & 0x7f;
			break;
		}
		case 0x12: { /* 4012h - DMC address load register */
			this.__digital__sampleAddr = 0xc000 | (#{val} << 6);
			break;
		}
		case 0x13: { /* 4013h - DMC length register */
			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (#{val} << 4) | 1;
			break;
		}
		case 0x14: { /* 4014h execute Sprite DMA */
			/** @type {number} uint16_t */
			var __audio__dma__addrMask = #{val} << 8;
			var __video__spRam = this.__video__spRam;
			var __video__spriteAddr = this.__video__spriteAddr;
			for(var i=0;i<256;++i){
				var __audio__dma__addr__ = __audio__dma__addrMask | i;
				var __audio_dma__val;
				#{CPU::MemRead("__audio__dma__addr__", "__audio_dma__val")}
				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;
			}
			__vm__clockDelta += 512;
			break;
		}
		/* ------------------------------ CTRL -------------------------------------------------- */
		case 0x15: { /* __audio__analyzeStatusRegister */
			if(!(#{val} & 1)) this.__rectangle0__lengthCounter = 0;
			if(!(#{val} & 2)) this.__rectangle1__lengthCounter = 0;
			if(!(#{val} & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }
			if(!(#{val} & 8)) this.__noize__lengthCounter = 0;
			if(!(#{val} & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}
			break;
		}
		case 0x16: {
			if((#{val} & 1) === 1){
				this.__pad__pad1Idx = 0;
				this.__pad__pad2Idx = 0;
			}
			break;
		}
		case 0x17: { /* __audio__analyzeLowFrequentryRegister */
			/* Any write to $4017 resets both the frame counter, and the clock divider. */
			if(#{val} & 0x80) {
				this.__audio__isNTSCmode = false;
				this.__audio__frameCnt = #{ Audio::AUDIO_CLOCK-2*Audio::FRAME_IRQ_RATE };
				this.__audio__frameIRQCnt = 4;
			}else{
				this.__audio__isNTSCmode = true;
				this.__audio__frameIRQenabled = true;
				this.__audio__frameCnt = #{ Audio::AUDIO_CLOCK-2*Audio::FRAME_IRQ_RATE };
				this.__audio__frameIRQCnt = 3;
			}
			if((#{val} & 0x40) === 0x40){
				this.__audio__frameIRQenabled = false;
				#{ CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) }
			}
			break;
		}
		default: {
			/* this.writeMapperRegisterArea(#{addr}, #{val}); */
			break;
		}
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		this.writeMapperCPU(#{addr}, #{val});
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		this.writeMapperCPU(#{addr}, #{val});
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		this.writeMapperCPU(#{addr}, #{val});
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		this.writeMapperCPU(#{addr}, #{val});
		break;
	}
}
""".gsub(/[\r\n]/, '');
	end
	def self.Push(val)
		" /* ::CPU::Push */ __cpu__ram[0x0100 | (#{Target}.SP-- & 0xff)] = #{val};";
	end
	def self.Pop()
		"/* ::CPU::Pop */ (__cpu__ram[0x0100 | (++#{Target}.SP & 0xff)])";
	end
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
			TransTable[b] = CPU::Middle::AddrMode[addr] | CPU::Middle::InstMode[opsym] | ((Opcode::Cycle[b])<< CPU::Middle::ClockShift);
		end
	end
	
	def self.ConsumeClock(clk)
		"__vm__clockDelta += (#{clk});"
	end
	def self.ConsumeReservedClock(clk)
		"__vm__reservedClockDelta += (#{clk});"
	end

	module AddrMode
		def self.CrossCheck()
			"if(((__cpu__addr ^ __cpu__addr_base) & 0x0100) !== 0) #{CPU::ConsumeClock 1}"
		end
		def self.Init()
"""
			/**
			 * @const
			 * @type {number}
			 */
			var __cpu__pc = #{Target}.PC;
"""
		end
		def self.excelPC(size)
"""
			#{Target}.PC = __cpu__pc + #{size};
"""
		end
		def self.Immediate()
"""
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__pc+1);
			#{excelPC 2}
"""
		end

		def self.Zeropage()
"""
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			var __cpu__addr;
			#{CPU::MemRead("__cpu__addr_base", "__cpu__addr")}
			#{excelPC 2}
"""
		end
		def self.ZeropageX()
"""
			var __cpu__addr_base = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base", "__cpu__addr_base")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base + #{Target}.X) & 0xff;
			#{excelPC 2}
"""
		end
		def self.ZeropageY()
"""
			var __cpu__addr_base = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base", "__cpu__addr_base")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base + #{Target}.Y) & 0xff;
			#{excelPC 2}
"""
		end
		def self.Absolute()
"""
			var __cpu__addr_base1 = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base1", "__cpu__addr_base1")}
			var __cpu__addr_base2 = __cpu__pc+2;
			#{CPU::MemRead("__cpu__addr_base2", "__cpu__addr_base2")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base1 | (__cpu__addr_base2 << 8));
			#{excelPC 3}
"""
		end
		def self.AbsoluteX()
"""
			var __cpu__addr_base1 = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base1", "__cpu__addr_base1")}
			var __cpu__addr_base2 = __cpu__pc+2;
			#{CPU::MemRead("__cpu__addr_base2", "__cpu__addr_base2")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base1 | (__cpu__addr_base2 << 8)) + #{Target}.X;
			#{CrossCheck()}
			#{excelPC 3}
"""
		end
		def self.AbsoluteY()
"""
			var __cpu__addr_base1 = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base1", "__cpu__addr_base1")}
			var __cpu__addr_base2 = __cpu__pc+2;
			#{CPU::MemRead("__cpu__addr_base2", "__cpu__addr_base2")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base1 | (__cpu__addr_base2 << 8)) + #{Target}.Y;
			#{CrossCheck()}
			#{excelPC 3}
"""
		end
		def self.Indirect()
"""
			var __cpu__addr_base1 = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base1", "__cpu__addr_base1")}
			var __cpu__addr_base2 = __cpu__pc+2;
			#{CPU::MemRead("__cpu__addr_base2", "__cpu__addr_base2")}
			var __cpu__addr_base3 = (__cpu__addr_base1 | (__cpu__addr_base2 << 8));

			var __cpu__addr_base4;
			#{CPU::MemRead("__cpu__addr_base3", "__cpu__addr_base4")}
			var __cpu__addr_base5 = (__cpu__addr_base3 & 0xff00) | ((__cpu__addr_base3+1) & 0x00ff) /* bug of NES */;
			#{CPU::MemRead("__cpu__addr_base5", "__cpu__addr_base5")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = __cpu__addr_base4 | (__cpu__addr_base5 << 8); 
			#{excelPC 3}
"""
		end
		def self.IndirectX()
"""
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base", "__cpu__addr_base")}
			__cpu__addr_base = (__cpu__addr_base + #{Target}.X) & 0xff;
			/**
			 * @type {number}
			 */
			var __cpu__addr = __cpu__ram[__cpu__addr_base] | (__cpu__ram[(__cpu__addr_base + 1) & 0xff] << 8);
			#{excelPC 2}
"""
		end
		def self.IndirectY()
"""
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base", "__cpu__addr_base")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__ram[__cpu__addr_base] | (__cpu__ram[(__cpu__addr_base + 1) & 0xff] << 8)) + #{Target}.Y;
			#{excelPC 2}
"""
		end
		def self.Relative()
"""
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			#{CPU::MemRead("__cpu__addr_base", "__cpu__addr_base")}
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base >= 128 ? (__cpu__addr_base-256) : __cpu__addr_base) + __cpu__pc + 2;
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
		def self.UpdateFlag(val)
			"/* UpdateFlag */ #{Target}.P = (#{Target}.P & 0x7D) | __cpu__ZNFlagCache[#{val}];"
		end
		def self.LDA()
"""
var tmpA;
#{CPU::MemRead("__cpu__addr", "tmpA")}
#{UpdateFlag("#{Target}.A = tmpA")}
"""
		end
		def self.LDY()
"""
var tmpY;
#{CPU::MemRead("__cpu__addr", "tmpY")}
#{UpdateFlag("#{Target}.Y = tmpY")}
"""
		end
		def self.LDX()
"""
var tmpX;
#{CPU::MemRead("__cpu__addr", "tmpX")}
#{UpdateFlag("#{Target}.X = tmpX")}
"""
		end
		def self.STA()
			CPU::MemWrite("__cpu__addr", "#{Target}.A");
		end
		def self.STX()
			CPU::MemWrite("__cpu__addr", "#{Target}.X");
		end
		def self.STY()
			CPU::MemWrite("__cpu__addr", "#{Target}.Y");
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
			#{::CPU::Push("#{Target}.P | 0x#{Opcode::Flag[:B].to_s(16)}")}
"""
		end
		def self.PLP()
"""
			/**
			 * @type {number}
			 */
			var val = #{::CPU::Pop()};
			if((#{Target}.P & 0x#{Opcode::Flag[:I].to_s(16)}) && !(val & 0x#{Opcode::Flag[:I].to_s(16)})){
				// FIXME: ここどうする？？
				#{Target}.needStatusRewrite = true;
				#{Target}.newStatus =val;
				//#{Target}.P = val;
			}else{
				#{Target}.P = val;
			}
"""
		end
		def self.PHA()
			::CPU::Push("#{Target}.A");
		end
		def self.PLA()
			UpdateFlag("#{Target}.A = #{::CPU::Pop()}");
		end
		def self.ADC()
"""
			/**
			 * @type {number}
			 */
			var __cpu__adc_p = #{Target}.P;
			/**
			 * @type {number}
			 */
			var __cpu__adc_a = #{Target}.A;
			/**
			 * @type {number}
			 */
			var __cpu__adc_val; #{CPU::MemRead("__cpu__addr", "__cpu__adc_val")}
			/**
			 * @type {number}
			 */
			var __cpu__adc_result = (__cpu__adc_a + __cpu__adc_val + (__cpu__adc_p & 0x#{Opcode::Flag[:C].to_s(16)})) & 0xffff;
			/**
			 * @type {number}
			 */
			var __cpu__adc_newA = __cpu__adc_result & 0xff;
			#{Target}.P = (__cpu__adc_p & 0x#{((~(Opcode::Flag[:V] | Opcode::Flag[:C])) & 0xff).to_s(16)})
				| ((((__cpu__adc_a ^ val) & 0x80) ^ 0x80) & ((__cpu__adc_a ^ __cpu__adc_newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((__cpu__adc_result >> 8) & 0x#{Opcode::Flag[:C].to_s(16)}); //set C flag
			#{UpdateFlag "#{Target}.A = __cpu__adc_newA"}
"""
		end
		def self.SBC()
"""
			/**
			 * @type {number}
			 */
			var __cpu__sbc_p = #{Target}.P;
			/**
			 * @type {number}
			 */
			var __cpu__sbc_a = #{Target}.A;
			/**
			 * @type {number}
			 */
			var __cpu__sbc_val; #{CPU::MemRead("__cpu__addr", "__cpu__sbc_val")}
			/**
			 * @type {number}
			 */
			var __cpu__sbc_result = (__cpu__sbc_a - __cpu__sbc_val - ((__cpu__sbc_p & 0x#{Opcode::Flag[:C].to_s(16)}) ^ 0x#{Opcode::Flag[:C].to_s(16)})) & 0xffff;
			/**
			 * @type {number}
			 */
			var __cpu__sbc_newA = __cpu__sbc_result & 0xff;
			#{Target}.P = (__cpu__sbc_p & 0x#{((~(Opcode::Flag[:V]|Opcode::Flag[:C])) & 0xff).to_s(16)})
				| ((__cpu__sbc_a ^ __cpu__sbc_val) & (__cpu__sbc_a ^ __cpu__sbc_newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((__cpu__sbc_result >> 8) & 0x#{Opcode::Flag[:C].to_s(16)}) ^ 0x#{Opcode::Flag[:C].to_s(16)});
			#{UpdateFlag "#{Target}.A = __cpu__sbc_newA"}
"""
		end
		def self.CPX()
"""
			var mem; #{CPU::MemRead("__cpu__addr", "mem")}
			/**
			 * @type {number}
			 */
			var val = (#{Target}.X - mem) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.CPY()
"""
			var mem; #{CPU::MemRead("__cpu__addr", "mem")}
			/**
			 * @type {number}
			 */
			var val = (#{Target}.Y - mem) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.CMP()
"""
			var mem; #{CPU::MemRead("__cpu__addr", "mem")}
			/**
			 * @type {number}
			 */
			var val = (#{Target}.A - mem) & 0xffff;
			#{UpdateFlag "val & 0xff"}
			#{Target}.P = (#{Target}.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
"""
		end
		def self.AND
"""
var mem; #{CPU::MemRead("__cpu__addr", "mem")};
#{UpdateFlag("#{Target}.A &= mem")}
"""
		end
		def self.EOR
"""
var mem; #{CPU::MemRead("__cpu__addr", "mem")};
#{UpdateFlag("#{Target}.A ^= mem")}
"""
		end
		def self.ORA
"""
var mem; #{CPU::MemRead("__cpu__addr", "mem")};
#{UpdateFlag("#{Target}.A |= mem")}
"""
		end
		def self.BIT
"""
			/**
			 * @type {number}
			 */
			var val; #{CPU::MemRead("__cpu__addr","val")}
			#{Target}.P = (#{Target}.P & 0x#{(0xff & ~(Opcode::Flag[:V] | Opcode::Flag[:N] | Opcode::Flag[:Z])).to_s(16)})
				| (val & 0x#{(Opcode::Flag[:V] | Opcode::Flag[:N]).to_s(16)})
				| (__cpu__ZNFlagCache[#{Target}.A & val] & 0x#{Opcode::Flag[:Z].to_s(16)});
"""
		end
		def self.ASL_
"""
			/**
			 * @type {number}
			 */
			var a = #{Target}.A;
			#{Target}.P = (#{Target}.P & 0xFE) | (a & 0xff) >> 7;
			#{UpdateFlag("#{Target}.A = (a << 1) & 0xff")}
"""
		end
		def self.ASL
"""
			/**
			 * @type {number}
			 */
			var val; #{CPU::MemRead("__cpu__addr","val")}
			#{Target}.P = (#{Target}.P & 0xFE) | val >> 7;
			/**
			 * @type {number}
			 */
			var shifted = val << 1;
			#{CPU::MemWrite("__cpu__addr", "shifted")}
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
			 * @type {number}
			 */
			var val; #{CPU::MemRead("__cpu__addr","val")}
			#{Target}.P = (#{Target}.P & 0xFE) | (val & 0x01);
			/**
			 * @type {number}
			 */
			var shifted = val >> 1;
			#{CPU::MemWrite("__cpu__addr", "shifted")}
			#{UpdateFlag("shifted")}
"""
		end
		def self.ROL_
"""
			/**
			 * @type {number}
			 */
			var a = #{Target}.A;
			/**
			 * @type {number}
			 */
			var p = #{Target}.P;
			#{Target}.P = (p & 0xFE) | ((a & 0xff) >> 7);
			#{UpdateFlag("#{Target}.A = (a << 1) | (p & 0x01)")}
"""
		end
		def self.ROL
"""
			/**
			 * @type {number}
			 */
			var val; #{CPU::MemRead("__cpu__addr","val")}
			/**
			 * @type {number}
			 */
			var p = #{Target}.P;
			/**
			 * @type {number}
			 */
			var shifted = ((val << 1) & 0xff) | (p & 0x01);
			#{Target}.P = (p & 0xFE) | (val >> 7);
			#{UpdateFlag("shifted")}
			#{CPU::MemWrite("__cpu__addr", "shifted")}
"""
		end
		def self.ROR_
"""
			/**
			 * @type {number}
			 */
			var p = #{Target}.P;
			/**
			 * @type {number}
			 */
			var a = #{Target}.A;
			/**
			 * @type {number}
			 */
			#{Target}.P = (p & 0xFE) | (a & 0x01);
			#{UpdateFlag("#{Target}.A = ((a >> 1) & 0x7f) | ((p & 0x1) << 7)")}
"""
		end
		def self.ROR
"""
			/**
			 * @type {number}
			 */
			var val; #{CPU::MemRead("__cpu__addr","val")}
			/**
			 * @type {number}
			 */
			var p = #{Target}.P;
			/**
			 * @type {number}
			 */
			var shifted = (val >> 1) | ((p & 0x01) << 7);
			#{Target}.P = (p & 0xFE) | (val & 0x01);
			#{UpdateFlag("shifted")}
			#{CPU::MemWrite("__cpu__addr", "shifted")}
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
			 * @type {number}
			 */
			var mem; #{CPU::MemRead("__cpu__addr","mem")}
			var val = (mem+1) & 0xff;
			#{UpdateFlag("val")}
			#{CPU::MemWrite("__cpu__addr", "val")}
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
			 * @type {number}
			 */
			var mem; #{CPU::MemRead("__cpu__addr","mem")}
			var val = (mem-1) & 0xff;
			#{UpdateFlag("val")}
			#{CPU::MemWrite("__cpu__addr", "val")}
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
			#{Target}.needStatusRewrite = true;
			#{Target}.newStatus = #{Target}.P & (0x#{(~(Opcode::Flag[:I])&0xff).to_s(16)});
			//#{Target}.P &= 0x#{(~(Opcode::Flag[:I])&0xff).to_s(16)};
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
			if(#{Target}.P & 0x#{Opcode::Flag[:I].to_s(16)}){
				return;
			}*/
			#{Target}.PC++;
			#{::CPU::Push "#{Target}.PC >> 8"}
			#{::CPU::Push "#{Target}.PC"}
			#{Target}.P |= 0x#{Opcode::Flag[:B].to_s(16)};
			#{::CPU::Push "(#{Target}.P)"}
			#{Target}.P |= 0x#{Opcode::Flag[:I].to_s(16)};
			//#{Target}.PC = (#{Target}.read(0xFFFE) | (#{Target}.read(0xFFFF) << 8));
			#{Target}.PC = (rom[31][0x3FE] | (rom[31][0x3FF] << 8));
"""
		end
		def self.CrossCheck
			CPU::ConsumeClock "(((#{Target}.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1"
		end
		def self.BCC
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:C].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BCS
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:C].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BEQ
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:Z].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BNE
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:Z].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BVC
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:V].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BVS
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:V].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BPL
"""
			if(!(#{Target}.P & 0x#{Opcode::Flag[:N].to_s(16)})){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.BMI
"""
			if(#{Target}.P & 0x#{Opcode::Flag[:N].to_s(16)}){
				#{CrossCheck()}
				#{Target}.PC = __cpu__addr;
			}
"""
		end
		def self.JSR
"""
			/**
			 * @const
			 * @type {number}
			 */
			var __cpu__jsr_stored_pc = #{Target}.PC-1;
			#{::CPU::Push "__cpu__jsr_stored_pc >> 8"}
			#{::CPU::Push "__cpu__jsr_stored_pc"}
			#{Target}.PC = __cpu__addr;
"""
		end
		def self.JMP
"""
			#{Target}.PC = __cpu__addr;
"""
		end
			def self.RTI
"""
			#{Target}.P = #{::CPU::Pop()};
			#{Target}.PC = #{::CPU::Pop()} | (#{::CPU::Pop()} << 8);
"""
		end
		def self.RTS
"""
			#{Target}.PC = (#{::CPU::Pop()} | (#{::CPU::Pop()} << 8)) + 1;
"""
		end
	end
end


