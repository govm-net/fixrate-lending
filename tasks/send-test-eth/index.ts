import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("send-test-eth", "发送测试ETH到指定地址")
  .addParam("to", "接收ETH的地址")
  .addParam("amount", "发送的ETH数量，单位为ETH")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;
    const { to, amount } = taskArgs;
    
    console.log(`\n=== 开始发送 ${amount} ETH 到 ${to} ===\n`);
    
    // 获取签名者
    const [signer] = await ethers.getSigners();
    
    // 检查余额
    const balance = await ethers.provider.getBalance(signer.address);
    const amountWei = ethers.parseEther(amount.toString());
    
    if (balance < amountWei) {
      console.error(`\n错误: 发送者 ${signer.address} 的余额不足`);
      console.log(`当前余额: ${ethers.formatEther(balance)} ETH`);
      console.log(`需要发送: ${amount} ETH`);
      return;
    }
    
    // 发送ETH
    try {
      const tx = await signer.sendTransaction({
        to,
        value: amountWei
      });
      
      console.log(`交易已发送，等待确认...`);
      await tx.wait();
      
      console.log(`\n交易成功! 交易哈希: ${tx.hash}`);
      console.log(`已发送 ${amount} ETH 到 ${to}`);
    } catch (error: any) {
      console.error(`\n发送ETH时出错: ${error.message || error}`);
    }
    
    console.log(`\n=== 发送ETH完成 ===\n`);
  }); 