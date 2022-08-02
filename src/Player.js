import React from 'react';
let ssfft = require('signalsmith-js-fft');
let FFT = ssfft.FFT, RFFT = ssfft.RFFT;
class Player extends React.Component {

  constructor(props) {
        super(props);

        //this.onMove = this.onMove.bind(this);
        //this.testVarible= "this is a test";
    }


  audio() {
    async function processSomeStuff() {
      const context = new AudioContext();
      const oscillator = new OscillatorNode(context);
      oscillator.frequency.value = 450;
      oscillator.frequency.amplitude = .1;
      await context.audioWorklet.addModule('worklet/spc.js')
      console.log('i did it');
      const spectralNode = new window.AudioWorkletNode(context, 'spectralfilter');
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
