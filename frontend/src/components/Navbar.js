import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { useWeb3 } from '../contexts/Web3Context';

const Navbar = () => {
  const { isConnected, account, chainId, connectWallet, disconnectWallet, switchNetwork } = useWeb3();
  const [anchorEl, setAnchorEl] = useState(null);
  const [networkAnchorEl, setNetworkAnchorEl] = useState(null);
  
  const open = Boolean(anchorEl);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNetworkMenu = (event) => {
    setNetworkAnchorEl(event.currentTarget);
  };
  
  const handleNetworkClose = () => {
    setNetworkAnchorEl(null);
  };
  
  // 获取网络名称
  const getNetworkName = () => {
    switch (chainId) {
      case 1:
        return 'Ethereum';
      case 5:
        return 'Goerli';
      case 137:
        return 'Polygon';
      case 80001:
        return 'Mumbai';
      case 56:
        return 'BSC';
      case 97:
        return 'BSC Testnet';
      case 31337:
        return 'Localhost';
      case 1337:
        return 'Ganache';
      default:
        return 'Unknown Network';
    }
  };
  
  const networkName = getNetworkName();
  
  // 网络切换处理
  const handleSwitchNetwork = async (targetChainId) => {
    try {
      await switchNetwork(targetChainId);
      handleNetworkClose();
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
          Fixed Rate Lending Platform
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button color="inherit" component={Link} to="/lending-pool">
            Lending Pool
          </Button>
          <Button color="inherit" component={Link} to="/unified-matching">
            Unified Matching
          </Button>
          <Button color="inherit" component={Link} to="/liquidity-mining">
            Liquidity Mining
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
        
        {!isConnected ? (
          <Button color="inherit" onClick={connectWallet}>
            Connect Wallet
          </Button>
        ) : (
          <Tooltip title={`Connected: ${account?.substring(0, 6)}...${account?.substring(account.length - 4)}`}>
            <Chip
              label={`${account?.substring(0, 6)}...${account?.substring(account.length - 4)}`}
              variant="outlined"
              color="success"
              onDelete={disconnectWallet}
              sx={{ color: 'white', borderColor: 'white' }}
            />
          </Tooltip>
        )}
        
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
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
            <MenuItem onClick={handleClose} component={Link} to="/unified-matching">
              Unified Matching
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/liquidity-mining">
              Liquidity Mining
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