# Auto Claim Faucet TRWA

This project is a Node.js bot that interacts with a smart contract on the Ethereum Base Sepolia network. The bot checks wallets and automatically claims tokens from the specified faucet when eligible. 

## Features

- 🌐 Interacts with the Ethereum Base Sepolia network using Web3.js.
- 🔄 Checks multiple wallets for eligibility and claims tokens when eligible.
- ⏲ Automatically runs at intervals based on the next eligible claim time.

## Prerequisites

1. **Node.js**: Ensure Node.js is installed. [Download Node.js](https://nodejs.org)
2. **Web3.js**: Interacts with the Ethereum blockchain.
3. **Chalk**: Provides color in terminal output.
4. **Ethereum Wallet Private Keys**: List of private keys saved in a `private_keys.txt` file.

## Installation

Clone this repository and install the dependencies.

```bash
git clone https://github.com/ganjsmoke/rwa-testnet.git
```
```
cd rwa-testnet
```
```
npm install
```

## Setup

**Add Private Keys**: Create a `private_keys.txt` file in the project root directory. Each line should contain a private key in hexadecimal format (64 characters long, no prefix).
   
   ```
   private_key_1
   private_key_2
   private_key_3
   ...
   ```

## Usage

Run the bot with Node.js:

```bash
node index.js
```


**Disclaimer**: Use this script responsibly and ensure that you have permission to interact with any smart contracts it targets. This is provided for educational purposes.
