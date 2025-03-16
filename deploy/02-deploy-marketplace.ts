import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying P2PLendingMarketplace with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);

  // 部署 P2PLendingMarketplace 合约
  const marketplace = await deploy("P2PLendingMarketplace", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  console.log(`P2PLendingMarketplace deployed at: ${marketplace.address}`);
};

func.tags = ["Marketplace", "Core", "All"];
func.skip = async (hre) => {
  // 如果明确指定不部署市场合约，则跳过
  return process.env.DEPLOY_MARKETPLACE === "false";
};

export default func; 