import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const P2PLendingModule = buildModule("P2PLendingMarketplace", (m) => {
  // 部署多个模拟代币用于测试
  const tokenA = m.contract("MockToken", ["Token A", "TKA", 18]);
  const tokenB = m.contract("MockToken", ["Token B", "TKB", 18]);

  // 部署点对点借贷市场合约
  const lendingMarketplace = m.contract("P2PLendingMarketplace");

  // 为测试账户铸造代币
  m.call(tokenA, "mint", [m.getAccount(0), "1000000000000000000000000"]); // 100万代币
  m.call(tokenB, "mint", [m.getAccount(0), "1000000000000000000000000"]); // 100万代币

  return { tokenA, tokenB, lendingMarketplace };
});

export default P2PLendingModule; 