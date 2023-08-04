import { Fragment } from 'react';
import * as Tone from 'tone'

function Unlocked() {
  function runSound(){
    const synth = new Tone.Synth().toDestination();
    //play a middle 'C' for the duration of an 8th note
    synth.triggerAttackRelease("C4", "8n");
  }
  return (
    <Fragment>
      <div className='unlocked'>
        <img src={require('./images/chainmaille.gif')} alt="chainmaille" />
        <button className='generateButton' onClick={() => runSound()}>
          generate song
        </button>
      </div>
    </Fragment>
  )
}

export default Unlocked;