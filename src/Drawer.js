import React, {useState} from "react";
import Player from './Player';

export default function App() {
  const [specFrame, setSpecFrame] = useState(0);
  React.useEffect(() => {
    //setup the spectrum and overlay drawing contexts
      //the spectrum drawing context
    let c = document.getElementById("myCanvas");
    let ctx = c.getContext("2d");
      //the overlay drawing context
    let d = document.getElementById("myCanvas2");
    let ctx2 = d.getContext("2d");
    //create a spectrum array
    let fftSize = 128;
    let spectrum = new Array(fftSize * 50).fill(0); //6400
    //generate random values for our spectrum
    for (let i = 0; i < spectrum.length; i++) {

      if (Math.random() < .1) {
        spectrum[i] = Math.random().toFixed(3);
      }
    }
    //spectrum drawing
    let column = 0;
    let row = 0;
    let outputSizeX = 10;
    let outputSizeY = 3; //multiplier for spectrum visualization
    for (let x = 0; x < spectrum.length; x++) {
      if (x % fftSize == 0) {
        column++;
      }
      row = x % fftSize;
      ctx.fillStyle = 'rgba(' + (spectrum[x]* 255)+','+ (spectrum[x]* 255)+','+(spectrum[x]* 255) + ')';
      ctx.fillRect((column * outputSizeX)-outputSizeX,row * outputSizeY,outputSizeX, outputSizeX);
    }
    let xPos = 0;

    let start, previousTimeStamp;
    let done = false

    function step(timestamp) {
      if (start === undefined) {
        start = timestamp;
        }
      const elapsed = timestamp - start;
      if (previousTimeStamp !== timestamp) {
        // Math.min() is used here to make sure the element stops at exactly 200px
        const count = Math.min(0.1 * elapsed, 200);
        ctx2.fillStyle = 'royalblue';
        ctx2.clearRect(0, 0, 500, 384)
        ctx2.fillRect(xPos, 0, 13, 384) //play head
        //would love to be able to pass in fftSize here
        let specFrame = spectrum.slice(Math.floor(xPos / 10)* 128, (Math.floor(xPos / 10)* 128) + 128);
        setSpecFrame(specFrame);
        xPos++;
        if (xPos == 500) xPos = 0;
        if (count === 200) done = true; //probably lose this for a button
      }
      window.requestAnimationFrame(step);
      if (elapsed < 2000) { // Stop the animation after condition
        previousTimeStamp = timestamp;
        if (!done) {
          //window.requestAnimationFrame(step);
        }
      }
    }
    window.requestAnimationFrame(step);
    //return?
  }, []);

  return (
    <div>
      <canvas className="canvasSpectrum"
        id="myCanvas"
        width="500"
        height="384"
      >
      </canvas>
      <canvas className="canvasOverlay"
        id="myCanvas2"
        width="500"
        height="384"
      >
      </canvas>
      <Player specFrame={specFrame}/>
    </div>
  );
}
