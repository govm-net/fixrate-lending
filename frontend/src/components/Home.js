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
          Welcome to Fixed Rate Lending Platform
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
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon fontSize="large" color="primary" />
                  <Typography variant="h5" component="div" sx={{ mt: 1 }}>
                    Lending Pool
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Deposit your assets to earn interest or borrow assets by providing collateral. 
                  Our fixed-rate lending pool offers predictable returns and borrowing costs.
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
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon fontSize="large" color="primary" />
                  <Typography variant="h5" component="div" sx={{ mt: 1 }}>
                    Unified Matching Engine
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
                    to="/unified-matching"
                  >
                    Go to Unified Matching
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            How It Works
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  1. Connect Your Wallet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect your Web3 wallet to interact with the decentralized lending platform.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  2. Deposit or Borrow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deposit your assets to earn interest, or borrow assets by providing sufficient collateral.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  3. Earn or Pay Fixed Rates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Earn predictable interest on your deposits or pay fixed interest on your loans.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;