# -*- encoding: utf-8 -*-
require 'erb'
require File.expand_path( File.dirname(__FILE__)+"/gen.rb" );

module Video
	ScreenWidth = 256;
	ScreenWidthShift = 8;
	ScreenHeight = 240;
	EmptyBit = 0x00;
	BackSpriteBit = 0x40;
	BackgroundBit = 0x80;
	FrontSpriteBit = 0xc0;
	SpriteLayerBit = 0x40;
	LayerBitMask = 0xc0;
	ClockPerScanline = 341;
	ScanlinePerScreen = 262;
	DefaultSpriteCnt = 8;
	
	PaletteSize = 9*4;
	VramSize = 0x800;
	SpRamSize = 0x100;
	def self.Init()
		""
	end
	def self.UseVideoAccess()
		"var palette = this.palette; var vramMirroring = this.vramMirroring; var pattern = this.pattern; var screenBuffer8 = this.screenBuffer8;"
	end
	def self.Palette(i,j)
		"palette[#{i<<2+j}]";
	end
	def self.ReadVramExternal(addr)
		"(#{addr} < 0x2000 ? pattern[(#{addr} >> 9) & 0xf][#{addr} & 0x1ff] : vramMirroring[(#{addr} >> 10) & 0x3][#{addr} & 0x3ff])"
	end
	def self.ReadPalette(addr)
		"((#{addr} & 0x3 == 0) ? palette[32 | ((addr >> 2) & 3)] : palette[#{addr} & 31])"
	end
	def self.ReadVram(addr, with_this = false)
		"(((#{addr} & 0x3f00) !== 0x3f00) ? #{ReadVramExternal(addr)} : #{ReadPalette(addr)} )"
	end
end


