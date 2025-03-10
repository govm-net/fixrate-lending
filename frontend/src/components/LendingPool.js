import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Mock token data (in a real app, this would come from an API)
const mockTokens = [
  { address: '0x1234567890123456789012345678901234567890', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x2345678901234567890123456789012345678901', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0x3456789012345678901234567890123456789012', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
];

const LendingPool = () => {
  const { account, isConnected, contracts, connectWallet, getTokenBalance, approveToken } = useWeb3();
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [poolData, setPoolData] = useState({
    supportedTokens: [],
    poolBalances: {},
    availableBalances: {},
    userBalances: {},
    minInterestRate: 0,
    maxLoanDuration: 0,
    minCollateralRatio: 0
  });

  // Fetch pool data
  useEffect(() => {
    if (isConnected && contracts.lendingPool) {
      fetchPoolData();
    }
  }, [isConnected, contracts.lendingPool, account]);

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch this data from the contract
      // For now, we'll use mock data
      const mockPoolData = {
        supportedTokens: mockTokens,
        poolBalances: {
          '0x1234567890123456789012345678901234567890': ethers.utils.parseUnits('100000', 6),
          '0x2345678901234567890123456789012345678901': ethers.utils.parseUnits('50000', 18),
          '0x3456789012345678901234567890123456789012': ethers.utils.parseUnits('10', 18),
        },
        availableBalances: {
          '0x1234567890123456789012345678901234567890': ethers.utils.parseUnits('80000', 6),
          '0x2345678901234567890123456789012345678901': ethers.utils.parseUnits('40000', 18),
          '0x3456789012345678901234567890123456789012': ethers.utils.parseUnits('8', 18),
        },
        userBalances: {},
        minInterestRate: 500, // 5%
        maxLoanDuration: 30 * 24 * 60 * 60, // 30 days
        minCollateralRatio: 15000 // 150%
      };
      
      // Fetch user balances for each token
      if (account) {
        for (const token of mockTokens) {
          mockPoolData.userBalances[token.address] = await getTokenBalance(token.address);
        }
      }
      
      setPoolData(mockPoolData);
    } catch (error) {
      console.error('Error fetching pool data:', error);
      showSnackbar('Error fetching pool data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTokenChange = (event) => {
    setSelectedToken(event.target.value);
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const handleDeposit = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedToken || !amount || parseFloat(amount) <= 0) {
      showSnackbar('Please select a token and enter a valid amount', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get token details
      const token = mockTokens.find(t => t.address === selectedToken);
      const amountInWei = ethers.utils.parseUnits(amount, token.decimals);
      
      // Check user balance
      const balance = poolData.userBalances[selectedToken];
      if (balance.lt(amountInWei)) {
        showSnackbar(`Insufficient ${token.symbol} balance`, 'error');
        return;
      }
      
      // Approve token spending
      showSnackbar(`Approving ${token.symbol}...`, 'info');
      await approveToken(selectedToken, contracts.lendingPool.address, amountInWei);
      
      // Deposit to pool
      showSnackbar(`Depositing ${amount} ${token.symbol}...`, 'info');
      
      // In a real app, you would call the contract method
      // const tx = await contracts.lendingPool.deposit(selectedToken, amountInWei);
      // await tx.wait();
      
      // For demo, we'll just simulate success
      setTimeout(() => {
        // Update pool data
        fetchPoolData();
        
        // Reset form
        setAmount('');
        
        showSnackbar(`Successfully deposited ${amount} ${token.symbol}`, 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error depositing to pool:', error);
      showSnackbar('Error depositing to pool', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedToken || !amount || parseFloat(amount) <= 0) {
      showSnackbar('Please select a token and enter a valid amount', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get token details
      const token = mockTokens.find(t => t.address === selectedToken);
      const amountInWei = ethers.utils.parseUnits(amount, token.decimals);
      
      // Check available balance
      const availableBalance = poolData.availableBalances[selectedToken];
      if (availableBalance.lt(amountInWei)) {
        showSnackbar(`Insufficient available ${token.symbol} in pool`, 'error');
        return;
      }
      
      // Withdraw from pool
      showSnackbar(`Withdrawing ${amount} ${token.symbol}...`, 'info');
      
      // In a real app, you would call the contract method
      // const tx = await contracts.lendingPool.withdraw(selectedToken, amountInWei);
      // await tx.wait();
      
      // For demo, we'll just simulate success
      setTimeout(() => {
        // Update pool data
        fetchPoolData();
        
        // Reset form
        setAmount('');
        
        showSnackbar(`Successfully withdrew ${amount} ${token.symbol}`, 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error withdrawing from pool:', error);
      showSnackbar('Error withdrawing from pool', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const formatAmount = (amount, decimals) => {
    if (!amount) return '0';
    return ethers.utils.formatUnits(amount, decimals);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lending Pool
        </Typography>

        {!isConnected ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              Connect your wallet to interact with the lending pool.
            </Typography>
            <Button variant="contained" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label="Deposit" />
                    <Tab label="Withdraw" />
                  </Tabs>

                  <Box sx={{ p: 1 }}>
                    {tabValue === 0 ? (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Deposit your assets into the lending pool to earn interest. The pool will automatically match borrowers and manage loans for you.
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Withdraw your assets from the lending pool. Note that you can only withdraw available funds that are not currently being borrowed.
                      </Typography>
                    )}

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Token</InputLabel>
                      <Select
                        value={selectedToken}
                        onChange={handleTokenChange}
                        label="Token"
                      >
                        {poolData.supportedTokens.map((token) => (
                          <MenuItem key={token.address} value={token.address}>
                            {token.symbol} - {token.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      sx={{ mb: 2 }}
                      InputProps={{
                        inputProps: { min: 0, step: 0.000001 }
                      }}
                    />

                    {selectedToken && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tabValue === 0 ? (
                          <>Your balance: {formatAmount(poolData.userBalances[selectedToken], 
                            poolData.supportedTokens.find(t => t.address === selectedToken)?.decimals)} {poolData.supportedTokens.find(t => t.address === selectedToken)?.symbol}</>
                        ) : (
                          <>Available in pool: {formatAmount(poolData.availableBalances[selectedToken], 
                            poolData.supportedTokens.find(t => t.address === selectedToken)?.decimals)} {poolData.supportedTokens.find(t => t.address === selectedToken)?.symbol}</>
                        )}
                      </Typography>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={tabValue === 0 ? handleDeposit : handleWithdraw}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        tabValue === 0 ? 'Deposit' : 'Withdraw'
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pool Parameters
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Minimum Interest Rate: {poolData.minInterestRate / 100}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maximum Loan Duration: {poolData.maxLoanDuration / (24 * 60 * 60)} days
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minimum Collateral Ratio: {poolData.minCollateralRatio / 100}%
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pool Balances
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {poolData.supportedTokens.map((token) => (
                      <Box key={token.address} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          {token.symbol}: {formatAmount(poolData.poolBalances[token.address], token.decimals)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          Available: {formatAmount(poolData.availableBalances[token.address], token.decimals)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={fetchPoolData}>
                      Refresh
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

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

export default LendingPool; 