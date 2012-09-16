%# -*- encoding: utf-8 -*-
%require File.expand_path File.dirname(__FILE__)+"/gen.rb";
%MachineName="cycloa.ScriptMachine";

/**
 * スクリプトでプログラムが書ける謎マシン
 * @constructor
 */
<%= MachineName %> = function(videoFairy, audioFairy, pad1Fairy, pad2Fairy) {
this.tracer = new cycloa.Tracer(this);
<%= render File.expand_path File.dirname(__FILE__)+"/vm_cpu_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_video_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_init.erb.js" %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/vm_audio_rectangle_init.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/vm_audio_rectangle_init.erb.js")), :isFirstChannel=>false %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_triangle_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_noize_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_digital_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_pad_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_mapper_init.erb.js" %>
this.__vm__reservedClockDelta = 0;
/** @type {boolean} */
this.NMI = false;
/** @type {boolean} */
this.IRQ = false;

this.__video__reservedClock = 0;
};

/**
 * VMを１フレーム分実行する
 */
<%= MachineName %>.prototype.run = function () {
	<%= CPU::RunInit() %>
	<%= Video::RunInit() %>
	<%= Audio::RunInit() %>
	var __vm__run = true;
	var __vm__clockDelta;
	var __vm__reservedClockDelta = this.__vm__reservedClockDelta;
	this.__vm__reservedClockDelta = 0;
	var __video__nowY = 0;
	var __video__reservedClock = this.__video__reservedClock;
	while(__vm__run) {
		__vm__clockDelta = __vm__reservedClockDelta; __vm__reservedClockDelta = 0;
		++__video__nowY;
		__video__reservedClock += 341;
		__vm__clockDelta += (__video__reservedClock / <%= Video::ClockFactor %>) | 0;
		__video__reservedClock %= <%= Video::ClockFactor %>;
		if(__video__nowY <= 240){
			/**
			 * @const
			 * @type {Uint8Array}
			 */
			this.__video__spriteEval();
			if(this.__video__backgroundVisibility || this.__video__spriteVisibility) {
				// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
				this.__video__vramAddrRegister = (this.__video__vramAddrRegister & 0x7BE0) | (this.__video__vramAddrReloadRegister & 0x041F);
				this.__video__buildBgLine();
				this.__video__buildSpriteLine();
				var __video__vramAddrRegister = this.__video__vramAddrRegister + (1 << 12);
				__video__vramAddrRegister += (__video__vramAddrRegister & 0x8000) >> 10;
				__video__vramAddrRegister &= 0x7fff;
				if((__video__vramAddrRegister & 0x03e0) === 0x3c0){
					__video__vramAddrRegister &= 0xFC1F;
					__video__vramAddrRegister ^= 0x800;
				}
				this.__video__vramAddrRegister = __video__vramAddrRegister;
			}
		}else if(__video__nowY === 241){
			//241: The PPU just idles during this scanline. Despite this, this scanline still occurs before the VBlank flag is set.
			this.__video__videoFairy.dispatchRendering(__video__screenBuffer8, this.__video__paletteMask);
			__vm__run = false;
			this.__video__nowOnVBnank = true;
			this.__video__spriteAddr = 0;//and typically contains 00h at the begin of the VBlank periods
		}else if(__video__nowY === 242){
			// NESDEV: These occur during VBlank. The VBlank flag of the PPU is pulled low during scanline 241, so the VBlank NMI occurs here.
			// EVERYNES: http://nocash.emubase.de/everynes.htm#ppudimensionstimings
			// とあるものの…BeNesの実装だともっと後に発生すると記述されてる。詳しくは以下。
			// なお、$2002のレジスタがHIGHになった後にVBLANKを起こさないと「ソロモンの鍵」にてゲームが始まらない。
			// (NMI割り込みがレジスタを読み込みフラグをリセットしてしまう上、NMI割り込みが非常に長く、クリアしなくてもすでにVBLANKが終わった後に返ってくる)
			//nowOnVBlankフラグの立ち上がり後、数クロックでNMIが発生。
			this.NMI = this.__video__executeNMIonVBlank; /* reserve NMI if emabled */
			this.onVBlank();
		}else if(__video__nowY <= 261){
			//nowVBlank.
		}else if(__video__nowY === 262){
			this.__video__nowOnVBnank = false;
			this.__video__sprite0Hit = false;
			this.__video__nowY = 0;
			if(!this.__video__isEven){
				this.__video__nowX++;
			}
			this.__video__isEven = !this.__video__isEven;
			// the reload value is automatically loaded into the Pointer at the end of the vblank period (vertical reload bits)
			// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			if(this.__video__backgroundVisibility || this.__video__spriteVisibility){
				this.__video__vramAddrRegister = (this.__video__vramAddrRegister & 0x041F) | (this.__video__vramAddrReloadRegister & 0x7BE0);
			}
		}else{
			throw new cycloa.err.CoreException("Invalid scanline: "+this.__video__nowY);
		}
	}

	<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_run.erb.js" %>
	this.__vm__reservedClockDelta += __vm__reservedClockDelta;
	this.__video__reservedClock = __video__reservedClock;
	return __vm__run;
};

/**
 * 関数実行時に
 * @function
 */
<%= MachineName %>.prototype.onHardReset = function () {
	this.NMI = false;
	this.IRQ = 0;
	this.onHardResetCPU();
	this.__video__onHardReset();
	this.__audio__onHardReset();
	this.__rectangle0__onHardReset();
	this.__rectangle1__onHardReset();
	this.__triangle__onHardReset();
	this.__noize__onHardReset();
	this.__digital__onHardReset();
};
<%= MachineName %>.prototype.onReset = function () {
	this.NMI = false;
	this.IRQ = 0;
	this.onResetCPU();
	this.__video__onReset();
	this.__audio__onReset();
	this.__rectangle0__onReset();
	this.__rectangle1__onReset();
	this.__triangle__onReset();
	this.__noize__onReset();
	this.__digital__onReset();
};
<%= MachineName %>.prototype.onVBlank = function(){
};
<%= MachineName %>.prototype.onIRQ = function(){
};
<%= MachineName %>.prototype.read = function(addr) { 
	var __val__;
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	<%= CPU::MemRead("addr", "__val__") %>;
	return __val__;
};

<%= MachineName %>.prototype.write = function(addr, val) {
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	<%= CPU::MemWrite("addr", "val") %>;
};

<%= render File.expand_path File.dirname(__FILE__)+"/vm_cpu_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_video_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_method.erb.js" %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/vm_audio_rectangle_method.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/vm_audio_rectangle_method.erb.js")), :isFirstChannel=>true %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_triangle_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_noize_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_digital_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_mapper_method.erb.js" %>

