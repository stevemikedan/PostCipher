# Git Push Instructions

## Status

✅ Git initialized  
✅ Files committed  
✅ Remote added: `https://github.com/stevemikedan/PostCipher.git`  
⏳ **Authentication needed to push**

## Authentication Options

GitHub requires authentication to push. Choose one of these methods:

### Option 1: GitHub Personal Access Token (Recommended)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it: "PostCipher Local Dev"
   - Select scopes: Check `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Push with token:**
   ```bash
   cd C:\Users\steve\dev\PostCipher\postcipher
   git push -u origin main
   ```
   - When prompted for username: Enter `stevemikedan`
   - When prompted for password: **Paste your token** (not your GitHub password)

### Option 2: GitHub CLI (Easier)

1. **Install GitHub CLI** (if not installed):
   ```bash
   winget install GitHub.cli
   ```

2. **Authenticate:**
   ```bash
   gh auth login
   ```
   - Follow the prompts to authenticate

3. **Push:**
   ```bash
   cd C:\Users\steve\dev\PostCipher\postcipher
   git push -u origin main
   ```

### Option 3: SSH Keys (Most Secure)

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add SSH key to GitHub:**
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key

3. **Change remote to SSH:**
   ```bash
   git remote set-url origin git@github.com:stevemikedan/PostCipher.git
   ```

4. **Push:**
   ```bash
   git push -u origin main
   ```

### Option 4: Windows Credential Manager

If you've used GitHub before, Windows might have stored credentials:

1. **Check stored credentials:**
   - Open Windows Credential Manager
   - Look for `git:https://github.com`
   - Update if needed

2. **Push:**
   ```bash
   git push -u origin main
   ```

## Quick Push Command

Once authenticated, run:

```bash
cd C:\Users\steve\dev\PostCipher\postcipher
git push -u origin main
```

## Troubleshooting

**If you get "remote: Support for password authentication was removed":**
- You need to use a Personal Access Token instead of your password
- Follow Option 1 above

**If you get authentication errors:**
- Try Option 2 (GitHub CLI) - it's the easiest
- Or use Option 1 (Personal Access Token)

**If push succeeds:**
- Visit: https://github.com/stevemikedan/PostCipher
- You should see all your files!
