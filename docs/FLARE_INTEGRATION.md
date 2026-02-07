# Flare Network Integration

## Overview

Our Decentralized Research Graph leverages **three core Flare protocols** to bring external data and fair randomness on-chain:

1. **FDC (Flare Data Connector)** - External data verification
2. **FTSO (Flare Time Series Oracle)** - Price feeds
3. **Random Number Generator** - Fair reviewer assignment

---

## 1. FDC (Flare Data Connector)

### Purpose
Verify academic data from external sources (CrossRef, arXiv, GitHub) before committing to blockchain.

### Use Cases

#### A. DOI Verification via CrossRef
```solidity
// Submit paper with DOI
function submitPaper(string memory ipfsHash, string memory doi) external {
    // ...payment logic...

    // Request external verification
    bytes32 requestId = fdcHub.requestData("crossref", doi);
    papers[paperId].fdcRequestId = requestId;
}

// Verify response
function verifyExternalData(uint256 paperId) external {
    Paper storage paper = papers[paperId];
    DataResponse memory response = fdcHub.getDataResponse(paper.fdcRequestId);

    require(response.verified, "Data not yet verified");
    paper.externalDataVerified = true;

    // Reward author for verified paper
    researchToken.mint(paper.author, 50 * 10**18);
}
```

**What we verify:**
- Paper exists in CrossRef database
- DOI is valid and registered
- Metadata matches (title, authors, publication date)
- Journal/conference legitimacy

#### B. Citation Tracking
```solidity
// Track citations from external databases
function verifyCitations(uint256 paperId) external {
    Paper storage paper = papers[paperId];

    // Query CrossRef for papers citing this DOI
    bytes32 requestId = fdcHub.requestData(
        "crossref",
        string.concat("citations/", paper.doi)
    );

    // Process response to update citation count
    DataResponse memory response = fdcHub.getDataResponse(requestId);
    uint256 externalCitations = abi.decode(response.data, (uint256));

    // Update on-chain citation count
    paper.citationCount = externalCitations;
}
```

**Benefits:**
- Detect citation gaming (comparing on-chain vs. external)
- Reward authors for real-world impact
- Transparent citation metrics

#### C. Replication Verification via GitHub
```solidity
// Verify replication study exists on GitHub/OSF
function verifyReplication(uint256 paperId, string memory replicationUrl) external {
    // Parse GitHub repo from URL
    bytes32 requestId = fdcHub.requestData("github", replicationUrl);

    DataResponse memory response = fdcHub.getDataResponse(requestId);

    // Check repository exists and contains replication code
    require(response.verified, "Replication not found");

    papers[paperId].replicationCount++;

    // Reward both parties
    researchToken.mint(papers[paperId].author, replicationRewardTokens);
    researchToken.mint(msg.sender, replicationRewardTokens / 2);
}
```

**Data Sources:**
- GitHub: Code repositories
- OSF (Open Science Framework): Study protocols
- Zenodo: Research data archives

### FDC Implementation Details

#### Interface
```solidity
interface IFlareDataConnector {
    struct DataRequest {
        bytes32 requestId;
        string dataSource;  // "crossref", "arxiv", "github"
        string query;       // DOI, paper ID, repo URL
        uint256 timestamp;
    }

    struct DataResponse {
        bytes32 requestId;
        bytes data;         // Encoded response
        bool verified;      // Oracle consensus reached
        uint256 timestamp;
    }

    function requestData(
        string memory dataSource,
        string memory query
    ) external returns (bytes32 requestId);

    function getDataResponse(bytes32 requestId)
        external view returns (DataResponse memory);
}
```

#### Supported Data Sources
| Source | Purpose | Query Format |
|--------|---------|--------------|
| CrossRef | DOI validation, citations | `doi:10.1234/example` |
| arXiv | Preprint metadata | `arxiv:2401.12345` |
| PubMed | Medical papers | `pmid:12345678` |
| GitHub | Replication code | `github:user/repo` |
| OSF | Study protocols | `osf:abc123` |

---

## 2. FTSO (Flare Time Series Oracle)

### Purpose
Get real-time price feeds for RESEARCH token to enable USD-denominated pricing.

### Use Cases

#### A. Token Price Conversion
```solidity
function getTokenPriceUSD() public view returns (uint256) {
    (uint256 price, , uint256 decimals) = ftsoRegistry.getCurrentPrice("RESEARCH");
    return price / (10 ** decimals);
}
```

#### B. Dynamic Submission Fees
```solidity
// Calculate submission fee in RESEARCH tokens based on USD price
function calculateSubmissionFeeInTokens() public view returns (uint256) {
    uint256 tokenPriceUSD = getTokenPriceUSD();
    return (submissionFeeUSD * 10**18) / tokenPriceUSD;
}

// Allow paying in RESEARCH instead of USDC
function submitPaperWithTokens(string memory ipfsHash, string memory doi) external {
    uint256 tokenFee = calculateSubmissionFeeInTokens();
    require(
        researchToken.transferFrom(msg.sender, address(this), tokenFee),
        "Token payment failed"
    );
    // ...rest of submission logic...
}
```

#### C. Economic Analytics
```solidity
// Track total value locked in platform
function getTVL() public view returns (uint256 tvlUSD) {
    uint256 tokenBalance = researchToken.balanceOf(address(this));
    uint256 tokenPrice = getTokenPriceUSD();
    uint256 usdcBalance = stablecoin.balanceOf(address(this));

    tvlUSD = (tokenBalance * tokenPrice / 10**18) + usdcBalance;
}
```

