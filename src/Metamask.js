import React, { Component } from 'react';
import spec_ABI from './spec_abi.json';
import {ethers} from "ethers";

class Metamask extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async connectToMetamask() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const soundPiece = new ethers.Contract('0xbde88a06Be30d4fEE59876d1867F94A4bE6F42D9', spec_ABI, provider);
    const specValues = await soundPiece.retrieve();
    this.setState({ selectedAddress: accounts[0], specValues})
  }

  renderMetamask() {
  try {
    let v = this.state.specValues;
    v = ethers.BigNumber.from(v);
    console.log('the value on chain is ' + v.toNumber());
  }
  catch(error) {
    //console.log(error);
  }
   if (!this.state.selectedAddress) {
     return (
       <button className="metaConnect" onClick={() => this.connectToMetamask()}>Connect Wallet</button>
     )
   } else {
     return (
       <p className="metaConnect">Welcome {this.state.selectedAddress}</p>
     );
   }

 }
  render() {
    return(
      <div>
      {this.renderMetamask()}

      </div>

    )
  }
}

export default Metamask;
