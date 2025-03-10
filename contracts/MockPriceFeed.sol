// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/AggregatorV3Interface.sol";

/**
 * @title MockPriceFeed
 * @dev 用于测试的模拟 Chainlink 价格预言机
 */
contract MockPriceFeed is AggregatorV3Interface {
    int256 private _answer;
    uint8 private _decimals;
    string private _description;
    uint256 private _version;
    
    constructor() {
        _answer = 0;
        _decimals = 8; // Chainlink 默认使用 8 位小数
        _description = "Mock Price Feed";
        _version = 1;
    }
    
    function decimals() external view override returns (uint8) {
        return _decimals;
    }
    
    function description() external view override returns (string memory) {
        return _description;
    }
    
    function version() external view override returns (uint256) {
        return _version;
    }
    
    function getRoundData(uint80 _roundId) external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (_roundId, _answer, block.timestamp, block.timestamp, _roundId);
    }
    
    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _answer, block.timestamp, block.timestamp, 1);
    }
    
    // 设置价格
    function setLatestAnswer(int256 answer) external {
        _answer = answer;
    }
    
    // 设置小数位数
    function setDecimals(uint8 decimals_) external {
        _decimals = decimals_;
    }
    
    // 设置描述
    function setDescription(string calldata description_) external {
        _description = description_;
    }
    
    // 设置版本
    function setVersion(uint256 version_) external {
        _version = version_;
    }
} 