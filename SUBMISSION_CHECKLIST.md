# ETH Oxford 2026 - Submission Checklist

## 📋 Required for ALL Main Track Submissions

### ✅ 1. Pitch Video
- [ ] Recorded and uploaded
- [ ] Length: 3-5 minutes recommended
- [ ] Covers:
  - [ ] Problem statement
  - [ ] Solution overview
  - [ ] Technical demo
  - [ ] Flare & Plasma integration
  - [ ] Impact & vision
- [ ] Format: MP4, accessible link
- [ ] Upload to: YouTube/Vimeo/DoraHacks

**Our video**: [INSERT VIDEO LINK]

---

### ✅ 2. Code Repository
- [ ] Public GitHub repository
- [ ] Comprehensive README.md
- [ ] Clear setup instructions
- [ ] All code committed
- [ ] License added (MIT)

**Our repo**: [INSERT GITHUB LINK]

---

## 🌟 Flare Main Track Requirements ($5K-$1K)

### Integration Checklist
- [x] Uses at least one Flare enshrined data protocol
- [x] **FDC (Flare Data Connector)** ✅
  - Verifies DOI via CrossRef API
  - Tracks citations from external databases
  - Verifies replication studies from GitHub
- [x] **FTSO (Price Oracle)** ✅
  - Token price feeds for RESEARCH/USD conversion
- [x] **Random Number Generator** ✅
  - Random reviewer assignment
- [x] Addresses real-world problem (broken academic publishing)
- [x] Specific use case: External academic data verification

### Required Feedback in README
- [x] Added feedback section describing experience building on Flare
- [x] Positive aspects highlighted
- [x] Suggestions for improvement provided

**Location**: See README.md "Feedback on Building with Flare & Plasma" section

---

## 💰 Flare Bonus Track ($1K x2)

### Most Innovative External Data Source Use Case

**Our submission**:
- [x] Innovative use: First academic platform with on-chain external data verification
- [x] Multiple data sources:
  - CrossRef (DOI validation)
  - arXiv (preprint metadata)
  - GitHub (replication tracking)
  - PubMed (medical papers) - planned
- [x] Novel application: Solving citation gaming & fake papers
- [x] Real-world impact: Transparent, verifiable research

**OR**

### Most Innovative Cross-Chain Application
- [ ] Not pursuing (focused on data source track)

---

## 💵 Plasma Track ($5K)

### Payment Infrastructure Requirements
- [x] Public GitHub repository ✅
- [x] Demo video showing project in use ✅
- [x] Short written explanation (README.md) ✅
- [x] Live/deployed demo (optional but recommended)

### Focus Areas Addressed
- [x] **Relevant to payments**: Stablecoin payment infrastructure for research
- [x] **Quality execution**: Full smart contract + frontend implementation
- [x] **Clear UX**: Simple flow for submit → review → earn
- [x] **Originality**: First decentralized research payment system

### Specific Features
- [x] Submission fees in USDC ($50)
- [x] Review rewards in USDC ($100)
- [x] Fast settlement via Plasma
- [x] Privacy considerations (anonymous peer review)
- [x] Real-world use case (academic publishing)

**Documentation**: See docs/PLASMA_INTEGRATION.md

---

## 📊 Judging Criteria Alignment

### Main Track Judging
1. **Novelty/Inventiveness** ✅
   - First blockchain knowledge graph with external data verification
   - Dual token economy (stablecoin + governance)
   - Fair reviewer assignment via cryptographic RNG

2. **Technical Sophistication** ✅
   - Smart contracts on Flare (ResearchGraph.sol)
   - FDC integration for external APIs
   - Plasma payment layer
   - Frontend with Web3 integration
   - IPFS for decentralized storage

3. **Commercial Upside** ✅
   - $19B academic publishing market
   - $2B unpaid peer review annually
   - 3M papers/year × $50 fee = $150M TAM
   - Clear path to replacing traditional publishers

### Flare Bonus Track Judging
- [x] **Innovation**: First academic data verification on-chain
- [x] **Multiple sources**: CrossRef, arXiv, GitHub, more planned
- [x] **Real impact**: Stops fake papers, prevents citation gaming

