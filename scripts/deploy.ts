// scripts/deploy.ts
import { ethers } from "hardhat";
import { MockERC20__factory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name}`);

  // 检查是否为测试网络
  const isTestnet = process.env.NETWORK_TYPE === "testnet" || 
                    network.name === "hardhat" || 
                    network.name === "localhost" || 
                    network.name.includes("test") || 
                    network.name === "sepolia" || 
                    network.name === "mumbai";
  console.log(`Is testnet: ${isTestnet}`);

  // 部署 P2PLendingMarketplace 合约
  const P2PLendingMarketplace = await ethers.getContractFactory("P2PLendingMarketplace");
  const marketplace = await P2PLendingMarketplace.deploy();
  await marketplace.waitForDeployment();
  console.log(`P2PLendingMarketplace deployed at: ${await marketplace.getAddress()}`);

  // 部署 FixedRateLendingPool 合约
  const minInterestRate = ethers.parseUnits("5", 16); // 5% 年利率
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1年（以秒为单位）
  const minCollateralRatio = ethers.parseUnits("150", 16); // 150% 抵押率

  const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
  const lendingPool = await FixedRateLendingPool.deploy(
    minInterestRate,
    maxLoanDuration,
    minCollateralRatio
  );
  await lendingPool.waitForDeployment();
  console.log(`FixedRateLendingPool deployed at: ${await lendingPool.getAddress()}`);

  // 设置 marketplace 地址到 lending pool
  const marketplaceAddress = await marketplace.getAddress();
  const tx = await lendingPool.setMarketplaceAddress(marketplaceAddress);
  await tx.wait();
  console.log(`Set marketplace address ${marketplaceAddress} in lending pool`);

  // 如果是测试网络，部署模拟代币和价格预言机
  if (isTestnet) {
    // 部署 USDC 模拟代币
    const MockERC20Factory = await ethers.getContractFactory("MockERC20") as MockERC20__factory;
    const usdcToken = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdcToken.waitForDeployment();
    console.log(`Mock USDC deployed at: ${await usdcToken.getAddress()}`);

    // 部署 WETH 模拟代币
    const wethToken = await MockERC20Factory.deploy("Wrapped Ether", "WETH", 18);
    await wethToken.waitForDeployment();
    console.log(`Mock WETH deployed at: ${await wethToken.getAddress()}`);

    // 部署 WBTC 模拟代币
    const wbtcToken = await MockERC20Factory.deploy("Wrapped Bitcoin", "WBTC", 8);
    await wbtcToken.waitForDeployment();
    console.log(`Mock WBTC deployed at: ${await wbtcToken.getAddress()}`);

    // 部署价格预言机
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const usdcPriceFeed = await MockV3Aggregator.deploy(8, ethers.parseUnits("1", 8)); // 8位小数，1 USD
    await usdcPriceFeed.waitForDeployment();
    console.log(`USDC Price Feed deployed at: ${await usdcPriceFeed.getAddress()}`);

    const ethPriceFeed = await MockV3Aggregator.deploy(8, ethers.parseUnits("2000", 8)); // 8位小数，2000 USD
    await ethPriceFeed.waitForDeployment();
    console.log(`ETH Price Feed deployed at: ${await ethPriceFeed.getAddress()}`);

    const btcPriceFeed = await MockV3Aggregator.deploy(8, ethers.parseUnits("30000", 8)); // 8位小数，30000 USD
    await btcPriceFeed.waitForDeployment();
    console.log(`BTC Price Feed deployed at: ${await btcPriceFeed.getAddress()}`);

    // 将代币添加到借贷池
    try {
      // 添加 USDC 作为支持的代币
      const usdcAddress = await usdcToken.getAddress();
      const usdcPriceFeedAddress = await usdcPriceFeed.getAddress();
      const isUsdcSupported = await lendingPool.supportedTokens(usdcAddress);
      if (!isUsdcSupported) {
        const tx1 = await lendingPool.addSupportedToken(usdcAddress, usdcPriceFeedAddress);
        await tx1.wait();
        console.log(`Added USDC to supported tokens with price feed ${usdcPriceFeedAddress}`);
      }

      // 添加 WETH 作为支持的代币
      const wethAddress = await wethToken.getAddress();
      const ethPriceFeedAddress = await ethPriceFeed.getAddress();
      const isWethSupported = await lendingPool.supportedTokens(wethAddress);
      if (!isWethSupported) {
        const tx2 = await lendingPool.addSupportedToken(wethAddress, ethPriceFeedAddress);
        await tx2.wait();
        console.log(`Added WETH to supported tokens with price feed ${ethPriceFeedAddress}`);
      }

      // 添加 WBTC 作为支持的代币
      const wbtcAddress = await wbtcToken.getAddress();
      const btcPriceFeedAddress = await btcPriceFeed.getAddress();
      const isWbtcSupported = await lendingPool.supportedTokens(wbtcAddress);
      if (!isWbtcSupported) {
        const tx3 = await lendingPool.addSupportedToken(wbtcAddress, btcPriceFeedAddress);
        await tx3.wait();
        console.log(`Added WBTC to supported tokens with price feed ${btcPriceFeedAddress}`);
      }

      // 为测试账户铸造一些代币
      // 铸造 10,000 USDC
      await usdcToken.mint(deployer.address, ethers.parseUnits("10000", 6));
      console.log(`Minted 10,000 USDC to ${deployer.address}`);

      // 铸造 10 WETH
      await wethToken.mint(deployer.address, ethers.parseEther("10"));
      console.log(`Minted 10 WETH to ${deployer.address}`);

      // 铸造 1 WBTC
      await wbtcToken.mint(deployer.address, ethers.parseUnits("1", 8));
      console.log(`Minted 1 WBTC to ${deployer.address}`);
    } catch (error) {
      console.error("Error adding supported tokens:", error);
    }
  }

  // 输出部署验证命令
  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network ${network.name} ${await marketplace.getAddress()}`);
  console.log(`npx hardhat verify --network ${network.name} ${await lendingPool.getAddress()} ${minInterestRate} ${maxLoanDuration} ${minCollateralRatio}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 