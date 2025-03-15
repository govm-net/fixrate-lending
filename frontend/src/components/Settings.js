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
import { useApi } from '../contexts/ApiContext';
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
    apiEndpoints,
    selectedEndpoint,
    setSelectedEndpoint,
    addApiEndpoint,
    removeApiEndpoint,
    updateApiEndpoint,
    resetApiEndpoints
  } = useApi();

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
    if (index >= 0) {
      // Edit existing endpoint
      const endpoint = apiEndpoints[index];
      setEndpointName(endpoint.name);
      setEndpointUrl(endpoint.url);
      setEndpointChainId(endpoint.chainId);
      setEditIndex(index);
    } else {
      // Add new endpoint
      setEndpointName('');
      setEndpointUrl('');
      setEndpointChainId(1);
      setEditIndex(-1);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveEndpoint = () => {
    if (!endpointName || !endpointUrl) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    const endpoint = {
      name: endpointName,
      url: endpointUrl,
      chainId: endpointChainId
    };

    if (editIndex >= 0) {
      updateApiEndpoint(editIndex, endpoint);
      showSnackbar('API endpoint updated successfully');
    } else {
      addApiEndpoint(endpoint);
      showSnackbar('API endpoint added successfully');
    }

    handleCloseDialog();
  };

  const handleDeleteEndpoint = (index) => {
    removeApiEndpoint(index);
    showSnackbar('API endpoint removed successfully');
  };

  const handleSelectEndpoint = async (endpoint) => {
    setSelectedEndpoint(endpoint);
    
    // 如果端点的链ID与当前链ID不同，尝试切换网络
    if (endpoint.chainId !== chainId) {
      try {
        // 显示正在切换网络的提示
        showSnackbar(`Switching to ${getNetworkName(endpoint.chainId)}...`, 'info');
        
        // 尝试切换网络
        await switchNetwork(endpoint.chainId);
        
        showSnackbar(`Connected to ${endpoint.name} and switched to ${getNetworkName(endpoint.chainId)}`, 'success');
      } catch (error) {
        console.error('Error switching network:', error);
        
        // 提供更具体的错误消息
        let errorMessage = error.message;
        if (error.code === 4001) {
          errorMessage = 'You rejected the network switch request.';
        } else if (error.message.includes('already pending')) {
          errorMessage = 'A network switch request is already pending. Please check your wallet.';
        }
        
        showSnackbar(`Connected to ${endpoint.name}, but failed to switch network: ${errorMessage}`, 'warning');
      }
    } else {
      showSnackbar(`Connected to ${endpoint.name}`, 'success');
    }
  };

  const handleResetEndpoints = () => {
    resetApiEndpoints();
    showSnackbar('API endpoints reset to defaults');
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
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        {/* 添加网络卡片 - 当不在本地网络时显示 */}
        {!isLocalNetwork && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Development Networks
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You can add and switch to local development networks for testing.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      Hardhat Network
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Local development network running on http://localhost:8545
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Chain ID: 31337
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      fullWidth
                      onClick={() => handleSwitchNetwork(31337)}
                    >
                      Switch to Hardhat Network
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      Ganache
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Local development network running on http://localhost:7545
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Chain ID: 1337
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      fullWidth
                      onClick={() => handleSwitchNetwork(1337)}
                    >
                      Switch to Ganache
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* 测试代币卡片 - 仅在本地网络显示 */}
        {isLocalNetwork && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Test Tokens
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You are connected to a local development network. Use the following scripts to get test tokens:
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                To get test ETH:
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', mb: 2, overflowX: 'auto' }}>
                npx hardhat send-test-eth --network localhost YOUR_ADDRESS 1.0
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Replace YOUR_ADDRESS with your wallet address and 1.0 with the amount of ETH you want.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                To get test tokens (USDC, DAI, WETH):
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem', mb: 2, overflowX: 'auto' }}>
                npx hardhat mint-test-tokens --network localhost TOKEN_ADDRESS YOUR_ADDRESS 1000
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Replace TOKEN_ADDRESS with the token contract address, YOUR_ADDRESS with your wallet address, and 1000 with the amount of tokens you want.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Token Addresses:
              </Typography>
              <Grid container spacing={2}>
                {mockTokens.map((token) => (
                  <Grid item xs={12} sm={6} md={4} key={token.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {token.symbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {token.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, wordBreak: 'break-all' }}>
                          {token.address}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth
                          onClick={() => {
                            navigator.clipboard.writeText(token.address);
                            showSnackbar(`${token.symbol} address copied to clipboard`, 'success');
                          }}
                          startIcon={<ContentCopyIcon />}
                        >
                          Copy Address
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">API Endpoints</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={handleResetEndpoints}
                sx={{ mr: 1 }}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Endpoint
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Configure the API endpoints for connecting to different networks. The selected endpoint will be used for all API calls.
          </Typography>

          <List>
            {apiEndpoints.map((endpoint, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  selected={selectedEndpoint === endpoint}
                  onClick={() => handleSelectEndpoint(endpoint)}
                >
                  <ListItemText
                    primary={endpoint.name}
                    secondary={`${endpoint.url} (Chain ID: ${endpoint.chainId})`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteEndpoint(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Add/Edit Endpoint Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editIndex >= 0 ? 'Edit API Endpoint' : 'Add API Endpoint'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Endpoint Name"
            fullWidth
            value={endpointName}
            onChange={(e) => setEndpointName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Endpoint URL"
            fullWidth
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Chain ID</InputLabel>
            <Select
              value={endpointChainId}
              onChange={(e) => setEndpointChainId(e.target.value)}
              label="Chain ID"
            >
              <MenuItem value={1}>1 - Ethereum Mainnet</MenuItem>
              <MenuItem value={5}>5 - Goerli Testnet</MenuItem>
              <MenuItem value={11155111}>11155111 - Sepolia Testnet</MenuItem>
              <MenuItem value={137}>137 - Polygon Mainnet</MenuItem>
              <MenuItem value={80001}>80001 - Mumbai Testnet</MenuItem>
              <MenuItem value={1337}>1337 - Local Development</MenuItem>
              <MenuItem value={31337}>31337 - Hardhat Network</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEndpoint} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 