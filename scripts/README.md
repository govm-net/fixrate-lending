# 前端配置更新脚本

本目录包含用于自动更新前端配置文件的脚本，可以将部署的合约地址信息自动添加到前端的配置文件中。

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

## 发放测试代币

部署合约后，您可能需要向测试账户发放测试代币和ETH。项目中已经包含了用于发放测试代币和ETH的脚本。

### 使用现有脚本发放测试代币和ETH

项目中已经包含了两个用于发放测试资金的脚本：
- `scripts/send-test-eth.ts`: 用于发送测试ETH到指定地址
- `scripts/mint-test-tokens.ts`: 用于铸造测试代币到指定地址

#### 发送测试ETH

使用 `send-test-eth.ts` 脚本向指定地址发送测试ETH：

```bash
# 发送测试ETH到指定地址
npx hardhat run scripts/send-test-eth.ts --network localhost

# 指定接收者地址和金额
RECIPIENT=0x123... AMOUNT=5 npx hardhat run scripts/send-test-eth.ts --network localhost
```

默认情况下，脚本会向预设的地址发送1个ETH。您可以通过环境变量修改接收者地址和金额：
- `RECIPIENT`: 接收者地址
- `AMOUNT`: 发送的ETH数量（单位：ETH）

#### 铸造测试代币

使用 `mint-test-tokens.ts` 脚本向指定地址铸造测试代币：

```bash
# 铸造测试代币到指定地址
npx hardhat run scripts/mint-test-tokens.ts --network localhost

# 指定接收者地址
RECIPIENT=0x123... npx hardhat run scripts/mint-test-tokens.ts --network localhost
```

默认情况下，脚本会向部署者地址铸造以下代币：
- 10,000 USDC (6位小数)
- 10,000 DAI (18位小数)
- 10 WETH (18位小数)
- 1 WBTC (8位小数)

您可以通过环境变量 `RECIPIENT` 修改接收者地址。

### 一键部署、更新配置并发放测试代币

您可以创建一个一键部署合约、更新配置并发放测试代币的脚本：

1. 创建脚本文件 `scripts/deploy-update-mint.js`：

