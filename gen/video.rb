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
	def self.Palette(i,j)
		"palette[#{i*4+j}]";
	end
	def self.FillLineBuffer(line, offset, color)
=begin
		block_cnt = 2;
		block_size = ScreenWidth/block_cnt;
		init = "var _f_offset = (#{offset}); var _f_subarray_ = #{line}.subarray(_f_offset, _f_offset + #{block_size});for(var _f_ = 0;_f_ < #{block_size}; ++_f_) _f_subarray_[_f_] = #{color};"
		(1..block_cnt-1).each{|t|
			init += "#{line}.set(_f_subarray_, #{t*block_size});"
		}
		return init
=end
		"var _f_offset = (#{offset}); for(var _f_; _f_ < #{ScreenWidth}; ++_f_) #{line}[_f_offset + _f_] = #{color};"
	end
end


