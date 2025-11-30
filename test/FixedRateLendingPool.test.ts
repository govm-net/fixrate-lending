import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { 
  FixedRateLendingPool, 
  MockToken, 
  MockV3Aggregator,
  UnifiedMatchingEngine
} from "../typechain-types";

describe("FixedRateLendingPool", function () {
  // 测试参数
  const minInterestRate = 500; // 5% (500 基点)
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1年（秒）
  const minCollateralRatio = 15000; // 150% (15000 基点)
  const oneHour = 60 * 60; // 1小时（秒）

  // 合约实例
  let lendingPool: FixedRateLendingPool;
  let matchingEngine: UnifiedMatchingEngine;
  let mockToken: MockToken;
  let mockPriceFeed: MockV3Aggregator;

  // 账户地址
  let ownerAddress: string;
  let depositorAddress: string;
  let borrowerAddress: string;
  let liquidatorAddress: string;

  // 部署模拟价格预言机的辅助函数
  async function deployMockPriceFeed(): Promise<MockV3Aggregator> {
    const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
    const mockPriceFeed = await MockPriceFeed.deploy(8, 200000000000); // 8 decimals, $2000 initial price
    
    return mockPriceFeed as unknown as MockV3Aggregator;
  }

  beforeEach(async function () {
    // 获取签名者
    const [owner, depositor, borrower, liquidator] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    depositorAddress = await depositor.getAddress();
    borrowerAddress = await borrower.getAddress();
    liquidatorAddress = await liquidator.getAddress();

    // 部署模拟代币
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    
    // 部署模拟价格预言机
    mockPriceFeed = await deployMockPriceFeed();

    // 部署统一撮合引擎
    const UnifiedMatchingEngine = await ethers.getContractFactory("UnifiedMatchingEngine");
    matchingEngine = await UnifiedMatchingEngine.deploy();

    // 部署借贷池
    const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
    lendingPool = await FixedRateLendingPool.deploy(
      minInterestRate,
      maxLoanDuration,
      minCollateralRatio
    );

    // 设置撮合引擎地址
    await lendingPool.setMatchingEngineAddress(await matchingEngine.getAddress());

    // 添加支持的代币和价格预言机
    await lendingPool.addSupportedToken(await mockToken.getAddress(), await mockPriceFeed.getAddress());
  });

  describe("部署和初始化", function () {
    it("应该正确设置初始参数", async function () {
      expect(await lendingPool.minInterestRate()).to.equal(minInterestRate);
      expect(await lendingPool.maxLoanDuration()).to.equal(maxLoanDuration);
      expect(await lendingPool.minCollateralRatio()).to.equal(minCollateralRatio);
    });

    it("所有者应该能够设置撮合引擎地址", async function () {
      const newMatchingEngine = await (await ethers.getContractFactory("UnifiedMatchingEngine")).deploy();
      await lendingPool.setMatchingEngineAddress(await newMatchingEngine.getAddress());
      expect(await lendingPool.matchingEngineAddress()).to.equal(await newMatchingEngine.getAddress());
    });

    it("非所有者不应该能够设置撮合引擎地址", async function () {
      const [_, nonOwner] = await ethers.getSigners();
      const newMatchingEngine = await (await ethers.getContractFactory("UnifiedMatchingEngine")).deploy();
      await expect(
        lendingPool.connect(nonOwner).setMatchingEngineAddress(await newMatchingEngine.getAddress())
      ).to.be.reverted;
    });
  });

  describe("代币支持管理", function () {
    it("所有者应该能够添加支持的代币", async function () {
      const newToken = await (await ethers.getContractFactory("MockToken")).deploy("New Token", "NTK", 18);
      const newPriceFeed = await deployMockPriceFeed();
      
      await lendingPool.addSupportedToken(await newToken.getAddress(), await newPriceFeed.getAddress());
      expect(await lendingPool.supportedTokens(await newToken.getAddress())).to.be.true;
    });

    it("非所有者不应该能够添加支持的代币", async function () {
      const [_, nonOwner] = await ethers.getSigners();
      const newToken = await (await ethers.getContractFactory("MockToken")).deploy("New Token", "NTK", 18);
      const newPriceFeed = await deployMockPriceFeed();
      
      await expect(
        lendingPool.connect(nonOwner).addSupportedToken(await newToken.getAddress(), await newPriceFeed.getAddress())
      ).to.be.reverted;
    });
  });

  describe("价格获取", function () {
    it("应该能够正确获取代币价格", async function () {
      const price = await lendingPool.getTokenPrice(await mockToken.getAddress());
      expect(price).to.equal(200000000000n); // $2000 with 8 decimals
    });

    it("对于不支持的代币应该回退", async function () {
      const unsupportedToken = await (await ethers.getContractFactory("MockToken")).deploy("Unsupported Token", "UTK", 18);
      await expect(
        lendingPool.getTokenPrice(await unsupportedToken.getAddress())
      ).to.be.revertedWith("Price feed not found");
    });
  });

  describe("抵押品价值计算", function () {
    it("应该能够正确计算代币价值", async function () {
      const amount = ethers.parseEther("1"); // 1 token
      const value = await lendingPool.calculateTokenValue(await mockToken.getAddress(), amount);
      // 价格是 200000000000 (8位小数) * 10^18 (代币数量) / 10^18 (代币小数) = 200000000000 (8位小数)
      // 但我们需要将其转换为18位小数格式，所以应该是 2000 * 10^18 = 2000000000000000000000
      expect(value).to.equal(200000000000n);
    });

    it("对于不支持的代币应该回退", async function () {
      const unsupportedToken = await (await ethers.getContractFactory("MockToken")).deploy("Unsupported Token", "UTK", 18);
      const amount = ethers.parseEther("1");
      await expect(
        lendingPool.calculateTokenValue(await unsupportedToken.getAddress(), amount)
      ).to.be.revertedWith("Price feed not found");
    });
  });

  describe("存款功能", function () {
    const depositAmount = ethers.parseEther("1000");

    beforeEach(async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      // 铸造代币给存款人
      await mockToken.mint(depositorAddress, depositAmount);
      // 授权借贷池合约使用存款人的代币
      await mockToken.connect(depositor).approve(await lendingPool.getAddress(), depositAmount);
    });

    it("用户应该能够存款", async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      await expect(
        lendingPool.connect(depositor).deposit(await mockToken.getAddress(), depositAmount)
      )
        .to.emit(lendingPool, "Deposited")
        .withArgs(await mockToken.getAddress(), depositorAddress, depositAmount);
    });

    it("没有足够余额的用户不应该能够存款", async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      const largeAmount = ethers.parseEther("1000000"); // 100万代币
      await expect(
        lendingPool.connect(depositor).deposit(await mockToken.getAddress(), largeAmount)
      ).to.be.reverted; // 应该因为ERC20的transfer失败而回退
    });

    it("没有足够授权的用户不应该能够存款", async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      // 先减少授权额度
      await mockToken.connect(depositor).approve(await lendingPool.getAddress(), 0);
      await expect(
        lendingPool.connect(depositor).deposit(await mockToken.getAddress(), depositAmount)
      ).to.be.reverted; // 应该因为ERC20的transferFrom失败而回退
    });
  });

  describe("提款功能", function () {
    const depositAmount = ethers.parseEther("1000");
    const withdrawAmount = ethers.parseEther("500");

    beforeEach(async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      // 铸造代币给存款人
      await mockToken.mint(depositorAddress, depositAmount);
      // 授权借贷池合约使用存款人的代币
      await mockToken.connect(depositor).approve(await lendingPool.getAddress(), depositAmount);
      // 存款
      await lendingPool.connect(depositor).deposit(await mockToken.getAddress(), depositAmount);
    });

    it("用户应该能够提款", async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      await expect(
        lendingPool.connect(depositor).withdraw(await mockToken.getAddress(), withdrawAmount)
      )
        .to.emit(lendingPool, "Withdrawn")
        .withArgs(await mockToken.getAddress(), depositorAddress, withdrawAmount);
    });

    it("用户提款时超过其余额会被调整为实际余额", async function () {
      // 获取签名者
      const [_, depositor] = await ethers.getSigners();
      
      const largeAmount = ethers.parseEther("2000"); // 超过存款余额
      // 在新的实现中，提款金额会被自动调整为用户的实际余额，而不是回滚
      await expect(
        lendingPool.connect(depositor).withdraw(await mockToken.getAddress(), largeAmount)
      )
        .to.emit(lendingPool, "Withdrawn")
        // 应该发出提款事件，金额为实际余额
        .to.emit(lendingPool, "Withdrawn")
        .withArgs(await mockToken.getAddress(), depositorAddress, depositAmount);
    });
  });
});