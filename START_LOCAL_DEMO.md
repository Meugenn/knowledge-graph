# 🎬 Local Demo - Quick Start

## ✅ Status
- [x] Blockchain running at http://127.0.0.1:8545
- [x] Contracts deployed
- [x] Frontend configured

## 🚀 Start Frontend (Next Step)

### Open a NEW terminal and run:

```bash
cd /Users/meuge/Coding/knowledge-graph/frontend
npm start
```

This will:
1. Start React dev server
2. Open http://localhost:3000
3. Show your demo!

---

## 🔧 MetaMask Setup

### Add Hardhat Network:

1. Open MetaMask
2. Click Networks → Add Network
3. Enter:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `1337`
   - **Currency Symbol:** ETH

4. Save

### Import Test Account:

1. MetaMask → Import Account
2. Paste this private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. You now have 10,000 ETH!

---

## 📋 Test Flow

1. **Open:** http://localhost:3000
2. **Connect Wallet** → Select Hardhat Local
3. **Get USDC:**
   - You already have 10,000 USDC from deployment
4. **Submit Paper:**
   - Fill in your art valuation paper
   - Click Submit
   - Approve USDC
   - Submit transaction
   - See success!
5. **Check Stats** → See your submission

---

## 🎥 Record Demo Video

**You're ready to record!**

### What to Record:

1. **Landing page** (beautiful design)
2. **Connect wallet** (MetaMask)
3. **Submit paper** (your art research)
4. **Show transaction** (MetaMask confirmation)
5. **See paper listed** (in Papers tab)
6. **Explain features:**
   - "Flare FDC verifies DOI"
   - "Plasma pays $100 USDC to reviewers"
   - "Random assignment via Flare RNG"
7. **Stats page** (show analytics)

### Recording Tips:

- **Use QuickTime** (Mac): File → New Screen Recording
- **Or OBS** (free, any OS)
- **Keep it 3-4 minutes max**
- **Show, don't just tell**
- **Use your actual paper content** (makes it real!)

---

## 🎯 After Recording

1. **Upload to YouTube**
   - Title: "Decentralized Research Graph - ETH Oxford 2026"
   - Description: Include GitHub link
   - Unlisted or Public

2. **Update README** with video link

3. **Submit to DoraHacks** with:
   - Live demo: http://localhost:3000 (or say "demo video")
   - GitHub repo
   - Video link

---

## 💡 Pro Tips

### Make It Look Real:
- Use your actual research paper content
- Show real MetaMask transactions
- Explain each feature clearly
- Be enthusiastic!

### What Judges Want to See:
- ✅ Working product (not slides)
- ✅ Real transactions
- ✅ Clear problem/solution
- ✅ Innovation (Flare FDC + Plasma)
- ✅ Commercial viability

### Common Issues:

**"MetaMask not connecting"**
→ Make sure you're on Hardhat Local network

**"Insufficient funds"**
→ Use Account #0 (has 10,000 ETH + USDC)

**"Transaction failed"**
→ Check you approved USDC spending first

---

## 🏆 You're Ready!

**Current setup:**
- ✅ Blockchain running
- ✅ Contracts deployed
- ✅ Ready for frontend

**Next command:**
```bash
cd frontend && npm start
```

Then open http://localhost:3000 and record your demo!

---

**The judges will see a WORKING product. That's your advantage!** 🎬
