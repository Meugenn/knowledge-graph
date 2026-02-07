#!/bin/bash

echo "🛑 Stopping Hardhat node..."

# Kill by PID if saved
if [ -f .node.pid ]; then
    PID=$(cat .node.pid)
    kill $PID 2>/dev/null && echo "✅ Stopped node (PID: $PID)"
    rm .node.pid
fi

# Kill any process on port 8545
lsof -ti:8545 | xargs kill -9 2>/dev/null && echo "✅ Cleaned up port 8545"

echo "✅ All stopped!"