### Plasma Track Judging
- [x] **Payment relevance**: Core use case is payments
- [x] **Quality**: Full stack implementation
- [x] **UX clarity**: Simple, intuitive interface
- [x] **Originality**: Novel application of stablecoin payments

---

## 📁 Submission Files

### Must Include
- [x] README.md (comprehensive)
- [x] Smart contracts (contracts/)
- [x] Frontend code (frontend/)
- [x] Deployment scripts (scripts/)
- [x] Tests (test/)
- [x] Documentation (docs/)
- [x] .env.example
- [x] package.json
- [x] LICENSE

### Documentation Files
- [x] README.md (main)
- [x] docs/PLASMA_INTEGRATION.md
- [x] docs/FLARE_INTEGRATION.md
- [x] docs/PITCH_DECK.md
- [x] SUBMISSION_CHECKLIST.md (this file)

---

## 🎥 Demo Video Outline

### Structure (3-5 minutes)

**0:00-0:30** - Hook & Problem
- "Academic publishing is broken..."
- $2B in unpaid reviews
- Citation gaming, closed access

**0:30-1:00** - Solution Overview
- Decentralized research graph
- Pay researchers for reviews (Plasma)
- Verify external data (Flare FDC)
- Fair assignment (Flare RNG)

**1:00-2:30** - Live Demo
1. Connect wallet
2. Submit paper (pay $50 USDC via Plasma)
3. Show FDC verification request
4. Review assignment via RNG
5. Submit review (earn $100 USDC)
6. Citation reward demonstration

**2:30-3:30** - Technical Deep Dive
- Flare FDC integration (CrossRef API)
- Plasma payment flow
- Smart contract architecture
- Token economics

**3:30-4:00** - Impact & Vision
- Replace traditional publishers
- $10B+ to researchers
- 10x faster scientific progress

**4:00-4:30** - Call to Action
- Try the demo
- GitHub link
- Join the revolution

---

## 🚀 Pre-Submission Testing

### Smart Contracts
- [x] Compile without errors
- [x] All tests passing
- [ ] Deploy to Flare testnet
- [ ] Deploy to Plasma testnet
- [ ] Verify contracts on explorers

### Frontend
- [x] Builds without errors
- [ ] Test wallet connection
- [ ] Test paper submission flow
- [ ] Test review submission flow
- [ ] Test on multiple browsers

### Integration Testing
- [ ] FDC responds correctly
- [ ] FTSO price feeds work
- [ ] USDC transfers successful
- [ ] Token minting works

---

## 📝 Submission Form Fields

### DoraHacks Submission

**Project Name**: Decentralized Research Graph

**Tagline**: Blockchain knowledge graph with fair incentives for open science

**Description**: [Use README summary]

**Tracks Submitting To**:
- [x] Flare Main Track
- [x] Flare Bonus Track (External Data Source)
- [x] Plasma Track

**GitHub Link**: [INSERT]

**Demo Video Link**: [INSERT]

**Live Demo Link** (optional): [INSERT]

**Additional Links**:
- Documentation: [GitHub docs/]
- Pitch Deck: [GitHub docs/PITCH_DECK.md]

---

## ✅ Final Checklist Before Submit

- [ ] All code committed and pushed
- [ ] README is comprehensive
- [ ] Video is uploaded and public
- [ ] Links are working
- [ ] Contracts deployed to testnets
- [ ] Frontend demo is live
- [ ] Team info added
- [ ] License included
- [ ] Feedback sections completed

---

## 🎯 Post-Submission

### For Judges Meeting (if selected)
Prepare to discuss:
1. Technical architecture in depth
2. Flare & Plasma integration details
3. Go-to-market strategy
4. Competitive advantages
5. Team background & commitment

### Materials to Bring
- Laptop with live demo ready
- Backup video on USB
- Printed pitch deck
- Smart contract diagrams
- Token economics breakdown

---

## 📞 Contact Info (for judges)

**Team Lead**: [Your name]
**Email**: [Your email]
**Twitter**: [Your handle]
**Discord**: [Your username]

---

**Good luck! 🚀**
