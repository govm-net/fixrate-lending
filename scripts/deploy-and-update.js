const { spawn } = require('child_process');
const path = require('path');

// 配置
const NETWORK = process.argv[2] || 'localhost';

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
    console.log(`\n=== 开始部署合约到 ${NETWORK} 网络并更新前端配置 ===\n`);
    
    // 1. 部署合约
    console.log(`\n--- 步骤 1: 部署合约到 ${NETWORK} 网络 ---\n`);
    await executeCommand('npx', ['hardhat', 'deploy', '--network', NETWORK]);
    
    // 2. 更新前端配置
    console.log(`\n--- 步骤 2: 更新前端配置 ---\n`);
    await executeCommand('node', [path.join(__dirname, 'simple-update-config.js'), NETWORK]);
    
    console.log(`\n=== 部署和配置更新完成! ===\n`);
    console.log(`合约已部署到 ${NETWORK} 网络，前端配置已更新。`);
    
  } catch (error) {
    console.error(`\n错误: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 