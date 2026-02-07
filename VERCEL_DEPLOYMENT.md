# 🚀 Deploy to Vercel

Deploy your Research Graph frontend to Vercel for a live demo!

---

## ⚡ Quick Deploy (5 minutes)

### Option 1: Deploy via Vercel CLI (Fastest)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Deploy**
```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? research-graph (or your choice)
# - In which directory? ./
# - Override settings? No
```

**Step 4: Get Your URL**
```bash
# After deployment completes, you'll get a URL like:
# https://research-graph-xyz.vercel.app
```

### Option 2: Deploy via Vercel Website (Easiest)

**Step 1: Push to GitHub**
```bash
# Make sure everything is committed
git add .
git commit -m "Ready for Vercel deployment"

# Create repo on GitHub and push
# (Follow GitHub instructions)
```

**Step 2: Import to Vercel**
1. Go to https://vercel.com
2. Sign up/login (use GitHub account)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
6. Click "Deploy"

**Step 3: Wait for Deployment**
- Takes ~2 minutes
- You'll get a live URL!

---

## 🔧 After Deployment

### Update Contract Addresses

Once you deploy to Flare Coston2 testnet, update the addresses:

**Via Vercel Dashboard:**
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add these variables:
   ```
   REACT_APP_RESEARCH_GRAPH=0x... (your deployed address)
   REACT_APP_RESEARCH_TOKEN=0x...
   REACT_APP_USDC=0x...
   REACT_APP_NETWORK=flare
   REACT_APP_CHAIN_ID=114
   ```
4. Redeploy

**Or update frontend/.env.production:**
```bash
# Edit frontend/.env.production with real addresses
git commit -am "Update contract addresses"
git push

# Vercel auto-redeploys on push!
```

---

## 📋 Current Configuration

Your `vercel.json` is already set up:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "framework": "create-react-app"
}
```

---

## 🎯 For Hackathon Demo

### Workflow:

1. **Deploy to Vercel now** (with localhost addresses)
   - Shows judges you have a live demo
   - URL: `https://your-project.vercel.app`

2. **Get testnet tokens** from Flare faucet

3. **Deploy contracts to Flare Coston2**
   ```bash
   npm run deploy:flare
   ```

4. **Update Vercel with real addresses**
   - Method 1: Update env vars in Vercel dashboard
   - Method 2: Update .env.production and push

5. **Test live demo**
   - Users can connect to Flare testnet
   - Submit real papers on-chain

6. **Share URL in submission**
   - DoraHacks submission form
   - Demo video
   - README

---

## 🌐 What Judges Will See

When they visit your Vercel URL:

1. **Beautiful landing page**
   - "Connect Wallet to Get Started"
   - Feature highlights

2. **Working demo** (after connecting wallet)
   - Submit papers
   - Review papers
   - View stats
   - All features functional

3. **Network switching**
   - Easy toggle between Flare/Plasma

4. **Professional UI**
   - Responsive design
   - Clean interface
   - Real Web3 integration

---

## 🔗 Custom Domain (Optional)

Want a custom domain like `research-graph.eth`?

1. **Via Vercel:**
   - Settings → Domains
   - Add custom domain
   - Follow DNS instructions

2. **Via ENS (for .eth domain):**
   - Buy ENS name
   - Point to Vercel deployment

---

## 🐛 Troubleshooting

### "Build failed"
→ Check build logs in Vercel dashboard
→ Test locally first: `cd frontend && npm run build`

### "Page not found"
→ Make sure `_redirects` file exists in `frontend/public/`

### "Contracts not loading"
→ Check environment variables in Vercel
→ Make sure addresses are correct

### "MetaMask connection fails"
→ Users need to add Flare network to MetaMask
→ Add network switching instructions to your UI

---

## 📊 Deployment Status

After deployment, you can:

**Check deployment:**
```bash
vercel ls
```

**View logs:**
```bash
vercel logs
```

**Redeploy:**
```bash
vercel --prod
```

---

## ✅ Pre-Deployment Checklist

Before deploying:
- [x] Frontend builds successfully ✅
- [x] vercel.json configured ✅
- [x] .env.production set up ✅
- [x] _redirects file created ✅
- [ ] Git repository initialized
- [ ] Committed all changes
- [ ] (Optional) Pushed to GitHub

After deployment:
- [ ] Test live URL
- [ ] Connect MetaMask
- [ ] Verify features work
- [ ] Update README with live URL
- [ ] Add URL to submission

---

## 🎬 Demo Flow on Vercel

**For Judges:**
1. Visit your Vercel URL
2. Click "Connect Wallet"
3. Switch to Flare Coston2 network
4. Submit a test paper
5. See external verification via Flare FDC
6. Review workflow
7. Token rewards

**Pro tip:** Record your demo video using the live Vercel deployment!

---

## 💰 Cost

**Vercel Free Tier:**
- ✅ Unlimited deployments
- ✅ HTTPS included
- ✅ Auto-scaling
- ✅ Perfect for hackathons

---

## 🚀 Deploy Now!

Choose your method:

**CLI (5 min):**
```bash
npm install -g vercel
vercel login
vercel
```

**Website (5 min):**
1. Push to GitHub
2. Import at vercel.com
3. Deploy

**Either way, you'll have a live demo in minutes!**

---

**Your live demo URL will look like:**
`https://research-graph-eth-oxford.vercel.app`

Add this to your:
- DoraHacks submission
- README.md
- Demo video
- Pitch deck

**Let's deploy!** 🚀
