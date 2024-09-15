const Web3 = require('web3');
const ethers = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const CryptoWallet = require('../models/CryptoWallet');
const CryptoTransaction = require('../models/CryptoTransaction');

class CryptoService {
  constructor() {
    this.web3 = new Web3(process.env.ETHEREUM_NODE_URL);
    this.ethersProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_NODE_URL);
    this.bitcoinNetwork = bitcoin.networks.testnet; // Use testnet for development, change to bitcoin.networks.bitcoin for mainnet
  }

  async createWallet(userId, currency) {
    let wallet;
    switch (currency.toLowerCase()) {
      case 'eth':
        wallet = this.web3.eth.accounts.create();
        break;
      case 'btc':
        const keyPair = bitcoin.ECPair.makeRandom({ network: this.bitcoinNetwork });
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: this.bitcoinNetwork });
        wallet = { address, privateKey: keyPair.toWIF() };
        break;
      default:
        throw new Error('Unsupported currency');
    }

    const newWallet = new CryptoWallet({
      userId,
      currency,
      address: wallet.address,
      privateKey: this.encryptPrivateKey(wallet.privateKey)
    });

    await newWallet.save();
    return { address: wallet.address };
  }

  async getWalletBalance(userId, currency) {
    const wallet = await CryptoWallet.findOne({ userId, currency });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    let balance;
    switch (currency.toLowerCase()) {
      case 'eth':
        balance = await this.web3.eth.getBalance(wallet.address);
        return this.web3.utils.fromWei(balance, 'ether');
      case 'btc':
        const response = await axios.get(`https://blockstream.info/testnet/api/address/${wallet.address}`);
        return response.data.chain_stats.funded_txo_sum / 100000000; // Convert satoshis to BTC
      default:
        throw new Error('Unsupported currency');
    }
  }

  async sendTransaction(userId, currency, toAddress, amount) {
    const wallet = await CryptoWallet.findOne({ userId, currency });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const privateKey = this.decryptPrivateKey(wallet.privateKey);

    let txHash;
    switch (currency.toLowerCase()) {
      case 'eth':
        const nonce = await this.web3.eth.getTransactionCount(wallet.address);
        const gasPrice = await this.web3.eth.getGasPrice();
        const txObject = {
          nonce: this.web3.utils.toHex(nonce),
          to: toAddress,
          value: this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), 'ether')),
          gasLimit: this.web3.utils.toHex(21000),
          gasPrice: this.web3.utils.toHex(gasPrice)
        };
        const signedTx = await this.web3.eth.accounts.signTransaction(txObject, privateKey);
        const tx = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        txHash = tx.transactionHash;
        break;
      case 'btc':
        const psbt = new bitcoin.Psbt({ network: this.bitcoinNetwork });
        const utxos = await this.getBitcoinUTXOs(wallet.address);
        let totalInput = 0;
        utxos.forEach(utxo => {
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              script: Buffer.from(utxo.scriptPubKey, 'hex'),
              value: utxo.value
            }
          });
          totalInput += utxo.value;
        });
        const satoshiAmount = Math.floor(amount * 100000000);
        psbt.addOutput({
          address: toAddress,
          value: satoshiAmount
        });
        if (totalInput > satoshiAmount) {
          psbt.addOutput({
            address: wallet.address,
            value: totalInput - satoshiAmount - 1000 // Subtract fee
          });
        }
        const keyPair = bitcoin.ECPair.fromWIF(privateKey, this.bitcoinNetwork);
        psbt.signAllInputs(keyPair);
        psbt.finalizeAllInputs();
        const txHex = psbt.extractTransaction().toHex();
        const response = await axios.post('https://blockstream.info/testnet/api/tx', txHex);
        txHash = response.data;
        break;
      default:
        throw new Error('Unsupported currency');
    }

    const transaction = new CryptoTransaction({
      userId,
      currency,
      fromAddress: wallet.address,
      toAddress,
      amount,
      txHash
    });
    await transaction.save();

    return txHash;
  }

  async getTransactionHistory(userId, currency) {
    return await CryptoTransaction.find({ userId, currency }).sort({ createdAt: -1 });
  }

  async getTransactionStatus(txHash, currency) {
    switch (currency.toLowerCase()) {
      case 'eth':
        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        return receipt ? (receipt.status ? 'Confirmed' : 'Failed') : 'Pending';
      case 'btc':
        try {
          const response = await axios.get(`https://blockstream.info/testnet/api/tx/${txHash}`);
          return response.data.status.confirmed ? 'Confirmed' : 'Pending';
        } catch (error) {
          if (error.response && error.response.status === 404) {
            return 'Not Found';
          }
          throw error;
        }
      default:
        throw new Error('Unsupported currency');
    }
  }

  async estimateTransactionFee(currency, toAddress, amount) {
    switch (currency.toLowerCase()) {
      case 'eth':
        const gasPrice = await this.web3.eth.getGasPrice();
        const gasLimit = 21000; // Standard gas limit for ETH transfers
        return this.web3.utils.fromWei(this.web3.utils.toBN(gasPrice).mul(this.web3.utils.toBN(gasLimit)), 'ether');
      case 'btc':
        // This is a simplified fee estimation. In a real-world scenario, you'd use a more sophisticated method.
        return 0.0001; // Fixed fee estimation in BTC
      default:
        throw new Error('Unsupported currency');
    }
  }

  async validateAddress(currency, address) {
    switch (currency.toLowerCase()) {
      case 'eth':
        return this.web3.utils.isAddress(address);
      case 'btc':
        try {
          bitcoin.address.toOutputScript(address, this.bitcoinNetwork);
          return true;
        } catch (error) {
          return false;
        }
      default:
        throw new Error('Unsupported currency');
    }
  }

  // Helper methods

  async getBitcoinUTXOs(address) {
    const response = await axios.get(`https://blockstream.info/testnet/api/address/${address}/utxo`);
    return response.data;
  }

  encryptPrivateKey(privateKey) {
    // Implement your encryption logic here
    // This is a placeholder and should be replaced with a secure encryption method
    return privateKey;
  }

  decryptPrivateKey(encryptedPrivateKey) {
    // Implement your decryption logic here
    // This is a placeholder and should be replaced with a secure decryption method
    return encryptedPrivateKey;
  }
}

module.exports = new CryptoService();
