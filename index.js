const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Initialize Web3 with the provided RPC
const web3 = new Web3('https://base-sepolia.blockpi.network/v1/rpc/public');

// Smart Contract details
const contractAddress = '0x219ba210ef31613390df886763099d0ed35aa6b8';
const contractABI = [{"inputs":[{"internalType":"contract IERC20","name":"_token","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"claimAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"cooldownTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"lastClaimedTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxClaimAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"refillFaucet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalClaimed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
const faucetContract = new web3.eth.Contract(contractABI, contractAddress);

// Read private keys from file
const privateKeysPath = path.join(__dirname, 'private_keys.txt');
const privateKeys = fs.readFileSync(privateKeysPath, 'utf-8').trim().split('\n');

// Helper function to convert Unix timestamp to human-readable format
function formatUnixTime(unixTime) {
  const date = new Date(unixTime * 1000);
  return date.toLocaleString();
}

// Function to check if claiming is possible and execute it if so
async function claimFaucet(privateKey) {
  if (privateKey.length !== 64) {
    console.log(chalk.red(`❌ Skipping invalid private key (must be 32 bytes): ${privateKey.slice(0, 6)}...`));
    return null;
  }

  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log(chalk.cyan(`\n🚀 Processing wallet address: ${account.address}`));

    // Retrieve last claimed time and cooldown
    const lastClaimed = await faucetContract.methods.lastClaimedTime(account.address).call();
    const cooldownTime = await faucetContract.methods.cooldownTime().call();

    const currentTime = Math.floor(Date.now() / 1000);
    const nextClaimTime = parseInt(lastClaimed) + parseInt(cooldownTime);

    console.log(chalk.yellow(`⏱ Last claimed time: ${formatUnixTime(lastClaimed)}`));
    console.log(chalk.blue(`🕕 Next eligible claim time: ${formatUnixTime(nextClaimTime)}`));
    console.log(chalk.green(`🕒 Current time: ${formatUnixTime(currentTime)}`));

    if (currentTime >= nextClaimTime) {
      // Estimate gas for the claim transaction
      const gasEstimate = await faucetContract.methods.claimTokens().estimateGas({ from: account.address });

      // Build the claim transaction with estimated gas
      const tx = {
        from: account.address,
        to: contractAddress,
        gas: gasEstimate,
        data: faucetContract.methods.claimTokens().encodeABI(),
      };

      console.log(chalk.gray(`📜 Preparing to sign transaction for address: ${account.address}`));
      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
      console.log(chalk.blueBright(`📨 Sending transaction for address: ${account.address}`));

      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log(chalk.greenBright(`✅ Claimed successfully for account ${account.address}`));
      console.log(chalk.green(`   📜 Transaction Hash: ${receipt.transactionHash}\n`));
    } else {
      const timeRemaining = nextClaimTime - currentTime;
      console.log(chalk.red(`🕒 Not yet time to claim for account ${account.address}`));
      console.log(chalk.yellow(`   ⏳ Time remaining: ${Math.floor(timeRemaining / 60)} minutes and ${timeRemaining % 60} seconds\n`));
      return timeRemaining;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error claiming for account with private key ${privateKey.slice(0, 6)}...`), error.message);
    return null;
  }
}
function printHeader() {
  const line = "=".repeat(50);
  const title = "Auto Claim Faucet TRWA";
  const createdBy = "Bot created by: https://t.me/airdropwithmeh";

  const totalWidth = 50;
  const titlePadding = Math.floor((totalWidth - title.length) / 2);
  const createdByPadding = Math.floor((totalWidth - createdBy.length) / 2);

  const centeredTitle = title.padStart(titlePadding + title.length).padEnd(totalWidth);
  const centeredCreatedBy = createdBy.padStart(createdByPadding + createdBy.length).padEnd(totalWidth);

  console.log(chalk.cyan.bold(line));
  console.log(chalk.cyan.bold(centeredTitle));
  console.log(chalk.green(centeredCreatedBy));
  console.log(chalk.cyan.bold(line));
}

// Function to loop through private keys and find the shortest time remaining
async function main() {
	printHeader();
  console.log(chalk.bold.cyan(`\n🚀 Starting claim check...`));

  let shortestWaitTime = Infinity;

  for (const privateKey of privateKeys) {
    const waitTime = await claimFaucet(privateKey.trim());
    if (waitTime !== null && waitTime < shortestWaitTime) {
      shortestWaitTime = waitTime;
    }
  }

  // Set the next run time based on the shortest wait time + 1 minute
  const nextRunTime = Math.max(shortestWaitTime + 60, 300); // Minimum wait time is 5 minutes (300 seconds)
  console.log(chalk.blue(`⏰ Next check will run in ${Math.floor(nextRunTime / 60)} minutes and ${nextRunTime % 60} seconds\n`));

  // Schedule the main function to run again after the shortest wait time + 1 minute
  setTimeout(main, nextRunTime * 1000);
}

main(); // Initial run
