# 测试文档

## 目录
1. [测试概述和环境](#测试概述和环境)
2. [智能合约测试](#智能合约测试)
3. [前端测试](#前端测试)
4. [集成测试](#集成测试)
5. [测试覆盖率](#测试覆盖率)
6. [持续集成](#持续集成)
7. [最佳实践](#最佳实践)

## 测试概述和环境

### 测试框架
- 智能合约测试：Hardhat + Mocha + Chai
- 前端测试：Jest + React Testing Library

### 测试环境
- 本地开发：Hardhat Network
- 测试网络：Sepolia, Mumbai, BSC Testnet
- 主网：Ethereum Mainnet, Polygon, BSC

### 目录结构
```
test/
├── FixedRateLendingPool.test.ts
├── FixedRateLendingPoolWithLP.test.ts
├── LiquidityMining.test.ts
└── UnifiedMatchingEngine.test.ts
```

### 运行测试
```bash
# 运行所有测试
npx hardhat test

# 运行特定测试文件
npx hardhat test test/FixedRateLendingPool.test.ts

# 运行测试并生成覆盖率报告
npx hardhat coverage
```

## 智能合约测试

### FixedRateLendingPool 测试

#### 测试场景
1. **部署和初始化测试**
   - 验证构造函数参数正确设置
   - 验证所有者权限控制
   - 验证初始状态

2. **代币支持管理测试**
   - 添加支持的代币
   - 移除支持的代币
   - 更新价格预言机

3. **价格获取测试**
   - 获取代币价格
   - 处理不支持的代币
   - 处理无效价格数据

4. **抵押品价值计算测试**
   - 计算代币价值
   - 处理不同小数位数的代币
   - 处理价格波动

5. **存款功能测试**
   - 正常存款流程
   - 处理余额不足
   - 处理授权不足
   - 验证事件触发

6. **提款功能测试**
   - 正常提款流程
   - 处理超额提款
   - 验证事件触发

7. **借款功能测试**
   - 从池中借款
   - 验证借款参数
   - 处理资金不足
   - 验证事件触发

8. **还款功能测试**
   - 向池中还款
   - 验证还款金额
   - 处理非借款人还款
   - 验证事件触发

9. **清算功能测试**
   - 清算逾期贷款
   - 验证抵押品价值
   - 处理未逾期贷款
   - 验证事件触发

10. **利率计算测试**
    - 计算借款利率
    - 计算存款利率
    - 验证利用率计算

#### 示例测试用例
```typescript
it("用户应该能够存款", async function () {
  // 准备测试数据
  const depositAmount = ethers.parseEther("1000");
  
  // 铸造代币给存款人
  await mockToken.mint(depositorAddress, depositAmount);
  // 授权借贷池合约使用存款人的代币
  await mockToken.connect(depositor).approve(await lendingPool.getAddress(), depositAmount);
  
  // 执行存款操作
  await expect(
    lendingPool.connect(depositor).deposit(await mockToken.getAddress(), depositAmount)
  )
    .to.emit(lendingPool, "Deposited")
    .withArgs(await mockToken.getAddress(), depositorAddress, depositAmount);
});
```

### FixedRateLendingPoolWithLP 测试

#### 测试场景
1. **LP代币功能测试**
   - 存款时铸造LP代币
   - 使用LP代币提款
   - 查询LP代币余额

2. **收益计算测试**
   - 验证存款收益
   - 验证借款利息
   - 验证流动性挖矿奖励

#### 示例测试用例
```typescript
it("用户存款时应该获得LP代币", async function () {
  const depositAmount = ethers.parseEther("1000");
  
  // 铸造代币给存款人
  await mockToken.mint(depositorAddress, depositAmount);
  // 授权借贷池合约使用存款人的代币
  await mockToken.connect(depositor).approve(await lendingPool.getAddress(), depositAmount);
  
  // 执行存款操作
  await lendingPool.connect(depositor).deposit(await mockToken.getAddress(), depositAmount);
  
  // 验证LP代币余额
  const lpTokenAddress = await lendingPool.lpTokens(await mockToken.getAddress());
  const lpToken = await ethers.getContractAt("LPToken", lpTokenAddress);
  expect(await lpToken.balanceOf(depositorAddress)).to.equal(depositAmount);
});
```

### LiquidityMining 测试

#### 测试场景
1. **质押功能测试**
   - 质押LP代币
   - 处理余额不足
   - 验证质押记录

2. **奖励计算测试**
   - 计算质押奖励
   - 验证奖励分配
   - 处理多用户质押

3. **领取奖励测试**
   - 领取质押奖励
   - 处理无奖励情况
   - 验证奖励发放

#### 示例测试用例
```typescript
it("用户应该能够质押LP代币", async function () {
  const stakeAmount = ethers.parseEther("100");
  
  // 铸造LP代币给用户
  await lpToken.mint(userAddress, stakeAmount);
  // 授权质押合约使用用户的LP代币
  await lpToken.connect(user).approve(await liquidityMining.getAddress(), stakeAmount);
  
  // 执行质押操作
  await expect(
    liquidityMining.connect(user).stake(stakeAmount)
  )
    .to.emit(liquidityMining, "Staked")
    .withArgs(userAddress, stakeAmount);
});
```

### UnifiedMatchingEngine 测试

#### 测试场景
1. **订单管理测试**
   - 创建链上订单
   - 执行链上订单
   - 取消订单
   - 查询订单状态

2. **订单验证测试**
   - 验证个人订单
   - 验证池订单
   - 处理无效签名
   - 处理过期订单

3. **交易执行测试**
   - 执行借款交易
   - 执行出借交易
   - 验证资产转移
   - 处理重复执行

4. **还款和清算测试**
   - 还款流程
   - 清算逾期贷款
   - 验证资金流向
   - 处理非借款人还款

#### 示例测试用例
```typescript
it("应该能够创建链上订单", async function () {
  const orderParams = {
    checker: await personalChecker.getAddress(),
    lender: lenderAddress,
    borrower: borrowerAddress,
    lendToken: await tokenA.getAddress(),
    lendAmount: lendAmount,
    collateralToken: await tokenB.getAddress(),
    collateralAmount: collateralAmount,
    interestRate: interestRate,
    duration: loanDuration,
    expiry: expiry
  };
  
  await expect(
    unifiedMatching.connect(lender).createOnchainOrder(orderParams)
  )
    .to.emit(unifiedMatching, "OnchainOrderCreated")
    .withArgs(1, lenderAddress, borrowerAddress, await tokenA.getAddress(), lendAmount);
});
```

## 前端测试

### 组件测试
- 使用Jest和React Testing Library进行组件单元测试
- 测试组件渲染和用户交互
- 验证状态管理和事件处理

### 集成测试
- 测试与智能合约的集成
- 验证钱包连接和交易流程
- 测试错误处理和边界情况

### 示例测试用例
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LendingPool from '../components/LendingPool';

test('renders lending pool component', () => {
  render(<LendingPool />);
  
  // 验证组件渲染
  expect(screen.getByText('Lending Pool')).toBeInTheDocument();
  expect(screen.getByText('Deposit')).toBeInTheDocument();
  expect(screen.getByText('Withdraw')).toBeInTheDocument();
});

test('handles deposit form submission', async () => {
  render(<LendingPool />);
  
  // 填写表单
  const amountInput = screen.getByLabelText('Amount');
  fireEvent.change(amountInput, { target: { value: '100' } });
  
  // 提交表单
  const depositButton = screen.getByText('Deposit');
  fireEvent.click(depositButton);
  
  // 验证交易处理
  expect(await screen.findByText('Transaction submitted')).toBeInTheDocument();
});
```

## 集成测试

### 端到端测试
- 使用Cypress或Playwright进行端到端测试
- 测试完整的用户流程
- 验证前端与智能合约的集成

### 跨合约交互测试
- 测试借贷池与统一撮合引擎的交互
- 验证流动性挖矿与借贷池的集成
- 测试多合约场景下的状态一致性

## 测试覆盖率

### 覆盖率目标
- 智能合约测试覆盖率：≥ 90%
- 前端组件测试覆盖率：≥ 80%
- 集成测试覆盖率：≥ 70%

### 覆盖率报告
```bash
# 生成测试覆盖率报告
npx hardhat coverage

# 查看详细覆盖率信息
npx hardhat coverage --show-functions
```

### 覆盖率分析
- 行覆盖率 (Line Coverage)
- 函数覆盖率 (Function Coverage)
- 分支覆盖率 (Branch Coverage)
- 语句覆盖率 (Statement Coverage)

## 持续集成

### CI/CD流程
1. 代码提交触发CI流程
2. 自动运行测试套件
3. 生成测试报告和覆盖率数据
4. 根据测试结果决定是否继续部署

### GitHub Actions配置
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx hardhat compile
      - run: npx hardhat test
      - run: npx hardhat coverage
```

## 最佳实践

### 测试编写原则
1. **单一职责**：每个测试用例只测试一个功能点
2. **独立性**：测试用例之间相互独立，不依赖其他测试的执行结果
3. **可重复性**：测试结果应该是一致的，不依赖于外部环境
4. **可读性**：测试代码应该清晰易懂，便于维护

### 测试数据管理
1. **使用fixtures**：避免重复的测试数据设置
2. **随机数据生成**：使用随机数据增加测试覆盖面
3. **边界值测试**：测试边界条件和异常情况

### 错误处理测试
1. **测试错误路径**：确保错误处理逻辑正确
2. **验证错误消息**：检查返回的错误信息是否准确
3. **恢复测试**：验证系统从错误状态恢复的能力

### 性能测试
1. **Gas消耗测试**：监控合约方法的Gas消耗
2. **压力测试**：测试高并发场景下的系统表现
3. **负载测试**：验证系统在高负载下的稳定性