// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LiquidityMining
 * @dev 流动性挖矿合约，允许用户质押代币以获得奖励
 */
contract LiquidityMining is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // 用户质押信息
    struct UserInfo {
        uint256 amount;         // 质押数量
        uint256 rewardDebt;     // 奖励债务
        uint256 pendingRewards; // 待领取奖励
    }

    // 池信息
    struct PoolInfo {
        IERC20 lpToken;         // 质押代币
        uint256 allocPoint;     // 分配点数
        uint256 lastRewardTime; // 上次更新奖励的时间
        uint256 accRewardPerShare; // 每份额累计奖励
    }

    // 奖励代币
    IERC20 public rewardToken;
    
    // 奖励发放速率（每秒发放的奖励代币数量）
    uint256 public rewardPerSecond;
    
    // 总分配点数
    uint256 public totalAllocPoint;
    
    // 开始发放奖励的时间
    uint256 public startTime;
    
    // 结束发放奖励的时间
    uint256 public endTime;
    
    // 池信息
    PoolInfo[] public poolInfo;
    
    // 用户信息映射 (pid => userAddress => UserInfo)
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    // 暂停质押标志
    bool public stakePaused;
    
    // 暂停提取标志
    bool public withdrawPaused;
    
    // 暂停领取奖励标志
    bool public claimPaused;

    // 事件
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event PoolSet(uint256 indexed pid, uint256 allocPoint);
    event RewardPerSecondUpdated(uint256 oldRate, uint256 newRate);
    event PauseStakeChanged(bool paused);
    event PauseWithdrawChanged(bool paused);
    event PauseClaimChanged(bool paused);

    /**
     * @dev 构造函数
     * @param _rewardToken 奖励代币地址
     * @param _rewardPerSecond 每秒奖励数量
     * @param _startTime 开始时间
     * @param _endTime 结束时间
     */
    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _startTime,
        uint256 _endTime
    ) Ownable(msg.sender) {
        require(address(_rewardToken) != address(0), "Reward token cannot be zero address");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        rewardToken = _rewardToken;
        rewardPerSecond = _rewardPerSecond;
        startTime = _startTime;
        endTime = _endTime;
        totalAllocPoint = 0;
        stakePaused = false;
        withdrawPaused = false;
        claimPaused = false;
    }

    /**
     * @dev 获取池数量
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @dev 添加新的质押池
     * @param _lpToken 质押代币地址
     * @param _allocPoint 分配点数
     */
    function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner {
        require(address(_lpToken) != address(0), "LP token cannot be zero address");
        
        // 更新所有池的奖励
        massUpdatePools();
        
        // 添加新池
        uint256 lastRewardTime = block.timestamp > startTime ? block.timestamp : startTime;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accRewardPerShare: 0
        }));
        
        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }

    /**
     * @dev 设置池的分配点数
     * @param _pid 池ID
     * @param _allocPoint 新的分配点数
     */
    function setPool(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        require(_pid < poolInfo.length, "Pool does not exist");
        
        // 更新所有池的奖励
        massUpdatePools();
        
        // 更新总分配点数
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        
        // 更新池的分配点数
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit PoolSet(_pid, _allocPoint);
    }

    /**
     * @dev 更新奖励发放速率
     * @param _rewardPerSecond 新的奖励发放速率
     */
    function setRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        require(_rewardPerSecond > 0, "Reward per second must be greater than 0");
        
        // 更新所有池的奖励
        massUpdatePools();
        
        emit RewardPerSecondUpdated(rewardPerSecond, _rewardPerSecond);
        rewardPerSecond = _rewardPerSecond;
    }

    /**
     * @dev 批量更新池的奖励
     */
    function massUpdatePools() public whenNotPaused {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @dev 更新指定池的奖励
     * @param _pid 池ID
     */
    function updatePool(uint256 _pid) public whenNotPaused {
        require(_pid < poolInfo.length, "Pool does not exist");
        
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        // 计算已产生的奖励
        uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
        if (block.timestamp > endTime) {
            timeElapsed = timeElapsed - (block.timestamp - endTime);
        }
        if (block.timestamp < startTime) {
            timeElapsed = 0;
        }
        
        uint256 reward = (timeElapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
        if (reward > 0) {
            pool.accRewardPerShare = pool.accRewardPerShare + (reward * 1e12) / lpSupply;
        }
        pool.lastRewardTime = block.timestamp;
    }

    /**
     * @dev 获取用户在指定池中的待领取奖励
     * @param _pid 池ID
     * @param _user 用户地址
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        require(_pid < poolInfo.length, "Pool does not exist");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (block.timestamp > pool.lastRewardTime && lpSupply > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            if (block.timestamp > endTime) {
                timeElapsed = timeElapsed - (block.timestamp - endTime);
            }
            if (block.timestamp < startTime) {
                timeElapsed = 0;
            }
            
            uint256 reward = (timeElapsed * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare = accRewardPerShare + (reward * 1e12) / lpSupply;
        }
        
        return ((user.amount * accRewardPerShare) / 1e12) - user.rewardDebt + user.pendingRewards;
    }

    /**
     * @dev 质押代币
     * @param _pid 池ID
     * @param _amount 质押数量
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        require(!stakePaused, "Staking is paused");
        require(_pid < poolInfo.length, "Pool does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        // 更新池的奖励
        updatePool(_pid);
        
        // 计算用户待领取奖励
        if (user.amount > 0) {
            uint256 pending = ((user.amount * pool.accRewardPerShare) / 1e12) - user.rewardDebt;
            if (pending > 0) {
                user.pendingRewards = user.pendingRewards + pending;
            }
        }
        
        // 转移代币到合约
        pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        
        // 更新用户信息
        user.amount = user.amount + _amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev 提取代币
     * @param _pid 池ID
     * @param _amount 提取数量
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        require(!withdrawPaused, "Withdraw is paused");
        require(_pid < poolInfo.length, "Pool does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        
        PoolInfo storage pool = poolInfo[_pid];
        
        // 更新池的奖励
        updatePool(_pid);
        
        // 计算用户待领取奖励
        uint256 pending = ((user.amount * pool.accRewardPerShare) / 1e12) - user.rewardDebt;
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards + pending;
        }
        
        // 更新用户信息
        user.amount = user.amount - _amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
        
        // 转移代币给用户
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev 领取奖励
     * @param _pid 池ID
     */
    function claim(uint256 _pid) external nonReentrant whenNotPaused {
        require(!claimPaused, "Claim is paused");
        require(_pid < poolInfo.length, "Pool does not exist");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        // 更新池的奖励
        updatePool(_pid);
        
        // 计算用户待领取奖励
        uint256 pending = ((user.amount * pool.accRewardPerShare) / 1e12) - user.rewardDebt;
        if (pending > 0 || user.pendingRewards > 0) {
            uint256 totalPending = pending + user.pendingRewards;
            user.pendingRewards = 0;
            user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
            
            // 检查合约是否有足够的奖励代币
            require(rewardToken.balanceOf(address(this)) >= totalPending, "Insufficient reward tokens");
            
            // 转移奖励代币给用户
            rewardToken.safeTransfer(address(msg.sender), totalPending);
            
            emit Claim(msg.sender, _pid, totalPending);
        }
    }

    /**
     * @dev 紧急提取（不领取奖励）
     * @param _pid 池ID
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        require(_pid < poolInfo.length, "Pool does not exist");
        
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount > 0, "No balance to withdraw");
        
        uint256 amount = user.amount;
        
        // 重置用户信息
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        
        // 转移代币给用户
        PoolInfo storage pool = poolInfo[_pid];
        pool.lpToken.safeTransfer(address(msg.sender), amount);
        
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @dev 暂停/恢复质押
     * @param _paused 是否暂停
     */
    function setStakePause(bool _paused) external onlyOwner {
        stakePaused = _paused;
        emit PauseStakeChanged(_paused);
    }

    /**
     * @dev 暂停/恢复提取
     * @param _paused 是否暂停
     */
    function setWithdrawPause(bool _paused) external onlyOwner {
        withdrawPaused = _paused;
        emit PauseWithdrawChanged(_paused);
    }

    /**
     * @dev 暂停/恢复领取奖励
     * @param _paused 是否暂停
     */
    function setClaimPause(bool _paused) external onlyOwner {
        claimPaused = _paused;
        emit PauseClaimChanged(_paused);
    }

    /**
     * @dev 紧急提取奖励代币（仅所有者）
     * @param _amount 提取数量
     */
    function emergencyRewardWithdraw(uint256 _amount) external onlyOwner {
        require(rewardToken.balanceOf(address(this)) >= _amount, "Insufficient reward tokens");
        rewardToken.safeTransfer(address(msg.sender), _amount);
    }
}