# 部署指南

## 目录
1. [系统要求](#系统要求)
2. [环境配置](#环境配置)
3. [合约部署](#合约部署)
4. [初始化配置](#初始化配置)
5. [前端部署](#前端部署)
6. [测试和验证](#测试和验证)
7. [生产环境部署](#生产环境部署)

## 系统要求

### 开发环境
- Node.js v16 或更高版本
- npm 或 yarn 包管理器
- Git 版本控制系统

### 区块链环境
- 支持的网络：以太坊主网、Sepolia测试网、Polygon、BSC
- RPC节点访问权限
- 钱包私钥（用于部署和交易签名）

### 开发工具
- Hardhat 开发环境
- Solidity 编译器 (0.8.28 或兼容版本)
- Ethers.js 或 Web3.js 库

## 环境配置

### 1. 克隆代码仓库
```bash
git clone <repository-url>
cd fixrate-lending
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
创建 `.env` 文件：
```env
PRIVATE_KEY=your_wallet_private_key
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

### 4. 配置网络
在 `hardhat.config.js` 中配置网络参数：
```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

## 合约部署

### 部署顺序
按照以下顺序部署合约以确保正确的依赖关系：

1. **部署基础接口合约**
```bash
npx hardhat run scripts/deploy-interfaces.js --network sepolia
```

2. **部署Checker合约**
```bash
npx hardhat run scripts/deploy-checkers.js --network sepolia
```

3. **部署LendingPool合约**
```bash
npx hardhat run scripts/deploy-pool.js --network sepolia
```

4. **部署UnifiedMatchingEngine合约**
```bash
npx hardhat run scripts/deploy-engine.js --network sepolia
```

### 部署脚本示例
`scripts/deploy-engine.js`:
```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  // 部署UnifiedMatchingEngine
  const UnifiedMatchingEngine = await ethers.getContractFactory("UnifiedMatchingEngine");
  const engine = await UnifiedMatchingEngine.deploy();
  
  await engine.deployed();
  
  console.log("UnifiedMatchingEngine deployed to:", engine.address);
  
  // 验证合约 (可选)
  // await hre.run("verify:verify", {
  //   address: engine.address,
  //   constructorArguments: [],
  // });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 初始化配置

### 配置预言机地址
为支持的资产配置Chainlink预言机地址：
```javascript
const lendingPool = await ethers.getContractAt("FixedRateLendingPool", "LENDING_POOL_ADDRESS");

await lendingPool.addSupportedToken(
  "USDC_TOKEN_ADDRESS", 
  "USDC_USD_PRICE_FEED_ADDRESS"
);

await lendingPool.addSupportedToken(
  "WETH_TOKEN_ADDRESS", 
  "ETH_USD_PRICE_FEED_ADDRESS"
);
```

### 设置验证参数
配置池参数：
```javascript
await lendingPool.updatePoolParams(
  100,      // 最低利率 1% (100基点)
  31536000, // 最长借款期限 1年 (秒)
  20000     // 最低抵押率 200% (20000基点)
);
```

### 注册Checker地址
在UnifiedMatchingEngine中注册Checker地址：
```javascript
const engine = await ethers.getContractAt("UnifiedMatchingEngine", "ENGINE_ADDRESS");

await engine.registerChecker(
  "PERSONAL_CHECKER_ADDRESS",
  "POOL_CHECKER_ADDRESS"
);
```

### 配置市场合约地址
在LendingPool中设置市场合约地址：
```javascript
await lendingPool.setMarketplaceAddress("ENGINE_ADDRESS");
```

## 前端部署

### 构建前端应用
```bash
cd frontend
npm install
npm run build
```

### 部署到IPFS
```bash
npm run deploy-ipfs
```

### 部署到传统主机
将构建产物上传到Web服务器或CDN。

### 环境变量配置
在前端应用中配置合约地址：
```javascript
// src/config/contracts.js
export const CONTRACT_ADDRESSES = {
  sepolia: {
    unifiedMatchingEngine: "ENGINE_ADDRESS",
    personalChecker: "PERSONAL_CHECKER_ADDRESS",
    poolChecker: "POOL_CHECKER_ADDRESS",
    lendingPool: "LENDING_POOL_ADDRESS"
  },
  mainnet: {
    unifiedMatchingEngine: "ENGINE_ADDRESS",
    personalChecker: "PERSONAL_CHECKER_ADDRESS",
    poolChecker: "POOL_CHECKER_ADDRESS",
    lendingPool: "LENDING_POOL_ADDRESS"
  }
};
```

## 测试和验证

### 单元测试
运行智能合约单元测试：
```bash
npx hardhat test
```

### 集成测试
运行集成测试：
```bash
npx hardhat test test/integration/*.test.js
```

### 部署后验证
1. 验证合约代码：
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

2. 功能测试：
```bash
npx hardhat run scripts/test-deployment.js --network sepolia
```

### 性能测试
使用测试网进行性能测试，确保Gas消耗在合理范围内。

## 生产环境部署

### 主网部署前检查清单
- [ ] 所有测试通过
- [ ] 合约已审核
- [ ] 安全参数已配置
- [ ] 管理员权限已设置
- [ ] 预言机地址已验证
- [ ] 部署脚本已审查

### 部署步骤
1. 使用新的钱包地址部署
2. 部署到主网：
```bash
npx hardhat run scripts/deploy-mainnet.js --network mainnet
```

3. 验证合约：
```bash
npx hardhat verify --network mainnet CONTRACT_ADDRESS
```

4. 配置参数：
```bash
npx hardhat run scripts/configure-mainnet.js --network mainnet
```

### 监控和维护
- 设置事件监听器监控关键事件
- 定期检查预言机价格更新
- 监控池资金状况
- 准备应急响应计划

### 升级策略
- 使用代理合约支持未来升级
- 制定详细的迁移计划
- 在测试网先行验证升级
- 准备回滚方案