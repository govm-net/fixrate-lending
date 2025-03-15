import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
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
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Orders state
  const [lendingOrders, setLendingOrders] = useState([]);
  const [borrowingOrders, setBorrowingOrders] = useState([]);
  const [userBalances, setUserBalances] = useState({});

  // 定义showSnackbar函数
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Fetch data
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch this data from the contract or API
      // For now, we'll use mock data
      
      // Filter orders for the current user
      if (account && supportedTokens.length > 0) {
        const mockAccount = '0x4567890123456789012345678901234567890123'; // For demo purposes
        
        // For demo purposes, we'll use the current account for some orders
        const userOrders = mockLendingOrders.concat(mockBorrowingOrders).filter(order => 
          order.lender.toLowerCase() === account.toLowerCase() || 
          order.borrower.toLowerCase() === account.toLowerCase() ||
          order.lender.toLowerCase() === mockAccount.toLowerCase() || 
          order.borrower.toLowerCase() === mockAccount.toLowerCase()
        );
        
        setLendingOrders(userOrders.filter(order => 
          order.lender.toLowerCase() === account.toLowerCase() ||
          order.lender.toLowerCase() === mockAccount.toLowerCase()
        ));
        
        setBorrowingOrders(userOrders.filter(order => 
          order.borrower.toLowerCase() === account.toLowerCase() ||
          order.borrower.toLowerCase() === mockAccount.toLowerCase()
        ));
      } else {
        setLendingOrders([]);
        setBorrowingOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showSnackbar('Error fetching orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [account, supportedTokens, showSnackbar]);

  const fetchUserBalances = useCallback(async () => {
    try {
      if (!account) return;
      
      const balances = {};
      
      for (const token of supportedTokens) {
        balances[token.address] = await getTokenBalance(token.address);
      }
      
      setUserBalances(balances);
    } catch (error) {
      console.error('Error fetching user balances:', error);
      showSnackbar('Error fetching user balances', 'error');
    }
  }, [account, supportedTokens, getTokenBalance, showSnackbar]);

  useEffect(() => {
    if (isConnected) {
      fetchOrders();
      fetchUserBalances();
    }
  }, [isConnected, fetchOrders, fetchUserBalances]);

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
      showSnackbar(`Error cancelling order: ${error.message}`, 'error');
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
      const token = supportedTokens.find(t => t.address === order.lendToken);
      if (!token) {
        showSnackbar('Invalid token in order', 'error');
        return;
      }
      
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
      showSnackbar(`Error repaying loan: ${error.message}`, 'error');
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

  const getRemainingTime = (startTime, duration) => {
    const now = Math.floor(Date.now() / 1000);
    const endTime = startTime + duration;
    const remainingSeconds = endTime - now;
    
    if (remainingSeconds <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
    
    return `${days}d ${hours}h remaining`;
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
            <Paper sx={{ p: 3, mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="My Lending Orders" />
                <Tab label="My Borrowing Orders" />
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
                            <TableCell>Lend</TableCell>
                            <TableCell>Collateral</TableCell>
                            <TableCell>Interest Rate</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lendingOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                {formatTokenAmount(order.lendToken, order.lendAmount)} {getTokenSymbol(order.lendToken)}
                              </TableCell>
                              <TableCell>
                                {formatTokenAmount(order.collateralToken, order.collateralAmount)} {getTokenSymbol(order.collateralToken)}
                              </TableCell>
                              <TableCell>
                                {order.interestRate / 100}%
                              </TableCell>
                              <TableCell>
                                {order.duration / (24 * 60 * 60)} days
                                {order.startTime && order.status === 'ACTIVE' && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {getRemainingTime(order.startTime, order.duration)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusChip(order.status)}
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
                            <TableCell>Borrowed</TableCell>
                            <TableCell>Collateral</TableCell>
                            <TableCell>Interest Rate</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {borrowingOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                {formatTokenAmount(order.lendToken, order.lendAmount)} {getTokenSymbol(order.lendToken)}
                              </TableCell>
                              <TableCell>
                                {formatTokenAmount(order.collateralToken, order.collateralAmount)} {getTokenSymbol(order.collateralToken)}
                              </TableCell>
                              <TableCell>
                                {order.interestRate / 100}%
                              </TableCell>
                              <TableCell>
                                {order.duration / (24 * 60 * 60)} days
                                {order.startTime && order.status === 'ACTIVE' && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {getRemainingTime(order.startTime, order.duration)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusChip(order.status)}
                              </TableCell>
                              <TableCell>
                                {order.status === 'ACTIVE' && (
                                  <Button
                                    variant="contained"
                                    size="small"
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