// scripts/deploy.js
const { ethers, network } = require("hardhat");
const { formatEther, formatUnits, parseEther, parseUnits } = require("ethers");

async function main() {
  console.log("Starting deployment process...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  // 显示部署账户余额
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${formatEther(deployerBalance)} ETH`);
  
  // 部署 P2PLendingMarketplace 合约
  console.log("\nDeploying P2PLendingMarketplace...");
  const P2PLendingMarketplace = await ethers.getContractFactory("P2PLendingMarketplace");
  const marketplace = await P2PLendingMarketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`P2PLendingMarketplace deployed to: ${marketplaceAddress}`);
  
  // 部署 FixedRateLendingPool 合约
  console.log("\nDeploying FixedRateLendingPool...");
  // 设置池参数
  const minInterestRate = 500; // 5% (500 基点)
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1年（秒）
  const minCollateralRatio = 15000; // 150% (15000 基点)
  
  const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
  const lendingPool = await FixedRateLendingPool.deploy(
    minInterestRate,
    maxLoanDuration,
    minCollateralRatio
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log(`FixedRateLendingPool deployed to: ${lendingPoolAddress}`);
  
  // 设置市场合约地址
  console.log("\nConfiguring contracts...");
  await lendingPool.setMarketplaceAddress(marketplaceAddress);
  console.log("Set marketplace address in lending pool");
  
  // 部署测试代币（仅在测试网络上）
  if (network.name !== "mainnet" && network.name !== "polygon") {
    console.log("\nDeploying mock tokens for testing...");
    
    // 部署 USDC 模拟代币
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockUSDC = await MockToken.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log(`Mock USDC deployed to: ${mockUSDCAddress}`);
    
    // 部署 WETH 模拟代币
    const mockWETH = await MockToken.deploy("Wrapped Ether", "WETH", 18);
    await mockWETH.waitForDeployment();
    const mockWETHAddress = await mockWETH.getAddress();
    console.log(`Mock WETH deployed to: ${mockWETHAddress}`);
    
    // 部署 WBTC 模拟代币
    const mockWBTC = await MockToken.deploy("Wrapped Bitcoin", "WBTC", 8);
    await mockWBTC.waitForDeployment();
    const mockWBTCAddress = await mockWBTC.getAddress();
    console.log(`Mock WBTC deployed to: ${mockWBTCAddress}`);
    
    // 部署价格预言机
    console.log("\nDeploying mock price feeds...");
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    
    // USDC 价格预言机 (1 USDC = $1)
    const usdcPriceFeed = await MockPriceFeed.deploy();
    await usdcPriceFeed.waitForDeployment();
    const usdcPriceFeedAddress = await usdcPriceFeed.getAddress();
    await usdcPriceFeed.setLatestAnswer(100000000); // $1 with 8 decimals
    console.log(`USDC price feed deployed to: ${usdcPriceFeedAddress}`);
    
    // WETH 价格预言机 (假设 1 WETH = $3000)
    const wethPriceFeed = await MockPriceFeed.deploy();
    await wethPriceFeed.waitForDeployment();
    const wethPriceFeedAddress = await wethPriceFeed.getAddress();
    await wethPriceFeed.setLatestAnswer(300000000000); // $3000 with 8 decimals
    console.log(`WETH price feed deployed to: ${wethPriceFeedAddress}`);
    
    // WBTC 价格预言机 (假设 1 WBTC = $50000)
    const wbtcPriceFeed = await MockPriceFeed.deploy();
    await wbtcPriceFeed.waitForDeployment();
    const wbtcPriceFeedAddress = await wbtcPriceFeed.getAddress();
    await wbtcPriceFeed.setLatestAnswer(5000000000000); // $50000 with 8 decimals
    console.log(`WBTC price feed deployed to: ${wbtcPriceFeedAddress}`);
    
    // 将代币添加到借贷池
    console.log("\nAdding tokens to lending pool...");
    await lendingPool.addSupportedToken(mockUSDCAddress, usdcPriceFeedAddress);
    console.log("Added USDC to lending pool");
    
    await lendingPool.addSupportedToken(mockWETHAddress, wethPriceFeedAddress);
    console.log("Added WETH to lending pool");
    
    await lendingPool.addSupportedToken(mockWBTCAddress, wbtcPriceFeedAddress);
    console.log("Added WBTC to lending pool");
    
    // 为测试账户铸造代币
    console.log("\nMinting tokens for deployer...");
    const mintAmount = {
      USDC: parseUnits("1000000", 6),    // 1,000,000 USDC
      WETH: parseEther("1000"),          // 1,000 WETH
      WBTC: parseUnits("100", 8)         // 100 WBTC
    };
    
    await mockUSDC.mint(deployer.address, mintAmount.USDC);
    console.log(`Minted ${formatUnits(mintAmount.USDC, 6)} USDC to ${deployer.address}`);
    
    await mockWETH.mint(deployer.address, mintAmount.WETH);
    console.log(`Minted ${formatEther(mintAmount.WETH)} WETH to ${deployer.address}`);
    
    await mockWBTC.mint(deployer.address, mintAmount.WBTC);
    console.log(`Minted ${formatUnits(mintAmount.WBTC, 8)} WBTC to ${deployer.address}`);
    
    // 向借贷池存入一些资金
    console.log("\nDepositing funds to lending pool...");
    const depositAmount = {
      USDC: parseUnits("500000", 6),    // 500,000 USDC
      WETH: parseEther("500"),          // 500 WETH
      WBTC: parseUnits("50", 8)         // 50 WBTC
    };
    
    // 批准代币转账
    await mockUSDC.approve(lendingPoolAddress, depositAmount.USDC);
    await mockWETH.approve(lendingPoolAddress, depositAmount.WETH);
    await mockWBTC.approve(lendingPoolAddress, depositAmount.WBTC);
    
    // 存入代币
    await lendingPool.deposit(mockUSDCAddress, depositAmount.USDC);
    console.log(`Deposited ${formatUnits(depositAmount.USDC, 6)} USDC to lending pool`);
    
    await lendingPool.deposit(mockWETHAddress, depositAmount.WETH);
    console.log(`Deposited ${formatEther(depositAmount.WETH)} WETH to lending pool`);
    
    await lendingPool.deposit(mockWBTCAddress, depositAmount.WBTC);
    console.log(`Deposited ${formatUnits(depositAmount.WBTC, 8)} WBTC to lending pool`);
    
    // 输出测试代币和价格预言机地址
    console.log("\n=== Test Tokens and Price Feeds ===");
    console.log(`Mock USDC: ${mockUSDCAddress}`);
    console.log(`Mock WETH: ${mockWETHAddress}`);
    console.log(`Mock WBTC: ${mockWBTCAddress}`);
    console.log(`USDC Price Feed: ${usdcPriceFeedAddress}`);
    console.log(`WETH Price Feed: ${wethPriceFeedAddress}`);
    console.log(`WBTC Price Feed: ${wbtcPriceFeedAddress}`);
  }
  
  // 输出部署摘要
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${network.name}`);
  console.log(`P2PLendingMarketplace: ${marketplaceAddress}`);
  console.log(`FixedRateLendingPool: ${lendingPoolAddress}`);
  
  console.log("\nVerify contracts on Etherscan with:");
  console.log(`npx hardhat verify --network ${network.name} ${marketplaceAddress}`);
  console.log(`npx hardhat verify --network ${network.name} ${lendingPoolAddress} ${minInterestRate} ${maxLoanDuration} ${minCollateralRatio}`);
  
  console.log("\nDeployment completed successfully!");
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 