# Testing Reddit API Allowlisting

## Quick Test

I've added a test endpoint that will check if `reddit.com` is allowlisted.

### Method 1: Using Browser (Easiest)

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Get your playtest URL** (shown in terminal, looks like):
   ```
   https://www.reddit.com/r/postcipher_dev?playtest=postcipher
   ```

3. **Open the test endpoint** in your browser:
   ```
   http://localhost:3000/api/test/reddit-api
   ```
   
   Or if you're testing in the playtest environment, you'll need to access it through the Devvit webview. The endpoint will be available at:
   ```
   {your-playtest-url}/api/test/reddit-api
   ```

### Method 2: Using curl (Terminal)

```bash
# Make sure your dev server is running first
curl http://localhost:3000/api/test/reddit-api
```

### Method 3: Check Server Logs

When you run `npm run dev`, watch the terminal output. The test endpoint will log:
- ✅ `"Reddit API is allowlisted! Fetched X posts"` = **Working!**
- ❌ `"Reddit API test failed: Domain not allowlisted (403 Forbidden)"` = **Not allowlisted**

## Expected Response

### ✅ If Allowlisted (Working):
```json
{
  "allowlisted": true,
  "status": "success",
  "message": "Reddit API is allowlisted and working! Successfully fetched 5 posts.",
  "details": {
    "statusCode": 200,
    "postsFound": 5
  }
}
```

### ❌ If NOT Allowlisted:
```json
{
  "allowlisted": false,
  "status": "failed",
  "message": "Reddit API is not accessible: Domain not allowlisted (403 Forbidden)",
  "details": {
    "statusCode": 403,
    "error": "Domain not allowlisted (403 Forbidden)"
  }
}
```

## What This Tests

The endpoint tries to fetch from:
```
https://www.reddit.com/r/Showerthoughts/hot.json?limit=5
```

This is the same API call your app uses, so if this works, your app will work too!

## Next Steps

- **If allowlisted**: Your app will automatically start using live Reddit posts! 🎉
- **If not allowlisted**: Follow the instructions in `ALLOWLIST_GUIDE.md` to request allowlisting
