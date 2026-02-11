import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import type {
  GetDailyPuzzleResponse,
  GetPracticePuzzleResponse,
  ValidatePuzzleRequest,
  ValidatePuzzleResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
  GenerateShareRequest,
  GenerateShareResponse,
  GetScoreHistoryResponse,
  SaveProgressRequest,
  SaveProgressResponse,
  PlayHistoryEntry,
  ErrorResponse,
  GetLeaderboardResponse,
  LeaderboardEntry,
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { getDailyPuzzle, getPracticePuzzle, validatePuzzle } from './services/puzzle';
import { calculateScore, generateShareText, formatTime } from '../shared/types/puzzle';
import { getRedditPostUrl } from '../shared/reddit-link';
import { initializePostDatabase, getAvailableSubreddits, repairLibraryPermalinks } from './services/post-database';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// ===== Post URL Endpoint =====

/**
 * Get the current post's Reddit URL (short, clean link to the game post).
 * Used for sharing so users get a proper Reddit link, not the long webview URL.
 */
router.get<unknown, { postUrl: string } | ErrorResponse>(
  '/api/post-url',
  async (_req, res): Promise<void> => {
    try {
      const { postId, subredditName } = context;
      if (!postId || !subredditName) {
        res.status(400).json({
          status: 'error',
          message: 'Post context not available',
        });
        return;
      }
      const cleanPostId = postId.replace(/^t3_/, '');
      const postUrl = `https://www.reddit.com/r/${subredditName}/comments/${cleanPostId}`;
      res.json({ postUrl });
    } catch (error) {
      console.error('Error getting post URL:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get post URL',
      });
    }
  }
);

// ===== Admin Endpoints =====

/**
 * Clear the daily puzzle cache (forces regeneration on next request).
 * Useful for testing or fixing cached puzzles with bad data.
 */
router.post<unknown, { status: string; message: string }>(
  '/api/admin/clear-daily-cache',
  async (_req, res): Promise<void> => {
    try {
      const dateString = new Date().toISOString().split('T')[0];
      const cacheKey = `puzzle:daily:${dateString}`;
      await redis.delete(cacheKey);
      await redis.delete('puzzle:daily:cached');
      console.log(`Cleared daily puzzle cache for ${dateString}`);
      res.json({ status: 'success', message: `Cleared daily puzzle cache for ${dateString}` });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to clear cache',
      });
    }
  }
);

/**
 * Repair permalinks for all posts in the library.
 * Fixes posts that were saved with bad or missing permalinks.
 */
router.post<unknown, { status: string; message: string; fixedCount: number }>(
  '/api/admin/repair-library',
  async (_req, res): Promise<void> => {
    try {
      const fixedCount = await repairLibraryPermalinks();
      console.log(`Repaired library: ${fixedCount} posts fixed`);
      res.json({ 
        status: 'success', 
        message: `Repaired ${fixedCount} posts with bad permalinks`,
        fixedCount 
      });
    } catch (error) {
      console.error('Error repairing library:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to repair library',
        fixedCount: 0,
      });
    }
  }
);

// ===== Puzzle API Endpoints =====

const MAX_HISTORY_ENTRIES = 100;

router.get<unknown, GetDailyPuzzleResponse | ErrorResponse>(
  '/api/puzzle/daily',
  async (_req, res): Promise<void> => {
    try {
      await initializePostDatabase();
      const today = new Date();
      const puzzle = await getDailyPuzzle(today);
      const puzzleNumber = parseInt((await redis.get('puzzle:number')) || '1', 10);

      let completed: boolean | undefined;
      let completedScore: GetDailyPuzzleResponse['completedScore'];

      try {
        const username = (await reddit.getCurrentUsername()) || 'anonymous';
        const scoreKey = `score:${puzzle.id}:${username}`;
        const stored = await redis.get(scoreKey);
        if (stored) {
          const data = JSON.parse(stored);
          completed = true;
          completedScore = {
            score: data.score,
            time: data.time,
            hintsUsed: data.hintsUsed,
            mistakes: data.mistakes ?? 0,
            puzzleId: data.puzzleId,
            date: data.date,
            username: data.username,
          };
        }
      } catch (e) {
        // Ignore; completed stays undefined
      }

      res.json({
        type: 'daily-puzzle',
        puzzle,
        puzzleNumber,
        ...(completed && completedScore ? { completed, completedScore } : {}),
      });
    } catch (error) {
      console.error('Error getting daily puzzle:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get daily puzzle',
      });
    }
  }
);

