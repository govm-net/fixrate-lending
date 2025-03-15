import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { useApi } from './ApiContext';

// 导入网络配置
import { getContractAddresses, getSupportedTokens, getNetworkConfig } from '../utils/networkConfig';
// 导入测试钱包工具
// ... existing code ...

// ABI imports
import P2PLendingMarketplaceABI from '../utils/abis/P2PLendingMarketplace.json';
import FixedRateLendingPoolABI from '../utils/abis/FixedRateLendingPool.json';
import ERC20ABI from '../utils/abis/ERC20.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const { selectedEndpoint, setSelectedEndpoint, apiEndpoints } = useApi();
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contracts, setContracts] = useState({
    marketplace: null,
    lendingPool: null
  });
  const [contractAddresses, setContractAddresses] = useState({
    marketplace: null,
    lendingPool: null
  });
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  // ... existing code ...

  // 安全地获取 ethereum 对象
  const getEthereum = () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      return window.ethereum;
    }
    return null;
  };

  // Initialize provider
  useEffect(() => {
    const ethereum = getEthereum();
    if (ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(ethereum);
        setProvider(provider);

        // Listen for account changes
        const handleAccountsChanged = (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount(null);
            setIsConnected(false);
          }
        };

        // Listen for chain changes
        const handleChainChanged = (chainId) => {
          setChainId(parseInt(chainId, 16));
          // Reload the page when chain changes
          window.location.reload();
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);

        // Get initial chain ID
        provider.getNetwork().then(network => {
          setChainId(network.chainId);
        });

        return () => {
          if (ethereum.removeListener) {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      } catch (error) {
        console.error('Error initializing Web3Provider:', error);
        setError('Failed to initialize Web3Provider');
      }
    } else {
      // 如果没有 MetaMask，尝试使用 JsonRpcProvider 连接到本地网络
      try {
        const localProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        setProvider(localProvider);
        
        // 获取网络信息
        localProvider.getNetwork().then(network => {
          setChainId(network.chainId);
        });
      } catch (error) {
        console.error('Error connecting to local network:', error);
      }
    }
  }, []);

  // 当链 ID 变化时，更新合约地址和支持的代币
  useEffect(() => {
    if (chainId) {
      // 从网络配置中获取合约地址
      const addresses = getContractAddresses(chainId);
      setContractAddresses(addresses);
      
      // 从网络配置中获取支持的代币
      const tokens = getSupportedTokens(chainId);
      setSupportedTokens(tokens);
    }
  }, [chainId]);

  // Initialize contracts when provider and addresses are available
  useEffect(() => {
    if (provider && contractAddresses.marketplace && contractAddresses.lendingPool) {
      const marketplace = new ethers.Contract(
        contractAddresses.marketplace,
        P2PLendingMarketplaceABI,
        provider
      );
      
      const lendingPool = new ethers.Contract(
        contractAddresses.lendingPool,
        FixedRateLendingPoolABI,
        provider
      );

      setContracts({
        marketplace,
        lendingPool
      });
    }
  }, [provider, contractAddresses]);

  // 当 signer 变化时，更新合约连接
  useEffect(() => {
    if (signer && contracts.marketplace && contracts.lendingPool) {
      // 避免在已经连接 signer 的情况下重复连接
      if (contracts.marketplace.signer !== signer || contracts.lendingPool.signer !== signer) {
        const marketplaceWithSigner = contracts.marketplace.connect(signer);
        const lendingPoolWithSigner = contracts.lendingPool.connect(signer);

        setContracts({
          marketplace: marketplaceWithSigner,
          lendingPool: lendingPoolWithSigner
        });
      }
    }
  }, [signer, contracts.marketplace, contracts.lendingPool]);

  // Connect wallet
  const connectWallet = async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        setSigner(signer);
        setIsConnected(true);
        
        // 获取当前网络ID
        const network = await provider.getNetwork();
        const currentChainId = network.chainId;
        console.log(`Connected to network with chain ID: ${currentChainId}`);
        console.log(`Selected endpoint: `, selectedEndpoint);
        
        // 如果当前选择的API端点的链ID与钱包的链ID不同，尝试切换网络
        if (selectedEndpoint && selectedEndpoint.chainId !== currentChainId) {
          console.log(`Current chain ID (${currentChainId}) doesn't match selected endpoint chain ID (${selectedEndpoint.chainId}). Attempting to switch...`);
          
          // 检查是否为Hardhat网络
          if (currentChainId === 31337) {
            console.log("Currently connected to Hardhat network. Updating selected endpoint instead of switching network.");
            // 查找匹配Hardhat网络的端点
            const hardhatEndpoint = apiEndpoints.find(endpoint => endpoint.chainId === 31337);
            if (hardhatEndpoint) {
              console.log("Found Hardhat endpoint, updating selected endpoint:", hardhatEndpoint);
              setSelectedEndpoint(hardhatEndpoint);
            } else {
              console.log("No Hardhat endpoint found in apiEndpoints. Creating a new one.");
              const newHardhatEndpoint = {
                name: 'Hardhat Network',
                url: 'http://localhost:8545',
                chainId: 31337
              };
              setSelectedEndpoint(newHardhatEndpoint);
            }
          } else {
            try {
              await switchNetwork(selectedEndpoint.chainId);
            } catch (switchError) {
              console.error('Error switching network after wallet connection:', switchError);
              // 这里不抛出错误，因为钱包已经成功连接，只是网络切换失败
            }
          }
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Get ERC20 token contract
  const getTokenContract = (tokenAddress) => {
    if (!provider || !tokenAddress) return null;
    return new ethers.Contract(tokenAddress, ERC20ABI, provider);
  };

  // Get token balance
  const getTokenBalance = async (tokenAddress, address = account) => {
    if (!address || !tokenAddress) return ethers.BigNumber.from(0);
    
    // 检查是否为开发环境或测试网络
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 如果是开发环境，返回模拟数据
    if (isDevelopment) {
      // 获取代币信息
      const token = supportedTokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
      if (token) {
        // 为不同的代币返回不同的模拟余额
        if (token.symbol === 'USDC') {
          console.log(`Returning mock balance for USDC: 10000 with ${token.decimals} decimals`);
          return ethers.utils.parseUnits('10000', token.decimals);
        } else if (token.symbol === 'DAI') {
          console.log(`Returning mock balance for DAI: 15000 with ${token.decimals} decimals`);
          return ethers.utils.parseUnits('15000', token.decimals);
        } else if (token.symbol === 'WETH') {
          console.log(`Returning mock balance for WETH: 10 with ${token.decimals} decimals`);
          return ethers.utils.parseUnits('10', token.decimals);
        }
      }
      
      // 默认返回一些代币
      const decimals = getTokenDecimals(tokenAddress);
      console.log(`Returning default mock balance: 1000 with ${decimals} decimals`);
      return ethers.utils.parseUnits('1000', decimals);
    }
    
    // 生产环境下的正常逻辑
    const tokenContract = getTokenContract(tokenAddress);
    if (!tokenContract) return ethers.BigNumber.from(0);
    
    try {
      return await tokenContract.balanceOf(address);
    } catch (error) {
      console.error('Error getting token balance:', error);
      // 发生错误时返回0
      return ethers.BigNumber.from(0);
    }
  };

  // Approve token spending
  const approveToken = async (tokenAddress, spender, amount) => {
    if (!signer || !tokenAddress || !spender) {
      throw new Error('Missing required parameters');
    }
    
    // 检查是否为开发环境
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 如果是开发环境，模拟批准操作
    if (isDevelopment) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 返回模拟的交易收据
      return {
        status: 1,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: ethers.BigNumber.from(Math.floor(Math.random() * 100000))
      };
    }
    
    // 生产环境下的正常逻辑
    const tokenContract = getTokenContract(tokenAddress).connect(signer);
    if (!tokenContract) {
      throw new Error('Token contract not found');
    }
    
    try {
      const tx = await tokenContract.approve(spender, amount);
      return await tx.wait();
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  };

  // 格式化代币金额
  const formatTokenAmount = (tokenAddress, amount) => {
    if (!amount) return '0';
    const decimals = getTokenDecimals(tokenAddress);
    return ethers.utils.formatUnits(amount, decimals);
  };

  // 获取代币符号
  const getTokenSymbol = (tokenAddress) => {
    const token = supportedTokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    return token ? token.symbol : 'Unknown';
  };

  // 获取代币小数位数
  const getTokenDecimals = (tokenAddress) => {
    const token = supportedTokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    return token ? token.decimals : 18;
  };

  // 将网络添加到MetaMask
  const addNetworkToMetaMask = async (chainId) => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    // 获取网络配置
    const networkInfo = getNetworkConfig(chainId);
    if (!networkInfo) {
      throw new Error(`Network configuration not found for chain ID: ${chainId}`);
    }
    
    try {
      console.log(`Adding network to MetaMask: ${networkInfo.name} (${chainId})`);
      
      // 准备网络参数
      const params = {
        chainId: `0x${chainId.toString(16)}`, // 转换为十六进制
        chainName: networkInfo.name,
        rpcUrls: [networkInfo.rpcUrl],
        nativeCurrency: {
          name: chainId === 137 || chainId === 80001 ? 'MATIC' : 'ETH',
          symbol: chainId === 137 || chainId === 80001 ? 'MATIC' : 'ETH',
          decimals: 18
        }
      };
      
      // 只有当 explorer 存在且不为空时才添加
      if (networkInfo.explorer && networkInfo.explorer !== '') {
        params.blockExplorerUrls = [networkInfo.explorer];
      }
      
      console.log('Network params:', params);
      
      // 请求添加网络
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params]
      });
      
      return true;
    } catch (error) {
      console.error('Error adding network to MetaMask:', error);
      throw error;
    }
  };

  // 切换到指定网络
  const switchNetwork = async (chainId) => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    // 获取当前网络ID
    const provider = new ethers.providers.Web3Provider(ethereum);
    const network = await provider.getNetwork();
    const currentChainId = network.chainId;
    
    console.log(`Current chain ID: ${currentChainId}, Target chain ID: ${chainId}`);
    
    // 如果当前已经是目标网络，或者当前是Hardhat网络，则不执行切换
    if (currentChainId === chainId) {
      console.log(`Already on target network with chain ID: ${chainId}`);
      return true;
    }
    
    if (currentChainId === 31337) {
      console.log(`Currently on Hardhat network (chain ID: 31337). Skipping network switch.`);
      return true;
    }
    
    try {
      console.log(`Switching to network with chain ID: ${chainId}`);
      
      // 尝试切换网络
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      
      console.log(`Successfully switched to network with chain ID: ${chainId}`);
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      
      // 如果错误是因为网络不存在（错误代码4902），尝试添加网络
      if (error.code === 4902 || 
          (error.message && error.message.includes('Unrecognized chain ID')) ||
          (error.data && error.data.originalError && error.data.originalError.code === 4902)) {
        console.log('Network not found in wallet, attempting to add it...');
        try {
          await addNetworkToMetaMask(chainId);
          
          // 添加成功后，再次尝试切换网络
          console.log('Network added successfully, trying to switch again...');
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }]
          });
          
          console.log(`Successfully switched to network with chain ID: ${chainId} after adding it`);
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      }
      
      throw error;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        contracts,
        contractAddresses,
        supportedTokens,
        isConnected,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        getTokenContract,
        getTokenBalance,
        approveToken,
        formatTokenAmount,
        getTokenSymbol,
        getTokenDecimals,
        switchNetwork,
        addNetworkToMetaMask
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context); 