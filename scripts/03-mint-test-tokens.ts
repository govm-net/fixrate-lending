import { ethers } from "hardhat";
import { MockERC20__factory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx hardhat run deploy/03-mint-test-tokens.ts --network <network> <token_address> <recipient_address> <amount>");
    process.exit(1);
  }
  
  const tokenAddress = args[0];
  const recipientAddress = args[1];
  const amount = args[2];
  
  // 验证地址格式
  if (!ethers.isAddress(tokenAddress)) {
    console.error(`Invalid token address: ${tokenAddress}`);
    process.exit(1);
  }
  
  if (!ethers.isAddress(recipientAddress)) {
    console.error(`Invalid recipient address: ${recipientAddress}`);
    process.exit(1);
  }
  
  // 连接到代币合约
  console.log(`Connecting to token contract at ${tokenAddress}...`);
  try {
    const tokenContract = MockERC20__factory.connect(tokenAddress, deployer);
    
    // 获取代币信息
    const tokenSymbol = await tokenContract.symbol();
    const tokenDecimals = await tokenContract.decimals();
    
    // 计算实际铸造金额（考虑小数位）
    const mintAmount = ethers.parseUnits(amount, tokenDecimals);
    
    console.log(`Minting ${amount} ${tokenSymbol} (${mintAmount.toString()} base units) to ${recipientAddress}...`);
    
    // 检查是否有铸造权限（MockERC20使用Ownable而不是AccessControl）
    try {
      const owner = await tokenContract.owner();
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error(`The deployer address ${deployer.address} is not the owner of this token contract. Owner is ${owner}`);
        process.exit(1);
      }
    } catch (error) {
      console.error("Error checking ownership:", error);
      process.exit(1);
    }
    
    // 铸造代币
    const tx = await tokenContract.mint(recipientAddress, mintAmount);
    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    if (receipt) {
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      // 获取接收者余额
      const balance = await tokenContract.balanceOf(recipientAddress);
      console.log(`New balance of ${recipientAddress}: ${ethers.formatUnits(balance, tokenDecimals)} ${tokenSymbol}`);
      console.log(`Successfully minted ${amount} ${tokenSymbol} to ${recipientAddress}`);
    } else {
      console.error("Transaction failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error minting tokens:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 