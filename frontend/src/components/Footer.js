import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { useApi } from '../contexts/ApiContext';

const Footer = () => {
  const { selectedEndpoint } = useApi();
  
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
          <Link color="inherit" href="https://github.com/yourusername/p2p-lending-frontend">
            P2P Lending Platform
          </Link>{' '}
          {new Date().getFullYear()}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Connected to: {selectedEndpoint?.name || 'Not connected'} 
          {selectedEndpoint?.url && ` (${selectedEndpoint.url})`}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 