import React from "react";

export default function App() {
  React.useEffect(() => {
    let spectrum = new Array(12800).fill(0);
    let fftSize = 256;
    let column = 0;
    let row = 0;

    for (let i = 0; i < spectrum.length; i++) {
      if (Math.random() < .8) {
        spectrum[i] = Math.random().toFixed(3);
      }
    }

    let c = document.getElementById("myCanvas");
    let ctx = c.getContext("2d");
    for (let x = 0; x < spectrum.length; x++) {
      if (x % fftSize == 0) {
        column++;
      }
      row = x % fftSize;
      ctx.fillStyle = 'rgba(' + (spectrum[x]* 255)+','+ (spectrum[x]* 255)+','+(spectrum[x]* 255) + ')';
      //console.log(column);
      //ctx.fillStyle = 'rgb(100, 100, 100)';
      ctx.fillRect(column - 1,row,1, 1);

    }
    /*
    ctx.moveTo(0, 0);
    ctx.lineTo(50, 256);
    ctx.stroke();
    */
  }, []);

  return (
    <div>
      <canvas className="canvasConnect"
        id="myCanvas"
        width="50"
        height="256"
      >
        Your browser does not support the HTML canvas tag.
      </canvas>
    </div>
  );
}
