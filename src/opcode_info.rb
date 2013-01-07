# -*- encoding: utf-8 -*-

require File.expand_path( File.dirname(__FILE__)+"/cpu.rb" );
module Opcode
=begin
	各命令のアドレッシングモード別のオペコードを格納。nilの場合は存在しない事を示す。
	これを元にして各種テーブルを動的につくりましょう。
	Noneアドレッシングは（エミュレータ的には）全く別の働きになるので、アンダーバーを付けて分けました。
=end
	INST_TABLE = {
		:LDA => 
		{
			:Immediate => 0xA9,
			:Zeropage  => 0xA5,
			:ZeropageX => 0xB5,
			:ZeropageY => nil,
			:Absolute  => 0xAD,
			:AbsoluteX => 0xBD,
			:AbsoluteY => 0xB9,
			:Indirect  => nil,
			:IndirectX => 0xA1,
			:IndirectY => 0xB1,
			:Relative => nil,
			:None => nil
		},
		:LDX => 
		{
			:Immediate => 0xA2,
			:Zeropage  => 0xA6,
			:ZeropageX => nil,
			:ZeropageY => 0xB6,
			:Absolute  => 0xAE,
			:AbsoluteX => nil,
			:AbsoluteY => 0xBE,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:LDY => 
		{
			:Immediate => 0xA0,
			:Zeropage  => 0xA4,
			:ZeropageX => 0xB4,
			:ZeropageY => nil,
			:Absolute  => 0xAC,
			:AbsoluteX => 0xBC,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:STA => 
		{
			:Immediate => nil,
			:Zeropage  => 0x85,
			:ZeropageX => 0x95,
			:ZeropageY => nil,
			:Absolute  => 0x8D,
			:AbsoluteX => 0x9D,
			:AbsoluteY => 0x99,
			:Indirect  => nil,
			:IndirectX => 0x81,
			:IndirectY => 0x91,
			:Relative => nil,
			:None => nil
		},
		:STX => 
		{
			:Immediate => nil,
			:Zeropage  => 0x86,
			:ZeropageX => nil,
			:ZeropageY => 0x96,
			:Absolute  => 0x8e,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:STY => 
		{
			:Immediate => nil,
			:Zeropage  => 0x84,
			:ZeropageX => 0x94,
			:ZeropageY => nil,
			:Absolute  => 0x8C,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:TAX => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xAA
		},
		:TAY => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xA8
		},
		:TSX => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xBA
		},
		:TXA => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x8A
		},
		:TXS => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x9A
		},
		:TYA => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x98
		},
		:ADC => 
		{
			:Immediate => 0x69,
			:Zeropage  => 0x65,
			:ZeropageX => 0x75,
			:ZeropageY => nil,
			:Absolute  => 0x6D,
			:AbsoluteX => 0x7D,
			:AbsoluteY => 0x79,
			:Indirect  => nil,
			:IndirectX => 0x61,
			:IndirectY => 0x71,
			:Relative => nil,
			:None => nil
		},
		:AND => 
		{
			:Immediate => 0x29,
			:Zeropage  => 0x25,
			:ZeropageX => 0x35,
			:ZeropageY => nil,
			:Absolute  => 0x2D,
			:AbsoluteX => 0x3D,
			:AbsoluteY => 0x39,
			:Indirect  => nil,
			:IndirectX => 0x21,
			:IndirectY => 0x31,
			:Relative => nil,
			:None => nil
		},
		:ASL => 
		{
			:Immediate => nil,
			:Zeropage  => 0x06,
			:ZeropageX => 0x16,
			:ZeropageY => nil,
			:Absolute  => 0x0E,
			:AbsoluteX => 0x1E,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:ASL_ => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x0A
		},
		:BIT => 
		{
			:Immediate => nil,
			:Zeropage  => 0x24,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => 0x2C,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:CMP => 
		{
			:Immediate => 0xC9,
			:Zeropage  => 0xC5,
			:ZeropageX => 0xD5,
			:ZeropageY => nil,
			:Absolute  => 0xCD,
			:AbsoluteX => 0xDD,
			:AbsoluteY => 0xD9,
			:Indirect  => nil,
			:IndirectX => 0xC1,
			:IndirectY => 0xD1,
			:Relative => nil,
			:None => nil
		},
		:CPX => 
		{
			:Immediate => 0xE0,
			:Zeropage  => 0xE4,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => 0xEC,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:CPY => 
		{
			:Immediate => 0xC0,
			:Zeropage  => 0xC4,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => 0xCC,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:DEC => 
		{
			:Immediate => nil,
			:Zeropage  => 0xC6,
			:ZeropageX => 0xD6,
			:ZeropageY => nil,
			:Absolute  => 0xCE,
			:AbsoluteX => 0xDE,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:DEX => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xCA
		},
		:DEY => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x88
		},
		:EOR => 
		{
			:Immediate => 0x49,
			:Zeropage  => 0x45,
			:ZeropageX => 0x55,
			:ZeropageY => nil,
			:Absolute  => 0x4D,
			:AbsoluteX => 0x5D,
			:AbsoluteY => 0x59,
			:Indirect  => nil,
			:IndirectX => 0x41,
			:IndirectY => 0x51,
			:Relative => nil,
			:None => nil
		},
		:INC => 
		{
			:Immediate => nil,
			:Zeropage  => 0xE6,
			:ZeropageX => 0xF6,
			:ZeropageY => nil,
			:Absolute  => 0xEE,
			:AbsoluteX => 0xFE,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:INX => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xE8
		},
		:INY => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xC8
		},
		:LSR => 
		{
			:Immediate => nil,
			:Zeropage  => 0x46,
			:ZeropageX => 0x56,
			:ZeropageY => nil,
			:Absolute  => 0x4E,
			:AbsoluteX => 0x5E,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:LSR_ => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x4A
		},
		:ORA => 
		{
			:Immediate => 0x09,
			:Zeropage  => 0x05,
			:ZeropageX => 0x15,
			:ZeropageY => nil,
			:Absolute  => 0x0D,
			:AbsoluteX => 0x1D,
			:AbsoluteY => 0x19,
			:Indirect  => nil,
			:IndirectX => 0x01,
			:IndirectY => 0x11,
			:Relative => nil,
			:None => nil
		},
		:ROL => 
		{
			:Immediate => nil,
			:Zeropage  => 0x26,
			:ZeropageX => 0x36,
			:ZeropageY => nil,
			:Absolute  => 0x2E,
			:AbsoluteX => 0x3E,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:ROL_ => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x2A
		},
		:ROR => 
		{
			:Immediate => nil,
			:Zeropage  => 0x66,
			:ZeropageX => 0x76,
			:ZeropageY => nil,
			:Absolute  => 0x6E,
			:AbsoluteX => 0x7E,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:ROR_ => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x6A
		},
		:SBC => 
		{
			:Immediate => 0xE9,
			:Zeropage  => 0xE5,
			:ZeropageX => 0xF5,
			:ZeropageY => nil,
			:Absolute  => 0xED,
			:AbsoluteX => 0xFD,
			:AbsoluteY => 0xF9,
			:Indirect  => nil,
			:IndirectX => 0xE1,
			:IndirectY => 0xF1,
			:Relative => nil,
			:None => nil
		},
		:PHA => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x48
		},
		:PHP => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x08
		},
		:PLA => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x68
		},
		:PLP =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x28
		},
		:CLC =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x18
		},
		:CLD =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xD8
		},
		:CLI =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x58
		},
		:CLV =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xB8
		},
		:SEC =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x38
		},
		:SED =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xF8
		},
		:SEI =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x78
		},
		:BRK =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x0
		},
		:NOP =>
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0xEA
		},
		# ジャンプアドレス計算の必要のない方たち
		:RTS => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x60
		},
		:RTI => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => 0x40
		},
		:JMP => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => 0x4C,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => 0x6C,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:JSR => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => 0x20,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => nil,
			:None => nil
		},
		:BCC => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0x90,
			:None => nil
		},
		:BCS => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0xB0,
			:None => nil
		},
		:BEQ => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0xF0,
			:None => nil
		},
		:BMI => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0x30,
			:None => nil
		},
		:BNE => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0xD0,
			:None => nil
		},
		:BPL => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0x10,
			:None => nil
		},
		:BVC => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0x50,
			:None => nil
		},
		:BVS => 
		{
			:Immediate => nil,
			:Zeropage  => nil,
			:ZeropageX => nil,
			:ZeropageY => nil,
			:Absolute  => nil,
			:AbsoluteX => nil,
			:AbsoluteY => nil,
			:Indirect  => nil,
			:IndirectX => nil,
			:IndirectY => nil,
			:Relative => 0x70,
			:None => nil
		}
	};
	OPCODE_TABLE = [nil]*0x100;
	INST_TABLE.each(){ |func, addrs|
		addrs.each(){ |addr, b|
			next if b.nil?
			OPCODE_TABLE[b] = [func, addr];
		}
	}
	def self.eachInst(&clos)
		b = 0;
		OPCODE_TABLE.each(){|elm|
			if elm.nil?
				clos.call(b, nil, nil);
			else
				clos.call(b, elm[0], elm[1]);
			end
			b += 1;
		}
	end
	Flag = {
		:C=> 1,
		:Z=> 2,
		:I=> 4,
		:D=> 8,
		:B=> 16, # not used in NES
		:ALWAYS_SET=> 32,
		:V=> 64,
		:N=> 128
	};
	Cycle = [
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
end

