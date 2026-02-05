# Domain Allowlisting Guide

## Quick Summary

**Problem**: Getting `403 Forbidden` errors when fetching from `reddit.com`  
**Solution**: ✅ **Already configured!** Domains are specified in `devvit.json` and will be requested automatically when you playtest or upload.

## How to Check if Reddit.com is Already Allowlisted

1. **Run your app**:
   ```bash
   npm run dev
   ```

2. **Check server logs**:
   - Look for: `"Fetched X posts from Reddit API"`
   - If X > 0: ✅ **Already allowlisted!** (working)
   - If you see 403 errors: ❌ **Not allowlisted yet** (needs configuration)

3. **Test in practice mode**:
   - Select a subreddit from the dropdown
   - If a puzzle loads with that subreddit's name: ✅ **Working!**
   - If it falls back to curated library: ⏳ **Still using fallback**

## Domain Configuration (Already Done!)

✅ **Domains are already configured in `devvit.json`:**

```json
"permissions": {
  "http": {
    "enable": true,
    "domains": ["reddit.com", "www.reddit.com"]
  }
}
```

## How Allowlisting Works

1. **Configuration**: ✅ Done! Domains are in `devvit.json`
2. **Automatic Submission**: When you run `devvit playtest` or `devvit upload`, the domains are automatically submitted for review
3. **Admin Review**: Devvit admins review and approve/deny (usually quick for Reddit domains)
4. **Check Status**: Visit https://developers.reddit.com/apps/postcipher/developer-settings

## Requesting Allowlisting

The domains will be **automatically requested** when you:

### Method 1: Playtest (Testing)
```bash
npm run dev
# or
devvit playtest
```
Domains are submitted for review during playtest.

### Method 2: Upload (Production)
```bash
devvit upload
```
Domains are submitted for review during upload.

### Check Approval Status

Visit your app's developer settings:
```
https://developers.reddit.com/apps/postcipher/developer-settings
```

Look for approved domains in the "HTTP Fetch" or "Permissions" section.

## Why We Need Allowlisting

Devvit's serverless environment restricts external HTTP requests for security. Even though we're accessing Reddit's own API, we need explicit permission.

**Current approach** (using `fetch` to Reddit's JSON API) is correct - Devvit's Reddit API client doesn't have methods for reading posts.

## Current Status

✅ **App works perfectly** with curated library fallback  
⏳ **Live Reddit fetching** waiting for allowlisting  
✅ **All features functional** regardless of allowlisting status

## Testing After Allowlisting

Once allowlisted, you should see:
- Server logs: `"Fetched X posts from Reddit API"` where X > 0
- Practice mode loads actual Reddit posts (not just curated library)
- Daily puzzle may pull from trending Reddit posts

If you still see 403 errors after allowlisting:
- Wait a few minutes (propagation delay)
- Check that you requested both `reddit.com` AND `www.reddit.com`
- Verify your app was re-uploaded after allowlisting was approved
