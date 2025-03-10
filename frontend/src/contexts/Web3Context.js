import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { useApi } from './ApiContext';

// ABI imports
import P2PLendingMarketplaceABI from '../utils/abis/P2PLendingMarketplace.json';
import FixedRateLendingPoolABI from '../utils/abis/FixedRateLendingPool.json';
import ERC20ABI from '../utils/abis/ERC20.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const { selectedEndpoint } = useApi();
  
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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize provider
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
        // Reload the page when chain changes
        window.location.reload();
      });

      // Get initial chain ID
      provider.getNetwork().then(network => {
        setChainId(network.chainId);
      });

      return () => {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      };
    }
  }, []);

  // Update contract addresses when endpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      // In a real app, you would fetch contract addresses from the API
      // For now, we'll use placeholder addresses
      setContractAddresses({
        marketplace: '0x123456789abcdef123456789abcdef123456789a',
        lendingPool: '0xabcdef123456789abcdef123456789abcdef1234'
      });
    }
  }, [selectedEndpoint]);

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

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setSigner(signer);
        setIsConnected(true);
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
    
    const tokenContract = getTokenContract(tokenAddress);
    if (!tokenContract) return ethers.BigNumber.from(0);
    
    try {
      return await tokenContract.balanceOf(address);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return ethers.BigNumber.from(0);
    }
  };

  // Approve token spending
  const approveToken = async (tokenAddress, spender, amount) => {
    if (!signer || !tokenAddress || !spender) {
      throw new Error('Missing required parameters');
    }
    
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

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        contracts,
        contractAddresses,
        isConnected,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        getTokenContract,
        getTokenBalance,
        approveToken
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => useContext(Web3Context); 