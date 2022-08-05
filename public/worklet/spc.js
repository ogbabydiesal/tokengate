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
if (typeof module === 'object' && module) {
	module.exports = {
		FFT: FFT,
		RFFT: RFFT
	};
}

class SpectralFilter extends AudioWorkletProcessor {
  // When constructor() undefined, the default constructor will be
  // implicitly used.
  //let FFT = ssfft.FFT, RFFT = ssfft.RFFT;
	constructor() {
        // The super constructor call is required.
        super()
				//declare circular buffer
				this.inputCircBuffer = new Array(1024).fill(0);
				this.outputCircBuffer = new Array(1024).fill(0);
				this.pointers = [0,128];

				//declare fft stuff
				this.fftSize = 256;
				this.fft = new FFT(this.fftSize); // Complex FFT
				this.hopSize = this.fftSize / 2;
				this.hopCounter = 0;

				//this.arrayFiller = new Array(256).fill(0);

				//our spectral data from our NFT
				this.nftData = [0.255795, 2.180136, 3.209771, 2.731534, 1.820246, 1.495044, 3.272544, 2.310845, 5.144471, 2.91, 0.919624, 0.34142, 0.679509, 0.381155, 0.636831, 1.160013, 0.094173, 0.193721, 0.150465, 0.12147, 0.099303, 0.09309, 0.098961, 0.066721, 0.028414, 0.059244, 0.033274, 0.024482, 0.041223, 0.025929, 0.019325, 0.05797, 0.099241, 0.126397, 0.080319, 0.07242, 0.046754, 0.020103, 0.04397, 0.021902, 0.022018, 0.013881, 0.007026, 0.000497, 0.003684, 0.006626, 0.012554, 0.007694, 0.006612, 0.014619, 0.008457, 0.003559, 0.007018, 0.00406, 0.00762, 0.019043, 0.030558, 0.021751, 0.041281, 0.033161, 0.018786, 0.009123, 0.014886, 0.010089, 0.002634, 0.016033, 0.015593, 0.019621, 0.011461, 0.030579, 0.017091, 0.017846, 0.031331, 0.02156, 0.011481, 0.017571, 0.015572, 0.032011, 0.02798, 0.024011, 0.00675, 0.003581, 0.010511, 0.007497, 0.004385, 0.002594, 0.0028, 0.000956, 0.002014, 0.002165, 0.001523, 0.001887, 0.00179, 0.001908, 0.002222, 0.003154, 0.000279, 0.001348, 0.00312, 0.002663, 0.001165, 0.000662, 0.001085, 0.000368, 0.000632, 0.000674, 0.000168, 0.000505, 0.000188, 0.000244, 0.000747, 0.000747, 0.000208, 0.000918, 0.000907, 0.000504, 0.000223, 0.001154, 0.000298, 0.000362, 0.000793, 0.000194, 0.000145, 0.00024, 0.001135, 0.00091, 0.000892, 0.00055, 0.000101, 0.000349, 0.000395, 0.000585, 0.00098, 0.001045, 0.000869, 0.00015, 0.000951, 0.000662, 0.000631, 0.000604, 0.000709, 0.000598, 0.000639, 0.00044, 0.000288, 0.000666, 0.00051, 0.000763, 0.000776, 0.000945, 0.000946, 0.000732, 0.000788, 0.001809, 0.001703, 0.000402, 0.001103, 0.000869, 0.00093, 0.000495, 0.000223, 0.000933, 0.000788, 0.000873, 0.00055, 0.000232, 0.000492, 0.00036, 0.000139, 0.000524, 0.000137, 0.000379, 0.000324, 0.000394, 0.000778, 0.000363, 0.000532, 0.000457, 0.001099, 0.000502, 0.000299, 0.000376, 0.000364, 0.000449, 0.000818, 0.000292, 0.000711, 0.000157, 0.000971, 0.001605, 0.001201, 0.000134, 0.000377, 0.000835, 0.000477, 0.000548, 0.000753, 0.000416, 0.000659, 0.000564, 0.000275, 0.000143, 0.000058, 0.0006, 0.000223, 0.000082, 0.000117, 0.00047, 0.000364, 0.000407, 0.000347, 0.000363, 0.000337, 0.000275, 0.000178, 0.000329, 0.000248, 0.000212, 0.000138, 0.000322, 0.000306, 0.000242, 0.000213, 0.000925, 0.00076, 0.000455, 0.000911, 0.000256, 0.000321, 0.000378, 0.000436, 0.000245, 0.000477, 0.000164, 0.000123, 0.000095, 0.0001, 0.000098, 0.000099, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000098, 0.000097, 0.000097, 0.000097];

				//create random phase values
				this.rPhase = [this.fftSize];
				for (let i = 0; i < this.fftSize; i ++) {
				  this.rPhase[i] = (((Math.random()) * 2) - 1) * .1;
				  this.rPhase[i] = this.rPhase[i].toFixed(2);
				  //console.log(rPhase[i]);
				}
				//create an array to store spectral data
				this.spectrum = new Float64Array(this.fftSize * 2);
				//push our magnitude and phase values into the array interleaved
				this.spectrum = this.nftData.reduce((x, y, z) => (x.splice(z * 2, 0, y), x), this.rPhase.slice());
				//fill the other half with zeros
				this.spectrum = this.spectrum.concat(this.arrayFiller);
				//worklets' precious buffersize
				this.buffersize = 128;
				this.fftResult = new  Float64Array(this.fftSize * 2);
    }

  process(inputs, outputs) {
    // By default, the node has single input and output.
    const input = inputs[0];
    const output = outputs[0];

    //for (let channel = 0; channel < output.length; ++channel) {
    const inputChannel = input[0];
    const outputChannel = output[0];

		//const outputChannel2 = output[1];

    for (let i = 0; i < inputChannel.length; ++i) {
				//write a sample into the input circular buffer-- we actually only need to do this if we were taking an fft first
			//this.inputCircBuffer[this.pointers[0]] = inputChannel[i];
				//increment the write pointer but wraparound
			//this.pointers[0] = (this.pointers[0] + 1) % this.inputCircBuffer.length;
			//increment the hopcounter until we get a hopSize amount of samples
			this.hopCounter++;
			if (this.hopCounter === this.hopSize) {
				this.hopCounter = 0;
				//do fft stuff
				this.fft.ifft(this.spectrum, this.fftResult);
				//add real values (every other in this interleaved list) to the outputCircBuffer
				for (let n = 0; n < this.fftResult.length; n+=2) {
					//and don't forget to scale by fftSize! //we also need to add a window here too but that shall wait a night
					this.outputCircBuffer[this.pointers[1]] = this.outputCircBuffer[this.pointers[1]] + this.fftResult[n] / 256;
					this.pointers[1] = (this.pointers[1] + 1) % this.outputCircBuffer.length;
				}
				//increment our outputCircBuffer pointer by one hop hopSize
				this.pointers[1] = (this.pointers[1] + this.hopSize) % this.outputCircBuffer.length;
			}
			//console.log(this.pointers[0]);
			//outputChannel[i] = inputChannel[i] * .1;
			outputChannel[i] = this.outputCircBuffer[this.pointers[0]];
			this.outputCircBuffer[this.pointers[0]] = 0;
			this.pointers[0] = (this.pointers[0] + 1) % this.outputCircBuffer.length;
    }
    return true;
  }
}

registerProcessor('spectralfilter', SpectralFilter);
