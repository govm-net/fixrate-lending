import { task } from "hardhat/config";
import fs from "fs";
import path from "path";

task("deploy-update-mint", "部署合约、更新前端配置并发放测试代币")
  .addOptionalParam("tags", "部署标签，用逗号分隔", "All")
  .addOptionalParam("net", "要部署的网络名称", "localhost")
  .addOptionalParam("recipient", "接收测试代币的地址")
  .addOptionalParam("amount", "发放的代币数量", "1000")
  .addOptionalParam("eth", "发放的ETH数量", "5")
  .setAction(async (taskArgs, hre) => {
    const { run, network, ethers } = hre;
    const networkName = taskArgs.net || network.name;
    const tags = taskArgs.tags.split(",").map((tag: string) => tag.trim());
    const recipient = taskArgs.recipient;
    const tokenAmount = taskArgs.amount;
    const ethAmount = taskArgs.eth;
    
    console.log(`\n=== 开始部署合约到 ${networkName} 网络、更新前端配置并发放测试代币 ===\n`);
    
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
    
    // 3. 获取部署的代币地址
    if (recipient) {
      console.log(`\n--- 步骤 3: 获取部署的代币地址 ---\n`);
      
      const deploymentsDir = path.join(__dirname, "../deployments", networkName);
      
      if (!fs.existsSync(deploymentsDir)) {
        console.log(`网络 ${networkName} 的部署信息不存在，跳过发放测试代币步骤`);
        return;
      }
      
      const files = fs.readdirSync(deploymentsDir);
      const tokenAddresses: { [key: string]: string } = {};
      
      // 查找 MockUSDC, MockDAI, MockWETH, MockWBTC
      const mockTokens = ['MockUSDC', 'MockDAI', 'MockWETH', 'MockWBTC'];
      for (const tokenName of mockTokens) {
        const tokenFile = files.find(file => file.startsWith(tokenName) && file.endsWith('.json'));
        if (tokenFile) {
          const tokenData = JSON.parse(fs.readFileSync(path.join(deploymentsDir, tokenFile), 'utf8'));
          tokenAddresses[tokenName] = tokenData.address;
          console.log(`找到代币 ${tokenName}: ${tokenData.address}`);
        }
      }
      
      // 4. 发放测试代币
      if (Object.keys(tokenAddresses).length > 0) {
        console.log(`\n--- 步骤 4: 发放测试代币到 ${recipient} ---\n`);
        
        // 发放USDC
        if (tokenAddresses.MockUSDC) {
          try {
            await run("mint-test-tokens", { 
              token: tokenAddresses.MockUSDC, 
              to: recipient, 
              amount: tokenAmount
            });
            console.log(`已发放 ${tokenAmount} USDC 到 ${recipient}`);
          } catch (error: any) {
            console.error(`发放USDC时出错: ${error.message || error}`);
          }
        }
        
        // 发放DAI
        if (tokenAddresses.MockDAI) {
          try {
            await run("mint-test-tokens", { 
              token: tokenAddresses.MockDAI, 
              to: recipient, 
              amount: tokenAmount
            });
            console.log(`已发放 ${tokenAmount} DAI 到 ${recipient}`);
          } catch (error: any) {
            console.error(`发放DAI时出错: ${error.message || error}`);
          }
        }
        
        // 发放WETH
        if (tokenAddresses.MockWETH) {
          try {
            await run("mint-test-tokens", { 
              token: tokenAddresses.MockWETH, 
              to: recipient, 
              amount: "10" // 较少的WETH
            });
            console.log(`已发放 10 WETH 到 ${recipient}`);
          } catch (error: any) {
            console.error(`发放WETH时出错: ${error.message || error}`);
          }
        }
        
        // 发放WBTC
        if (tokenAddresses.MockWBTC) {
          try {
            await run("mint-test-tokens", { 
              token: tokenAddresses.MockWBTC, 
              to: recipient, 
              amount: "1" // 较少的WBTC
            });
            console.log(`已发放 1 WBTC 到 ${recipient}`);
          } catch (error: any) {
            console.error(`发放WBTC时出错: ${error.message || error}`);
          }
        }
        
        // 5. 发放测试ETH
        console.log(`\n--- 步骤 5: 发放测试ETH到 ${recipient} ---\n`);
        try {
          await run("send-test-eth", { 
            to: recipient, 
            amount: ethAmount
          });
          console.log(`已发放 ${ethAmount} ETH 到 ${recipient}`);
        } catch (error: any) {
          console.error(`发放ETH时出错: ${error.message || error}`);
        }
      } else {
        console.log(`未找到部署的代币地址，跳过发放测试代币步骤`);
      }
    } else {
      console.log(`\n未指定接收者地址，跳过发放测试代币和ETH步骤`);
      console.log(`您可以通过以下命令手动发放测试代币和ETH:`);
      console.log(`npx hardhat mint-test-tokens --token <代币地址> --to <接收者地址> --amount 1000 --network ${networkName}`);
      console.log(`npx hardhat send-test-eth --to <接收者地址> --amount 5 --network ${networkName}`);
    }
    
    console.log(`\n=== 部署、配置更新和代币发放完成! ===\n`);
  }); 