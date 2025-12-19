# GitHub Repository Setup

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `edgelab` (or your preferred name)
3. Description: "Evidence-based trading analytics platform"
4. Choose **Private** or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Connect and Push

After creating the repo, run these commands:

```bash
cd /Users/calelane/trading/trading
git remote add origin https://github.com/YOUR_USERNAME/edgelab.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/edgelab.git
git branch -M main
git push -u origin main
```

