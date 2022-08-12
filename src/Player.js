import React from 'react';


class Player extends React.Component {

  constructor(props) {
        super(props);
    }


  audio() {
    async function processSomeStuff() {
      const context = new AudioContext();
      const oscillator = new OscillatorNode(context);
      oscillator.frequency.value = 450;
      oscillator.frequency.amplitude = .1;
      await context.audioWorklet.addModule('worklet/spc.js')
      const spectralNode = new window.AudioWorkletNode(context, 'spectralsynth');
      oscillator.connect(spectralNode).connect(context.destination);
      oscillator.start();
    }
    processSomeStuff();
  }

  render() {
    return (
      <div>
        <button onClick={() => this.audio()}>start context</button>
      </div>
    );
  }
}

export default Player;
