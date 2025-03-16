import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying FixedRateLendingPool with the account: ${deployer}`);
  console.log(`Network: ${network.name}`);

  // 从环境变量获取参数，如果没有则使用默认值
  const minInterestRate = process.env.MIN_INTEREST_RATE 
    ? ethers.parseUnits(process.env.MIN_INTEREST_RATE, 16) 
    : ethers.parseUnits("5", 16); // 默认 5% 年利率
  
  const maxLoanDuration = process.env.MAX_LOAN_DURATION 
    ? parseInt(process.env.MAX_LOAN_DURATION) 
    : 60 * 60 * 24 * 365; // 默认 1年（以秒为单位）
  
  const minCollateralRatio = process.env.MIN_COLLATERAL_RATIO 
    ? ethers.parseUnits(process.env.MIN_COLLATERAL_RATIO, 16) 
    : ethers.parseUnits("150", 16); // 默认 150% 抵押率

  console.log(`Deployment parameters:`);
  console.log(`- Min Interest Rate: ${ethers.formatUnits(minInterestRate, 16)}%`);
  console.log(`- Max Loan Duration: ${maxLoanDuration} seconds (${maxLoanDuration / (60 * 60 * 24)} days)`);
  console.log(`- Min Collateral Ratio: ${ethers.formatUnits(minCollateralRatio, 16)}%`);

  // 部署 FixedRateLendingPool 合约
  const lendingPool = await deploy("FixedRateLendingPool", {
    from: deployer,
    args: [minInterestRate, maxLoanDuration, minCollateralRatio],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  console.log(`FixedRateLendingPool deployed at: ${lendingPool.address}`);
};

func.tags = ["LendingPool", "Core", "All"];
func.skip = async (hre) => {
  // 如果明确指定不部署借贷池合约，则跳过
  return process.env.DEPLOY_LENDING_POOL === "false";
};

export default func; 