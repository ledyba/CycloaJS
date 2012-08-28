%# -*- encoding: utf-8 -*-
%require File.expand_path File.dirname(__FILE__)+"/gen.rb";

/**
 * @constructor
 */
cycloa.VirtualMachine = function(videoFairy, audioFairy, pad1Fairy, pad2Fairy) {
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

	this.reservedClockDelta = 0;


};


cycloa.VirtualMachine.prototype.run = function () {
	<%= CPU::RunInit() %>
	<%= Video::RunInit() %>
	<%= Audio::RunInit() %>
	var _run = true;
	var reservedClockDelta = this.reservedClockDelta;
	while(_run) {
		//console.log(this.tracer.decode());
		<%= render File.expand_path File.dirname(__FILE__)+"/vm_cpu_run.erb.js" %>
		<%= render File.expand_path File.dirname(__FILE__)+"/vm_video_run.erb.js" %>
		<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_run.erb.js" %>
	}
	this.reservedClockDelta = reservedClockDelta;
	return _run;
};
/**
 * @function
 */
cycloa.VirtualMachine.prototype.onHardReset = function () {
	this.onHardResetCPU();
	this.onHardResetVideo();
	this.__audio__onHardReset();
	this.__rectangle0__onHardReset();
	this.__rectangle1__onHardReset();
	this.__triangle__onHardReset();
	this.__noize__onHardReset();
	this.__digital__onHardReset();
};
cycloa.VirtualMachine.prototype.onReset = function () {
	this.onResetCPU();
	this.onResetVideo();
	this.__audio__onReset();
	this.__rectangle0__onReset();
	this.__rectangle1__onReset();
	this.__triangle__onReset();
	this.__noize__onReset();
	this.__digital__onReset();
};
cycloa.VirtualMachine.prototype.onVBlank = function(){
};
cycloa.VirtualMachine.prototype.onIRQ = function(){
};
cycloa.VirtualMachine.prototype.read = function(addr) { 
	var __val__;
	var rom = this.rom; var ram = this.ram;
	<%= CPU::MemRead("addr", "__val__") %>;
	return __val__;
};

cycloa.VirtualMachine.prototype.load = function(rom){
	this.loadROM(rom);
	// マッパー関数のインジェクション
	cycloa.VirtualMachine.Mapper[this.mapperNo](this);
	this.changeMirrorType(this.mirrorType);
};

cycloa.VirtualMachine.prototype.loadROM = function(data){
	var data8 = new Uint8Array(data);
	/* check NES data8 */
	if(!(data8[0] === 0x4e && data8[1]===0x45 && data8[2]===0x53 && data8[3] == 0x1a)){
		throw new cycloa.err.CoreException("[FIXME] Invalid header!!");
	}
	this.prgSize = <%= NES::PRG_ROM_PAGE_SIZE %> * data8[4];
	this.chrSize = <%= NES::CHR_ROM_PAGE_SIZE %> * data8[5];
	this.prgPageCnt = data8[4];
	this.chrPageCnt = data8[5];
	this.mapperNo = ((data8[6] & 0xf0)>>4) | (data8[7] & 0xf0);
	this.trainerFlag = (data8[6] & 0x4) === 0x4;
	this.sramFlag = (data8[6] & 0x2) === 0x2;
	if((data8[6] & 0x8) == 0x8){
		this.mirrorType = <%= NES::FOUR_SCREEN %>;
	}else{
		this.mirrorType = (data8[6] & 0x1) == 0x1 ? <%= NES::VERTICAL %> : <%= NES::HORIZONTAL %>;
	}
	/**
	 * @type {number} uint32_t
	 */
	var fptr = 0x10;
	if(this.trainerFlag){
		if(fptr + <%= NES::TRAINER_SIZE %> > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
		this.trainer = new Uint8Array(data, fptr, <%= NES::TRAINER_SIZE %>);
		fptr += <%= NES::TRAINER_SIZE %>;
	}
	/* read PRG ROM */
	if(fptr + this.prgSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	this.prgRom = new Uint8Array(data, fptr, this.prgSize);
	fptr += this.prgSize;

	if(fptr + this.chrSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	else if(fptr + this.chrSize < data.byteLength) throw cycloa.err.CoreException("[FIXME] Invalid file size; too long!");

	this.chrRom = new Uint8Array(data, fptr, this.chrSize);
};


cycloa.VirtualMachine.prototype.changeMirrorType = function(/* NesFile::MirrorType */ mirrorType) {
	this.mirrorType = mirrorType;
	switch(mirrorType)
	{
	case <%= NES::SINGLE0 %>: {
		this.vramMirroring[0] = this.internalVram[0];
		this.vramMirroring[1] = this.internalVram[0];
		this.vramMirroring[2] = this.internalVram[0];
		this.vramMirroring[3] = this.internalVram[0];
		break;
	}
	case <%= NES::SINGLE1 %>: {
		this.vramMirroring[0] = this.internalVram[1];
		this.vramMirroring[1] = this.internalVram[1];
		this.vramMirroring[2] = this.internalVram[1];
		this.vramMirroring[3] = this.internalVram[1];
		break;
	}
	case <%= NES::FOUR_SCREEN %>: {
		this.vramMirroring[0] = this.internalVram[1];
		this.vramMirroring[1] = this.internalVram[2];
		this.vramMirroring[2] = this.internalVram[3];
		this.vramMirroring[3] = this.internalVram[4];
		break;
	}
	case <%= NES::HORIZONTAL %>: {
		this.vramMirroring[0] = this.internalVram[0];
		this.vramMirroring[1] = this.internalVram[0];
		this.vramMirroring[2] = this.internalVram[1];
		this.vramMirroring[3] = this.internalVram[1];
		break;
	}
	case <%= NES::VERTICAL%>: {
		this.vramMirroring[0] = this.internalVram[0];
		this.vramMirroring[1] = this.internalVram[1];
		this.vramMirroring[2] = this.internalVram[0];
		this.vramMirroring[3] = this.internalVram[1];
		break;
	}
	default: {
		throw new cycloa.err.CoreException("Invalid mirroring type!");
	}
	}
};

<%= render File.expand_path File.dirname(__FILE__)+"/vm_cpu_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_video_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_method.erb.js" %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/vm_audio_rectangle_method.erb.js")), :isFirstChannel=>false %>
<%= render (File.expand_path (File.dirname(__FILE__)+"/vm_audio_rectangle_method.erb.js")), :isFirstChannel=>true %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_triangle_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_noize_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_audio_digital_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_ioport_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/vm_mapper_method.erb.js" %>

