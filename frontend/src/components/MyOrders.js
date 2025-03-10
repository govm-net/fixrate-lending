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

// Mock token data (in a real app, this would come from an API)
const mockTokens = [
  { address: '0x1234567890123456789012345678901234567890', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x2345678901234567890123456789012345678901', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0x3456789012345678901234567890123456789012', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
];

// Mock orders data
const mockLendingOrders = [
  {
    id: 1,
    lender: '0x4567890123456789012345678901234567890123',
    lendToken: '0x1234567890123456789012345678901234567890',
    lendAmount: ethers.utils.parseUnits('1000', 6),
    collateralToken: '0x3456789012345678901234567890123456789012',
    collateralAmount: ethers.utils.parseUnits('0.5', 18),
    interestRate: 500, // 5%
    duration: 30 * 24 * 60 * 60, // 30 days
    startTime: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60, // 5 days ago
    status: 'ACTIVE'
  },
  {
    id: 2,
    lender: '0x4567890123456789012345678901234567890123',
    lendToken: '0x2345678901234567890123456789012345678901',
    lendAmount: ethers.utils.parseUnits('5000', 18),
    collateralToken: '0x3456789012345678901234567890123456789012',
    collateralAmount: ethers.utils.parseUnits('2.5', 18),
    interestRate: 700, // 7%
    duration: 60 * 24 * 60 * 60, // 60 days
    status: 'PENDING'
  }
];

const mockBorrowingOrders = [
  {
    id: 3,
    lender: '0x6789012345678901234567890123456789012345',
    borrower: '0x4567890123456789012345678901234567890123',
    lendToken: '0x3456789012345678901234567890123456789012',
    lendAmount: ethers.utils.parseUnits('1', 18),
    collateralToken: '0x1234567890123456789012345678901234567890',
    collateralAmount: ethers.utils.parseUnits('1800', 6),
    interestRate: 300, // 3%
    duration: 15 * 24 * 60 * 60, // 15 days
    startTime: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60, // 10 days ago
    status: 'ACTIVE'
  }
];

const MyOrders = () => {
  const { account, isConnected, contracts, connectWallet, getTokenBalance, approveToken } = useWeb3();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Orders state
  const [lendingOrders, setLendingOrders] = useState([]);
  const [borrowingOrders, setBorrowingOrders] = useState([]);
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
      
      // Filter orders for the current user
      if (account) {
        const mockAccount = '0x4567890123456789012345678901234567890123'; // For demo purposes
        
        // In a real app, you would use the actual account
        // const filteredLendingOrders = mockLendingOrders.filter(order => order.lender.toLowerCase() === account.toLowerCase());
        // const filteredBorrowingOrders = mockBorrowingOrders.filter(order => order.borrower.toLowerCase() === account.toLowerCase());
        
        // For demo, we'll use the mock account
        const filteredLendingOrders = mockLendingOrders.filter(order => order.lender.toLowerCase() === mockAccount.toLowerCase());
        const filteredBorrowingOrders = mockBorrowingOrders.filter(order => order.borrower.toLowerCase() === mockAccount.toLowerCase());
        
        setLendingOrders(filteredLendingOrders);
        setBorrowingOrders(filteredBorrowingOrders);
      }
      
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

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      
      // In a real app, you would call the contract method
      // const tx = await contracts.marketplace.cancelOnchainOrder(orderId);
      // await tx.wait();
      
      // For demo, we'll just simulate success
      setTimeout(() => {
        // Update orders
        setLendingOrders(lendingOrders.filter(order => order.id !== orderId));
        
        showSnackbar('Order cancelled successfully', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      showSnackbar('Error cancelling order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRepayLoan = async (orderId) => {
    try {
      setLoading(true);
      
      const order = borrowingOrders.find(o => o.id === orderId);
      if (!order) {
        showSnackbar('Order not found', 'error');
        return;
      }
      
      // Calculate repayment amount (principal + interest)
      const token = mockTokens.find(t => t.address === order.lendToken);
      const principal = order.lendAmount;
      const interest = principal.mul(order.interestRate).div(10000);
      const totalRepayment = principal.add(interest);
      
      // Check user balance
      const balance = userBalances[order.lendToken];
      if (balance.lt(totalRepayment)) {
        showSnackbar(`Insufficient ${token.symbol} balance for repayment`, 'error');
        return;
      }
      
      // Approve token spending
      showSnackbar(`Approving ${token.symbol} for repayment...`, 'info');
      await approveToken(order.lendToken, contracts.marketplace.address, totalRepayment);
      
      // Repay loan
      showSnackbar(`Repaying loan...`, 'info');
      
      // In a real app, you would call the contract method
      // const tx = await contracts.marketplace.repayOnchainOrder(orderId);
      // await tx.wait();
      
      // For demo, we'll just simulate success
      setTimeout(() => {
        // Update orders
        setBorrowingOrders(borrowingOrders.map(o => 
          o.id === orderId ? { ...o, status: 'REPAID' } : o
        ));
        
        showSnackbar('Loan repaid successfully', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error repaying loan:', error);
      showSnackbar('Error repaying loan', 'error');
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

  const getStatusChip = (status) => {
    let color = 'default';
    
    switch (status) {
      case 'PENDING':
        color = 'warning';
        break;
      case 'ACTIVE':
        color = 'success';
        break;
      case 'REPAID':
        color = 'info';
        break;
      case 'LIQUIDATED':
        color = 'error';
        break;
      case 'CANCELLED':
        color = 'default';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  const getRemainingTime = (startTime, duration) => {
    const endTime = startTime + duration;
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    
    return `${days}d ${hours}h`;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Orders
        </Typography>

        {!isConnected ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              Connect your wallet to view your orders.
            </Typography>
            <Button variant="contained" onClick={connectWallet}>
              Connect Wallet
            </Button>
          </Paper>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="My Lending" />
                <Tab label="My Borrowing" />
              </Tabs>

              {tabValue === 0 ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    View and manage your lending orders.
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : lendingOrders.length === 0 ? (
                    <Alert severity="info">You don't have any lending orders</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Lend</TableCell>
                            <TableCell>Collateral</TableCell>
                            <TableCell>Interest</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Remaining</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lendingOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{order.id}</TableCell>
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
                                {getStatusChip(order.status)}
                              </TableCell>
                              <TableCell>
                                {order.status === 'ACTIVE' ? getRemainingTime(order.startTime, order.duration) : '-'}
                              </TableCell>
                              <TableCell>
                                {order.status === 'PENDING' && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={loading}
                                  >
                                    Cancel
                                  </Button>
                                )}
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
                    View and manage your borrowing orders.
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : borrowingOrders.length === 0 ? (
                    <Alert severity="info">You don't have any borrowing orders</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Borrowed</TableCell>
                            <TableCell>Collateral</TableCell>
                            <TableCell>Interest</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Remaining</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {borrowingOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{order.id}</TableCell>
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
                                {getStatusChip(order.status)}
                              </TableCell>
                              <TableCell>
                                {order.status === 'ACTIVE' ? getRemainingTime(order.startTime, order.duration) : '-'}
                              </TableCell>
                              <TableCell>
                                {order.status === 'ACTIVE' && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    onClick={() => handleRepayLoan(order.id)}
                                    disabled={loading}
                                  >
                                    Repay
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
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

export default MyOrders; 