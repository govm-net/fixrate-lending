import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("mint-test-tokens", "Mint test tokens to a specified address")
  .addPositionalParam("token", "The token contract address")
  .addPositionalParam("recipient", "The recipient address")
  .addPositionalParam("amount", "The amount of tokens to mint")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { token, recipient, amount } = taskArgs;
    
    // 验证地址格式
    if (!hre.ethers.isAddress(token)) {
      console.error(`Invalid token address: ${token}`);
      return;
    }
    
    if (!hre.ethers.isAddress(recipient)) {
      console.error(`Invalid recipient address: ${recipient}`);
      return;
    }
    
    const [deployer] = await hre.ethers.getSigners();
    
    // 连接到代币合约
    console.log(`Connecting to token contract at ${token}...`);
    try {
      // 使用通用的ERC20接口，但添加mint函数
      const tokenContract = await hre.ethers.getContractAt(
        [
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function balanceOf(address) view returns (uint256)",
          "function mint(address to, uint256 amount) returns (bool)",
          "function owner() view returns (address)"
        ],
        token,
        deployer
      );
      
      // 获取代币信息
      const tokenSymbol = await tokenContract.symbol();
      const tokenDecimals = await tokenContract.decimals();
      
      // 计算实际铸造金额（考虑小数位）
      const mintAmount = hre.ethers.parseUnits(amount, tokenDecimals);
      
      console.log(`Minting ${amount} ${tokenSymbol} (${mintAmount.toString()} base units) to ${recipient}...`);
      
      // 检查是否有铸造权限
      try {
        const owner = await tokenContract.owner();
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.error(`The deployer address ${deployer.address} is not the owner of this token contract. Owner is ${owner}`);
          return;
        }
      } catch (error) {
        console.error("Error checking ownership:", error);
        return;
      }
      
      // 铸造代币
      const tx = await tokenContract.mint(recipient, mintAmount);
      console.log(`Transaction sent: ${tx.hash}`);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      if (receipt) {
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        
        // 获取接收者余额
        const balance = await tokenContract.balanceOf(recipient);
        console.log(`New balance of ${recipient}: ${hre.ethers.formatUnits(balance, tokenDecimals)} ${tokenSymbol}`);
        console.log(`Successfully minted ${amount} ${tokenSymbol} to ${recipient}`);
      } else {
        console.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  }); 