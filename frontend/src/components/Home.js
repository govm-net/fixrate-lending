import React from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Container,
  Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import { useWeb3 } from '../contexts/Web3Context';

const Home = () => {
  const { isConnected, connectWallet } = useWeb3();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to P2P Lending Platform
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          A decentralized platform for fixed-rate lending and borrowing
        </Typography>
        
        {!isConnected && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={connectWallet}
              sx={{ mt: 2 }}
            >
              Connect Wallet to Get Started
            </Button>
          </Box>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom>
            Platform Overview
          </Typography>
          <Typography paragraph>
            Our P2P Lending Platform enables users to lend and borrow assets at fixed interest rates. 
            You can either participate in the lending pool to earn interest on your assets or create 
            direct peer-to-peer lending orders with customized terms.
          </Typography>
          <Typography paragraph>
            All loans are secured with collateral to ensure lender protection. The platform uses 
            Chainlink price feeds to determine accurate collateral values and maintain safe 
            loan-to-value ratios.
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon fontSize="large" color="primary" />
                  <Typography variant="h5" component="div" sx={{ mt: 1 }}>
                    Lending Pool
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Deposit your assets into the lending pool to earn interest. The pool automatically 
                  matches borrowers and manages the loans for you.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to="/lending-pool"
                  >
                    Go to Lending Pool
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon fontSize="large" color="primary" />
                  <Typography variant="h5" component="div" sx={{ mt: 1 }}>
                    P2P Marketplace
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Create or fulfill lending orders directly with other users. Set your own terms, 
                  interest rates, and collateral requirements.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to="/p2p-marketplace"
                  >
                    Go to P2P Marketplace
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon fontSize="large" color="primary" />
                  <Typography variant="h5" component="div" sx={{ mt: 1 }}>
                    Settings
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Configure your API endpoints and other settings. Connect to different networks 
                  or customize your experience.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to="/settings"
                  >
                    Go to Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 