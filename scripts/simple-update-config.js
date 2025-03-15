const fs = require('fs');
const path = require('path');

// 配置
const DEPLOYMENTS_DIR = path.join(__dirname, '../deployments');
const FRONTEND_CONFIG_PATH = path.join(__dirname, '../frontend/src/utils/networkConfig.js');

// 网络ID映射
const NETWORK_ID_MAP = {
  'localhost': 31337,
  'hardhat': 31337,
  'ganache': 1337
};

// 主要合约名称
const MAIN_CONTRACTS = {
  'P2PLendingMarketplace': 'marketplace',
  'FixedRateLendingPool': 'lendingPool'
};

// 代币信息
const TOKEN_INFO = {
  'USDC': { name: 'USD Coin', decimals: 6 },
  'DAI': { name: 'Dai Stablecoin', decimals: 18 },
  'WETH': { name: 'Wrapped Ether', decimals: 18 },
  'WBTC': { name: 'Wrapped Bitcoin', decimals: 8 }
};

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
  for (const [contractName, configKey] of Object.entries(MAIN_CONTRACTS)) {
    const contractPath = path.join(networkDir, `${contractName}.json`);
    if (fs.existsSync(contractPath)) {
      const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      deploymentInfo.contracts[configKey] = contractData.address;
      console.log(`找到合约 ${contractName} (${configKey}): ${contractData.address}`);
    } else {
      console.log(`未找到合约 ${contractName} 的部署信息`);
    }
  }
  
  // 读取代币合约地址
  const mockERC20Files = fs.readdirSync(networkDir)
    .filter(file => file.startsWith('MockERC20') && file.endsWith('.json'));
  
  console.log(`找到 ${mockERC20Files.length} 个MockERC20合约文件`);
  
  for (const file of mockERC20Files) {
    const contractData = JSON.parse(fs.readFileSync(path.join(networkDir, file), 'utf8'));
    if (contractData.args && contractData.args.length >= 2) {
      const symbol = contractData.args[1];
      if (TOKEN_INFO[symbol]) {
        deploymentInfo.tokens[symbol] = contractData.address;
        console.log(`找到代币 ${symbol}: ${contractData.address}`);
      }
    }
  }
  
  return deploymentInfo;
}

// 更新前端配置
function updateFrontendConfig(networkName, deploymentInfo) {
  const chainId = NETWORK_ID_MAP[networkName];
  if (!chainId) {
    console.log(`未找到网络 ${networkName} 的链ID映射`);
    return;
  }
  
  // 读取前端配置文件
  let configContent = fs.readFileSync(FRONTEND_CONFIG_PATH, 'utf8');
  
  // 创建备份
  fs.writeFileSync(`${FRONTEND_CONFIG_PATH}.bak`, configContent, 'utf8');
  console.log(`已创建配置文件备份: ${FRONTEND_CONFIG_PATH}.bak`);
  
  // 解析配置文件内容
  const networkConfigStart = configContent.indexOf(`${chainId}: {`);
  if (networkConfigStart === -1) {
    console.log(`未找到网络ID ${chainId} 的配置部分`);
    return;
  }
  
  // 找到网络配置的开始和结束位置
  let braceCount = 0;
  let networkConfigEnd = networkConfigStart;
  let inString = false;
  let escapeNext = false;
  
  for (let i = networkConfigStart; i < configContent.length; i++) {
    const char = configContent[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' || char === "'") {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          networkConfigEnd = i + 1;
          break;
        }
      }
    }
  }
  
  // 提取网络配置部分
  const networkConfig = configContent.substring(networkConfigStart, networkConfigEnd);
  
  // 更新合约地址
  let updatedNetworkConfig = networkConfig;
  for (const [configKey, address] of Object.entries(deploymentInfo.contracts)) {
    const contractPattern = new RegExp(`(${configKey}\\s*:\\s*['"])(0x[0-9a-fA-F]{40})(['"])`, 'g');
    const newContractValue = `$1${address}$3`;
    
    if (contractPattern.test(updatedNetworkConfig)) {
      updatedNetworkConfig = updatedNetworkConfig.replace(contractPattern, newContractValue);
      console.log(`已更新 ${networkName} 网络的 ${configKey} 合约地址为: ${address}`);
    } else {
      console.log(`未找到 ${configKey} 合约配置，请手动更新`);
      console.log(`- 合约配置键: ${configKey}`);
      console.log(`- 地址: ${address}`);
    }
  }
  
  // 更新代币地址
  for (const [symbol, address] of Object.entries(deploymentInfo.tokens)) {
    // 查找代币配置部分
    const tokenPattern = new RegExp(`{[^}]*symbol:\\s*['"]${symbol}['"][^}]*}`, 'g');
    const tokenMatches = [...updatedNetworkConfig.matchAll(tokenPattern)];
    
    if (tokenMatches.length > 0) {
      for (const match of tokenMatches) {
        const tokenConfig = match[0];
        const addressPattern = /(address\s*:\s*['"])(0x[0-9a-fA-F]{40})(['"])/;
        const newTokenConfig = tokenConfig.replace(addressPattern, `$1${address}$3`);
        
        updatedNetworkConfig = updatedNetworkConfig.replace(tokenConfig, newTokenConfig);
        console.log(`已更新 ${networkName} 网络的 ${symbol} 代币地址为: ${address}`);
      }
    } else {
      console.log(`未找到 ${symbol} 代币配置，请手动更新`);
      console.log(`- 代币符号: ${symbol}`);
      console.log(`- 地址: ${address}`);
    }
  }
  
  // 更新配置文件
  const updatedContent = configContent.substring(0, networkConfigStart) + 
                         updatedNetworkConfig + 
                         configContent.substring(networkConfigEnd);
  
  fs.writeFileSync(FRONTEND_CONFIG_PATH, updatedContent, 'utf8');
  console.log(`已更新 ${networkName} 网络的配置`);
}

// 主函数
function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const networkName = args[0] || 'localhost'; // 默认为localhost网络
  
  console.log(`开始更新 ${networkName} 网络的前端配置...`);
  
  // 读取部署信息
  const deploymentInfo = readDeploymentInfo(networkName);
  
  if (!deploymentInfo) {
    console.log('未找到部署信息，退出更新');
    process.exit(1);
  }
  
  console.log(`\n找到部署信息:`, JSON.stringify(deploymentInfo, null, 2));
  
  // 更新前端配置
  updateFrontendConfig(networkName, deploymentInfo);
  
  console.log('\n前端配置已更新!');
}

// 执行主函数
main(); 