### FTSO Implementation

#### Interface
```solidity
interface IFtsoRegistry {
    function getCurrentPrice(string memory symbol)
        external view
        returns (
            uint256 price,
            uint256 timestamp,
            uint256 decimals
        );
}
```

#### Supported Assets
- Native token prices (FLR, ETH, BTC)
- Custom tokens (RESEARCH)
- Stablecoin pairs (USDC, USDT)

---

## 3. Random Number Generator (RNG)

### Purpose
Fair and unbiased reviewer assignment to prevent collusion and gaming.

### Use Cases

#### A. Random Reviewer Selection
```solidity
function _assignReviewers(uint256 paperId) internal {
    address[] memory activeReviewers = _getActiveReviewers();
    require(activeReviewers.length >= minReviewersRequired, "Not enough reviewers");

    // Use Flare RNG for selection
    for (uint256 i = 0; i < minReviewersRequired; i++) {
        uint256 randomSeed = randomProvider.getRandomNumber();

        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            randomSeed,
            paperId,
            i,
            block.timestamp
        ))) % activeReviewers.length;

        address selectedReviewer = activeReviewers[randomIndex];
        paperReviewers[paperId].push(selectedReviewer);

        emit ReviewerAssigned(paperId, selectedReviewer);
    }
}
```

#### B. Anonymous Peer Review
- Reviewers don't know who wrote the paper (blinded)
- Authors don't know who reviewed (anonymous)
- Assignment is cryptographically secure

#### C. Prevent Gaming
**Without RNG:**
- Authors could submit to friendly reviewers
- Reviewers could collude
- Gaming citation networks

**With Flare RNG:**
- Truly random assignment
- No prediction possible
- Audit trail on-chain

### RNG Implementation

#### Interface
```solidity
interface IRandomProvider {
    function getRandomNumber() external returns (uint256);
    function getSecureRandomNumber() external returns (uint256);
}
```

#### Security Properties
- **Unpredictable**: Uses VRF (Verifiable Random Function)
- **Tamper-proof**: Can't be manipulated by validators
- **Verifiable**: Anyone can verify randomness was fair

---

## Integration Benefits

### 1. Trust Minimization
- **Before**: Trust publishers to verify papers
- **After**: Cryptographic verification via FDC

### 2. Fair Economics
- **Before**: Publishers keep all revenue
- **After**: Direct rewards to researchers (prices via FTSO)

### 3. Unbiased Review
- **Before**: Editor assigns reviewers (bias risk)
- **After**: Random assignment via RNG (provably fair)

---

## Testing FDC Integration

### Local Testing (Mock)
```javascript
// Deploy mock FDC
const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
const fdc = await MockFDC.deploy();

// Request data
const tx = await researchGraph.submitPaper("QmHash...", "10.1234/doi");
await tx.wait();

// Mock response
const paper = await researchGraph.getPaper(1);
await fdc.setResponse(paper.fdcRequestId, encodedData, true);

// Verify
await researchGraph.verifyExternalData(1);
```

### Testnet Testing (Real FDC)
```bash
# Deploy to Flare Coston2
npx hardhat run scripts/deploy.js --network flare

# FDC will make real API calls to CrossRef
# Wait ~30 seconds for oracle consensus
# Then verify data
```

---

## Cost Analysis

### FDC Queries
- **CrossRef DOI lookup**: ~0.5 FLR per query
- **Citation tracking**: ~1 FLR per query
- **GitHub verification**: ~0.8 FLR per query

**Total per paper**: ~2-3 FLR (~$0.40-$0.60)

### FTSO Price Feeds
- **Free** (no gas cost, view function)

### RNG
- **Random number**: ~0.1 FLR per call

**Total platform cost**: ~$0.50 per paper submission (passed to user)

---

## Roadmap: Advanced FDC Use Cases

### Phase 2
- [ ] Plagiarism detection (compare paper embeddings)
- [ ] Author identity verification via ORCID
- [ ] Journal reputation scoring
- [ ] Semantic Scholar integration

### Phase 3
- [ ] Real-time citation alerts
- [ ] Cross-chain citation tracking
- [ ] ML-based review quality scoring
- [ ] Altmetric data (Twitter mentions, etc.)

---

## Feedback on Flare

### What Worked Well ✅
1. **FDC is powerful** - Access any API from smart contracts
2. **FTSO is reliable** - Real-time price feeds with high accuracy
3. **RNG is simple** - Easy integration, cryptographically secure
4. **Documentation** - Clear examples and guides

### Suggestions for Improvement 💡
1. **FDC Query Builder** - Visual tool for constructing complex queries
2. **More Academic APIs** - Pre-built connectors for CrossRef, arXiv, etc.
3. **FDC Testing Tools** - Local simulator for FDC responses
4. **Gas Optimization** - Batch FDC requests for multiple papers
5. **Response Caching** - Avoid duplicate queries for same DOI

---

## Conclusion

Flare's enshrined data protocols enable our platform to:
1. **Verify real-world research** (FDC)
2. **Price tokens fairly** (FTSO)
3. **Assign reviewers randomly** (RNG)

This is **the first academic platform** to bring external data verification on-chain at scale.

**Result**: Trustless, transparent, and fair research publishing.
