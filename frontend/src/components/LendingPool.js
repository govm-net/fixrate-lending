import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // 引入 useTranslation hook
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

const LendingPool = () => {
  const { t } = useTranslation(); // 使用 useTranslation hook
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
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [poolData, setPoolData] = useState({
    poolBalances: {},
    availableBalances: {},
    userBalances: {},
    minInterestRate: 0,
    maxLoanDuration: 0,
    minCollateralRatio: 0
  });

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
  }, [supportedTokens, selectedToken]);

  // Fetch pool data
  const fetchPoolData = useCallback(async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch this data from the contract
      // For now, we'll use mock data
      const mockPoolData = {
        poolBalances: {},
        availableBalances: {},
        userBalances: {}
      };
      
      // Set mock balances for each token
      for (const token of supportedTokens) {
        // Pool balances
        mockPoolData.poolBalances[token.address] = ethers.utils.parseUnits(
          token.symbol === 'USDC' ? '1000000' : 
          token.symbol === 'DAI' ? '2000000' : 
          '1000', 
          token.decimals
        );
        
        // Available balances
        mockPoolData.availableBalances[token.address] = ethers.utils.parseUnits(
          token.symbol === 'USDC' ? '500000' : 
          token.symbol === 'DAI' ? '1000000' : 
          '500', 
          token.decimals
        );
        
        // User balances
        if (account) {
          console.log(`Fetching balance for ${token.symbol} (${token.address}) with ${token.decimals} decimals`);
          const balance = await getTokenBalance(token.address);
          console.log(`Received balance for ${token.symbol}: ${ethers.utils.formatUnits(balance, token.decimals)} ${token.symbol}`);
          mockPoolData.userBalances[token.address] = balance;
        }
      }
      
      setPoolData(mockPoolData);
    } catch (error) {
      console.error('Error fetching pool data:', error);
      showSnackbar('Error fetching pool data', 'error');
    } finally {
      setLoading(false);
    }
  }, [supportedTokens, account, getTokenBalance, showSnackbar]);

  useEffect(() => {
    if (isConnected && contracts.lendingPool) {
      fetchPoolData();
    }
  }, [isConnected, contracts.lendingPool, fetchPoolData]);

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
      const token = supportedTokens.find(t => t.address === selectedToken);
      if (!token) {
        showSnackbar('Invalid token selected', 'error');
        return;
      }
      
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
      
      // 直接使用已连接到 signer 的合约
      const tx = await contracts.lendingPool.deposit(selectedToken, amountInWei);
      
      // 等待交易确认
      showSnackbar(`Transaction submitted. Waiting for confirmation...`, 'info');
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // 交易成功
        // 更新池数据
        fetchPoolData();
        
        // 重置表单
        setAmount('');
        
        showSnackbar(`Successfully deposited ${amount} ${token.symbol}`, 'success');
      } else {
        // 交易失败
        showSnackbar(`Transaction failed. Please try again.`, 'error');
      }
      
    } catch (error) {
      console.error('Error depositing to pool:', error);
      showSnackbar(`Error depositing to pool: ${error.message}`, 'error');
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
      const token = supportedTokens.find(t => t.address === selectedToken);
      if (!token) {
        showSnackbar('Invalid token selected', 'error');
        return;
      }
      
      const amountInWei = ethers.utils.parseUnits(amount, token.decimals);
      
      // Check available balance
      const availableBalance = poolData.availableBalances[selectedToken];
      if (availableBalance.lt(amountInWei)) {
        showSnackbar(`Insufficient available ${token.symbol} in pool`, 'error');
        return;
      }
      
      // Withdraw from pool
      showSnackbar(`Withdrawing ${amount} ${token.symbol}...`, 'info');
      
      // 直接使用已连接到 signer 的合约
      const tx = await contracts.lendingPool.withdraw(selectedToken, amountInWei);
      
      // 等待交易确认
      showSnackbar(`Transaction submitted. Waiting for confirmation...`, 'info');
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // 交易成功
        // 更新池数据
        fetchPoolData();
        
        // 重置表单
        setAmount('');
        
        showSnackbar(`Successfully withdrew ${amount} ${token.symbol}`, 'success');
      } else {
        // 交易失败
        showSnackbar(`Transaction failed. Please try again.`, 'error');
      }
      
    } catch (error) {
      console.error('Error withdrawing from pool:', error);
      showSnackbar(`Error withdrawing from pool: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('lending_pool.title')}
        </Typography>

        {!isConnected ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              {t('lending_pool.connect_wallet')}
            </Typography>
            <Button variant="contained" onClick={connectWallet}>
              {t('navbar.connect_wallet')}
            </Button>
          </Paper>
        ) : supportedTokens.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              {t('lending_pool.no_tokens', { chainId })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('lending_pool.switch_network')}
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label={t('lending_pool.deposit_tab')} />
                    <Tab label={t('lending_pool.withdraw_tab')} />
                  </Tabs>

                  <Box sx={{ p: 1 }}>
                    {tabValue === 0 ? (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {t('lending_pool.deposit_description')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {t('lending_pool.withdraw_description')}
                      </Typography>
                    )}

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>{t('lending_pool.token_label')}</InputLabel>
                      <Select
                        value={selectedToken}
                        onChange={handleTokenChange}
                        label={t('lending_pool.token_label')}
                      >
                        {supportedTokens.map((token) => (
                          <MenuItem key={`${token.address}-${token.symbol}`} value={token.address}>
                            {token.symbol} - {token.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label={t('lending_pool.amount_label')}
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
                          <>
                            {t('lending_pool.deposit_description')} {formatTokenAmount(selectedToken, poolData.userBalances[selectedToken])} {getTokenSymbol(selectedToken)}
                            {getTokenSymbol(selectedToken) === 'USDC' && (
                              <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '5px' }}>
                                (USDC has 6 decimals)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {t('lending_pool.withdraw_description')} {formatTokenAmount(selectedToken, poolData.availableBalances[selectedToken])} {getTokenSymbol(selectedToken)}
                            {getTokenSymbol(selectedToken) === 'USDC' && (
                              <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '5px' }}>
                                (USDC has 6 decimals)
                              </span>
                            )}
                          </>
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
                        tabValue === 0 ? t('lending_pool.deposit_button') : t('lending_pool.withdraw_button')
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('lending_pool.pool_parameters')}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('lending_pool.min_interest_rate')}: {poolData.minInterestRate / 100}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('lending_pool.max_loan_duration')}: {poolData.maxLoanDuration / (24 * 60 * 60)} days
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('lending_pool.min_collateral_ratio')}: {poolData.minCollateralRatio / 100}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

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
      </Box>
    </Container>
  );
};

export default LendingPool;