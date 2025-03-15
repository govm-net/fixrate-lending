const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置
const FRONTEND_CONFIG_PATH = path.join(__dirname, '../frontend/src/utils/networkConfig.js');

// 网络ID映射
const NETWORK_ID_MAP = {
  'localhost': 31337,
  'hardhat': 31337,
  'ganache': 1337
};

// 代币信息
const TOKEN_INFO = {
  'USDC': { name: 'USD Coin (Test)', decimals: 6 },
  'DAI': { name: 'Dai Stablecoin (Test)', decimals: 18 },
  'WETH': { name: 'Wrapped Ether (Test)', decimals: 18 },
  'WBTC': { name: 'Wrapped Bitcoin (Test)', decimals: 8 }
};

// 读取前端配置文件
function readFrontendConfig() {
  try {
    const content = fs.readFileSync(FRONTEND_CONFIG_PATH, 'utf8');
    return content;
  } catch (error) {
    console.error('读取前端配置文件失败:', error);
    process.exit(1);
  }
}

// 从控制台输入中提取合约地址
async function extractAddressesFromConsole() {
  return new Promise((resolve) => {
    console.log('请粘贴包含合约地址的控制台输出 (输入完成后按Ctrl+D结束):');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    let input = '';
    
    rl.on('line', (line) => {
      input += line + '\n';
    });
    
    rl.on('close', () => {
      const deploymentInfo = {
        contracts: {},
        tokens: {}
      };
      
      // 提取主要合约地址
      const marketplaceMatch = input.match(/P2PLendingMarketplace deployed at: (0x[0-9a-fA-F]{40})/);
      if (marketplaceMatch && marketplaceMatch[1]) {
        deploymentInfo.contracts.marketplace = marketplaceMatch[1];
        console.log(`找到 P2PLendingMarketplace 合约地址: ${marketplaceMatch[1]}`);
      }
      
      const lendingPoolMatch = input.match(/FixedRateLendingPool deployed at: (0x[0-9a-fA-F]{40})/);
      if (lendingPoolMatch && lendingPoolMatch[1]) {
        deploymentInfo.contracts.lendingpool = lendingPoolMatch[1];
        console.log(`找到 FixedRateLendingPool 合约地址: ${lendingPoolMatch[1]}`);
      }
      
      // 提取代币地址
      // 尝试从Token Addresses部分提取
      const tokenAddressesSection = input.match(/=== Token Addresses for Frontend Configuration ===([\s\S]*?)===/);
      if (tokenAddressesSection && tokenAddressesSection[1]) {
        for (const symbol of Object.keys(TOKEN_INFO)) {
          const regex = new RegExp(`${symbol}: (0x[0-9a-fA-F]{40})`, 'i');
          const match = tokenAddressesSection[1].match(regex);
          if (match && match[1]) {
            deploymentInfo.tokens[symbol] = match[1];
            console.log(`从Token Addresses部分找到代币 ${symbol}: ${match[1]}`);
          }
        }
      } else {
        // 如果没有找到Token Addresses部分，尝试直接匹配
        for (const symbol of Object.keys(TOKEN_INFO)) {
          const regex = new RegExp(`Mock ${symbol} deployed at: (0x[0-9a-fA-F]{40})`, 'i');
          const match = input.match(regex);
          if (match && match[1]) {
            deploymentInfo.tokens[symbol] = match[1];
            console.log(`找到代币 ${symbol}: ${match[1]}`);
          }
        }
      }
      
      resolve(deploymentInfo);
    });
  });
}

// 更新前端配置
function updateFrontendConfig(frontendConfig, networkName, deploymentInfo) {
  const chainId = NETWORK_ID_MAP[networkName];
  if (!chainId) {
    console.log(`未找到网络 ${networkName} 的链ID映射`);
    return frontendConfig;
  }
  
  let updatedConfig = frontendConfig;
  
  // 更新合约地址
  for (const [contractKey, address] of Object.entries(deploymentInfo.contracts)) {
    // 使用更简单的正则表达式，不区分大小写
    const contractRegex = new RegExp(`(${chainId}[\\s\\S]*?contracts:[\\s\\S]*?${contractKey.toLowerCase()}):[\\s\\S]*?(['"])(0x[0-9a-fA-F]{40})(['"])`, 'gi');
    const beforeUpdate = updatedConfig;
    updatedConfig = updatedConfig.replace(contractRegex, `$1: $2${address}$4`);
    
    if (beforeUpdate !== updatedConfig) {
      console.log(`已更新 ${networkName} 网络的 ${contractKey} 合约地址为: ${address}`);
    } else {
      // 尝试另一种匹配方式
      const altContractRegex = new RegExp(`(contracts:[\\s\\S]*?${contractKey.toLowerCase()}):[\\s\\S]*?(['"])(0x[0-9a-fA-F]{40})(['"])`, 'gi');
      const beforeAltUpdate = updatedConfig;
      updatedConfig = updatedConfig.replace(altContractRegex, `$1: $2${address}$4`);
      
      if (beforeAltUpdate !== updatedConfig) {
        console.log(`已更新 ${networkName} 网络的 ${contractKey} 合约地址为: ${address} (使用备选正则表达式)`);
      } else {
        console.log(`未能更新 ${networkName} 网络的 ${contractKey} 合约地址，请手动更新`);
        console.log(`- 合约类型: ${contractKey}`);
        console.log(`- 地址: ${address}`);
        console.log(`- 网络ID: ${chainId}`);
      }
    }
  }
  
  // 更新代币地址
  for (const [symbol, address] of Object.entries(deploymentInfo.tokens)) {
    // 使用更简单的正则表达式，不区分大小写
    const tokenRegex = new RegExp(`(symbol:[\\s\\S]*?['"]${symbol}['"][\\s\\S]*?address):[\\s\\S]*?(['"])(0x[0-9a-fA-F]{40})(['"])`, 'gi');
    const beforeUpdate = updatedConfig;
    updatedConfig = updatedConfig.replace(tokenRegex, `$1: $2${address}$4`);
    
    if (beforeUpdate !== updatedConfig) {
      console.log(`已更新 ${networkName} 网络的 ${symbol} 代币地址为: ${address}`);
    } else {
      console.log(`未能更新 ${networkName} 网络的 ${symbol} 代币地址，请手动更新`);
      console.log(`- 代币符号: ${symbol}`);
      console.log(`- 地址: ${address}`);
      console.log(`- 网络ID: ${chainId}`);
    }
  }
  
  return updatedConfig;
}

// 主函数
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const networkName = args[0] || 'localhost'; // 默认为localhost网络
  
  console.log(`开始更新 ${networkName} 网络的前端配置...`);
  
  // 从控制台输入中提取地址
  const deploymentInfo = await extractAddressesFromConsole();
  
  if (Object.keys(deploymentInfo.contracts).length === 0 && Object.keys(deploymentInfo.tokens).length === 0) {
    console.log('未找到任何合约地址，退出更新');
    process.exit(1);
  }
  
  console.log(`\n找到部署信息:`, JSON.stringify(deploymentInfo, null, 2));
  
  // 读取并更新前端配置
  let frontendConfig = readFrontendConfig();
  frontendConfig = updateFrontendConfig(frontendConfig, networkName, deploymentInfo);
  
  // 写入更新后的配置
  fs.writeFileSync(FRONTEND_CONFIG_PATH, frontendConfig, 'utf8');
  console.log('\n前端配置已更新!');
}

// 执行主函数
main(); 