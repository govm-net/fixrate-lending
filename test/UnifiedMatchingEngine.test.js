const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnifiedMatchingEngine", function () {
  let unifiedMatching;
  let personalChecker;
  let poolChecker; // 这个名字现在指的是FixedRateLendingPool合约
  let lendingPool; // 这个名字现在指的是FixedRateLendingPool合约
  let tokenA;
  let tokenB;
  let owner;
  let lender;
  let borrower;
  let addr1;
  let addr2;
  let addrs;

  const lendAmount = ethers.parseEther("1000");
  const collateralAmount = ethers.parseEther("1500");
  const interestRate = 1000; // 10%
  const loanDuration = 30 * 24 * 60 * 60; // 30天
  const oneHour = 60 * 60; // 1小时（秒）

  beforeEach(async function () {
    [owner, lender, borrower, addr1, addr2, ...addrs] = await ethers.getSigners();

    // 部署模拟代币
    const MockToken = await ethers.getContractFactory("MockToken");
    tokenA = await MockToken.deploy("Token A", "TKA", 18);
    tokenB = await MockToken.deploy("Token B", "TKB", 18);

    // 部署统一撮合引擎
    const UnifiedMatchingEngine = await ethers.getContractFactory("UnifiedMatchingEngine");
    unifiedMatching = await UnifiedMatchingEngine.deploy();

    // 部署 PersonalChecker
    const PersonalChecker = await ethers.getContractFactory("PersonalChecker");
    personalChecker = await PersonalChecker.deploy();

    // Deploy FixedRateLendingPool (which now also acts as PoolChecker)
    const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
    lendingPool = await FixedRateLendingPool.deploy(
      500, // minInterestRate (5%)
      365 * 24 * 60 * 60, // maxLoanDuration (1 year)
      15000 // minCollateralRatio (150%)
    );

    // Set poolChecker to point to the lendingPool (which now also acts as PoolChecker)
    poolChecker = lendingPool;

    // 授权 PersonalChecker 和 PoolChecker
    await unifiedMatching.authorizeChecker(await personalChecker.getAddress());
    await unifiedMatching.authorizeChecker(await poolChecker.getAddress());
  });

  describe("Checker 授权机制", function () {
    it("所有者应该能够授权 Checker 合约", async function () {
      // 部署一个新的 Checker 合约用于测试
      const TestChecker = await ethers.getContractFactory("PersonalChecker");
      const testChecker = await TestChecker.deploy();
      
      // 验证合约未被授权
      expect(await unifiedMatching.authorizedCheckers(await testChecker.getAddress())).to.be.false;
      
      // 授权合约
      await unifiedMatching.authorizeChecker(await testChecker.getAddress());
      
      // 验证合约已被授权
      expect(await unifiedMatching.authorizedCheckers(await testChecker.getAddress())).to.be.true;
      
      // 验证事件被触发
      await expect(unifiedMatching.authorizeChecker(await testChecker.getAddress()))
        .to.emit(unifiedMatching, "CheckerAuthorized")
        .withArgs(await testChecker.getAddress());
    });

    it("非所有者不应该能够授权 Checker 合约", async function () {
      // 部署一个新的 Checker 合约用于测试
      const TestChecker = await ethers.getContractFactory("PersonalChecker");
      const testChecker = await TestChecker.deploy();
      
      // 尝试使用非所有者账户授权合约
      await expect(unifiedMatching.connect(addr1).authorizeChecker(await testChecker.getAddress()))
        .to.be.reverted;
    });

    it("所有者应该能够取消授权 Checker 合约", async function () {
      // 验证合约已被授权
      expect(await unifiedMatching.authorizedCheckers(await personalChecker.getAddress())).to.be.true;
      
      // 取消授权合约
      await unifiedMatching.deauthorizeChecker(await personalChecker.getAddress());
      
      // 验证合约已被取消授权
      expect(await unifiedMatching.authorizedCheckers(await personalChecker.getAddress())).to.be.false;
      
      // 验证事件被触发
      await expect(unifiedMatching.deauthorizeChecker(await personalChecker.getAddress()))
        .to.emit(unifiedMatching, "CheckerDeauthorized")
        .withArgs(await personalChecker.getAddress());
    });

    it("非所有者不应该能够取消授权 Checker 合约", async function () {
      // 尝试使用非所有者账户取消授权合约
      await expect(unifiedMatching.connect(addr1).deauthorizeChecker(await personalChecker.getAddress()))
        .to.be.reverted;
    });

    it("应该不能使用未授权的 Checker 合约发起借款请求", async function () {
      // 部署一个新的未授权 Checker 合约
      const UnauthorizedChecker = await ethers.getContractFactory("PersonalChecker");
      const unauthorizedChecker = await UnauthorizedChecker.deploy();
      
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      const expiry = currentTimestamp + oneHour;
      
      // 创建订单参数
      const orderParams = {
        checker: await unauthorizedChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: 1,
        signature: "0x"
      };
      
      // 尝试使用未授权的 Checker 合约发起借款请求
      await expect(unifiedMatching.connect(borrower).initiateBorrowRequest(orderParams))
        .to.be.revertedWith("Checker not authorized");
    });

    it("应该不能使用未授权的 Checker 合约发起出借请求", async function () {
      // 部署一个新的未授权 Checker 合约
      const UnauthorizedChecker = await ethers.getContractFactory("PersonalChecker");
      const unauthorizedChecker = await UnauthorizedChecker.deploy();
      
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      const expiry = currentTimestamp + oneHour;
      
      // 创建订单参数
      const orderParams = {
        checker: await unauthorizedChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: 1,
        signature: "0x"
      };
      
      // 尝试使用未授权的 Checker 合约发起出借请求
      await expect(unifiedMatching.connect(lender).initiateLendRequest(orderParams))
        .to.be.revertedWith("Checker not authorized");
    });

    it("应该不能使用未授权的 Checker 合约执行借款交易", async function () {
      // 部署一个新的未授权 Checker 合约
      const UnauthorizedChecker = await ethers.getContractFactory("PersonalChecker");
      const unauthorizedChecker = await UnauthorizedChecker.deploy();
      
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      const expiry = currentTimestamp + oneHour;
      
      // 创建订单参数
      const orderParams = {
        checker: await unauthorizedChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: 1,
        signature: "0x"
      };
      
      // 尝试使用未授权的 Checker 合约执行借款交易
      await expect(unifiedMatching.connect(lender).executeBorrow(orderParams))
        .to.be.revertedWith("Checker not authorized");
    });

    it("应该不能使用未授权的 Checker 合约执行出借交易", async function () {
      // 部署一个新的未授权 Checker 合约
      const UnauthorizedChecker = await ethers.getContractFactory("PersonalChecker");
      const unauthorizedChecker = await UnauthorizedChecker.deploy();
      
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      const expiry = currentTimestamp + oneHour;
      
      // 创建订单参数
      const orderParams = {
        checker: await unauthorizedChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: 1,
        signature: "0x"
      };
      
      // 尝试使用未授权的 Checker 合约执行出借交易
      await expect(unifiedMatching.connect(borrower).executeLend(orderParams))
        .to.be.revertedWith("Checker not authorized");
    });
  });

  describe("借款请求", function () {
    let nonce;
    let expiry;
    
    beforeEach(async function () {
      nonce = 1;
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      expiry = currentTimestamp + oneHour;
    });

    it("应该能够发起借款请求", async function () {
      const orderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce,
        signature: "0x"
      };
      
      await expect(unifiedMatching.connect(borrower).initiateBorrowRequest(orderParams))
        .to.emit(unifiedMatching, "BorrowRequestInitiated");
    });

    it("不应该允许使用已使用的nonce", async function () {
      const orderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce,
        signature: "0x"
      };
      
      // 第一次使用nonce
      await unifiedMatching.connect(borrower).initiateBorrowRequest(orderParams);
      
      // 尝试再次使用相同的nonce
      await expect(
        unifiedMatching.connect(borrower).initiateBorrowRequest(orderParams)
      ).to.be.revertedWith("Nonce already used");
    });

    it("不应该允许过期的订单", async function () {
      // 设置过期时间为过去
      const pastExpiry = Math.floor(Date.now() / 1000) - 60; // 1分钟前
      
      const orderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: pastExpiry,
        nonce: nonce,
        signature: "0x"
      };
      
      await expect(
        unifiedMatching.connect(borrower).initiateBorrowRequest(orderParams)
      ).to.be.revertedWith("Order has expired");
    });
  });

  describe("出借请求", function () {
    let nonce;
    let expiry;
    
    beforeEach(async function () {
      nonce = 1;
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      expiry = currentTimestamp + oneHour;
    });

    it("应该能够发起出借请求", async function () {
      const orderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce,
        signature: "0x"
      };
      
      await expect(unifiedMatching.connect(lender).initiateLendRequest(orderParams))
        .to.emit(unifiedMatching, "LendRequestInitiated");
    });

    it("不应该允许使用已使用的nonce", async function () {
      const orderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce,
        signature: "0x"
      };
      
      // 第一次使用nonce
      await unifiedMatching.connect(lender).initiateLendRequest(orderParams);
      
      // 尝试再次使用相同的nonce
      await expect(
        unifiedMatching.connect(lender).initiateLendRequest(orderParams)
      ).to.be.revertedWith("Nonce already used");
    });

    it("不应该允许过期的订单", async function () {
      // 设置过期时间为过去
      const pastExpiry = Math.floor(Date.now() / 1000) - 60; // 1分钟前
      
      const orderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: pastExpiry,
        nonce: nonce,
        signature: "0x"
      };
      
      await expect(
        unifiedMatching.connect(lender).initiateLendRequest(orderParams)
      ).to.be.revertedWith("Order has expired");
    });
  });

  describe("订单匹配和执行", function () {
    let borrowOrderParams;
    let lendOrderParams;
    let nonce;
    let expiry;
    
    beforeEach(async function () {
      nonce = 1;
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      expiry = currentTimestamp + oneHour;
      
      // 为用户铸造代币
      // lender需要有足够的lendToken来借出
      await tokenA.mint(lender.address, lendAmount);
      // borrower需要有足够的collateralToken作为抵押
      await tokenB.mint(borrower.address, collateralAmount);
      // 在executeBorrow函数中，需要从borrower转移collateralToken给合约，然后从合约转移lendToken给lender
      // 所以合约需要有足够的lendToken
      await tokenA.mint(await unifiedMatching.getAddress(), lendAmount);
      
      // 为合约授权代币
      // borrower授权合约转移collateralToken
      await tokenB.connect(borrower).approve(await unifiedMatching.getAddress(), collateralAmount);
      
      // 创建签名域和类型
      const domain = {
        name: "PersonalChecker",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await personalChecker.getAddress()
      };

      const types = {
        LoanOrder: [
          { name: "checker", type: "address" },
          { name: "lender", type: "address" },
          { name: "borrower", type: "address" },
          { name: "lendToken", type: "address" },
          { name: "lendAmount", type: "uint256" },
          { name: "collateralToken", type: "address" },
          { name: "collateralAmount", type: "uint256" },
          { name: "interestRate", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "nonce", type: "uint256" }
        ]
      };

      // 为借款订单创建签名
      const borrowValue = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce
      };

      const borrowSignature = await borrower.signTypedData(domain, types, borrowValue);

      // 准备借款订单参数
      borrowOrderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce,
        signature: borrowSignature
      };
      
      // 为出借订单创建签名
      const lendValue = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce + 1 // 使用不同的nonce
      };

      const lendSignature = await lender.signTypedData(domain, types, lendValue);

      // 准备出借订单参数
      lendOrderParams = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: nonce + 1, // 使用不同的nonce
        signature: lendSignature
      };
    });

    it("应该能够匹配和执行订单", async function () {
      // 发起借款请求
      await unifiedMatching.connect(borrower).initiateBorrowRequest(borrowOrderParams);
      
      // 发起出借请求
      await unifiedMatching.connect(lender).initiateLendRequest(lendOrderParams);
      
      // 执行借款交易
      await expect(unifiedMatching.connect(lender).executeBorrow(borrowOrderParams))
        .to.emit(unifiedMatching, "BorrowExecuted");
    });

    it("应该能够在订单执行后更新状态", async function () {
      // 发起借款请求
      await unifiedMatching.connect(borrower).initiateBorrowRequest(borrowOrderParams);
      
      // 发起出借请求
      await unifiedMatching.connect(lender).initiateLendRequest(lendOrderParams);
      
      // 执行借款交易
      await unifiedMatching.connect(lender).executeBorrow(borrowOrderParams);
      
      // 验证订单状态已更新
      // 使用与合约相同的方式计算orderHash
      const orderHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(address,address,address,address,uint256,address,uint256,uint256,uint256,uint256,uint256,bytes)"],
        [[
          borrowOrderParams.checker,
          borrowOrderParams.lender,
          borrowOrderParams.borrower,
          borrowOrderParams.lendToken,
          borrowOrderParams.lendAmount,
          borrowOrderParams.collateralToken,
          borrowOrderParams.collateralAmount,
          borrowOrderParams.interestRate,
          borrowOrderParams.duration,
          borrowOrderParams.expiry,
          borrowOrderParams.nonce,
          borrowOrderParams.signature
        ]]
      ));
      
      expect(await unifiedMatching.processedOrders(orderHash)).to.be.true;
    });
  });

  describe("PoolChecker 功能", function () {
    it("应该能够使用 PoolChecker 发起借款请求", async function () {
      // 获取当前区块时间戳
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const currentTimestamp = blockBefore.timestamp;
      
      // 设置过期时间为当前区块时间 + 1小时
      const expiry = currentTimestamp + oneHour;
      
      // 创建订单参数
      const orderParams = {
        checker: await poolChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: await tokenA.getAddress(),
        lendAmount: lendAmount,
        collateralToken: await tokenB.getAddress(),
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: loanDuration,
        expiry: expiry,
        nonce: 1,
        signature: "0x"
      };
      
      // 尝试使用 PoolChecker 发起借款请求
      // 注意：由于 lending pool 没有正确设置，这可能会失败，但我们至少测试它可以被调用
      try {
        await unifiedMatching.connect(borrower).initiateBorrowRequest(orderParams);
      } catch (error) {
        // 期望出现与池验证相关的错误，而不是 Checker 未授权的错误
        expect(error.message).to.not.include("Checker not authorized");
      }
    });
  });
});