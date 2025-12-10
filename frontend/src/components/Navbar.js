import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 引入 useTranslation hook
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
  Box,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { useWeb3 } from '../contexts/Web3Context';

const Navbar = () => {
  const { t, i18n } = useTranslation(); // 使用 useTranslation hook
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
  
  // 切换语言
  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
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
          {t('navbar.platform_name')}
        </Typography>
        
        {/* 语言选择器 */}
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 2 }}>
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="zh">中文</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button color="inherit" component={Link} to="/lending-pool">
            {t('navbar.lending_pool')}
          </Button>
          {/* <Button color="inherit" component={Link} to="/lending-pool-with-lp">
            {t('navbar.lending_pool_lp')}
          </Button> */}
          <Button color="inherit" component={Link} to="/unified-matching">
            {t('navbar.unified_matching')}
          </Button>
          <Button color="inherit" component={Link} to="/liquidity-mining">
            {t('navbar.liquidity_mining')}
          </Button>
          <Button color="inherit" component={Link} to="/my-orders">
            {t('navbar.my_orders')}
          </Button>
          <Button color="inherit" component={Link} to="/settings">
            {t('navbar.settings')}
          </Button>
        </Box>
        
        {isConnected && (
          <Tooltip title={t('navbar.switch_network')}>
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
            {t('navbar.connect_wallet')}
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
              {t('navbar.lending_pool')}
            </MenuItem>
            {/* <MenuItem onClick={handleClose} component={Link} to="/lending-pool-with-lp">
              {t('navbar.lending_pool_lp')}
            </MenuItem> */}
            <MenuItem onClick={handleClose} component={Link} to="/unified-matching">
              {t('navbar.unified_matching')}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/liquidity-mining">
              {t('navbar.liquidity_mining')}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/my-orders">
              {t('navbar.my_orders')}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/settings">
              {t('navbar.settings')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;