%# -*- encoding: utf-8 -*-
this.__audio__frameCnt += (clockDelta * <%= Audio::FRAME_IRQ_RATE %>);
while(this.__audio__frameCnt >= <%= Audio::AUDIO_CLOCK %>){
	this.__audio__frameCnt -= <%= Audio::AUDIO_CLOCK %>;
	if(this.__audio__isNTSCmode){
		this.__audio__frameIRQCnt ++;
		switch(this.__audio__frameIRQCnt){
		case 1:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			break;
		case 2:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runh.erb.js")), :isFirstChannel=>true %>
			break;
		case 3:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			break;
		case 4:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runh.erb.js")), :isFirstChannel=>true %>
			if(this.__audio__frameIRQenabled){
				<%= CPU::ReserveIRQ(CPU::IRQ::FRAMECNT) %>
			}
			this.__audio__frameIRQCnt = 0;
			break;
		default:
			throw new cycloa.err.CoreException("FIXME Audio::run interrupt NTSC");
		}
	}else{
		this.__audio__frameIRQCnt ++;
		switch(this.__audio__frameIRQCnt){
		case 1:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			break;
		case 2:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runh.erb.js")), :isFirstChannel=>true %>
			break;
		case 3:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			break;
		case 4:
			break;
		case 5:
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runq.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runq.erb.js")), :isFirstChannel=>true %>
			//
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_runh.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_runh.erb.js")), :isFirstChannel=>true %>
			this.__audio__frameIRQCnt = 0;
			break;
		default:
			throw new cycloa.err.CoreException("FIXME Audio::run interrupt PAL");
		}
	}
}
this.__audio__clockCnt += (clockDelta * <%= Audio::SAMPLE_RATE %>);
while(this.__audio__clockCnt >= <%= Audio::AUDIO_CLOCK %>){
	/*unsigned int*/var processClock = <%= Audio::AUDIO_CLOCK %> + this.__audio__leftClock;
	/*unsigned int*/var delta = (processClock / <%= Audio::SAMPLE_RATE %>) | 0;
	this.__audio__leftClock = processClock % <%= Audio::SAMPLE_RATE %>;
	this.__audio__clockCnt-= <%= Audio::AUDIO_CLOCK %>;
	/*int16_t*/ var sound = 0;
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_create.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_rectangle_create.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_triangle_create.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_noize_create.erb.js")), :isFirstChannel=>true %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/gen/fast_audio_digital_create.erb.js")), :isFirstChannel=>true %>
	if(__audio__enabled){
		__audio__data[audioFairy.dataIndex++] = sound / 100;
		if(audioFairy.dataIndex >= __audio__data__length){
			audioFairy.onDataFilled();
			__audio__data = audioFairy.data;
		}
	}
}

