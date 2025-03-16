import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import "hardhat-deploy";
import * as dotenv from "dotenv";

// 导入自定义任务
import "./tasks/send-test-eth";
import "./tasks/mint-test-tokens";
import "./tasks/update-frontend-config";
import "./tasks/deploy-and-update";
import "./tasks/deploy-update-mint";

dotenv.config();

// 获取环境变量，如果不存在则使用默认值
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // 本地开发网络
    hardhat: {
      chainId: 31337
    },
    // 本地开发网络
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // 以太坊测试网络
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      gasPrice: 3000000000 // 3 Gwei
    },
    // 以太坊主网
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      gasPrice: 20000000000 // 20 Gwei
    },
    // Polygon 测试网络
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
      gasPrice: 3000000000 // 3 Gwei
    },
    // Polygon 主网
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [PRIVATE_KEY],
      gasPrice: 50000000000 // 50 Gwei
    },
    // BSC 测试网络
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: [PRIVATE_KEY],
      gasPrice: 10000000000 // 10 Gwei
    },
    // BSC 主网
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      accounts: [PRIVATE_KEY],
      gasPrice: 5000000000 // 5 Gwei
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
    deployments: "./deployments"
  },
  namedAccounts: {
    deployer: {
      default: 0, // 默认使用第一个账户作为部署者
    },
  },
  mocha: {
    timeout: 40000
  }
};

export default config;
