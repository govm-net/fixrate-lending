// 网络配置文件 - 自动生成
// 不要手动编辑此文件

const NETWORK_CONFIG = {
  11155111: {
    name: 'sepolia',
    contracts: {
      matchingEngine: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      lendingPool: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
    tokens: [
      { 
        address: '0x7439E9B41d80c125012E595f556379629a21CB20',
        symbol: 'USDC',
        name: 'USD Coin (Sepolia)',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x7439E9B41d80c125012E595f556379629a21CB20',
        symbol: 'DAI',
        name: 'Dai Stablecoin (Sepolia)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x7439E9B41d80c125012E595f556379629a21CB20',
        symbol: 'WETH',
        name: 'Wrapped Ether (Sepolia)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  80001: {
    name: 'mumbai',
    contracts: {
      matchingEngine: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      lendingPool: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
    tokens: [
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'USDC',
        name: 'USD Coin (Mumbai)',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'DAI',
        name: 'Dai Stablecoin (Mumbai)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'WETH',
        name: 'Wrapped Ether (Mumbai)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  97: {
    name: 'bsc_testnet',
    contracts: {
      matchingEngine: '0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867',
      lendingPool: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378',
    },
    tokens: [
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'USDC',
        name: 'USD Coin (BSC Testnet)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867',
        symbol: 'DAI',
        name: 'Dai Stablecoin (BSC Testnet)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378',
        symbol: 'WETH',
        name: 'Wrapped Ether (BSC Testnet)',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  
  // Hardhat 本地网络
  31337: {
    name: 'Hardhat Network',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: '',
    contracts: {
      matchingEngine: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      lendingPool: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      lendingPoolWithLP: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      liquidityMining: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
    tokens: [
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
        symbol: 'USDC', 
        name: 'USD Coin (Test)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'DAI', 
        name: 'Dai Stablecoin (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
        symbol: 'WETH', 
        name: 'Wrapped Ether (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
      { 
        address: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        symbol: 'WBTC', 
        name: 'Wrapped Bitcoin (Test)', 
        decimals: 8,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png'
      },
    ]
  },
  
  // Ganache 本地网络
  1337: {
    name: 'Local Development',
    rpcUrl: 'http://127.0.0.1:7545',
    explorer: '',
    contracts: {
      matchingEngine: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      lendingPool: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      lendingPoolWithLP: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      liquidityMining: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
    tokens: [
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
        symbol: 'USDC', 
        name: 'USD Coin (Test)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        symbol: 'DAI', 
        name: 'Dai Stablecoin (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
        symbol: 'WETH', 
        name: 'Wrapped Ether (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
      { 
        address: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        symbol: 'WBTC', 
        name: 'Wrapped Bitcoin (Test)', 
        decimals: 8,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png'
      },
    ]
  },
};

export default NETWORK_CONFIG;