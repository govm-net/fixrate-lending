# 前端配置更新脚本

本目录包含用于自动更新前端配置文件的脚本，可以将部署的合约地址信息自动添加到前端的配置文件中。

> **注意**: 为了简化工作流程，我们已将前端配置更新功能集成到 Hardhat 任务中，推荐使用 Hardhat 任务而不是独立脚本。

## 启动本地网络

在部署合约之前，需要先启动本地开发网络。您可以选择使用Hardhat或Ganache：

### 使用Hardhat本地网络

```bash
# 启动Hardhat本地网络
npx hardhat node
```

这将启动一个本地开发网络，监听在 `http://127.0.0.1:8545`，并创建10个测试账户，每个账户有10000个ETH。

### 使用Ganache本地网络

1. 安装Ganache（如果尚未安装）：
   ```bash
   npm install -g ganache-cli
   # 或使用图形界面版本
   # 从 https://trufflesuite.com/ganache/ 下载并安装
   ```

2. 启动Ganache：
   ```bash
   # 命令行版本
   ganache-cli -p 7545
   
   # 或启动图形界面版本
   # 打开Ganache应用程序，默认监听在 http://127.0.0.1:7545
   ```

## 部署合约

项目使用模块化的部署脚本，将不同合约的部署和配置分开，以便更灵活地管理部署过程。

### 部署脚本说明

项目包含以下部署脚本：

1. `01-deploy-mock-tokens.ts` - 部署模拟代币（USDC、DAI、WETH、WBTC）
2. `02-deploy-marketplace.ts` - 部署 P2PLendingMarketplace 合约
3. `03-deploy-lending-pool.ts` - 部署 FixedRateLendingPool 合约
4. `04-configure-contracts.ts` - 配置合约之间的关系

### 部署方式

您可以选择以下方式部署合约：

#### 全部部署

```bash
# 部署所有合约并配置
npx hardhat deploy --network localhost
```

#### 选择性部署

```bash
# 只部署模拟代币
npx hardhat deploy --tags MockTokens --network localhost

# 只部署市场合约
npx hardhat deploy --tags Marketplace --network localhost

# 只部署借贷池合约
npx hardhat deploy --tags LendingPool --network localhost

# 只配置合约关系
npx hardhat deploy --tags Configure --network localhost

# 部署核心合约（市场和借贷池）
npx hardhat deploy --tags Core --network localhost
```

#### 跳过特定部署

您可以通过环境变量跳过特定部署：

```bash
# 跳过模拟代币部署
DEPLOY_MOCK_TOKENS=false npx hardhat deploy --network localhost

# 跳过市场合约部署
DEPLOY_MARKETPLACE=false npx hardhat deploy --network localhost

# 跳过借贷池合约部署
DEPLOY_LENDING_POOL=false npx hardhat deploy --network localhost

# 跳过合约配置
CONFIGURE_CONTRACTS=false npx hardhat deploy --network localhost
```

#### 自定义部署参数

您可以通过环境变量自定义借贷池合约的部署参数：

```bash
# 自定义最小利率（百分比）
MIN_INTEREST_RATE=10 npx hardhat deploy --tags LendingPool --network localhost

# 自定义最大贷款期限（秒）
MAX_LOAN_DURATION=2592000 npx hardhat deploy --tags LendingPool --network localhost

# 自定义最小抵押率（百分比）
MIN_COLLATERAL_RATIO=200 npx hardhat deploy --tags LendingPool --network localhost
```

## 发放测试代币

部署合约后，您可能需要向测试账户发放测试代币和ETH。项目中已经包含了用于发放测试代币和ETH的Hardhat任务。

### 使用Hardhat任务发放测试代币和ETH

项目中包含了两个用于发放测试资金的Hardhat任务：
- `send-test-eth`: 用于发送测试ETH到指定地址
- `mint-test-tokens`: 用于铸造测试代币到指定地址

#### 发送测试ETH

使用 `send-test-eth` 任务向指定地址发送测试ETH：

```bash
# 发送测试ETH到指定地址
npx hardhat send-test-eth --to <接收者地址> --amount <ETH数量> --network localhost

# 示例：发送5个ETH到指定地址
npx hardhat send-test-eth --to 0x123... --amount 5 --network localhost
```

参数说明：
- `--to`: 接收ETH的地址
- `--amount`: 发送的ETH数量，单位为ETH
- `--network`: 指定网络（localhost、hardhat、ganache等）

#### 铸造测试代币

使用 `mint-test-tokens` 任务向指定地址铸造测试代币：

```bash
# 铸造测试代币到指定地址
npx hardhat mint-test-tokens --token <代币合约地址> --to <接收者地址> --amount <代币数量> --network localhost

# 示例：铸造1000个USDC到指定地址
npx hardhat mint-test-tokens --token 0xTokenAddress --to 0x123... --amount 1000 --network localhost
```

