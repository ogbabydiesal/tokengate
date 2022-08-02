console.log("hello");
class SpectralFilter extends AudioWorkletProcessor {
  // Custom AudioParams can be defined with this static getter.
  static get parameterDescriptors() {
    return [{ name: 'gain', defaultValue: 1., minValue:0, maxValue:1. }];
  }

  constructor() {
    // The super constructor call is required.
    super();
    //hann window
    const hann = 0., 0.000602, 0.002408, 0.005412, 0.009607, 0.014984, 0.02153, 0.029228, 0.03806, 0.048005, 0.059039, 0.071136, 0.084265, 0.098396, 0.113495, 0.129524, 0.146447, 0.164221, 0.182803, 0.20215, 0.222215, 0.242949, 0.264302, 0.286222, 0.308658, 0.331555, 0.354858, 0.37851, 0.402455, 0.426635, 0.450991, 0.475466, 0.5, 0.524534, 0.549009, 0.573365, 0.597545, 0.62149, 0.645142, 0.668445, 0.691342, 0.713778, 0.735698, 0.757051, 0.777785, 0.79785, 0.817197, 0.835779, 0.853553, 0.870476, 0.886505, 0.901604, 0.915735, 0.928864, 0.940961, 0.951995, 0.96194, 0.970772, 0.97847, 0.985016, 0.990393, 0.994588, 0.997592, 0.999398, 1., 0.999398, 0.997592, 0.994588, 0.990393, 0.985016, 0.97847, 0.970772, 0.96194, 0.951995, 0.940961, 0.928864, 0.915735, 0.901604, 0.886505, 0.870476, 0.853553, 0.835779, 0.817197, 0.79785, 0.777785, 0.757051, 0.735698, 0.713778, 0.691342, 0.668445, 0.645142, 0.62149, 0.597545, 0.573365, 0.549009, 0.524534, 0.5, 0.475466, 0.450991, 0.426635, 0.402455, 0.37851, 0.354858, 0.331555, 0.308658, 0.286222, 0.264302, 0.242949, 0.222215, 0.20215, 0.182803, 0.164221, 0.146447, 0.129524, 0.113495, 0.098396, 0.084265, 0.071136, 0.059039, 0.048005, 0.03806, 0.029228, 0.02153, 0.014984, 0.009607, 0.005412, 0.002408, 0.000602;
  }

  process(inputs, outputs, parameters) {
    const clampNumber = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
    const input = inputs[0];
    const output = outputs[0];
    const gain = parameters.gain;
    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      if (gain.length === 1) {
        for (let i = 0; i < inputChannel.length; ++i)
          //"squarify" the sin tone
          outputChannel[i] = clampNumber(inputChannel[i], -.5, .5) * gain[0];
      } else {
        for (let i = 0; i < inputChannel.length; ++i)
          outputChannel[i] = inputChannel[i] * gain[i];
      }
    }

    return true;
  }
}

registerProcessor('spectralfilter', SpectralFilter);
