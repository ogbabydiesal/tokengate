import React from 'react';
<script src = "https://mimicproject.com/libs/maximilian.v.0.1.js"></script>

class Player extends React.Component {
  audio() {
    /*let maxi;
    initAudioEngine().then((dspEngine)=>{
      maxi = dspEngine;
      setup();
      //Get audio code from script element
      maxi.setAudioCode("myAudioScript");

    })
    */
  }

  render() {
    return (
      <div><button onClick={() => this.audio()}>play</button>
      </div>

    );
  }
}

export default Player;
