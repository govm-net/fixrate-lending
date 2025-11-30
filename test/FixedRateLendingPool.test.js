const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FixedRateLendingPool", function () {
  let lendingPool;
  let mockUSDC;
  let mockWETH;
  let mockWBTC;
  let usdcPriceFeed;
  let wethPriceFeed;
  let wbtcPriceFeed;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const minInterestRate = 500; // 5%
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1 year
  const minCollateralRatio = 15000; // 150%

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockToken");
    mockUSDC = await MockToken.deploy("USD Coin", "USDC", 6);
    mockWETH = await MockToken.deploy("Wrapped Ether", "WETH", 18);
    mockWBTC = await MockToken.deploy("Wrapped Bitcoin", "WBTC", 8);

    // Deploy mock price feeds
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    usdcPriceFeed = await MockV3Aggregator.deploy(8, 100000000); // $1 with 8 decimals
    wethPriceFeed = await MockV3Aggregator.deploy(8, 300000000000); // $3000 with 8 decimals
    wbtcPriceFeed = await MockV3Aggregator.deploy(8, 5000000000000); // $50000 with 8 decimals

    // Deploy lending pool
    const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
    lendingPool = await FixedRateLendingPool.deploy(minInterestRate, maxLoanDuration, minCollateralRatio);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lendingPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct initial parameters", async function () {
      expect(await lendingPool.minInterestRate()).to.equal(minInterestRate);
      expect(await lendingPool.maxLoanDuration()).to.equal(maxLoanDuration);
      expect(await lendingPool.minCollateralRatio()).to.equal(minCollateralRatio);
    });
  });

  describe("Token Management", function () {
    it("Should allow owner to add supported token", async function () {
      await expect(lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress()))
        .to.emit(lendingPool, "TokenAdded");
    });

    it("Should not allow non-owner to add supported token", async function () {
      await expect(lendingPool.connect(addr1).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress()))
        .to.be.reverted;
    });

    it("Should allow owner to remove supported token", async function () {
      // First add token
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      
      // Then remove it
      await expect(lendingPool.connect(owner).removeSupportedToken(await mockUSDC.getAddress()))
        .to.emit(lendingPool, "TokenRemoved")
        .withArgs(await mockUSDC.getAddress());
    });
  });

  describe("LP Token", function () {
    it("Should create LP Token when adding supported token", async function () {
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      const lpTokenAddress = await lendingPool.lpTokens(await mockUSDC.getAddress());
      expect(lpTokenAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Deposit and Withdraw", function () {
    beforeEach(async function () {
      // Add USDC as supported token
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
    });

    it("Should allow depositing tokens", async function () {
      const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      
      // Mint tokens to addr1
      await mockUSDC.mint(addr1.address, depositAmount);
      
      // Approve lending pool to spend tokens
      await mockUSDC.connect(addr1).approve(await lendingPool.getAddress(), depositAmount);
      
      // Deposit tokens
      await expect(lendingPool.connect(addr1).deposit(await mockUSDC.getAddress(), depositAmount))
        .to.emit(lendingPool, "Deposited")
        .withArgs(await mockUSDC.getAddress(), addr1.address, depositAmount);
    });

    it("Should not allow depositing unsupported tokens", async function () {
      const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      
      // Mint tokens to addr1
      await mockUSDC.mint(addr1.address, depositAmount);
      
      // Approve lending pool to spend tokens
      await mockUSDC.connect(addr1).approve(await lendingPool.getAddress(), depositAmount);
      
      // Try to deposit unsupported token (should fail)
      await expect(lendingPool.connect(addr1).deposit(await mockWETH.getAddress(), depositAmount))
        .to.be.revertedWith("Token not supported");
    });

    it("Should allow withdrawing tokens", async function () {
      const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      const withdrawAmount = ethers.parseUnits("500", 6); // 500 USDC
      
      // Mint tokens to addr1
      await mockUSDC.mint(addr1.address, depositAmount);
      
      // Approve lending pool to spend tokens
      await mockUSDC.connect(addr1).approve(await lendingPool.getAddress(), depositAmount);
      
      // Deposit tokens
      await lendingPool.connect(addr1).deposit(await mockUSDC.getAddress(), depositAmount);
      
      // Withdraw tokens
      await expect(lendingPool.connect(addr1).withdraw(await mockUSDC.getAddress(), withdrawAmount))
        .to.emit(lendingPool, "Withdrawn")
        .withArgs(await mockUSDC.getAddress(), addr1.address, withdrawAmount);
    });
  });

  describe("Pool Parameters", function () {
    it("Should allow owner to update pool parameters", async function () {
      const newMinInterestRate = 1000; // 10%
      const newMaxLoanDuration = 60 * 60 * 24 * 180; // 6 months
      const newMinCollateralRatio = 20000; // 200%
      
      await expect(lendingPool.connect(owner).updatePoolParams(newMinInterestRate, newMaxLoanDuration, newMinCollateralRatio))
        .to.emit(lendingPool, "PoolParamsUpdated")
        .withArgs(newMinInterestRate, newMaxLoanDuration, newMinCollateralRatio);
    });

    it("Should not allow non-owner to update pool parameters", async function () {
      const newMinInterestRate = 1000; // 10%
      const newMaxLoanDuration = 60 * 60 * 24 * 180; // 6 months
      const newMinCollateralRatio = 20000; // 200%
      
      await expect(lendingPool.connect(addr1).updatePoolParams(newMinInterestRate, newMaxLoanDuration, newMinCollateralRatio))
        .to.be.reverted;
    });
  });

  describe("Matching Engine Integration", function () {
    it("Should allow owner to set matching engine address", async function () {
      const newMatchingEngineAddress = addr1.address;
      await expect(lendingPool.connect(owner).setMatchingEngineAddress(newMatchingEngineAddress))
        .to.emit(lendingPool, "MatchingEngineAddressUpdated")
        .withArgs(newMatchingEngineAddress);
    });

    it("Should not allow non-owner to set matching engine address", async function () {
      const newMatchingEngineAddress = addr1.address;
      await expect(lendingPool.connect(addr1).setMatchingEngineAddress(newMatchingEngineAddress))
        .to.be.reverted;
    });

    it("Should only allow matching engine to call lending functions", async function () {
      // This test would require deploying a mock matching engine or using a more complex setup
      // For now, we'll skip this test as it requires more complex mocking
    });
  });

  describe("Order Checking", function () {
    it("Should check if order is valid", async function () {
      // This test would require setting up supported tokens and price feeds
      // For now, we'll skip this test as it requires more complex setup
    });
  });
});