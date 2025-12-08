import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

const UnifiedMatching = () => {
  const { 
    account, 
    chainId,
    isConnected, 
    contracts, 
    connectWallet, 
    getTokenBalance, 
    approveToken,
    supportedTokens,
    formatTokenAmount,
    getTokenSymbol
  } = useWeb3();
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedToken, setSelectedToken] = useState('');
  const [lendAmount, setLendAmount] = useState('');
  const [collateralToken, setCollateralToken] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [orders, setOrders] = useState([]);
  const [userBalances, setUserBalances] = useState({});

  // 定义showSnackbar函数
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // 当支持的代币变化时，重置选择的代币
  useEffect(() => {
    if (supportedTokens.length > 0 && !selectedToken) {
      setSelectedToken(supportedTokens[0].address);
    }
    if (supportedTokens.length > 0 && !collateralToken) {
      setCollateralToken(supportedTokens[0].address);
    }
  }, [supportedTokens, selectedToken, collateralToken]);

  // Fetch user balances
  const fetchUserBalances = useCallback(async () => {
    if (!account || supportedTokens.length === 0) return;
    
    try {
      const balances = {};
      for (const token of supportedTokens) {
        balances[token.address] = await getTokenBalance(token.address);
      }
      setUserBalances(balances);
    } catch (error) {
      console.error('Error fetching user balances:', error);
    }
  }, [account, supportedTokens, getTokenBalance]);

  useEffect(() => {
    if (isConnected) {
      fetchUserBalances();
    }
  }, [isConnected, fetchUserBalances]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!isConnected || !contracts.matchingEngine) return;
    
    try {
      // In a real implementation, you would fetch actual orders from the contract or an API
      // For now, we'll use mock data
      const mockOrders = [
        {
          id: '0x1234567890abcdef',
          lender: '0x4567890123456789012345678901234567890123',
          borrower: '0x7890123456789012345678901234567890123456',
          lendToken: supportedTokens[0]?.address || '',
          lendAmount: ethers.utils.parseUnits('1000', 6),
          collateralToken: supportedTokens[1]?.address || '',
          collateralAmount: ethers.utils.parseUnits('2', 18),
          interestRate: 500, // 5%
          duration: 30 * 24 * 60 * 60, // 30 days
          status: 'ACTIVE',
          timestamp: Math.floor(Date.now() / 1000) - 24 * 60 * 60 // 1 day ago
        },
        {
          id: '0xabcdef1234567890',
          lender: '0x1234567890123456789012345678901234567890',
          borrower: account,
          lendToken: supportedTokens[1]?.address || '',
          lendAmount: ethers.utils.parseUnits('1', 18),
          collateralToken: supportedTokens[0]?.address || '',
          collateralAmount: ethers.utils.parseUnits('2000', 6),
          interestRate: 300, // 3%
          duration: 15 * 24 * 60 * 60, // 15 days
          status: 'PENDING',
          timestamp: Math.floor(Date.now() / 1000) - 60 * 60 // 1 hour ago
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showSnackbar('Error fetching orders', 'error');
    }
  }, [isConnected, contracts, supportedTokens, account, showSnackbar]);

  useEffect(() => {
    if (isConnected) {
      fetchOrders();
    }
  }, [isConnected, fetchOrders]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateBorrowOrder = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedToken || !lendAmount || !collateralToken || !collateralAmount || 
        !interestRate || !duration) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get token details
      const lendToken = supportedTokens.find(t => t.address === selectedToken);
      const collatToken = supportedTokens.find(t => t.address === collateralToken);
      
      if (!lendToken || !collatToken) {
        showSnackbar('Invalid token selected', 'error');
        return;
      }
      
      const lendAmountInWei = ethers.utils.parseUnits(lendAmount, lendToken.decimals);
      const collateralAmountInWei = ethers.utils.parseUnits(collateralAmount, collatToken.decimals);
      const interestRateInBps = parseInt(interestRate) * 100; // Convert percentage to basis points
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60; // Convert days to seconds
      
      // Check user balance
      const balance = userBalances[collateralToken];
      if (balance.lt(collateralAmountInWei)) {
        showSnackbar(`Insufficient ${collatToken.symbol} balance`, 'error');
        return;
      }
      
      // In a real implementation, you would:
      // 1. Sign the order using EIP-712
      // 2. Submit the order to the matching engine
      // For now, we'll just simulate the process
      
      showSnackbar('Creating borrow order...', 'info');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form
      setLendAmount('');
      setCollateralAmount('');
      setInterestRate('');
      setDuration('');
      
      // Refresh orders
      fetchOrders();
      
      showSnackbar('Borrow order created successfully', 'success');
      
    } catch (error) {
      console.error('Error creating borrow order:', error);
      showSnackbar(`Error creating borrow order: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLendOrder = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedToken || !lendAmount || !collateralToken || !collateralAmount || 
        !interestRate || !duration) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Get token details
      const lendToken = supportedTokens.find(t => t.address === selectedToken);
      const collatToken = supportedTokens.find(t => t.address === collateralToken);
      
      if (!lendToken || !collatToken) {
        showSnackbar('Invalid token selected', 'error');
        return;
      }
      
      const lendAmountInWei = ethers.utils.parseUnits(lendAmount, lendToken.decimals);
      const collateralAmountInWei = ethers.utils.parseUnits(collateralAmount, collatToken.decimals);
      const interestRateInBps = parseInt(interestRate) * 100; // Convert percentage to basis points
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60; // Convert days to seconds
      
      // Check user balance
      const balance = userBalances[selectedToken];
      if (balance.lt(lendAmountInWei)) {
        showSnackbar(`Insufficient ${lendToken.symbol} balance`, 'error');
        return;
      }
      
      // Approve token spending
      showSnackbar(`Approving ${lendToken.symbol}...`, 'info');
      await approveToken(selectedToken, contracts.matchingEngine.address, lendAmountInWei);
      
      // In a real implementation, you would:
      // 1. Sign the order using EIP-712
      // 2. Submit the order to the matching engine
      // For now, we'll just simulate the process
      
      showSnackbar('Creating lend order...', 'info');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form
      setLendAmount('');
      setCollateralAmount('');
      setInterestRate('');
      setDuration('');
      
      // Refresh orders
      fetchOrders();
      
      showSnackbar('Lend order created successfully', 'success');
      
    } catch (error) {
      console.error('Error creating lend order:', error);
      showSnackbar(`Error creating lend order: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setLoading(true);
      
      // In a real implementation, you would:
      // 1. Sign the counter-order
      // 2. Submit both orders to the matching engine for execution
      // For now, we'll just simulate the process
      
      showSnackbar('Accepting order...', 'info');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh orders
      fetchOrders();
      
      showSnackbar('Order accepted successfully', 'success');
      
    } catch (error) {
      console.error('Error accepting order:', error);
      showSnackbar(`Error accepting order: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return <Chip label="Pending" color="primary" size="small" />;
      case 'ACTIVE':
        return <Chip label="Active" color="success" size="small" />;
      case 'REPAID':
        return <Chip label="Repaid" color="default" size="small" />;
      case 'LIQUIDATED':
        return <Chip label="Liquidated" color="error" size="small" />;
      case 'CANCELLED':
        return <Chip label="Cancelled" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Unified Matching Engine
        </Typography>

        {!isConnected ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              Connect your wallet to use the unified matching engine.
            </Typography>
            <Button variant="contained" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </Paper>
        ) : supportedTokens.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              No supported tokens found for the current network (Chain ID: {chainId}).
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please switch to a supported network.
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label="Create Borrow Order" />
                    <Tab label="Create Lend Order" />
                  </Tabs>

                  <Box sx={{ p: 1 }}>
                    {tabValue === 0 ? (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Create a borrow order by specifying the token you want to borrow, 
                        the collateral you're willing to provide, and your desired terms.
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Create a lend order by specifying the token you want to lend, 
                        the collateral you require, and your desired terms.
                      </Typography>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Lend Token</InputLabel>
                          <Select
                            value={selectedToken}
                            onChange={(e) => setSelectedToken(e.target.value)}
                            label="Lend Token"
                          >
                            {supportedTokens.map((token) => (
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
                            {supportedTokens.map((token) => (
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
                            inputProps: { min: 0, step: 0.1 }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Duration (Days)"
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          sx={{ mb: 2 }}
                          InputProps={{
                            inputProps: { min: 1, step: 1 }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {selectedToken && collateralToken && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tabValue === 0 ? (
                          <>
                            Your {getTokenSymbol(collateralToken)} balance: {formatTokenAmount(collateralToken, userBalances[collateralToken] || 0)} {getTokenSymbol(collateralToken)}
                          </>
                        ) : (
                          <>
                            Your {getTokenSymbol(selectedToken)} balance: {formatTokenAmount(selectedToken, userBalances[selectedToken] || 0)} {getTokenSymbol(selectedToken)}
                          </>
                        )}
                      </Typography>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={tabValue === 0 ? handleCreateBorrowOrder : handleCreateLendOrder}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        tabValue === 0 ? 'Create Borrow Order' : 'Create Lend Order'
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      How It Works
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" paragraph>
                      The Unified Matching Engine connects borrowers and lenders directly, 
                      allowing you to set your own terms for lending and borrowing.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      1. Create an order with your desired terms
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      2. Wait for someone to accept your order
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      3. Once matched, the smart contract handles the transaction
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Orders Section */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              
              {orders.length === 0 ? (
                <Alert severity="info">No orders found</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Token</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Collateral</TableCell>
                        <TableCell>Terms</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {formatTokenAmount(order.lendToken, order.lendAmount)} {getTokenSymbol(order.lendToken)}
                          </TableCell>
                          <TableCell>
                            {formatTokenAmount(order.collateralToken, order.collateralAmount)} {getTokenSymbol(order.collateralToken)}
                          </TableCell>
                          <TableCell>
                            {order.interestRate / 100}% for {order.duration / (24 * 60 * 60)} days
                          </TableCell>
                          <TableCell>
                            {getStatusChip(order.status)}
                          </TableCell>
                          <TableCell>
                            {order.status === 'PENDING' && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAcceptOrder(order.id)}
                                disabled={loading}
                              >
                                Accept
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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

export default UnifiedMatching;