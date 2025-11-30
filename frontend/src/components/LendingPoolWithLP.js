import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const LendingPoolWithLP = () => {
  const { 
    account, 
    contracts, 
    supportedTokens, 
    getTokenBalance, 
    approveToken, 
    formatTokenAmount,
    getTokenSymbol,
    getTokenDecimals
  } = useWeb3();
  
  const [selectedToken, setSelectedToken] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [lpWithdrawAmount, setLpWithdrawAmount] = useState('');
  const [userBalances, setUserBalances] = useState({});
  const [userLpBalances, setUserLpBalances] = useState({});
  const [poolBalances, setPoolBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 获取用户余额和池余额
  useEffect(() => {
    const fetchBalances = async () => {
      if (!account || !contracts.lendingPoolWithLP) return;
      
      const newBalances = {};
      const newLpBalances = {};
      const newPoolBalances = {};
      
      for (const token of supportedTokens) {
        try {
          // 获取用户代币余额
          const tokenBalance = await getTokenBalance(token.address, account);
          newBalances[token.address] = tokenBalance;
          
          // 获取用户LP代币余额
          const lpBalance = await contracts.lendingPoolWithLP.getUserLpBalance(token.address, account);
          newLpBalances[token.address] = lpBalance;
          
          // 获取池余额
          const poolBalance = await contracts.lendingPoolWithLP.getAvailableBalance(token.address);
          newPoolBalances[token.address] = poolBalance;
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
        }
      }
      
      setUserBalances(newBalances);
      setUserLpBalances(newLpBalances);
      setPoolBalances(newPoolBalances);
    };
    
    fetchBalances();
    
    // 设置定时器定期更新余额
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [account, contracts.lendingPoolWithLP, supportedTokens]);

  // 存款
  const handleDeposit = async () => {
    if (!selectedToken || !depositAmount || !contracts.lendingPoolWithLP) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = supportedTokens.find(t => t.address === selectedToken);
      const amount = ethers.utils.parseUnits(depositAmount, token.decimals);
      
      // 授权
      const tx1 = await approveToken(
        selectedToken,
        contracts.lendingPoolWithLP.address,
        amount
      );
      console.log('Approval transaction:', tx1);
      
      // 存款
      const tx2 = await contracts.lendingPoolWithLP.deposit(selectedToken, amount);
      await tx2.wait();
      
      setMessage('存款成功！');
      setDepositAmount('');
      
      // 刷新余额
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Deposit error:', error);
      setMessage(`存款失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 提款
  const handleWithdraw = async () => {
    if (!selectedToken || !withdrawAmount || !contracts.lendingPoolWithLP) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = supportedTokens.find(t => t.address === selectedToken);
      const amount = ethers.utils.parseUnits(withdrawAmount, token.decimals);
      
      // 提款
      const tx = await contracts.lendingPoolWithLP.withdraw(selectedToken, amount);
      await tx.wait();
      
      setMessage('提款成功！');
      setWithdrawAmount('');
      
      // 刷新余额
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Withdraw error:', error);
      setMessage(`提款失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 使用LP代币提款
  const handleWithdrawByLP = async () => {
    if (!selectedToken || !lpWithdrawAmount || !contracts.lendingPoolWithLP) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = supportedTokens.find(t => t.address === selectedToken);
      const amount = ethers.utils.parseUnits(lpWithdrawAmount, token.decimals);
      
      // 使用LP代币提款
      const tx = await contracts.lendingPoolWithLP.withdrawByLPToken(selectedToken, amount);
      await tx.wait();
      
      setMessage('使用LP代币提款成功！');
      setLpWithdrawAmount('');
      
      // 刷新余额
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('LP Withdraw error:', error);
      setMessage(`使用LP代币提款失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h2>借贷池 (带LP代币)</h2>
        <p>请连接钱包以查看和使用借贷池功能。</p>
      </div>
    );
  }

  if (!contracts.lendingPoolWithLP) {
    return (
      <div className="card">
        <h2>借贷池 (带LP代币)</h2>
        <p>借贷池合约未部署或地址未配置。</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>借贷池 (带LP代币)</h2>
      
      {message && (
        <div className={`alert ${message.includes('失败') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}
      
      <div className="form-group">
        <label>选择代币:</label>
        <select 
          value={selectedToken} 
          onChange={(e) => setSelectedToken(e.target.value)}
          className="form-control"
        >
          <option value="">请选择代币</option>
          {supportedTokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>
      
      {selectedToken && (
        <div className="token-info">
          <p>您的代币余额: {formatTokenAmount(selectedToken, userBalances[selectedToken] || 0)} {getTokenSymbol(selectedToken)}</p>
          <p>您的LP代币余额: {formatTokenAmount(selectedToken, userLpBalances[selectedToken] || 0)} LP</p>
          <p>池可用余额: {formatTokenAmount(selectedToken, poolBalances[selectedToken] || 0)} {getTokenSymbol(selectedToken)}</p>
        </div>
      )}
      
      <div className="actions">
        <div className="action-group">
          <h3>存款</h3>
          <div className="form-group">
            <label>存款金额:</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="form-control"
              placeholder="输入存款金额"
            />
          </div>
          <button 
            onClick={handleDeposit} 
            disabled={loading || !depositAmount}
            className="btn btn-primary"
          >
            {loading ? '处理中...' : '存款'}
          </button>
        </div>
        
        <div className="action-group">
          <h3>提款</h3>
          <div className="form-group">
            <label>提款金额:</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="form-control"
              placeholder="输入提款金额"
            />
          </div>
          <button 
            onClick={handleWithdraw} 
            disabled={loading || !withdrawAmount}
            className="btn btn-secondary"
          >
            {loading ? '处理中...' : '提款'}
          </button>
        </div>
        
        <div className="action-group">
          <h3>使用LP代币提款</h3>
          <div className="form-group">
            <label>LP代币数量:</label>
            <input
              type="number"
              value={lpWithdrawAmount}
              onChange={(e) => setLpWithdrawAmount(e.target.value)}
              className="form-control"
              placeholder="输入LP代币数量"
            />
          </div>
          <button 
            onClick={handleWithdrawByLP} 
            disabled={loading || !lpWithdrawAmount}
            className="btn btn-warning"
          >
            {loading ? '处理中...' : '使用LP代币提款'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LendingPoolWithLP;