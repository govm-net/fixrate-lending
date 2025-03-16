import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// MockERC20 接口
const MockERC20ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

task("mint-test-tokens", "铸造测试代币到指定地址")
  .addParam("token", "代币合约地址")
  .addParam("to", "接收代币的地址")
  .addParam("amount", "铸造的代币数量")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;
    const { token, to, amount } = taskArgs;
    
    console.log(`\n=== 开始铸造测试代币到 ${to} ===\n`);
    
    // 获取签名者
    const [signer] = await ethers.getSigners();
    
    try {
      // 连接代币合约
      const tokenContract = new ethers.Contract(token, MockERC20ABI, signer);
      
      // 获取代币信息
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      
      console.log(`代币信息:`);
      console.log(`- 名称: ${name}`);
      console.log(`- 符号: ${symbol}`);
      console.log(`- 小数位: ${decimals}`);
      
      // 计算铸造数量（考虑小数位）
      const mintAmount = ethers.parseUnits(amount.toString(), decimals);
      
      // 获取接收者当前余额
      const oldBalance = await tokenContract.balanceOf(to);
      const oldBalanceFormatted = ethers.formatUnits(oldBalance, decimals);
      
      console.log(`\n接收者 ${to} 当前余额: ${oldBalanceFormatted} ${symbol}`);
      console.log(`准备铸造 ${amount} ${symbol}...`);
      
      // 铸造代币
      const tx = await tokenContract.mint(to, mintAmount);
      
      console.log(`交易已发送，等待确认...`);
      await tx.wait();
      
      // 获取新余额
      const newBalance = await tokenContract.balanceOf(to);
      const newBalanceFormatted = ethers.formatUnits(newBalance, decimals);
      
      console.log(`\n交易成功! 交易哈希: ${tx.hash}`);
      console.log(`已铸造 ${amount} ${symbol} 到 ${to}`);
      console.log(`接收者新余额: ${newBalanceFormatted} ${symbol}`);
    } catch (error: any) {
      console.error(`\n铸造代币时出错: ${error.message || error}`);
    }
    
    console.log(`\n=== 铸造测试代币完成 ===\n`);
  }); 