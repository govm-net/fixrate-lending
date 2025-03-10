import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Mock token data (in a real app, this would come from an API)
const mockTokens = [
  { address: '0x1234567890123456789012345678901234567890', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x2345678901234567890123456789012345678901', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0x3456789012345678901234567890123456789012', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
];

// Mock orders data
const mockOrders = [
  {
    id: 1,
    lender: '0x4567890123456789012345678901234567890123',
    lendToken: '0x1234567890123456789012345678901234567890',
    lendAmount: ethers.utils.parseUnits('1000', 6),
    collateralToken: '0x3456789012345678901234567890123456789012',
    collateralAmount: ethers.utils.parseUnits('0.5', 18),
    interestRate: 500, // 5%
    duration: 30 * 24 * 60 * 60, // 30 days
    status: 'PENDING'
  },
  {
    id: 2,
    lender: '0x5678901234567890123456789012345678901234',
    lendToken: '0x2345678901234567890123456789012345678901',
    lendAmount: ethers.utils.parseUnits('5000', 18),
    collateralToken: '0x3456789012345678901234567890123456789012',
    collateralAmount: ethers.utils.parseUnits('2.5', 18),
    interestRate: 700, // 7%
    duration: 60 * 24 * 60 * 60, // 60 days
    status: 'PENDING'
  },
  {
    id: 3,
    lender: '0x6789012345678901234567890123456789012345',
    lendToken: '0x3456789012345678901234567890123456789012',
    lendAmount: ethers.utils.parseUnits('1', 18),
    collateralToken: '0x1234567890123456789012345678901234567890',
    lendAmount: ethers.utils.parseUnits('1800', 6),
    interestRate: 300, // 3%
    duration: 15 * 24 * 60 * 60, // 15 days
    status: 'PENDING'
  }
];

const P2PMarketplace = () => {
  const { account, isConnected, contracts, connectWallet, getTokenBalance, approveToken } = useWeb3();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Create order form state
  const [lendToken, setLendToken] = useState('');
  const [lendAmount, setLendAmount] = useState('');
  const [collateralToken, setCollateralToken] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  
  // Orders state
  const [availableOrders, setAvailableOrders] = useState([]);
  const [userBalances, setUserBalances] = useState({});

  // Fetch data
  useEffect(() => {
    if (isConnected) {
      fetchOrders();
      fetchUserBalances();
    }
  }, [isConnected, account]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch this data from the contract or API
      // For now, we'll use mock data
      setAvailableOrders(mockOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      showSnackbar('Error fetching orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalances = async () => {
    try {
      if (!account) return;
      
      const balances = {};
      
      for (const token of mockTokens) {
        balances[token.address] = await getTokenBalance(token.address);
      }
      
      setUserBalances(balances);
      
    } catch (error) {
      console.error('Error fetching user balances:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateOrder = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!lendToken || !lendAmount || !collateralToken || !collateralAmount || !interestRate || !duration) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get token details
      const token = mockTokens.find(t => t.address === lendToken);
      const amountInWei = ethers.utils.parseUnits(lendAmount, token.decimals);
      
      // Check user balance
      const balance = userBalances[lendToken];
      if (balance.lt(amountInWei)) {
        showSnackbar(`Insufficient ${token.symbol} balance`, 'error');
        return;
      }
      
      // Approve token spending
      showSnackbar(`Approving ${token.symbol}...`, 'info');
      await approveToken(lendToken, contracts.marketplace.address, amountInWei);
      
      // Create order
      showSnackbar(`Creating order...`, 'info');
      
      // In a real app, you would call the contract method
      // const tx = await contracts.marketplace.createLendingOrder(
      //   lendToken,
      //   amountInWei,
      //   collateralToken,
      //   ethers.utils.parseUnits(collateralAmount, mockTokens.find(t => t.address === collateralToken).decimals),
      //   parseInt(interestRate) * 100, // Convert to basis points
      //   parseInt(duration) * 24 * 60 * 60 // Convert to seconds
      // );
      // await tx.wait();
      
      // For demo, we'll just simulate success
      setTimeout(() => {
        // Reset form
        setLendToken('');
        setLendAmount('');
        setCollateralToken('');
        setCollateralAmount('');
        setInterestRate('');
        setDuration('');
        
        // Refresh data
        fetchOrders();
        fetchUserBalances();
        
        showSnackbar('Order created successfully', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating order:', error);
      showSnackbar('Error creating order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillOrder = async (orderId) => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    try {
      setLoading(true);
      
      const order = availableOrders.find(o => o.id === orderId);
      if (!order) {
        showSnackbar('Order not found', 'error');
        return;
      }
      
      // Get token details
      const token = mockTokens.find(t => t.address === order.collateralToken);
      
      // Check user balance
      const balance = userBalances[order.collateralToken];
      if (balance.lt(order.collateralAmount)) {
        showSnackbar(`Insufficient ${token.symbol} balance for collateral`, 'error');
        return;
      }
      
      // Approve token spending
      showSnackbar(`Approving ${token.symbol} for collateral...`, 'info');
      await approveToken(order.collateralToken, contracts.marketplace.address, order.collateralAmount);
      
      // Fulfill order
      showSnackbar(`Fulfilling order...`, 'info');
      
      // In a real app, you would call the contract method
      // const tx = await contracts.marketplace.fulfillLendingOrder(orderId);
      // await tx.wait();
      
      // For demo, we'll just simulate success
      setTimeout(() => {
        // Refresh data
        fetchOrders();
        fetchUserBalances();
        
        showSnackbar('Order fulfilled successfully', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error fulfilling order:', error);
      showSnackbar('Error fulfilling order', 'error');
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

  const getTokenSymbol = (address) => {
    const token = mockTokens.find(t => t.address === address);
    return token ? token.symbol : 'Unknown';
  };

  const getTokenDecimals = (address) => {
    const token = mockTokens.find(t => t.address === address);
    return token ? token.decimals : 18;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          P2P Marketplace
        </Typography>

        {!isConnected ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              Connect your wallet to interact with the P2P marketplace.
            </Typography>
            <Button variant="contained" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </Paper>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Available Orders" />
                <Tab label="Create Order" />
              </Tabs>

              {tabValue === 0 ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Browse available lending orders. You can fulfill an order by providing the required collateral.
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : availableOrders.length === 0 ? (
                    <Alert severity="info">No orders available</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Lend</TableCell>
                            <TableCell>Collateral</TableCell>
                            <TableCell>Interest Rate</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {availableOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                {formatAmount(order.lendAmount, getTokenDecimals(order.lendToken))} {getTokenSymbol(order.lendToken)}
                              </TableCell>
                              <TableCell>
                                {formatAmount(order.collateralAmount, getTokenDecimals(order.collateralToken))} {getTokenSymbol(order.collateralToken)}
                              </TableCell>
                              <TableCell>
                                {order.interestRate / 100}%
                              </TableCell>
                              <TableCell>
                                {order.duration / (24 * 60 * 60)} days
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleFulfillOrder(order.id)}
                                  disabled={loading}
                                >
                                  Fulfill
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create a new lending order. You will lend your tokens to borrowers who provide collateral.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Lend Token</InputLabel>
                        <Select
                          value={lendToken}
                          onChange={(e) => setLendToken(e.target.value)}
                          label="Lend Token"
                        >
                          {mockTokens.map((token) => (
                            <MenuItem key={token.address} value={token.address}>
                              {token.symbol} - {token.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Lend Amount"
                        type="number"
                        value={lendAmount}
                        onChange={(e) => setLendAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          inputProps: { min: 0, step: 0.000001 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Collateral Token</InputLabel>
                        <Select
                          value={collateralToken}
                          onChange={(e) => setCollateralToken(e.target.value)}
                          label="Collateral Token"
                        >
                          {mockTokens.map((token) => (
                            <MenuItem key={token.address} value={token.address}>
                              {token.symbol} - {token.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Collateral Amount"
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          inputProps: { min: 0, step: 0.000001 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Interest Rate (%)"
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          inputProps: { min: 0, max: 100, step: 0.1 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Duration (days)"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          inputProps: { min: 1, max: 365, step: 1 }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {lendToken && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Your balance: {formatAmount(userBalances[lendToken], getTokenDecimals(lendToken))} {getTokenSymbol(lendToken)}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCreateOrder}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Order'}
                  </Button>
                </Box>
              )}
            </Paper>
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

export default P2PMarketplace; 