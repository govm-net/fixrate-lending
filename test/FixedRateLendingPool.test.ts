import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("FixedRateLendingPool", function () {
  let mockToken: any;
  let mockPriceFeed: any;
  let lendingPool: any;
  let p2pMarketplace: any;
  let owner: Signer;
  let depositor: Signer;
  let borrower: Signer;
  let liquidator: Signer;
  let ownerAddress: string;
  let depositorAddress: string;
  let borrowerAddress: string;
  let liquidatorAddress: string;

  // 测试参数
  const initialSupply = ethers.parseEther("1000000"); // 100万代币
  const depositAmount = ethers.parseEther("100000"); // 10万代币
  const lendAmount = ethers.parseEther("10000"); // 1万代币
  const collateralAmount = ethers.parseEther("25000"); // 2.5万代币，确保抵押率为250%
  const interestRate = 1000; // 10%
  const loanDuration = 30 * 24 * 60 * 60; // 30天
  const minInterestRate = 500; // 5%
  const maxLoanDuration = 60 * 24 * 60 * 60; // 60天
  const minCollateralRatio = 12000; // 120%
  const oneHour = 60 * 60; // 1小时（秒）

  // 部署模拟价格预言机
  async function deployMockPriceFeed() {
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy();
    
    // 设置代币价格：1 ETH = $2000，8位小数
    await mockPriceFeed.setLatestAnswer(200000000000); // $2000 with 8 decimals
    await mockPriceFeed.setDecimals(8);
    
    return mockPriceFeed;
  }

  beforeEach(async function () {
    // 获取签名者
    [owner, depositor, borrower, liquidator] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    depositorAddress = await depositor.getAddress();
    borrowerAddress = await borrower.getAddress();
    liquidatorAddress = await liquidator.getAddress();

    // 部署模拟代币
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    
    // 部署模拟价格预言机
    mockPriceFeed = await deployMockPriceFeed();

    // 部署借贷池
    const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
    lendingPool = await FixedRateLendingPool.deploy(
      minInterestRate,
      maxLoanDuration,
      minCollateralRatio
    );

    // 部署P2P借贷市场
    const P2PLendingMarketplace = await ethers.getContractFactory("P2PLendingMarketplace");
    p2pMarketplace = await P2PLendingMarketplace.deploy();

    // 设置市场合约地址
    await lendingPool.setMarketplaceAddress(await p2pMarketplace.getAddress());

    // 添加支持的代币和价格预言机
    await lendingPool.addSupportedToken(await mockToken.getAddress(), await mockPriceFeed.getAddress());

    // 设置代币价格为2000美元（8位小数）
    await mockPriceFeed.setLatestAnswer(200000000000);

    // 铸造代币给测试账户
    await mockToken.mint(ownerAddress, initialSupply);
    await mockToken.mint(depositorAddress, initialSupply);
    await mockToken.mint(borrowerAddress, initialSupply);

    // 存款到借贷池
    await mockToken.connect(depositor).approve(await lendingPool.getAddress(), depositAmount);
    await lendingPool.connect(depositor).deposit(await mockToken.getAddress(), depositAmount);

    // 授权P2P市场合约使用代币
    await mockToken.connect(borrower).approve(await p2pMarketplace.getAddress(), collateralAmount);
    // 授权借贷池合约使用代币（用于还款）
    await mockToken.connect(borrower).approve(await lendingPool.getAddress(), ethers.parseEther("20000")); // 足够支付本金+利息
  });

  describe("借贷池基本功能", function () {
    it("应该正确初始化借贷池参数", async function () {
      expect(await lendingPool.minInterestRate()).to.equal(minInterestRate);
      expect(await lendingPool.maxLoanDuration()).to.equal(maxLoanDuration);
      expect(await lendingPool.minCollateralRatio()).to.equal(minCollateralRatio);
    });

    it("应该允许添加和移除支持的代币", async function () {
      const tokenAddress = await mockToken.getAddress();
      
      // 验证代币已添加
      expect(await lendingPool.supportedTokens(tokenAddress)).to.be.true;
      
      // 验证价格预言机已设置
      expect(await lendingPool.tokenPriceFeeds(tokenAddress)).to.equal(await mockPriceFeed.getAddress());
      
      // 移除代币
      await lendingPool.removeSupportedToken(tokenAddress);
      
      // 验证代币已移除
      expect(await lendingPool.supportedTokens(tokenAddress)).to.be.false;
    });

    it("应该允许向池中存款和提款", async function () {
      const tokenAddress = await mockToken.getAddress();
      
      // 验证存款成功
      expect(await lendingPool.poolBalance(tokenAddress)).to.equal(depositAmount);
      
      // 提款
      const withdrawAmount = ethers.parseEther("50000"); // 5万代币
      await lendingPool.withdraw(tokenAddress, withdrawAmount);
      
      // 验证提款成功
      expect(await lendingPool.poolBalance(tokenAddress)).to.equal(depositAmount - withdrawAmount);
    });

    it("应该允许更新池参数", async function () {
      const newMinInterestRate = 800; // 8%
      const newMaxLoanDuration = 90 * 24 * 60 * 60; // 90天
      const newMinCollateralRatio = 15000; // 150%
      
      await lendingPool.updatePoolParams(
        newMinInterestRate,
        newMaxLoanDuration,
        newMinCollateralRatio
      );
      
      expect(await lendingPool.minInterestRate()).to.equal(newMinInterestRate);
      expect(await lendingPool.maxLoanDuration()).to.equal(newMaxLoanDuration);
      expect(await lendingPool.minCollateralRatio()).to.equal(newMinCollateralRatio);
    });
    
    it("应该正确获取代币价格和价值", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount = ethers.parseEther("1"); // 1个代币
      
      // 获取代币价格
      const price = await lendingPool.getTokenPrice(tokenAddress);
      expect(price).to.equal(200000000000); // $2000 with 8 decimals
      
      // 计算代币价值
      const value = await lendingPool.calculateTokenValue(tokenAddress, amount);
      // 由于我们的实现，价值计算为：价格 * 数量 / 10^(代币小数位数)
      // 200000000000 * 10^18 / 10^18 = 200000000000
      expect(value).to.equal(200000000000);
    });
  });

  describe("借贷池与P2P市场集成", function () {
    let orderHash: string;
    let expiry: number;
    let nonce: number;

    beforeEach(async function () {
      nonce = 1;
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore!.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      expiry = currentTimestamp + oneHour;
    });

    it("应该允许从借贷池执行订单", async function () {
      // 获取借贷池地址
      const poolAddress = await lendingPool.getAddress();
      
      // 执行池订单
      const tx = await p2pMarketplace.connect(borrower).fulfillPoolOrder(
        poolAddress, // 池地址作为出借人
        await mockToken.getAddress(), // 借出代币
        lendAmount, // 借出金额
        await mockToken.getAddress(), // 抵押代币
        collateralAmount, // 抵押金额
        interestRate, // 利率
        loanDuration, // 借款期限
        expiry, // 过期时间
        nonce // 随机数
      );
      
      // 获取交易收据
      const receipt = await tx.wait();
      
      // 从事件中获取订单哈希
      const event = receipt!.logs.find(
        (log: any) => log.fragment && log.fragment.name === "PoolOrderFulfilled"
      );
      
      if (event) {
        orderHash = event.args[0];
      }
      
      // 验证订单状态
      expect(await p2pMarketplace.offchainOrderStatus(orderHash)).to.equal(1); // ACTIVE
      expect(await p2pMarketplace.offchainOrderBorrowers(orderHash)).to.equal(borrowerAddress);
      expect(await p2pMarketplace.offchainOrderStartTimes(orderHash)).to.be.gt(0);
      expect(await p2pMarketplace.isPoolOrder(orderHash)).to.be.true;
      expect(await p2pMarketplace.getOffchainOrderPool(orderHash)).to.equal(poolAddress);
      
      // 验证资金转移
      const expectedBalance = initialSupply + lendAmount - collateralAmount;
      expect(await mockToken.balanceOf(borrowerAddress)).to.equal(expectedBalance);
      expect(await lendingPool.totalBorrowed(await mockToken.getAddress())).to.equal(lendAmount);
    });

    it("应该允许向借贷池还款", async function () {
      // 获取借贷池地址
      const poolAddress = await lendingPool.getAddress();
      
      // 执行池订单
      const tx = await p2pMarketplace.connect(borrower).fulfillPoolOrder(
        poolAddress, // 池地址作为出借人
        await mockToken.getAddress(), // 借出代币
        lendAmount, // 借出金额
        await mockToken.getAddress(), // 抵押代币
        collateralAmount, // 抵押金额
        interestRate, // 利率
        loanDuration, // 借款期限
        expiry, // 过期时间
        nonce // 随机数
      );
      
      // 获取交易收据
      const receipt = await tx.wait();
      
      // 从事件中获取订单哈希
      const event = receipt!.logs.find(
        (log: any) => log.fragment && log.fragment.name === "PoolOrderFulfilled"
      );
      
      let orderHash: string;
      if (event) {
        orderHash = event.args[0];
      } else {
        throw new Error("PoolOrderFulfilled event not found");
      }
      
      // 计算利息
      const interest = await p2pMarketplace.calculateInterest(
        lendAmount,
        interestRate,
        await p2pMarketplace.offchainOrderStartTimes(orderHash),
        loanDuration
      );
      const totalRepayment = lendAmount + interest;
      
      // 授权借贷池合约使用代币（确保足够的授权额度）
      await mockToken.connect(borrower).approve(await lendingPool.getAddress(), totalRepayment+interest);
      
      // 还款
      await p2pMarketplace.connect(borrower).repayOffchainOrder({
        lender: poolAddress,
        lendToken: await mockToken.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await mockToken.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce
      });
      
      // 验证订单状态
      expect(await p2pMarketplace.offchainOrderStatus(orderHash)).to.equal(2); // REPAID
    });

    it("应该允许清算逾期的池订单", async function () {
      // 获取借贷池地址
      const poolAddress = await lendingPool.getAddress();
      
      // 执行池订单
      const tx = await p2pMarketplace.connect(borrower).fulfillPoolOrder(
        poolAddress, // 池地址作为出借人
        await mockToken.getAddress(), // 借出代币
        lendAmount, // 借出金额
        await mockToken.getAddress(), // 抵押代币
        collateralAmount, // 抵押金额
        interestRate, // 利率
        loanDuration, // 借款期限
        expiry, // 过期时间
        nonce // 随机数
      );
      
      // 获取交易收据
      const receipt = await tx.wait();
      
      // 从事件中获取订单哈希
      const event = receipt!.logs.find(
        (log: any) => log.fragment && log.fragment.name === "PoolOrderFulfilled"
      );
      
      let orderHash: string;
      if (event) {
        orderHash = event.args[0];
      } else {
        throw new Error("PoolOrderFulfilled event not found");
      }
      
      // 前进时间超过借款期限
      await time.increase(loanDuration + 1);
      
      // 清算订单
      await p2pMarketplace.connect(liquidator).liquidateOffchainOrder({
        lender: poolAddress,
        lendToken: await mockToken.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await mockToken.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce
      });
      
      // 验证订单状态
      expect(await p2pMarketplace.offchainOrderStatus(orderHash)).to.equal(3); // LIQUIDATED
    });

    it("应该拒绝抵押率不足的订单", async function () {
      // 获取借贷池地址
      const poolAddress = await lendingPool.getAddress();
      
      // 设置抵押率不足的抵押金额
      const lowCollateralAmount = ethers.parseEther("1"); // 很小的抵押金额
      
      // 尝试执行抵押率不足的订单
      await expect(
        p2pMarketplace.connect(borrower).fulfillPoolOrder(
          poolAddress, // 池地址作为出借人
          await mockToken.getAddress(), // 借出代币
          lendAmount, // 借出金额
          await mockToken.getAddress(), // 抵押代币
          lowCollateralAmount, // 抵押金额不足
          interestRate, // 利率
          loanDuration, // 借款期限
          expiry, // 过期时间
          nonce // 随机数
        )
      ).to.be.revertedWith("Pool order verification failed");
    });

    it("应该拒绝不满足条件的池订单", async function () {
      // 获取借贷池地址
      const poolAddress = await lendingPool.getAddress();
      
      // 设置超过最大借款期限的期限
      const tooLongDuration = 366 * 24 * 60 * 60; // 366天
      
      // 尝试执行期限过长的订单
      await expect(
        p2pMarketplace.connect(borrower).fulfillPoolOrder(
          poolAddress, // 池地址作为出借人
          await mockToken.getAddress(), // 借出代币
          lendAmount, // 借出金额
          await mockToken.getAddress(), // 抵押代币
          collateralAmount, // 抵押金额
          interestRate, // 利率
          tooLongDuration, // 借款期限过长
          expiry, // 过期时间
          nonce // 随机数
        )
      ).to.be.revertedWith("Pool order verification failed");
    });
  });
}); 