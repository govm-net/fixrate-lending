# FixRate - 固定利率借贷平台

FixRate是一个基于以太坊的固定利率借贷平台，允许用户以固定利率借出和借入加密货币。该项目包含智能合约和前端界面，支持多种代币和网络。

## 项目结构

- `/contracts`: 智能合约源代码
- `/deploy`: 部署脚本
- `/frontend`: React前端应用
- `/scripts`: 实用工具脚本
- `/test`: 合约测试

## 功能特点

- 固定利率借贷
- 多代币支持 (USDC, DAI, WETH, WBTC)
- 抵押品管理
- 借贷市场
- 多网络支持

## 快速开始

### 安装依赖

```bash
# 安装项目依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 启动本地开发环境

1. 启动本地区块链网络:

```bash
# 使用Hardhat
npx hardhat node

# 或使用Ganache
ganache-cli -p 7545
```

2. 部署合约并更新前端配置:

```bash
# 一键部署和更新前端配置
node scripts/deploy-and-update.js hardhat  # 或 ganache
```

3. 发放测试代币和ETH:

```bash
# 发放测试代币到默认地址
npx hardhat run scripts/mint-test-tokens.ts --network localhost

# 发放测试代币到指定地址
RECIPIENT=0x123... npx hardhat run scripts/mint-test-tokens.ts --network localhost

# 发送测试ETH到指定地址
RECIPIENT=0x123... AMOUNT=5 npx hardhat run scripts/send-test-eth.ts --network localhost

# 一键部署、更新配置并发放测试代币
node scripts/deploy-update-mint.js localhost [接收者地址]
```

4. 启动前端应用:

```bash
cd frontend
npm start
```

5. 在浏览器中访问: `http://localhost:3000`

## 部署到测试网络

```bash
# 部署到Sepolia测试网
node scripts/deploy-and-update.js sepolia

# 部署到Mumbai测试网
node scripts/deploy-and-update.js mumbai
```

## 发放测试代币和ETH

项目提供了便捷的脚本用于发放测试代币和ETH，方便开发和测试：

### 发送测试ETH

使用 `send-test-eth.ts` 脚本向指定地址发送测试ETH：

```bash
# 使用默认参数发送测试ETH
npx hardhat run scripts/send-test-eth.ts --network localhost

# 指定接收者地址和金额
RECIPIENT=0x123... AMOUNT=5 npx hardhat run scripts/send-test-eth.ts --network localhost
```

参数说明：
- `RECIPIENT`: 接收者地址（默认为预设地址）
- `AMOUNT`: 发送的ETH数量，单位为ETH（默认为1）
- `--network`: 指定网络（localhost、hardhat、ganache等）

### 铸造测试代币

使用 `mint-test-tokens.ts` 脚本向指定地址铸造测试代币：

```bash
# 使用默认参数铸造测试代币
npx hardhat run scripts/mint-test-tokens.ts --network localhost

# 指定接收者地址
RECIPIENT=0x123... npx hardhat run scripts/mint-test-tokens.ts --network localhost
```

参数说明：
- `RECIPIENT`: 接收者地址（默认为部署者地址）
- `--network`: 指定网络（localhost、hardhat、ganache等）

默认铸造的代币数量：
- 10,000 USDC (6位小数)
- 10,000 DAI (18位小数)
- 10 WETH (18位小数)
- 1 WBTC (8位小数)

### 一键部署和发放测试代币

使用 `deploy-update-mint.js` 脚本一键完成部署、配置更新和测试代币发放：

```bash
# 部署、更新配置并为默认地址发放测试代币
node scripts/deploy-update-mint.js localhost

# 部署、更新配置并为指定地址发放测试代币和ETH
node scripts/deploy-update-mint.js localhost 0x123...
```

## 开发指南

### 智能合约开发

1. 修改合约代码 (`/contracts` 目录)
2. 编译合约:

```bash
npx hardhat compile
```

3. 测试合约:

```bash
npx hardhat test
```

4. 部署合约:

```bash
npx hardhat deploy --network <network-name>
```

### 前端开发

前端应用位于 `/frontend` 目录，使用React框架开发。

```bash
cd frontend
npm start  # 启动开发服务器
npm build  # 构建生产版本
```

## 脚本工具

项目包含多个实用脚本，用于自动化部署和配置过程:

- `scripts/deploy-and-update.js`: 一键部署合约并更新前端配置
- `scripts/simple-update-config.js`: 从部署信息更新前端配置
- `scripts/update-config-from-console.js`: 从控制台输出更新前端配置
- `scripts/send-test-eth.ts`: 发送测试ETH到指定地址
- `scripts/mint-test-tokens.ts`: 铸造测试代币到指定地址
- `scripts/deploy-update-mint.js`: 一键部署、更新配置并发放测试代币

详细说明请参考 [脚本README](./scripts/README.md)。

## 网络配置

项目支持多个网络:

- **本地开发**:
  - Hardhat: `http://127.0.0.1:8545` (链ID: 31337)
  - Ganache: `http://127.0.0.1:7545` (链ID: 1337)

- **测试网**:
  - Sepolia: `https://sepolia.infura.io/v3/your-infura-key` (链ID: 11155111)
  - Mumbai: `https://rpc-mumbai.maticvigil.com` (链ID: 80001)

- **主网**:
  - Ethereum: `https://mainnet.infura.io/v3/your-infura-key` (链ID: 1)
  - Polygon: `https://polygon-rpc.com` (链ID: 137)

## 许可证

MIT
