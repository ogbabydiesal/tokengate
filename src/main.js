let filterParam = {};
let context = {};

function updateFilter(slidey){
  filterParam.setValueAtTime(slidey, context.currentTime);
  console.log(slidey);
}

async function processSomeStuff(){
  context = new AudioContext();

  const audio = new Audio("./sounds/overhere.wav");
  /*
  const oscillator = new OscillatorNode(context);
  oscillator.frequency.value = 450;
  oscillator.frequency.amplitude = .1;
  */
  //await context.audioWorklet.addModule('js/complex.js')
  await context.audioWorklet.addModule('js/spectralfilter.js')

  const spectralNode = new AudioWorkletNode(context, 'spectralfilter');
  const source = context.createMediaElementSource(audio);
  source.connect(spectralNode).connect(context.destination);
  audio.loop = true;
  audio.play();
  filterParam = spectralNode.parameters.get('filter')


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

}
