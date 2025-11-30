import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 部署 FixedRateLendingPoolWithLP 合约
  const lendingPool = await deploy("FixedRateLendingPoolWithLP", {
    from: deployer,
    args: [
      100, // minInterestRate (1% in basis points)
      30 * 24 * 60 * 60, // maxLoanDuration (30 days in seconds)
      15000 // minCollateralRatio (150% in basis points)
    ],
    log: true,
    autoMine: true,
  });

  console.log(`FixedRateLendingPoolWithLP deployed to: ${lendingPool.address}`);
};

func.tags = ["LendingPoolWithLP"];
func.dependencies = [];

export default func;