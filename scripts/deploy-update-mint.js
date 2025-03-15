const { spawn } = require('child_process');
const path = require('path');

// 配置
const NETWORK = process.argv[2] || 'localhost';
const RECIPIENT = process.argv[3]; // 可选的接收者地址

// 执行命令并返回Promise
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`执行命令: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 主函数
async function main() {
  try {
    console.log(`\n=== 开始部署合约到 ${NETWORK} 网络、更新前端配置并发放测试代币 ===\n`);
    
    // 1. 部署合约
    console.log(`\n--- 步骤 1: 部署合约到 ${NETWORK} 网络 ---\n`);
    await executeCommand('npx', ['hardhat', 'deploy', '--network', NETWORK]);
    
    // 2. 更新前端配置
    console.log(`\n--- 步骤 2: 更新前端配置 ---\n`);
    await executeCommand('node', [path.join(__dirname, 'simple-update-config.js'), NETWORK]);
    
    // 3. 发放测试代币
    console.log(`\n--- 步骤 3: 发放测试代币 ---\n`);
    const mintCommand = RECIPIENT 
      ? `RECIPIENT=${RECIPIENT} npx hardhat run ${path.join(__dirname, 'mint-test-tokens.ts')} --network ${NETWORK}`
      : `npx hardhat run ${path.join(__dirname, 'mint-test-tokens.ts')} --network ${NETWORK}`;
    await executeCommand(mintCommand, [], { shell: true });
    
    // 4. 发放测试ETH（如果指定了接收者地址）
    if (RECIPIENT) {
      console.log(`\n--- 步骤 4: 发放测试ETH ---\n`);
      await executeCommand(`RECIPIENT=${RECIPIENT} AMOUNT=5 npx hardhat run ${path.join(__dirname, 'send-test-eth.ts')} --network ${NETWORK}`, [], { shell: true });
    }
    
    console.log(`\n=== 部署、配置更新和代币发放完成! ===\n`);
    
  } catch (error) {
    console.error(`\n错误: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 