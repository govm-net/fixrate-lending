import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

// 模拟代币数据
const mockTokens = [
  { 
    id: 'usdc',
    address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // 实际的 MockERC20 合约地址
    symbol: 'USDC', 
    name: 'USD Coin', 
    decimals: 6,
    amount: '1000'
  },
  { 
    id: 'dai',
    address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // 实际的 MockERC20 合约地址
    symbol: 'DAI', 
    name: 'Dai Stablecoin', 
    decimals: 18,
    amount: '1000'
  },
  { 
    id: 'weth',
    address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // 实际的 MockERC20 合约地址
    symbol: 'WETH', 
    name: 'Wrapped Ether', 
    decimals: 18,
    amount: '10'
  }
];

const Settings = () => {

  const {
    isConnected,
    chainId,
    connectWallet,
    switchNetwork,
  } = useWeb3();

  const [openDialog, setOpenDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [endpointName, setEndpointName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [endpointChainId, setEndpointChainId] = useState(1);
  const [isLocalNetwork, setIsLocalNetwork] = useState(false);
  const [isTestNetwork, setIsTestNetwork] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 检查是否为本地网络或测试网
  useEffect(() => {
    // 本地网络
    if (chainId === 1337 || chainId === 31337) {
      setIsLocalNetwork(true);
    } else {
      setIsLocalNetwork(false);
    }
    
    // 测试网
    if (chainId === 5 || chainId === 11155111 || chainId === 80001 || chainId === 1337 || chainId === 31337) {
      setIsTestNetwork(true);
    } else {
      setIsTestNetwork(false);
    }
  }, [chainId]);

  const handleOpenDialog = (index = -1) => {
    // 移除与 useApi 相关的逻辑
  };

  const handleCloseDialog = () => {
    // 移除与 useApi 相关的逻辑
  };

  const handleSaveEndpoint = () => {
    // 移除与 useApi 相关的逻辑
  };

  const handleDeleteEndpoint = (index) => {
    // 移除与 useApi 相关的逻辑
  };

  const handleSelectEndpoint = async (endpoint) => {
    // 移除与 useApi 相关的逻辑
  };

  const handleResetEndpoints = () => {
    // 移除与 useApi 相关的逻辑
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 格式化地址显示
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 获取网络名称
  const getNetworkName = (id = chainId) => {
    switch (id) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Mumbai Testnet';
      case 1337:
        return 'Local Development';
      case 31337:
        return 'Hardhat Network';
      default:
        return 'Unknown Network';
    }
  };

  // 切换网络
  const handleSwitchNetwork = async (targetChainId) => {
    if (!isConnected) {
      // 如果钱包未连接，先连接钱包
      connectWallet();
      showSnackbar('Please connect your wallet first', 'info');
      return;
    }

    try {
      showSnackbar(`Switching to ${getNetworkName(targetChainId)}...`, 'info');
      
      // 检查本地网络是否运行
      if (targetChainId === 31337 || targetChainId === 1337) {
        try {
          // 尝试连接到本地网络
          const testProvider = new ethers.providers.JsonRpcProvider(
            targetChainId === 31337 ? 'http://127.0.0.1:8545' : 'http://127.0.0.1:7545'
          );
          
          // 尝试获取区块号，如果成功，说明本地网络正在运行
          await testProvider.getBlockNumber();
        } catch (error) {
          console.error('Error connecting to local network:', error);
          showSnackbar(
            `Failed to connect to ${getNetworkName(targetChainId)}. Please make sure your local node is running on ${
              targetChainId === 31337 ? 'http://127.0.0.1:8545' : 'http://127.0.0.1:7545'
            }`,
            'error'
          );
          return;
        }
      }
      
      // 尝试切换网络
      await switchNetwork(targetChainId);
      
      showSnackbar(`Successfully switched to ${getNetworkName(targetChainId)}`, 'success');
    } catch (error) {
      console.error('Error switching network:', error);
      
      // 提供更具体的错误消息
      let errorMessage = error.message;
      if (error.code === 4001) {
        errorMessage = 'You rejected the network switch request.';
      } else if (error.message.includes('already pending')) {
        errorMessage = 'A network switch request is already pending. Please check your wallet.';
      } else if (error.message.includes('network configuration not found')) {
        errorMessage = 'Network configuration not found. Please check your settings.';
      } else if (error.message.includes('Unrecognized chain ID')) {
        errorMessage = `Unrecognized chain ID. Please make sure your local ${
          targetChainId === 31337 ? 'Hardhat' : 'Ganache'
        } node is running.`;
      }
      
      showSnackbar(`Failed to switch network: ${errorMessage}`, 'error');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Current network information and connection status.
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Chain ID:</strong> {chainId || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Network:</strong> {getNetworkName(chainId)}
                  </Typography>
                </Box>
                
                <Button 
                  variant="contained" 
                  onClick={isConnected ? () => {} : connectWallet}
                  disabled={isConnected}
                >
                  {isConnected ? 'Connected' : 'Connect Wallet'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Supported Tokens
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Tokens supported on the current network.
                </Typography>
                
                <List>
                  {mockTokens.map((token) => (
                    <ListItem key={token.id} divider>
                      <ListItemText 
                        primary={`${token.symbol} (${token.name})`} 
                        secondary={`Address: ${formatAddress(token.address)}`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Copy address">
                          <IconButton 
                            edge="end" 
                            aria-label="copy"
                            onClick={() => navigator.clipboard.writeText(token.address)}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Settings; 