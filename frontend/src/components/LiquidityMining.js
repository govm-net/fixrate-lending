import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Tabs,
  Tab
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

const LiquidityMining = () => {
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

  // 流动性挖矿状态
  const [pools, setPools] = useState([]);
  const [userPools, setUserPools] = useState([]);
  const [rewardToken, setRewardToken] = useState(null);
  const [rewardPerSecond, setRewardPerSecond] = useState('0');
  const [startTime, setStartTime] = useState('0');
  const [endTime, setEndTime] = useState('0');

  // 质押表单状态
  const [selectedPool, setSelectedPool] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [claimAmount, setClaimAmount] = useState('0');

  // 用户余额
  const [userBalances, setUserBalances] = useState({});

  // 显示提示信息
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // 获取流动性挖矿信息
  const fetchLiquidityMiningInfo = useCallback(async () => {
    if (!isConnected || !contracts.liquidityMining) return;

    try {
      setLoading(true);

      // 获取奖励代币信息
      const rewardTokenAddress = await contracts.liquidityMining.rewardToken();
      const rewardTokenInfo = supportedTokens.find(token => 
        token.address.toLowerCase() === rewardTokenAddress.toLowerCase()
      );
      setRewardToken(rewardTokenInfo);

      // 获取奖励速率
      const rewardRate = await contracts.liquidityMining.rewardPerSecond();
      setRewardPerSecond(rewardRate.toString());

      // 获取开始和结束时间
      const start = await contracts.liquidityMining.startTime();
      const end = await contracts.liquidityMining.endTime();
      setStartTime(start.toString());
      setEndTime(end.toString());

      // 获取池数量
      const poolLength = await contracts.liquidityMining.poolLength();
      
      // 获取所有池信息
      const poolList = [];
      const userPoolList = [];
      
      for (let i = 0; i < poolLength; i++) {
        // 获取池信息
        const poolInfo = await contracts.liquidityMining.poolInfo(i);
        const lpTokenAddress = poolInfo.lpToken;
        
        // 查找对应的代币信息
        const tokenInfo = supportedTokens.find(token => 
          token.address.toLowerCase() === lpTokenAddress.toLowerCase()
        );
        
        if (tokenInfo) {
          // 获取用户在该池的信息
          const userInfo = await contracts.liquidityMining.userInfo(i, account);
          const pendingReward = await contracts.liquidityMining.pendingReward(i, account);
          
          poolList.push({
            id: i,
            token: tokenInfo,
            allocPoint: poolInfo.allocPoint.toString(),
            lastRewardTime: poolInfo.lastRewardTime.toString(),
            accRewardPerShare: poolInfo.accRewardPerShare.toString()
          });
          
          userPoolList.push({
            id: i,
            stakedAmount: userInfo.amount.toString(),
            pendingReward: pendingReward.toString()
          });
        }
      }
      
      setPools(poolList);
      setUserPools(userPoolList);
      
    } catch (error) {
      console.error('Error fetching liquidity mining info:', error);
      showSnackbar('获取流动性挖矿信息失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [isConnected, contracts, supportedTokens, account, showSnackbar]);

  // 获取用户余额
  const fetchUserBalances = useCallback(async () => {
    if (!account) return;

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

  // 初始化数据
  useEffect(() => {
    if (isConnected) {
      fetchLiquidityMiningInfo();
      fetchUserBalances();
    }
  }, [isConnected, fetchLiquidityMiningInfo, fetchUserBalances]);

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理质押
  const handleStake = useCallback(async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedPool || !stakeAmount) {
      showSnackbar('请选择池并输入质押数量', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const pool = pools.find(p => p.id === parseInt(selectedPool));
      if (!pool) {
        showSnackbar('无效的池', 'error');
        return;
      }
      
      const amountInWei = ethers.utils.parseUnits(stakeAmount, pool.token.decimals);
      
      // 检查用户余额
      const balance = userBalances[pool.token.address];
      if (balance.lt(amountInWei)) {
        showSnackbar(`代币余额不足`, 'error');
        return;
      }
      
      // 授权代币使用
      showSnackbar(`授权 ${pool.token.symbol}...`, 'info');
      await approveToken(pool.token.address, contracts.liquidityMining.address, amountInWei);
      
      // 质押代币
      showSnackbar(`质押 ${pool.token.symbol}...`, 'info');
      const tx = await contracts.liquidityMining.deposit(parseInt(selectedPool), amountInWei);
      await tx.wait();
      
      // 重置表单
      setStakeAmount('');
      
      // 刷新数据
      await fetchLiquidityMiningInfo();
      await fetchUserBalances();
      
      showSnackbar('质押成功', 'success');
    } catch (error) {
      console.error('Error staking:', error);
      showSnackbar(`质押失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    isConnected, connectWallet, selectedPool, stakeAmount, pools, 
    userBalances, approveToken, contracts, fetchLiquidityMiningInfo, 
    fetchUserBalances, showSnackbar
  ]);

  // 处理提取
  const handleWithdraw = useCallback(async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedPool || !withdrawAmount) {
      showSnackbar('请选择池并输入提取数量', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const pool = pools.find(p => p.id === parseInt(selectedPool));
      if (!pool) {
        showSnackbar('无效的池', 'error');
        return;
      }
      
      const amountInWei = ethers.utils.parseUnits(withdrawAmount, pool.token.decimals);
      
      // 提取代币
      showSnackbar(`提取 ${pool.token.symbol}...`, 'info');
      const tx = await contracts.liquidityMining.withdraw(parseInt(selectedPool), amountInWei);
      await tx.wait();
      
      // 重置表单
      setWithdrawAmount('');
      
      // 刷新数据
      await fetchLiquidityMiningInfo();
      await fetchUserBalances();
      
      showSnackbar('提取成功', 'success');
    } catch (error) {
      console.error('Error withdrawing:', error);
      showSnackbar(`提取失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    isConnected, connectWallet, selectedPool, withdrawAmount, pools, 
    contracts, fetchLiquidityMiningInfo, fetchUserBalances, showSnackbar
  ]);

  // 处理领取奖励
  const handleClaim = useCallback(async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!selectedPool) {
      showSnackbar('请选择池', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // 领取奖励
      showSnackbar(`领取奖励...`, 'info');
      const tx = await contracts.liquidityMining.claim(parseInt(selectedPool));
      await tx.wait();
      
      // 刷新数据
      await fetchLiquidityMiningInfo();
      
      showSnackbar('领取奖励成功', 'success');
    } catch (error) {
      console.error('Error claiming rewards:', error);
      showSnackbar(`领取奖励失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    isConnected, connectWallet, selectedPool, contracts, 
    fetchLiquidityMiningInfo, showSnackbar
  ]);

  // 关闭提示信息
  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'N/A';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  // 计算剩余时间
  const getRemainingTime = () => {
    if (!endTime || endTime === '0') return 'N/A';
    const now = Math.floor(Date.now() / 1000);
    const end = parseInt(endTime);
    const remaining = end - now;
    
    if (remaining <= 0) return '已结束';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          流动性挖矿
        </Typography>

        {!isConnected ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              连接钱包以参与流动性挖矿。
            </Typography>
            <Button variant="contained" onClick={connectWallet}>
              连接钱包
            </Button>
          </Paper>
        ) : supportedTokens.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" paragraph>
              当前网络 (Chain ID: {chainId}) 不支持任何代币。
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请切换到支持的网络。
            </Typography>
          </Paper>
        ) : (
          <>
            {/* 挖矿信息概览 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                挖矿信息
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    奖励代币
                  </Typography>
                  <Typography variant="body1">
                    {rewardToken ? `${rewardToken.symbol} (${rewardToken.name})` : '加载中...'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    奖励速率
                  </Typography>
                  <Typography variant="body1">
                    {rewardToken && rewardPerSecond !== '0' 
                      ? `${formatTokenAmount(rewardToken.address, rewardPerSecond)} ${rewardToken.symbol}/秒` 
                      : '加载中...'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    挖矿结束时间
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(endTime)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    剩余时间
                  </Typography>
                  <Typography variant="body1">
                    {getRemainingTime()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* 池信息和操作 */}
            <Paper sx={{ p: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="池信息" />
                <Tab label="质押" />
                <Tab label="提取" />
                <Tab label="领取奖励" />
              </Tabs>

              {tabValue === 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    查看所有可用的流动性挖矿池。
                  </Typography>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : pools.length === 0 ? (
                    <Alert severity="info">暂无挖矿池</Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>代币</TableCell>
                            <TableCell>已质押</TableCell>
                            <TableCell>待领取奖励</TableCell>
                            <TableCell>分配点数</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pools.map((pool) => {
                            const userPool = userPools.find(up => up.id === pool.id);
                            return (
                              <TableRow key={pool.id}>
                                <TableCell>
                                  {pool.token.symbol} ({pool.token.name})
                                </TableCell>
                                <TableCell>
                                  {userPool 
                                    ? `${formatTokenAmount(pool.token.address, userPool.stakedAmount)} ${pool.token.symbol}` 
                                    : '0'}
                                </TableCell>
                                <TableCell>
                                  {userPool 
                                    ? `${formatTokenAmount(rewardToken?.address || '', userPool.pendingReward)} ${rewardToken?.symbol || ''}` 
                                    : '0'}
                                </TableCell>
                                <TableCell>
                                  {pool.allocPoint}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    质押代币以参与流动性挖矿并获得奖励。
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>选择池</InputLabel>
                        <Select
                          value={selectedPool}
                          onChange={(e) => setSelectedPool(e.target.value)}
                          label="选择池"
                        >
                          {pools.map((pool) => (
                            <MenuItem key={pool.id} value={pool.id.toString()}>
                              {pool.token.symbol} ({pool.token.name})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="质押数量"
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          inputProps: { min: 0, step: 0.000001 }
                        }}
                      />
                    </Grid>
                    
                    {selectedPool && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          可用余额: {
                            selectedPool && pools.length > 0 ? 
                            (() => {
                              const pool = pools.find(p => p.id === parseInt(selectedPool));
                              return pool ? 
                                `${formatTokenAmount(pool.token.address, userBalances[pool.token.address] || '0')} ${pool.token.symbol}` : 
                                '0';
                            })() : 
                            '0'
                          }
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleStake}
                        disabled={loading}
                        sx={{ mt: 2 }}
                      >
                        {loading ? <CircularProgress size={24} /> : '质押'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    提取已质押的代币。
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>选择池</InputLabel>
                        <Select
                          value={selectedPool}
                          onChange={(e) => setSelectedPool(e.target.value)}
                          label="选择池"
                        >
                          {pools.map((pool) => (
                            <MenuItem key={pool.id} value={pool.id.toString()}>
                              {pool.token.symbol} ({pool.token.name})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="提取数量"
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          inputProps: { min: 0, step: 0.000001 }
                        }}
                      />
                    </Grid>
                    
                    {selectedPool && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          已质押: {
                            selectedPool && userPools.length > 0 ? 
                            (() => {
                              const userPool = userPools.find(up => up.id === parseInt(selectedPool));
                              const pool = pools.find(p => p.id === parseInt(selectedPool));
                              return userPool && pool ? 
                                `${formatTokenAmount(pool.token.address, userPool.stakedAmount)} ${pool.token.symbol}` : 
                                '0';
                            })() : 
                            '0'
                          }
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleWithdraw}
                        disabled={loading}
                        sx={{ mt: 2 }}
                      >
                        {loading ? <CircularProgress size={24} /> : '提取'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    领取挖矿奖励。
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>选择池</InputLabel>
                        <Select
                          value={selectedPool}
                          onChange={(e) => setSelectedPool(e.target.value)}
                          label="选择池"
                        >
                          {pools.map((pool) => {
                            const userPool = userPools.find(up => up.id === pool.id);
                            return (
                              <MenuItem key={pool.id} value={pool.id.toString()}>
                                {pool.token.symbol} ({pool.token.name}) - 待领取: {
                                  userPool && rewardToken ? 
                                  `${formatTokenAmount(rewardToken.address, userPool.pendingReward)} ${rewardToken.symbol}` : 
                                  '0'
                                }
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleClaim}
                        disabled={loading}
                        sx={{ mt: 2 }}
                      >
                        {loading ? <CircularProgress size={24} /> : '领取奖励'}
                      </Button>
                    </Grid>
                  </Grid>
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

export default LiquidityMining;