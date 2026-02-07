# 🔬 Decentralized Research Graph

> A blockchain-based knowledge graph revolutionizing academic publishing with fair incentives and open science

**Built at ETH Oxford 2026** | Powered by **Flare** & **Plasma**

---

## 🎯 The Problem

Academic publishing is broken:
- **Researchers don't get paid** for peer review (worth $2B+ annually)
- **Citation gaming** and lack of replication incentives
- **Closed access** controlled by monopolistic publishers
- **Slow review process** taking months or years
- **No verification** of external claims or data

## 💡 Our Solution

A decentralized knowledge graph where:
- ✅ **Researchers earn stablecoins** (USDC via Plasma) for quality reviews
- ✅ **Citation rewards** with governance tokens for impactful work
- ✅ **External data verification** via Flare Data Connector (FDC)
- ✅ **Random peer review** assignment via Flare RNG
- ✅ **Transparent economics** with token incentives for quality science
- ✅ **Open access** by default on IPFS/Arweave

---

## 🏗️ Architecture

### Smart Contracts (Flare Network)
```
ResearchGraph.sol       → Main contract orchestrating the system
ResearchToken.sol       → Governance token (RESEARCH)
IFlareContracts.sol     → Interfaces for FDC, FTSO, RNG
```

### Key Integrations

#### 🌟 Flare Network
1. **FDC (Flare Data Connector)** - Verifies external academic data:
   - CrossRef API for DOI validation
   - arXiv for paper metadata
   - GitHub/OSF for replication studies
   - Citation count verification

2. **FTSO (Flare Time Series Oracle)** - Token price feeds:
   - Convert RESEARCH tokens ↔ USDC
   - Dynamic pricing for submissions

3. **Random Number Generator** - Fair reviewer assignment:
   - Prevents reviewer bias
   - Anonymous assignment
   - Cryptographically secure

#### 💰 Plasma Network
- **Stablecoin payments** (USDC) for all transactions:
  - $50 submission fees
  - $100 review rewards
  - Pay-per-access (future)
- **Fast settlement** for instant reviewer payments
- **Privacy features** for anonymous peer review

---

## 🎮 How It Works

### 1️⃣ Submit Paper
```solidity
// Author pays $50 USDC (Plasma)
researchGraph.submitPaper(ipfsHash, doi)
```
- Paper stored on IPFS
- FDC verifies DOI via CrossRef
- Random reviewers assigned via Flare RNG

### 2️⃣ Peer Review
```solidity
// Reviewer earns $100 USDC (Plasma)
researchGraph.submitReview(paperId, score, reviewHash)
```
- Reviewers stake RESEARCH tokens (slashed for poor reviews)
- Instant USDC payment upon submission
- Anonymous via RNG assignment

### 3️⃣ Acceptance & Rewards
```solidity
// Auto-accept if avg score ≥ 7/10
// Author earns 100 RESEARCH tokens
```

### 4️⃣ Citations & Replications
```solidity
// Cite a paper → author earns 10 RESEARCH tokens
researchGraph.addCitation(citingPaperId, citedPaperId)

// Replicate a study → both earn rewards
researchGraph.verifyReplication(paperId, replicationData)
```

---

## 🚀 Setup & Deployment

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
MetaMask wallet
```

### Installation
```bash
# Clone repository
git clone https://github.com/your-repo/research-graph
cd research-graph

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Deploy Contracts

#### 1. Flare Testnet (Coston2)
```bash
# Copy environment variables
cp .env.example .env

# Add your private key to .env
PRIVATE_KEY=your_private_key_here

# Deploy to Flare
npm run deploy:flare
```

#### 2. Plasma Testnet
```bash
# Deploy USDC mock or use existing
npm run deploy:plasma
```

### Run Frontend
```bash
# Start React app
npm run frontend

# Open http://localhost:3000
```

### Update Contract Addresses
After deployment, update `frontend/src/config.js`:
```javascript
export const CONTRACTS = {
  RESEARCH_GRAPH: '0x...', // From deployment.json
  RESEARCH_TOKEN: '0x...',
  USDC: '0x...',
};
```

---

## 🧪 Testing

```bash
# Run contract tests
npm test

# Test specific functionality
npx hardhat test test/ResearchGraph.test.js
```

### Test Coverage
- ✅ Paper submission with USDC payment
- ✅ External data verification via FDC
- ✅ Random reviewer assignment
- ✅ Review submission with rewards
- ✅ Citation tracking and rewards
- ✅ Token price feeds via FTSO

---

## 📊 Token Economics

### Dual Token System

#### 💵 USDC (Stablecoin on Plasma)
- **Submission Fee**: $50 USDC
- **Review Reward**: $100 USDC per review
- **Access Fee**: Variable (future)

#### 🎫 RESEARCH (Governance Token on Flare)
- **Paper Acceptance**: 100 tokens
- **External Verification**: 50 tokens
- **Citation Reward**: 10 tokens per citation
- **Replication Reward**: 50 tokens (author) + 25 tokens (replicator)

### Why Dual Token?
- **USDC**: Stable pricing for transactions, no volatility risk
- **RESEARCH**: Long-term alignment via governance and reputation

---

## 🎯 Hackathon Tracks

