// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IChecker.sol";

/**
 * @title UnifiedMatchingEngine
 * @dev 统一撮合引擎，支持个人对个人和池化资金借贷
 */
contract UnifiedMatchingEngine is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // 订单状态枚举
    enum OrderStatus {
        PENDING,     // 待撮合
        ACTIVE,      // 活跃中
        REPAID,      // 已还款
        LIQUIDATED,  // 已清算
        CANCELLED    // 已取消
    }

    // 交易订单结构
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

    // 订单状态映射
    mapping(bytes32 => OrderStatus) public orderStatus;
    
    // 已处理的订单映射，防止重放攻击
    mapping(bytes32 => bool) public processedOrders;
    
    // 用户nonce映射，防止重放攻击
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    
    // 授权的Checker合约映射
    mapping(address => bool) public authorizedCheckers;

    // 事件
    event BorrowRequestInitiated(
        bytes32 indexed orderHash,
        address indexed borrower,
        address checker,
        address lender,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 expiry
    );
    
    event LendRequestInitiated(
        bytes32 indexed orderHash,
        address indexed lender,
        address checker,
        address borrower,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        uint256 expiry
    );
    
    event BorrowExecuted(
        bytes32 indexed orderHash,
        address indexed borrower,
        address lender,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount
    );
    
    event LendExecuted(
        bytes32 indexed orderHash,
        address indexed lender,
        address borrower,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount
    );
    
    event OrderCancelled(
        bytes32 indexed orderHash,
        address indexed canceller
    );
    
    event LoanRepaid(
        bytes32 indexed orderHash,
        address indexed borrower,
        address lender,
        address lendToken,
        uint256 repayAmount
    );
    
    event LoanLiquidated(
        bytes32 indexed orderHash,
        address indexed borrower,
        address lender,
        address collateralToken,
        uint256 collateralAmount
    );
    
    event CheckerAuthorized(
        address indexed checker
    );
    
    event CheckerDeauthorized(
        address indexed checker
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 授权Checker合约
     * @param _checker Checker合约地址
     */
    function authorizeChecker(address _checker) external onlyOwner {
        require(_checker != address(0), "Invalid checker address");
        authorizedCheckers[_checker] = true;
        emit CheckerAuthorized(_checker);
    }
    
    /**
     * @dev 取消授权Checker合约
     * @param _checker Checker合约地址
     */
    function deauthorizeChecker(address _checker) external onlyOwner {
        authorizedCheckers[_checker] = false;
        emit CheckerDeauthorized(_checker);
    }

    /**
     * @dev 发起借款请求
     * @param order 借款订单
     */
    function initiateBorrowRequest(LoanOrder calldata order) external whenNotPaused {
        // 验证订单未过期
        require(block.timestamp <= order.expiry, "Order has expired");
        
        // 验证Checker合约已被授权
        require(authorizedCheckers[order.checker], "Checker not authorized");
        
        // 验证nonce未被使用
        require(!usedNonces[msg.sender][order.nonce], "Nonce already used");
        
        // 标记nonce为已使用
        usedNonces[msg.sender][order.nonce] = true;
        
        // 计算订单哈希
        bytes32 orderHash = keccak256(abi.encode(order));
        
        // 设置订单状态
        orderStatus[orderHash] = OrderStatus.PENDING;
        
        emit BorrowRequestInitiated(
            orderHash,
            msg.sender,
            order.checker,
            order.lender,
            order.lendToken,
            order.lendAmount,
            order.collateralToken,
            order.collateralAmount,
            order.interestRate,
            order.duration,
            order.expiry
        );
    }

    /**
     * @dev 发起出借请求
     * @param order 出借订单
     */
    function initiateLendRequest(LoanOrder calldata order) external whenNotPaused {
        // 验证订单未过期
        require(block.timestamp <= order.expiry, "Order has expired");
        
        // 验证Checker合约已被授权
        require(authorizedCheckers[order.checker], "Checker not authorized");
        
        // 验证nonce未被使用
        require(!usedNonces[msg.sender][order.nonce], "Nonce already used");
        
        // 标记nonce为已使用
        usedNonces[msg.sender][order.nonce] = true;
        
        // 计算订单哈希
        bytes32 orderHash = keccak256(abi.encode(order));
        
        // 设置订单状态
        orderStatus[orderHash] = OrderStatus.PENDING;
        
        emit LendRequestInitiated(
            orderHash,
            msg.sender,
            order.checker,
            order.borrower,
            order.lendToken,
            order.lendAmount,
            order.collateralToken,
            order.collateralAmount,
            order.interestRate,
            order.duration,
            order.expiry
        );
    }

    /**
     * @dev 执行借款交易
     * @param order 借款订单
     */
    function executeBorrow(LoanOrder calldata order) external nonReentrant whenNotPaused {
        // 验证订单未过期
        require(block.timestamp <= order.expiry, "Order has expired");
        
        // 验证Checker合约已被授权
        require(authorizedCheckers[order.checker], "Checker not authorized");
        
        // 计算订单哈希
        bytes32 orderHash = keccak256(abi.encode(order));
        
        // 验证订单状态
        require(orderStatus[orderHash] == OrderStatus.PENDING, "Order not pending");
        
        // 验证交易发送者为出借人
        require(msg.sender == order.lender, "Only lender can execute borrow");
        
        // 验证订单未被处理过
        require(!processedOrders[orderHash], "Order already processed");
        
        // 标记订单为已处理
        processedOrders[orderHash] = true;
        
        // 调用Checker验证借款人订单
        IChecker.VerificationParams memory params = IChecker.VerificationParams({
            checker: order.checker,
            lender: order.lender,
            borrower: order.borrower,
            lendToken: order.lendToken,
            lendAmount: order.lendAmount,
            collateralToken: order.collateralToken,
            collateralAmount: order.collateralAmount,
            interestRate: order.interestRate,
            duration: order.duration,
            expiry: order.expiry,
            nonce: order.nonce,
            signature: order.signature
        });
        
        require(IChecker(order.checker).verifyBorrowerOrder(params), "Borrower order verification failed");
        
        // 转移抵押代币到合约
        IERC20(order.collateralToken).safeTransferFrom(order.borrower, address(this), order.collateralAmount);
        
        // 转移借出代币给出借人
        IERC20(order.lendToken).safeTransfer(order.lender, order.lendAmount);
        
        // 更新订单状态
        orderStatus[orderHash] = OrderStatus.ACTIVE;
        
        emit BorrowExecuted(
            orderHash,
            order.borrower,
            order.lender,
            order.lendToken,
            order.lendAmount,
            order.collateralToken,
            order.collateralAmount
        );
    }

    /**
     * @dev 执行出借交易
     * @param order 出借订单
     */
    function executeLend(LoanOrder calldata order) external nonReentrant whenNotPaused {
        // 验证订单未过期
        require(block.timestamp <= order.expiry, "Order has expired");
        
        // 验证Checker合约已被授权
        require(authorizedCheckers[order.checker], "Checker not authorized");
        
        // 计算订单哈希
        bytes32 orderHash = keccak256(abi.encode(order));
        
        // 验证订单状态
        require(orderStatus[orderHash] == OrderStatus.PENDING, "Order not pending");
        
        // 验证交易发送者为借款人
        require(msg.sender == order.borrower, "Only borrower can execute lend");
        
        // 验证订单未被处理过
        require(!processedOrders[orderHash], "Order already processed");
        
        // 标记订单为已处理
        processedOrders[orderHash] = true;
        
        // 调用Checker验证出借人订单
        IChecker.VerificationParams memory params = IChecker.VerificationParams({
            checker: order.checker,
            lender: order.lender,
            borrower: order.borrower,
            lendToken: order.lendToken,
            lendAmount: order.lendAmount,
            collateralToken: order.collateralToken,
            collateralAmount: order.collateralAmount,
            interestRate: order.interestRate,
            duration: order.duration,
            expiry: order.expiry,
            nonce: order.nonce,
            signature: order.signature
        });
        
        require(IChecker(order.checker).verifyLenderOrder(params), "Lender order verification failed");
        
        // 转移抵押代币到合约
        IERC20(order.collateralToken).safeTransferFrom(msg.sender, address(this), order.collateralAmount);
        
        // 转移借出代币给借款人
        IERC20(order.lendToken).safeTransfer(order.borrower, order.lendAmount);
        
        // 更新订单状态
        orderStatus[orderHash] = OrderStatus.ACTIVE;
        
        emit LendExecuted(
            orderHash,
            order.lender,
            order.borrower,
            order.lendToken,
            order.lendAmount,
            order.collateralToken,
            order.collateralAmount
        );
    }

    /**
     * @dev 取消订单
     * @param nonce 订单nonce
     */
    function cancelOrder(uint256 nonce) external whenNotPaused {
        // 标记nonce为已使用
        usedNonces[msg.sender][nonce] = true;
        
        // 计算订单哈希（这里简化处理，实际应用中需要更复杂的逻辑）
        bytes32 orderHash = keccak256(abi.encode(msg.sender, nonce));
        
        emit OrderCancelled(orderHash, msg.sender);
    }

    /**
     * @dev 还款
     * @param order 还款订单
     */
    function repayLoan(LoanOrder calldata order) external nonReentrant whenNotPaused {
        // 计算订单哈希
        bytes32 orderHash = keccak256(abi.encode(order));
        
        // 验证订单状态
        require(orderStatus[orderHash] == OrderStatus.ACTIVE, "Order not active");
        
        // 验证交易发送者为借款人
        require(msg.sender == order.borrower, "Only borrower can repay");
        
        // 计算应还金额（本金 + 利息）
        uint256 interest = (order.lendAmount * order.interestRate) / 10000;
        uint256 totalRepayment = order.lendAmount + interest;
        
        // 转移还款代币给出借人
        IERC20(order.lendToken).safeTransferFrom(order.borrower, order.lender, totalRepayment);
        
        // 返还抵押品给借款人
        IERC20(order.collateralToken).safeTransfer(order.borrower, order.collateralAmount);
        
        // 更新订单状态
        orderStatus[orderHash] = OrderStatus.REPAID;
        
        emit LoanRepaid(
            orderHash,
            order.borrower,
            order.lender,
            order.lendToken,
            totalRepayment
        );
    }

    /**
     * @dev 清算逾期贷款
     * @param order 清算订单
     */
    function liquidateLoan(LoanOrder calldata order) external nonReentrant whenNotPaused {
        // 计算订单哈希
        bytes32 orderHash = keccak256(abi.encode(order));
        
        // 验证订单状态
        require(orderStatus[orderHash] == OrderStatus.ACTIVE, "Order not active");
        
        // 验证是否逾期
        // 这里简化处理，实际应用中需要根据具体的借款开始时间和期限来判断
        require(block.timestamp > order.expiry, "Loan not yet overdue");
        
        // 将抵押品转给出借人
        IERC20(order.collateralToken).safeTransfer(order.lender, order.collateralAmount);
        
        // 更新订单状态
        orderStatus[orderHash] = OrderStatus.LIQUIDATED;
        
        emit LoanLiquidated(
            orderHash,
            order.borrower,
            order.lender,
            order.collateralToken,
            order.collateralAmount
        );
    }

    /**
     * @dev 获取订单状态
     * @param orderHash 订单哈希
     * @return 订单状态
     */
    function getOrderStatus(bytes32 orderHash) external view returns (OrderStatus) {
        return orderStatus[orderHash];
    }
}