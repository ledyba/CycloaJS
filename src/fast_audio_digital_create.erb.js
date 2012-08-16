%# -*- encoding: utf-8 -*-
if(this.__digital__sampleLength != 0){
	/*unsigned int*/ var nowCounter = this.__digital__freqCounter + delta;
	/*const uint16_t*/var divFreq = this.__digital__frequency + 1;
	while(nowCounter >= divFreq){
		nowCounter -= divFreq;
			if(this.__digital__sampleBufferLeft == 0){
				this.__digital__sampleLength--;
				var __val__;
				var addr = this.__digital__sampleAddr;
				<%= CPU::MemRead("addr", "__val__") %>
				this.__digital__sampleBuffer = __val__;

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
	this.__digital__freqCounter = nowCounter;
	sound += this.__digital__deltaCounter;
}

