import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deployer } = await getNamedAccounts();

  console.log(`Configuring contracts with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);

  // 获取已部署的合约
  const matchingEngine = await deployments.get("UnifiedMatchingEngine");
  const lendingPool = await deployments.get("FixedRateLendingPool");

  // 检查是否为测试网络
  const isTestnet = process.env.NETWORK_TYPE === "testnet" || 
                    network.name === "hardhat" || 
                    network.name === "localhost" || 
                    network.name.includes("test") || 
                    network.name === "sepolia" || 
                    network.name === "mumbai";

  // 1. 设置 matching engine 地址到 lending pool
  console.log(`Setting matching engine address (${matchingEngine.address}) in lending pool...`);
  
  try {
    // 使用通用方式获取合约实例，避免类型错误
    const lendingPoolContract = await ethers.getContractAt(
      ["function setMatchingEngineAddress(address) external"],
      lendingPool.address
    );
    
    // 设置市场地址
    const tx1 = await lendingPoolContract.setMatchingEngineAddress(matchingEngine.address);
    await tx1.wait();
    console.log(`Successfully set matching engine address in lending pool`);
  } catch (error) {
    console.error("Error setting matching engine address in lending pool:", error);
  }

  // 2. 如果是测试网络，部署并配置测试代币和预言机
  if (isTestnet) {
    console.log("Configuring test tokens and price feeds...");
    
    try {
      // 获取已部署的测试代币
      const mockUSDC = await deployments.get("MockToken");
      const mockWETH = await deployments.get("MockToken");
      const mockWBTC = await deployments.get("MockToken");
      
      // 获取已部署的价格预言机
      const usdcPriceFeed = await deployments.get("MockPriceFeed");
      const wethPriceFeed = await deployments.get("MockPriceFeed");
      const wbtcPriceFeed = await deployments.get("MockPriceFeed");
      
      // 添加支持的代币到借贷池
      const lendingPoolWithAbi = await ethers.getContractAt(
        ["function addSupportedToken(address, address) external"],
        lendingPool.address
      );
      
      console.log("Adding USDC to lending pool...");
      const tx2 = await lendingPoolWithAbi.addSupportedToken(mockUSDC.address, usdcPriceFeed.address);
      await tx2.wait();
      
      console.log("Adding WETH to lending pool...");
      const tx3 = await lendingPoolWithAbi.addSupportedToken(mockWETH.address, wethPriceFeed.address);
      await tx3.wait();
      
      console.log("Adding WBTC to lending pool...");
      const tx4 = await lendingPoolWithAbi.addSupportedToken(mockWBTC.address, wbtcPriceFeed.address);
      await tx4.wait();
      
      console.log("Successfully configured test tokens and price feeds");
    } catch (error) {
      console.error("Error configuring test tokens and price feeds:", error);
    }
  }

  console.log("Contract configuration completed!");
};

func.tags = ["Configure", "All"];
func.dependencies = ["MatchingEngine", "LendingPool"];

export default func;