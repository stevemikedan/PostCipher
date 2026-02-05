# Git Setup Guide

## Current Status

✅ Git is already initialized in this repository  
✅ You're on the `main` branch  
⏳ No commits yet  
⏳ No remote configured yet

## Steps to Push to Existing GitHub Repo

### Step 1: Add All Files

```bash
cd C:\Users\steve\dev\PostCipher\postcipher
git add .
```

### Step 2: Make Initial Commit

```bash
git commit -m "Initial commit: PostCipher cryptogram game"
```

### Step 3: Add Remote (Replace with your GitHub repo URL)

**Option A: If you have the GitHub repo URL:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Option B: If using SSH:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

**To find your repo URL:**
1. Go to your GitHub repo
2. Click the green "Code" button
3. Copy the HTTPS or SSH URL

### Step 4: Push to GitHub

**If the remote repo is empty:**
```bash
git push -u origin main
```

**If the remote repo already has commits (like a README):**
```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts if needed
git push -u origin main
```

## Quick Commands (Copy-Paste Ready)

Once you have your GitHub repo URL, run these in order:

```bash
# Navigate to project
cd C:\Users\steve\dev\PostCipher\postcipher

# Add all files
git add .

# Commit
git commit -m "Initial commit: PostCipher cryptogram game"

# Add remote (REPLACE WITH YOUR REPO URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## What's Included

The `.gitignore` file already excludes:
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env` - Environment variables
- Logs and temporary files

## Troubleshooting

**If you get "remote already exists":**
```bash
git remote remove origin
git remote add origin YOUR_REPO_URL
```

**If you get authentication errors:**
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys

**If remote repo has different branch name:**
```bash
# Check remote branch name
git ls-remote --heads origin

# Push to correct branch (e.g., 'master' instead of 'main')
git push -u origin main:master
```
