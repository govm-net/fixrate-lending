# 合约逻辑详情

## 目录
1. [UnifiedMatchingEngine 合约逻辑](#unifiedmatchingengine-合约逻辑)
2. [Checker 合约逻辑](#checker-合约逻辑)
3. [LendingPool 合约逻辑](#lendingpool-合约逻辑)
4. [安全机制](#安全机制)
5. [事件系统](#事件系统)

## UnifiedMatchingEngine 合约逻辑

### 核心功能模块

#### 订单管理
UnifiedMatchingEngine负责管理所有交易订单的生命周期：
- 订单创建和初始化
- 订单状态跟踪和更新
- 订单取消和清理

#### 交易撮合
作为核心撮合引擎，负责：
- 调用相应的Checker验证订单
- 协调资金流转
- 执行交易并更新状态

#### 资金流转控制
不直接处理资金转移，而是：
- 调用Checker进行验证
- 协调各方资金转移
- 确保交易原子性

### 关键数据结构

#### 交易订单结构
```solidity
struct LoanOrder {
    address checker;         // Checker合约地址
    address lender;          // 出借人地址
    address borrower;        // 借款人地址
    address lendToken;       // 借出代币地址
    uint256 lendAmount;      // 借出金额
    address collateralToken;  // 抵押代币地址
    uint256 collateralAmount; // 抵押金额
    uint256 interestRate;    // 利率（基点）
    uint256 duration;        // 借款期限（秒）
    uint256 expiry;          // 过期时间
    uint256 nonce;           // 随机数
    bytes signature;         // 签名数据
}
```

#### 订单状态枚举
```solidity
enum OrderStatus {
    PENDING,     // 待撮合
    ACTIVE,      // 活跃中
    REPAID,      // 已还款
    LIQUIDATED,  // 已清算
    CANCELLED    // 已取消
}
```

### 核心函数逻辑

#### initiateBorrowRequest
发起借款请求的逻辑：
1. 验证参数有效性
2. 生成订单哈希
3. 记录订单状态为PENDING
4. 触发BorrowRequestInitiated事件

#### initiateLendRequest
发起出借请求的逻辑：
1. 验证参数和签名有效性
2. 生成订单哈希
3. 记录订单状态为PENDING
4. 触发LendRequestInitiated事件

#### executeBorrow
执行借款交易的逻辑：
1. 验证交易发送者为出借人
2. 调用Checker.verifyBorrowerOrder验证订单
3. 检查验证结果
4. 转移借出资产和抵押资产
5. 更新订单状态为ACTIVE
6. 触发BorrowExecuted事件

#### executeLend
执行出借交易的逻辑：
1. 验证交易发送者为借款人
2. 调用Checker.verifyLenderOrder验证订单
3. 检查验证结果
4. 转移抵押资产和借出资产
5. 更新订单状态为ACTIVE
6. 触发LendExecuted事件

#### cancelOrder
取消订单的逻辑：
1. 验证调用者权限
2. 生成lender+nonce或borrower+nonce键值
3. 检查状态是否已使用
4. 设置状态为true
5. 触发OrderCancelled事件

## Checker 合约逻辑

### IChecker 接口
定义了所有Checker必须实现的核心函数：
- verifyLenderOrder: 验证出借人订单
- verifyBorrowerOrder: 验证借款人订单
- getCheckerInfo: 获取Checker信息

### PersonalChecker 实现
针对个人对个人交易的验证逻辑：
1. 验证签名有效性
2. 检查资产数量和类型
3. 验证参数合规性
4. 返回验证结果

### PoolChecker 实现
针对池化资金交易的验证逻辑：
1. 检查池中资金充足性
2. 查询Chainlink预言机获取资产价格
3. 验证抵押物价值>=2*借款价值
4. 检查订单参数合规性
5. 返回验证结果

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
    uint256 expiry;
    uint256 nonce;
    bytes signature;
}
```

## LendingPool 合约逻辑

### 核心功能模块

#### 资金管理
- 存款：用户向池中存入资产，获得LP Token
- 提款：用户从池中提取资产，销毁LP Token

#### 订单处理
- 验证订单：检查订单是否符合池的要求
- 执行借贷：从池中借出资金给借款人
- 处理还款：接收借款人的还款

#### 收益分配
- 利息计算：根据存款份额计算利息
- 收益累积：实时累积到用户存款中
- 收益查询：提供待领取收益查询接口

### 关键数据结构

#### 池信息结构
```solidity
struct PoolInfo {
    address token;              // 支持的代币地址
    uint256 totalDeposits;      // 总存款金额
    uint256 totalLoans;         // 总贷款金额
    uint256 minInterestRate;    // 最低利率要求
    uint256 maxLoanDuration;    // 最大借款期限
    uint256 minCollateralRatio; // 最低抵押率
    bool enabled;               // 池是否启用
}
```

#### 用户存款信息
```solidity
struct UserDeposit {
    uint256 amount;             // 存款金额
    uint256 shareAmount;        // 份额数量
    uint256 lastUpdateTime;     // 最后更新时间
}
```

#### LP Token信息
```solidity
struct LPTokenInfo {
    address lpTokenAddress;     // LP Token合约地址
    string name;                // LP Token名称
    string symbol;              // LP Token符号
    uint8 decimals;             // 小数位数
}
```

### 核心函数逻辑

#### deposit
存款逻辑：
1. 验证代币是否支持
2. 转移代币到池合约
3. 铸造相应数量的LP Token给存款人
4. 更新池状态
5. 触发Deposit事件

#### withdraw
提款逻辑：
1. 验证代币是否支持
2. 检查用户LP Token余额
3. 销毁相应数量的LP Token
4. 转移代币给提款人
5. 更新池状态
6. 触发Withdraw事件

#### checkOrder
订单验证逻辑：
1. 检查代币是否支持
2. 检查池中资金是否充足
3. 验证利率是否满足最低要求
4. 检查借款期限是否在允许范围内
5. 通过Chainlink预言机验证抵押物价值
6. 返回验证结果

#### lendFromPool
从池中借出资金逻辑：
1. 验证订单是否可行
2. 标记订单为活跃
3. 更新借出金额
4. 转移代币给借款人
5. 触发LoanIssued事件

#### repayToPool
向池中还款逻辑：
1. 验证订单是否活跃
2. 验证代币是否支持
3. 更新池余额
4. 标记订单为非活跃
5. 触发LoanRepaid事件

## 安全机制

### 重入攻击防护
使用OpenZeppelin的ReentrancyGuard防止重入攻击。

### 签名验证
采用EIP-712标准进行离线签名验证，确保交易真实性。

### 防重放攻击
通过订单哈希和nonce机制防止订单重放攻击。

### 权限控制
通过访问控制确保只有授权方可以执行特定操作。

### 资产价值验证
对于涉及资金池的交易，通过Chainlink预言机获取资产价格，验证抵押物价值是否满足要求。

## 事件系统

### UnifiedMatchingEngine 事件
- BorrowRequestInitiated: 借款请求发起
- LendRequestInitiated: 出借请求发起
- BorrowExecuted: 借款执行
- LendExecuted: 出借执行
- OrderCancelled: 订单取消

### Checker 事件
- CheckerVerified: Checker验证通过
- OrderVerified: 订单验证通过
- VerificationFailed: 验证失败

### LendingPool 事件
- Deposit: 用户存款
- Withdraw: 用户提款
- LoanFromPool: 从池中出借资金
- RepayToPool: 向池中还款
- PoolParamsUpdated: 池参数更新