# 点对点借贷市场 (P2P Lending)

这是一个去中心化的点对点借贷市场，允许用户直接创建和接受借贷订单。用户可以灵活地指定借贷条件，包括代币类型、数量、利率和期限。支持链上、链下和借贷池三种订单管理方式。

## 主要特点

- **点对点借贷**：直接连接出借人和借款人
- **多代币支持**：支持任何ERC20代币作为借出和抵押资产
- **灵活订单**：用户可以自由设置借贷条件
- **抵押机制**：借款需要提供等值或超值抵押品
- **逾期清算**：未按时还款的订单可被清算
- **链下订单**：支持链下签名的订单，降低Gas成本
- **订单过期机制**：链下订单可设置过期时间
- **借贷池支持**：支持从借贷池中获取资金，提高资金利用效率
- **价格预言机集成**：使用Chainlink价格预言机确保抵押品价值充足

## 借贷方式

本协议支持三种借贷方式：

1. **链上订单**：出借人在链上创建订单，借款人在链上接受订单
2. **链下订单**：出借人在链下签名订单，借款人在链上执行订单
3. **借贷池订单**：借款人直接从借贷池中获取资金，无需等待特定出借人

## 合约功能

### 链上订单功能

#### 创建借贷订单
出借人可以创建借贷订单，指定：
- 借出代币类型和数量
- 抵押代币类型和数量
- 利率
- 借款期限

```solidity
function createLendingOrder(
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration
) external
```

#### 接受借贷订单
借款人可以接受现有的借贷订单：

```solidity
function fulfillLendingOrder(uint256 _orderId) external
```

#### 还款
借款人可以在借款期限内还款：

```solidity
function repayOnchainOrder(uint256 _orderId) external
```

#### 清算
如果借款人未在规定期限内还款，订单可被清算：

```solidity
function liquidateOnchainOrder(uint256 _orderId) external
```

#### 取消订单
出借人可以取消未成交的订单：

```solidity
function cancelOnchainOrder(uint256 _orderId) external
```

### 链下订单功能

#### 创建链下订单哈希
生成链下订单的唯一标识符：

```solidity
function createOffchainOrderHash(
    address _lender,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry,
    uint256 _nonce
) public pure returns (bytes32)
```

#### 验证链下订单签名
验证链下订单的签名是否有效：

```solidity
function verifyOrderSignature(
    address _lender,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry,
    uint256 _nonce,
    bytes memory _signature
) public view returns (bool)
```

#### 执行链下订单
借款人可以执行链下订单：

```solidity
function fulfillOffchainOrder(
    address _lender,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry,
    uint256 _nonce,
    bytes memory _signature
) external
```

#### 还款链下订单
借款人可以还款链下订单：

```solidity
function repayOffchainOrder(
    bytes32 _orderHash,
    address _lender,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration
) external
```

#### 清算链下订单
清算逾期的链下订单：

```solidity
function liquidateOffchainOrder(
    bytes32 _orderHash,
    address _lender,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _duration
) external
```

### 借贷池功能

#### 验证池订单
验证借贷池是否接受特定的借贷条件：

```solidity
function verifyPoolOrder(
    address _pool,
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    address _borrower
) public view returns (bool)
```

#### 从借贷池执行订单
借款人可以直接从借贷池获取资金：

```solidity
// 使用与链下订单相同的函数，但_signature参数为空
function fulfillOffchainOrder(
    address _pool, // 这里传入借贷池地址
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration,
    uint256 _expiry,
    uint256 _nonce,
    bytes memory _signature // 传入空字节数组
) external
```

#### 向借贷池还款
借款人可以向借贷池还款：

```solidity
// 使用与链下订单相同的函数
function repayOffchainOrder(
    bytes32 _orderHash,
    address _pool, // 这里传入借贷池地址
    address _lendToken,
    uint256 _lendAmount,
    address _collateralToken,
    uint256 _collateralAmount,
    uint256 _interestRate,
    uint256 _duration
) external
```

## 借贷池接口

借贷池必须实现以下接口才能与P2P借贷市场集成：

```solidity
interface ILendingPool {
    // 检查订单是否可行
    function checkOrder(
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        address borrower
    ) external view returns (bool);
    
    // 从池中借出资金
    function lendFromPool(
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        address borrower
    ) external returns (bool);
    
    // 向池中还款
    function repayToPool(
        address lendToken,
        uint256 repayAmount,
        bytes32 orderHash,
        address borrower
    ) external returns (bool);
}
```

