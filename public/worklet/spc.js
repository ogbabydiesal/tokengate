// A fairly small and neat FFT - not the fastest, but not terrible
// Expects interleaved complex pairs (i.e. `[real0, imag0, real1, imag1, ...]`)


//const model = tf.sequential();

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


class SpectralSynth extends AudioWorkletProcessor {
	constructor() {
        super()
				//declare circular buffer
				this.inputCircBuffer = new Array(1024).fill(0);
				this.outputCircBuffer = new Array(1024).fill(0);
				this.pointers = [0,128];

				//declare fft stuff
				this.fftSize = 128;
				this.fft = new RFFT(this.fftSize); // Complex FFT
				this.hopSize = this.fftSize / 2;
				this.hopCounter = 0;
				this.arrayFiller = new Array(256).fill(0);
				//our spectral data from our NFT
				this.nftData = [-0.680157, -2.595802, -2.23181, 1.043628, 0.871478, 0.032085, 0.011783, -0.160232, -0.184497, -0.109513, -0.087528, -0.075393, 0.184206, 0.174413, 0.029763, -0.027556, -0.045465, -0.021071, 0.004307, 0.0381, 0.040553, 0.012664, 0.035117, -0.012051, -0.019118, 0.004216, 0.018444, 0.015699, 0.00379, -0.004722, -0.000858, -0.017687, -0.026178, 0.011752, 0.019912, 0.013626, 0.00343, -0.046204, -0.047157, -0.009494, 0.007517, 0.001061, 0.001682, -0.001973, 0.00136, -0.000763, -0.008926, 0.001992, 0.008029, -0.006005, -0.000749, 0.001227, 0.000536, -0.000417, 0.001444, 0.000586, -0.00084, 0.00056, 0.002605, 0.000054, 0.000127, 0.001656, 0.00143, -0.00008, -0.004751, -0.004541, 0.000775, 0.000517, 0.001907, 0.000662, 0.000421, -0.000034, 0.001203, -0.000295, -0.000875, -0.000185, 0.001125, 0.00154, 0.000368, -0.000635, 0.001205, 0.000953, 0.000298, -0.00007, 0.000814, 0.000101, -0.000163, 0.000154, 0.000806, -0.000091, 0.00047, 0.000528, 0.000385, 0.000568, -0.000065, -0.002443, -0.000881, 0.000015, 0.000921, 0.00154, 0.000318, -0.000622, 0.000688, -0.000106, -0.000524, -0.000082, 0.000407, -0.000157, -0.000026, 0.000186, 0.000851, -0.001358, -0.001375, -0.001035, -0.00129, -0.00054, -0.000292, -0.000539, 0.000184, -0.000136, 0.000128, -0.000125, 0.000123, -0.000122, 0.000121, -0.00012, 0.00012, -0.00012];

				for (let i = 0; i < this.fftSize; i ++) {
				  //this.nftData[i] = (((Math.random()) * 2) - 1) * .4;
				  this.nftData[i] = parseFloat(this.nftData[i].toFixed(2));
				  //console.log(rPhase[i]);
				}

				//create random phase values
				this.rPhase = [this.fftSize];
				for (let i = 0; i < this.fftSize; i ++) {
				  this.rPhase[i] = (((Math.random()) * 2) - 1) * .4;
				  this.rPhase[i] = parseFloat(this.rPhase[i].toFixed(2));
				  //console.log(rPhase[i]);
				}

				//this.rPhase = [0., -0.157171, -2.327943, -1.563757, 0.121738, -0.4125, 0.15856, 1.156681, 0.314372, -1.141282, -0.701739, 0.167129, -0.223753, 0.55177, 2.264441, 0.934212, -0.31556, -0.030361, -0.09366, -0.096043, -0.029978, -0.00103, 0.075803, 0.055411, -0.066573, 0.019619, 0.050953, 0.020653, 0.017562, 0.047335, 0.014223, -0.014835, -0.007107, -0.003508, 0.008877, -0.018271, -0.01674, 0.008487, -0.007421, 0.024174, 0.014349, -0.020094, 0.001163, 0.026269, 0.015633, -0.005191, -0.016158, -0.013792, -0.00482, 0.000845, 0.002349, 0.007815, 0.006865, 0.009279, 0.001811, -0.006692, -0.00348, 0.001848, -0.00081, 0.000704, 0.005282, -0.000777, -0.004505, -0.006024, -0.002743, -0.000259, -0.000884, 0.000035, -0.001038, 0.000416, 0.000283, -0.000087, 0.002783, 0.00029, -0.00141, 0.000487, 0.000617, 0.004585, 0.003632, 0.001466, -0.003343, -0.008486, -0.005811, -0.001335, 0.005784, 0.006047, 0.004387, 0.003335, -0.000633, -0.001485, -0.000222, 0.000151, -0.000441, 0.000457, -0.000951, -0.000842, -0.00104, -0.000729, 0.000481, 0.00192, -0.000705, -0.001682, 0.000225, 0.000926, 0.001278, 0.002523, 0.001809, -0.000616, -0.001093, -0.001666, -0.000765, -0.000816, -0.000757, 0.00168, 0.001204, 0.000326, -0.000187, -0.002533, -0.001162, 0.001145, 0.002293, 0.002692, 0.002577, 0.001273, -0.00154, -0.003063, 0.000033, 0.001685, 0.000712, -0.000198, -0.002081, 0.000084, 0.001235, 0.00008, 0.000922, 0.001146, -0.00071, 0.000268, 0.000194, -0.000088, 0.001296, 0.001478, 0.00155, 0.00096, 0.001434, 0.000761, -0.00029, -0.000269, -0.001582, -0.001472, -0.000668, -0.00107, -0.000022, 0.000134, -0.000928, 0.001478, 0.002479, 0.001363, 0.00494, 0.003122, 0.001226, 0.001315, -0.00535, -0.004939, -0.000615, 0.000082, 0.005576, 0.010053, 0.002079, -0.006258, -0.004817, -0.003365, -0.001602, 0.000514, 0.000837, -0.000036, -0.001176, 0.000227, -0.001142, -0.002114, -0.000668, -0.00038, 0.000351, 0.000276, 0.00133, 0.002064, -0.000704, -0.003125, -0.001721, -0.000144, -0.000047, 0.000995, -0.000032, -0.000805, 0.001206, 0.001334, -0.000698, 0.000632, 0.000079, 0.000056, 0.002389, 0.00038, -0.00125, 0.000793, 0.001168, 0.000011, -0.00105, -0.001989, -0.001727, -0.000799, -0.000884, -0.000259, 0.000542, 0.000138, -0.000541, -0.001258, -0.000429, 0.000717, 0.000997, 0.000809, 0.000909, 0.000168, 0.002851, 0.004202, 0.000647, -0.001126, -0.002, -0.001404, -0.000953, -0.001392, -0.000513, 0.000157, -0.000022, -0.000168, -0.000025, 0.000005, -0.000014, 0.000001, -0.000001, 0.000004, -0.000002, 0.000001, -0.000001, 0.000001, -0.000001, 0., -0., 0., -0., 0., -0., 0., -0., 0., -0., 0., 0., -0., 0., -0., 0., -0., 0., -0., 0., -0., 0., -0., 0.000001, -0.000001, 0.000001, -0.000001, 0.000002, -0.000004, 0.000001, -0.000001, 0.000014, -0.000005, 0.000025, 0.000168, 0.000022, -0.000157, 0.000513, 0.001392, 0.000953, 0.001404, 0.002, 0.001126, -0.000647, -0.004202, -0.002851, -0.000168, -0.000909, -0.000809, -0.000997, -0.000717, 0.000429, 0.001258, 0.000541, -0.000138, -0.000542, 0.000259, 0.000884, 0.000799, 0.001727, 0.001989, 0.00105, -0.000011, -0.001168, -0.000793, 0.00125, -0.00038, -0.002389, -0.000056, -0.000079, -0.000632, 0.000698, -0.001334, -0.001206, 0.000805, 0.000032, -0.000995, 0.000047, 0.000144, 0.001721, 0.003125, 0.000704, -0.002064, -0.00133, -0.000276, -0.000351, 0.00038, 0.000668, 0.002114, 0.001142, -0.000227, 0.001176, 0.000036, -0.000837, -0.000514, 0.001602, 0.003365, 0.004817, 0.006258, -0.002079, -0.010053, -0.005576, -0.000082, 0.000615, 0.004939, 0.00535, -0.001315, -0.001226, -0.003122, -0.00494, -0.001363, -0.002479, -0.001478, 0.000928, -0.000134, 0.000022, 0.00107, 0.000668, 0.001472, 0.001582, 0.000269, 0.00029, -0.000761, -0.001434, -0.00096, -0.00155, -0.001478, -0.001296, 0.000088, -0.000194, -0.000268, 0.00071, -0.001146, -0.000922, -0.00008, -0.001235, -0.000084, 0.002081, 0.000198, -0.000712, -0.001685, -0.000033, 0.003063, 0.00154, -0.001273, -0.002577, -0.002692, -0.002293, -0.001145, 0.001162, 0.002533, 0.000187, -0.000326, -0.001204, -0.00168, 0.000757, 0.000816, 0.000765, 0.001666, 0.001093, 0.000616, -0.001809, -0.002523, -0.001278, -0.000926, -0.000225, 0.001682, 0.000705, -0.00192, -0.000481, 0.000729, 0.00104, 0.000842, 0.000951, -0.000457, 0.000441, -0.000151, 0.000222, 0.001485, 0.000633, -0.003335, -0.004387, -0.006047, -0.005784, 0.001335, 0.005811, 0.008486, 0.003343, -0.001466, -0.003632, -0.004585, -0.000617, -0.000487, 0.00141, -0.00029, -0.002783, 0.000087, -0.000283, -0.000416, 0.001038, -0.000035, 0.000884, 0.000259, 0.002743, 0.006024, 0.004505, 0.000777, -0.005282, -0.000704, 0.00081, -0.001848, 0.00348, 0.006692, -0.001811, -0.009279, -0.006865, -0.007815, -0.002349, -0.000845, 0.00482, 0.013792, 0.016158, 0.005191, -0.015633, -0.026269, -0.001163, 0.020094, -0.014349, -0.024174, 0.007421, -0.008487, 0.01674, 0.018271, -0.008877, 0.003508, 0.007107, 0.014835, -0.014223, -0.047335, -0.017562, -0.020653, -0.050953, -0.019619, 0.066573, -0.055411, -0.075803, 0.00103, 0.029978, 0.096043, 0.09366, 0.030361, 0.31556, -0.934212, -2.264441, -0.55177, 0.223753, -0.167129, 0.701739, 1.141282, -0.314372, -1.156681, -0.15856, 0.4125, -0.121738, 1.563757, 2.327943, 0.157171];

				//create an array to store spectral data, this array contains real and imag so is 2x fftSize
				this.spectrum = new Float64Array(this.fftSize);
				//push our magnitude and phase values into the array interleaved
				this.spectrum = this.nftData.reduce((x, y, z) => (x.splice(z * 2, 0, y), x), this.rPhase.slice());
				//fill the other half with zeros
				//this.spectrum = this.spectrum.concat(this.arrayFiller);
				//worklets' precious buffersize
				this.buffersize = 128;
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

  process(inputs, outputs) {
    // By default, the node has single input and output.
    const input = inputs[0];
    const output = outputs[0];

    //for (let channel = 0; channel < output.length; ++channel) {
    const inputChannel = input[0];
    const outputChannel = output[0];

		//const outputChannel2 = output[1];

		/*
    for (let i = 0; i < inputChannel.length; ++i) {
			//do nothing with our input sample, this is used to keep the worklet active(check accuracy)
			//increment the hopcounter until we get a hopSize amount of samples
			this.hopCounter++;
			if (this.hopCounter === this.hopSize) {
				this.hopCounter = 0;
				//do fft stuff
				this.fft.ifft(this.spectrum, this.fftResult);
				//add real values (every other in this interleaved list) to the outputCircBuffer
				for (let n = 0; n < this.fftResult.length; n+=2) {
					//and don't forget to scale by fftSize! //we also need to add a window here too but that shall wait a night
					this.outputCircBuffer[this.pointers[1]] = (this.outputCircBuffer[this.pointers[1]] + this.fftResult[n]) / this.fftSize;
					this.pointers[1] = (this.pointers[1] + 1) % this.outputCircBuffer.length;
				}
				//increment our outputCircBuffer pointer by one hop hopSize
				//this.pointers[1] = (this.pointers[1] + this.hopSize) % this.outputCircBuffer.length;
			}
			//console.log(this.pointers[0]);
			//outputChannel[i] = inputChannel[i] * .1;
			outputChannel[i] = this.outputCircBuffer[this.pointers[0] + i];
			//console.log(this.outputCircBuffer[this.pointers[0] + i]);
			this.outputCircBuffer[this.pointers[0] + i] = 0;
			//console.log(this.outputCircBuffer[this.pointers[0] + i]);
			this.pointers[0] = (this.pointers[0] + 1) % this.outputCircBuffer.length

    }
		*/
		this.fft.fft(inputChannel, this.fftResult);
		this.fft.ifft(this.nftData, outputChannel);
		for (let i = 0; i < inputChannel.length; ++i) {
			outputChannel[i] = outputChannel[i] / this.fftSize;
		}

		console.log(this.fftResult);
		//console.log(this.nftData.length);
		//console.log(this.pointers[0]);
    return true;
  }
}

registerProcessor('spectralsynth', SpectralSynth);
