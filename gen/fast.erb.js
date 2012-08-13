%# -*- encoding: utf-8 -*-
%require File.expand_path File.dirname(__FILE__)+"/gen.rb";

/**
 * @constructor
 */
cycloa.FastMachine = function(rom, videoFairy) {
	this.videoFairy = videoFairy;
<%= render File.expand_path File.dirname(__FILE__)+"/fast_cpu_init.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/fast_video_init.erb.js" %>

	this.run = function () {
<%= render File.expand_path File.dirname(__FILE__)+"/fast_cpu_run.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/fast_video_run.erb.js" %>
return clockDelta;
	};


<%= render File.expand_path File.dirname(__FILE__)+"/fast_cpu_method.erb.js" %>
<%= render File.expand_path File.dirname(__FILE__)+"/fast_video_method.erb.js" %>
	
	/**
	 * @function
	 */
	this.onHardReset = function () {
		this.onHardResetCPU();
		this.onHardResetVideo();
	};
	this.onReset = function () {
		this.onResetCPU();
		this.onResetVideo();
	};
	this.onVBlank = function(){
	};
	
	cycloa.FastMachine.Mappter.init(this, rom);
};

cycloa.FastMachine.Mappter = [
	/* mapper 0 */
	function(self){
		self.writeMapperCPU = function(/* uint8_t */ addr){
			/*do nothing!*/
		};
		var idx = 0;
		for(var i=0; i<32; ++i){
			self.rom[i] = self.prgRom.subarray(idx, idx+=<%= NES::PRG_ROM_BLOCK_SIZE %>);
			if(idx >= self.prgRom.length){
				idx = 0;
			}
		}
		var cidx = 0;
		for(var i=0;i<0x10; ++i){
			self.pattern[i] = self.chrRom.subarray(cidx, cidx += <%= NES::CHR_ROM_BLOCK_SIZE %>);
		}
	}
];

cycloa.FastMachine.Mappter.init = function(self, data) {
	// カートリッジの解釈
	cycloa.FastMachine.Mappter.load(self, data);
	// デフォルト関数のインジェクション
	cycloa.FastMachine.Mappter.initDefault(self);
	// マッパー関数のインジェクション
	cycloa.FastMachine.Mappter[self.mapperNo](self);
	
	self.changeMirrorType(self.mirrorType);
};

cycloa.FastMachine.Mappter.initDefault = function(self){
	self.vramMirroring = new Array(4);
	self.internalVram = new Array(4);
	for(var i=0;i<4;++i){
		self.internalVram[i] = new Uint8Array(0x400);
	}
	self.changeMirrorType = function(/* NesFile::MirrorType */ mirrorType) {
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
			this.vramMirroring[0] = this.fourScreenVram[1];
			this.vramMirroring[1] = this.fourScreenVram[2];
			this.vramMirroring[2] = this.fourScreenVram[3];
			this.vramMirroring[3] = this.fourScreenVram[4];
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
};

cycloa.FastMachine.Mappter.load = function(self, data){
	var data8 = new Uint8Array(data);
	/* check NES data8 */
	if(!(data8[0] === 0x4e && data8[1]===0x45 && data8[2]===0x53 && data8[3] == 0x1a)){
		throw new cycloa.err.CoreException("[FIXME] Invalid header!!");
	}
	self.prgSize = <%= NES::PRG_ROM_PAGE_SIZE %> * data8[4];
	self.chrSize = <%= NES::CHR_ROM_PAGE_SIZE %> * data8[5];
	self.prgPageCnt = data8[4];
	self.chrPageCnt = data8[5];
	self.mapperNo = ((data8[6] & 0xf0)>>4) | (data8[7] & 0xf0);
	self.trainerFlag = (data8[6] & 0x4) === 0x4;
	self.sramFlag = (data8[6] & 0x2) === 0x2;
	if((data8[6] & 0x8) == 0x8){
		self.mirrorType = <%= NES::FOUR_SCREEN %>;
	}else{
		self.mirrorType = (data8[6] & 0x1) == 0x1 ? <%= NES::VERTICAL %> : <%= NES::HORIZONTAL %>;
	}
	/**
	 * @type {number} uint32_t
	 */
	var fptr = 0x10;
	if(self.trainerFlag){
		if(fptr + <%= NES::TRAINER_SIZE %> > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
		self.trainer = new Uint8Array(data, fptr, <%= NES::TRAINER_SIZE %>);
		fptr += <%= NES::TRAINER_SIZE %>;
	}
	/* read PRG ROM */
	if(fptr + self.prgSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	self.prgRom = new Uint8Array(data, fptr, self.prgSize);
	fptr += self.prgSize;

	if(fptr + self.chrSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	//else if(fptr + self.chrSize < data.byteLength) throw cycloa.err.CoreException("[FIXME] Invalid file size; too long!");

	self.chrRom = new Uint8Array(data, fptr, self.chrSize);
};

cycloa.FastMachine.ZNFlagCache = new Uint8Array([
	0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80
]);

cycloa.FastMachine.TransTable = new Uint32Array(<%= CPU::Middle::TransTable %>);

	
