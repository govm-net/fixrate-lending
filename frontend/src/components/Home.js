import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 引入 useTranslation hook
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import { useWeb3 } from '../contexts/Web3Context';

const Home = () => {
  const { t } = useTranslation(); // 使用 useTranslation hook
  const { isConnected, connectWallet } = useWeb3();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          {t('home.title')}
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          {t('home.subtitle')}
        </Typography>
        
        {!isConnected && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={connectWallet}
              sx={{ mt: 2 }}
            >
              {t('home.connect_wallet')}
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
                    {t('home.lending_pool.title')}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('home.lending_pool.description')}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to="/lending-pool"
                  >
                    {t('home.lending_pool.title')}
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
                    {t('home.unified_matching.title')}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('home.unified_matching.description')}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to="/unified-matching"
                  >
                    {t('home.unified_matching.title')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            {t('home.how_it_works')}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('home.step1.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.step1.description')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('home.step2.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.step2.description')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('home.step3.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.step3.description')}
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