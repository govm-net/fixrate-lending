import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { useWeb3 } from '../contexts/Web3Context';
import { getNetworkName } from '../utils/networkConfig';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWeb3();

  
  const [anchorEl, setAnchorEl] = useState(null);
  const [networkMenuAnchorEl, setNetworkMenuAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const networkMenuOpen = Boolean(networkMenuAnchorEl);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNetworkMenu = (event) => {
    setNetworkMenuAnchorEl(event.currentTarget);
  };

  const handleNetworkMenuClose = () => {
    setNetworkMenuAnchorEl(null);
  };

  // 切换到指定网络
  const switchNetwork = async (networkId) => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
    }
    
    handleNetworkMenuClose();
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 获取当前网络名称
  const networkName = getNetworkName(chainId) || `Chain ID: ${chainId || 'Unknown'}`;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
          P2P Lending Platform
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button color="inherit" component={Link} to="/lending-pool">
            Lending Pool
          </Button>
          <Button color="inherit" component={Link} to="/p2p-marketplace">
            P2P Marketplace
          </Button>
          <Button color="inherit" component={Link} to="/my-orders">
            My Orders
          </Button>
          <Button color="inherit" component={Link} to="/settings">
            Settings
          </Button>
        </Box>
        
        {isConnected && (
          <Tooltip title="Switch Network">
            <Chip
              icon={<NetworkCheckIcon />}
              label={networkName}
              variant="outlined"
              onClick={handleNetworkMenu}
              color="secondary"
              sx={{ color: 'white', borderColor: 'white', mr: 1 }}
            />
          </Tooltip>
        )}
        
        <Menu
          id="network-menu"
          anchorEl={networkMenuAnchorEl}
          open={networkMenuOpen}
          onClose={handleNetworkMenuClose}
          MenuListProps={{
            'aria-labelledby': 'network-button',
          }}
        >
          <MenuItem onClick={() => switchNetwork(1)}>Ethereum Mainnet</MenuItem>
          <MenuItem onClick={() => switchNetwork(11155111)}>Sepolia Testnet</MenuItem>
          <Divider />
          <MenuItem onClick={() => switchNetwork(137)}>Polygon Mainnet</MenuItem>
          <MenuItem onClick={() => switchNetwork(80001)}>Mumbai Testnet</MenuItem>
          <Divider />
          <MenuItem onClick={() => switchNetwork(56)}>Binance Smart Chain</MenuItem>
          <MenuItem onClick={() => switchNetwork(97)}>BSC Testnet</MenuItem>
          <Divider />
          <MenuItem onClick={() => switchNetwork(1337)}>Ganache</MenuItem>
          <MenuItem onClick={() => switchNetwork(31337)}>Hardhat Network</MenuItem>
        </Menu>
        
        {isConnected ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              icon={<AccountBalanceWalletIcon />}
              label={formatAddress(account)}
              variant="outlined"
              onClick={disconnectWallet}
              color="secondary"
              sx={{ color: 'white', borderColor: 'white' }}
            />
          </Box>
        ) : (
          <Button 
            color="inherit" 
            variant="outlined" 
            onClick={connectWallet}
            startIcon={<AccountBalanceWalletIcon />}
          >
            Connect Wallet
          </Button>
        )}
        
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose} component={Link} to="/lending-pool">
              Lending Pool
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/p2p-marketplace">
              P2P Marketplace
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/my-orders">
              My Orders
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/settings">
              Settings
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 