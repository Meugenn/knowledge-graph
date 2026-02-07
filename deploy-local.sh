#!/bin/bash

echo "🚀 Starting Local Deployment..."
echo ""

# Kill any existing node on port 8545
echo "🧹 Cleaning up any existing nodes..."
lsof -ti:8545 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Hardhat node in background
echo "🔗 Starting Hardhat node..."
npx hardhat node > hardhat.log 2>&1 &
NODE_PID=$!
echo "   Node started with PID: $NODE_PID"

# Wait for node to be ready
echo "⏳ Waiting for node to be ready..."
sleep 5

# Check if node is running
if ! lsof -i :8545 > /dev/null 2>&1; then
    echo "❌ Error: Node failed to start"
    echo "Check hardhat.log for details"
    exit 1
fi

echo "✅ Node is ready!"
echo ""

# Deploy contracts
echo "📦 Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""

    # Run demo
    echo "🎬 Running demo..."
    npx hardhat run scripts/demo.js --network localhost

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ All done! Everything is working!"
    echo ""
    echo "📋 Contract addresses saved to: deployment.json"
    echo "📝 Node logs saved to: hardhat.log"
    echo ""
    echo "To stop the node:"
    echo "   kill $NODE_PID"
    echo ""
    echo "Or run: ./stop-node.sh"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Stopping node..."
    kill $NODE_PID
    exit 1
fi

# Save node PID for later
echo $NODE_PID > .node.pid
