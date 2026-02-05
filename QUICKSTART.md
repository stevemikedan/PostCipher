# PostCipher - Quick Start Guide

## ✅ What's Been Implemented

Your PostCipher game is now fully integrated with Reddit's Devvit platform! Here's what's ready:

### Core Features
- ✅ Daily cryptogram puzzles (same puzzle for everyone each day)
- ✅ Practice mode with random puzzles
- ✅ Full cryptogram game UI (ported from your demo)
- ✅ Scoring system (time + hints + mistakes)
- ✅ Sharing functionality
- ✅ Hint system (3 hints per puzzle)
- ✅ Link to original Reddit post after solving

### Technical Implementation
- ✅ Cryptogram engine (deterministic cipher generation)
- ✅ Server API endpoints for puzzles, scoring, sharing
- ✅ Redis caching for daily puzzle distribution
- ✅ Curated quote library (10 quotes, expandable)
- ✅ Content filtering system (ready for Reddit API)
- ✅ Type-safe TypeScript throughout

## 🚀 Next Steps

### 1. Test Locally
```bash
cd postcipher
npm install
npm run dev
```

This will:
- Start the development server
- Create a playtest URL
- Open in your browser to test

### 2. Expand Curated Library
Edit `postcipher/src/server/services/puzzle-library.ts` to add more quotes (aim for 50-100 for hackathon submission).

### 3. Test Gameplay
- Test daily mode (should show same puzzle)
- Test practice mode (random puzzles)
- Test hints, scoring, sharing
- Test on mobile viewport

### 4. Polish & Deploy
- UI refinements
- Mobile optimization
- Demo video (max 3 min)
- Submit to hackathon

## 📁 Key Files

- **Game UI**: `src/client/game/App.tsx`
- **Game Logic**: `src/client/hooks/useCryptogram.ts`
- **Server API**: `src/server/index.ts`
- **Puzzle Service**: `src/server/services/puzzle.ts`
- **Curated Quotes**: `src/server/services/puzzle-library.ts`
- **Cipher Engine**: `src/shared/cryptogram/engine.ts`

## 🔧 Configuration

### Launch Date
Update `LAUNCH_DATE` in `src/server/services/puzzle.ts` to your actual launch date for puzzle numbering.

### Post Title
The post title is set in `src/server/core/post.ts` - currently shows date.

## 📝 Notes

- **Reddit API**: Currently uses curated library. Reddit API integration is architected but commented out (see `src/server/services/reddit.ts`) - can be enabled when Devvit API is fully configured.

- **Content Filtering**: System is ready for Reddit integration with filters for length, word count, subreddit whitelist/blacklist.

- **Daily Puzzles**: Uses date-based seeding for deterministic generation. Same date = same puzzle for all users.

## 🎯 Hackathon Checklist

- [x] Core game functionality
- [x] Daily puzzle system
- [x] Practice mode
- [x] Scoring system
- [x] Sharing functionality
- [ ] Expand curated library (50-100 quotes)
- [ ] UI polish
- [ ] Mobile testing
- [ ] Demo video
- [ ] Submission

## 🐛 Troubleshooting

**Game won't load?**
- Check browser console for errors
- Verify `npm run dev` is running
- Check that playtest URL is correct

**Puzzle not generating?**
- Check server logs in terminal
- Verify Redis is available (Devvit handles this)
- Check API endpoints are responding

**Sharing not working?**
- Verify puzzle is solved (daily mode only)
- Check browser clipboard permissions
- Check server logs for API errors

## 📚 Documentation

- **PRD**: `PRD.md` - Full product requirements
- **Implementation**: `IMPLEMENTATION.md` - Technical details
- **Devvit Docs**: https://developers.reddit.com/docs

Good luck with your hackathon submission! 🚀
