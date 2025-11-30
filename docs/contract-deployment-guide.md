# 合约部署指南

## 目录
1. [部署准备](#部署准备)
2. [合约部署顺序](#合约部署顺序)
3. [初始化配置](#初始化配置)
4. [部署后验证](#部署后验证)
5. [常见问题](#常见问题)

## 部署准备

### 环境要求
- Node.js v16 或更高版本
- Hardhat 开发环境
- 以太坊钱包（如MetaMask）
- 测试网或主网的RPC节点

### 依赖安装
```bash
npm install
```

### 网络配置
在 `hardhat.config.js` 中配置网络参数：
```javascript
module.exports = {
  networks: {
    sepolia: {
      url: "YOUR_SEPOLIA_RPC_URL",
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: "YOUR_MAINNET_RPC_URL",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

## 合约部署顺序

### 1. 部署基础接口合约
```bash
npx hardhat run scripts/deploy-interfaces.js --network sepolia
```

### 2. 部署Checker合约
```bash
npx hardhat run scripts/deploy-checkers.js --network sepolia
```

包括：
- IChecker 接口合约
- PersonalChecker 合约
- PoolChecker 合约

### 3. 部署LendingPool合约
```bash
npx hardhat run scripts/deploy-pool.js --network sepolia
```

### 4. 部署UnifiedMatchingEngine合约
```bash
npx hardhat run scripts/deploy-engine.js --network sepolia
```

### 5. 配置各组件间的关系
```bash
npx hardhat run scripts/configure-contracts.js --network sepolia
```

## 初始化配置

### 配置预言机地址
为支持的资产配置Chainlink预言机地址：
```javascript
await lendingPool.addSupportedToken(
  "TOKEN_ADDRESS", 
  "PRICE_FEED_ADDRESS"
);
```

### 设置验证参数
配置池参数：
```javascript
await lendingPool.updatePoolParams(
  100,  // 最低利率 1%
  31536000,  // 最长借款期限 1年
  20000  // 最低抵押率 200%
);
```

### 添加支持的资产类型
```javascript
await lendingPool.addSupportedToken(
  "USDC_TOKEN_ADDRESS",
  "USDC_PRICE_FEED_ADDRESS"
);

await lendingPool.addSupportedToken(
  "ETH_TOKEN_ADDRESS", 
  "ETH_PRICE_FEED_ADDRESS"
);
```

### 注册Checker地址
在UnifiedMatchingEngine中注册Checker地址：
```javascript
await unifiedMatchingEngine.registerChecker(
  "PERSONAL_CHECKER_ADDRESS",
  "POOL_CHECKER_ADDRESS"
);
```

### 设置管理员权限
确保合约所有权正确设置：
```javascript
await lendingPool.transferOwnership("ADMIN_ADDRESS");
await unifiedMatchingEngine.transferOwnership("ADMIN_ADDRESS");
```

## 部署后验证

### 合约地址确认
确认所有合约已正确部署并记录地址：
- UnifiedMatchingEngine: `0x...`
- PersonalChecker: `0x...`
- PoolChecker: `0x...`
- LendingPool: `0x...`

### 功能测试
1. 部署测试代币：
```bash
npx hardhat run scripts/deploy-test-tokens.js --network sepolia
```

2. 执行基本功能测试：
```bash
npx hardhat test test/deployment.test.js
```

### 参数验证
验证关键参数已正确设置：
- 检查预言机地址是否正确
- 验证池参数是否符合预期
- 确认Checker地址已注册

## 常见问题

### 部署失败
如果部署过程中出现错误，请检查：
1. 网络连接是否正常
2. 私钥是否正确配置
3. Gas费用是否充足
4. 合约编译是否成功

### 参数配置错误
如果参数配置出现问题：
1. 检查地址格式是否正确
2. 确认预言机地址是否有效
3. 验证参数范围是否合理

### 权限问题
如果遇到权限相关错误：
1. 确认当前账户是否为合约所有者
2. 检查是否已完成所有权转移
3. 验证管理员地址是否正确

### 升级和维护
合约支持升级机制，可以通过以下步骤进行升级：
1. 部署新版本合约
2. 迁移旧合约状态
3. 更新相关配置
4. 验证升级后的功能