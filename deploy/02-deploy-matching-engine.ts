import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying UnifiedMatchingEngine with the account: ${deployer}`);

  // 部署 UnifiedMatchingEngine 合约
  const matchingEngine = await deploy("UnifiedMatchingEngine", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`UnifiedMatchingEngine deployed at: ${matchingEngine.address}`);
};

func.tags = ["MatchingEngine", "Core", "All"];

export default func;