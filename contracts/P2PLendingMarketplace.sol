// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILendingPool.sol";

/**
 * @title P2PLendingMarketplace
 * @dev 点对点借贷市场，支持链上和链下订单管理
 */
contract P2PLendingMarketplace is Ownable, ReentrancyGuard, EIP712, Pausable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // EIP-712类型哈希常量
    bytes32 private constant OFFCHAIN_ORDER_TYPEHASH = keccak256(
        "OffchainOrder(address lender,address lendToken,uint256 lendAmount,address collateralToken,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 expiry,uint256 nonce)"
    );

    // 构造函数，设置初始所有者和EIP-712域名
    constructor() Ownable(msg.sender) EIP712("P2PLendingMarketplace", "1") {
    }

    // 订单状态枚举
    enum OrderStatus {
        PENDING,     // 订单已创建，等待接受
        ACTIVE,      // 订单生效中
        REPAID,      // 已还款
        LIQUIDATED,  // 已清算
        CANCELLED    // 已取消
    }

    // 链上借贷订单结构
    struct LendingOrder {
        address lender;           // 出借人
        address borrower;         // 借款人
        address lendToken;        // 借出的代币
        address collateralToken;  // 抵押的代币
        uint256 lendAmount;       // 借出金额
        uint256 collateralAmount; // 抵押金额
        uint256 interestRate;     // 利率（基点）
        uint256 duration;         // 借款期限（秒）
        uint256 startTime;        // 借款开始时间
    }

    // 链上订单ID映射
    uint256 public nextOrderId = 1;
    mapping(uint256 => LendingOrder) public lendingOrders;
    
    // 订单状态单独存储 (适用于链上和链下订单)
    mapping(uint256 => OrderStatus) public onchainOrderStatus;
    mapping(bytes32 => OrderStatus) public offchainOrderStatus;
    
    // 链下订单借款人映射
    mapping(bytes32 => address) public offchainOrderBorrowers;
    
    // 链下订单开始时间映射
    mapping(bytes32 => uint256) public offchainOrderStartTimes;
    
    // 已处理的订单映射，防止重放攻击
    mapping(bytes32 => bool) public processedOffchainOrder;
    
    // 链下订单的出借池映射
    mapping(bytes32 => address) public offchainOrderPools;

    // 用户可创建的最大订单数
    uint256 public constant MAX_USER_ORDERS = 10;

    // 事件
    event OnchainOrderCreated(
        uint256 indexed orderId, 
        address indexed lender, 
        address lendToken, 
        uint256 lendAmount, 
        address collateralToken, 
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration
    );
    
    event OffchainOrderFulfilled(
        bytes32 indexed orderHash,
        address indexed lender,
        address indexed borrower,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 startTime
    );
    
    event OnchainOrderStatusChanged(
        uint256 indexed orderId, 
        OrderStatus newStatus
    );
    
    event OffchainOrderStatusChanged(
        bytes32 indexed orderHash, 
        OrderStatus newStatus
    );
    
    event PoolOrderFulfilled(
        bytes32 indexed orderHash,
        address indexed pool,
        address indexed borrower,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 startTime
    );

    /**
     * @dev 暂停合约
     * 只有合约所有者可以调用
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     * 只有合约所有者可以调用
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // 创建链上借贷订单
    function createLendingOrder(
        address _lendToken,
        uint256 _lendAmount,
        address _collateralToken,
        uint256 _collateralAmount,
        uint256 _interestRate,
        uint256 _duration
    ) external nonReentrant whenNotPaused {
        require(_lendAmount > 0, "Lending amount must be greater than 0");
        require(_collateralAmount > 0, "Collateral amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_interestRate > 0, "Interest rate must be greater than 0");

        // 转移借出代币到合约
        IERC20(_lendToken).safeTransferFrom(msg.sender, address(this), _lendAmount);

        // 创建订单
        LendingOrder storage order = lendingOrders[nextOrderId];
        order.lender = msg.sender;
        order.lendToken = _lendToken;
        order.lendAmount = _lendAmount;
        order.collateralToken = _collateralToken;
        order.collateralAmount = _collateralAmount;
        order.interestRate = _interestRate;
        order.duration = _duration;
        
        // 设置订单状态
        onchainOrderStatus[nextOrderId] = OrderStatus.PENDING;

        emit OnchainOrderCreated(
            nextOrderId, 
            msg.sender, 
            _lendToken, 
            _lendAmount, 
            _collateralToken, 
            _collateralAmount,
            _interestRate,
            _duration
        );

        nextOrderId++;
    }

    // 创建链下借贷订单的哈希
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
    ) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            OFFCHAIN_ORDER_TYPEHASH,
            _lender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce
        )));
    }

    // 验证链下订单签名
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
    ) public view returns (bool) {
        // 如果签名为空，则认为是池订单，不需要验证签名
        if (_signature.length == 0) {
            return true;
        }
        
        bytes32 orderHash = createOffchainOrderHash(
            _lender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce
        );
        
        // 使用EIP-712验证签名
        address signer = ECDSA.recover(orderHash, _signature);
        return signer == _lender;
    }

    // 执行链下订单
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
    ) external nonReentrant whenNotPaused {
        // 验证订单未过期
        require(block.timestamp <= _expiry, "Order has expired");
        
        // 计算订单哈希
        bytes32 orderHash = createOffchainOrderHash(
            _lender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce
        );
        
        // 确保订单未被处理
        require(offchainOrderStatus[orderHash] == OrderStatus.PENDING || 
                offchainOrderStatus[orderHash] == OrderStatus(0), "Order already processed");
        
        // 验证签名未被使用过
        require(!processedOffchainOrder[orderHash], "Order already processed");
        
        // 验证签名不为空（确保是个人订单而非池订单）
        require(_signature.length > 0, "Empty signature, use fulfillPoolOrder for pool orders");
        
        // 验证个人出借签名
        require(verifyOrderSignature(
            _lender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce,
            _signature
        ), "Invalid signature");
        
        // 更新状态（在外部调用之前）
        processedOffchainOrder[orderHash] = true;
        offchainOrderBorrowers[orderHash] = msg.sender;
        offchainOrderStatus[orderHash] = OrderStatus.ACTIVE;
        uint256 startTime = block.timestamp;
        offchainOrderStartTimes[orderHash] = startTime;
        
        // 转移抵押代币到合约（外部调用）
        IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);
        
        // 从贷款人转移代币到借款人（外部调用）
        IERC20(_lendToken).safeTransferFrom(_lender, msg.sender, _lendAmount);
        
        emit OffchainOrderFulfilled(
            orderHash,
            _lender,
            msg.sender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            startTime
        );
        
        emit OffchainOrderStatusChanged(orderHash, OrderStatus.ACTIVE);
    }
    
    /**
     * @dev 执行池订单
     * @param _pool 借贷池地址
     * @param _lendToken 借出的代币地址
     * @param _lendAmount 借出金额
     * @param _collateralToken 抵押的代币地址
     * @param _collateralAmount 抵押金额
     * @param _interestRate 利率（基点）
     * @param _duration 借款期限（秒）
     * @param _expiry 过期时间
     * @param _nonce 随机数
     */
    function fulfillPoolOrder(
        address _pool,
        address _lendToken,
        uint256 _lendAmount,
        address _collateralToken,
        uint256 _collateralAmount,
        uint256 _interestRate,
        uint256 _duration,
        uint256 _expiry,
        uint256 _nonce
    ) external nonReentrant whenNotPaused {
        // 验证订单未过期
        require(block.timestamp <= _expiry, "Order has expired");
        
        // 计算订单哈希
        bytes32 orderHash = createOffchainOrderHash(
            _pool,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce
        );
        
        // 确保订单未被处理
        require(offchainOrderStatus[orderHash] == OrderStatus.PENDING || 
                offchainOrderStatus[orderHash] == OrderStatus(0), "Order already processed");
        
        // 验证签名未被使用过
        require(!processedOffchainOrder[orderHash], "Order already processed");
        
        // 更新状态（在外部调用之前）
        processedOffchainOrder[orderHash] = true;
        offchainOrderBorrowers[orderHash] = msg.sender;
        offchainOrderStatus[orderHash] = OrderStatus.ACTIVE;
        uint256 startTime = block.timestamp;
        offchainOrderStartTimes[orderHash] = startTime;
        
        // 记录出借池
        offchainOrderPools[orderHash] = _pool;
        
        // 转移抵押代币到合约（外部调用）
        IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);
        
        // 从池中借出资金（外部调用）
        require(ILendingPool(_pool).lendFromPool(
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            msg.sender,
            orderHash
        ), "Pool lending failed");
        
        emit PoolOrderFulfilled(
            orderHash,
            _pool,
            msg.sender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            startTime
        );
        
        emit OffchainOrderStatusChanged(orderHash, OrderStatus.ACTIVE);
    }
    
    // 接受链上借贷订单
    function fulfillLendingOrder(uint256 _orderId) external nonReentrant whenNotPaused {
        require(onchainOrderStatus[_orderId] == OrderStatus.PENDING, "Order is not pending");
        LendingOrder storage order = lendingOrders[_orderId];

        // 转移抵押代币到合约
        IERC20(order.collateralToken).safeTransferFrom(msg.sender, address(this), order.collateralAmount);

        // 更新订单信息
        order.borrower = msg.sender;
        order.startTime = block.timestamp;
        onchainOrderStatus[_orderId] = OrderStatus.ACTIVE;

        // 将借出代币转给借款人
        IERC20(order.lendToken).safeTransfer(msg.sender, order.lendAmount);

        emit OnchainOrderStatusChanged(_orderId, OrderStatus.ACTIVE);
    }

    // 链下订单参数结构体，用于减少函数参数数量
    struct OffchainOrderParams {
        address lender;
        address lendToken;
        uint256 lendAmount;
        address collateralToken;
        uint256 collateralAmount;
        uint256 interestRate;
        uint256 duration;
        uint256 expiry;
        uint256 nonce;
    }
    
    // 还款链上订单
    function repayOnchainOrder(uint256 _orderId) external nonReentrant whenNotPaused {
        require(onchainOrderStatus[_orderId] == OrderStatus.ACTIVE, "Order is not active");
        LendingOrder storage order = lendingOrders[_orderId];
        require(order.borrower == msg.sender, "Only borrower can repay");

        // 计算应还金额（本金 + 利息）
        uint256 interest = calculateInterest(
            order.lendAmount,
            order.interestRate,
            order.startTime,
            order.duration
        );
        uint256 totalRepayment = order.lendAmount + interest;

        // 转移还款代币
        IERC20(order.lendToken).safeTransferFrom(msg.sender, order.lender, totalRepayment);

        // 返还抵押品
        IERC20(order.collateralToken).safeTransfer(msg.sender, order.collateralAmount);

        // 更新订单状态
        onchainOrderStatus[_orderId] = OrderStatus.REPAID;

        emit OnchainOrderStatusChanged(_orderId, OrderStatus.REPAID);
    }
    
    // 还款链下订单
    function repayOffchainOrder(
        OffchainOrderParams calldata _params
    ) external nonReentrant whenNotPaused {
        // 计算订单哈希
        bytes32 orderHash = createOffchainOrderHash(
            _params.lender,
            _params.lendToken,
            _params.lendAmount,
            _params.collateralToken,
            _params.collateralAmount,
            _params.interestRate,
            _params.duration,
            _params.expiry,
            _params.nonce
        );
        
        require(offchainOrderStatus[orderHash] == OrderStatus.ACTIVE, "Order is not active");
        require(offchainOrderBorrowers[orderHash] == msg.sender, "Only borrower can repay");
        
        // 获取合约存储的开始时间
        uint256 startTime = offchainOrderStartTimes[orderHash];
        require(startTime > 0, "Order start time not found");
        
        // 计算应还金额（本金 + 利息）
        uint256 interest = calculateInterest(
            _params.lendAmount,
            _params.interestRate,
            startTime,
            _params.duration
        );
        uint256 totalRepayment = _params.lendAmount + interest;

        // 检查是否是池订单
        address pool = offchainOrderPools[orderHash];
        if (pool != address(0)) {
            // 池订单 - 先转移代币到市场合约
            IERC20(_params.lendToken).safeTransferFrom(msg.sender, address(this), totalRepayment);
            
            // 将代币转移到池合约
            IERC20(_params.lendToken).safeTransfer(pool, totalRepayment);
            
            // 调用池合约的repayToPool方法
            require(ILendingPool(pool).repayToPool(
                _params.lendToken,
                totalRepayment,
                orderHash,
                msg.sender
            ), "Pool repayment failed");
        } else {
            // 个人订单 - 直接转移还款代币给出借人
            IERC20(_params.lendToken).safeTransferFrom(msg.sender, _params.lender, totalRepayment);
        }

        // 返还抵押品
        IERC20(_params.collateralToken).safeTransfer(msg.sender, _params.collateralAmount);

        // 更新订单状态
        offchainOrderStatus[orderHash] = OrderStatus.REPAID;

        emit OffchainOrderStatusChanged(orderHash, OrderStatus.REPAID);
    }

    // 清算逾期链上订单
    function liquidateOnchainOrder(uint256 _orderId) external nonReentrant whenNotPaused {
        require(onchainOrderStatus[_orderId] == OrderStatus.ACTIVE, "Order is not active");
        LendingOrder storage order = lendingOrders[_orderId];
        require(block.timestamp > order.startTime + order.duration, "Order not yet overdue");

        // 将抵押品转给出借人
        IERC20(order.collateralToken).safeTransfer(order.lender, order.collateralAmount);

        // 更新订单状态
        onchainOrderStatus[_orderId] = OrderStatus.LIQUIDATED;

        emit OnchainOrderStatusChanged(_orderId, OrderStatus.LIQUIDATED);
    }
    
    // 清算逾期链下订单
    function liquidateOffchainOrder(
        OffchainOrderParams calldata _params
    ) external nonReentrant whenNotPaused {
        // 计算订单哈希
        bytes32 orderHash = createOffchainOrderHash(
            _params.lender,
            _params.lendToken,
            _params.lendAmount,
            _params.collateralToken,
            _params.collateralAmount,
            _params.interestRate,
            _params.duration,
            _params.expiry,
            _params.nonce
        );
        
        require(offchainOrderStatus[orderHash] == OrderStatus.ACTIVE, "Order is not active");
        
        // 获取合约存储的开始时间
        uint256 startTime = offchainOrderStartTimes[orderHash];
        require(startTime > 0, "Order start time not found");
        
        require(block.timestamp > startTime + _params.duration, "Order not yet overdue");

        // 检查是否是池订单
        address pool = offchainOrderPools[orderHash];
        address recipient = pool != address(0) ? pool : _params.lender;

        // 将抵押品转给出借人或池
        IERC20(_params.collateralToken).safeTransfer(recipient, _params.collateralAmount);

        // 更新订单状态
        offchainOrderStatus[orderHash] = OrderStatus.LIQUIDATED;

        emit OffchainOrderStatusChanged(orderHash, OrderStatus.LIQUIDATED);
    }

    // 取消未成交的链上订单
    function cancelOnchainOrder(uint256 _orderId) external nonReentrant whenNotPaused {
        LendingOrder storage order = lendingOrders[_orderId];
        require(order.lender == msg.sender, "Only lender can cancel");
        require(onchainOrderStatus[_orderId] == OrderStatus.PENDING, "Order is not pending");

        // 返还借出代币
        IERC20(order.lendToken).safeTransfer(msg.sender, order.lendAmount);

        // 更新订单状态
        onchainOrderStatus[_orderId] = OrderStatus.CANCELLED;

        emit OnchainOrderStatusChanged(_orderId, OrderStatus.CANCELLED);
    }

    /**
     * @dev 取消未成交的链下订单
     * @param _lender 出借人地址
     * @param _lendToken 借出的代币地址
     * @param _lendAmount 借出金额
     * @param _collateralToken 抵押的代币地址
     * @param _collateralAmount 抵押金额
     * @param _interestRate 利率（基点）
     * @param _duration 借款期限（秒）
     * @param _expiry 过期时间
     * @param _nonce 随机数
     */
    function cancelOffchainOrder(
        address _lender,
        address _lendToken,
        uint256 _lendAmount,
        address _collateralToken,
        uint256 _collateralAmount,
        uint256 _interestRate,
        uint256 _duration,
        uint256 _expiry,
        uint256 _nonce
    ) external nonReentrant whenNotPaused {
        // 验证调用者是订单创建者
        require(_lender == msg.sender, "Only lender can cancel");
        
        // 计算订单哈希
        bytes32 orderHash = createOffchainOrderHash(
            _lender,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce
        );
        
        // 确保订单未被处理
        require(!processedOffchainOrder[orderHash], "Order already processed");
        
        // 确保订单状态为PENDING或未初始化
        require(offchainOrderStatus[orderHash] == OrderStatus.PENDING || 
                offchainOrderStatus[orderHash] == OrderStatus(0), "Order is not pending");
        
        // 标记订单为已处理并取消
        processedOffchainOrder[orderHash] = true;
        offchainOrderStatus[orderHash] = OrderStatus.CANCELLED;
        
        emit OffchainOrderStatusChanged(orderHash, OrderStatus.CANCELLED);
    }

    /**
     * @dev 取消未成交的池订单
     * @param _pool 借贷池地址
     * @param _lendToken 借出的代币地址
     * @param _lendAmount 借出金额
     * @param _collateralToken 抵押的代币地址
     * @param _collateralAmount 抵押金额
     * @param _interestRate 利率（基点）
     * @param _duration 借款期限（秒）
     * @param _expiry 过期时间
     * @param _nonce 随机数
     */
    function cancelPoolOrder(
        address _pool,
        address _lendToken,
        uint256 _lendAmount,
        address _collateralToken,
        uint256 _collateralAmount,
        uint256 _interestRate,
        uint256 _duration,
        uint256 _expiry,
        uint256 _nonce
    ) external nonReentrant whenNotPaused {
        // 验证调用者是池管理员或合约所有者
        require(
            ILendingPool(_pool).isPoolAdmin(msg.sender) || owner() == msg.sender,
            "Only pool admin or contract owner can cancel"
        );
        
        // 计算订单哈希
        bytes32 orderHash = createOffchainOrderHash(
            _pool,
            _lendToken,
            _lendAmount,
            _collateralToken,
            _collateralAmount,
            _interestRate,
            _duration,
            _expiry,
            _nonce
        );
        
        // 确保订单未被处理
        require(!processedOffchainOrder[orderHash], "Order already processed");
        
        // 确保订单状态为PENDING或未初始化
        require(offchainOrderStatus[orderHash] == OrderStatus.PENDING || 
                offchainOrderStatus[orderHash] == OrderStatus(0), "Order is not pending");
        
        // 标记订单为已处理并取消
        processedOffchainOrder[orderHash] = true;
        offchainOrderStatus[orderHash] = OrderStatus.CANCELLED;
        
        // 记录出借池，以便将来可以查询
        offchainOrderPools[orderHash] = _pool;
        
        emit OffchainOrderStatusChanged(orderHash, OrderStatus.CANCELLED);
    }

    // 计算利息
    function calculateInterest(
        uint256 _lendAmount,
        uint256 _interestRate,
        uint256 _startTime,
        uint256 _duration
    ) public view returns (uint256) {
        // 如果已经超过借款期限，返回全部利息
        if (block.timestamp >= _startTime + _duration) {
            return (_lendAmount * _interestRate) / 10000;
        }

        // 计算未到期时间比例
        uint256 remainingTime = _startTime + _duration - block.timestamp;
        uint256 totalDuration = _duration;

        // 提前还款时，收取一半未到期利息
        // 使用更高精度的计算方式，避免精度损失
        uint256 fullInterest = (_lendAmount * _interestRate) / 10000;
        
        // 先乘以分子，再除以分母，避免中间结果截断
        uint256 elapsedInterest = (fullInterest * (totalDuration - remainingTime) * 10000) / (totalDuration * 10000);
        
        // 未到期部分的利息（50%）
        uint256 remainingInterest = (fullInterest - elapsedInterest) / 2;
        
        // 总利息 = 已到期利息 + 未到期利息的50%
        return elapsedInterest + remainingInterest;
    }

    // 获取链上订单状态
    function getOnchainOrderStatus(uint256 _orderId) external view returns (OrderStatus) {
        return onchainOrderStatus[_orderId];
    }
    
    // 获取链下订单状态
    function getOffchainOrderStatus(bytes32 _orderHash) external view returns (OrderStatus) {
        return offchainOrderStatus[_orderHash];
    }
    
    // 获取链下订单借款人
    function getOffchainOrderBorrower(bytes32 _orderHash) external view returns (address) {
        return offchainOrderBorrowers[_orderHash];
    }
    
    // 获取链下订单出借池
    function getOffchainOrderPool(bytes32 _orderHash) external view returns (address) {
        return offchainOrderPools[_orderHash];
    }
    
    // 检查订单是否来自池
    function isPoolOrder(bytes32 _orderHash) external view returns (bool) {
        return offchainOrderPools[_orderHash] != address(0);
    }
} 