# 📦 GitHub Setup - Quick Guide

## 🎯 Goal
Get your code on GitHub so:
1. ✅ Vercel auto-deploys on push
2. ✅ DoraHacks can see your code
3. ✅ Judges can review your work

---

## ⚡ 3-Minute Setup

### Step 1: Create Repository on GitHub (1 min)

1. Go to: **https://github.com/new**

2. Fill in:
   - **Repository name:** `decentralized-research-graph`
   - **Description:** `Blockchain knowledge graph for academic research with Flare & Plasma - ETH Oxford 2026`
   - **Visibility:** ✅ Public
   - **Initialize:** ❌ Don't add README (you already have one)

3. Click **"Create repository"**

---

### Step 2: Connect Your Local Repo (1 min)

GitHub will show you commands. Copy your username and run:

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/decentralized-research-graph.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Enter your GitHub credentials when prompted.**

---

### Step 3: Verify (30 sec)

Visit: `https://github.com/YOUR_USERNAME/decentralized-research-graph`

You should see:
- ✅ All your code
- ✅ README.md displayed
- ✅ All documentation files

---

## 🎉 What Happens Next

### Automatic Vercel Deploy
- Every `git push` triggers Vercel to rebuild
- Your live site updates automatically
- Check: https://vercel.com/eugene-ss-projects/knowledge-graph

### For DoraHacks Submission
- Use your GitHub repo URL
- Judges can see all your code
- Shows professionalism

---

## 🐛 Troubleshooting

### "Authentication failed"
→ Use personal access token instead of password
→ Go to: https://github.com/settings/tokens
→ Generate new token (classic)
→ Use token as password when pushing

### "Repository already exists"
→ You already have a repo with that name
→ Either delete it or use a different name

### "Permission denied"
→ Make sure you're logged into GitHub
→ Check your username is correct

---

## ✅ After GitHub Setup

**Run these commands to verify:**
```bash
# Check remote is set
git remote -v

# Should show:
# origin  https://github.com/YOUR_USERNAME/decentralized-research-graph.git (fetch)
# origin  https://github.com/YOUR_USERNAME/decentralized-research-graph.git (push)
```

**Now you can:**
```bash
# Make changes
git add .
git commit -m "Update something"
git push

# Vercel auto-deploys!
```

---

## 📋 For DoraHacks Submission

**GitHub URL to use:**
```
https://github.com/YOUR_USERNAME/decentralized-research-graph
```

**Add this to:**
- DoraHacks submission form
- README.md (as a badge)
- Demo video description

---

## 🎯 Next Steps After GitHub

1. ✅ GitHub repo created
2. ⏭️ Test live demo
3. ⏭️ Record video
4. ⏭️ Submit to DoraHacks

**Continue with:** `NEXT_2_HOURS.md`

---

**Quick Start:**
1. Go to https://github.com/new
2. Create repo
3. Run the `git remote add` command
4. `git push -u origin main`
5. Done!
