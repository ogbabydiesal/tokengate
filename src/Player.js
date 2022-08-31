import React from 'react';

class Player extends React.Component {
  constructor(props) {
        super(props);
        this.state = {};
    }

  async audio() {
    const context = new AudioContext();
    const oscillator = new OscillatorNode(context);
    oscillator.frequency.value = 450;
    oscillator.frequency.amplitude = .1;
    await context.audioWorklet.addModule('worklet/spc.js')
    const spectralNode = new window.AudioWorkletNode(context, 'spectralsynth');
    oscillator.connect(spectralNode).connect(context.destination);
    oscillator.start();
    let gainParam = spectralNode.parameters.get('gain');
    let specParam = spectralNode.parameters.get('spec');
    //spectralNode.port.postMessage(this.props.specFrame);
    this.setState({gainParam, context,spectralNode});
    return
  }

  updateSpectralEngine(val) {
    this.state.gainParam.linearRampToValueAtTime(val, this.state.context.currentTime + 0.5);
  }

  render() {
    try {
      this.state.spectralNode.port.postMessage(this.props.specFrame);
    }
    catch(error) {}
    return (
      <div className = "audioParams">
        <button className = "audioButtonStyle" onClick={() => this.audio()}>start audio</button>
        <input id="typeinp" type="range" min="0" max="1" defaultValue=".5" step=".01" onChange={(e) => this.updateSpectralEngine(e.target.value)}/>
      </div>
    );
  }
}

export default Player;
