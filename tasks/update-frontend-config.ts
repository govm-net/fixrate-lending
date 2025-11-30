import { task } from "hardhat/config";
import fs from "fs";
import path from "path";

// 配置
const FRONTEND_CONFIG_PATH = path.join(__dirname, "../frontend/src/utils/networkConfig.js");

// 网络ID映射
const NETWORK_ID_MAP: { [key: string]: number } = {
  'localhost': 31337,
  'hardhat': 31337,
  'ganache': 1337,
  'sepolia': 11155111,
  'mumbai': 80001,
  'bsc_testnet': 97,
  'mainnet': 1,
  'polygon': 137,
  'bsc': 56
};

// 主要合约名称
const MAIN_CONTRACTS: { [key: string]: string } = {
  'UnifiedMatchingEngine': 'matchingEngine',
  'FixedRateLendingPool': 'lendingPool'
};

// 代币信息
const TOKEN_INFO: { [key: string]: { name: string, decimals: number } } = {
  'USDC': { name: 'USD Coin', decimals: 6 },
  'DAI': { name: 'Dai Stablecoin', decimals: 18 },
  'WETH': { name: 'Wrapped Ether', decimals: 18 },
  'WBTC': { name: 'Wrapped Bitcoin', decimals: 8 }
};

// 网络配置类型定义
interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface NetworkConfig {
  name: string;
  contracts: { [key: string]: string };
  tokens: TokenInfo[];
}

interface Networks {
  [key: number]: NetworkConfig;
}

/**
 * 更新前端网络配置文件
 */
task("update-frontend-config", "更新前端网络配置文件")
  .setAction(async (taskArgs, hre) => {
    console.log("正在更新前端网络配置...");

    try {
      // 读取部署信息
      const deploymentDir = path.join(__dirname, "../deployments");
      const networks: Networks = {};

      // 遍历所有网络目录
      const networkDirs = fs.readdirSync(deploymentDir).filter(file => 
        fs.statSync(path.join(deploymentDir, file)).isDirectory()
      );

      for (const networkDir of networkDirs) {
        const networkPath = path.join(deploymentDir, networkDir);
        const contractFiles = fs.readdirSync(networkPath);
        
        // 获取网络ID
        const networkId = NETWORK_ID_MAP[networkDir] || 0;
        if (networkId === 0) {
          console.log(`跳过未知网络: ${networkDir}`);
          continue;
        }

        // 初始化网络配置
        networks[networkId] = {
          name: networkDir,
          contracts: {} as { [key: string]: string },
          tokens: [] as TokenInfo[]
        };

        // 处理每个合约文件
        for (const contractFile of contractFiles) {
          if (contractFile.endsWith('.json')) {
            const contractName = contractFile.replace('.json', '');
            const contractPath = path.join(networkPath, contractFile);
            const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
            
            // 映射合约名称到配置键
            const configKey = MAIN_CONTRACTS[contractName];
            if (configKey) {
              networks[networkId].contracts[configKey] = contractData.address;
            }
          }
        }

        // 添加代币信息（示例）
        networks[networkId].tokens = [
          { 
            address: '', // 需要实际部署后填入
            symbol: 'USDC',
            name: TOKEN_INFO['USDC'].name,
            decimals: TOKEN_INFO['USDC'].decimals
          },
          { 
            address: '', // 需要实际部署后填入
            symbol: 'DAI',
            name: TOKEN_INFO['DAI'].name,
            decimals: TOKEN_INFO['DAI'].decimals
          }
        ];
      }

      // 生成配置文件内容
      let configContent = `// 网络配置文件 - 自动生成
// 不要手动编辑此文件

const NETWORK_CONFIG = {\n`;

      for (const [networkId, networkData] of Object.entries(networks)) {
        configContent += `  ${networkId}: {\n`;
        configContent += `    name: '${(networkData as NetworkConfig).name}',\n`;
        configContent += `    contracts: {\n`;
        
        for (const [key, address] of Object.entries((networkData as NetworkConfig).contracts)) {
          configContent += `      ${key}: '${address}',\n`;
        }
        
        configContent += `    },\n`;
        configContent += `    tokens: [\n`;
        
        for (const token of (networkData as NetworkConfig).tokens) {
          configContent += `      { \n`;
          configContent += `        address: '${token.address}',\n`;
          configContent += `        symbol: '${token.symbol}',\n`;
          configContent += `        name: '${token.name}',\n`;
          configContent += `        decimals: ${token.decimals}\n`;
          configContent += `      },\n`;
        }
        
        configContent += `    ]\n`;
        configContent += `  },\n`;
      }

      configContent += `};

export default NETWORK_CONFIG;
`;

      // 写入配置文件
      fs.writeFileSync(FRONTEND_CONFIG_PATH, configContent);
      console.log(`前端网络配置已更新: ${FRONTEND_CONFIG_PATH}`);

    } catch (error) {
      console.error("更新前端配置时出错:", error);
    }
  });