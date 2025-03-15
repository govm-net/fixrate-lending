import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";

task("send-test-eth", "Send test ETH to a specified address")
  .addPositionalParam("recipient", "The recipient address")
  .addPositionalParam("amount", "The amount of ETH to send")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { recipient, amount } = taskArgs;
    
    // 验证地址格式
    if (!hre.ethers.isAddress(recipient)) {
      console.error(`Invalid Ethereum address: ${recipient}`);
      return;
    }
    
    // 验证金额
    let amountWei;
    try {
      amountWei = hre.ethers.parseEther(amount);
    } catch (error) {
      console.error(`Invalid amount: ${amount}`);
      return;
    }
    
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Sending ${amount} ETH from ${deployer.address} to ${recipient}...`);
    
    // 检查发送者余额
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    if (balance < amountWei) {
      console.error(`Insufficient balance. You have ${hre.ethers.formatEther(balance)} ETH, but trying to send ${amount} ETH.`);
      return;
    }
    
    // 发送交易
    try {
      const tx = await deployer.sendTransaction({
        to: recipient,
        value: amountWei
      });
      
      console.log(`Transaction sent: ${tx.hash}`);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      if (receipt) {
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`Successfully sent ${amount} ETH to ${recipient}`);
      } else {
        console.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error sending ETH:", error);
    }
  }); 