# Plasma Integration

## Overview

Our Decentralized Research Graph uses **Plasma Network** as the stablecoin payment layer for all economic transactions in the system.

## Why Plasma?

Plasma is purpose-built for stablecoin payments with:
- **Fast settlement** - Instant payments to reviewers
- **Low fees** - Cost-effective for micropayments
- **Privacy options** - Anonymous peer review payments
- **Stablecoin-native** - USDC as primary currency

## Integration Points

### 1. Submission Fees
- Researchers pay **$50 USDC** to submit papers
- Payment processed via Plasma's efficient payment rails
- Fees collected in contract for platform sustainability

```solidity
function submitPaper(string memory ipfsHash, string memory doi) external {
    require(
        stablecoin.transferFrom(msg.sender, address(this), submissionFeeUSD),
        "Submission fee payment failed"
    );
    // ... rest of logic
}
```

### 2. Review Rewards
- Reviewers receive **$100 USDC** per review
- Instant payment upon review submission
- Encourages quality peer review participation

```solidity
function submitReview(uint256 paperId, uint8 score, string memory ipfsHash) external {
    // ... review logic

    require(
        stablecoin.transfer(msg.sender, reviewRewardUSD),
        "Review reward payment failed"
    );
}
```

### 3. Access Payments (Future)
- Pay-per-access model for premium papers
- Subscription payments in USDC
- Micro-transactions for citations

## Privacy Features

Using Plasma's privacy capabilities, we can implement:
- **Anonymous payments** to reviewers (identity hidden)
- **Confidential amounts** for sensitive transactions
- **Private paper submissions** (encrypted until acceptance)

## Technical Implementation

### Contract Setup
```javascript
// In ResearchGraph constructor
IERC20 public stablecoin; // USDC on Plasma

constructor(
    address _stablecoin, // Plasma USDC address
    // ... other params
) {
    stablecoin = IERC20(_stablecoin);
}
```

### Frontend Integration
```javascript
// Connect to Plasma network
const plasmaProvider = new ethers.providers.JsonRpcProvider(
  'https://rpc-testnet.plasma.xyz'
);

// Approve USDC spending
const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
await usdcContract.approve(RESEARCH_GRAPH_ADDRESS, amount);

// Submit paper (triggers USDC transfer)
await researchGraph.submitPaper(ipfsHash, doi);
```

## Benefits for Research Economy

1. **Stable Pricing** - All fees in USD, no crypto volatility
2. **Global Access** - Researchers worldwide can participate
3. **Instant Settlements** - Reviewers paid immediately
4. **Transparent** - All payments on-chain and verifiable
5. **Efficient** - Low fees enable micropayments for citations

## Plasma-Specific Features (Roadmap)

- [ ] Batch payments for multiple reviewers
- [ ] Subscription model for journal access
- [ ] Cross-chain payment routing
- [ ] Privacy-preserving peer review payments
- [ ] Payment streaming for long-term grants

## Testing

```bash
# Deploy Mock USDC on Plasma testnet
npm run deploy:plasma

# Test payment flows
npm run test:payments
```

## Judging Criteria Alignment

This integration addresses Plasma's bounty focus areas:

✅ **Payment Experience** - Seamless USDC payments for all transactions
✅ **Accessibility** - Easy for researchers to participate with stablecoins
✅ **Speed & Efficiency** - Instant review rewards, low-cost submissions
✅ **Real-world Use Case** - Solving broken academic publishing economics

## Feedback on Building with Plasma

### Positive
- Simple ERC20 interface makes integration straightforward
- Fast testnet transactions for rapid development
- Clear documentation for stablecoin best practices

### Areas for Improvement
- Need more examples for privacy features
- Would benefit from payment batching utilities
- Better tooling for cross-chain stablecoin bridges

## Next Steps

1. Deploy on Plasma testnet
2. Integrate real USDC contract
3. Add payment privacy features
4. Test with real user flows
5. Optimize gas costs for batch payments
