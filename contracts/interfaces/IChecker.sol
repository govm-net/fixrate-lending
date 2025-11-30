// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IChecker
 * @dev 通用Checker接口，用于验证借贷交易的有效性
 */
interface IChecker {
    // 验证参数结构体
    struct VerificationParams {
        address checker;         // Checker合约地址
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

    /**
     * @dev 验证出借人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyLenderOrder(VerificationParams calldata params) external returns (bool);

    /**
     * @dev 验证借款人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyBorrowerOrder(VerificationParams calldata params) external returns (bool);

    /**
     * @dev 获取Checker信息
     * @return name Checker名称
     * @return version Checker版本
     */
    function getCheckerInfo() external view returns (string memory name, string memory version);
}