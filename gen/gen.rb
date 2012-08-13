# -*- encoding: utf-8 -*-
require 'erb'
require File.expand_path( File.dirname(__FILE__)+"/cpu.rb" );
require File.expand_path( File.dirname(__FILE__)+"/video.rb" );

def render(fname)
	str = ERB.new(File.read(fname, :encoding => Encoding::UTF_8), nil, "%>",  "_#{rand(0xffffffff).to_s(16)}_").result
	str
end



