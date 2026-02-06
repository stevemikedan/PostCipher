# Mock Mode Testing Guide

## Overview

Mock mode allows you to test the Reddit API integration behavior without waiting for domain allowlist approval. It simulates successful Reddit API responses with multiple posts per subreddit.

## How to Enable Mock Mode

### Option 1: Environment Variable (Recommended)
Set the environment variable before running `devvit playtest`:
```bash
# Windows PowerShell
$env:USE_MOCK_REDDIT="true"
devvit playtest

# Windows CMD
set USE_MOCK_REDDIT=true
devvit playtest

# Linux/Mac
USE_MOCK_REDDIT=true devvit playtest
```

### Option 2: Code Change (Temporary)
Edit `postcipher/src/server/services/reddit.ts` and change:
```typescript
const USE_MOCK_REDDIT = process.env.USE_MOCK_REDDIT === 'true' || false;
```
to:
```typescript
const USE_MOCK_REDDIT = true; // Enable for testing
```

## Testing Endpoints

### Check Mock Mode Status
```
GET /api/test/mock-mode
```
Returns whether mock mode is currently enabled.

### Test Reddit API (Real API)
```
GET /api/test/reddit-api
```
Tests if the real Reddit API is allowlisted and accessible.

## Expected Behavior When API Works

### Daily Puzzle Mode
1. **First attempt**: Fetches trending posts from Reddit API
2. **Selection**: Uses date-based hash to deterministically select one post
3. **Fallback**: If API fails, uses curated library with same deterministic selection
4. **Result**: Same puzzle for everyone on the same day

### Practice Puzzle Mode

#### Without Subreddit Filter
1. **First attempt**: Fetches trending posts from multiple subreddits via Reddit API
2. **Selection**: Uses timestamp-based seed to select a random post (changes every second)
3. **Fallback**: If API fails, uses curated library with timestamp-based selection
4. **Result**: Different puzzle each time you click "New Puzzle"

#### With Subreddit Filter (e.g., r/AskReddit)
1. **First attempt**: Fetches posts from the specified subreddit via Reddit API
2. **Selection**: Uses timestamp-based seed to select a random post from that subreddit
3. **Fallback**: If API fails, filters curated library by subreddit, then uses timestamp-based selection
4. **Result**: Different puzzle from the selected subreddit each time (if multiple available)

## Mock Data Available

The mock data service (`reddit-mock.ts`) includes multiple posts per subreddit:

- **r/AskReddit**: 5 posts
- **r/todayilearned**: 4 posts
- **r/quotes**: 7 posts
- **r/GetMotivated**: 3 posts
- **r/Showerthoughts**: 3 posts

This allows you to test the "New Puzzle" functionality and verify that:
- Different puzzles are selected when clicking "New Puzzle"
- Subreddit filtering works correctly
- Timestamp-based selection provides variety

## Testing Checklist

When mock mode is enabled, verify:

- [ ] Daily puzzle loads successfully
- [ ] Practice puzzle loads successfully
- [ ] Practice puzzle with subreddit filter loads correctly
- [ ] Clicking "New Puzzle" loads a different puzzle
- [ ] Clicking "New Puzzle" multiple times shows variety (especially for r/quotes with 7 posts)
- [ ] Subreddit dropdown shows correct subreddits
- [ ] Selected subreddit matches the loaded puzzle's subreddit
- [ ] Puzzle solves correctly and shows victory modal
- [ ] Score calculation works
- [ ] "View Original Post" link works (will point to mock permalink)

## When Real API is Working

Once the Reddit API domain allowlist is approved:

1. **Disable mock mode** (remove environment variable or set to false)
2. **Test real API**: Use `/api/test/reddit-api` to verify allowlist status
3. **Verify behavior**: Same checklist as above, but with real Reddit posts
4. **Check logs**: Look for "Fetched X posts from Reddit API" instead of "[MOCK]"

## Differences Between Mock and Real API

| Feature | Mock Mode | Real API |
|---------|-----------|----------|
| Data Source | Hardcoded mock posts | Live Reddit posts |
| Post Count | Limited (5-7 per subreddit) | Many (50+ per subreddit) |
| Freshness | Static | Updates with new Reddit posts |
| Subreddit Filter | Exact match required | May include cross-posts |
| Rate Limiting | None | Subject to Reddit's limits |

## Troubleshooting

### Mock mode not working
- Check environment variable is set: `echo $USE_MOCK_REDDIT` (or equivalent)
- Check server logs for "[MOCK MODE]" messages
- Verify `USE_MOCK_REDDIT` constant in `reddit.ts`

### Still seeing curated library posts
- Mock mode may not have posts for that subreddit
- Check `reddit-mock.ts` to see available mock posts
- Add more mock posts if needed for testing

### Want to test with more variety
- Edit `reddit-mock.ts` to add more posts per subreddit
- Or temporarily disable mock mode and use curated library (which has more posts)