router.get<unknown, GetPracticePuzzleResponse | ErrorResponse>(
  '/api/puzzle/practice',
  async (req, res): Promise<void> => {
    try {
      await initializePostDatabase();

      const subreddit = req.query.subreddit as string | undefined;
      const seedParam = req.query.seed as string | undefined;
      const requestSeed =
        seedParam && !Number.isNaN(Number(seedParam)) ? Number(seedParam) : undefined;
      const puzzle = await getPracticePuzzle(subreddit, requestSeed);

      res.json({
        type: 'practice-puzzle',
        puzzle,
      });
    } catch (error) {
      console.error('Error getting practice puzzle:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get practice puzzle',
      });
    }
  }
);

router.get<unknown, { subreddits: string[] } | ErrorResponse>(
  '/api/practice/subreddits',
  async (_req, res): Promise<void> => {
    try {
      // Initialize database if needed (lazy initialization)
      await initializePostDatabase();
      
      const subreddits = await getAvailableSubreddits();
      res.json({ subreddits });
    } catch (error) {
      console.error('Error getting subreddits:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get subreddits',
      });
    }
  }
);

// Test endpoint to check mock mode status
router.get<unknown, {
  mockModeEnabled: boolean;
  message: string;
  instructions?: string;
}>(
  '/api/test/mock-mode',
  async (_req, res): Promise<void> => {
    const mockModeEnabled = process.env.USE_MOCK_REDDIT === 'true';
    res.json({
      mockModeEnabled,
      message: mockModeEnabled 
        ? 'Mock mode is enabled - Reddit API calls will use mock data'
        : 'Mock mode is disabled - using real Reddit API (or falling back to curated library)',
      instructions: mockModeEnabled
        ? undefined
        : 'To enable mock mode, set USE_MOCK_REDDIT=true in your environment variables',
    });
  }
);

