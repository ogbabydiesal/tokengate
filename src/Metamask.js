import React, { Component, Fragment } from 'react';
import NFTContractABI from './nft_abi.json';
import {ethers} from "ethers";
import Unlocked from './Unlocked';
import { MetaMaskSDK } from '@metamask/sdk';

function getFirstCharacters(str, x) {
  return str.substring(0, x);
}

class Metamask extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  async newConnectToMetamask() {
    const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
  }

  async connectToMetamask() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const nftContractAddress = "0x57a00abb471cF26a6AcC79C78b3B32F89bdf6Edf";
    const fetchBalance = async (userWalletAddress, provider) => {
      try {
        //see if the wallet has the nft using balanceOf function (if your NFT contract implements this function)
        const balance = await fetchNFTBalance(userWalletAddress, provider);
        return balance;
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    
    const fetchNFTBalance = async (address, provider) => {
      try {
        // Connect to the NFT contract
        const contract = new ethers.Contract(nftContractAddress, NFTContractABI, provider);
        // Call the balanceOf function on the NFT contract
        const balance = await contract.balanceOf(address);
        return balance.toString();
      } catch (error) {
        console.error("Error fetching NFT balance:", error);
      }
    };
    
    
    //const accounts = await provider.send("eth_requestAccounts", []);
    //const data = ({ selectedAddress: accounts[0]})
    //see if they have ens
    //const address = await provider.lookupAddress(data.selectedAddress);
    //see if they have the NFT
    /*
    const baly = await fetchBalance(data.selectedAddress, provider);
    if (address == null) {
      this.setState({ selectedAddress: accounts[0], baly} ); 
    } else {
      this.setState({ selectedAddress: address, baly} ); 
    }
    */   
  }
 
  renderMetamask() {
    if (!this.state.selectedAddress) {
      return (
        <button className="metaConnect" onClick={() => this.newConnectToMetamask()}>Connect Wallet</button> 
      )
    } else {
      return (
        <button className="metaConnect">welcome {(getFirstCharacters(this.state.selectedAddress, 17))+"..."}.</button>  
      ); 
    } 
  }

  splashy() {
    if (this.state.baly == null) {
      return (<p>connect your wallet above to get started</p>)
    } else if (this.state.baly < 1) {
      return (<p>you don't have the access NFT! Collect one <a target="_blank" href = "https://opensea.io/assets/ethereum/0x57a00abb471cf26a6acc79c78b3b32f89bdf6edf/1/" rel="noreferrer">here</a> to gain access to the site.</p>)
    } else if (this.state.baly >= 1) {
      return ( <Unlocked/>) 
    }
  }

  render() {
    return(
      <Fragment>
        <div className="web3">
          {this.renderMetamask()}
        </div>
        <div className='main'>
          {this.splashy()}
        </div>
      </Fragment>
    )
  }
}

export default Metamask;
