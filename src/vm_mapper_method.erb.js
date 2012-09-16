/**
 * マッパーごとの初期化関数
 */
<%= MachineName %>.Mapper = [];
<%= MachineName %>.Mapper[0] = function(self){
	self.__mapper__writeMapperCPU = function(/* uint8_t */ addr){
		/*do nothing!*/
	};
	var idx = 0;
	for(var i=0; i<32; ++i){
		self.__cpu__rom[i] = self.__mapper__prgRom.subarray(idx, idx+=<%= NES::PRG_ROM_BLOCK_SIZE %>);
		if(idx >= self.__mapper__prgRom.length){
			idx = 0;
		}
	}
	var cidx = 0;
	for(var i=0;i<0x10; ++i){
		self.__video__pattern[i] = self.__mapper__chrRom.subarray(cidx, cidx += <%= NES::CHR_ROM_BLOCK_SIZE %>);
	}
};

/**
 * __cpu__romを解析してマッパーの初期化などを行う
 * @param {ArrayBuffer} __cpu__rom
 */
<%= MachineName %>.prototype.load = function(rom){
	this.__mapper__parseROM(rom);
	// マッパー関数のインジェクション
	var mapperInit = <%= MachineName %>.Mapper[this.__mapper__mapperNo];
	if(!mapperInit){
		throw new cycloa.err.NotSupportedException("Not supported mapper: "+this.__mapper__mapperNo);
	}
	mapperInit(this);
	this.__video__changeMirrorType(this.__mapper__mirrorType);
};

/**
 * __cpu__romをパースしてセットする
 * @param {ArrayBuffer} data
 */
<%= MachineName %>.prototype.__mapper__parseROM = function(data){
	var data8 = new Uint8Array(data);
	/* check NES data8 */
	if(!(data8[0] === 0x4e && data8[1]===0x45 && data8[2]===0x53 && data8[3] == 0x1a)){
		throw new cycloa.err.CoreException("[FIXME] Invalid header!!");
	}
	this.__mapper__prgSize = <%= NES::PRG_ROM_PAGE_SIZE %> * data8[4];
	this.__mapper__chrSize = <%= NES::CHR_ROM_PAGE_SIZE %> * data8[5];
	this.__mapper__prgPageCnt = data8[4];
	this.__mapper__chrPageCnt = data8[5];
	this.__mapper__mapperNo = ((data8[6] & 0xf0)>>4) | (data8[7] & 0xf0);
	this.__mapper__trainerFlag = (data8[6] & 0x4) === 0x4;
	this.__mapper__sramFlag = (data8[6] & 0x2) === 0x2;
	if((data8[6] & 0x8) == 0x8){
		this.__mapper__mirrorType = <%= NES::FOUR_SCREEN %>;
	}else{
		this.__mapper__mirrorType = (data8[6] & 0x1) == 0x1 ? <%= NES::VERTICAL %> : <%= NES::HORIZONTAL %>;
	}
	/**
	 * @type {number} uint32_t
	 */
	var fptr = 0x10;
	if(this.__mapper__trainerFlag){
		if(fptr + <%= NES::TRAINER_SIZE %> > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
		this.__mapper__trainer = new Uint8Array(data, fptr, <%= NES::TRAINER_SIZE %>);
		fptr += <%= NES::TRAINER_SIZE %>;
	}
	/* read PRG __cpu__rom */
	if(fptr + this.__mapper__prgSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	this.__mapper__prgRom = new Uint8Array(data, fptr, this.__mapper__prgSize);
	fptr += this.__mapper__prgSize;

	if(fptr + this.__mapper__chrSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	else if(fptr + this.__mapper__chrSize < data.byteLength) throw cycloa.err.CoreException("[FIXME] Invalid file size; too long!");

	this.__mapper__chrRom = new Uint8Array(data, fptr, this.__mapper__chrSize);
};

