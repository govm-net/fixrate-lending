# FixRate Lending 合约部署指南

本文档详细介绍了如何部署 FixRate Lending 项目的智能合约。

## 目录

1. [环境准备](#环境准备)
2. [配置部署环境](#配置部署环境)
3. [部署合约](#部署合约)
   - [使用传统部署脚本](#使用传统部署脚本)
   - [使用 Hardhat Ignition](#使用-hardhat-ignition)
   - [使用 Hardhat Deploy](#使用-hardhat-deploy)
4. [验证合约](#验证合约)
5. [合约交互](#合约交互)
6. [常见问题与解决方案](#常见问题与解决方案)

## 环境准备

在开始部署前，请确保您的系统满足以下要求：

- Node.js (推荐 v16.x 或更高版本)
- npm (v8.x 或更高版本) 或 yarn (v1.22.x 或更高版本)
- Git

您可以使用以下命令检查您的环境：

```bash
node -v
npm -v
git --version
```

## 配置部署环境

1. 克隆项目仓库：

```bash
git clone https://github.com/govm-net/fixrate-lending.git
cd fixrate-lending
```

2. 安装依赖：

```bash
npm install
# 或者使用 yarn
yarn install
```

3. 配置环境变量：

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入您的私钥和 API 密钥：

```
# 部署账户的私钥（不要提交到 Git 仓库）
PRIVATE_KEY=your_private_key_here

# Infura API 密钥，用于连接以太坊网络
INFURA_API_KEY=your_infura_api_key_here

# 区块链浏览器 API 密钥，用于验证合约
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Gas 价格设置（可选，单位为 Gwei）
GAS_PRICE_MAINNET=20
GAS_PRICE_TESTNET=3

# 网络类型（mainnet 或 testnet）
NETWORK_TYPE=testnet
```

> 注意：请确保您的私钥安全，不要将包含私钥的 `.env` 文件提交到 Git 仓库。该文件已经在 `.gitignore` 中配置为忽略。

4. 网络配置：

项目的 `hardhat.config.ts` 文件已经配置了多个网络，包括：

- **本地网络**：hardhat（内置）和 localhost
- **以太坊网络**：sepolia（测试网）和 mainnet（主网）
- **Polygon 网络**：mumbai（测试网）和 polygon（主网）
- **BSC 网络**：bscTestnet（测试网）和 bsc（主网）

如果需要修改网络配置，可以编辑 `hardhat.config.ts` 文件。

## 部署合约

### 部署方法

我们提供了三种部署合约的方法：

#### 1. 传统部署脚本

使用传统的 Hardhat 部署脚本，这种方法不会自动保存部署信息。

```bash
# 在本地网络部署
npx hardhat run scripts/deploy.ts --network localhost

# 在测试网络部署（以太坊 Sepolia）
npx hardhat run scripts/deploy.ts --network sepolia

# 在测试网络部署（Polygon Mumbai）
npx hardhat run scripts/deploy.ts --network mumbai

# 在测试网络部署（BSC 测试网）
npx hardhat run scripts/deploy.ts --network bscTestnet

# 在主网部署（以太坊）
npx hardhat run scripts/deploy.ts --network mainnet

# 在主网部署（Polygon）
npx hardhat run scripts/deploy.ts --network polygon

# 在主网部署（BSC）
npx hardhat run scripts/deploy.ts --network bsc
```

#### 2. Hardhat Ignition

使用 Hardhat Ignition 框架，它会自动将部署信息保存到本地文件中。

```bash
# 在本地网络部署
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network localhost

# 在测试网络部署（以太坊 Sepolia）
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network sepolia

# 在测试网络部署（Polygon Mumbai）
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network mumbai

# 在测试网络部署（BSC 测试网）
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network bscTestnet

# 在主网部署（以太坊）
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network mainnet

# 在主网部署（Polygon）
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network polygon

# 在主网部署（BSC）
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network bsc
```

部署完成后，Hardhat Ignition 会将部署信息保存在 `ignition/deployments` 目录下，按网络名称分类。

#### 3. Hardhat Deploy

使用 Hardhat Deploy 插件，这是一个更成熟的部署框架，它会自动将部署信息保存到本地文件中，并提供更多功能。

```bash
# 在本地网络部署
npx hardhat deploy --network localhost

# 在测试网络部署（以太坊 Sepolia）
npx hardhat deploy --network sepolia

# 在测试网络部署（Polygon Mumbai）
npx hardhat deploy --network mumbai

# 在测试网络部署（BSC 测试网）
npx hardhat deploy --network bscTestnet

# 在主网部署（以太坊）
npx hardhat deploy --network mainnet

# 在主网部署（Polygon）
npx hardhat deploy --network polygon

# 在主网部署（BSC）
npx hardhat deploy --network bsc
```

部署完成后，Hardhat Deploy 会将部署信息保存在 `deployments` 目录下，按网络名称分类。每个合约的部署信息包括：

- 合约地址
- 部署交易哈希
- 构造函数参数
- 合约 ABI
- 字节码

这些信息可以在前端或其他应用中使用，以便与已部署的合约交互。

### 部署后

部署完成后，您将看到类似以下的输出：

```
Deploying contracts with the account: 0x...
Network: sepolia
Is testnet: true
P2PLendingMarketplace deployed at: 0x...
FixedRateLendingPool deployed at: 0x...
Set marketplace address 0x... in lending pool
```

请记录下部署的合约地址，以便后续验证和交互。

## 验证合约

为了让用户能够在区块链浏览器上查看合约代码，您需要验证合约。部署脚本会输出验证命令，您可以直接复制并执行。

例如：

```bash
# 验证 P2PLendingMarketplace 合约
npx hardhat verify --network sepolia 0x1234567890abcdef

# 验证 FixedRateLendingPool 合约（带构造函数参数）
npx hardhat verify --network sepolia 0xabcdef1234567890 500 31536000 15000
```

## 合约交互

部署完成后，您可以通过以下方式与合约交互：

### 使用 Hardhat 控制台

```bash
npx hardhat console --network sepolia
```

然后在控制台中：

```javascript
// 获取合约实例
const marketplace = await ethers.getContractAt("P2PLendingMarketplace", "0x1234567890abcdef");
const lendingPool = await ethers.getContractAt("FixedRateLendingPool", "0xabcdef1234567890");

// 调用合约方法
await lendingPool.addSupportedToken("0xTokenAddress", "0xPriceFeedAddress");
```

### 使用前端应用

部署完成后，您需要更新前端应用中的合约地址。在 `frontend` 目录中，创建或编辑 `.env.production` 文件：

```
REACT_APP_MARKETPLACE_ADDRESS=0x1234567890abcdef
REACT_APP_LENDING_POOL_ADDRESS=0xabcdef1234567890
REACT_APP_CHAIN_ID=11155111  # Sepolia 的 Chain ID
```

各网络的 Chain ID：
- 以太坊主网：1
- Sepolia 测试网：11155111
- Polygon 主网：137
- Mumbai 测试网：80001
- BSC 主网：56
- BSC 测试网：97

## 常见问题与解决方案

### Gas 费用过高

如果部署时遇到 Gas 费用过高的问题，可以尝试以下解决方案：

1. 在非高峰时段进行部署
2. 在 `.env` 文件中调整 Gas 价格设置
3. 使用 Gas 价格较低的网络（如 Polygon 或 BSC）

### 合约验证失败

如果合约验证失败，可能是因为：

1. 编译器版本不匹配：确保验证时使用的编译器版本与部署时相同
2. 构造函数参数错误：检查验证命令中的参数是否与部署时使用的参数一致
3. 合约代码不完整：确保所有导入的合约都已上传
4. API 密钥错误：检查 `.env` 文件中的 API 密钥是否正确

### 合约升级

本项目的合约不支持升级。如果需要更新合约逻辑，需要部署新的合约并迁移数据。

---

如有任何部署问题，请提交 issue 到 [GitHub 仓库](https://github.com/govm-net/fixrate-lending/issues)。 