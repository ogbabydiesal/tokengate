// A fairly small and neat FFT - not the fastest, but not terrible
// Expects interleaved complex pairs (i.e. `[real0, imag0, real1, imag1, ...]`)
function FFT(size) {
	if (!(this instanceof FFT)) return new FFT(size);

	var twiddleRealCache = new Float64Array(size);
	var twiddleImagCache = new Float64Array(size);
	var stride = 1;
	while (stride < size) {
		for (var i = 0; i < stride; ++i) {
			var twiddleReal = Math.cos(Math.PI*i/stride);
			var twiddleImag = -Math.sin(Math.PI*i/stride);
			twiddleRealCache[stride + i] = twiddleReal;
			twiddleImagCache[stride + i] = twiddleImag;
		}
		stride *= 2;
	}

	function fftStep2(buffer, stride, direction) {
		var offset = 0;
		var doubleStride = stride*2;
		while (offset < size*2) {
			for (var i = 0; i < stride; ++i) {
				var indexA = offset + i*2, indexB = indexA + doubleStride;
				var realA = buffer[indexA], imagA = buffer[indexA + 1];
				var realB = buffer[indexB], imagB = buffer[indexB + 1];

				var diffReal = realA - realB;
				var diffImag = imagA - imagB;
				var twiddleReal = twiddleRealCache[stride + i];
				var twiddleImag = direction*twiddleImagCache[stride + i];

				buffer[indexA] = realA + realB;
				buffer[indexA + 1] = imagA + imagB;
				buffer[indexB] = diffReal*twiddleReal - diffImag*twiddleImag;
				buffer[indexB + 1] = diffReal*twiddleImag + diffImag*twiddleReal;
			}
			offset += doubleStride*2;
		}
	}
	function fft(buffer) {
		for (var s = size/2; s >= 1; s /= 2) {
			fftStep2(buffer, s, 1);
		}
	}
	function ifft(buffer) {
		for (var s = size/2; s >= 1; s /= 2) {
			fftStep2(buffer, s, -1);
		}
	}

	function bitSwap(x, N) {
		var result = 0;
		N >>= 1;
		while (N) {
			result = (result << 1) + (x&1);
			N >>= 1;
			x >>= 1;
		}
		return result;
	}
	var permutations = [];
	for (var i = 0; i < size; i++) {
		var i2 = bitSwap(i, size);
		if (i < i2) {
			permutations.push(i);
			permutations.push(i2);
		}
	}
	function fft_permute(buffer, offset, step, N) {
		for (var i = 0; i < permutations.length; i += 2) {
			var index1 = permutations[i], index2 = permutations[i + 1];

			var tmpReal = buffer[index1*2], tmpImag = buffer[index1*2 + 1];
			buffer[index1*2] = buffer[index2*2];
			buffer[index1*2 + 1] = buffer[index2*2 + 1];
			buffer[index2*2] = tmpReal;
			buffer[index2*2 + 1] = tmpImag;
		}
	}
	function getInPlace(input, output) {
		if (!output) return input;
		for (var i = 0; i < size*2; ++i) {
			output[i] = input[i];
		}
		return output;
	}
	this.fft = function(input, output) {
		var buffer = getInPlace(input, output);
		fft(buffer, 0, 2, size);
		fft_permute(buffer, 0, 2, size);
	};
	this.ifft = function(input, output) {
		var buffer = getInPlace(input, output);
		ifft(buffer, 0, 2, size);
		fft_permute(buffer, 0, 2, size);
	};
}
// Real-valued FFT
// Accepts real waveforms, and interleaved complex spectra (with Nyquist stuffed into bin 0)
function RFFT(size) {
	if (!(this instanceof RFFT)) return new RFFT(size);
	var hSize = size>>1, qSize = size>>2;
	var complexFft = new FFT(hSize);

	var complexBuffer = new Float64Array(size);
	var twiddles = new Float64Array(hSize + 2);
	for (var i = 0; i <= qSize; ++i) {
		var rotPhase = -2*Math.PI*i/size;
		twiddles[2*i] = Math.sin(rotPhase);
		twiddles[2*i + 1] = -Math.cos(rotPhase);
	}

	this.fft = function(input, output) {
		complexFft.fft(input, complexBuffer);
		output[0] = complexBuffer[0] + complexBuffer[1],
		output[1] = complexBuffer[0] - complexBuffer[1];
		for (var i = 1; i <= qSize; ++i) {
			var conjI = hSize - i;
			var oddR = (complexBuffer[2*i] + complexBuffer[2*conjI])*0.5;
			var oddI = (complexBuffer[2*i + 1] - complexBuffer[2*conjI + 1])*0.5;
			var iEvenR = (complexBuffer[2*i] - complexBuffer[2*conjI])*0.5;
			var iEvenI = (complexBuffer[2*i + 1] + complexBuffer[2*conjI + 1])*0.5;
			var twiddleR = twiddles[2*i], twiddleI = twiddles[2*i + 1];
			var rotR = iEvenR*twiddleR - iEvenI*twiddleI;
			var rotI = iEvenR*twiddleI + iEvenI*twiddleR;
			output[2*i] = oddR + rotR;
			output[2*i + 1] = oddI + rotI;
			output[2*conjI] = oddR - rotR;
			output[2*conjI + 1] = rotI - oddI;
		}
	};
	this.ifft = function(input, output) {
		complexBuffer[0] = input[0] + input[1],
		complexBuffer[1] = input[0] - input[1];
		for (var i = 1; i <= qSize; ++i) {
			var conjI = hSize - i;
			var oddR = input[2*i] + input[2*conjI];
			var oddI = input[2*i + 1] - input[2*conjI + 1];
			var iEvenR = input[2*i] - input[2*conjI];
			var iEvenI = input[2*i + 1] + input[2*conjI + 1];
			var twiddleR = twiddles[2*i], twiddleI = twiddles[2*i + 1];
			var rotR = iEvenR*twiddleR + iEvenI*twiddleI;
			var rotI = iEvenI*twiddleR - iEvenR*twiddleI;
			complexBuffer[2*i] = oddR + rotR;
			complexBuffer[2*i + 1] = oddI + rotI;
			complexBuffer[2*conjI] = oddR - rotR;
			complexBuffer[2*conjI + 1] = rotI - oddI;
		}
		complexFft.ifft(complexBuffer, output);
	};
}

