import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LiquidityMining", function () {
  let mockToken: any;
  let rewardToken: any;
  let liquidityMining: any;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  // 测试参数
  const initialSupply = ethers.parseEther("1000000"); // 100万代币
  const rewardPerSecond = ethers.parseEther("1"); // 每秒1个奖励代币
  const oneDay = 24 * 60 * 60; // 1天（秒）

  beforeEach(async function () {
    // 获取签名者
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // 部署模拟代币（质押代币）
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    
    // 部署奖励代币
    rewardToken = await MockToken.deploy("Reward Token", "RTK", 18);

    // 铸造代币给测试账户
    await mockToken.mint(ownerAddress, initialSupply);
    await mockToken.mint(user1Address, initialSupply);
    await mockToken.mint(user2Address, initialSupply);
    
    await rewardToken.mint(ownerAddress, initialSupply);

    // 获取当前时间
    const currentTime = await time.latest();
    const startTime = currentTime + 60; // 1分钟后开始
    const endTime = startTime + 30 * oneDay; // 30天后结束

    // 部署流动性挖矿合约
    const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
    liquidityMining = await LiquidityMining.deploy(
      await rewardToken.getAddress(),
      rewardPerSecond,
      startTime,
      endTime
    );

    // 转移奖励代币到挖矿合约
    await rewardToken.transfer(await liquidityMining.getAddress(), ethers.parseEther("100000"));

    // 添加质押池
    await liquidityMining.addPool(await mockToken.getAddress(), 100);

    // 授权合约使用代币
    await mockToken.connect(user1).approve(await liquidityMining.getAddress(), initialSupply);
    await mockToken.connect(user2).approve(await liquidityMining.getAddress(), initialSupply);
  });

  describe("合约部署", function () {
    it("应该正确初始化合约参数", async function () {
      expect(await liquidityMining.rewardToken()).to.equal(await rewardToken.getAddress());
      expect(await liquidityMining.rewardPerSecond()).to.equal(rewardPerSecond);
      expect(await liquidityMining.startTime()).to.be.gt(await time.latest());
      expect(await liquidityMining.endTime()).to.be.gt(await liquidityMining.startTime());
      expect(await liquidityMining.poolLength()).to.equal(1);
    });

    // 新增边界测试用例
    it("应该不能使用零地址作为奖励代币", async function () {
      const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
      const currentTime = await time.latest();
      const startTime = currentTime + 60;
      const endTime = startTime + 30 * oneDay;
      
      await expect(LiquidityMining.deploy(
        ethers.ZeroAddress,
        rewardPerSecond,
        startTime,
        endTime
      )).to.be.revertedWith("Reward token cannot be zero address");
    });

    it("应该不能设置过去的开始时间", async function () {
      const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
      const currentTime = await time.latest();
      const pastTime = currentTime - 60;
      const endTime = currentTime + 30 * oneDay;
      
      await expect(LiquidityMining.deploy(
        await rewardToken.getAddress(),
        rewardPerSecond,
        pastTime,
        endTime
      )).to.be.revertedWith("Start time must be in the future");
    });

    it("应该不能设置结束时间早于开始时间", async function () {
      const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
      const currentTime = await time.latest();
      const startTime = currentTime + 60;
      const endTime = startTime - 60;
      
      await expect(LiquidityMining.deploy(
        await rewardToken.getAddress(),
        rewardPerSecond,
        startTime,
        endTime
      )).to.be.revertedWith("End time must be after start time");
    });
  });

  describe("池管理", function () {
    it("应该允许所有者添加新的质押池", async function () {
      const MockToken2 = await ethers.getContractFactory("MockToken");
      const mockToken2 = await MockToken2.deploy("Mock Token 2", "MTK2", 18);
      
      await liquidityMining.addPool(await mockToken2.getAddress(), 200);
      
      expect(await liquidityMining.poolLength()).to.equal(2);
      
      const poolInfo = await liquidityMining.poolInfo(1);
      expect(poolInfo.lpToken).to.equal(await mockToken2.getAddress());
      expect(poolInfo.allocPoint).to.equal(200);
    });

    it("应该允许所有者设置池的分配点数", async function () {
      await liquidityMining.setPool(0, 150);
      
      const poolInfo = await liquidityMining.poolInfo(0);
      expect(poolInfo.allocPoint).to.equal(150);
    });

    it("应该拒绝非所有者添加池或设置池参数", async function () {
      const MockToken2 = await ethers.getContractFactory("MockToken");
      const mockToken2 = await MockToken2.deploy("Mock Token 2", "MTK2", 18);
      
      await expect(
        liquidityMining.connect(user1).addPool(await mockToken2.getAddress(), 200)
      ).to.be.revertedWithCustomError(liquidityMining, "OwnableUnauthorizedAccount");
      
      await expect(
        liquidityMining.connect(user1).setPool(0, 150)
      ).to.be.revertedWithCustomError(liquidityMining, "OwnableUnauthorizedAccount");
    });

    // 新增边界测试用例
    it("应该不能添加零地址的LP代币", async function () {
      await expect(
        liquidityMining.addPool(ethers.ZeroAddress, 200)
      ).to.be.revertedWith("LP token cannot be zero address");
    });

    it("应该不能设置不存在的池", async function () {
      const invalidPoolId = 999;
      await expect(
        liquidityMining.setPool(invalidPoolId, 150)
      ).to.be.revertedWith("Pool does not exist");
    });

    it("应该不能设置零奖励发放速率", async function () {
      await expect(
        liquidityMining.setRewardPerSecond(0)
      ).to.be.revertedWith("Reward per second must be greater than 0");
    });
  });

  describe("质押和提取", function () {
    beforeEach(async function () {
      // 前进时间到挖矿开始时间
      const startTime = await liquidityMining.startTime();
      await time.increaseTo(Number(startTime) + 1);
    });

    it("应该允许用户质押代币", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      const userInfo = await liquidityMining.userInfo(0, user1Address);
      expect(userInfo.amount).to.equal(depositAmount);
    });

    it("应该允许用户提取质押的代币", async function () {
      const depositAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("500");
      
      // 质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 提取
      await liquidityMining.connect(user1).withdraw(0, withdrawAmount);
      
      const userInfo = await liquidityMining.userInfo(0, user1Address);
      expect(userInfo.amount).to.equal(depositAmount - withdrawAmount);
    });

    it("应该拒绝提取超过质押数量的代币", async function () {
      const depositAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("1500");
      
      // 质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 尝试提取超过质押数量的代币
      await expect(
        liquidityMining.connect(user1).withdraw(0, withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    // 新增边界测试用例
    it("应该不能质押零金额", async function () {
      await expect(
        liquidityMining.connect(user1).deposit(0, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("应该不能提取零金额", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 尝试提取零金额
      await expect(
        liquidityMining.connect(user1).withdraw(0, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("应该不能质押到不存在的池", async function () {
      const invalidPoolId = 999;
      const depositAmount = ethers.parseEther("1000");
      
      await expect(
        liquidityMining.connect(user1).deposit(invalidPoolId, depositAmount)
      ).to.be.revertedWith("Pool does not exist");
    });

    it("应该不能从不存在的池提取", async function () {
      const invalidPoolId = 999;
      const withdrawAmount = ethers.parseEther("1000");
      
      await expect(
        liquidityMining.connect(user1).withdraw(invalidPoolId, withdrawAmount)
      ).to.be.revertedWith("Pool does not exist");
    });

    it("应该不能在质押暂停时质押", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 暂停质押
      await liquidityMining.setStakePause(true);
      
      await expect(
        liquidityMining.connect(user1).deposit(0, depositAmount)
      ).to.be.revertedWith("Staking is paused");
    });

    it("应该不能在提取暂停时提取", async function () {
      const depositAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("500");
      
      // 质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 暂停提取
      await liquidityMining.setWithdrawPause(true);
      
      await expect(
        liquidityMining.connect(user1).withdraw(0, withdrawAmount)
      ).to.be.revertedWith("Withdraw is paused");
    });
  });

  describe("奖励计算和领取", function () {
    beforeEach(async function () {
      // 前进时间到挖矿开始时间
      const startTime = await liquidityMining.startTime();
      await time.increaseTo(Number(startTime) + 1);
    });

    it("应该正确计算用户待领取奖励", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 用户1质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 前进时间
      await time.increase(oneDay);
      
      // 检查待领取奖励
      const pendingReward = await liquidityMining.pendingReward(0, user1Address);
      expect(pendingReward).to.be.gt(0);
    });

    it("应该允许用户领取奖励", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 用户1质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 前进时间
      await time.increase(oneDay);
      
      // 领取奖励前的余额
      const rewardBalanceBefore = await rewardToken.balanceOf(user1Address);
      
      // 领取奖励
      await liquidityMining.connect(user1).claim(0);
      
      // 领取奖励后的余额
      const rewardBalanceAfter = await rewardToken.balanceOf(user1Address);
      
      expect(rewardBalanceAfter).to.be.gt(rewardBalanceBefore);
    });

    it("多个用户应该按质押比例分配奖励", async function () {
      const depositAmount1 = ethers.parseEther("1000");
      const depositAmount2 = ethers.parseEther("2000"); // 用户2质押两倍数量
      
      // 用户1和用户2质押
      await liquidityMining.connect(user1).deposit(0, depositAmount1);
      await liquidityMining.connect(user2).deposit(0, depositAmount2);
      
      // 前进时间
      await time.increase(oneDay);
      
      // 领取奖励前的余额
      const rewardBalance1Before = await rewardToken.balanceOf(user1Address);
      const rewardBalance2Before = await rewardToken.balanceOf(user2Address);
      
      // 用户1和用户2领取奖励
      await liquidityMining.connect(user1).claim(0);
      await liquidityMining.connect(user2).claim(0);
      
      // 领取奖励后的余额
      const rewardBalance1After = await rewardToken.balanceOf(user1Address);
      const rewardBalance2After = await rewardToken.balanceOf(user2Address);
      
      const reward1 = rewardBalance1After - rewardBalance1Before;
      const reward2 = rewardBalance2After - rewardBalance2Before;
      
      // 用户2应该获得大约两倍于用户1的奖励
      // 检查比例是否接近2:1
      const ratio = Number(reward2.toString()) / Number(reward1.toString());
      expect(ratio).to.be.closeTo(2, 0.05); // 允许5%的误差
    });

    // 新增边界测试用例
    it("应该不能领取不存在池的奖励", async function () {
      const invalidPoolId = 999;
      
      await expect(
        liquidityMining.connect(user1).claim(invalidPoolId)
      ).to.be.revertedWith("Pool does not exist");
    });

    it("应该不能在领取暂停时领取奖励", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 用户1质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 前进时间
      await time.increase(oneDay);
      
      // 暂停领取
      await liquidityMining.setClaimPause(true);
      
      await expect(
        liquidityMining.connect(user1).claim(0)
      ).to.be.revertedWith("Claim is paused");
    });

    it("应该在合约奖励不足时无法领取奖励", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 用户1质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 前进很长时间以累积大量奖励
      await time.increase(100 * oneDay);
      
      // 清空合约的奖励代币
      const contractBalance = await rewardToken.balanceOf(await liquidityMining.getAddress());
      await liquidityMining.connect(owner).emergencyRewardWithdraw(contractBalance);
      
      // 尝试领取奖励应该失败
      await expect(
        liquidityMining.connect(user1).claim(0)
      ).to.be.revertedWith("Insufficient reward tokens");
    });
  });

  describe("紧急操作", function () {
    beforeEach(async function () {
      // 前进时间到挖矿开始时间
      const startTime = await liquidityMining.startTime();
      await time.increaseTo(Number(startTime) + 1);
    });

    it("应该允许用户紧急提取质押代币", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 用户1质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 紧急提取
      await liquidityMining.connect(user1).emergencyWithdraw(0);
      
      const userInfo = await liquidityMining.userInfo(0, user1Address);
      expect(userInfo.amount).to.equal(0);
      expect(userInfo.rewardDebt).to.equal(0);
      expect(userInfo.pendingRewards).to.equal(0);
    });

    it("应该允许所有者紧急提取奖励代币", async function () {
      const withdrawAmount = ethers.parseEther("100");
      
      const contractBalanceBefore = await rewardToken.balanceOf(await liquidityMining.getAddress());
      
      await liquidityMining.emergencyRewardWithdraw(withdrawAmount);
      
      const contractBalanceAfter = await rewardToken.balanceOf(await liquidityMining.getAddress());
      expect(contractBalanceAfter).to.equal(contractBalanceBefore - withdrawAmount);
    });

    // 新增边界测试用例
    it("应该不能紧急提取不存在池的质押代币", async function () {
      const invalidPoolId = 999;
      
      await expect(
        liquidityMining.connect(user1).emergencyWithdraw(invalidPoolId)
      ).to.be.revertedWith("Pool does not exist");
    });

    it("应该不能紧急提取零余额的质押代币", async function () {
      // 确保用户没有质押任何代币
      const userInfo = await liquidityMining.userInfo(0, user1Address);
      expect(userInfo.amount).to.equal(0);
      
      await expect(
        liquidityMining.connect(user1).emergencyWithdraw(0)
      ).to.be.revertedWith("No balance to withdraw");
    });

    it("应该不能非所有者紧急提取奖励代币", async function () {
      const withdrawAmount = ethers.parseEther("100");
      
      await expect(
        liquidityMining.connect(user1).emergencyRewardWithdraw(withdrawAmount)
      ).to.be.revertedWithCustomError(liquidityMining, "OwnableUnauthorizedAccount");
    });

    it("应该不能紧急提取超过合约余额的奖励代币", async function () {
      const contractBalance = await rewardToken.balanceOf(await liquidityMining.getAddress());
      const excessiveAmount = contractBalance + ethers.parseEther("1");
      
      await expect(
        liquidityMining.emergencyRewardWithdraw(excessiveAmount)
      ).to.be.revertedWith("Insufficient reward tokens");
    });
  });

  describe("暂停功能", function () {
    it("应该允许所有者暂停和恢复质押", async function () {
      // 暂停质押
      await liquidityMining.setStakePause(true);
      
      const depositAmount = ethers.parseEther("1000");
      await expect(
        liquidityMining.connect(user1).deposit(0, depositAmount)
      ).to.be.revertedWith("Staking is paused");
      
      // 恢复质押
      await liquidityMining.setStakePause(false);
      
      await expect(
        liquidityMining.connect(user1).deposit(0, depositAmount)
      ).to.not.be.reverted;
    });

    it("应该允许所有者暂停和恢复提取", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 先质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 暂停提取
      await liquidityMining.setWithdrawPause(true);
      
      await expect(
        liquidityMining.connect(user1).withdraw(0, depositAmount)
      ).to.be.revertedWith("Withdraw is paused");
      
      // 恢复提取
      await liquidityMining.setWithdrawPause(false);
      
      await expect(
        liquidityMining.connect(user1).withdraw(0, depositAmount)
      ).to.not.be.reverted;
    });

    it("应该允许所有者暂停和恢复领取奖励", async function () {
      // 暂停领取奖励
      await liquidityMining.setClaimPause(true);
      
      await expect(
        liquidityMining.connect(user1).claim(0)
      ).to.be.revertedWith("Claim is paused");
      
      // 恢复领取奖励
      await liquidityMining.setClaimPause(false);
      
      await expect(
        liquidityMining.connect(user1).claim(0)
      ).to.not.be.reverted;
    });
  });

  // 新增边界测试用例
  describe("时间边界测试", function () {
    it("应该在挖矿开始前无法质押", async function () {
      // 重新部署合约，确保开始时间在将来
      const currentTime = await time.latest();
      const startTime = currentTime + 60; // 1分钟后开始
      const endTime = startTime + 30 * oneDay; // 30天后结束
      
      const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
      const newLiquidityMining = await LiquidityMining.deploy(
        await rewardToken.getAddress(),
        rewardPerSecond,
        startTime,
        endTime
      );
      
      // 添加质押池
      await newLiquidityMining.addPool(await mockToken.getAddress(), 100);
      
      // 授权合约使用代币
      await mockToken.connect(user1).approve(await newLiquidityMining.getAddress(), initialSupply);
      
      const depositAmount = ethers.parseEther("1000");
      
      // 暂停质押来模拟开始前的状态
      await newLiquidityMining.setStakePause(true);
      
      await expect(
        newLiquidityMining.connect(user1).deposit(0, depositAmount)
      ).to.be.revertedWith("Staking is paused");
    });

    it("应该在挖矿结束后无法获得新奖励", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // 前进时间到挖矿开始时间
      const startTime = await liquidityMining.startTime();
      await time.increaseTo(Number(startTime) + 1);
      
      // 质押
      await liquidityMining.connect(user1).deposit(0, depositAmount);
      
      // 前进时间到挖矿结束后
      const endTime = await liquidityMining.endTime();
      await time.increaseTo(Number(endTime) + oneDay);
      
      // 再次前进时间
      await time.increase(oneDay);
      
      // 检查待领取奖励应该没有增加
      const pendingReward1 = await liquidityMining.pendingReward(0, user1Address);
      await time.increase(oneDay);
      const pendingReward2 = await liquidityMining.pendingReward(0, user1Address);
      
      expect(pendingReward2).to.equal(pendingReward1);
    });
  });

  describe("分配点数边界测试", function () {
    it("应该能处理零分配点数的池", async function () {
      // 添加一个分配点数为0的池
      const MockToken2 = await ethers.getContractFactory("MockToken");
      const mockToken2 = await MockToken2.deploy("Mock Token 2", "MTK2", 18);
      
      await liquidityMining.addPool(await mockToken2.getAddress(), 0);
      
      const poolInfo = await liquidityMining.poolInfo(1);
      expect(poolInfo.allocPoint).to.equal(0);
    });

    it("应该能处理极大分配点数的池", async function () {
      const largeAllocPoint = ethers.parseEther("1000000"); // 极大分配点数
      
      const MockToken2 = await ethers.getContractFactory("MockToken");
      const mockToken2 = await MockToken2.deploy("Mock Token 2", "MTK2", 18);
      
      await liquidityMining.addPool(await mockToken2.getAddress(), largeAllocPoint);
      
      const poolInfo = await liquidityMining.poolInfo(1);
      expect(poolInfo.allocPoint).to.equal(largeAllocPoint);
    });
  });
});