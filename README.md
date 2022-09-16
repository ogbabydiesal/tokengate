# Sound-chain

## About
Sound-Chain (working title) is a collectively composed sound piece using Web3 technology. It uses NFTs as access tokens to write musical data to an on-chain spectrogram. Currently in development (github.com/tmartinez88/sound-chain) the project uses custom audio processing and unique social dynamics to imagine new forms of musical collaboration. 

Sound-Chain uses NFTs. But not in the way a lot of other projects use them. There's no apes or kitties here. NFTs in Sound-Chain are used as access and permissions tokens for a collectively governed sound composition. Non-holders can still access the site and make music with the tool, they just can't write content to the composition on-chain making it a fun and accessible project for everyone.  

Sound Chain is collaborative spectral composition developed using Web3 tech. It uses the NFT standard
to grant permissions for the composing process. This repo references smart contracts deployed on the Kovan test network. So while testing, be sure to change your Metamask wallet to Kovan from Mainnet.

Collectors of FFNFTs (Fast Fourier Non-Fungible Tokens) are given write access to unique components of the audio spectrogram. There are 12,800 FFNFTs in total.

The Sound Chain website can synthesize the blockchain data using our built in spectral
playback engine.

Each FFNFT gives the owner access to a particular frequency component in time. If I collect FFNT 10, then I would have write access to (find the frequency) in the first frame of audio for the sound piece. If I collect FFNFT 128, then I would have write access to (find the frequency) in the second frame of audio.

Frames can be played back (and looped) arbitrarily fast so the piece can be expanded or compressed to explore new timbres.

Due to the psychoacoustic effect of ___ not all FFNFTs are as audible as their vertical neighbors. A general curve is chosen to illustrate which FFNTs are more valuable due to this effect.

## The Audio Engine

Spectral processing is achieved in our app using Audioworklets and more generally the Webaudio API. We have chosen an FFT size of 128 with an overlap factor of 2. Should the website go down, the composition remains available on the blockchain. Due to the fairly standardized resynthesis technique we have chosen, the sound piece can be played back in any digital signal processing software with FFT/IFFT functionality such as JUCE or MAX/MSP.

We are using the [signalsmith-js-fft](https://www.npmjs.com/package/signalsmith-js-fft) node package to handle the fft/ifft processing. It is provided here with MIT license.

For more information on the overlap-add fft/ifft synthesis and resynthesis technique see [the bela online tutorials](https://learn.bela.io/tutorials/c-plus-plus-for-real-time-audio-programming/phase-vocoder-part-1/).

## Installation
In the project directory, you can run:
### `yarn install`

To start the app you can run:

### `yarn start`

Which runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
