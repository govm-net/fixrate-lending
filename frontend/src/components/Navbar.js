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
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useWeb3 } from '../contexts/Web3Context';
import { useApi } from '../contexts/ApiContext';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWeb3();
  const { selectedEndpoint } = useApi();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

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
        
        {isConnected ? (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
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