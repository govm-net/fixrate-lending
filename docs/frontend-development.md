# 前端开发文档

## 目录结构

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── App.js
│   │   ├── Navbar.js
│   │   ├── Home.js
│   │   ├── LendingPool.js
│   │   ├── LendingPoolWithLP.js
│   │   ├── UnifiedMatching.js
│   │   ├── LiquidityMining.js
│   │   ├── MyOrders.js
│   │   ├── Settings.js
│   │   ├── Footer.js
│   │   └── Web3Context.js
│   │   ├── abis/
│   │   │   ├── ERC20.json
│   │   │   ├── FixedRateLendingPool.json
│   │   │   ├── LiquidityMining.json
│   │   │   ├── MockERC20.json
│   │   │   └── UnifiedMatchingEngine.json
│   │   └── networkConfig.js
│   ├── App.js
│   ├── index.css
│   └── index.js
├── package.json
```

## 技术栈

- React 18
- Material-UI (MUI) 5
- Ethers.js 5.7
- React Router v6

## 核心功能模块

### 1. 借贷池 (LendingPool)

借贷池模块允许用户存入资产赚取利息，或借入资产提供抵押。

主要功能：
- 存款和提款
- 借款和还款
- 查看账户余额和收益
- 查看池中资产的利率信息

### 2. 带LP代币的借贷池 (LendingPoolWithLP)

扩展的借贷池功能，用户存款时会获得代表其份额的LP代币。

主要功能：
- 存款获得LP代币
- 使用LP代币提款
- 查看LP代币余额

### 3. 统一撮合引擎 (UnifiedMatching)

统一撮合引擎模块支持用户创建和执行点对点借贷订单。

主要功能：
- 创建借贷订单
- 执行他人订单
- 查看订单状态
- 取消订单

### 4. 流动性挖矿 (LiquidityMining)

流动性挖矿模块允许用户质押LP代币赚取奖励。

主要功能：
- 质押LP代币
- 领取奖励
- 查看质押信息

### 5. 我的订单 (MyOrders)

订单管理模块显示用户创建和参与的所有订单。

主要功能：
- 查看借款订单
- 查看出借订单
- 还款和清算操作

### 6. 设置 (Settings)

设置模块允许用户配置API端点和其他选项。

主要功能：
- 配置API端点
- 管理网络连接

## UI组件设计

### 导航栏 (Navbar)
- 显示平台名称和主要导航链接
- 显示连接的钱包地址
- 提供连接/断开钱包功能

### 首页 (Home)
- 平台介绍和功能概述
- 快速导航到主要功能模块
- 工作流程说明

### 贷池页面 (LendingPool)
- 显示支持的代币和利率信息
- 提供存款和借款表单
- 显示用户账户信息

### 统一撮合页面 (UnifiedMatching)
- 显示可用的借贷订单
- 提供创建订单表单
- 提供执行订单功能

### 流动性挖矿页面 (LiquidityMining)
- 显示质押信息和奖励
- 提供质押和领取奖励功能

## 状态管理

前端使用React Context API进行状态管理，主要包括：

### Web3Context
管理Web3相关状态：
- 钱包连接状态
- 合约实例
- 账户信息
- 网络信息

### ApiContext
管理API相关状态：
- API端点配置
- 网络配置

## API集成

前端与智能合约交互，主要通过ethers.js库实现。

### 合约交互流程
1. 连接钱包获取provider和signer
2. 获取合约实例
3. 调用合约方法（读取或写入）
4. 处理交易结果和事件

### 错误处理
- 网络连接错误
- 合约调用错误
- 用户拒绝交易错误
- 交易失败错误

## 测试

### 组件测试
- 使用React Testing Library进行组件单元测试
- 测试用户交互和状态变化

### 集成测试
- 测试与智能合约的集成
- 验证交易流程和结果

## 部署

### 开发环境
```bash
npm start
```

### 生产环境
```bash
npm run build
npm run deploy
```