import { task } from "hardhat/config";
import { Contract } from "ethers";

task("add-mining-pool", "添加流动性挖矿池")
  .addParam("token", "质押代币地址", undefined, undefined, false)
  .addParam("allocpoint", "分配点数", undefined, undefined, false)
  .setAction(async (taskArgs, hre) => {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    
    console.log(`添加流动性挖矿池...`);
    console.log(`部署者地址: ${deployer}`);
    console.log(`质押代币地址: ${taskArgs.token}`);
    console.log(`分配点数: ${taskArgs.allocpoint}`);
    
    try {
      // 获取已部署的流动性挖矿合约
      const liquidityMiningDeployment = await deployments.get("LiquidityMining");
      console.log(`流动性挖矿合约地址: ${liquidityMiningDeployment.address}`);
      
      // 连接合约
      const liquidityMining = await hre.ethers.getContractAt(
        "LiquidityMining", 
        liquidityMiningDeployment.address,
        await hre.ethers.getSigner(deployer)
      );
      
      // 添加池
      const tx = await liquidityMining.addPool(taskArgs.token, taskArgs.allocpoint);
      console.log(`交易哈希: ${tx.hash}`);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log(`交易已确认，区块号: ${receipt.blockNumber}`);
      
      // 获取池数量
      const poolLength = await liquidityMining.poolLength();
      console.log(`当前池数量: ${poolLength}`);
      
      // 获取最新添加的池信息
      const poolInfo = await liquidityMining.poolInfo(poolLength - 1);
      console.log(`新池信息:`);
      console.log(`  LP代币地址: ${poolInfo.lpToken}`);
      console.log(`  分配点数: ${poolInfo.allocPoint}`);
      console.log(`  上次奖励时间: ${poolInfo.lastRewardTime}`);
      console.log(`  每份额累计奖励: ${poolInfo.accRewardPerShare}`);
      
      console.log('\n池添加成功!');
    } catch (error) {
      console.error('添加池失败:', error);
    }
  });