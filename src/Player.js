import React from 'react';

class Player extends React.Component {


  audio() {
    async function processSomeStuff(){
      let context = new AudioContext();
      const oscillator = new OscillatorNode(context);
      oscillator.frequency.value = 450;
      oscillator.frequency.amplitude = .1;
      await context.audioWorklet.addModule('worklet/spc.js')
      console.log('i did it');
      const spectralNode = new window.AudioWorkletNode(context, 'spectralfilter');
      oscillator.connect(spectralNode).connect(context.destination);
      oscillator.start();
      //let filterParam = spectralNode.parameters.get('filter')
      //const player = new Tone.Player("./sounds/overhere.wav").connect(spectralNode);
      //spectralNode.connect(context.destination);
      //player.loop = true;
      //player.start();


      /*
      //oscillator.connect(spectralNode).connect(context.destination);
      //spectralNode.connect(context.destination);
      //oscillator.start();
      */

      //let windowsize = spectralNode.parameters.get('windowsize');

      //let hopsize = spectralNode.parameters.get('hopsize');
      //let overlaper = spectralNode.parameters.get('overlaps');
      //let gain = spectralNode.parameters.get('gain');
      //console.log(gain);
      return oscillator; 
    }
    processSomeStuff();
  }


  render() {
    return (
      <div><button onClick={() => this.audio()}>start context</button>
      <button onClick={() => this.audio()}>play sound</button>
      </div>

    );
  }
}

export default Player;
