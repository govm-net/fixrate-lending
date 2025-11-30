# 脚本使用说明

## 目录
1. [部署脚本](#部署脚本)
2. [工具脚本](#工具脚本)
3. [测试脚本](#测试脚本)

## 部署脚本

### 部署脚本说明

项目包含以下部署脚本：

1. `01-deploy-mock-tokens.ts` - 部署模拟代币（USDC、DAI、WETH、WBTC）
2. `02-deploy-unified-matching.ts` - 部署 UnifiedMatchingEngine 合约
3. `03-deploy-lending-pool.ts` - 部署 FixedRateLendingPool 合约
4. `04-configure-contracts.ts` - 配置合约之间的关系

### 部署方式

#### 本地开发网络部署
```bash
# 启动本地网络
npx hardhat node

# 在新终端中部署合约
npx hardhat deploy --network localhost
```

#### 测试网络部署
```bash
# 部署到Sepolia测试网络
npx hardhat deploy --network sepolia

# 部署到Mumbai测试网络
npx hardhat deploy --network mumbai

# 部署到BSC测试网络
npx hardhat deploy --network bsc_testnet
```

#### 主网部署
```bash
# 部署到以太坊主网
npx hardhat deploy --network mainnet

# 部署到Polygon主网
npx hardhat deploy --network polygon

# 部署到BSC主网
npx hardhat deploy --network bsc
```

### 部署标签
部署脚本使用标签系统，可以只运行特定的部署脚本：

```bash
# 只部署模拟代币
npx hardhat deploy --tags MockTokens

# 只部署统一撮合引擎
npx hardhat deploy --tags MatchingEngine

# 只部署借贷池
npx hardhat deploy --tags LendingPool

# 只配置合约
npx hardhat deploy --tags Configure
```

## 工具脚本

### 更新前端配置脚本

`update-frontend-config.ts` 脚本用于自动更新前端配置文件中的合约地址。

#### 使用方法
```bash
# 更新本地网络配置
npx hardhat update-frontend-config --net localhost

# 更新Sepolia网络配置
npx hardhat update-frontend-config --net sepolia

# 更新Mumbai网络配置
npx hardhat update-frontend-config --net mumbai

# 更新BSC测试网络配置
npx hardhat update-frontend-config --net bsc_testnet

# 更新以太坊主网配置
npx hardhat update-frontend-config --net mainnet

# 更新Polygon主网配置
npx hardhat update-frontend-config --net polygon

# 更新BSC主网配置
npx hardhat update-frontend-config --net bsc
```

**功能：**
- 自动读取 `deployments/{network}` 目录中的合约部署信息
- 提取主要合约（UnifiedMatchingEngine、FixedRateLendingPool）的地址
- 提取代币合约（USDC、DAI、WETH、WBTC）的地址
- 精确定位网络配置部分，避免误修改其他部分
- 自动创建配置文件备份，防止意外修改
- 更新前端配置文件中对应网络的合约地址和代币地址

### 验证合约脚本

部署后需要验证合约，以便在区块链浏览器上查看源代码。

#### 使用方法
```bash
# 验证Sepolia网络上的合约
npx hardhat verify --network sepolia 0x1234567890abcdef

# 验证带有构造函数参数的合约
npx hardhat verify --network sepolia 0xabcdef1234567890 500 31536000 15000
```

## 测试脚本

### 运行测试
```bash
# 运行所有测试
npx hardhat test

# 运行特定测试文件
npx hardhat test test/FixedRateLendingPool.test.ts

# 运行测试并生成覆盖率报告
npx hardhat coverage
```

### 测试网络测试
```bash
# 在Sepolia测试网络上运行测试
npx hardhat test --network sepolia

# 在Mumbai测试网络上运行测试
npx hardhat test --network mumbai
```