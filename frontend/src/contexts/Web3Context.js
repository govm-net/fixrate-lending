import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
// import { useApi } from './ApiContext';

// 导入网络配置
import { getContractAddresses, getSupportedTokens, getNetworkConfig } from '../utils/networkConfig';
// 导入测试钱包工具
// import { getTestWallet } from '../utils/testWallet';

// ABI imports
import UnifiedMatchingEngineABI from '../utils/abis/UnifiedMatchingEngine.json';
import FixedRateLendingPoolABI from '../utils/abis/FixedRateLendingPool.json';
import LiquidityMiningABI from '../utils/abis/LiquidityMining.json';
import ERC20ABI from '../utils/abis/ERC20.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  // const { selectedEndpoint, setSelectedEndpoint, apiEndpoints } = useApi();
  const selectedEndpoint = null;
  const setSelectedEndpoint = () => {};
  const apiEndpoints = [];
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contracts, setContracts] = useState({
    matchingEngine: null,
    lendingPool: null,
    liquidityMining: null
  });
  const [contractAddresses, setContractAddresses] = useState({
    matchingEngine: null,
    lendingPool: null,
    liquidityMining: null
  });
  const [supportedTokens, setSupportedTokens] = useState([]);

  // 初始化钱包提供商
  const initWalletProvider = async () => {
    try {
      // 检查是否在浏览器环境中且有以太坊提供商
      if (typeof window !== 'undefined' && window.ethereum) {
        // 请求用户授权连接钱包
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // 创建新的提供商实例
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(newProvider);
        
        // 获取签名者
        const newSigner = newProvider.getSigner();
        setSigner(newSigner);
        
        // 获取账户地址
        const newAccount = await newSigner.getAddress();
        setAccount(newAccount);
        
        // 获取网络信息
        const network = await newProvider.getNetwork();
        setChainId(Number(network.chainId));
        
        // 监听账户变化
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // 监听网络变化
        window.ethereum.on('chainChanged', handleChainChanged);
        
        return true;
      } else if (process.env.NODE_ENV === 'development') {
        // 在开发环境中使用测试钱包
        // const testWallet = getTestWallet();
        const testProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
        // const testSigner = testWallet.connect(testProvider);
        const accounts = await testProvider.listAccounts();
        const testSigner = testProvider.getSigner(accounts[0]); 
        
        setProvider(testProvider);
        setSigner(testSigner);
        setAccount(await testSigner.getAddress());
        setChainId(31337);
        
        return true;
      } else {
        console.log('请安装MetaMask或其他以太坊钱包');
        return false;
      }
    } catch (error) {
      console.error('连接钱包时出错:', error);
      return false;
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setContracts({
      matchingEngine: null,
      lendingPool: null,
      lendingPoolWithLP: null,
      liquidityMining: null
    });
    setContractAddresses({
      matchingEngine: null,
      lendingPool: null,
      lendingPoolWithLP: null,
      liquidityMining: null
    });
    
    // 清理事件监听器
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };

  // 处理账户变化
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // 用户断开了钱包连接
      disconnectWallet();
    } else {
      // 用户切换了账户
      setAccount(accounts[0]);
    }
  };

  // 处理网络变化
  const handleChainChanged = (_chainId) => {
    // 重新加载页面以适应新的网络
    window.location.reload();
  };

  // 连接钱包
  const connectWallet = async () => {
    const success = await initWalletProvider();
    if (success) {
      console.log('钱包连接成功');
    } else {
      console.log('钱包连接失败');
    }
  };

  // 切换网络
  const switchNetwork = async (targetChainId) => {
    try {
      if (window.ethereum) {
        // 尝试切换到指定网络
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(targetChainId) }],
        });
      } else {
        console.log('无法切换网络：未检测到以太坊提供商');
      }
    } catch (switchError) {
      // 如果网络不存在，可能会抛出错误
      console.error('切换网络时出错:', switchError);
    }
  };

  // 获取代币余额
  const getTokenBalance = async (tokenAddress, userAddress) => {
    if (!provider || !tokenAddress || !userAddress) return ethers.BigNumber.from(0);
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      return balance;
    } catch (error) {
      console.error('获取代币余额时出错:', error);
      return ethers.BigNumber.from(0);
    }
  };

  // 授权代币
  const approveToken = async (tokenAddress, spenderAddress, amount) => {
    if (!signer || !tokenAddress || !spenderAddress) return null;
    
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const tx = await tokenContract.approve(spenderAddress, amount);
      return tx;
    } catch (error) {
      console.error('授权代币时出错:', error);
      return null;
    }
  };

  // 格式化代币金额
  const formatTokenAmount = (tokenAddress, amount) => {
    if (!tokenAddress || !amount) return '0';
    
    try {
      const token = supportedTokens.find(t => t.address === tokenAddress);
      if (!token) return ethers.utils.formatUnits(amount, 18);
      
      return ethers.utils.formatUnits(amount, token.decimals);
    } catch (error) {
      console.error('格式化代币金额时出错:', error);
      return '0';
    }
  };

  // 获取代币符号
  const getTokenSymbol = (tokenAddress) => {
    if (!tokenAddress) return '';
    
    const token = supportedTokens.find(t => t.address === tokenAddress);
    return token ? token.symbol : '';
  };

  // 获取代币小数位数
  const getTokenDecimals = (tokenAddress) => {
    if (!tokenAddress) return 18;
    
    const token = supportedTokens.find(t => t.address === tokenAddress);
    return token ? token.decimals : 18;
  };

  // 当提供商和链ID可用时，获取合约地址
  useEffect(() => {
    if (provider && chainId) {
      const addresses = getContractAddresses(chainId);
      setContractAddresses(addresses);
      
      const tokens = getSupportedTokens(chainId);
      setSupportedTokens(tokens);
    }
  }, [provider, chainId]);

  // 当提供商和合约地址可用时，初始化合约实例
  useEffect(() => {
    if (provider && (contractAddresses.matchingEngine || contractAddresses.lendingPool /* || contractAddresses.lendingPoolWithLP */ || contractAddresses.liquidityMining)) {
      const matchingEngine = contractAddresses.matchingEngine ? 
        new ethers.Contract(
          contractAddresses.matchingEngine,
          UnifiedMatchingEngineABI,
          provider
        ) : null;
      
      const lendingPool = contractAddresses.lendingPool ? 
        new ethers.Contract(
          contractAddresses.lendingPool,
          FixedRateLendingPoolABI,
          provider
        ) : null;
      
      /*
      const lendingPoolWithLP = contractAddresses.lendingPoolWithLP ? 
        new ethers.Contract(
          contractAddresses.lendingPoolWithLP,
          FixedRateLendingPoolWithLPABI,
          provider
        ) : null;
      */
      
      const liquidityMining = contractAddresses.liquidityMining ? 
        new ethers.Contract(
          contractAddresses.liquidityMining,
          LiquidityMiningABI,
          provider
        ) : null;

      setContracts({
        matchingEngine,
        lendingPool,
        // lendingPoolWithLP,  // Removed LP version
        liquidityMining
      });
    }
  }, [provider, contractAddresses]);

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
        isConnected: !!account,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        getTokenBalance,
        approveToken,
        formatTokenAmount,
        getTokenSymbol,
        getTokenDecimals
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context);