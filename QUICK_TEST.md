# Quick Local Test (No Testnet Needed!)

Want to see everything working RIGHT NOW? Use Hardhat's local network:

## Option 1: Full Demo in 2 Minutes

### Terminal 1: Start Local Blockchain
```bash
npx hardhat node
```
Leave this running. It gives you 20 test accounts with 10,000 ETH each!

### Terminal 2: Deploy & Test
```bash
# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run automated demo
npx hardhat run scripts/demo.js --network localhost
```

This will show you:
- ✅ Paper submission with USDC payment
- ✅ External data verification (Flare FDC mock)
- ✅ Citation rewards
- ✅ Token minting
- ✅ Full flow working

## Option 2: Test with Frontend

### Terminal 1: Start Local Blockchain
```bash
npx hardhat node
```

### Terminal 2: Deploy
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Copy the contract addresses from the output.

### Terminal 3: Update Frontend
```bash
cd frontend

# Edit src/config.js and paste addresses
nano src/config.js

# Install and start
npm install
npm start
```

### Browser: Test the UI
1. Open http://localhost:3000
2. Connect MetaMask to Hardhat network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency: ETH

3. Import Account #0 from Terminal 1:
   - Copy the private key shown
   - MetaMask → Import Account → Paste

4. Test the full flow:
   - Submit a paper
   - Verify external data
   - View stats

## Option 3: Just Run Tests
```bash
npx hardhat test
```

See all the core features working in seconds!

---

## After Testing Locally...

Once you're ready for the real testnets:
1. Get testnet tokens (see main instructions)
2. Deploy to Flare: `npm run deploy:flare`
3. Deploy to Plasma: `npm run deploy:plasma`
4. Update frontend with real addresses
5. Record your demo video

But you can develop and test everything locally first!