function bufferFiller (block, bufferSize, inputCircBuffer, pointers) {
	//copy 1 block of audio into input-circular-buffer, at the input pointer, and make sure to wrap
	for (let i = 0; i < bufferSize; i++) {
		inputCircBuffer[(pointers[0] + i) % inputCircBuffer.length] = block[i];
	}
	//increment the pointer by 1 block size
	pointers[0] = (pointers[0] + bufferSize) % inputCircBuffer.length;
}

if (typeof module === 'object' && module) {
	module.exports = {
		FFT: FFT,
		RFFT: RFFT
	};
}


class SpectralSynth extends AudioWorkletProcessor {
	// Custom AudioParams can be defined with this static getter.
  static get parameterDescriptors() {
    return [{ name: 'gain', defaultValue: .3, minValue:0, maxValue:1}];
  }
	constructor() {
    super()
		//declare circular buffer
		this.inputCircBuffer = new Array(1024).fill(0);
		this.outputCircBuffer = new Array(1024).fill(0);
		this.pointers = [256,0, 0];

		//declare fft stuff
		this.fftSize = 128;
		this.fft = new RFFT(this.fftSize); // Complex FFT
		this.hopSize = this.fftSize / 2;
		this.hopCounter = 0;
		this.arrayFiller = new Array(256).fill(0);
		this.windowedChunk = new Array(this.fftSize).fill(0);
		//our spectral data from our NFT
		this.nftData = [-0.680157, -2.595802, -2.23181, 1.043628, 0.871478, 0.032085, 0.011783, -0.160232, -0.184497, -0.109513, -0.087528, -0.075393, 0.184206, 0.174413, 0.029763, -0.027556, -0.045465, -0.021071, 0.004307, 0.0381, 0.040553, 0.012664, 0.035117, -0.012051, -0.019118, 0.004216, 0.018444, 0.015699, 0.00379, -0.004722, -0.000858, -0.017687, -0.026178, 0.011752, 0.019912, 0.013626, 0.00343, -0.046204, -0.047157, -0.009494, 0.007517, 0.001061, 0.001682, -0.001973, 0.00136, -0.000763, -0.008926, 0.001992, 0.008029, -0.006005, -0.000749, 0.001227, 0.000536, -0.000417, 0.001444, 0.000586, -0.00084, 0.00056, 0.002605, 0.000054, 0.000127, 0.001656, 0.00143, -0.00008, -0.004751, -0.004541, 0.000775, 0.000517, 0.001907, 0.000662, 0.000421, -0.000034, 0.001203, -0.000295, -0.000875, -0.000185, 0.001125, 0.00154, 0.000368, -0.000635, 0.001205, 0.000953, 0.000298, -0.00007, 0.000814, 0.000101, -0.000163, 0.000154, 0.000806, -0.000091, 0.00047, 0.000528, 0.000385, 0.000568, -0.000065, -0.002443, -0.000881, 0.000015, 0.000921, 0.00154, 0.000318, -0.000622, 0.000688, -0.000106, -0.000524, -0.000082, 0.000407, -0.000157, -0.000026, 0.000186, 0.000851, -0.001358, -0.001375, -0.001035, -0.00129, -0.00054, -0.000292, -0.000539, 0.000184, -0.000136, 0.000128, -0.000125, 0.000123, -0.000122, 0.000121, -0.00012, 0.00012, -0.00012];

		for (let i = 0; i < this.fftSize; i ++) {
		  //this.nftData[i] = (((Math.random()) * 2) - 1) * .4;
		  //this.nftData[i] = parseFloat(this.nftData[i].toFixed(2));
		  //console.log(rPhase[i]);
		}

		//create random phase values (to provide some variation in the signal)
		this.rPhase = [this.fftSize];
		for (let i = 0; i < this.fftSize; i ++) {
		  this.rPhase[i] = (((Math.random()) * 2) - 1) * .4;
		  this.rPhase[i] = parseFloat(this.rPhase[i].toFixed(2));
		}

		//create an array to store spectral data, this array contains real and imag so is 2x fftSize
		this.spectrum = new Float64Array(this.fftSize);
		//push our magnitude and phase values into the array interleaved
		this.spectrum = this.nftData.reduce((x, y, z) => (x.splice(z * 2, 0, y), x), this.rPhase.slice());
		//fill the other half with zeros
		//this.spectrum = this.spectrum.concat(this.arrayFiller);
		//worklets' precious buffersize
		this.bufferSize = 128;
		this.fftResult = new  Float64Array(this.fftSize) ;
		//window function
		function hanning (i, N) {
			return 0.5*(1 - Math.cos(6.283185307179586*i/(N-1)))
		}
		//fills this.hann array with window
		this.hann = [this.fftSize];
		for (let y = 0; y < this.fftSize; y++) {
			this.hann[y] = hanning(y,this.fftSize);
		}
	}
	//this happens every block
  process(inputs, outputs, parameters) {
    // By default, the node has single input and output.
    const input = inputs[0];
    const output = outputs[0];
    const inputChannel = input[0];
    const outputChannel = output[0];
		let gain = parameters.gain[0];
		//INPUT
		//write a block of audio into an input-buffer
		for (let i = 0; i < this.bufferSize; i++) {
			this.inputCircBuffer[(this.pointers[0] + i) % this.inputCircBuffer.length] = inputChannel[i];
			//keep track of when a Hop Size elapses
			this.hopCounter++
			//Do Spectral Processing when a Hop Size elapses
			if (this.hopCounter == this.hopSize) {
				//reset our Hop Counter
				this.hopCounter = 0;
				//Window the last FFT Size of samples
				for (let y = 0; y < this.fftSize; y++) {
					this.windowedChunk[y] = this.inputCircBuffer[(((this.pointers[0] + i) + this.inputCircBuffer.length) - this.fftSize + y) % this.inputCircBuffer.length] * this.hann[y];
				}
				//compute the fft
				this.fft.fft(this.windowedChunk, this.fftResult);
				//do some spectral stuff here
				for (let z = 0; z < this.fftSize; z++) {
					this.fftResult[z] = (this.fftResult[z] / this.fftSize) * gain;
				}
				//we'll reuse the windowed chunk array to store the real samples from the inverse fft
				this.fft.ifft(this.fftResult, this.windowedChunk);
				//write (make sure we are ADDIING) our Real sample values into the output Circular Buffer
				for (let y = 0; y < this.fftSize; y++) {
					this.outputCircBuffer[(this.pointers[1] + y) % this.outputCircBuffer.length] = this.outputCircBuffer[(this.pointers[1] + y) % this.outputCircBuffer.length] + this.windowedChunk[y];
				}
				//increment our output circular buffer write pointer 1 hop Size
				this.pointers[1] =  (this.pointers[1] + this.hopSize) % this.outputCircBuffer.length;
			}
		}
		//increment the input circular buffer pointer by 1 block size
		this.pointers[0] = (this.pointers[0] + this.bufferSize) % this.inputCircBuffer.length;
		//OUTPUT TO SOUNDCARD ;)
		//write samples to output buffer from the past
		for (let x = 0; x < this.bufferSize; x++) {
			outputChannel[x] = this.outputCircBuffer[(this.pointers[2] + x) % this.outputCircBuffer.length]
			this.outputCircBuffer[(this.pointers[2] + x) % this.outputCircBuffer.length] = 0;
		}
		this.pointers[2] = (this.pointers[2] + this.bufferSize) % this.outputCircBuffer.length;
    return true;
  }
}

registerProcessor('spectralsynth', SpectralSynth);
