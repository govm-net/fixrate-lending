import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 检查是否为测试网络
  const isTestnet = process.env.NETWORK_TYPE === "testnet" || 
                    network.name === "hardhat" || 
                    network.name === "localhost" || 
                    network.name.includes("test") || 
                    network.name === "sepolia" || 
                    network.name === "mumbai";

  console.log(`Deploying contracts with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);
  console.log(`Is testnet: ${isTestnet}`);

  // 部署 P2PLendingMarketplace 合约
  const marketplace = await deploy("P2PLendingMarketplace", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  console.log(`P2PLendingMarketplace deployed at: ${marketplace.address}`);

  // 部署 FixedRateLendingPool 合约
  const minInterestRate = ethers.parseUnits("5", 16); // 5% 年利率
  const maxLoanDuration = 60 * 60 * 24 * 365; // 1年（以秒为单位）
  const minCollateralRatio = ethers.parseUnits("150", 16); // 150% 抵押率

  const lendingPool = await deploy("FixedRateLendingPool", {
    from: deployer,
    args: [minInterestRate, maxLoanDuration, minCollateralRatio],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  console.log(`FixedRateLendingPool deployed at: ${lendingPool.address}`);

  // 设置 marketplace 地址到 lending pool
  if (marketplace.newlyDeployed || lendingPool.newlyDeployed) {
    const lendingPoolContract = await ethers.getContractAt("FixedRateLendingPool", lendingPool.address);
    const tx = await lendingPoolContract.setMarketplaceAddress(marketplace.address);
    await tx.wait();
    console.log(`Set marketplace address ${marketplace.address} in lending pool`);
  }

  // 如果是测试网络，部署模拟代币和价格预言机
  if (isTestnet) {
    // 部署 USDC 模拟代币
    const usdcToken = await deploy("MockERC20", {
      from: deployer,
      args: ["USD Coin", "USDC", 6],
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
      contract: "MockERC20", // 确保使用正确的合约名称
    });
    console.log(`Mock USDC deployed at: ${usdcToken.address}`);

    // 部署 DAI 模拟代币
    const daiToken = await deploy("MockERC20", {
      from: deployer,
      args: ["Dai Stablecoin", "DAI", 18],
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
      contract: "MockERC20", // 确保使用正确的合约名称
    });
    console.log(`Mock DAI deployed at: ${daiToken.address}`);

    // 部署 WETH 模拟代币
    const wethToken = await deploy("MockERC20", {
      from: deployer,
      args: ["Wrapped Ether", "WETH", 18],
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
      contract: "MockERC20", // 确保使用正确的合约名称
    });
    console.log(`Mock WETH deployed at: ${wethToken.address}`);

    // 部署 WBTC 模拟代币
    const wbtcToken = await deploy("MockERC20", {
      from: deployer,
      args: ["Wrapped Bitcoin", "WBTC", 8],
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
      contract: "MockERC20", // 确保使用正确的合约名称
    });
    console.log(`Mock WBTC deployed at: ${wbtcToken.address}`);

    // 打印所有代币地址，方便更新前端配置
    console.log("\n=== Token Addresses for Frontend Configuration ===");
    console.log(`USDC: ${usdcToken.address}`);
    console.log(`DAI: ${daiToken.address}`);
    console.log(`WETH: ${wethToken.address}`);
    console.log(`WBTC: ${wbtcToken.address}`);
    console.log("=================================================\n");

    // 部署价格预言机
    const usdcPriceFeed = await deploy("MockV3Aggregator", {
      from: deployer,
      args: [8, ethers.parseUnits("1", 8)], // 8位小数，1 USD
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
    });
    console.log(`USDC Price Feed deployed at: ${usdcPriceFeed.address}`);

    const ethPriceFeed = await deploy("MockV3Aggregator", {
      from: deployer,
      args: [8, ethers.parseUnits("2000", 8)], // 8位小数，2000 USD
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
    });
    console.log(`ETH Price Feed deployed at: ${ethPriceFeed.address}`);

    const btcPriceFeed = await deploy("MockV3Aggregator", {
      from: deployer,
      args: [8, ethers.parseUnits("30000", 8)], // 8位小数，30000 USD
      log: true,
      waitConfirmations: network.name === "hardhat" ? 1 : 2,
    });
    console.log(`BTC Price Feed deployed at: ${btcPriceFeed.address}`);

    // 将代币添加到借贷池
    const lendingPoolContract = await ethers.getContractAt("FixedRateLendingPool", lendingPool.address);
    
    try {
      // 添加 USDC 作为支持的代币
      const isUsdcSupported = await lendingPoolContract.supportedTokens(usdcToken.address);
      if (!isUsdcSupported) {
        const tx1 = await lendingPoolContract.addSupportedToken(usdcToken.address, usdcPriceFeed.address);
        await tx1.wait();
        console.log(`Added USDC to supported tokens with price feed ${usdcPriceFeed.address}`);
      }

      // 添加 DAI 作为支持的代币
      const isDaiSupported = await lendingPoolContract.supportedTokens(daiToken.address);
      if (!isDaiSupported) {
        const tx2 = await lendingPoolContract.addSupportedToken(daiToken.address, usdcPriceFeed.address);
        await tx2.wait();
        console.log(`Added DAI to supported tokens with price feed ${usdcPriceFeed.address}`);
      }

      // 添加 WETH 作为支持的代币
      const isWethSupported = await lendingPoolContract.supportedTokens(wethToken.address);
      if (!isWethSupported) {
        const tx3 = await lendingPoolContract.addSupportedToken(wethToken.address, ethPriceFeed.address);
        await tx3.wait();
        console.log(`Added WETH to supported tokens with price feed ${ethPriceFeed.address}`);
      }

      // 添加 WBTC 作为支持的代币
      const isWbtcSupported = await lendingPoolContract.supportedTokens(wbtcToken.address);
      if (!isWbtcSupported) {
        const tx4 = await lendingPoolContract.addSupportedToken(wbtcToken.address, btcPriceFeed.address);
        await tx4.wait();
        console.log(`Added WBTC to supported tokens with price feed ${btcPriceFeed.address}`);
      }
    } catch (error) {
      console.error("Error adding supported tokens:", error);
    }

    // 为测试账户铸造一些代币
    const usdcContract = await ethers.getContractAt("MockERC20", usdcToken.address);
    const daiContract = await ethers.getContractAt("MockERC20", daiToken.address);
    const wethContract = await ethers.getContractAt("MockERC20", wethToken.address);
    const wbtcContract = await ethers.getContractAt("MockERC20", wbtcToken.address);

    // 铸造 10,000 USDC
    await usdcContract.mint(deployer, ethers.parseUnits("10000", 6));
    console.log(`Minted 10,000 USDC to ${deployer}`);

    // 铸造 10,000 DAI
    await daiContract.mint(deployer, ethers.parseUnits("10000", 18));
    console.log(`Minted 10,000 DAI to ${deployer}`);

    // 铸造 10 WETH
    await wethContract.mint(deployer, ethers.parseEther("10"));
    console.log(`Minted 10 WETH to ${deployer}`);

    // 铸造 1 WBTC
    await wbtcContract.mint(deployer, ethers.parseUnits("1", 8));
    console.log(`Minted 1 WBTC to ${deployer}`);
  }

  return true;
};

func.id = "deploy_lending_contracts";
func.tags = ["LendingContracts"];
export default func; 