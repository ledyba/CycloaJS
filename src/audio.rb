# -*- encoding: utf-8 -*-
require 'erb'
require File.expand_path( File.dirname(__FILE__)+"/gen.rb" );

module Audio
		AUDIO_CLOCK = 21442080/12#21477272/12; #21.28MHz(NTSC)
		SAMPLE_RATE = 22050;
		FRAME_IRQ_RATE = 240;
	def self.RunInit()
		"var __audio__audioFairy = this.__audio__audioFairy; var __audio__enabled = __audio__audioFairy.enabled; var __audio__data=__audio__audioFairy.data; var __audio__data__length = __audio__audioFairy.dataLength;"
	end
end
