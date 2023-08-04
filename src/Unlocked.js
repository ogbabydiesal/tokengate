import * as Tone from 'tone'

function Unlocked() {
  function runSound(){
    const synth = new Tone.Synth().toDestination();
    //play a middle 'C' for the duration of an 8th note
    synth.triggerAttackRelease("C4", "8n");
  }
  return (
    <button onClick={() => runSound()}>
      generate song
    </button>  
  )
}

export default Unlocked;