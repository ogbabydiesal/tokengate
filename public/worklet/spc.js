console.log("hello");
class SpectralFilter extends AudioWorkletProcessor {
  // When constructor() undefined, the default constructor will be
  // implicitly used.

  process(inputs, outputs) {
    // By default, the node has single input and output.
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('spectralfilter', SpectralFilter);
