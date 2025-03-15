import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx hardhat run deploy/02-send-test-eth.ts --network <network> <recipient_address> <amount_in_eth>");
    process.exit(1);
  }
  
  const recipientAddress = args[0];
  const amountInEth = args[1];
  
  // 验证地址格式
  if (!ethers.isAddress(recipientAddress)) {
    console.error(`Invalid Ethereum address: ${recipientAddress}`);
    process.exit(1);
  }
  
  // 验证金额
  let amount;
  try {
    amount = ethers.parseEther(amountInEth);
  } catch (error) {
    console.error(`Invalid amount: ${amountInEth}`);
    process.exit(1);
  }
  
  console.log(`Sending ${amountInEth} ETH from ${deployer.address} to ${recipientAddress}...`);
  
  // 检查发送者余额
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance < amount) {
    console.error(`Insufficient balance. You have ${ethers.formatEther(balance)} ETH, but trying to send ${amountInEth} ETH.`);
    process.exit(1);
  }
  
  // 发送交易
  try {
    const tx = await deployer.sendTransaction({
      to: recipientAddress,
      value: amount
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    if (receipt) {
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Successfully sent ${amountInEth} ETH to ${recipientAddress}`);
    } else {
      console.error("Transaction failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error sending ETH:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 