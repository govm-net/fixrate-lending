import { task } from "hardhat/config";

task("deploy-and-update", "部署合约并更新前端配置")
  .addOptionalParam("tags", "部署标签，用逗号分隔", "All")
  .addOptionalParam("net", "要部署的网络名称", "localhost")
  .setAction(async (taskArgs, hre) => {
    const { run, network } = hre;
    const networkName = taskArgs.net || network.name;
    const tags = taskArgs.tags.split(",").map((tag: string) => tag.trim());
    
    console.log(`\n=== 开始部署合约到 ${networkName} 网络并更新前端配置 ===\n`);
    
    // 1. 部署合约
    console.log(`\n--- 步骤 1: 部署合约到 ${networkName} 网络 ---\n`);
    
    try {
      // 使用 hardhat-deploy 插件部署合约
      await hre.deployments.run(tags, {
        resetMemory: true,
        deletePreviousDeployments: false,
        writeDeploymentsToFiles: true
      });
      
      console.log(`\n合约部署完成!`);
    } catch (error: any) {
      console.error(`\n部署合约时出错: ${error.message || error}`);
      return;
    }
    
    // 2. 更新前端配置
    console.log(`\n--- 步骤 2: 更新前端配置 ---\n`);
    
    try {
      // 调用更新前端配置的任务
      await run("update-frontend-config", { net: networkName });
      
      console.log(`\n前端配置更新完成!`);
    } catch (error: any) {
      console.error(`\n更新前端配置时出错: ${error.message || error}`);
    }
    
    console.log(`\n=== 部署和配置更新完成! ===\n`);
  }); 