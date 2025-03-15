const fs = require('fs');
const path = require('path');

// 配置
const DEPLOYMENTS_DIR = path.join(__dirname, '../deployments');
const FRONTEND_CONFIG_PATH = path.join(__dirname, '../frontend/src/utils/networkConfig.js');

// 网络ID映射
const NETWORK_ID_MAP = {
  'localhost': 31337,
  'hardhat': 31337,
  'sepolia': 11155111,
  'mumbai': 80001,
  'bsc_testnet': 97,
  'mainnet': 1,
  'polygon': 137,
  'bsc': 56
};

// 主要合约名称
const MAIN_CONTRACTS = ['P2PLendingMarketplace', 'FixedRateLendingPool'];

// 代币信息
const TOKEN_INFO = {
  'USDC': { name: 'USD Coin', decimals: 6 },
  'DAI': { name: 'Dai Stablecoin', decimals: 18 },
  'WETH': { name: 'Wrapped Ether', decimals: 18 },
  'WBTC': { name: 'Wrapped Bitcoin', decimals: 8 }
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

// 读取部署信息
function readDeploymentInfo(networkName) {
  const networkDir = path.join(DEPLOYMENTS_DIR, networkName);
  
  if (!fs.existsSync(networkDir)) {
    console.log(`网络 ${networkName} 的部署信息不存在`);
    return null;
  }
  
  const deploymentInfo = {
    contracts: {},
    tokens: {}
  };
  
  // 读取主要合约地址
  for (const contractName of MAIN_CONTRACTS) {
    const contractPath = path.join(networkDir, `${contractName}.json`);
    if (fs.existsSync(contractPath)) {
      const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      deploymentInfo.contracts[contractName.toLowerCase()] = contractData.address;
      console.log(`找到合约 ${contractName}: ${contractData.address}`);
    } else {
      console.log(`未找到合约 ${contractName} 的部署信息`);
    }
  }
  
  // 读取代币合约地址
  // 首先检查是否有多个MockERC20合约文件
  const mockERC20Files = fs.readdirSync(networkDir)
    .filter(file => file.startsWith('MockERC20') && file.endsWith('.json'));
  
  console.log(`找到 ${mockERC20Files.length} 个MockERC20合约文件`);
  
  // 如果只有一个MockERC20文件，可能所有代币共用一个地址
  if (mockERC20Files.length === 1) {
    const contractData = JSON.parse(fs.readFileSync(path.join(networkDir, mockERC20Files[0]), 'utf8'));
    const address = contractData.address;
    
    // 检查args以确定这是哪个代币
    if (contractData.args && contractData.args.length >= 2) {
      const symbol = contractData.args[1];
      if (TOKEN_INFO[symbol]) {
        deploymentInfo.tokens[symbol] = address;
        console.log(`找到代币 ${symbol}: ${address} (从单个MockERC20文件)`);
      }
    } else {
      // 如果无法确定代币类型，假设所有代币共用此地址
      for (const symbol of Object.keys(TOKEN_INFO)) {
        deploymentInfo.tokens[symbol] = address;
        console.log(`假设代币 ${symbol} 使用地址: ${address} (共用地址)`);
      }
    }
  } else {
    // 如果有多个MockERC20文件，尝试通过args区分不同代币
    for (const file of mockERC20Files) {
      const contractData = JSON.parse(fs.readFileSync(path.join(networkDir, file), 'utf8'));
      if (contractData.args && contractData.args.length >= 2) {
        const name = contractData.args[0];
        const symbol = contractData.args[1];
        const decimals = contractData.args[2];
        
        if (TOKEN_INFO[symbol]) {
          deploymentInfo.tokens[symbol] = contractData.address;
          console.log(`找到代币 ${symbol} (${name}, ${decimals}位小数): ${contractData.address}`);
        }
      }
    }
  }
  
  // 如果没有找到任何代币，尝试从部署日志中查找
  if (Object.keys(deploymentInfo.tokens).length === 0) {
    console.log('未从部署文件中找到代币信息，尝试从部署日志中查找...');
    try {
      // 尝试查找部署日志
      const logFiles = fs.readdirSync(path.join(__dirname, '..'))
        .filter(file => file.endsWith('.log') && file.includes('deploy'));
      
      if (logFiles.length > 0) {
        // 使用最新的日志文件
        const logFile = logFiles.sort((a, b) => {
          return fs.statSync(path.join(__dirname, '..', b)).mtime.getTime() - 
                 fs.statSync(path.join(__dirname, '..', a)).mtime.getTime();
        })[0];
        
        const logContent = fs.readFileSync(path.join(__dirname, '..', logFile), 'utf8');
        
        // 从日志中提取代币地址
        for (const symbol of Object.keys(TOKEN_INFO)) {
          const regex = new RegExp(`Mock ${symbol} deployed at: (0x[0-9a-fA-F]{40})`, 'i');
          const match = logContent.match(regex);
          if (match && match[1]) {
            deploymentInfo.tokens[symbol] = match[1];
            console.log(`从日志中找到代币 ${symbol}: ${match[1]}`);
          }
        }
        
        // 尝试从Token Addresses部分提取
        const tokenAddressesSection = logContent.match(/=== Token Addresses for Frontend Configuration ===([\s\S]*?)===/);
        if (tokenAddressesSection && tokenAddressesSection[1]) {
          for (const symbol of Object.keys(TOKEN_INFO)) {
            const regex = new RegExp(`${symbol}: (0x[0-9a-fA-F]{40})`, 'i');
            const match = tokenAddressesSection[1].match(regex);
            if (match && match[1]) {
              deploymentInfo.tokens[symbol] = match[1];
              console.log(`从Token Addresses部分找到代币 ${symbol}: ${match[1]}`);
            }
          }
        }
      }
    } catch (error) {
      console.log('从日志中查找代币信息失败:', error.message);
    }
  }
  
  return deploymentInfo;
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
function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const networks = args.length > 0 ? args : ['localhost']; // 默认更新localhost网络
  
  console.log('开始更新前端配置...');
  let frontendConfig = readFrontendConfig();
  
  for (const networkName of networks) {
    console.log(`\n处理网络: ${networkName}`);
    const deploymentInfo = readDeploymentInfo(networkName);
    
    if (deploymentInfo) {
      console.log(`\n找到部署信息:`, JSON.stringify(deploymentInfo, null, 2));
      frontendConfig = updateFrontendConfig(frontendConfig, networkName, deploymentInfo);
    }
  }
  
  // 写入更新后的配置
  fs.writeFileSync(FRONTEND_CONFIG_PATH, frontendConfig, 'utf8');
  console.log('\n前端配置已更新!');
}

// 执行主函数
main(); 