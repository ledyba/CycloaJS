this.vramMirroring = new Array(4);
this.internalVram = new Array(4);
for(var i=0;i<4;++i){
	this.internalVram[i] = new Uint8Array(0x400);
}
