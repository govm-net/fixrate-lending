# Contract Deployment Guide

## Table of Contents
1. [Environment Preparation](#environment-preparation)
2. [Local Development Environment Deployment](#local-development-environment-deployment)
3. [Test Network Deployment](#test-network-deployment)
4. [Mainnet Deployment](#mainnet-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Contract Verification](#contract-verification)
7. [Contract Interaction](#contract-interaction)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## Environment Preparation

### System Requirements
- Node.js v18 or higher
- npm or yarn package manager
- Git version control system

### Installation Steps
1. Clone the project repository:
```bash
git clone <repository-url>
cd fixrate-lending
```

2. Install dependencies:
```bash
npm install
```

3. Compile smart contracts:
```bash
npx hardhat compile
```

### Environment Variables Configuration
Create a `.env` file in the project root directory and configure the following variables:

```env
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Wallet private key (for contract deployment)
PRIVATE_KEY=your_wallet_private_key

# Block explorer API keys (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

## Local Development Environment Deployment

### Start Local Blockchain Network
```bash
npx hardhat node
```

This command starts a local Ethereum network with 20 test accounts, each with 10,000 ETH.

### Deploy Contracts
In a new terminal, run the deployment command:
```bash
npx hardhat deploy --network localhost
```

Expected output:
```
Deploying contracts with the account: 0x...
Network: localhost
Is testnet: true
UnifiedMatchingEngine deployed at: 0x...
FixedRateLendingPool deployed at: 0x...
Set matching engine address 0x... in lending pool
```

Please record the deployed contract addresses for subsequent verification and interaction.

## Test Network Deployment

### Supported Test Networks
- Sepolia (Ethereum)
- Mumbai (Polygon)
- BSC Testnet (Binance Smart Chain)

### Deployment Steps
1. Ensure environment variables are configured correctly
2. Run the deployment command:
```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Deploy to Mumbai
npx hardhat deploy --network mumbai

# Deploy to BSC Testnet
npx hardhat deploy --network bsc_testnet
```

Expected output:
```
Deploying contracts with the account: 0x...
Network: sepolia
Is testnet: true
UnifiedMatchingEngine deployed at: 0x...
FixedRateLendingPool deployed at: 0x...
Set matching engine address 0x... in lending pool
```

Please record the deployed contract addresses for subsequent verification and interaction.

## Mainnet Deployment

### Supported Main Networks
- Ethereum Mainnet
- Polygon Mainnet
- BSC Mainnet

### Deployment Steps
1. Ensure environment variables are configured correctly
2. Check account balance to ensure sufficient gas fees
3. Run the deployment command:
```bash
# Deploy to Ethereum Mainnet
npx hardhat deploy --network mainnet

# Deploy to Polygon Mainnet
npx hardhat deploy --network polygon

# Deploy to BSC Mainnet
npx hardhat deploy --network bsc
```

**Warning**: Mainnet deployment requires real cryptocurrency for gas fees. Please ensure you have sufficient funds before deployment.

## Frontend Deployment

### Build Frontend Application
```bash
cd frontend
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

### Deploy to Other Platforms
The built files are located in the `frontend/build` directory and can be deployed to any static hosting service such as:
- Vercel
- Netlify
- AWS S3
- Google Cloud Storage

## Contract Verification

To allow users to view the contract code on blockchain explorers, you need to verify the contracts. The deployment script outputs verification commands that you can copy and execute.

For example:

```bash
# Verify UnifiedMatchingEngine contract
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
const matchingEngine = await ethers.getContractAt("UnifiedMatchingEngine", "0x1234567890abcdef");
const lendingPool = await ethers.getContractAt("FixedRateLendingPool", "0xabcdef1234567890");

// Call contract methods
await lendingPool.addSupportedToken("0xTokenAddress", "0xPriceFeedAddress");
```

### Using the Frontend Application
1. Start the frontend development server:
```bash
cd frontend
npm start
```

2. Connect your wallet to the deployed network
3. Interact with the contracts through the UI

## Common Issues and Solutions

### Compilation Errors
**Issue**: Compilation fails with syntax errors
**Solution**: 
1. Check Solidity version compatibility
2. Ensure all dependencies are installed
3. Clean and recompile:
```bash
npx hardhat clean
npx hardhat compile
```

### Deployment Failures
**Issue**: Deployment fails with insufficient funds error
**Solution**:
1. Check account balance
2. Ensure private key is configured correctly
3. Verify RPC URL is accessible

### Verification Failures
**Issue**: Contract verification fails
**Solution**:
1. Check API key configuration
2. Ensure contract address is correct
3. Verify constructor parameters match deployment

### Frontend Connection Issues
**Issue**: Frontend cannot connect to contracts
**Solution**:
1. Check contract addresses in network configuration
2. Verify network connection
3. Ensure wallet is connected to the correct network