// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/AggregatorV3Interface.sol";

/**
 * @title FixedRateLendingPool
 * @dev 固定利率借贷池，实现ILendingPool接口，可与P2PLendingMarketplace集成
 */
contract FixedRateLendingPool is Ownable, ReentrancyGuard, ILendingPool {
    using SafeERC20 for IERC20;

    // 支持的代币
    mapping(address => bool) public supportedTokens;
    
    // 代币价格预言机
    mapping(address => address) public tokenPriceFeeds;
    
    // 池中资金余额
    mapping(address => uint256) public poolBalance;
    
    // 池中总借出金额
    mapping(address => uint256) public totalBorrowed;
    
    // 池中活跃订单
    mapping(bytes32 => bool) public activeOrders;
    
    // 池参数
    uint256 public minInterestRate; // 最低接受利率（基点）
    uint256 public maxLoanDuration; // 最长借款期限（秒）
    uint256 public minCollateralRatio; // 最低抵押率（基点）
    
    // 价格有效期（1小时）
    uint256 public constant PRICE_VALIDITY_PERIOD = 1 hours;
    
    // 授权的市场合约地址
    address public marketplaceAddress;
    
    // 事件
    event TokenAdded(address indexed token, address indexed priceFeed);
    event TokenRemoved(address indexed token);
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);
    event Deposited(address indexed token, address indexed depositor, uint256 amount);
    event Withdrawn(address indexed token, address indexed withdrawer, uint256 amount);
    event LoanIssued(
        bytes32 indexed orderHash,
        address indexed borrower,
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration
    );
    event LoanRepaid(
        bytes32 indexed orderHash,
        address indexed borrower,
        address lendToken,
        uint256 repayAmount
    );
    event PoolParamsUpdated(
        uint256 minInterestRate,
        uint256 maxLoanDuration,
        uint256 minCollateralRatio
    );
    event MarketplaceAddressUpdated(address indexed newMarketplace);

    // 修饰符：只允许市场合约调用
    modifier onlyMarketplace() {
        require(msg.sender == marketplaceAddress, "Only marketplace can call");
        _;
    }

    /**
     * @dev 构造函数
     * @param _minInterestRate 最低接受利率（基点）
     * @param _maxLoanDuration 最长借款期限（秒）
     * @param _minCollateralRatio 最低抵押率（基点）
     */
    constructor(
        uint256 _minInterestRate,
        uint256 _maxLoanDuration,
        uint256 _minCollateralRatio
    ) Ownable(msg.sender) {
        minInterestRate = _minInterestRate;
        maxLoanDuration = _maxLoanDuration;
        minCollateralRatio = _minCollateralRatio;
        marketplaceAddress = msg.sender;
    }
    
    /**
     * @dev 设置市场合约地址
     * @param _marketplaceAddress 市场合约地址
     */
    function setMarketplaceAddress(address _marketplaceAddress) external onlyOwner {
        require(_marketplaceAddress != address(0), "Invalid marketplace address");
        marketplaceAddress = _marketplaceAddress;
        emit MarketplaceAddressUpdated(_marketplaceAddress);
    }

    /**
     * @dev 添加支持的代币和其价格预言机
     * @param _token 代币地址
     * @param _priceFeed 价格预言机地址
     */
    function addSupportedToken(address _token, address _priceFeed) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_priceFeed != address(0), "Invalid price feed address");
        
        supportedTokens[_token] = true;
        tokenPriceFeeds[_token] = _priceFeed;
        
        emit TokenAdded(_token, _priceFeed);
    }

    /**
     * @dev 移除支持的代币
     * @param _token 代币地址
     */
    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
        emit TokenRemoved(_token);
    }
    
    /**
     * @dev 更新代币价格预言机
     * @param _token 代币地址
     * @param _priceFeed 价格预言机地址
     */
    function updatePriceFeed(address _token, address _priceFeed) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_priceFeed != address(0), "Invalid price feed address");
        require(supportedTokens[_token], "Token not supported");
        
        tokenPriceFeeds[_token] = _priceFeed;
        
        emit PriceFeedUpdated(_token, _priceFeed);
    }

    /**
     * @dev 更新池参数
     * @param _minInterestRate 最低接受利率（基点）
     * @param _maxLoanDuration 最长借款期限（秒）
     * @param _minCollateralRatio 最低抵押率（基点）
     */
    function updatePoolParams(
        uint256 _minInterestRate,
        uint256 _maxLoanDuration,
        uint256 _minCollateralRatio
    ) external onlyOwner {
        minInterestRate = _minInterestRate;
        maxLoanDuration = _maxLoanDuration;
        minCollateralRatio = _minCollateralRatio;
        
        emit PoolParamsUpdated(_minInterestRate, _maxLoanDuration, _minCollateralRatio);
    }

    /**
     * @dev 向池中存款
     * @param _token 代币地址
     * @param _amount 存款金额
     */
    function deposit(address _token, uint256 _amount) external nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");
        
        // 转移代币到池中
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // 更新池余额
        poolBalance[_token] += _amount;
        
        emit Deposited(_token, msg.sender, _amount);
    }

    /**
     * @dev 从池中提款
     * @param _token 代币地址
     * @param _amount 提款金额
     */
    function withdraw(address _token, uint256 _amount) external onlyOwner nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");
        
        // 计算可提取金额（总余额 - 已借出）
        uint256 availableAmount = poolBalance[_token] - totalBorrowed[_token];
        require(_amount <= availableAmount, "Insufficient available balance");
        
        // 更新池余额
        poolBalance[_token] -= _amount;
        
        // 转移代币给提款人
        IERC20(_token).safeTransfer(msg.sender, _amount);
        
        emit Withdrawn(_token, msg.sender, _amount);
    }
    
    /**
     * @dev 获取代币价格（以USD为单位，8位小数）
     * @param _token 代币地址
     * @return 代币价格
     */
    function getTokenPrice(address _token) public view returns (uint256) {
        address priceFeed = tokenPriceFeeds[_token];
        require(priceFeed != address(0), "Price feed not found");
        
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.latestRoundData();
        
        require(price > 0, "Invalid price");
        require(updatedAt != 0, "Round not complete");
        require(answeredInRound >= roundId, "Stale price");
        require(block.timestamp - updatedAt <= PRICE_VALIDITY_PERIOD, "Stale price");
        
        return uint256(price);
    }
    
    /**
     * @dev 计算代币价值（以USD为单位）
     * @param _token 代币地址
     * @param _amount 代币数量
     * @return 代币价值
     */
    function calculateTokenValue(address _token, uint256 _amount) public view returns (uint256) {
        uint256 price = getTokenPrice(_token);
        // 获取价格预言机的小数位数
        // uint8 decimals = AggregatorV3Interface(tokenPriceFeeds[_token]).decimals();
        
        // 获取代币小数位数
        uint8 tokenDecimals = IERC20Metadata(_token).decimals();
        
        // 计算价值：价格 * 数量 / 10^(代币小数位数)
        // 价格已经是 10^decimals 精度
        return (price * _amount) / (10 ** tokenDecimals);
    }

    /**
     * @dev 检查订单是否可行
     * @param lendToken 借出的代币地址
     * @param lendAmount 借出金额
     * @param collateralToken 抵押的代币地址
     * @param collateralAmount 抵押金额
     * @param interestRate 利率（基点）
     * @param duration 借款期限（秒）
     * @param _borrower 借款人地址（未使用）
     * @return 订单是否可行
     */
    function checkOrder(
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        address _borrower
    ) external view override returns (bool) {
        _borrower;
        // 检查代币是否支持
        if (!supportedTokens[lendToken] || !supportedTokens[collateralToken]) {
            return false;
        }
        
        // 检查池中是否有足够的资金
        uint256 availableAmount = poolBalance[lendToken] - totalBorrowed[lendToken];
        if (lendAmount > availableAmount) {
            return false;
        }
        
        // 检查利率是否满足最低要求
        if (interestRate < minInterestRate) {
            return false;
        }
        
        // 检查借款期限是否在允许范围内
        if (duration > maxLoanDuration) {
            return false;
        }
        
        // 使用 Chainlink 预言机获取价格，计算抵押率
        try this.calculateTokenValue(lendToken, lendAmount) returns (uint256 lendValue) {
            try this.calculateTokenValue(collateralToken, collateralAmount) returns (uint256 collateralValue) {
                // 确保抵押品价值大于等于借款价值的2倍
                // 即抵押率 >= 200%
                if (collateralValue < lendValue * 2) {
                    return false;
                }
            } catch {
                return false;
            }
        } catch {
            return false;
        }
        
        return true;
    }

    /**
     * @dev 从池中借出资金
     * @param lendToken 借出的代币地址
     * @param lendAmount 借出金额
     * @param collateralToken 抵押的代币地址
     * @param collateralAmount 抵押金额
     * @param interestRate 利率（基点）
     * @param duration 借款期限（秒）
     * @param borrower 借款人地址
     * @param orderHash 订单哈希
     * @return 是否成功
     */
    function lendFromPool(
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        address borrower,
        bytes32 orderHash
    ) external override nonReentrant onlyMarketplace returns (bool) {
        // 检查订单是否可行
        require(
            this.checkOrder(
                lendToken,
                lendAmount,
                collateralToken,
                collateralAmount,
                interestRate,
                duration,
                borrower
            ),
            "Order not acceptable"
        );
        
        // 标记订单为活跃
        activeOrders[orderHash] = true;
        
        // 更新借出金额
        totalBorrowed[lendToken] += lendAmount;
        
        // 转移代币给借款人
        IERC20(lendToken).safeTransfer(borrower, lendAmount);
        
        emit LoanIssued(
            orderHash,
            borrower,
            lendToken,
            lendAmount,
            collateralToken,
            collateralAmount,
            interestRate,
            duration
        );
        
        return true;
    }

    /**
     * @dev 向池中还款
     * @param lendToken 借出的代币地址
     * @param repayAmount 还款金额（本金+利息）
     * @param orderHash 订单哈希
     * @param borrower 借款人地址
     * @return 是否成功
     */
    function repayToPool(
        address lendToken,
        uint256 repayAmount,
        bytes32 orderHash,
        address borrower
    ) external override nonReentrant onlyMarketplace returns (bool) {
        // 验证订单哈希是否存在且活跃
        require(activeOrders[orderHash], "Order not found or not active");
        
        // 验证代币是否支持
        require(supportedTokens[lendToken], "Token not supported");
        
        // 不再需要从借款人转移代币，假设代币已经由市场合约转移
        // 更新池余额（本金已经在池余额中，只需减少借出金额）
        // 注意：这里简化处理，实际应该记录每个订单的本金
        if (repayAmount > totalBorrowed[lendToken]) {
            totalBorrowed[lendToken] = 0;
        } else {
            totalBorrowed[lendToken] -= repayAmount;
        }
        
        // 标记订单为非活跃
        activeOrders[orderHash] = false;
        
        emit LoanRepaid(orderHash, borrower, lendToken, repayAmount);
        
        return true;
    }

    /**
     * @dev 获取池中可用余额
     * @param _token 代币地址
     * @return 可用余额
     */
    function getAvailableBalance(address _token) external view returns (uint256) {
        return poolBalance[_token] - totalBorrowed[_token];
    }

    /**
     * @dev 检查订单是否活跃
     * @param _orderHash 订单哈希
     * @return 是否活跃
     */
    function isOrderActive(bytes32 _orderHash) external view returns (bool) {
        return activeOrders[_orderHash];
    }
} 