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

    // 贷款订单类型哈希
    bytes32 public constant LENDER_ORDER_TYPEHASH = keccak256(
        "LenderOrder(address checker,address lender,address lendToken,uint256 lendAmount,address collateralToken,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 expiry,uint256 nonce)"
    );

    // 借款订单类型哈希
    bytes32 public constant BORROWER_ORDER_TYPEHASH = keccak256(
        "BorrowerOrder(address checker,address borrower,address lendToken,uint256 lendAmount,address collateralToken,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 expiry,uint256 nonce)"
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
        
        // 如果签名为空，返回false
        if (params.signature.length == 0) {
            return false;
        }
        
        // 验证出借人签名
        bytes32 orderHash = _hashTypedDataV4(keccak256(abi.encode(
            LENDER_ORDER_TYPEHASH,
            params.checker,
            params.lender,
            params.lendToken,
            params.lendAmount,
            params.collateralToken,
            params.collateralAmount,
            params.interestRate,
            params.duration,
            params.expiry,
            params.nonce
        )));

        // 使用try-catch处理可能的ECDSA错误
        try this.recoverSignature(orderHash, params.signature) returns (address signer) {
            return signer == params.lender && signer != address(0);
        } catch {
            return false;
        }
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
        
        // 如果签名为空，返回false
        if (params.signature.length == 0) {
            return false;
        }
        
        // 验证借款人签名
        bytes32 orderHash = _hashTypedDataV4(keccak256(abi.encode(
            BORROWER_ORDER_TYPEHASH,
            params.checker,
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

        // 使用try-catch处理可能的ECDSA错误
        try this.recoverSignature(orderHash, params.signature) returns (address signer) {
            return signer == params.borrower && signer != address(0);
        } catch {
            return false;
        }
    }

    /**
     * @dev 外部函数用于恢复签名（用于try-catch）
     * @param hash 哈希值
     * @param signature 签名
     * @return 签名者地址
     */
    function recoverSignature(bytes32 hash, bytes calldata signature) external pure returns (address) {
        return hash.recover(signature);
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