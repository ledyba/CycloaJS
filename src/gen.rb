# -*- encoding: utf-8 -*-
require 'erb'
require File.expand_path( File.dirname(__FILE__)+"/nes.rb" );
require File.expand_path( File.dirname(__FILE__)+"/cpu.rb" );
require File.expand_path( File.dirname(__FILE__)+"/video.rb" );
require File.expand_path( File.dirname(__FILE__)+"/audio.rb" );
require File.expand_path( File.dirname(__FILE__)+"/pad.rb" );

def render(fname, args = {})
	b = binding
	str = ERB.new(File.read(fname, :encoding => Encoding::UTF_8), nil, "%>",  "_#{rand(0xffffffff).to_s(16)}_").result(b)
	str
end



