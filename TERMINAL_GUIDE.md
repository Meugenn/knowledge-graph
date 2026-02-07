# Terminal Setup Guide

## What You're Seeing Right Now

```
┌─────────────────────────────────────────────┐
│ Terminal 1 (KEEP THIS RUNNING!)            │
│                                             │
│ $ npx hardhat node                          │
│                                             │
│ Started HTTP and WebSocket JSON-RPC         │
│ server at http://127.0.0.1:8545/            │
│                                             │
│ Account #0: 0xf39F...2266 (10000 ETH)      │
│ Account #1: 0x7099...79C8 (10000 ETH)      │
│ ...                                         │
│                                             │
│ [BLOCKCHAIN IS RUNNING]                     │
│ ⚠️  DO NOT CLOSE THIS WINDOW                │
└─────────────────────────────────────────────┘
```

This is your **local blockchain** - like a mini Ethereum running on your computer.
It needs to stay running while you deploy and test.

---

## What You Need to Do Now

### Step 1: Open a NEW Terminal
- Press **Cmd+T** (new tab), OR
- Open Terminal app again

### Step 2: Navigate to Project
```bash
cd /Users/meuge/Coding/knowledge-graph
```

### Step 3: Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network localhost
```

You'll see:
```
Deploying Decentralized Research Graph to Flare...

1. Deploying Mock Flare Contracts...
MockFtsoRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MockFlareDataConnector deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
...

=== Deployment Complete ===
Contract Addresses:
ResearchToken: 0x...
ResearchGraph: 0x...
MockUSDC: 0x...
```

### Step 4: Run Demo
```bash
npx hardhat run scripts/demo.js --network localhost
```

You'll see the full flow:
- ✅ Paper submission
- ✅ USDC payment
- ✅ FDC verification
- ✅ Reviews
- ✅ Token rewards

---

## Visual Layout

```
┌─────────────────────┐  ┌─────────────────────┐
│   Terminal 1        │  │   Terminal 2        │
│                     │  │                     │
│   $ hardhat node    │  │   $ cd project      │
│                     │  │   $ ./RUN_THIS.sh   │
│   [RUNNING]         │  │                     │
│   Don't close!      │  │   [DEPLOYING]       │
│                     │  │                     │
└─────────────────────┘  └─────────────────────┘
         ↓                         ↓
    Blockchain              Deploy Contracts
    Running Here           & Run Tests Here
```

---

## Quick Commands for Terminal 2

Copy and paste these one at a time:

```bash
# Navigate to project
cd /Users/meuge/Coding/knowledge-graph

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run demo (after deployment)
npx hardhat run scripts/demo.js --network localhost
```

Or just run the convenience script:
```bash
./RUN_THIS.sh
```

---

## After It Works

Once you see "DEMO COMPLETE! 🎉", you can:

1. **Test the frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. **Deploy to real testnet**
   - Get testnet tokens
   - `npm run deploy:flare`

3. **Record your demo video**
   - Follow docs/VIDEO_SCRIPT.md

---

## Troubleshooting

**"Cannot connect to network localhost"**
→ Terminal 1 (hardhat node) isn't running. Start it first!

**"Port 8545 already in use"**
→ You already have a node running. Find and use that terminal, or kill it with:
```bash
lsof -ti:8545 | xargs kill -9
```

**Both terminals in same window?**
→ That's fine! Just make sure hardhat node is running in one tab

---

**You've got this! Open that new terminal and deploy!** 🚀
