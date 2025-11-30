import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';

const Footer = () => {
  const { chainId } = useWeb3();
  
  // 获取网络名称
  const getNetworkName = () => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Mumbai Testnet';
      case 56:
        return 'BSC Mainnet';
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

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <Link color="inherit" href="https://github.com/yourusername/fixrate-lending">
            Fixed Rate Lending Platform
          </Link>{' '}
          {new Date().getFullYear()}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Connected to: {networkName}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;