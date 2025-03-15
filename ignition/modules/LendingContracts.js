const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const LendingContractsModule = buildModule("LendingContracts", (m) => {
  // 设置池参数
  const minInterestRate = 500; // 5% (500 基点)
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1年（秒）
  const minCollateralRatio = 15000; // 150% (15000 基点)

  // 部署 P2PLendingMarketplace 合约
  const marketplace = m.contract("P2PLendingMarketplace");

  // 部署 FixedRateLendingPool 合约
  const lendingPool = m.contract("FixedRateLendingPool", [
    minInterestRate,
    maxLoanDuration,
    minCollateralRatio
  ]);

  // 设置市场合约地址
  m.call(lendingPool, "setMarketplaceAddress", [marketplace]);

  // 如果是测试网络，部署模拟代币和价格预言机
  if (process.env.NETWORK_TYPE === "testnet") {
    // 部署 USDC 模拟代币
    const mockUSDC = m.contract("MockToken", ["USD Coin", "USDC", 6]);
    
    // 部署 WETH 模拟代币
    const mockWETH = m.contract("MockToken", ["Wrapped Ether", "WETH", 18]);
    
    // 部署 WBTC 模拟代币
    const mockWBTC = m.contract("MockToken", ["Wrapped Bitcoin", "WBTC", 8]);
    
    // 部署价格预言机
    const usdcPriceFeed = m.contract("MockPriceFeed");
    const wethPriceFeed = m.contract("MockPriceFeed");
    const wbtcPriceFeed = m.contract("MockPriceFeed");
    
    // 设置价格
    m.call(usdcPriceFeed, "setLatestAnswer", [100000000]); // $1 with 8 decimals
    m.call(wethPriceFeed, "setLatestAnswer", [300000000000]); // $3000 with 8 decimals
    m.call(wbtcPriceFeed, "setLatestAnswer", [5000000000000]); // $50000 with 8 decimals
    
    // 将代币添加到借贷池
    m.call(lendingPool, "addSupportedToken", [mockUSDC, usdcPriceFeed]);
    m.call(lendingPool, "addSupportedToken", [mockWETH, wethPriceFeed]);
    m.call(lendingPool, "addSupportedToken", [mockWBTC, wbtcPriceFeed]);

    return {
      marketplace,
      lendingPool,
      mockUSDC,
      mockWETH,
      mockWBTC,
      usdcPriceFeed,
      wethPriceFeed,
      wbtcPriceFeed
    };
  }

  return {
    marketplace,
    lendingPool
  };
});

module.exports = LendingContractsModule; 