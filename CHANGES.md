# Recent Changes - PostCipher Improvements

## ✅ Fixed Issues

### 1. Daily Puzzle System
**Problem**: Daily puzzles weren't changing daily and were using hardcoded posts in a cycle.

**Solution**:
- Created `post-database.ts` - Redis-based post database system
- Implemented hash-based daily puzzle selection using date string
- Ensures everyone gets the same puzzle on the same day (deterministic)
- Expanded curated library from 10 to 70 quotes
- Daily puzzles now properly change each day based on date hash

**How it works**:
- Uses `hashString('daily-YYYY-MM-DD')` to deterministically select a post
- Same date = same hash = same post for all users
- Different date = different hash = different post

### 2. Practice Mode Navigation
**Problem**: No way to finish a practice puzzle and move to another.

**Solution**:
- Added `loadNextPuzzle()` function to `useCryptogram` hook
- Added "Next Puzzle" button in victory screen for practice mode
- Practice puzzles now load new random puzzles from database
- Each practice puzzle is unique (random selection)

### 3. Scoring Implementation
**Problem**: Scoring wasn't fully thought out and implemented.

**Solution**:
- **Scoring Formula**:
  - Base: 10,000 points
  - Time penalty: -1 per second (max 5,000 seconds = 83 minutes)
  - Hint penalty: -500 per hint used
  - Mistake penalty: -50 per mistake
  - Minimum score: 100 points

- **Daily Mode**: 
  - Score is calculated and displayed
  - Score is submitted to server
  - Share functionality includes score

- **Practice Mode**:
  - Score is calculated and displayed (for reference)
  - Stats shown: Time, Hints, Mistakes
  - Score not submitted (practice only)

### 4. Post Database Architecture
**New System**:
- Posts stored in Redis as JSON array
- Automatic initialization on server start
- Hash-based selection for daily puzzles
- Random selection for practice puzzles
- Expandable - can add posts via `addPostToDatabase()`

## 📊 Scoring Display

**Daily Mode Victory Screen**:
- Score (large, prominent)
- Time
- Hints used
- Share button (copies formatted text)

**Practice Mode Victory Screen**:
- Time
- Hints used
- Mistakes
- Next Puzzle button
- View Original Post link

## 🔧 Technical Details

### Hash-Based Selection
```typescript
// Deterministic daily puzzle selection
const hash = hashString(`daily-${dateString}`);
const index = hash % posts.length;
const selectedPost = posts[index];
```

### Database Structure
- Redis key: `postcipher:posts:all` (JSON array of posts)
- Count key: `postcipher:posts:count` (number of posts)
- Auto-initializes on first server request

### Practice Mode Flow
1. User solves puzzle
2. Victory screen shows stats
3. Click "Next Puzzle" → loads new random puzzle
4. Repeat indefinitely

## 🎯 Next Steps

- [ ] Add more quotes to library (aim for 100+)
- [ ] Implement Reddit API integration for live posts
- [ ] Add leaderboard system
- [ ] Add daily streak tracking
- [ ] Improve scoring display/animations
