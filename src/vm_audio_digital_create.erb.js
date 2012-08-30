%# -*- encoding: utf-8 -*-
if(this.__digital__sampleLength != 0){
	/*unsigned int*/ var __digital__nowCounter = this.__digital__freqCounter + __audio__delta;
	/*const uint16_t*/var __digital__divFreq = this.__digital__frequency + 1;
	while(__digital__nowCounter >= __digital__divFreq){
		__digital__nowCounter -= divFreq;
			if(this.__digital__sampleBufferLeft == 0){
				this.__digital__sampleLength--;
				var __val__;
				var __digital__addr = this.__digital__sampleAddr;
				<%= CPU::MemRead("__digital__addr", "__digitl__val__") %>
				this.__digital__sampleBuffer = __digitl__val__;

				if(this.__digital__sampleAddr >= 0xffff){
					this.__digital__sampleAddr = 0x8000;
				}else{
					this.__digital__sampleAddr++;
				}
				this.__digital__sampleBufferLeft = 7;
				<%= CPU::ConsumeReservedClock(4) %>
				if(this.__digital__sampleLength == 0){
					if(this.__digital__loopEnabled){
						this.__digital__sampleLength = this.__digital__sampleLengthBuffer;
					}else if(this.__digital__irqEnabled){
						<%= CPU::ReserveIRQ(CPU::IRQ::DMC) %>
					}else{
						break;
					}
				}
			}
			this.__digital__sampleBuffer = this.__digital__sampleBuffer >> 1;
			if((this.__digital__sampleBuffer & 1) == 1){
				if(this.__digital__deltaCounter < 126){
					this.__digital__deltaCounter+=2;
				}
			}else{
				if(this.__digital__deltaCounter > 1){
					this.__digital__deltaCounter-=2;
				}
			}
			this.__digital__sampleBufferLeft--;
	}
	this.__digital__freqCounter = __digitl__nowCounter;
	__audio__sound += this.__digital__deltaCounter;
}

