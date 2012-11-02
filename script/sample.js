var t = 0; //time
for(var i=0;i<240;++i){
    this.registerHandler(i, function(scanline, nes){
        var off = Math.sin((scanline+(t/100))/240.0)*32;
        off = (off+32)|0;
        nes.write(0x2005, off);
		nes.write(0x2005, 0);
	});
}
this.registerHandler('onReset', function(scanline, nes){
	var fillBuffer = function(){
		for(var x=0;x<240*4;++x){
			nes.write(0x2007, 0);
		}
	};
	var initPattern = function(){
		nes.write(0x2006, 0x20);
		nes.write(0x2006, 0x00);
		fillBuffer();
		nes.write(0x2006, 0x28);
		nes.write(0x2006, 0x00);
		fillBuffer();
		
	};
	var pasteString = function(str){
        for(var j=0;j<30; ++j){
        	nes.write(0x2006, 0x20);
    		nes.write(0x2006, 0x0a+j*32);
    		for(var i=0;i<str.length;++i){
    			nes.write(0x2007, str.charCodeAt(i)-32);
    		}
        }
	};
	console.log("onReset");
	nes.write(0x2000, 0x00);
	nes.write(0x2001, 0x00);
	nes.write(0x2006, 0x3f);
	nes.write(0x2006, 0x00);
	for(var i=0;i<8; ++i) {
		nes.write(0x2007, 0x0D);
		nes.write(0x2007, 0x30);
		nes.write(0x2007, 0x30);
		nes.write(0x2007, 0x30);
	}
	nes.loadAsciiChr();
	initPattern();
	pasteString("Hello world");
	nes.write(0x2005, 0x00);
	nes.write(0x2005, 0x00);
	nes.write(0x2006, 0x00);
	nes.write(0x2006, 0x00);
	nes.write(0x2000, 0x08);
	nes.write(0x2001, 0x08);
	nes.write(0x2000, 0x88);
});
this.registerHandler('IRQ', function(scanline, nes){
});
this.registerHandler('NMI', function(scanline, nes){
    t++;
});
