# -*- encoding: utf-8 -*-
require 'erb'
require File.expand_path( File.dirname(__FILE__)+"/gen.rb" );

module Audio
		AUDIO_CLOCK = 21477272/12; #21.28MHz(NTSC)
		SAMPLE_RATE = 22050;
		FRAME_IRQ_RATE = 240;
end
