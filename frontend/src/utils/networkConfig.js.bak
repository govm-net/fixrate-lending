import { ethers } from 'ethers';

// 网络配置
const networkConfig = {
  // 以太坊主网
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-infura-key',
    explorer: 'https://etherscan.io',
    contracts: {
      marketplace: '0x123456789abcdef123456789abcdef123456789a', // 示例地址，需要替换为实际部署地址
      lendingPool: '0xabcdef123456789abcdef123456789abcdef1234', // 示例地址，需要替换为实际部署地址
    },
    tokens: [
      { 
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
        symbol: 'DAI', 
        name: 'Dai Stablecoin', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 
        symbol: 'WETH', 
        name: 'Wrapped Ether', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  
  // Sepolia 测试网
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/your-infura-key',
    explorer: 'https://sepolia.etherscan.io',
    contracts: {
      marketplace: '0x123456789abcdef123456789abcdef123456789a', // 示例地址，需要替换为实际部署地址
      lendingPool: '0xabcdef123456789abcdef123456789abcdef1234', // 示例地址，需要替换为实际部署地址
    },
    tokens: [
      { 
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // 示例地址，需要替换为实际部署地址
        symbol: 'USDC', 
        name: 'USD Coin (Sepolia)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6', // 示例地址，需要替换为实际部署地址
        symbol: 'DAI', 
        name: 'Dai Stablecoin (Sepolia)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // 示例地址，需要替换为实际部署地址
        symbol: 'WETH', 
        name: 'Wrapped Ether (Sepolia)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  
  // Polygon 主网
  137: {
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    contracts: {
      marketplace: '0x123456789abcdef123456789abcdef123456789a', // 示例地址，需要替换为实际部署地址
      lendingPool: '0xabcdef123456789abcdef123456789abcdef1234', // 示例地址，需要替换为实际部署地址
    },
    tokens: [
      { 
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 
        symbol: 'USDC', 
        name: 'USD Coin (PoS)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 
        symbol: 'DAI', 
        name: 'Dai Stablecoin (PoS)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 
        symbol: 'WETH', 
        name: 'Wrapped Ether (PoS)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  
  // Mumbai 测试网
  80001: {
    name: 'Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    contracts: {
      marketplace: '0x123456789abcdef123456789abcdef123456789a', // 示例地址，需要替换为实际部署地址
      lendingPool: '0xabcdef123456789abcdef123456789abcdef1234', // 示例地址，需要替换为实际部署地址
    },
    tokens: [
      { 
        address: '0xe11A86849d99F524cAC3E7A0Ec1241828e332C62', // 示例地址，需要替换为实际部署地址
        symbol: 'USDC', 
        name: 'USD Coin (Mumbai)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253', // 示例地址，需要替换为实际部署地址
        symbol: 'DAI', 
        name: 'Dai Stablecoin (Mumbai)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa', // 示例地址，需要替换为实际部署地址
        symbol: 'WETH', 
        name: 'Wrapped Ether (Mumbai)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  
  // BSC 主网
  56: {
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    contracts: {
      marketplace: '0x123456789abcdef123456789abcdef123456789a', // 示例地址，需要替换为实际部署地址
      lendingPool: '0xabcdef123456789abcdef123456789abcdef1234', // 示例地址，需要替换为实际部署地址
    },
    tokens: [
      { 
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 
        symbol: 'USDC', 
        name: 'USD Coin (BSC)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 
        symbol: 'DAI', 
        name: 'Dai Stablecoin (BSC)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', 
        symbol: 'WETH', 
        name: 'Wrapped Ether (BSC)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
    ]
  },
  
  // BSC 测试网
  97: {
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorer: 'https://testnet.bscscan.com',
    contracts: {
      marketplace: '0x123456789abcdef123456789abcdef123456789a', // 示例地址，需要替换为实际部署地址
      lendingPool: '0xabcdef123456789abcdef123456789abcdef1234', // 示例地址，需要替换为实际部署地址
    },
    tokens: [
      { 
        address: '0x64544969ed7EBf5f083679233325356EbE738930', // 示例地址，需要替换为实际部署地址
        symbol: 'USDC', 
        name: 'USD Coin (BSC Testnet)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867', // 示例地址，需要替换为实际部署地址
        symbol: 'DAI', 
        name: 'Dai Stablecoin (BSC Testnet)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378', // 示例地址，需要替换为实际部署地址
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
      marketplace: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // P2PLendingMarketplace 合约地址
      lendingPool: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // FixedRateLendingPool 合约地址
    },
    tokens: [
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // MockERC20 USDC 合约地址
        symbol: 'USDC', 
        name: 'USD Coin (Test)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // MockERC20 DAI 合约地址 (使用相同地址，因为在本地测试环境中使用同一个合约)
        symbol: 'DAI', 
        name: 'Dai Stablecoin (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // MockERC20 WETH 合约地址 (使用相同地址，因为在本地测试环境中使用同一个合约)
        symbol: 'WETH', 
        name: 'Wrapped Ether (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
      { 
        address: '0x0165878A594ca255338adfa4d48449f69242Eb8F', // MockERC20 WBTC 合约地址 (使用相同地址，因为在本地测试环境中使用同一个合约)
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
      marketplace: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // P2PLendingMarketplace 合约地址
      lendingPool: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // FixedRateLendingPool 合约地址
    },
    tokens: [
      { 
        address: '0x0165878A594ca255338adfa4d48449f69242Eb8F', // MockERC20 USDC 合约地址
        symbol: 'USDC', 
        name: 'USD Coin (Test)', 
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // MockERC20 DAI 合约地址 (使用相同地址，因为在本地测试环境中使用同一个合约)
        symbol: 'DAI', 
        name: 'Dai Stablecoin (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // MockERC20 WETH 合约地址 (使用相同地址，因为在本地测试环境中使用同一个合约)
        symbol: 'WETH', 
        name: 'Wrapped Ether (Test)', 
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      },
      { 
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // MockERC20 WBTC 合约地址 (使用相同地址，因为在本地测试环境中使用同一个合约)
        symbol: 'WBTC', 
        name: 'Wrapped Bitcoin (Test)', 
        decimals: 8,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png'
      },
    ]
  }
};

// 获取网络配置
export const getNetworkConfig = (chainId) => {
  return networkConfig[chainId] || null;
};

// 获取当前网络名称
export const getNetworkName = (chainId) => {
  return networkConfig[chainId]?.name || 'Unknown Network';
};

// 获取当前网络合约地址
export const getContractAddresses = (chainId) => {
  return networkConfig[chainId]?.contracts || {};
};

// 获取当前网络支持的代币
export const getSupportedTokens = (chainId) => {
  return networkConfig[chainId]?.tokens || [];
};

// 获取代币信息
export const getTokenInfo = (chainId, tokenAddress) => {
  const tokens = getSupportedTokens(chainId);
  return tokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase()) || null;
};

// 获取代币符号
export const getTokenSymbol = (chainId, tokenAddress) => {
  const token = getTokenInfo(chainId, tokenAddress);
  return token ? token.symbol : 'Unknown';
};

// 获取代币小数位数
export const getTokenDecimals = (chainId, tokenAddress) => {
  const token = getTokenInfo(chainId, tokenAddress);
  return token ? token.decimals : 18;
};

// 格式化代币金额
export const formatTokenAmount = (chainId, tokenAddress, amount) => {
  if (!amount) return '0';
  const decimals = getTokenDecimals(chainId, tokenAddress);
  return ethers.utils.formatUnits(amount, decimals);
};

export default networkConfig; 