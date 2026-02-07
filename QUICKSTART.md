# Quick Start Guide - Decentralized Research Graph

Get up and running in 5 minutes!

## Prerequisites

- Node.js >= 18.0
- npm >= 9.0
- MetaMask browser extension
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/research-graph
cd research-graph

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Local Development (Hardhat)

### 1. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

Keep this running. You'll see a list of accounts with private keys.

### 2. Deploy Contracts

```bash
# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

This will output contract addresses. Copy them!

### 3. Update Frontend Config

Edit `frontend/src/config.js` and paste the contract addresses:

```javascript
export const CONTRACTS = {
  RESEARCH_GRAPH: '0x...', // From deployment output
  RESEARCH_TOKEN: '0x...',
  USDC: '0x...',
};
```

### 4. Start Frontend

```bash
# Terminal 3: Start React app
cd frontend
npm start
```

Open http://localhost:3000

### 5. Configure MetaMask

1. Add Hardhat network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency: ETH

2. Import test account:
   - Copy private key from Terminal 1 (Account #0)
   - MetaMask → Import Account → Paste private key

3. You now have ~10,000 ETH for testing!

### 6. Get Test USDC

In MetaMask, add custom token:
- Token Address: [Your deployed USDC address]
- Symbol: USDC
- Decimals: 6

Then call the faucet:
```bash
npx hardhat console --network localhost
```

In the console:
```javascript
const usdc = await ethers.getContractAt("MockUSDC", "YOUR_USDC_ADDRESS");
await usdc.faucet();
```

You now have 1000 USDC!

---

## Testnet Deployment (Flare Coston2)

### 1. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
PRIVATE_KEY=your_private_key_here  # NO 0x prefix
FLARE_RPC=https://coston2-api.flare.network/ext/C/rpc
```

### 2. Get Testnet FLR

Visit: https://faucet.flare.network/coston2

Enter your address and get testnet FLR for gas.

### 3. Deploy to Flare

```bash
npm run deploy:flare
```

Contract addresses will be saved to `deployment.json`.

### 4. Update Frontend

Edit `frontend/src/config.js` with new addresses from `deployment.json`.

### 5. Configure MetaMask for Flare

- Network Name: Flare Testnet Coston2
- RPC URL: https://coston2-api.flare.network/ext/C/rpc
- Chain ID: 114
- Currency: FLR
- Explorer: https://coston2-explorer.flare.network

---

## Testnet Deployment (Plasma)

### 1. Deploy USDC

```bash
npm run deploy:plasma
```

### 2. Update Flare Deployment

Update the USDC address in your Flare ResearchGraph contract to use the Plasma USDC.

---

## Testing the Full Flow

### 1. Submit a Paper

1. Go to "Submit Paper" tab
2. Fill in title, abstract, DOI
3. Click "Submit Paper"
4. Approve USDC spending in MetaMask
5. Confirm transaction
6. Wait for confirmation

### 2. Verify External Data

1. Go to "Papers" tab
2. Find your paper
3. Click "Verify via Flare FDC"
4. Wait for verification (~30s on testnet)

### 3. Review a Paper

1. Go to "Review" tab
2. Register as reviewer (stake tokens)
3. Find assigned papers
4. Submit review
5. Receive $100 USDC instantly

### 4. Check Stats

1. Go to "Stats" tab
2. View your balances
3. See platform statistics

---

## Running Tests

```bash
# All tests
npm test

# Specific test file
npx hardhat test test/ResearchGraph.test.js

# With gas reporting
REPORT_GAS=true npm test

# Coverage
npm run coverage
```

---

## Demo Script

Run the automated demo:

```bash
npx hardhat run scripts/demo.js --network localhost
```

This will:
1. Submit a paper
2. Verify external data
3. Add citations
4. Show all features

---

## Troubleshooting

### "Insufficient funds for gas"
- Get more testnet tokens from faucet
- Check you're on the right network

### "USDC approval failed"
- Make sure you have USDC balance
- Check contract addresses are correct

### "FDC verification failed"
- Wait longer (oracles take 30-60s)
- Check DOI is valid format

### Frontend not connecting
- Check MetaMask is on correct network
- Refresh page
- Check console for errors

---

## Project Structure

```
research-graph/
├── contracts/              # Solidity smart contracts
│   ├── ResearchGraph.sol
│   ├── ResearchToken.sol
│   └── IFlareContracts.sol
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── config.js
│   └── public/
├── scripts/               # Deployment scripts
│   ├── deploy.js
│   └── demo.js
├── test/                  # Contract tests
├── docs/                  # Documentation
└── README.md
```

---

## Next Steps

1. **Deploy to Testnet**: Follow testnet deployment guide above
2. **Record Demo Video**: Use docs/VIDEO_SCRIPT.md
3. **Prepare Pitch**: Review docs/PITCH_DECK.md
4. **Submit to DoraHacks**: Use SUBMISSION_CHECKLIST.md

---

## Useful Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Flare testnet
npm run deploy:flare

# Start frontend
npm run frontend

# Run demo
npx hardhat run scripts/demo.js --network localhost

# Hardhat console (for debugging)
npx hardhat console --network localhost
```

---

## Support

- GitHub Issues: [Repo URL]
- Discord: [Server invite]
- Email: team@researchgraph.xyz

---

**Happy Hacking! 🚀**
