// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/AggregatorV3Interface.sol";
import "./interfaces/IChecker.sol";

// LP Token 合约实现
contract LPToken is ERC20 {
    address public poolAddress;
    address public underlyingToken;
    
    constructor(
        address _poolAddress,
        address _underlyingToken,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        poolAddress = _poolAddress;
        underlyingToken = _underlyingToken;
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == poolAddress, "Only pool can mint");
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        require(msg.sender == poolAddress, "Only pool can burn");
        _burn(from, amount);
    }
}

/**
 * @title FixedRateLendingPool
 * @dev 固定利率借贷池，实现IChecker接口，可与UnifiedMatchingEngine集成
 * 增加了ERC20 LP Token功能，用户存款后会获得代表其份额的LP Token
 */
contract FixedRateLendingPool is Ownable, ReentrancyGuard, IChecker {
    using SafeERC20 for IERC20;

    // LP Token 合约
    mapping(address => address) public lpTokens;
    
    // 支持的代币
    mapping(address => bool) public supportedTokens;
    
    // 代币价格预言机
    mapping(address => address) public tokenPriceFeeds;
    
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
    
    // 授权的匹配引擎合约地址
    address public matchingEngineAddress;
    
    // 事件
    event TokenAdded(address indexed token, address indexed priceFeed, address indexed lpToken);
    event TokenRemoved(address indexed token);
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);
    event Deposited(address indexed token, address indexed depositor, uint256 amount);
    event Withdrawn(address indexed token, address indexed withdrawer, uint256 amount);
    event PoolParamsUpdated(
        uint256 minInterestRate,
        uint256 maxLoanDuration,
        uint256 minCollateralRatio
    );
    event MatchingEngineAddressUpdated(address indexed newMatchingEngine);

    // 修饰符：只允许匹配引擎合约调用
    modifier onlyMatchingEngine() {
        require(msg.sender == matchingEngineAddress, "Only matching engine can call");
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
        matchingEngineAddress = msg.sender;
    }
    
    /**
     * @dev 设置匹配引擎合约地址
     * @param _matchingEngineAddress 匹配引擎合约地址
     */
    function setMatchingEngineAddress(address _matchingEngineAddress) external onlyOwner {
        require(_matchingEngineAddress != address(0), "Invalid matching engine address");
        matchingEngineAddress = _matchingEngineAddress;
        emit MatchingEngineAddressUpdated(_matchingEngineAddress);
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
        
        // 创建对应的 LP Token
        string memory tokenSymbol = IERC20Metadata(_token).symbol();
        string memory lpTokenName = string(abi.encodePacked("FixRate LP ", tokenSymbol));
        string memory lpTokenSymbol = string(abi.encodePacked("frLP-", tokenSymbol));
        
        LPToken lpToken = new LPToken(address(this), _token, lpTokenName, lpTokenSymbol);
        lpTokens[_token] = address(lpToken);
        
        emit TokenAdded(_token, _priceFeed, address(lpToken));
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
        require(msg.sender != address(this), "Cannot deposit for contract");
        
        // 获取对应的 LP Token
        address lpTokenAddress = lpTokens[_token];
        require(lpTokenAddress != address(0), "LP Token not created");
        LPToken lpToken = LPToken(lpTokenAddress);
        
        // 转移代币到池中
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // 铸造 LP Token 给存款人
        lpToken.mint(msg.sender, _amount);
        
        emit Deposited(_token, msg.sender, _amount);
    }

    /**
     * @dev 从池中提款
     * @param _token 代币地址
     * @param _amount 提款金额
     */
    function withdraw(address _token, uint256 _amount) external nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");
        
        // 获取对应的 LP Token
        address lpTokenAddress = lpTokens[_token];
        require(lpTokenAddress != address(0), "LP Token not created");
        LPToken lpToken = LPToken(lpTokenAddress);
        
        // 确保不会销毁超过用户持有的 LP Token
        uint256 userLpBalance = lpToken.balanceOf(msg.sender);
        if (_amount > userLpBalance) {
            _amount = userLpBalance;
        }
        
        // 销毁用户的 LP Token
        lpToken.burn(msg.sender, _amount);
        
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
        startedAt;
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
     * @param borrower 借款人地址（未使用）
     * @return 订单是否可行
     */
    function checkOrder(
        address lendToken,
        uint256 lendAmount,
        address collateralToken,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 duration,
        address borrower
    ) public view returns (bool) {
        borrower;
        // 检查代币是否支持
        if (!supportedTokens[lendToken] || !supportedTokens[collateralToken]) {
            return false;
        }

        address lpTokenAddress = lpTokens[lendToken];
        require(lpTokenAddress != address(0), "LP Token not created");
        LPToken lpToken = LPToken(lpTokenAddress);
        
        uint256 totalSupply = lpToken.totalSupply();

        // 检查池中是否有足够的资金
        uint256 availableAmount = totalSupply - totalBorrowed[lendToken];
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
     * @dev 获取池中可用余额
     * @param _token 代币地址
     * @return 可用余额
     */
    function getAvailableBalance(address _token) external view returns (uint256) {
        address lpTokenAddress = lpTokens[_token];
        require(lpTokenAddress != address(0), "LP Token not created");
        LPToken lpToken = LPToken(lpTokenAddress);
        return lpToken.totalSupply() - totalBorrowed[_token];
    }

    /**
     * @dev 检查订单是否活跃
     * @param _orderHash 订单哈希
     * @return 是否活跃
     */
    function isOrderActive(bytes32 _orderHash) external view returns (bool) {
        return activeOrders[_orderHash];
    }
    
    /**
     * @dev 获取用户的 LP Token 余额
     * @param _token 代币地址
     * @param _user 用户地址
     * @return 用户 LP Token 余额
     */
    function getUserLpBalance(address _token, address _user) external view returns (uint256) {
        address lpTokenAddress = lpTokens[_token];
        if (lpTokenAddress == address(0)) {
            return 0;
        }
        return LPToken(lpTokenAddress).balanceOf(_user);
    }
    
    /**
     * @dev 验证出借人订单有效性并转移代币到撮合引擎
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyLenderOrder(VerificationParams calldata params) external onlyMatchingEngine returns (bool) {
        // 直接调用checkOrder函数验证订单
        bool isValid;
        try this.checkOrder(
            params.lendToken,
            params.lendAmount,
            params.collateralToken,
            params.collateralAmount,
            params.interestRate,
            params.duration,
            params.borrower
        ) returns (bool result) {
            isValid = result;
        } catch {
            isValid = false;
        }
        
        if (isValid) {
            // 允许撮合引擎转移代币
            IERC20(params.lendToken).approve(msg.sender, params.lendAmount);
        }
        
        return isValid;
    }

    /**
     * @dev 验证借款人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyBorrowerOrder(VerificationParams calldata params) external view onlyMatchingEngine returns (bool) {
        // 对于池化资金，借款人订单总是无效的（池化资金只能作为出借方）
        params;
        return false;
    }

    /**
     * @dev 获取Checker信息
     * @return name Checker名称
     * @return version Checker版本
     */
    function getCheckerInfo() external pure returns (string memory name, string memory version) {
        return ("FixedRateLendingPool", "1.0.0");
    }
}