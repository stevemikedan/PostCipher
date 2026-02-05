# Reddit API Integration Setup

## Current Status

The app is currently using a **curated library** of Reddit posts as the primary source. Reddit API integration is implemented but requires domain allowlisting.

## 403 Forbidden Errors

You're seeing `403 Forbidden` errors because:

1. **Domain Allowlisting Required**: Devvit requires external domains to be allowlisted for `fetch` requests from server code
2. **Reddit.com Not Allowlisted**: `reddit.com` needs to be allowlisted (though it may already be for Reddit's own platform)
3. **Fallback Working**: The app gracefully falls back to the curated library, so it works perfectly!

## Important: Devvit Reddit API Client vs. Public JSON API

**Devvit's Reddit API client** (`reddit` from `@devvit/web/server`) is primarily for **writing** to Reddit:
- ✅ `reddit.submitCustomPost()` - Create posts
- ✅ `reddit.submitComment()` - Create comments  
- ✅ `reddit.getCurrentUsername()` - Get current user
- ❌ **No methods for reading posts** from subreddits

**For reading Reddit data**, we must use `fetch` to Reddit's public JSON API:
- `https://www.reddit.com/r/{subreddit}/hot.json`
- `https://www.reddit.com/api/info.json?id=t3_{postId}`

This requires domain allowlisting.

## How to Enable Reddit API Integration

### ✅ Domain Configuration Added to devvit.json

I've added the domain configuration to your `devvit.json` file:

```json
"permissions": {
  "http": {
    "enable": true,
    "domains": ["reddit.com", "www.reddit.com"]
  }
}
```

### How Domain Allowlisting Works

1. **Configuration**: Domains are specified in `devvit.json` (already done!)
2. **Request Submission**: When you run `devvit playtest` or `devvit upload`, the domains are automatically submitted for review
3. **Admin Review**: Devvit admins will review and approve/deny the request
4. **Approval**: Once approved, the domains are allowlisted for your app

### Next Steps

1. **Test the current status**:
   ```bash
   npm run dev
   # Then test: curl http://localhost:3000/api/test/reddit-api
   ```

2. **If not allowlisted yet**, the domains will be submitted when you:
   - Run `devvit playtest` (for testing)
   - Run `devvit upload` (for production)

3. **Check approval status**:
   - Visit: https://developers.reddit.com/apps/postcipher/developer-settings
   - Look for approved domains in the "HTTP Fetch" section

### Important Notes

- **`reddit.com` is NOT on the global allowlist** - you must request it specifically
- Domains must be exact hostnames: `reddit.com` ✅, not `*.reddit.com` ❌
- Approval is usually quick for Reddit's own domains
- The configuration in `devvit.json` ensures the request is submitted automatically

### Step 3: Update User-Agent (Optional)

Reddit's public JSON API prefers specific User-Agent formats. The current implementation uses:
```
User-Agent: PostCipher/1.0
```

You may want to use a more standard format (update in `src/server/services/reddit.ts`):
```
User-Agent: PostCipher/1.0 by /u/YOUR_REDDIT_USERNAME
```

### Step 4: Verify Allowlisting

Once allowlisted (or if it was already allowlisted), test with:
```bash
npm run dev
# Try practice mode with different subreddits
# Check server logs for "Fetched X posts from Reddit API"
# If X > 0, it's working! If you still see 403 errors, allowlisting isn't configured yet
```

## Using Devvit CLI

The Devvit CLI (`devvit` command) is used for:
- ✅ `devvit login` - Authenticate with Reddit
- ✅ `devvit upload` - Upload your app
- ✅ `devvit playtest` - Test your app locally
- ✅ `devvit install` - Install app to subreddit
- ✅ `devvit logs` - View server logs
- ❌ **NOT for allowlisting domains** - that's done through the developer portal

**Current CLI commands don't include domain allowlisting** - this is configured through the web interface or during app review.

## Current Behavior

- ✅ **Daily Puzzles**: Uses curated library (deterministic, works perfectly)
- ✅ **Practice Puzzles**: Uses curated library (works perfectly)
- ✅ **Subreddit Filtering**: Works with curated library
- ⏳ **Live Reddit Posts**: Waiting for domain allowlisting

## Fallback System

The app has a robust fallback system:
1. Try Reddit API first
2. If 403/Forbidden → Fall back to curated library
3. If curated library fails → Error (shouldn't happen)

## For Hackathon Submission

**The app works perfectly as-is!** The curated library provides:
- 70+ diverse quotes from multiple subreddits
- Proper subreddit attribution
- Working permalinks
- All features functional

You can submit now, and enable live Reddit fetching post-hackathon once domain is allowlisted.

## Testing Reddit API

Once `reddit.com` is allowlisted, test with:
```bash
npm run dev
# Try practice mode with different subreddits
# Check server logs for "Fetched X posts from Reddit API"
```