// Test endpoint: Devvit Reddit API (no HTTP allowlist) then HTTP fallback
router.get<unknown, {
  source: 'devvit' | 'http' | 'none';
  status: string;
  message: string;
  details?: {
    postsFound?: number;
    sampleTitles?: string[];
    subreddit?: string;
    error?: string;
  };
}>(
  '/api/test/reddit-api',
  async (_req, res): Promise<void> => {
    try {
      const { fetchTrendingPosts } = await import('./services/reddit');
      const posts = await fetchTrendingPosts(10);
      if (posts.length > 0) {
        const source = posts[0] ? 'devvit' : 'http'; // fetchTrendingPosts tries Devvit first
        console.log(`✅ Reddit API working: ${posts.length} posts (source: ${source})`);
        res.json({
          source: 'devvit',
          status: 'success',
          message: `Reddit API working! Fetched ${posts.length} posts (Devvit API preferred).`,
          details: {
            postsFound: posts.length,
            sampleTitles: posts.slice(0, 5).map((p) => p.title.substring(0, 60)),
            subreddit: posts[0]?.subreddit,
          },
        });
        return;
      }
      res.json({
        source: 'none',
        status: 'no_posts',
        message: 'No posts returned (Devvit API and HTTP fallback returned empty).',
        details: { postsFound: 0 },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Reddit API test error: ${errorMessage}`);
      res.json({
        source: 'none',
        status: 'error',
        message: `Error: ${errorMessage}`,
        details: { error: errorMessage },
      });
    }
  }
);

// Test endpoint: fetch by subreddit and sort (hot / new / top / rising)
router.get<unknown, {
  status: string;
  source: string;
  postsFound: number;
  subreddit: string;
  sort?: string;
  sampleTitles?: string[];
  error?: string;
}>(
  '/api/test/reddit-by-subreddit',
  async (req, res): Promise<void> => {
    try {
      const subreddit = (req.query.subreddit as string) || 'Showerthoughts';
      const sort = ((req.query.sort as string) || 'hot') as 'hot' | 'new' | 'top' | 'rising';
      const { fetchPostsForSubreddit } = await import('./services/reddit');
      const posts = await fetchPostsForSubreddit(subreddit, 15, sort);
      res.json({
        status: posts.length > 0 ? 'success' : 'no_posts',
        source: 'devvit_or_http',
        postsFound: posts.length,
        subreddit: `r/${subreddit.replace(/^r\//, '')}`,
        sort,
        sampleTitles: posts.slice(0, 5).map((p) => p.title.substring(0, 60)),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.json({
        status: 'error',
        source: 'none',
        postsFound: 0,
        subreddit: (req.query.subreddit as string) || 'Showerthoughts',
        error: errorMessage,
      });
    }
  }
);

/** Build canonical Reddit URL for a post (used for "View original" and history). */
function postToRedditUrl(post: { id: string; permalink?: string; subreddit?: string }): string {
  if (post.permalink) {
    const path = post.permalink.startsWith('/') ? post.permalink : `/${post.permalink}`;
    return `https://www.reddit.com${path}`;
  }
  const sub = (post.subreddit || '').replace(/^r\//, '') || 'reddit';
  return `https://www.reddit.com/r/${sub}/comments/${post.id}`;
}

// Diagnostic: verify API → sync → library flow and that each library post has a correct Reddit link
router.get<unknown, {
  ok: boolean;
  message: string;
  apiFetched: number;
  syncNewAdded: number;
  libraryTotal: number;
  sampleFromLibrary: Array<{ id: string; title: string; subreddit: string; redditUrl: string; hasPermalink: boolean }>;
  error?: string;
}>(
  '/api/test/sync-and-library',
  async (req, res): Promise<void> => {
    try {
      const subreddit = (req.query.subreddit as string) || 'Showerthoughts';
      const { fetchPostsForSubreddit } = await import('./services/reddit');
      const { syncRedditPostsToLibrary, getAllPosts } = await import('./services/post-database');

      const fetched = await fetchPostsForSubreddit(subreddit, 20, 'hot');
      const newAdded = fetched.length > 0 ? await syncRedditPostsToLibrary(fetched) : 0;
      const allPosts = await getAllPosts();
      const sample = allPosts.slice(0, 8).map((p) => ({
        id: p.id,
        title: (p.title || '').substring(0, 50),
        subreddit: p.subreddit || '',
        redditUrl: postToRedditUrl(p),
        hasPermalink: Boolean(p.permalink),
      }));

      res.json({
        ok: true,
        message:
          fetched.length > 0
            ? `Fetched ${fetched.length} from API, synced (${newAdded} new). Library has ${allPosts.length} posts.`
            : `No posts from API for r/${subreddit}. Library has ${allPosts.length} posts (curated/previous sync).`,
        apiFetched: fetched.length,
        syncNewAdded: newAdded,
        libraryTotal: allPosts.length,
        sampleFromLibrary: sample,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Sync-and-library diagnostic error:', error);
      res.json({
        ok: false,
        message: 'Diagnostic failed',
        apiFetched: 0,
        syncNewAdded: 0,
        libraryTotal: 0,
        sampleFromLibrary: [],
        error: errorMessage,
      });
    }
  }
);

router.post<unknown, ValidatePuzzleResponse | ErrorResponse, ValidatePuzzleRequest>(
  '/api/puzzle/validate',
  async (req, res): Promise<void> => {
    try {
      const { puzzleId, userMappings, seed, cipherText } = req.body;

      if (!puzzleId || !userMappings) {
        res.status(400).json({
          status: 'error',
          message: 'puzzleId and userMappings are required',
        });
        return;
      }

      let puzzleData: { cipherText: string; seed: string };

      if (puzzleId.startsWith('practice-') && seed && cipherText) {
        // Practice puzzles are not cached; client sends seed + cipherText for validation
        puzzleData = { cipherText, seed };
      } else {
        // Daily puzzle: get from cache or generate
        const dateString = new Date().toISOString().split('T')[0];
        const cacheKey = `puzzle:daily:${dateString}`;
        let puzzle = await redis.get(cacheKey);
        if (!puzzle) {
          const dailyPuzzle = await getDailyPuzzle();
          puzzle = JSON.stringify(dailyPuzzle);
        }
        puzzleData = JSON.parse(puzzle);
      }

      const validation = validatePuzzle(puzzleData, userMappings);

      res.json({
        type: 'validate',
        ...validation,
      });
    } catch (error) {
      console.error('Error validating puzzle:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to validate puzzle',
      });
    }
  }
);

// ===== Score API Endpoints =====

router.post<unknown, SubmitScoreResponse | ErrorResponse, SubmitScoreRequest>(
  '/api/score/submit',
  async (req, res): Promise<void> => {
    try {
      const { puzzleId, time, hintsUsed, mistakes, mode, postLink, subreddit, title } = req.body;

      if (!puzzleId) {
        res.status(400).json({
          status: 'error',
          message: 'puzzleId is required',
        });
        return;
      }

      const username = (await reddit.getCurrentUsername()) || 'anonymous';
      const score = calculateScore(time, hintsUsed, mistakes);
      const date = new Date().toISOString().split('T')[0];

      const scoreData = {
        score,
        time,
        hintsUsed,
        mistakes,
        puzzleId,
        date,
        username,
      };

      let rank: number | undefined;
      let totalPlayers: number | undefined;

      if (mode === 'daily') {
        const scoreKey = `score:${puzzleId}:${username}`;
        await redis.set(scoreKey, JSON.stringify(scoreData));

        // Add to daily leaderboard sorted set (score as the sort value, higher is better)
        // Store entry data as JSON member, score as the zset score
        const leaderboardKey = `leaderboard:${puzzleId}`;
        const entryData = JSON.stringify({ username, score, time, hintsUsed });
        
        // Check if user already has an entry (only keep best score)
        const existingEntries = await redis.zRange(leaderboardKey, 0, -1);
        for (const existing of existingEntries) {
          try {
            const parsed = JSON.parse(existing.member);
            if (parsed.username === username) {
              // User already has entry - only update if new score is better
              if (score > parsed.score) {
                await redis.zRem(leaderboardKey, [existing.member]);
              } else {
                // Keep existing better score, just get rank
                const existingRank = await redis.zRank(leaderboardKey, existing.member);
                totalPlayers = existingEntries.length;
                // zRank is 0-indexed from lowest, we want rank from highest
                rank = existingRank !== undefined ? totalPlayers - existingRank : undefined;
                break;
              }
            }
          } catch {
            // Skip malformed entries
          }
        }

        // Add the score (if not skipped above due to existing better score)
        if (rank === undefined) {
          await redis.zAdd(leaderboardKey, { member: entryData, score });
          
          // Get user's rank (zRank returns 0-indexed from lowest score)
          const zRank = await redis.zRank(leaderboardKey, entryData);
          const count = await redis.zCard(leaderboardKey);
          totalPlayers = count;
          // Convert to 1-indexed rank from highest score
          rank = zRank !== undefined ? count - zRank : undefined;
        }
      }

      // Append to play history (for success rate, past plays, view original posts)
      const historyKey = `history:${username}`;
      const entry: PlayHistoryEntry = {
        puzzleId,
        date,
        score,
        time,
        hintsUsed,
        mistakes: mistakes ?? 0,
        mode,
        postLink: postLink ?? '',
        subreddit: subreddit ?? '',
        title: title ?? '',
      };
      const existingJson = await redis.get(historyKey);
      const history: PlayHistoryEntry[] = existingJson ? JSON.parse(existingJson) : [];
      history.unshift(entry);
      const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
      await redis.set(historyKey, JSON.stringify(trimmed));

      res.json({
        type: 'score-submitted',
        score: scoreData,
        rank,
        totalPlayers,
      });
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit score',
      });
    }
  }
);

router.get<unknown, GetScoreHistoryResponse | ErrorResponse>(
  '/api/score/history',
  async (_req, res): Promise<void> => {
    try {
      const username = (await reddit.getCurrentUsername()) || 'anonymous';
      const historyKey = `history:${username}`;
      const json = await redis.get(historyKey);
      const history: PlayHistoryEntry[] = json ? JSON.parse(json) : [];
      res.json({ type: 'score-history', history });
    } catch (error) {
      console.error('Error getting score history:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get history',
      });
    }
  }
);

// ===== Leaderboard API Endpoints =====

/**
 * Get the daily leaderboard for a specific puzzle.
 * Returns top 10 scores plus the current user's rank if they're on the board.
 */
router.get<unknown, GetLeaderboardResponse | ErrorResponse, unknown, { puzzleId?: string }>(
  '/api/leaderboard/daily',
  async (req, res): Promise<void> => {
    try {
      // Get puzzleId from query param, or use current daily puzzle
      let puzzleId = req.query.puzzleId;
      if (!puzzleId) {
        // Default to current daily puzzle
        const cachedPuzzle = await redis.get('puzzle:daily:cached');
        if (cachedPuzzle) {
          const parsed = JSON.parse(cachedPuzzle);
          puzzleId = parsed.id;
        }
      }

      if (!puzzleId) {
        res.status(400).json({
          status: 'error',
          message: 'puzzleId is required',
        });
        return;
      }

      const username = (await reddit.getCurrentUsername()) || 'anonymous';
      const leaderboardKey = `leaderboard:${puzzleId}`;

      // Get all entries sorted by score (highest first)
      // zRange with rev: true returns highest to lowest
      const allEntries = await redis.zRange(leaderboardKey, 0, -1, { by: 'rank', reverse: true });
      const totalPlayers = allEntries.length;

      // Parse entries and build leaderboard
      const entries: LeaderboardEntry[] = [];
      let userRank: number | undefined;
      let userEntry: LeaderboardEntry | undefined;

      for (let i = 0; i < allEntries.length; i++) {
        try {
          const parsed = JSON.parse(allEntries[i].member);
          const entry: LeaderboardEntry = {
            rank: i + 1,
            username: parsed.username,
            score: parsed.score,
            time: parsed.time,
            hintsUsed: parsed.hintsUsed,
          };

          // Track top 10 for display
          if (i < 10) {
            entries.push(entry);
          }

          // Track current user's position
          if (parsed.username === username) {
            userRank = i + 1;
            userEntry = entry;
          }
        } catch {
          // Skip malformed entries
        }
      }

      res.json({
        type: 'leaderboard',
        puzzleId,
        entries,
        userRank,
        userEntry,
        totalPlayers,
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get leaderboard',
      });
    }
  }
);

router.post<unknown, SaveProgressResponse | ErrorResponse, SaveProgressRequest>(
  '/api/progress/save',
  async (req, res): Promise<void> => {
    try {
      const { puzzleId, puzzle, userMappings, elapsedTime, hintsUsed, mistakes, mode, postLink, subreddit, title } = req.body;
      if (!puzzleId || !puzzle) {
        res.status(400).json({ status: 'error', message: 'puzzleId and puzzle are required' });
        return;
      }
      const username = (await reddit.getCurrentUsername()) || 'anonymous';
      const historyKey = `history:${username}`;
      const date = new Date().toISOString().split('T')[0];
      const entry: PlayHistoryEntry = {
        puzzleId,
        date,
        score: 0,
        time: elapsedTime,
        hintsUsed: hintsUsed ?? 0,
        mistakes: mistakes ?? 0,
        mode,
        postLink: postLink ?? '',
        subreddit: subreddit ?? '',
        title: title ?? '',
        isInProgress: true,
        savedPuzzle: puzzle,
        userMappings: userMappings ?? {},
        elapsedTime,
      };
      const existingJson = await redis.get(historyKey);
      const history: PlayHistoryEntry[] = existingJson ? JSON.parse(existingJson) : [];
      history.unshift(entry);
      const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
      await redis.set(historyKey, JSON.stringify(trimmed));
      res.json({ type: 'progress-saved' });
    } catch (error) {
      console.error('Error saving progress', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to save progress',
      });
    }
  }
);

// ===== Share API Endpoints =====

router.post<unknown, GenerateShareResponse | ErrorResponse, GenerateShareRequest>(
  '/api/share/generate',
  async (req, res): Promise<void> => {
    try {
      const { puzzleId, time, hintsUsed, score } = req.body;

      if (!puzzleId) {
        res.status(400).json({
          status: 'error',
          message: 'puzzleId is required',
        });
        return;
      }

      // Get puzzle to find puzzle number and post link
      const dateString = new Date().toISOString().split('T')[0];
      const cacheKey = `puzzle:daily:${dateString}`;
      const puzzleJson = await redis.get(cacheKey);
      
      if (!puzzleJson) {
        res.status(404).json({
          status: 'error',
          message: 'Puzzle not found',
        });
        return;
      }

      const puzzle = JSON.parse(puzzleJson);
      const puzzleNumber = parseInt((await redis.get('puzzle:number')) || '1', 10);
      const date = puzzle.date || dateString;

      const shareText = generateShareText(puzzleNumber, date, time, hintsUsed, score);
      const postLink = getRedditPostUrl(puzzle.source);

      res.json({
        type: 'share-generated',
        shareResult: {
          puzzleNumber,
          date,
          time,
          hintsUsed,
          score,
          shareText,
          postLink,
        },
      });
    } catch (error) {
      console.error('Error generating share:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate share',
      });
    }
  }
);

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
