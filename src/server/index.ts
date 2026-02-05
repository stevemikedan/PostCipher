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
  ErrorResponse,
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { getDailyPuzzle, getPracticePuzzle, validatePuzzle } from './services/puzzle';
import { calculateScore, generateShareText, formatTime } from '../shared/types/puzzle';
import { initializePostDatabase, getAvailableSubreddits } from './services/post-database';

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

// ===== Puzzle API Endpoints =====

router.get<unknown, GetDailyPuzzleResponse | ErrorResponse>(
  '/api/puzzle/daily',
  async (_req, res): Promise<void> => {
    try {
      // Initialize database if needed (lazy initialization)
      await initializePostDatabase();
      
      // Always use current UTC date to ensure daily changes
      const today = new Date();
      const puzzle = await getDailyPuzzle(today);
      const puzzleNumber = parseInt((await redis.get('puzzle:number')) || '1', 10);

      console.log(`Serving daily puzzle for ${puzzle.date} (puzzle #${puzzleNumber})`);

      res.json({
        type: 'daily-puzzle',
        puzzle,
        puzzleNumber,
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
      // Initialize database if needed (lazy initialization)
      await initializePostDatabase();
      
      const subreddit = req.query.subreddit as string | undefined;
      const puzzle = await getPracticePuzzle(subreddit);

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

// Test endpoint to check if Reddit API is allowlisted
router.get<unknown, {
  allowlisted: boolean;
  status: string;
  message: string;
  details?: {
    statusCode?: number;
    postsFound?: number;
    error?: string;
  };
}>(
  '/api/test/reddit-api',
  async (_req, res): Promise<void> => {
    try {
      console.log('Testing Reddit API allowlisting...');
      
      // Try to fetch from a simple, reliable Reddit endpoint
      const testUrl = 'https://www.reddit.com/r/Showerthoughts/hot.json?limit=5';
      const response = await fetch(testUrl, {
        headers: {
          'User-Agent': 'PostCipher/1.0',
        },
      });

      const statusCode = response.status;
      const isSuccess = response.ok;

      if (isSuccess) {
        const data = await response.json();
        const posts = data.data?.children || [];
        
        console.log(`✅ Reddit API is allowlisted! Fetched ${posts.length} posts`);
        
        res.json({
          allowlisted: true,
          status: 'success',
          message: `Reddit API is allowlisted and working! Successfully fetched ${posts.length} posts.`,
          details: {
            statusCode,
            postsFound: posts.length,
          },
        });
      } else {
        // 403 Forbidden typically means not allowlisted
        // Other errors might be temporary
        const errorText = statusCode === 403 
          ? 'Domain not allowlisted (403 Forbidden)'
          : `HTTP ${statusCode} error`;
        
        console.log(`❌ Reddit API test failed: ${errorText}`);
        
        res.json({
          allowlisted: false,
          status: 'failed',
          message: `Reddit API is not accessible: ${errorText}`,
          details: {
            statusCode,
            error: errorText,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const is403 = errorMessage.includes('403') || errorMessage.includes('Forbidden');
      
      console.log(`❌ Reddit API test error: ${errorMessage}`);
      
      res.json({
        allowlisted: false,
        status: 'error',
        message: `Error testing Reddit API: ${errorMessage}`,
        details: {
          error: errorMessage,
        },
      });
    }
  }
);

router.post<unknown, ValidatePuzzleResponse | ErrorResponse, ValidatePuzzleRequest>(
  '/api/puzzle/validate',
  async (req, res): Promise<void> => {
    try {
      const { puzzleId, userMappings } = req.body;

      if (!puzzleId || !userMappings) {
        res.status(400).json({
          status: 'error',
          message: 'puzzleId and userMappings are required',
        });
        return;
      }

      // Get puzzle from cache or generate
      const dateString = new Date().toISOString().split('T')[0];
      const cacheKey = `puzzle:daily:${dateString}`;
      let puzzle = await redis.get(cacheKey);
      
      if (!puzzle) {
        // Try to get daily puzzle
        const dailyPuzzle = await getDailyPuzzle();
        puzzle = JSON.stringify(dailyPuzzle);
      }

      const puzzleData = JSON.parse(puzzle);
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
      const { puzzleId, time, hintsUsed, mistakes, mode } = req.body;

      if (!puzzleId) {
        res.status(400).json({
          status: 'error',
          message: 'puzzleId is required',
        });
        return;
      }

      const username = (await reddit.getCurrentUsername()) || 'anonymous';
      const score = calculateScore(time, hintsUsed, mistakes);

      const scoreData = {
        score,
        time,
        hintsUsed,
        mistakes,
        puzzleId,
        date: new Date().toISOString().split('T')[0],
        username,
      };

      // Store score in Redis (for potential leaderboard) - only for daily mode
      if (mode === 'daily') {
        const scoreKey = `score:${puzzleId}:${username}`;
        await redis.set(scoreKey, JSON.stringify(scoreData));
      }

      res.json({
        type: 'score-submitted',
        score: scoreData,
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
      const postLink = puzzle.source.permalink
        ? puzzle.source.permalink.startsWith('http')
          ? puzzle.source.permalink
          : `https://reddit.com${puzzle.source.permalink.startsWith('/') ? '' : '/'}${puzzle.source.permalink}`
        : '';

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
