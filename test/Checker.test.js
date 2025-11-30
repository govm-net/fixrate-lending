const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Checker Contracts", function () {
  let personalChecker;
  let poolChecker;
  let lendingPool;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // First deploy a mock lending pool
    const FixedRateLendingPool = await ethers.getContractFactory("FixedRateLendingPool");
    lendingPool = await FixedRateLendingPool.deploy(
      500, // minInterestRate (5%)
      365 * 24 * 60 * 60, // maxLoanDuration (1 year)
      15000 // minCollateralRatio (150%)
    );

    // Deploy PersonalChecker
    const PersonalChecker = await ethers.getContractFactory("PersonalChecker");
    personalChecker = await PersonalChecker.deploy();

    // Deploy PoolChecker with the lending pool address
    const PoolChecker = await ethers.getContractFactory("PoolChecker");
    poolChecker = await PoolChecker.deploy(await lendingPool.getAddress());
  });

  describe("PersonalChecker", function () {
    it("Should deploy successfully", async function () {
      expect(await personalChecker.getAddress()).to.properAddress;
    });

    it("Should return correct checker info", async function () {
      const [name, version] = await personalChecker.getCheckerInfo();
      expect(name).to.equal("PersonalChecker");
      expect(version).to.equal("1.0.0");  // Updated to match contract
    });

    it("Should verify lender order with valid signature", async function () {
      // Create test data
      const lender = addr1;
      const borrower = addr2;
      const lendToken = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // UNI token address
      const lendAmount = ethers.parseEther("100");
      const collateralToken = "0xa0b86a33e6441b8435b662c8d8b0b8b8b8b8b8b8"; // Fixed checksum
      const collateralAmount = ethers.parseEther("150");
      const interestRate = 1000; // 10%
      const duration = 30 * 24 * 60 * 60; // 30 days
      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const nonce = 1;

      // Create signature
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

      const value = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: lendToken,
        lendAmount: lendAmount,
        collateralToken: collateralToken,
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: duration,
        expiry: expiry,
        nonce: nonce
      };

      const signature = await lender.signTypedData(domain, types, value);

      // Verify signature
      const params = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: lendToken,
        lendAmount: lendAmount,
        collateralToken: collateralToken,
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: duration,
        expiry: expiry,
        nonce: nonce,
        signature: signature
      };

      expect(await personalChecker.verifyLenderOrder(params)).to.be.true;
    });

    it("Should verify borrower order with valid signature", async function () {
      // Create test data
      const lender = addr1;
      const borrower = addr2;
      const lendToken = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // UNI token address
      const lendAmount = ethers.parseEther("100");
      const collateralToken = "0xa0b86a33e6441b8435b662c8d8b0b8b8b8b8b8b8"; // Fixed checksum
      const collateralAmount = ethers.parseEther("150");
      const interestRate = 1000; // 10%
      const duration = 30 * 24 * 60 * 60; // 30 days
      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const nonce = 1;

      // Create signature
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

      const value = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: lendToken,
        lendAmount: lendAmount,
        collateralToken: collateralToken,
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: duration,
        expiry: expiry,
        nonce: nonce
      };

      const signature = await borrower.signTypedData(domain, types, value);

      // Verify signature
      const params = {
        checker: await personalChecker.getAddress(),
        lender: lender.address,
        borrower: borrower.address,
        lendToken: lendToken,
        lendAmount: lendAmount,
        collateralToken: collateralToken,
        collateralAmount: collateralAmount,
        interestRate: interestRate,
        duration: duration,
        expiry: expiry,
        nonce: nonce,
        signature: signature
      };

      expect(await personalChecker.verifyBorrowerOrder(params)).to.be.true;
    });
  });

  describe("PoolChecker", function () {
    it("Should deploy successfully", async function () {
      expect(await poolChecker.getAddress()).to.properAddress;
    });

    it("Should return correct checker info", async function () {
      const [name, version] = await poolChecker.getCheckerInfo();
      expect(name).to.equal("PoolChecker");
      expect(version).to.equal("1.0.0");
    });

    it("Should verify lender order correctly", async function () {
      // For now, just test that it doesn't throw an error
      // A more comprehensive test would require setting up a full lending scenario
      const params = {
        checker: await poolChecker.getAddress(),
        lender: owner.address,
        borrower: addr1.address,
        lendToken: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI token address
        lendAmount: ethers.parseEther("100"),
        collateralToken: "0xa0b86a33e6441b8435b662c8d8b0b8b8b8b8b8b8", // Fixed checksum
        collateralAmount: ethers.parseEther("150"),
        interestRate: 1000, // 10%
        duration: 30 * 24 * 60 * 60, // 30 days
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        nonce: 1,
        signature: "0x"
      };

      // Since the lending pool is not properly set up with tokens and prices,
      // the verification should return false rather than throwing an error
      expect(await poolChecker.verifyLenderOrder(params)).to.be.false;
    });

    it("Should always reject borrower orders", async function () {
      const params = {
        checker: await poolChecker.getAddress(),
        lender: owner.address,
        borrower: addr1.address,
        lendToken: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI token address
        lendAmount: ethers.parseEther("100"),
        collateralToken: "0xa0b86a33e6441b8435b662c8d8b0b8b8b8b8b8b8", // Fixed checksum
        collateralAmount: ethers.parseEther("150"),
        interestRate: 1000, // 10%
        duration: 30 * 24 * 60 * 60, // 30 days
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        nonce: 1,
        signature: "0x"
      };

      expect(await poolChecker.verifyBorrowerOrder(params)).to.be.false;
    });
  });
});