# PostCipher Architecture

## Devvit Entry Point Flow

```
Reddit Post Feed
    ↓
splash.html (inline preview)
    ↓
splash.tsx (PostCipher intro screen)
    ↓
[User clicks "Play Now"]
    ↓
game.html (expanded full-screen)
    ↓
game.tsx → App.tsx (Cryptogram game)
```

## File Structure

```
postcipher/
├── src/
│   ├── client/
│   │   ├── splash/
│   │   │   └── splash.tsx      # Intro screen (inline in post feed)
│   │   ├── game/
│   │   │   ├── App.tsx         # Main cryptogram game component
│   │   │   └── game.tsx         # Entry point for expanded game
│   │   ├── hooks/
│   │   │   └── useCryptogram.ts # Game state management
│   │   ├── splash.html          # Splash HTML entry
│   │   ├── game.html            # Game HTML entry
│   │   └── index.css            # Global styles
│   ├── server/
│   │   ├── index.ts             # Express API endpoints
│   │   └── services/
│   │       ├── puzzle.ts        # Puzzle generation
│   │       ├── reddit.ts        # Reddit API (future)
│   │       └── puzzle-library.ts # Curated quotes
│   └── shared/
│       ├── cryptogram/
│       │   └── engine.ts        # Cipher generation logic
│       └── types/
│           ├── puzzle.ts        # Puzzle types
│           └── api.ts           # API types
└── devvit.json                  # Devvit configuration
```

## Entry Points (devvit.json)

- **`default`** (inline): `splash.html` → Shows in post feed preview
- **`game`** (expanded): `game.html` → Full-screen game experience

## Why This Architecture?

### Splash Screen (Inline)
- Shows in Reddit post feed without expansion
- Quick preview of what the game is
- Lightweight, fast loading
- Calls `requestExpandedMode()` to open full game

### Game Screen (Expanded)
- Full-screen experience for gameplay
- Better UX for interactive elements (keyboard, tiles)
- More space for cryptogram puzzle display
- Complete game functionality

## Navigation Flow

1. **User sees post in feed** → `splash.tsx` renders inline
2. **User clicks "Play Now"** → `requestExpandedMode('game')` called
3. **Reddit expands to full-screen** → `game.html` loads
4. **Game renders** → `game.tsx` → `App.tsx` → Cryptogram game

## Current Status

✅ Splash screen: PostCipher branded intro
✅ Game component: Full cryptogram game
✅ Navigation: Splash → Game expansion works
✅ API endpoints: Server ready for puzzle data

## Folder Structure Note

The `POSTCIPHER/postcipher` structure is fine - the outer folder is your workspace, inner `postcipher` is the Devvit app. This is standard for Devvit projects.
