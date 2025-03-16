import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deployer } = await getNamedAccounts();

  console.log(`Configuring contracts with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);

  // 获取已部署的合约
  const marketplace = await deployments.get("P2PLendingMarketplace");
  const lendingPool = await deployments.get("FixedRateLendingPool");

  // 检查是否为测试网络
  const isTestnet = process.env.NETWORK_TYPE === "testnet" || 
                    network.name === "hardhat" || 
                    network.name === "localhost" || 
                    network.name.includes("test") || 
                    network.name === "sepolia" || 
                    network.name === "mumbai";

  // 1. 设置 marketplace 地址到 lending pool
  console.log(`Setting marketplace address (${marketplace.address}) in lending pool...`);
  
  try {
    // 使用通用方式获取合约实例，避免类型错误
    const lendingPoolContract = await ethers.getContractAt(
      ["function setMarketplaceAddress(address) external"],
      lendingPool.address
    );
    
    // 设置市场地址
    const tx1 = await lendingPoolContract.setMarketplaceAddress(marketplace.address);
    await tx1.wait();
    console.log(`Set marketplace address in lending pool - tx: ${tx1.hash}`);
  } catch (error: any) {
    console.error(`Error setting marketplace address:`, error.message || error);
    console.log(`This might be because the address is already set or you don't have permission.`);
  }

  // 2. 如果是测试网络，配置支持的代币
  if (isTestnet) {
    try {
      // 获取模拟代币
      const mockUSDC = await deployments.get("MockUSDC");
      const mockDAI = await deployments.get("MockDAI");
      const mockWETH = await deployments.get("MockWETH");
      const mockWBTC = await deployments.get("MockWBTC");

      // 使用通用方式获取市场合约实例，避免类型错误
      const marketplaceContract = await ethers.getContractAt(
        ["function addSupportedToken(address) external"],
        marketplace.address
      );

      // 添加支持的代币到市场合约
      console.log(`Adding supported tokens to marketplace...`);
      
      // 添加USDC
      try {
        const tx2 = await marketplaceContract.addSupportedToken(mockUSDC.address);
        await tx2.wait();
        console.log(`Added USDC to supported tokens - tx: ${tx2.hash}`);
      } catch (error: any) {
        console.log(`USDC might already be added or there was an error:`, error.message || error);
      }

      // 添加DAI
      try {
        const tx3 = await marketplaceContract.addSupportedToken(mockDAI.address);
        await tx3.wait();
        console.log(`Added DAI to supported tokens - tx: ${tx3.hash}`);
      } catch (error: any) {
        console.log(`DAI might already be added or there was an error:`, error.message || error);
      }

      // 添加WETH
      try {
        const tx4 = await marketplaceContract.addSupportedToken(mockWETH.address);
        await tx4.wait();
        console.log(`Added WETH to supported tokens - tx: ${tx4.hash}`);
      } catch (error: any) {
        console.log(`WETH might already be added or there was an error:`, error.message || error);
      }

      // 添加WBTC
      try {
        const tx5 = await marketplaceContract.addSupportedToken(mockWBTC.address);
        await tx5.wait();
        console.log(`Added WBTC to supported tokens - tx: ${tx5.hash}`);
      } catch (error: any) {
        console.log(`WBTC might already be added or there was an error:`, error.message || error);
      }

      console.log(`Token configuration completed!`);
    } catch (error: any) {
      console.error(`Error configuring tokens:`, error.message || error);
      console.log(`Make sure mock tokens are deployed before running this script.`);
      console.log(`You can deploy mock tokens with: npx hardhat deploy --tags MockTokens`);
    }
  }

  console.log(`Contract configuration completed!`);
};

func.tags = ["Configure", "All"];
func.dependencies = ["Marketplace", "LendingPool"]; // 确保在配置前已部署市场和借贷池合约
func.skip = async (hre) => {
  // 如果明确指定不配置合约，则跳过
  return process.env.CONFIGURE_CONTRACTS === "false";
};

export default func; 