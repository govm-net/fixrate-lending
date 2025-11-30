import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LendingContractsModule = buildModule("LendingContracts", (m) => {
  // 设置池参数
  const minInterestRate = 500; // 5% (500 基点)
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1年（秒）
  const minCollateralRatio = 15000; // 150% (15000 基点)

  // 部署 UnifiedMatchingEngine 合约
  const matchingEngine = m.contract("UnifiedMatchingEngine");

  // 部署 FixedRateLendingPool 合约
  const lendingPool = m.contract("FixedRateLendingPool", [
    minInterestRate,
    maxLoanDuration,
    minCollateralRatio
  ]);

  // 部署 PersonalChecker 合约
  const personalChecker = m.contract("PersonalChecker");

  // 部署 PoolChecker 合约
  const poolChecker = m.contract("PoolChecker", [minCollateralRatio]);

  // 设置匹配引擎地址
  m.call(lendingPool, "setMatchingEngineAddress", [matchingEngine]);

  // 授权 PersonalChecker 和 PoolChecker 合约
  m.call(matchingEngine, "authorizeChecker", [personalChecker]);
  m.call(matchingEngine, "authorizeChecker", [poolChecker]);

  // 如果是测试网络，部署模拟代币和价格预言机
  if (process.env.NETWORK_TYPE === "testnet") {
    // 部署 USDC 模拟代币
    const mockUSDC = m.contract("MockToken", ["USD Coin", "USDC", 6]);
    
    // 部署 WETH 模拟代币
    const mockWETH = m.contract("MockToken", ["Wrapped Ether", "WETH", 18]);
    
    // 部署 WBTC 模拟代币
    const mockWBTC = m.contract("MockToken", ["Wrapped Bitcoin", "WBTC", 8]);
    
    // 部署价格预言机
    const usdcPriceFeed = m.contract("MockV3Aggregator", [8, 100000000]); // $1 with 8 decimals
    const wethPriceFeed = m.contract("MockV3Aggregator", [8, 300000000000]); // $3000 with 8 decimals
    const wbtcPriceFeed = m.contract("MockV3Aggregator", [8, 5000000000000]); // $50000 with 8 decimals
    
    // 设置价格
    m.call(usdcPriceFeed, "updateAnswer", [100000000]); // $1 with 8 decimals
    m.call(wethPriceFeed, "updateAnswer", [300000000000]); // $3000 with 8 decimals
    m.call(wbtcPriceFeed, "updateAnswer", [5000000000000]); // $50000 with 8 decimals
    
    return { 
      matchingEngine, 
      lendingPool, 
      personalChecker,
      poolChecker,
      mockUSDC, 
      mockWETH, 
      mockWBTC, 
      usdcPriceFeed, 
      wethPriceFeed, 
      wbtcPriceFeed 
    };
  }

  return { matchingEngine, lendingPool, personalChecker, poolChecker };
});

export default LendingContractsModule;