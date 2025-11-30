import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying LiquidityMining with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);

  // 获取已部署的代币合约地址
  // 在实际部署中，您需要根据实际情况设置这些地址
  let rewardTokenAddress: string;
  
  try {
    // 尝试从已部署的合约中获取奖励代币地址
    const deploymentsDir = hre.config.paths.deployments;
    const networkName = network.name;
    
    // 如果是本地网络，使用MockUSDC作为奖励代币
    if (networkName === "localhost" || networkName === "hardhat") {
      const mockUSDCDeployment = await deployments.get("MockUSDC");
      rewardTokenAddress = mockUSDCDeployment.address;
    } else {
      // 对于其他网络，您需要指定实际的奖励代币地址
      // 这里使用一个示例地址，您需要根据实际情况修改
      rewardTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC地址示例
    }
  } catch (error) {
    console.log("Could not find existing token deployment, using example address");
    rewardTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC地址示例
  }

  // 设置挖矿参数
  const rewardPerSecond = process.env.REWARD_PER_SECOND 
    ? ethers.parseUnits(process.env.REWARD_PER_SECOND, 18) 
    : ethers.parseUnits("1", 18); // 默认每秒1个代币
  
  const startTime = process.env.START_TIME 
    ? parseInt(process.env.START_TIME) 
    : Math.floor(Date.now() / 1000) + 60; // 默认1分钟后开始
  
  const endTime = process.env.END_TIME 
    ? parseInt(process.env.END_TIME) 
    : startTime + 30 * 24 * 60 * 60; // 默认30天后结束

  console.log(`Deployment parameters:`);
  console.log(`- Reward Token: ${rewardTokenAddress}`);
  console.log(`- Reward Per Second: ${ethers.formatUnits(rewardPerSecond, 18)}`);
  console.log(`- Start Time: ${new Date(startTime * 1000).toISOString()}`);
  console.log(`- End Time: ${new Date(endTime * 1000).toISOString()}`);

  // 部署 LiquidityMining 合约
  const liquidityMining = await deploy("LiquidityMining", {
    from: deployer,
    args: [rewardTokenAddress, rewardPerSecond, startTime, endTime],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  console.log(`LiquidityMining deployed at: ${liquidityMining.address}`);
};

func.tags = ["LiquidityMining", "Mining", "All"];
func.dependencies = ["MockTokens"]; // 确保在部署代币之后部署

export default func;