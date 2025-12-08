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
      const mockUSDC = await deployments.get("MockUSDC");
      const mockDAI = await deployments.get("MockDAI");
      const mockWETH = await deployments.get("MockWETH");
      const mockWBTC = await deployments.get("MockWBTC");
      
      // 部署价格预言机
      const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
      const usdcPriceFeed = await MockV3Aggregator.deploy(8, 100000000); // $1 with 8 decimals
      await usdcPriceFeed.waitForDeployment();
      
      const daiPriceFeed = await MockV3Aggregator.deploy(8, 100000000); // $1 with 8 decimals
      await daiPriceFeed.waitForDeployment();
      
      const wethPriceFeed = await MockV3Aggregator.deploy(8, 300000000000); // $3000 with 8 decimals
      await wethPriceFeed.waitForDeployment();
      
      const wbtcPriceFeed = await MockV3Aggregator.deploy(8, 5000000000000); // $50000 with 8 decimals
      await wbtcPriceFeed.waitForDeployment();
      
      // 添加支持的代币到借贷池
      const lendingPoolWithAbi = await ethers.getContractAt(
        ["function addSupportedToken(address, address) external"],
        lendingPool.address
      );
      
      console.log("Adding USDC to lending pool...");
      const tx2 = await lendingPoolWithAbi.addSupportedToken(mockUSDC.address, await usdcPriceFeed.getAddress());
      await tx2.wait();
      
      console.log("Adding DAI to lending pool...");
      const tx3 = await lendingPoolWithAbi.addSupportedToken(mockDAI.address, await daiPriceFeed.getAddress());
      await tx3.wait();
      
      console.log("Adding WETH to lending pool...");
      const tx4 = await lendingPoolWithAbi.addSupportedToken(mockWETH.address, await wethPriceFeed.getAddress());
      await tx4.wait();
      
      console.log("Adding WBTC to lending pool...");
      const tx5 = await lendingPoolWithAbi.addSupportedToken(mockWBTC.address, await wbtcPriceFeed.getAddress());
      await tx5.wait();
      
      console.log("Successfully configured test tokens and price feeds");
    } catch (error) {
      console.error("Error configuring test tokens and price feeds:", error);
    }
  }

  // 3. 授权匹配引擎
  try {
    console.log("Authorizing matching engine...");
    const matchingEngineContract = await ethers.getContractAt(
      ["function authorizeChecker(address) external"],
      matchingEngine.address
    );
    
    // 授权借贷池作为检查器
    const tx = await matchingEngineContract.authorizeChecker(lendingPool.address);
    await tx.wait();
    console.log("Successfully authorized lending pool as checker");
  } catch (error) {
    console.error("Error authorizing matching engine:", error);
  }

  console.log("Contract configuration completed!");
};

func.tags = ["Configure", "All"];
func.dependencies = ["MatchingEngine", "LendingPool"];

export default func;