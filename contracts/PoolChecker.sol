// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/AggregatorV3Interface.sol";
import "./interfaces/IChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title PoolChecker
 * @dev 池化资金验证器，用于验证池化资金的订单
 */
contract PoolChecker is IChecker {
    address public poolAddress;
    
    constructor(address _poolAddress) {
        poolAddress = _poolAddress;
    }
    
    /**
     * @dev 验证出借人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyLenderOrder(IChecker.VerificationParams calldata params) external view returns (bool) {
        // 验证签名
        // 注意：这里我们不需要验证签名，因为我们是在合约内部调用
        // 在实际应用中，如果需要验证外部调用者的签名，应该添加相应的验证逻辑
        
        // 直接调用checkOrder函数验证订单
        try ILendingPool(poolAddress).checkOrder(
            params.lendToken,
            params.lendAmount,
            params.collateralToken,
            params.collateralAmount,
            params.interestRate,
            params.duration,
            params.borrower
        ) returns (bool isValid) {
            return isValid;
        } catch {
            return false;
        }
    }

    /**
     * @dev 验证借款人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyBorrowerOrder(IChecker.VerificationParams calldata params) external view returns (bool) {
        // 对于池化资金，借款人订单总是无效的（池化资金只能作为出借方）
        return false;
    }

    /**
     * @dev 获取Checker信息
     * @return name Checker名称
     * @return version Checker版本
     */
    function getCheckerInfo() external view returns (string memory name, string memory version) {
        return ("PoolChecker", "1.0.0");
    }
}