参数说明：
- `--token`: 代币合约的地址
- `--to`: 接收代币的地址
- `--amount`: 铸造的代币数量（会根据代币小数位自动转换）
- `--network`: 指定网络（localhost、hardhat、ganache等）

## 集成任务

为了简化工作流程，我们已经将部署、配置更新和代币发放功能集成到 Hardhat 任务中。

### 1. update-frontend-config (更新前端配置)

这个任务用于更新前端配置文件中的合约地址。

**使用方法：**

```bash
# 更新默认网络(localhost)的配置
npx hardhat update-frontend-config

# 更新指定网络的配置
npx hardhat update-frontend-config --net localhost
npx hardhat update-frontend-config --net hardhat
npx hardhat update-frontend-config --net ganache
```

**功能：**
- 自动读取 `deployments/{network}` 目录中的合约部署信息
- 提取主要合约（P2PLendingMarketplace、FixedRateLendingPool）的地址
- 提取代币合约（USDC、DAI、WETH、WBTC）的地址
- 精确定位网络配置部分，避免误修改其他部分
- 自动创建配置文件备份，防止意外修改
- 更新前端配置文件中对应网络的合约地址和代币地址

### 2. deploy-and-update (部署并更新配置)

这个任务用于部署合约并更新前端配置。

**使用方法：**

```bash
# 部署到默认网络(localhost)并更新配置
npx hardhat deploy-and-update

# 部署到指定网络并更新配置
npx hardhat deploy-and-update --net localhost
npx hardhat deploy-and-update --net hardhat
npx hardhat deploy-and-update --net ganache

# 部署特定标签的合约并更新配置
npx hardhat deploy-and-update --tags MockTokens,Core --net localhost
```

**功能：**
- 自动部署合约到指定网络
- 部署完成后自动更新前端配置
- 提供完整的日志输出，方便排查问题

### 3. deploy-update-mint (部署、更新配置并发放测试代币)

这个任务用于部署合约、更新前端配置并发放测试代币。

**使用方法：**

```bash
# 部署到默认网络(localhost)、更新配置，但不发放测试代币
npx hardhat deploy-update-mint

# 部署到指定网络、更新配置并为指定地址发放测试代币
npx hardhat deploy-update-mint --net localhost --recipient 0x123...

# 自定义代币和ETH数量
npx hardhat deploy-update-mint --net localhost --recipient 0x123... --amount 2000 --eth 10

# 部署特定标签的合约、更新配置并发放测试代币
npx hardhat deploy-update-mint --tags MockTokens,Core --net localhost --recipient 0x123...
```

**功能：**
- 自动部署合约到指定网络
- 部署完成后自动更新前端配置
- 自动获取部署的代币地址
- 为指定地址发放测试代币和ETH
- 提供完整的日志输出，方便排查问题

## 使用示例

### 完整流程示例

1. 启动本地网络：
   ```bash
   # 使用Hardhat
   npx hardhat node
   
   # 或使用Ganache
   ganache-cli -p 7545
   ```

2. 部署合约、更新配置并发放测试代币：
   ```bash
   # 一键完成所有操作
   npx hardhat deploy-update-mint --net localhost --recipient 0x123...
   ```

### 分步骤示例

1. 启动本地网络：
   ```bash
   npx hardhat node
   ```

2. 部署合约：
   ```bash
   npx hardhat deploy --network localhost
   ```

3. 更新前端配置：
   ```bash
   npx hardhat update-frontend-config --net localhost
   ```

4. 发放测试代币和ETH：
   ```bash
   # 获取部署的代币地址
   ls -la deployments/localhost/Mock*
   
   # 发送测试ETH
   npx hardhat send-test-eth --to 0x123... --amount 5 --network localhost
   
   # 铸造测试代币
   npx hardhat mint-test-tokens --token 0xTokenAddress --to 0x123... --amount 1000 --network localhost
   ```

## 网络配置说明

- **Hardhat网络**：默认监听在 `http://127.0.0.1:8545`，链ID为 `31337`
- **Ganache网络**：默认监听在 `http://127.0.0.1:7545`，链ID为 `1337`

## 注意事项

- 任务会自动处理不同网络的链ID映射
- 如果找不到某个合约或代币的地址，任务会保留原有配置
- 更新前会显示找到的部署信息，方便确认
- 更新后会显示哪些配置项被成功更新
- 更新前端配置时会自动创建配置文件备份，以防意外修改
- 确保在部署合约前已经启动了对应的本地网络
- 如果使用Hardhat网络，确保使用 `npx hardhat node` 而不是 `npx hardhat run` 