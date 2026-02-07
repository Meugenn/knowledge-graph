# Demo Video Script - Decentralized Research Graph

**Duration**: 4 minutes
**Goal**: Show judges the full flow and innovation

---

## Scene 1: Hook (0:00-0:20)

### Visuals
- Title card: "Decentralized Research Graph"
- Transition to problem graphics

### Script
> "Academic publishing is broken. Researchers perform $2 billion worth of peer review annually... for free. Publishers profit while scientists struggle. Citation gaming is rampant. The replication crisis continues. And most research is locked behind paywalls."

> "We're here to fix that with blockchain."

---

## Scene 2: Solution Overview (0:20-0:50)

### Visuals
- Architecture diagram showing Flare + Plasma integration
- Token flow animations

### Script
> "Introducing the Decentralized Research Graph - a blockchain-based knowledge graph where researchers actually get paid."

> "Here's how it works: Submit your paper and pay $50 in USDC via Plasma. We verify your paper's DOI using Flare's Data Connector, checking it against CrossRef. Reviewers are randomly assigned using Flare's RNG, preventing bias. They review your work and instantly receive $100 in USDC. When your paper is cited, you earn tokens. When it's replicated, you both earn tokens."

> "Let me show you."

---

## Scene 3: Live Demo - Submit Paper (0:50-1:30)

### Screen Recording
1. Open frontend at localhost:3000
2. Connect MetaMask wallet
3. Navigate to "Submit Paper" tab

### Script
> "First, I connect my wallet and switch to the Flare testnet."

> "Now I'll submit a paper. I enter the title: 'Novel Approaches to Decentralized Academic Publishing', add an abstract, and crucially, include a DOI."

> "The submission costs $50 USDC, paid through Plasma's payment layer. Watch as I approve the USDC transaction..."

[Show MetaMask popup]

> "...and submit."

[Transaction confirming]

> "Submitted! Notice what just happened behind the scenes:"

[Show console or transaction details]

> "1. My paper was uploaded to IPFS for decentralized storage"
> "2. A request was sent to Flare's Data Connector to verify this DOI exists in CrossRef"
> "3. Reviewers are being randomly assigned using Flare's cryptographic RNG"

---

## Scene 4: External Data Verification (1:30-2:00)

### Screen Recording
1. Navigate to "Papers" tab
2. Show paper with "Verify via Flare FDC" button
3. Click verify

### Script
> "Now here's where Flare's Data Connector shines. Let's verify the external data."

[Click verify button]

> "The FDC queries the CrossRef API, confirms this DOI exists, validates the metadata, and brings that proof on-chain. This is impossible without Flare."

[Show verified checkmark]

> "Verified! And as a reward for submitting a legitimate paper, I just earned 50 RESEARCH governance tokens."

> "This prevents fake papers from entering our knowledge graph - a critical innovation for academic integrity."

---

## Scene 5: Peer Review (2:00-2:30)

### Screen Recording
1. Navigate to "Review" tab
2. Show assigned papers
3. Fill out review form

### Script
> "Now let's switch to a reviewer's perspective. Reviewers first stake tokens to ensure quality - they can be slashed for poor reviews."

[Show reviewer registration]

> "Here are papers assigned to me via Flare's Random Number Generator. The assignment is anonymous and unpredictable."

[Open paper for review]

> "I read the paper, give it a score from 1 to 10, and write my detailed review."

[Submit review]

> "Submit... and boom! I instantly receive $100 USDC via Plasma. No waiting weeks for payment. No payment processors. Pure stablecoin, instant settlement."

> "This is the first time in history that peer review pays in real-time."

---

## Scene 6: Citations & Stats (2:30-3:00)

### Screen Recording
1. Navigate back to papers
2. Add a citation
3. Show stats page

### Script
> "When my paper gets accepted and others cite it, I earn 10 RESEARCH tokens per citation. This aligns incentives with impact."

[Add citation demo]

> "Let's check the platform statistics."

[Navigate to Stats tab]

> "We can see total papers, citations, acceptance rates, and most importantly - the integration with both Flare and Plasma working in harmony."

> "Flare handles the trust layer - external data verification, price feeds, and randomness. Plasma handles the payment layer - instant USDC transactions with privacy."

---

## Scene 7: Technical Deep Dive (3:00-3:30)

### Visuals
- Smart contract code snippets
- Architecture diagram

### Script
> "Under the hood, we're using Flare's FDC to query multiple data sources:"

[Show code]

```solidity
bytes32 requestId = fdcHub.requestData("crossref", doi);
```

> "CrossRef for DOI validation, GitHub for replication studies, and arXiv for preprint metadata."

> "Flare's FTSO provides price feeds so we can denominate everything in USD while using tokens."

> "And the Random Number Generator ensures fair reviewer assignment - cryptographically secure and verifiable."

> "On Plasma, every review payment is settled in under a second. No gas wars, no volatility - just stable, predictable payments."

---

## Scene 8: Impact & Vision (3:30-3:50)

### Visuals
- Market size graphics
- Impact statistics
- Vision animations

### Script
> "The academic publishing market is $19 billion annually. Peer review alone represents $2 billion in unpaid labor. We're addressing 100% of that market."

> "But this isn't just about money. It's about:
> - Making science open and accessible
> - Rewarding quality research
> - Preventing citation gaming with verifiable external data
> - Solving the replication crisis with incentives
> - Giving researchers control through governance"

> "This is the first academic platform to bring external data verification on-chain at scale."

---

## Scene 9: Call to Action (3:50-4:00)

### Visuals
- GitHub repo link
- Demo link
- Contact info

### Script
> "Try our live demo. All code is open source on GitHub. We're building the future of research - transparent, fair, and decentralized."

> "The contracts are deployed on Flare Coston2 and Plasma testnets. The revolution starts now."

[Fade to logo]

> "Decentralized Research Graph. Built at ETH Oxford 2026. Powered by Flare and Plasma."

---

## Post-Production Notes

### B-Roll to Include
- Animated token flows
- Smart contract deployment
- Network switching in MetaMask
- Transaction confirmations
- IPFS upload visualization

### Audio
- Background music: Upbeat, professional
- Voice: Clear, confident, not too fast
- Sound effects: Subtle for transactions

### Graphics Overlays
- Highlight Flare FDC queries
- Show Plasma payment confirmations
- Display token balances changing
- Emphasize "instant payment" and "verified"

### Text Overlays
- "Flare Data Connector → External Verification"
- "Plasma Network → Instant USDC Payments"
- "Flare RNG → Fair Assignment"
- "$100 USDC per review"
- "First verifiable academic knowledge graph"

---

## Equipment Needed

- Screen recording software (OBS, ScreenFlow, etc.)
- Good microphone
- Video editing software (Premiere, Final Cut, DaVinci Resolve)
- Running local demo environment
- Test accounts with funded wallets

---

## Before Recording Checklist

- [ ] Contracts deployed to testnet
- [ ] Frontend running locally
- [ ] MetaMask configured with testnet
- [ ] Test accounts have USDC and tokens
- [ ] All transactions tested and working
- [ ] Script practiced 2-3 times
- [ ] B-roll footage prepared
- [ ] Graphics/overlays ready
- [ ] Background music selected

---

## After Recording

- [ ] Edit for pacing (aim for 3:30-4:00)
- [ ] Add music and sound effects
- [ ] Insert graphics overlays
- [ ] Add subtitles/captions
- [ ] Color correction
- [ ] Export in 1080p MP4
- [ ] Upload to YouTube
- [ ] Test playback on different devices
- [ ] Add to DoraHacks submission

---

**Good luck! 🎬**
