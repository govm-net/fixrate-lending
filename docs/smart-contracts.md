# 智能合约详细文档

## 目录
1. [UnifiedMatchingEngine 合约](#unifiedmatchingengine-合约)
2. [IChecker 接口](#ichecker-接口)
3. [PersonalChecker 合约](#personalchecker-合约)
4. [PoolChecker 合约](#poolchecker-合约)
5. [FixedRateLendingPool 合约](#fixedratelendingpool-合约)
6. [LiquidityMining 合约](#liquiditymining-合约)
7. [辅助合约和接口](#辅助合约和接口)

## UnifiedMatchingEngine 合约

### 合约概述
UnifiedMatchingEngine 是平台的核心合约，负责交易撮合、订单管理和状态跟踪。它支持链下订单模式，并集成了EIP-712签名验证机制。

### 合约地址
- 主网: 0x...
- 测试网: 0x...

### 核心功能

#### 1. 订单管理
- `initiateBorrowRequest`: 发起借款请求
- `initiateLendRequest`: 发起出借请求
- `cancelOrder`: 取消未成交的订单

#### 2. 交易撮合
- `executeBorrow`: 执行借款交易
- `executeLend`: 执行出借交易

#### 3. 订单生命周期管理
- `repayLoan`: 还款
- `liquidateLoan`: 清算逾期贷款

### 数据结构

#### 订单状态枚举
```solidity
enum OrderStatus {
    PENDING,     // 订单已创建，等待接受
    ACTIVE,      // 订单生效中
    REPAID,      // 已还款
    LIQUIDATED,  // 已清算
    CANCELLED    // 已取消
}
```

#### 交易订单结构
```solidity
struct LoanOrder {
    address checker;         // Checker合约地址
    address lender;          // 出借人地址
    address borrower;        // 借款人地址
    address lendToken;       // 借出代币地址
    uint256 lendAmount;      // 借出金额
    address collateralToken; // 抵押代币地址
    uint256 collateralAmount;// 抵押金额
    uint256 interestRate;    // 利率（基点）
    uint256 duration;        // 借款期限（秒）
    uint256 expiry;          // 过期时间
    uint256 nonce;           // 随机数
    bytes signature;         // 签名数据
}
```

### 重要函数详解

#### initiateBorrowRequest
发起借款请求。

**函数签名:**
```solidity
function initiateBorrowRequest(
    address _checker,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry
) external whenNotPaused
```

**参数说明:**
- `_checker`: Checker合约地址
- `_lendToken`: 借出的代币地址
- `_lendAmount`: 借出金额
- `_collateralToken`: 抵押的代币地址
- `_collateralAmount`: 抵押金额
- `_interestRate`: 利率（基点，100基点=1%）
- `_duration`: 借款期限（秒）
- `_expiry`: 订单过期时间

**事件触发:**
- `BorrowRequestInitiated`: 借款请求发起成功后触发

#### initiateLendRequest
发起出借请求。

**函数签名:**
```solidity
function initiateLendRequest(
    address _checker,
    address _borrower,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry,
    uint256 _nonce,
    bytes memory _signature
) external whenNotPaused
```

**参数说明:**
- `_checker`: Checker合约地址
- `_borrower`: 借款人地址
- `_lendToken`: 借出的代币地址
- `_lendAmount`: 借出金额
- `_collateralToken`: 抵押的代币地址
- `_collateralAmount`: 抵押金额
- `_interestRate`: 利率（基点）
- `_duration`: 借款期限（秒）
- `_expiry`: 订单过期时间
- `_nonce`: 随机数，用于防止重放攻击
- `_signature`: 借款人的签名

**事件触发:**
- `LendRequestInitiated`: 出借请求发起成功后触发

#### executeBorrow
执行借款交易。

**函数签名:**
```solidity
function executeBorrow(
    address _lender,
    address _checker,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry,
    uint256 _nonce,
    bytes memory _signature
) external nonReentrant whenNotPaused
```

**参数说明:**
- `_lender`: 出借人地址
- `_checker`: Checker合约地址
- `_lendToken`: 借出的代币地址
- `_lendAmount`: 借出金额
- `_collateralToken`: 抵押的代币地址
- `_collateralAmount`: 抵押金额
- `_interestRate`: 利率（基点）
- `_duration`: 借款期限（秒）
- `_expiry`: 订单过期时间
- `_nonce`: 随机数
- `_signature`: 出借人的签名

**事件触发:**
- `BorrowExecuted`: 借款执行成功后触发

### 安全机制

#### 重入攻击防护
使用 OpenZeppelin 的 `ReentrancyGuard` 合约防止重入攻击。

#### 暂停机制
继承自 `Pausable` 合约，可在紧急情况下暂停合约功能。

#### 签名验证
使用 EIP-712 标准进行链下订单签名验证，确保订单的真实性和完整性。

#### 防重放攻击
通过 nonce 和过期时间机制防止订单重放攻击。

## IChecker 接口

### 接口概述
IChecker 是通用的验证接口，定义了所有 Checker 合约必须实现的方法。

### 核心函数

#### verifyLenderOrder
验证出借人订单有效性。

**函数签名:**
```solidity
function verifyLenderOrder(VerificationParams calldata params) external view returns (bool);
```

#### verifyBorrowerOrder
验证借款人订单有效性。

**函数签名:**
```solidity
function verifyBorrowerOrder(VerificationParams calldata params) external view returns (bool);
```

#### getCheckerInfo
获取 Checker 信息。

**函数签名:**
```solidity
function getCheckerInfo() external view returns (string memory name, string memory version);
```

## PersonalChecker 合约

### 合约概述
PersonalChecker 是针对个人对个人交易的验证实现，负责验证交易双方的资格和风险。

### 核心功能
- 验证交易双方地址的有效性
- 检查资产余额和授权情况
- 验证抵押品价值是否充足

### 验证参数结构体
```solidity
struct VerificationParams {
    address lender;
    address borrower;
    address lendToken;
    uint256 lendAmount;
    address collateralToken;
    uint256 collateralAmount;
    uint256 interestRate;
    uint256 duration;
}
```

## PoolChecker 合约

### 合约概述
PoolChecker 是针对池化资金交易的验证实现，负责验证借贷池是否有足够的资金以及交易是否符合池的策略。

### 核心功能
- 验证借贷池地址的有效性
- 检查池中是否有足够资金
- 验证交易是否符合池的配置参数

### 验证参数结构体
```solidity
struct VerificationParams {
    address lender;
    address borrower;
    address lendToken;
    uint256 lendAmount;
    address collateralToken;
    uint256 collateralAmount;
    uint256 interestRate;
    uint256 duration;
}
```

## FixedRateLendingPool 合约

### 合约概述
FixedRateLendingPool 是一个固定利率借贷池合约，允许用户存入资产赚取利息。它与 UnifiedMatchingEngine 集成，为借款人提供流动性。

### 合约地址
- 主网: 0x...
- 测试网: 0x...

### 核心功能

#### 1. 资金管理
- `deposit`: 向池中存款
- `withdraw`: 从池中提款

#### 2. 订单处理
- `verifyOrder`: 验证订单是否可行
- `lendFromPool`: 从池中借出资金
- `repayToPool`: 向池中还款

#### 3. 配置管理
- `addSupportedToken`: 添加支持的代币
- `removeSupportedToken`: 移除支持的代币
- `updatePriceFeed`: 更新代币价格预言机
- `updatePoolParams`: 更新池参数

### LP Token 机制

当用户向借贷池存款时，会收到相应的 LP Token，代表其在池中的份额。这些 Token 可以在之后用于提款。

#### LPToken 合约
```solidity
contract LPToken is ERC20 {
    address public poolAddress;
    address public underlyingToken;
    
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}
```

### 重要函数详解

#### deposit
向池中存款。

**函数签名:**
```solidity
function deposit(address _token, uint256 _amount) external nonReentrant
```

**参数说明:**
- `_token`: 存款的代币地址
- `_amount`: 存款金额

**事件触发:**
- `Deposited`: 存款成功后触发

#### withdraw
从池中提款。

**函数签名:**
```solidity
function withdraw(address _token, uint256 _amount) external nonReentrant
```

**参数说明:**
- `_token`: 提款的代币地址
- `_amount`: 提款金额

**事件触发:**
- `Withdrawn`: 提款成功后触发

#### verifyOrder
验证订单是否可行。

**函数签名:**
```solidity
function verifyOrder(
    address lendToken,
    uint256 lendAmount,
    address collateralToken,
    uint256 collateralAmount,
    uint256 interestRate,
    uint256 duration,
    address _borrower
) external view override returns (bool)
```

**参数说明:**
- `lendToken`: 借出的代币地址
- `lendAmount`: 借出金额
- `collateralToken`: 抵押的代币地址
- `collateralAmount`: 抵押金额
- `interestRate`: 利率（基点）
- `duration`: 借款期限（秒）
- `_borrower`: 借款人地址

**返回值:**
- `bool`: 订单是否可行

#### lendFromPool
从池中借出资金。

**函数签名:**
```solidity
function lendFromPool(
    address lendToken,
    uint256 lendAmount,
    address collateralToken,
    uint256 collateralAmount,
    uint256 interestRate,
    uint256 duration,
    address borrower,
    bytes32 orderHash
) external override nonReentrant onlyMarketplace returns (bool)
```

**参数说明:**
- `lendToken`: 借出的代币地址
- `lendAmount`: 借出金额
- `collateralToken`: 抵押的代币地址
- `collateralAmount`: 抵押金额
- `interestRate`: 利率（基点）
- `duration`: 借款期限（秒）
- `borrower`: 借款人地址
- `orderHash`: 订单哈希

**返回值:**
- `bool`: 是否成功

**修饰符:**
- `onlyMarketplace`: 只允许市场合约调用

#### repayToPool
向池中还款。

**函数签名:**
```solidity
function repayToPool(
    address lendToken,
    uint256 repayAmount,
    bytes32 orderHash,
    address borrower
) external override nonReentrant onlyMarketplace returns (bool)
```

**参数说明:**
- `lendToken`: 借出的代币地址
- `repayAmount`: 还款金额（本金+利息）
- `orderHash`: 订单哈希
- `borrower`: 借款人地址

**返回值:**
- `bool`: 是否成功

**修饰符:**
- `onlyMarketplace`: 只允许市场合约调用

### 安全机制

#### 访问控制
使用 OpenZeppelin 的 `Ownable` 合约实现访问控制，只有合约所有者才能执行管理操作。

#### 重入攻击防护
使用 OpenZeppelin 的 `ReentrancyGuard` 合约防止重入攻击。

#### 市场合约限制
关键函数只能由指定的市场合约调用，通过 `onlyMarketplace` 修饰符实现。

## LiquidityMining 合约

### 合约概述
LiquidityMining 合约允许用户质押代币以获得奖励，实现流动性挖矿功能。

### 合约地址
- 主网: 0x...
- 测试网: 0x...

### 核心功能

#### 1. 质押管理
- `deposit`: 质押代币
- `withdraw`: 提取代币
- `emergencyWithdraw`: 紧急提取（不领取奖励）

#### 2. 奖励管理
- `claim`: 领取奖励
- `pendingReward`: 查询待领取奖励

#### 3. 池管理
- `addPool`: 添加新的质押池
- `setPool`: 设置池的分配点数

#### 4. 配置管理
- `setRewardPerSecond`: 更新奖励发放速率
- `setStakePause`: 暂停/恢复质押
- `setWithdrawPause`: 暂停/恢复提取
- `setClaimPause`: 暂停/恢复领取奖励

### 数据结构

#### 用户信息
```solidity
struct UserInfo {
    uint256 amount;         // 质押数量
    uint256 rewardDebt;     // 奖励债务
    uint256 pendingRewards; // 待领取奖励
}
```

#### 池信息
```solidity
struct PoolInfo {
    IERC20 lpToken;         // 质押代币
    uint256 allocPoint;     // 分配点数
    uint256 lastRewardTime; // 上次更新奖励的时间
    uint256 accRewardPerShare; // 每份额累计奖励
}
```

### 重要函数详解

#### deposit
质押代币。

**函数签名:**
```solidity
function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused
```

**参数说明:**
- `_pid`: 池ID
- `_amount`: 质押数量

**事件触发:**
- `Deposit`: 质押成功后触发

#### withdraw
提取代币。

**函数签名:**
```solidity
function withdraw(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused
```

**参数说明:**
- `_pid`: 池ID
- `_amount`: 提取数量

**事件触发:**
- `Withdraw`: 提取成功后触发

#### claim
领取奖励。

**函数签名:**
```solidity
function claim(uint256 _pid) external nonReentrant whenNotPaused
```

**参数说明:**
- `_pid`: 池ID

**事件触发:**
- `Claim`: 领取奖励成功后触发

#### addPool
添加新的质押池。

**函数签名:**
```solidity
function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner
```

**参数说明:**
- `_lpToken`: 质押代币地址
- `_allocPoint`: 分配点数

**事件触发:**
- `PoolAdded`: 添加池成功后触发

### 奖励计算机制

奖励按照各池的分配点数比例进行分发。每个区块根据设定的奖励速率产生固定数量的奖励代币，然后按照各池的分配点数比例分配给各个池。

每份额累计奖励 (`accRewardPerShare`) 的计算公式：
```
accRewardPerShare = accRewardPerShare + (新产生的奖励 * 1e12) / 池中总质押数量
```

用户待领取奖励的计算公式：
```
待领取奖励 = (用户质押数量 * accRewardPerShare) / 1e12 - rewardDebt + pendingRewards
```

### 安全机制

#### 访问控制
使用 OpenZeppelin 的 `Ownable` 合约实现访问控制，只有合约所有者才能执行管理操作。

#### 重入攻击防护
使用 OpenZeppelin 的 `ReentrancyGuard` 合约防止重入攻击。

#### 暂停机制
继承自 `Pausable` 合约，可在紧急情况下暂停合约功能。

#### 功能开关
提供独立的质押、提取和领取奖励的暂停开关，可以精细化控制合约功能。

## 辅助合约和接口

### AggregatorV3Interface.sol
Chainlink 价格预言机接口，用于获取资产价格。

### IChecker.sol
Checker 接口，定义了 Checker 合约需要实现的函数。

### ILendingPool.sol
借贷池接口，定义了借贷池合约需要实现的函数。

### MockERC20.sol
模拟 ERC20 代币合约，用于测试环境。

### MockV3Aggregator.sol
模拟 Chainlink 价格预言机合约，用于测试环境。

### MockToken.sol
模拟代币合约，用于测试环境。