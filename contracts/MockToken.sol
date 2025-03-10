// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockToken
 * @dev 用于测试的模拟ERC20代币
 */
contract MockToken is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param decimals_ 代币小数位数
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    /**
     * @dev 返回代币小数位数
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 铸造代币
     * @param to 接收者地址
     * @param amount 铸造金额
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币
     * @param from 销毁地址
     * @param amount 销毁金额
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
} 