# The Republic — Demo Script
## ETH Oxford 2026 | Decentralised Research Verification

**Duration:** 4 minutes
**Setup:** Browser open to `localhost:5173`, MetaMask installed with Flare Coston2 testnet, LLM API key saved in Navigator settings

---

### ACT 1: The Problem (30 sec)

> "Science has a replication crisis. 70% of researchers have tried and failed to reproduce another scientist's experiments. Papers get published, but nobody checks if they're true. We built The Republic — a Plato-inspired platform where AI agents and prediction markets verify research at scale."

**[Show landing page]** — Point to the three tracks: DeFi (prediction markets), AI (agent swarms), Consumer (publishing primitives).

**[Click "Enter The Republic"]** — Connect MetaMask wallet.

---

### ACT 2: The Knowledge Graph (45 sec)

> "Everything starts with the knowledge graph — 50+ papers visualised as an interactive citation network."

**[You're on the Network tab]** — Pan and zoom the graph. Point out node sizes (larger = more citations), colours, and the citation edges connecting papers.

**[Type "attention" in search bar]** — Show papers appearing. Click on "Attention Is All You Need" node.

> "Every paper is a living object. From here I can send it to our prediction market, convert it into runnable code, or hand it to our AI agents for replication analysis."

**[Click "Add" button in toolbar]** — Show the three ways to add papers: Upload PDF (Grobid extracts metadata), Import JSON, or load from Sample Sources. Click "Top AI Papers" to demonstrate instant loading.

---

### ACT 3: Research Navigator (30 sec)

> "The Navigator is our RAG-powered research assistant. It searches the graph and answers with real citations."

**[Click "Navigator" button]** — Sidebar opens.

**[Type: "How did transformers change NLP?"]** — Wait for response.

> "Notice the inline citations — each number links to an actual paper in our graph with real citation counts. Click any citation to zoom to that paper on the graph."

**[Click a citation number]** — Graph zooms to the cited paper.

---

### ACT 4: AI Research Lab — Replication (60 sec)

> "This is where it gets interesting. Our AI Lab runs autonomous agent pipelines to analyse any paper."

**[Switch to AI Lab tab]** — Select "Attention Is All You Need" from the sidebar.

> "Five specialised agents — each a different caste from Plato's Republic — work together. Dr. Iris surveys the literature. Prof. Atlas designs the experimental framework. Agent Tensor simulates the experiments while Dr. Sage peer-reviews — in parallel. Dr. Formal writes Lean 4 theorem proofs. The Scribe synthesises everything into a replication report."

**[Click "Run" on Replicate mode]** — Watch the pipeline execute. Point out live timers on each agent card as they complete.

**[When done, scroll through the ReplicationReport]** — Show the verdict badge, feasibility score, and the Lean 4 formalisation section.

---

### ACT 5: Frontier Discovery + RALPH (45 sec)

> "Replication asks 'is this true?' Frontier Discovery asks 'what's next?'"

**[Switch to "Discover" mode]** — Select 2-3 papers. Click Run.

> "The agents now synthesise across papers — finding gaps nobody's explored, generating novel hypotheses, mapping cross-field connections."

**[Switch to "RALPH" mode]**

> "RALPH is our autonomous discovery loop. It picks papers, runs the frontier pipeline, extracts research queries, fetches new papers from OpenAlex and Semantic Scholar, scores them, and repeats. It's an AI that discovers what science should study next."

**[Click Start]** — Show the first iteration running, the queue filling with discovered papers, the verification panel checking for hallucinations.

---

### ACT 6: Prediction Markets (30 sec)

> "Every paper gets a prediction market. Will it replicate? Traders bet with USDC. Flare oracles verify the outcome. The market price IS the replication probability."

**[Switch to Markets tab]** — Show a market with yes/no prices, the LMSR formula, and the Polymarket integration for live data.

> "This creates a financial incentive to find and fund the most impactful, most uncertain research."

---

### ACT 7: The Full Loop (15 sec)

> "Paper uploaded. AI agents verify it. Prediction market prices it. Citation graph connects it. RALPH discovers what comes next. This is The Republic — where research is verified by code, priced by markets, and connected by knowledge."

**[Quick flash through tabs: Network → AI Lab → Markets → Live Feed]**

---

### CLOSING

> "Built on Flare and Plasma at ETH Oxford. The Republic — decentralised research verification."

**[Show the Live Feed tab with events streaming]**

---

## Quick Reference: Key Demo Clicks

| Step | Action | Expected Result |
|------|--------|-----------------|
| Connect | Click "Enter The Republic" | MetaMask popup, app loads |
| Graph | Search "attention" | Papers filter, click node opens sidebar |
| Add PDF | Click Add → Upload PDF → select file | Grobid extracts metadata, node spawns with cyan animation |
| Navigator | Type question | Concise answer with [1] [2] citation superscripts |
| AI Lab | Select paper → Run (Replicate) | 5 agents execute, report generated |
| Discover | Select 2+ papers → Run | Frontier report with gaps + hypotheses |
| RALPH | Click Start | Autonomous loop, papers discovered, verification running |
| Markets | View market | LMSR prices, bet interface, Polymarket link |

## Backup: If Something Breaks

- **MetaMask won't connect:** Demo works without wallet — just skip to Network tab directly
- **LLM API key missing:** Pre-save it in Navigator settings before demo
- **RALPH too slow:** Show 1 iteration, then pause and walk through the timeline
- **Graph empty:** Click Add → Sample Sources → "Top AI Papers" (loads instantly)
