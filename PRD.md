# PostCipher - Reddit Daily Cryptogram Game
## Product Requirements Document (RALPH-Ready)

### Overview
A Reddit Custom Post game that delivers daily cryptogram puzzles sourced from trending Reddit posts. Players solve substitution ciphers to reveal quotes, with scoring based on time and hints used. Results are shareable in Wordle-style format.

### Core Requirements

#### 1. Daily Puzzle System
- **One puzzle per day** - Same puzzle for all users on a given date
- **Deterministic generation** - Uses date-based seed for consistent cipher mapping
- **Puzzle source**: Trending Reddit posts (with fallback to curated library)
- **Storage**: Redis for puzzle distribution and state management

#### 2. Puzzle Content Strategy
- **Primary source**: Top trending posts from Reddit (last 24 hours + historical "on this day")
- **Content filters**:
  - Character limit: 200-300 characters
  - Word count: 20-40 words
  - Profanity filter: Remove inappropriate content
  - Quality filter: Exclude low-quality titles/posts
  - Subreddit whitelist/blacklist: Configurable
- **Fallback**: Curated library of 50-100 quotes for hackathon demo
- **Post linking**: Show original Reddit post link after solving

#### 3. Game Modes

**Daily Mode (Scored)**
- One puzzle per day
- Time-based scoring (10,000 base - time penalty - hint penalty - mistake penalty)
- Results shareable to Reddit
- Leaderboard potential (future)

**Practice Mode (Unscored)**
- Random puzzles from library
- No scoring or sharing
- Unlimited puzzles
- Can select difficulty (if implemented)

#### 4. Cryptogram Engine
- **Cipher generation**: Date-seeded substitution cipher
- **Guarantee**: No letter maps to itself
- **Encryption**: Deterministic based on date + puzzle ID
- **Decryption**: User solves by mapping cipher letters to plaintext

#### 5. Gameplay Features
- **Hint system**: 3 hints per puzzle (reveals one letter)
- **Mistake tracking**: Counts incorrect letter assignments
- **Timer**: Tracks solve time
- **Keyboard**: QWERTY layout for letter selection
- **Tile selection**: Click cipher letter, then click plaintext letter
- **Clear function**: Remove all user mappings (keep hints)

#### 6. Scoring System
```
Base Score: 10,000
- Time penalty: -1 per second (max 5,000 seconds = 83 minutes)
- Hint penalty: -500 per hint used
- Mistake penalty: -50 per mistake
Minimum Score: 100
```

#### 7. Sharing Format
```
🔐 Reddit Cryptogram #47 - Feb 5, 2026
⏱️ 4:23 | 💡 1 hint | Score: 8,277
[Link to original post]
```

#### 8. Technical Architecture

**Client (`src/client/`)**
- React components for game UI
- Cryptogram rendering with tiles
- Keyboard input handling
- Timer and state management
- Share button with formatted output

**Server (`src/server/`)**
- `/api/puzzle/daily` - Get today's puzzle
- `/api/puzzle/practice` - Get random practice puzzle
- `/api/puzzle/validate` - Check if puzzle is solved
- `/api/score/submit` - Submit score (daily mode only)
- `/api/share/generate` - Generate shareable result string
- Reddit API integration for fetching posts
- Redis for puzzle caching and state

**Shared (`src/shared/`)**
- Cryptogram engine utilities
- Type definitions
- Puzzle data structures

### Implementation Phases

#### Phase 1: Core Engine (Days 1-2)
- Port cryptogram logic from demo
- Create shared utilities
- Set up basic game component

#### Phase 2: Reddit Integration (Days 3-4)
- Reddit API service
- Content filtering pipeline
- Daily puzzle generation system

#### Phase 3: Game Features (Days 5-6)
- Complete UI implementation
- Scoring system
- Practice mode
- Sharing functionality

#### Phase 4: Polish & Testing (Days 7-8)
- UI refinement
- Bug fixes
- Demo video preparation
- Submission

### Technical Constraints
- **Reddit Custom Post limits**: Must work in Reddit webview
- **Mobile-first**: Optimize for mobile experience
- **Serverless**: 30-second max request time
- **No external client requests**: All external calls from server
- **Redis**: Use for state management and caching

### Success Metrics
- Working daily puzzle system
- Smooth gameplay experience
- Shareable results format
- Reddit post integration
- Ready for hackathon submission
