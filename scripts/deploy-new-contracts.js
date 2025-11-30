const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  // 注释掉这行，因为在hardhat网络中可能不支持
  // console.log("Account balance:", (await deployer.getBalance()).toString());

  // 部署 PersonalChecker
  console.log("\nDeploying PersonalChecker...");
  const PersonalChecker = await ethers.getContractFactory("PersonalChecker");
  const personalChecker = await PersonalChecker.deploy();
  await personalChecker.waitForDeployment();
  console.log("PersonalChecker deployed to:", await personalChecker.getAddress());

  // 部署 PoolChecker
  console.log("\nDeploying PoolChecker...");
  const PoolChecker = await ethers.getContractFactory("PoolChecker");
  const poolChecker = await PoolChecker.deploy(20000); // 200% 最低抵押率
  await poolChecker.waitForDeployment();
  console.log("PoolChecker deployed to:", await poolChecker.getAddress());

  // 部署 UnifiedMatchingEngine
  console.log("\nDeploying UnifiedMatchingEngine...");
  const UnifiedMatchingEngine = await ethers.getContractFactory("UnifiedMatchingEngine");
  const unifiedMatchingEngine = await UnifiedMatchingEngine.deploy();
  await unifiedMatchingEngine.waitForDeployment();
  console.log("UnifiedMatchingEngine deployed to:", await unifiedMatchingEngine.getAddress());

  // 部署 FixedRateLendingPool
  console.log("\nDeploying FixedRateLendingPool...");
  const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
  const lendingPool = await FixedRateLendingPool.deploy(
    100,      // 1% 最低利率
    31536000, // 1年最大期限
    20000     // 200% 最低抵押率
  );
  await lendingPool.waitForDeployment();
  console.log("FixedRateLendingPool deployed to:", await lendingPool.getAddress());

  // 配置合约间关系
  console.log("\nConfiguring contract relationships...");
  
  // 设置借贷池的市场合约地址
  await lendingPool.setMarketplaceAddress(await unifiedMatchingEngine.getAddress());
  console.log("Set marketplace address in lending pool");

  console.log("\nDeployment completed!");
  console.log("=====================================");
  console.log("PersonalChecker:", await personalChecker.getAddress());
  console.log("PoolChecker:", await poolChecker.getAddress());
  console.log("UnifiedMatchingEngine:", await unifiedMatchingEngine.getAddress());
  console.log("FixedRateLendingPool:", await lendingPool.getAddress());
  console.log("=====================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });