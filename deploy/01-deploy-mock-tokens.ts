import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

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

  console.log(`Deploying mock tokens with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);
  console.log(`Is testnet: ${isTestnet}`);

  // 只在测试网络上部署模拟代币
  if (!isTestnet) {
    console.log("Skipping mock token deployment on non-testnet");
    return;
  }

  // 部署 USDC 模拟代币
  const usdcToken = await deploy("MockUSDC", {
    from: deployer,
    args: ["USD Coin", "USDC", 6],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
    contract: "MockERC20", // 使用 MockERC20 合约但命名为 MockUSDC
  });
  console.log(`Mock USDC deployed at: ${usdcToken.address}`);

  // 部署 DAI 模拟代币
  const daiToken = await deploy("MockDAI", {
    from: deployer,
    args: ["Dai Stablecoin", "DAI", 18],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
    contract: "MockERC20", // 使用 MockERC20 合约但命名为 MockDAI
  });
  console.log(`Mock DAI deployed at: ${daiToken.address}`);

  // 部署 WETH 模拟代币
  const wethToken = await deploy("MockWETH", {
    from: deployer,
    args: ["Wrapped Ether", "WETH", 18],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
    contract: "MockERC20", // 使用 MockERC20 合约但命名为 MockWETH
  });
  console.log(`Mock WETH deployed at: ${wethToken.address}`);

  // 部署 WBTC 模拟代币
  const wbtcToken = await deploy("MockWBTC", {
    from: deployer,
    args: ["Wrapped Bitcoin", "WBTC", 8],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
    contract: "MockERC20", // 使用 MockERC20 合约但命名为 MockWBTC
  });
  console.log(`Mock WBTC deployed at: ${wbtcToken.address}`);

  // 打印所有代币地址，方便更新前端配置
  console.log("\n=== Token Addresses for Frontend Configuration ===");
  console.log(`USDC: ${usdcToken.address}`);
  console.log(`DAI: ${daiToken.address}`);
  console.log(`WETH: ${wethToken.address}`);
  console.log(`WBTC: ${wbtcToken.address}`);
  console.log("===================================================\n");
};

func.tags = ["MockTokens", "Tokens", "All"];
func.skip = async (hre) => {
  // 如果明确指定不部署模拟代币，则跳过
  return process.env.DEPLOY_MOCK_TOKENS === "false";
};

export default func; 