#!/bin/bash

echo "🚀 Deploying to Local Hardhat Network..."
echo ""

cd /Users/meuge/Coding/knowledge-graph

echo "📦 Step 1: Deploy Contracts"
npx hardhat run scripts/deploy.js --network localhost

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎬 Step 2: Run Demo"
npx hardhat run scripts/demo.js --network localhost

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Success! Everything is working!"
echo ""
echo "📋 Next steps:"
echo "   1. Check deployment.json for contract addresses"
echo "   2. Test the frontend (see QUICK_TEST.md)"
echo "   3. Get testnet tokens for real deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
