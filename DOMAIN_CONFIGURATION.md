# Domain Allowlisting Configuration

## ✅ Configuration Complete

Your domain allowlisting is **already configured** in `devvit.json`:

```json
"permissions": {
  "http": {
    "enable": true,
    "domains": ["reddit.com", "www.reddit.com"]
  }
}
```

## File Structure

- ✅ **`devvit.json`** - Contains domain configuration (CORRECT format for Devvit Web apps)
- ✅ **`package.json`** - Contains dependencies (no domain config needed here)
- ❌ **`devvit.yaml`** - Not needed (that's for Devvit Blocks/Mod Tools, not Devvit Web)

## How It Works

1. **Configuration**: Domains are declared in `devvit.json` ✅ (Already done!)
2. **Automatic Submission**: When you run `devvit playtest` or `devvit upload`, domains are automatically submitted
3. **Review**: Devvit admins review and approve/deny
4. **Status**: Check in Developer Settings (URL below)

## Next Steps

### Step 1: Upload Your App

Run this command to submit the domain request:

```bash
npm run deploy
# or
devvit upload
```

This will:
- Build your app
- Upload it to Devvit
- **Automatically submit `reddit.com` and `www.reddit.com` for approval**

### Step 2: Check Approval Status

The Developer Settings URL format is:
```
https://developers.reddit.com/apps/postcipher/developer-settings
```

**Note**: This URL may not work until:
- You've uploaded the app at least once (`devvit upload`)
- The app has been processed by Devvit's systems

**Alternative ways to check**:
1. Go to: https://developers.reddit.com
2. Navigate to "My Apps" or "Apps"
3. Find "postcipher"
4. Click on it to see app details
5. Look for "Developer Settings" or "Permissions" section

### Step 3: Verify It's Working

Once approved, test with:
```bash
npm run dev
# Then check logs for: "Fetched X posts from Reddit API" where X > 0
```

Or test the endpoint:
```javascript
// In browser console after opening playtest URL
fetch('/api/test/reddit-api').then(r => r.json()).then(console.log)
```

## Current Status

- ✅ **Configuration**: Complete in `devvit.json`
- ⏳ **Domain Request**: Will be submitted on next `devvit upload`
- ⏳ **Approval**: Pending (waiting for upload)
- ✅ **App Functionality**: Working (using curated library fallback)

## Verification

Your `devvit.json` currently has:
- ✅ `permissions.http.enable: true`
- ✅ `permissions.http.domains: ["reddit.com", "www.reddit.com"]`

This is the correct configuration! No changes needed.

## Troubleshooting

**If Developer Settings URL doesn't work:**
1. Make sure you've uploaded the app at least once: `devvit upload`
2. Try accessing through: https://developers.reddit.com → My Apps → postcipher
3. The URL might be: `https://developers.reddit.com/apps/{your-app-slug}/settings` (without "developer-")

**If domains aren't being submitted:**
- Make sure `devvit.json` has the `permissions.http` section (✅ already there)
- Run `devvit upload` (not just `devvit playtest` for production submission)
- Check terminal output for any errors during upload
