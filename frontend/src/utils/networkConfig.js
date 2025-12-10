// 网络配置文件 - 自动生成
// 不要手动编辑此文件

const NETWORK_CONFIG = {
  31337: {
    name: 'localhost',
    contracts: {
      lendingPool: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      matchingEngine: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      liquidityMining: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1'
    },
    tokens: [
      { 
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      },
      { 
        address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18
      },
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18
      },
      { 
        address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8
      }
    ]
  },
};

// 获取指定网络的合约地址
export function getContractAddresses(chainId) {
  const config = NETWORK_CONFIG[chainId];
  if (!config) {
    console.warn(`未找到链ID ${chainId} 的配置`);
    return {
      matchingEngine: null,
      lendingPool: null,
      liquidityMining: null
    };
  }
  
  return {
    matchingEngine: config.contracts.matchingEngine,
    lendingPool: config.contracts.lendingPool,
    liquidityMining: config.contracts.liquidityMining
  };
}

// 获取指定网络支持的代币
export function getSupportedTokens(chainId) {
  const config = NETWORK_CONFIG[chainId];
  if (!config) {
    console.warn(`未找到链ID ${chainId} 的配置`);
    return [];
  }
  
  return config.tokens || [];
}

// 获取网络配置
export function getNetworkConfig(chainId) {
  return NETWORK_CONFIG[chainId] || null;
}

export default NETWORK_CONFIG;