### ✅ Flare Main Track ($5K)
**Using Flare's Enshrined Data Protocols:**
1. **FDC** → Verify DOI via CrossRef API
2. **FDC** → Track citations from external databases
3. **FDC** → Verify replication studies from GitHub
4. **FTSO** → Token price feeds for economic conversions
5. **RNG** → Random reviewer assignment

### ✅ Flare Bonus Track ($1K)
**Most Innovative External Data Source Use Case:**
- Pull academic metadata from Web2 sources (CrossRef, arXiv, PubMed)
- Verify paper authenticity before blockchain commitment
- Track real-world citations across multiple databases
- Detect plagiarism by comparing against existing papers

### ✅ Plasma Track ($5K)
**Stablecoin Payment Infrastructure:**
- Submission fees in USDC
- Instant review rewards via Plasma's fast settlement
- Privacy-preserving payments for anonymous peer review
- Real-world use case: fixing broken academic economics

---

## 🌟 Novel Features

### 1. External Data Verification (Flare FDC)
First academic system to verify real-world citations on-chain:
```solidity
// Request CrossRef data
bytes32 requestId = fdcHub.requestData("crossref", doi);

// Verify response
DataResponse memory response = fdcHub.getDataResponse(requestId);
require(response.verified, "Data not verified");
```

### 2. Fair Review Assignment (Flare RNG)
Anonymous reviewer selection prevents:
- Author-reviewer collusion
- Biased assignments
- Gaming the system

### 3. Instant Payments (Plasma)
Reviewers paid immediately in USDC:
```solidity
stablecoin.transfer(reviewer, reviewRewardUSD);
```

### 4. Replication Incentives
Both original author and replicator earn tokens:
- Solves replication crisis
- Verifiable via GitHub/OSF integration

---

## 📈 Impact & Use Cases

### Short-term
- **Preprint servers**: arXiv, bioRxiv, SSRN
- **Journal overlays**: Peer review layer for existing journals
- **Conference proceedings**: Faster review for conferences

### Long-term
- **Research funding**: Quadratic funding for proposals
- **Prediction markets**: Bet on research outcomes (aligns with Main DeFi Track)
- **Research NFTs**: Tradeable paper ownership
- **DAO governance**: Community-driven research priorities

---

## 🔐 Security

### Smart Contract Security
- OpenZeppelin contracts for ERC20
- ReentrancyGuard on payment functions
- Role-based access control
- Slashing mechanism for bad actors

### Economic Security
- Reviewer staking prevents Sybil attacks
- Citation rewards prevent gaming (on-chain verification)
- Multi-signature acceptance (requires 3+ reviewers)

---

## 🚧 Roadmap

### Phase 1: MVP (Hackathon) ✅
- [x] Core smart contracts
- [x] Flare FDC integration
- [x] Plasma payment layer
- [x] Basic frontend demo

### Phase 2: Testnet (Q2 2026)
- [ ] Full IPFS integration
- [ ] Enhanced FDC queries
- [ ] Reviewer reputation system
- [ ] Mobile app

### Phase 3: Mainnet (Q3 2026)
- [ ] Mainnet deployment
- [ ] Real USDC integration
- [ ] DAO governance
- [ ] API for journals

### Phase 4: Scale (Q4 2026)
- [ ] Prediction markets
- [ ] Research funding
- [ ] Cross-chain bridges
- [ ] Academic partnerships

---

## 📚 Documentation

- [Plasma Integration Details](./docs/PLASMA_INTEGRATION.md)
- [Flare FDC Guide](./docs/FLARE_FDC.md) (to be created)
- [Token Economics](./docs/TOKENOMICS.md) (to be created)
- [API Documentation](./docs/API.md) (to be created)

---

## 🎥 Demo Video

[Link to demo video showing full flow]

### Demo Walkthrough:
1. Connect wallet (MetaMask)
2. Switch to Flare testnet
3. Submit paper (pay $50 USDC via Plasma)
4. Verify external data (Flare FDC)
5. Review assignment (Flare RNG)
6. Submit review (earn $100 USDC)
7. Citation rewards (earn RESEARCH tokens)

---

## 👥 Team

Built at ETH Oxford 2026 by researchers who believe in open science and fair incentives.

---

## 📄 License

MIT License - Open source for the community

---

## 🙏 Acknowledgments

- **Flare Network** for powerful data oracles (FDC, FTSO, RNG)
- **Plasma** for fast stablecoin payment infrastructure
- **ETH Oxford** for the amazing hackathon
- Academic community for inspiration

---

## 📞 Contact & Links

- GitHub: [Repository URL]
- Demo: [Live demo URL]
- Pitch Deck: [Presentation URL]
- Twitter: [@ResearchGraph]

---

## 🔥 Feedback on Building with Flare & Plasma

### Flare Experience
**Positive:**
- FDC makes it trivial to pull real-world data on-chain
- FTSO price feeds are reliable and easy to integrate
- RNG provides true randomness for fair assignment
- Excellent documentation and examples

**Suggestions:**
- More examples for complex FDC queries (multiple data sources)
- Better tooling for testing FDC responses locally
- SDK for common academic APIs (CrossRef, arXiv, etc.)

### Plasma Experience
**Positive:**
- Simple ERC20 interface for stablecoin payments
- Fast testnet for rapid development
- Purpose-built for payments = perfect fit

**Suggestions:**
- More documentation on privacy features
- Examples for payment batching (multiple reviewers)
- Better faucet for testnet USDC

---

**Built with ❤️ for Open Science**
