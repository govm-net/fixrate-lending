# FixRate Lending Contract Deployment Guide

This document provides detailed instructions on how to deploy the smart contracts of the FixRate Lending project.

## Table of Contents

1. [Environment Preparation](#environment-preparation)
2. [Deployment Environment Configuration](#deployment-environment-configuration)
3. [Contract Deployment](#contract-deployment)
   - [Deployment Methods](#deployment-methods)
   - [Using Traditional Deployment Script](#using-traditional-deployment-script)
   - [Using Hardhat Ignition](#using-hardhat-ignition)
4. [Contract Verification](#contract-verification)
5. [Contract Interaction](#contract-interaction)
6. [Common Issues and Solutions](#common-issues-and-solutions)

## Environment Preparation

Before starting the deployment, ensure your system meets the following requirements:

- Node.js (recommended v16.x or higher)
- npm (v8.x or higher) or yarn (v1.22.x or higher)
- Git

You can check your environment with the following commands:

```bash
node -v
npm -v
git --version
```

## Deployment Environment Configuration

1. Clone the repository:

```bash
git clone https://github.com/govm-net/fixrate-lending.git
cd fixrate-lending
```

2. Install dependencies:

```bash
npm install
# or using yarn
yarn install
```

3. Configure environment variables:

Copy the `.env.example` file and rename it to `.env`:

```bash
cp .env.example .env
```

Then edit the `.env` file and fill in your private key and API keys:

```
# Private key of the deployment account (do not commit to Git repository)
PRIVATE_KEY=your_private_key_here

# Infura API key for connecting to Ethereum networks
INFURA_API_KEY=your_infura_api_key_here

# Blockchain explorer API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Gas price settings (optional, in Gwei)
GAS_PRICE_MAINNET=20
GAS_PRICE_TESTNET=3

# Network type (mainnet or testnet)
NETWORK_TYPE=testnet
```

> Note: Ensure your private key is kept secure. Do not commit the `.env` file containing your private key to the Git repository. This file is already configured to be ignored in `.gitignore`.

4. Network Configuration:

The project's `hardhat.config.ts` file is already configured with multiple networks, including:

- **Local networks**: hardhat (built-in) and localhost
- **Ethereum networks**: sepolia (testnet) and mainnet
- **Polygon networks**: mumbai (testnet) and polygon (mainnet)
- **BSC networks**: bscTestnet and bsc (mainnet)

If you need to modify the network configuration, you can edit the `hardhat.config.ts` file.

## Contract Deployment

### Deployment Methods

We provide three methods for deploying contracts:

#### 1. Traditional Deployment Script

Using the traditional Hardhat deployment script, which does not automatically save deployment information.

```bash
# Deploy on local network
npx hardhat run scripts/deploy.ts --network localhost

# Deploy on test networks
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network mumbai
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy on main networks
npx hardhat run scripts/deploy.ts --network mainnet
npx hardhat run scripts/deploy.ts --network polygon
npx hardhat run scripts/deploy.ts --network bsc
```

#### 2. Hardhat Ignition

Using the Hardhat Ignition framework, which automatically saves deployment information to local files.

```bash
# Deploy on local network
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network localhost

# Deploy on test networks
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network sepolia
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network mumbai
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network bscTestnet

# Deploy on main networks
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network mainnet
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network polygon
npx hardhat ignition deploy ignition/modules/LendingContracts.js --network bsc
```

After deployment, Hardhat Ignition will save deployment information in the `ignition/deployments` directory, organized by network name.

#### 3. Hardhat Deploy

Using the Hardhat Deploy plugin, which is a more mature deployment framework that automatically saves deployment information to local files and provides more features.

```bash
# Deploy on local network
npx hardhat deploy --network localhost

# Deploy on test networks
npx hardhat deploy --network sepolia
npx hardhat deploy --network mumbai
npx hardhat deploy --network bscTestnet

# Deploy on main networks
npx hardhat deploy --network mainnet
npx hardhat deploy --network polygon
npx hardhat deploy --network bsc
```

After deployment, Hardhat Deploy will save deployment information in the `deployments` directory, organized by network name. The deployment information for each contract includes:

- Contract address
- Deployment transaction hash
- Constructor parameters
- Contract ABI
- Bytecode

This information can be used in the frontend or other applications to interact with the deployed contracts.

### After Deployment

After deployment, you will see output similar to the following:

```
Deploying contracts with the account: 0x...
Network: sepolia
Is testnet: true
P2PLendingMarketplace deployed at: 0x...
FixedRateLendingPool deployed at: 0x...
Set marketplace address 0x... in lending pool
```

Please record the deployed contract addresses for subsequent verification and interaction.

## Contract Verification

To allow users to view the contract code on blockchain explorers, you need to verify the contracts. The deployment script outputs verification commands that you can copy and execute.

For example:

```bash
# Verify P2PLendingMarketplace contract
npx hardhat verify --network sepolia 0x1234567890abcdef

# Verify FixedRateLendingPool contract (with constructor parameters)
npx hardhat verify --network sepolia 0xabcdef1234567890 500 31536000 15000
```

## Contract Interaction

After deployment, you can interact with the contracts in the following ways:

### Using the Hardhat Console

```bash
npx hardhat console --network sepolia
```

Then in the console:

```javascript
// Get contract instances
const marketplace = await ethers.getContractAt("P2PLendingMarketplace", "0x1234567890abcdef");
const lendingPool = await ethers.getContractAt("FixedRateLendingPool", "0xabcdef1234567890");

// Call contract methods
await lendingPool.addSupportedToken("0xTokenAddress", "0xPriceFeedAddress");
```

### Using the Frontend Application

After deployment, you need to update the contract addresses in the frontend application. In the `frontend` directory, create or edit the `.env.production` file:

```
REACT_APP_MARKETPLACE_ADDRESS=0x1234567890abcdef
REACT_APP_LENDING_POOL_ADDRESS=0xabcdef1234567890
REACT_APP_CHAIN_ID=11155111  # Sepolia Chain ID
```

Chain IDs for different networks:
- Ethereum mainnet: 1
- Sepolia testnet: 11155111
- Polygon mainnet: 137
- Mumbai testnet: 80001
- BSC mainnet: 56
- BSC testnet: 97

## Common Issues and Solutions

### High Gas Fees

If you encounter high gas fees during deployment, try the following solutions:

1. Deploy during off-peak hours
2. Adjust the gas price settings in the `.env` file
3. Use a network with lower gas prices (such as Polygon or BSC)

### Contract Verification Failure

If contract verification fails, it may be due to:

1. Compiler version mismatch: Ensure the compiler version used for verification is the same as the one used for deployment
2. Constructor parameter errors: Check if the parameters in the verification command match those used during deployment
3. Incomplete contract code: Ensure all imported contracts are uploaded
4. API key errors: Check if the API keys in your `.env` file are correct

### Contract Upgrades

The contracts in this project do not support upgrades. If you need to update contract logic, you will need to deploy new contracts and migrate data.

---

If you encounter any deployment issues, please submit an issue to the [GitHub repository](https://github.com/govm-net/fixrate-lending/issues). 