```javascript
const { spawn } = require('child_process');
const path = require('path');

// 配置
const NETWORK = process.argv[2] || 'localhost';
const RECIPIENT = process.argv[3]; // 可选的接收者地址

// 执行命令并返回Promise
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`执行命令: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 主函数
async function main() {
  try {
    console.log(`\n=== 开始部署合约到 ${NETWORK} 网络、更新前端配置并发放测试代币 ===\n`);
    
    // 1. 部署合约
    console.log(`\n--- 步骤 1: 部署合约到 ${NETWORK} 网络 ---\n`);
    await executeCommand('npx', ['hardhat', 'deploy', '--network', NETWORK]);
    
    // 2. 更新前端配置
    console.log(`\n--- 步骤 2: 更新前端配置 ---\n`);
    await executeCommand('node', [path.join(__dirname, 'simple-update-config.js'), NETWORK]);
    
    // 3. 发放测试代币
    console.log(`\n--- 步骤 3: 发放测试代币 ---\n`);
    const mintCommand = RECIPIENT 
      ? `RECIPIENT=${RECIPIENT} npx hardhat run ${path.join(__dirname, 'mint-test-tokens.ts')} --network ${NETWORK}`
      : `npx hardhat run ${path.join(__dirname, 'mint-test-tokens.ts')} --network ${NETWORK}`;
    await executeCommand(mintCommand, [], { shell: true });
    
    console.log(`\n=== 部署、配置更新和代币发放完成! ===\n`);
    
  } catch (error) {
    console.error(`\n错误: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main();
```

2. 使用方法：

```bash
# 部署、更新配置并为当前用户发放测试代币
node scripts/deploy-update-mint.js localhost

# 部署、更新配置并为指定地址发放测试代币
node scripts/deploy-update-mint.js localhost 0x123...
```

## 脚本说明

### 0. deploy-and-update.js (一键部署和更新)

这个脚本可以一键完成合约部署和前端配置更新，是最简单的使用方式。

**使用方法：**

```bash
# 部署到默认网络(localhost)并更新配置
node scripts/deploy-and-update.js

# 部署到指定网络并更新配置
node scripts/deploy-and-update.js localhost
node scripts/deploy-and-update.js hardhat
node scripts/deploy-and-update.js ganache
```

**功能：**
- 自动部署合约到指定网络
- 部署完成后自动更新前端配置
- 使用 `simple-update-config.js` 脚本进行配置更新
- 提供完整的日志输出，方便排查问题

### 1. simple-update-config.js (推荐)

这个脚本使用简单的字符串匹配方法，更可靠地从 `deployments` 目录中读取部署信息，并更新前端配置文件。

**使用方法：**

```bash
# 更新默认网络(localhost)的配置
node scripts/simple-update-config.js

# 更新指定网络的配置
node scripts/simple-update-config.js localhost
node scripts/simple-update-config.js hardhat
node scripts/simple-update-config.js ganache
```

**功能：**
- 自动读取 `deployments/{network}` 目录中的合约部署信息
- 提取主要合约（P2PLendingMarketplace、FixedRateLendingPool）的地址
- 提取代币合约（USDC、DAI、WETH、WBTC）的地址
- 精确定位网络配置部分，避免误修改其他部分
- 自动创建配置文件备份，防止意外修改
- 更新前端配置文件中对应网络的合约地址和代币地址

### 2. update-frontend-config.js

这个脚本使用正则表达式从 `deployments` 目录中读取部署信息，并更新前端配置文件。

**使用方法：**

```bash
# 更新默认网络(localhost)的配置
node scripts/update-frontend-config.js

# 更新指定网络的配置
node scripts/update-frontend-config.js localhost
node scripts/update-frontend-config.js hardhat
```

**功能：**
- 自动读取 `deployments/{network}` 目录中的合约部署信息
- 提取主要合约（P2PLendingMarketplace、FixedRateLendingPool）的地址
- 提取代币合约（USDC、DAI、WETH、WBTC）的地址
- 如果找不到部署文件，会尝试从部署日志中提取信息
- 更新前端配置文件中对应网络的合约地址和代币地址

### 3. update-config-from-console.js

这个脚本允许你从控制台输出中提取合约地址，并更新前端配置文件。当你有部署日志但没有部署文件时，这个脚本特别有用。

**使用方法：**

```bash
# 更新默认网络(localhost)的配置
node scripts/update-config-from-console.js

# 更新指定网络的配置
node scripts/update-config-from-console.js hardhat
node scripts/update-config-from-console.js ganache
```

**功能：**
- 从控制台粘贴的输出中提取合约地址
- 支持从 "Token Addresses for Frontend Configuration" 部分提取代币地址
- 支持直接从部署日志中提取合约地址
- 更新前端配置文件中对应网络的合约地址和代币地址

### 4. send-test-eth.ts 和 mint-test-tokens.ts

这两个脚本用于发放测试资金：
- `send-test-eth.ts`: 发送测试ETH到指定地址
- `mint-test-tokens.ts`: 铸造测试代币到指定地址

**使用方法：**

```bash
# 发送测试ETH
RECIPIENT=0x123... AMOUNT=5 npx hardhat run scripts/send-test-eth.ts --network localhost

# 铸造测试代币
RECIPIENT=0x123... npx hardhat run scripts/mint-test-tokens.ts --network localhost
```

## 使用示例

### 完整流程示例

1. 启动本地网络：
   ```bash
   # 使用Hardhat
   npx hardhat node
   
   # 或使用Ganache
   ganache-cli -p 7545
   ```

2. 一键部署和更新：
   ```bash
   # 对于Hardhat网络
   node scripts/deploy-and-update.js hardhat
   
   # 对于Ganache网络
   node scripts/deploy-and-update.js ganache
   ```

3. 发放测试代币和ETH：
   ```bash
   # 发送测试ETH
   npx hardhat run scripts/send-test-eth.ts --network localhost
   
   # 铸造测试代币
   npx hardhat run scripts/mint-test-tokens.ts --network localhost
   
   # 或者一键部署、更新配置并发放测试代币
   node scripts/deploy-update-mint.js localhost
   ```

### 一键部署和更新 (最简单方法)

```bash
# 部署到默认网络(localhost)并更新配置
node scripts/deploy-and-update.js

# 部署到指定网络并更新配置
node scripts/deploy-and-update.js hardhat
```

### 从部署目录更新配置 (推荐方法)

1. 部署合约：
   ```bash
   npx hardhat deploy --network localhost
   ```

2. 运行更新脚本：
   ```bash
   node scripts/simple-update-config.js localhost
   ```

### 从控制台输出更新配置

1. 部署合约并复制输出：
   ```bash
   npx hardhat deploy --network localhost
   ```

2. 运行更新脚本，并粘贴控制台输出：
   ```bash
   node scripts/update-config-from-console.js localhost
   ```
   然后粘贴控制台输出，完成后按 Ctrl+D 结束输入。

## 网络配置说明

- **Hardhat网络**：默认监听在 `http://127.0.0.1:8545`，链ID为 `31337`
- **Ganache网络**：默认监听在 `http://127.0.0.1:7545`，链ID为 `1337`

## 注意事项

- 脚本会自动处理不同网络的链ID映射
- 如果找不到某个合约或代币的地址，脚本会保留原有配置
- 更新前会显示找到的部署信息，方便确认
- 更新后会显示哪些配置项被成功更新
- `simple-update-config.js` 脚本会自动创建配置文件备份，以防意外修改
- 确保在部署合约前已经启动了对应的本地网络
- 如果使用Hardhat网络，确保使用 `npx hardhat node` 而不是 `npx hardhat run` 