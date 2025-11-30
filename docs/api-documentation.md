# API 文档

## 目录
1. [智能合约API](#智能合约api)
2. [前端API](#前端api)
3. [外部服务API](#外部服务api)

## 智能合约API

### UnifiedMatchingEngine 合约

#### 读取函数

##### `getOrderStatus`
获取链下订单状态。

**参数:**
- `_orderHash` (bytes32): 订单哈希

**返回值:**
- `OrderStatus`: 订单状态

##### `isPoolOrder`
检查订单是否为池订单。

**参数:**
- `_orderHash` (bytes32): 订单哈希

**返回值:**
- `bool`: 如果是池订单返回true，否则返回false

##### `getOffchainOrderPool`
获取链下订单关联的池地址。

**参数:**
- `_orderHash` (bytes32): 订单哈希

**返回值:**
- `address`: 池合约地址

#### 写入函数

##### `createOnchainOrder`
创建链上订单。

**参数:**
- `_params` (OnchainOrderParams): 订单参数结构体
  - `lender` (address): 出借人地址
  - `borrower` (address): 借款人地址
  - `lendToken` (address): 出借代币地址
  - `lendAmount` (uint256): 出借数量
  - `collateralToken` (address): 抵押代币地址
  - `collateralAmount` (uint256): 抵押数量
  - `interestRate` (uint256): 利率（基点）
  - `duration` (uint256): 期限（秒）
  - `expiry` (uint256): 过期时间戳

##### `fulfillOnchainOrder`
撮合链上订单。

**参数:**
- `_orderId` (uint256): 订单ID
- `_signature` (bytes): 借款人签名

##### `cancelOnchainOrder`
取消链上订单。

**参数:**
- `_orderId` (uint256): 订单ID

##### `createOffchainOrder`
创建链下订单。

**参数:**
- `_params` (OffchainOrderParams): 订单参数结构体
  - `lender` (address): 出借人地址
  - `borrower` (address): 借款人地址
  - `lendToken` (address): 出借代币地址
  - `lendAmount` (uint256): 出借数量
  - `collateralToken` (address): 抵押代币地址
  - `collateralAmount` (uint256): 抵押数量
  - `interestRate` (uint256): 利率（基点）
  - `duration` (uint256): 期限（秒）
  - `expiry` (uint256): 过期时间戳
  - `nonce` (uint256): 随机数

##### `fulfillOffchainOrder`
撮合链下订单。

**参数:**
- `_params` (OffchainOrderParams): 订单参数结构体
- `_signature` (bytes): 借款人签名

##### `repayOffchainOrder`
偿还链下订单。

**参数:**
- `_params` (OffchainOrderParams): 订单参数结构体

##### `repayOnchainOrder`
偿还链上订单。

**参数:**
- `_orderId` (uint256): 订单ID

##### `liquidateOrder`
清算订单。

**参数:**
- `_orderHash` (bytes32): 订单哈希

### FixedRateLendingPool 合约

#### 读取函数

##### `getSupportedTokens`
获取支持的代币列表。

**返回值:**
- `address[]`: 支持的代币地址数组

##### `isSupportedToken`
检查代币是否受支持。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `bool`: 如果受支持返回true，否则返回false

##### `getTokenPrice`
获取代币价格。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 代币价格（8位小数）

##### `calculateCollateralValue`
计算抵押品价值。

**参数:**
- `_token` (address): 抵押代币地址
- `_amount` (uint256): 抵押数量

**返回值:**
- `uint256`: 抵押品价值（以USD计价，18位小数）

##### `getPoolBalance`
获取池中代币余额。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 池中代币余额

##### `getUserBalance`
获取用户在池中的余额。

**参数:**
- `_user` (address): 用户地址
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 用户在池中的余额

##### `getTotalLiquidity`
获取池中总流动性。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 池中总流动性

##### `getUtilizationRate`
获取池中代币利用率。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 利用率（基点）

##### `getBorrowRate`
获取借款利率。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 借款利率（基点）

##### `getDepositRate`
获取存款利率。

**参数:**
- `_token` (address): 代币地址

**返回值:**
- `uint256`: 存款利率（基点）

#### 写入函数

##### `addSupportedToken`
添加支持的代币。

**参数:**
- `_token` (address): 代币地址
- `_priceFeed` (address): 价格预言机地址

##### `deposit`
存入代币到池中。

**参数:**
- `_token` (address): 代币地址
- `_amount` (uint256): 存入数量

##### `withdraw`
从池中提取代币。

**参数:**
- `_token` (address): 代币地址
- `_amount` (uint256): 提取数量

##### `borrowFromPool`
从池中借款。

**参数:**
- `_lendToken` (address): 借款代币地址
- `_lendAmount` (uint256): 借款数量
- `_collateralToken` (address): 抵押代币地址
- `_collateralAmount` (uint256): 抵押数量
- `_interestRate` (uint256): 利率（基点）
- `_duration` (uint256): 期限（秒）
- `_expiry` (uint256): 过期时间戳
- `_nonce` (uint256): 随机数
- `_signature` (bytes): 签名

##### `repayToPool`
偿还借款到池中。

**参数:**
- `_orderHash` (bytes32): 订单哈希

##### `liquidateLoanInPool`
清算池中贷款。

**参数:**
- `_orderHash` (bytes32): 订单哈希

## 前端API

### 用户管理API

#### 登录
```
POST /api/login
请求体: { address: "用户钱包地址" }
响应: { token: "JWT令牌" }
```

#### 获取用户信息
```
GET /api/user
响应: { 
  address: "用户钱包地址",
  totalDeposits: "总存款",
  totalBorrows: "总借款",
  netAPY: "净年化收益率"
}
```

### 市场数据API

#### 获取市场概览
```
GET /api/market/overview
响应: {
  totalValueLocked: "总锁仓价值",
  totalBorrows: "总借款",
  avgInterestRate: "平均利率"
}
```

#### 获取代币列表
```
GET /api/market/tokens
响应: [{
  address: "代币地址",
  symbol: "代币符号",
  name: "代币名称",
  price: "当前价格",
  liquidity: "流动性",
  borrowRate: "借款利率",
  depositRate: "存款利率"
}]
```

### 交易API

#### 创建链上订单
```
POST /api/orders/onchain
请求体: {
  lender: "出借人地址",
  borrower: "借款人地址",
  lendToken: "出借代币地址",
  lendAmount: "出借数量",
  collateralToken: "抵押代币地址",
  collateralAmount: "抵押数量",
  interestRate: "利率",
  duration: "期限",
  expiry: "过期时间"
}
响应: { orderId: "订单ID" }
```

#### 创建链下订单
```
POST /api/orders/offchain
请求体: {
  lender: "出借人地址",
  borrower: "借款人地址",
  lendToken: "出借代币地址",
  lendAmount: "出借数量",
  collateralToken: "抵押代币地址",
  collateralAmount: "抵押数量",
  interestRate: "利率",
  duration: "期限",
  expiry: "过期时间",
  nonce: "随机数"
}
响应: { orderHash: "订单哈希" }
```

#### 获取订单列表
```
GET /api/orders?status=pending&type=onchain
响应: [{
  orderId: "订单ID",
  orderHash: "订单哈希",
  lender: "出借人地址",
  borrower: "借款人地址",
  lendToken: "出借代币信息",
  collateralToken: "抵押代币信息",
  interestRate: "利率",
  duration: "期限",
  expiry: "过期时间",
  status: "订单状态"
}]
```

## 外部服务API

### Chainlink 价格预言机
```
GET https://api.chain.link/v1/feeds/{feed_address}
响应: {
  price: "当前价格",
  decimals: "小数位数",
  updatedAt: "更新时间"
}
```

### 区块链浏览器API
```
GET https://api.etherscan.io/api?module=contract&action=getabi&address={contract_address}
响应: {
  status: "1表示成功",
  message: "OK表示成功",
  result: "ABI JSON字符串"
}
```