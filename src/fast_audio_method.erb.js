%# -*- encoding: utf-8 -*-

this.__audio__onHardReset = function() {
	this.__audio__clockCnt = 0;
	this.__audio__leftClock = 0;

	this.__audio__frameIRQenabled = true;
	<%= CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) %>

	this.__audio__isNTSCmode = true;
	this.__audio__frameIRQCnt = 0;
	this.__audio__frameCnt = 0;
};
this.__audio__onReset = function() {
};

this.readAudioReg = function(addr){
	if(addr === 0x4015){
	 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
		   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
		return
				( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
				|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
				|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
				|((this.__noize__lengthCounter != 0) ? 8 : 0)
				|((this.__digital__sampleLength != 0) ? 16 : 0)
				|((<%= CPU::IsIRQPending(CPU::IRQ::FRAMECNT) %>) ? 64 : 0)
				|(<%= CPU::IsIRQPending(CPU::IRQ::DMC) %> ? 128 : 0);
		<%= CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) %>
		<%= CPU::ReleaseIRQ(CPU::IRQ::DMC) %>
	}else if(addr === 0x4016){
		return (this.pad1Fairy.state >> ((this.pad1Idx++) & 7)) & 0x1;
	}else if(addr === 0x4017){
		return (this.pad2Fairy.state >> ((this.pad2Idx++) & 7)) & 0x1;
	}else if(addr < 0x4018){
		throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
	}else{
		return this.readMapperRegisterArea(addr);
	}
};

this.writeAudioReg = function(addr, val){
		switch(addr & 0x1f) {
		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */
			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;
			this.__rectangle0__decayEnabled = (val & 16) == 0;
			this.__rectangle0__loopEnabled = (val & 32) == 32;
			switch(val >> 6)
			{
			case 0:
				this.__rectangle0__dutyRatio = 2;
				break;
			case 1:
				this.__rectangle0__dutyRatio = 4;
				break;
			case 2:
				this.__rectangle0__dutyRatio = 8;
				break;
			case 3:
				this.__rectangle0__dutyRatio = 12;
				break;
			}
			break;
		}
		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */
			this.__rectangle0__sweepShiftAmount = val & 7;
			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;
			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;
			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;
			break;
		}
		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */
			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);
			break;
		}
		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */
			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);
			this.__rectangle0__lengthCounter = this.LengthCounterConst[val >> 3];
			/* Writing to the length registers restarts the length (obviously),
			and also restarts the duty cycle (channel 1,2 only), */
			this.__rectangle0__dutyCounter = 0;
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__rectangle0__decayReloaded = true;
			break;
		}
		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */
			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;
			this.__rectangle1__decayEnabled = (val & 16) == 0;
			this.__rectangle1__loopEnabled = (val & 32) == 32;
			switch(val >> 6)
			{
			case 0:
				this.__rectangle1__dutyRatio = 2;
				break;
			case 1:
				this.__rectangle1__dutyRatio = 4;
				break;
			case 2:
				this.__rectangle1__dutyRatio = 8;
				break;
			case 3:
				this.__rectangle1__dutyRatio = 12;
				break;
			}
			break;
		}
		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */
			this.__rectangle1__sweepShiftAmount = val & 7;
			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;
			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;
			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;
			break;
		}
		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */
			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);
			break;
		}
		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */
			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);
			this.__rectangle1__lengthCounter = this.LengthCounterConst[val >> 3];
			/* Writing to the length registers restarts the length (obviously),
			and also restarts the duty cycle (channel 1,2 only), */
			this.__rectangle1__dutyCounter = 0;
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__rectangle1__decayReloaded = true;
			break;
		}
		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */
			this.__triangle__enableLinearCounter = ((val & 128) == 128);
			this.__triangle__linearCounterBuffer = val & 127;
			break;
		}
		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */
			/* unused */
			break;
		}
		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */
			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;
			break;
		}
		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */
			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);
			this.__triangle__lengthCounter = this.LengthCounterConst[val >> 3];
			/* Side effects 	Sets the halt flag */
			this.__triangle__haltFlag = true;
			break;
		}
		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */
			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;
			this.__noize__decayEnabled = (val & 16) == 0;
			this.__noize__loopEnabled = (val & 32) == 32;
			break;
		}
		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */
			/* unused */
			break;
		}
		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */
			this.__noize__modeFlag = (val & 128) == 128;
			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];
			break;
		}
		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */
			/* Writing to the length registers restarts the length (obviously), */
			this.__noize__lengthCounter = this.LengthCounterConst[val >> 3];
			/* and restarts the decay volume (channel 1,2,4 only). */
			this.__noize__decayReloaded = true;
			break;
		}
		/* ------------------------------------ DMC ----------------------------------------------------- */
		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */
			this.__digital__irqEnabled = (val & 128) == 128;
			if(!this.__digital__irqEnabled){
				 <%= CPU::ReleaseIRQ(CPU::IRQ::DMC) %>
			}
			this.__digital__loopEnabled = (val & 64) == 64;
			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];
			break;
		}
		case 0x11: { /* 4011h - DMC Delta counter load register */
			this.__digital__deltaCounter = val & 0x7f;
			break;
		}
		case 0x12: { /* 4012h - DMC address load register */
			this.__digital__sampleAddr = 0xc000 | (val << 6);
			break;
		}
		case 0x13: { /* 4013h - DMC length register */
			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;
			break;
		}
		case 0x14: { /* 4014h execute Sprite DMA */
			/** @type {number} uint16_t */
			<%= CPU::UseMemory() %>
			var addrMask = val << 8;
			var spRam = this.spRam;
			var spriteAddr = this.spriteAddr;
			for(var i=0;i<256;++i){
				var __addr__ = addrMask | i;
				var __val__;
				<%= CPU::MemRead("__addr__", "__val__") %>
				spRam[(spriteAddr+i) & 0xff] = __val__;
			}
			clockDelta += 512;
			break;
		}
		/* ------------------------------ CTRL -------------------------------------------------- */
		case 0x15: { /* __audio__analyzeStatusRegister */
			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;
			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;
			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }
			if(!(val & 8)) this.__noize__lengthCounter = 0;
			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}
			break;
		}
		case 0x16: {
			if((val & 1) === 1){
				this.pad1Idx = 0;
				this.pad2Idx = 0;
			}
			break;
		}
		case 0x17: { /* __audio__analyzeLowFrequentryRegister */
			/* Any write to $4017 resets both the frame counter, and the clock divider. */
			if(val & 0x80) {
				this.__audio__isNTSCmode = false;
				this.__audio__frameCnt = <%= Audio::AUDIO_CLOCK-2*Audio::FRAME_IRQ_RATE %>;
				this.__audio__frameIRQCnt = 4;
			}else{
				this.__audio__isNTSCmode = true;
				this.__audio__frameIRQenabled = true;
				this.__audio__frameCnt =  <%= Audio::AUDIO_CLOCK-2*Audio::FRAME_IRQ_RATE %>;
				this.__audio__frameIRQCnt = 3;
			}
			if((val & 0x40) === 0x40){
				this.__audio__frameIRQenabled = false;
				<%= CPU::ReleaseIRQ(CPU::IRQ::FRAMECNT) %>
			}
			break;
		}
		default: {
			/* this.writeMapperRegisterArea(addr, val); */
			break;
		}
	}
};

