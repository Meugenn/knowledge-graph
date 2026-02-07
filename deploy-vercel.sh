#!/bin/bash

echo "🚀 Deploying Research Graph to Vercel..."
echo ""
echo "This will:"
echo "  1. Build the frontend"
echo "  2. Deploy to Vercel"
echo "  3. Give you a live URL"
echo ""
echo "You'll need to:"
echo "  - Login to Vercel (opens browser)"
echo "  - Confirm deployment settings"
echo ""
read -p "Ready to deploy? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📦 Deploying with npx vercel..."
echo ""

npx vercel

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Copy the deployment URL"
echo "  2. Test it in your browser"
echo "  3. Add URL to README.md"
echo "  4. Add URL to DoraHacks submission"
echo ""
echo "To deploy to production:"
echo "  npx vercel --prod"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