## 价格预言机集成

借贷池使用Chainlink价格预言机来获取代币的实时价格，确保抵押品价值充足：

```solidity
// 添加支持的代币和其价格预言机
function addSupportedToken(address _token, address _priceFeed) external onlyOwner;

// 获取代币价格
function getTokenPrice(address _token) public view returns (uint256);

// 计算代币价值
function calculateTokenValue(address _token, uint256 _amount) public view returns (uint256);
```

在验证订单时，借贷池会检查抵押品价值是否大于等于借款价值的2倍，确保系统安全性：

```solidity
// 使用 Chainlink 预言机获取价格，计算抵押率
try this.calculateTokenValue(lendToken, lendAmount) returns (uint256 lendValue) {
    try this.calculateTokenValue(collateralToken, collateralAmount) returns (uint256 collateralValue) {
        // 确保抵押品价值大于等于借款价值的2倍
        // 即抵押率 >= 200%
        if (collateralValue < lendValue * 2) {
            return false;
        }
    }
}
```

## 工作流程

### 链上订单工作流程

1. 出借人调用`createLendingOrder`创建订单
2. 借款人调用`fulfillLendingOrder`接受订单
3. 借款人在期限内调用`repayOnchainOrder`还款
4. 如果借款人未按时还款，任何人可以调用`liquidateOnchainOrder`清算订单

### 链下订单工作流程

1. 出借人在链下创建订单并签名
2. 签名和订单详情存储在中心化服务器
3. 借款人获取订单信息和签名
4. 借款人调用`fulfillOffchainOrder`执行订单
5. 合约验证签名并执行借贷逻辑
6. 订单状态和借款人信息存储在链上
7. 还款和清算通过链上函数完成

### 借贷池订单工作流程

1. 借款人选择借贷池作为资金来源
2. 借款人调用`fulfillOffchainOrder`，传入借贷池地址作为`_lender`，传入空字节数组作为`_signature`
3. 合约调用借贷池的`checkOrder`函数验证订单是否可行
4. 如果验证通过，合约调用借贷池的`lendFromPool`函数从池中借出资金
5. 借款人在期限内调用`repayOffchainOrder`还款
6. 合约调用借贷池的`repayToPool`函数向池中还款
7. 如果借款人未按时还款，任何人可以调用`liquidateOffchainOrder`清算订单

## 借贷池优势

- **即时流动性**：借款人无需等待特定出借人接受订单
- **资金利用效率**：池中资金可以更高效地被利用
- **标准化条件**：借贷池可以设置标准化的借贷条件
- **风险分散**：出借人的风险分散在多个借款中
- **自动化管理**：借贷池可以实现自动化的资金管理和风险控制
- **价格预言机集成**：使用Chainlink价格预言机确保抵押品价值充足

## 风险提示

- 借款人需要提供足够的抵押品
- 未按时还款将导致抵押品被清算
- 建议仔细评估借贷风险
- 该协议尚未经过安全审计

## 技术细节

### 利息计算

利息计算采用固定利率模型，具有特殊的提前还款机制：

- 全程固定利率：订单创建时确定总利息
- 提前还款惩罚：
  - 如果在借款期限内提前还款，仍需支付**一半的未到期利息**
  - 例如：30天借款，15天提前还款，需支付的利息为50%+25%=75%
  - 例如：40天借款，30天后提前还款，需支付的利息为75%+12.5%=87.5%
- 逾期后全额收取利息

利率按基点计算（1% = 100基点）

### 抵押品机制

- 支持任何符合ERC20标准的代币作为抵押品
- 借款人需提供超额抵押，抵押品价值至少为借款价值的2倍
- 使用Chainlink价格预言机获取代币实时价格
- 未按时还款将导致抵押品被清算

### 链下订单安全机制

- 订单哈希包含所有订单参数，防止篡改
- 使用ECDSA验证签名
- 订单过期时间防止长期未执行的订单被滥用
- 签名一次性使用，防止重放攻击
- 订单状态存储在链上，确保不会重复执行

### 借贷池安全机制

- 池合约必须实现标准接口
- 订单验证由池合约负责
- 资金流动由主合约控制
- 订单状态存储在主合约中
- 清算机制与其他订单类型一致
- 使用Chainlink价格预言机确保抵押品价值充足

## 开发和测试

```bash
# 安装依赖
npm install

# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到测试网
npx hardhat run scripts/deploy.js --network <network-name>
```

## 许可证

MIT
