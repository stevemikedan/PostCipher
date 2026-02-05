# Quick Test Instructions

## Step 1: Wait for Dev Server

The dev server is starting. Wait for it to finish building and show a playtest URL like:
```
Playtest URL: https://www.reddit.com/r/postcipher_dev?playtest=postcipher
```

## Step 2: Open the Playtest URL

Open the playtest URL in your browser.

## Step 3: Test Reddit API Allowlisting

Once the app loads, open the browser console (F12) and run:

```javascript
fetch('/api/test/reddit-api')
  .then(r => r.json())
  .then(data => {
    console.log('Reddit API Test Result:', data);
    if (data.allowlisted) {
      console.log('✅ Reddit API is allowlisted and working!');
      console.log(`Fetched ${data.details.postsFound} posts`);
    } else {
      console.log('❌ Reddit API is NOT allowlisted yet');
      console.log('Status:', data.status);
      console.log('Message:', data.message);
      console.log('Details:', data.details);
    }
  })
  .catch(err => console.error('Error:', err));
```

## Expected Results

### ✅ If Allowlisted:
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

## What Happens Next

- **If allowlisted**: Your app will automatically start using live Reddit posts! 🎉
- **If not allowlisted**: The domains in `devvit.json` will be submitted for review when you run `devvit upload`. The app will continue working with the curated library fallback.
