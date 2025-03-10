// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ILendingPool
 * @dev 借贷池接口，用于验证链下订单并提供资金
 */
interface ILendingPool {
    /**
     * @dev 检查订单是否可行
     * @param lendToken 借出的代币地址
     * @param lendAmount 借出金额
     * @param collateralToken 抵押的代币地址
     * @param collateralAmount 抵押金额
     * @param interestRate 利率（基点）
     * @param duration 借款期限（秒）
     * @param borrower 借款人地址
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
    ) external view returns (bool);
    
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
    ) external returns (bool);
    
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
    ) external returns (bool);
} 