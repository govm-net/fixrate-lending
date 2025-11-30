// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./interfaces/IChecker.sol";

/**
 * @title PersonalChecker
 * @dev 个人交易验证器，用于验证P2P借贷订单
 */
contract PersonalChecker is IChecker, EIP712 {
    using ECDSA for bytes32;

    // 借贷订单类型哈希
    bytes32 public constant LOAN_ORDER_TYPEHASH = keccak256(
        "LoanOrder(address checker,address lender,address borrower,address lendToken,uint256 lendAmount,address collateralToken,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 expiry,uint256 nonce)"
    );

    constructor() EIP712("PersonalChecker", "1") {}

    /**
     * @dev 验证出借人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyLenderOrder(VerificationParams calldata params) external view override returns (bool) {
        // 检查订单是否过期
        if (block.timestamp > params.expiry) {
            return false;
        }
        
        // 验证出借人签名
        bytes32 orderHash = _hashTypedDataV4(keccak256(abi.encode(
            LOAN_ORDER_TYPEHASH,
            params.checker,
            params.lender,
            params.borrower,
            params.lendToken,
            params.lendAmount,
            params.collateralToken,
            params.collateralAmount,
            params.interestRate,
            params.duration,
            params.expiry,
            params.nonce
        )));

        address signer = ECDSA.recover(orderHash, params.signature);
        return signer == params.lender;
    }

    /**
     * @dev 验证借款人订单有效性
     * @param params 验证参数
     * @return 是否有效
     */
    function verifyBorrowerOrder(VerificationParams calldata params) external view override returns (bool) {
        // 检查订单是否过期
        if (block.timestamp > params.expiry) {
            return false;
        }
        
        // 验证借款人签名
        bytes32 orderHash = _hashTypedDataV4(keccak256(abi.encode(
            LOAN_ORDER_TYPEHASH,
            params.checker,
            params.lender,
            params.borrower,
            params.lendToken,
            params.lendAmount,
            params.collateralToken,
            params.collateralAmount,
            params.interestRate,
            params.duration,
            params.expiry,
            params.nonce
        )));

        address signer = ECDSA.recover(orderHash, params.signature);
        return signer == params.borrower;
    }

    /**
     * @dev 获取Checker信息
     * @return name Checker名称
     * @return version Checker版本
     */
    function getCheckerInfo() external pure override returns (string memory name, string memory version) {
        return ("PersonalChecker", "1.0.0");
    }
}