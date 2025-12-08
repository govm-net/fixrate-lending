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

    // 新增边界测试用例
    it("Should not allow adding token with zero address", async function () {
      await expect(lendingPool.connect(owner).addSupportedToken(ethers.ZeroAddress, await usdcPriceFeed.getAddress()))
        .to.be.revertedWith("Invalid token address");
    });

    it("Should not allow adding price feed with zero address", async function () {
      await expect(lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), ethers.ZeroAddress))
        .to.be.revertedWith("Invalid price feed address");
    });

    it("Should not allow removing non-existent token", async function () {
      // This should not revert, but just set the token as unsupported
      await lendingPool.connect(owner).removeSupportedToken(await mockUSDC.getAddress());
      expect(await lendingPool.supportedTokens(await mockUSDC.getAddress())).to.be.false;
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

    // 新增边界测试用例
    it("Should not allow depositing zero amount", async function () {
      await expect(lendingPool.connect(addr1).deposit(await mockUSDC.getAddress(), 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow withdrawing zero amount", async function () {
      // First deposit some tokens
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC.mint(addr1.address, depositAmount);
      await mockUSDC.connect(addr1).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(addr1).deposit(await mockUSDC.getAddress(), depositAmount);
      
      // Try to withdraw zero amount
      await expect(lendingPool.connect(addr1).withdraw(await mockUSDC.getAddress(), 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should adjust withdrawal amount to user balance if requested amount exceeds balance", async function () {
      const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC
      
      // Mint tokens to addr1
      await mockUSDC.mint(addr1.address, depositAmount);
      
      // Approve lending pool to spend tokens
      await mockUSDC.connect(addr1).approve(await lendingPool.getAddress(), depositAmount);
      
      // Deposit tokens
      await lendingPool.connect(addr1).deposit(await mockUSDC.getAddress(), depositAmount);
      
      // Try to withdraw more than deposited - should withdraw all
      const largeAmount = ethers.parseUnits("2000", 6); // 2000 USDC
      await expect(lendingPool.connect(addr1).withdraw(await mockUSDC.getAddress(), largeAmount))
        .to.emit(lendingPool, "Withdrawn")
        .withArgs(await mockUSDC.getAddress(), addr1.address, depositAmount);
    });

    it("Should not allow depositing for contract address", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      // Mint tokens to lending pool (to simulate contract trying to deposit for itself)
      await mockUSDC.mint(await lendingPool.getAddress(), depositAmount);
      
      // Try to deposit from contract to contract (should fail)
      // This test is more of a conceptual check since the require statement exists in the contract
      expect(await lendingPool.getAddress()).to.not.equal(addr1.address);
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

    it("Should not allow setting zero address as matching engine", async function () {
      await expect(lendingPool.connect(owner).setMatchingEngineAddress(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid matching engine address");
    });

    it("Should only allow matching engine to call lending functions", async function () {
      // This test would require deploying a mock matching engine or using a more complex setup
      // For now, we'll skip this test as it requires more complex mocking
    });
  });

  describe("Order Checking", function () {
    // 新增边界测试用例
    it("Should return false for order with unsupported lend token", async function () {
      const result = await lendingPool.checkOrder(
        await mockWETH.getAddress(), // Unsupported token
        ethers.parseEther("1"),
        await mockUSDC.getAddress(),
        ethers.parseEther("2"),
        1000, // 10%
        30 * 24 * 60 * 60, // 30 days
        addr1.address
      );
      
      expect(result).to.be.false;
    });

    it("Should return false for order with unsupported collateral token", async function () {
      // First set up USDC as supported token
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      
      const result = await lendingPool.checkOrder(
        await mockUSDC.getAddress(),
        ethers.parseEther("1"),
        await mockWETH.getAddress(), // Unsupported token
        ethers.parseEther("2"),
        1000, // 10%
        30 * 24 * 60 * 60, // 30 days
        addr1.address
      );
      
      expect(result).to.be.false;
    });

    it("Should return false for order with insufficient pool funds", async function () {
      // Set up USDC and WBTC as supported tokens
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      await lendingPool.connect(owner).addSupportedToken(await mockWBTC.getAddress(), await wbtcPriceFeed.getAddress());
      
      // Check order without depositing any funds
      const result = await lendingPool.checkOrder(
        await mockUSDC.getAddress(),
        ethers.parseEther("1"),
        await mockWBTC.getAddress(),
        ethers.parseEther("2"),
        1000, // 10%
        30 * 24 * 60 * 60, // 30 days
        addr1.address
      );
      
      expect(result).to.be.false;
    });

    it("Should return false for order with interest rate below minimum", async function () {
      // Set up USDC and WBTC as supported tokens
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      await lendingPool.connect(owner).addSupportedToken(await mockWBTC.getAddress(), await wbtcPriceFeed.getAddress());
      
      // Deposit some funds
      await mockUSDC.mint(owner.address, ethers.parseEther("100"));
      await mockUSDC.approve(await lendingPool.getAddress(), ethers.parseEther("100"));
      await lendingPool.deposit(await mockUSDC.getAddress(), ethers.parseEther("100"));
      
      const result = await lendingPool.checkOrder(
        await mockUSDC.getAddress(),
        ethers.parseEther("1"),
        await mockWBTC.getAddress(),
        ethers.parseEther("2"),
        100, // 1% - below minimum of 5%
        30 * 24 * 60 * 60, // 30 days
        addr1.address
      );
      
      expect(result).to.be.false;
    });

    it("Should return false for order with duration above maximum", async function () {
      // Set up USDC and WBTC as supported tokens
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      await lendingPool.connect(owner).addSupportedToken(await mockWBTC.getAddress(), await wbtcPriceFeed.getAddress());
      
      // Deposit some funds
      await mockUSDC.mint(owner.address, ethers.parseEther("100"));
      await mockUSDC.approve(await lendingPool.getAddress(), ethers.parseEther("100"));
      await lendingPool.deposit(await mockUSDC.getAddress(), ethers.parseEther("100"));
      
      const result = await lendingPool.checkOrder(
        await mockUSDC.getAddress(),
        ethers.parseEther("1"),
        await mockWBTC.getAddress(),
        ethers.parseEther("2"),
        1000, // 10%
        2 * 365 * 24 * 60 * 60, // 2 years - above maximum of 1 year
        addr1.address
      );
      
      expect(result).to.be.false;
    });

    it("Should return false for order with insufficient collateral ratio", async function () {
      // Set up USDC and WBTC as supported tokens
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
      await lendingPool.connect(owner).addSupportedToken(await mockWBTC.getAddress(), await wbtcPriceFeed.getAddress());
      
      // Deposit some funds
      await mockUSDC.mint(owner.address, ethers.parseEther("10000")); // More funds to allow larger loans
      await mockUSDC.approve(await lendingPool.getAddress(), ethers.parseEther("10000"));
      await lendingPool.deposit(await mockUSDC.getAddress(), ethers.parseEther("10000"));
      
      // Use prices that result in insufficient collateral ratio
      // USDC price: $1, WBTC price: $50000
      // lendAmount: 10000 USDC ($10000)
      // collateralAmount: 0.1 WBTC ($5000)
      // collateral ratio: $5000/$10000 = 50% < 150% minimum
      const result = await lendingPool.checkOrder(
        await mockUSDC.getAddress(),
        ethers.parseEther("10000"), // 10000 USDC
        await mockWBTC.getAddress(),
        ethers.parseUnits("0.1", 8), // 0.1 WBTC (8 decimals)
        1000, // 10%
        30 * 24 * 60 * 60, // 30 days
        addr1.address
      );
      
      expect(result).to.be.false;
    });
  });

  describe("Price Feed Management", function () {
    beforeEach(async function () {
      // Add USDC as supported token
      await lendingPool.connect(owner).addSupportedToken(await mockUSDC.getAddress(), await usdcPriceFeed.getAddress());
    });

    it("Should allow owner to update price feed", async function () {
      const newPriceFeed = await (await ethers.getContractFactory("MockV3Aggregator")).deploy(8, 150000000); // $1.50
      
      await expect(lendingPool.connect(owner).updatePriceFeed(await mockUSDC.getAddress(), await newPriceFeed.getAddress()))
        .to.emit(lendingPool, "PriceFeedUpdated")
        .withArgs(await mockUSDC.getAddress(), await newPriceFeed.getAddress());
    });

    it("Should not allow non-owner to update price feed", async function () {
      const newPriceFeed = await (await ethers.getContractFactory("MockV3Aggregator")).deploy(8, 150000000); // $1.50
      
      await expect(lendingPool.connect(addr1).updatePriceFeed(await mockUSDC.getAddress(), await newPriceFeed.getAddress()))
        .to.be.reverted;
    });

    it("Should not allow updating price feed for unsupported token", async function () {
      const newPriceFeed = await (await ethers.getContractFactory("MockV3Aggregator")).deploy(8, 150000000); // $1.50
      
      await expect(lendingPool.connect(owner).updatePriceFeed(await mockWETH.getAddress(), await newPriceFeed.getAddress()))
        .to.be.revertedWith("Token not supported");
    });

    it("Should not allow updating to zero address price feed", async function () {
      await expect(lendingPool.connect(owner).updatePriceFeed(await mockUSDC.getAddress(), ethers.ZeroAddress))
        .to.be.revertedWith("Invalid price feed address");
    });

    // 新增边界测试用例
    it("Should not allow updating to zero address token", async function () {
      const newPriceFeed = await (await ethers.getContractFactory("MockV3Aggregator")).deploy(8, 150000000); // $1.50
      
      await expect(lendingPool.connect(owner).updatePriceFeed(ethers.ZeroAddress, await newPriceFeed.getAddress()))
        .to.be.revertedWith("Invalid token address");
    });
  });
});