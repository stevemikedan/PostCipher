// Puzzle generation and management service

import { redis } from '@devvit/web/server';
import {
  generateCipherMap,
  encryptText,
  getDailyPuzzleSeed,
  getPracticePuzzleSeed,
} from '../../shared/cryptogram/engine';
import type { Puzzle, RedditPost } from '../../shared/types/puzzle';
import {
  getDailyPost,
  getRandomPost,
  selectPostFromPool,
  syncRedditPostsToLibrary,
} from './post-database';
import {
  fetchTrendingPosts,
  fetchRandomPost as fetchRedditPost,
  fetchPostsForSubreddit,
} from './reddit';

const PUZZLE_CACHE_PREFIX = 'puzzle:daily:';
const PUZZLE_NUMBER_KEY = 'puzzle:number';
const LAST_PUZZLE_DATE_KEY = 'puzzle:last-date';
const LAUNCH_DATE = '2026-02-05'; // Set to your launch date

/**
 * Get puzzle number (days since launch)
 */
async function getPuzzleNumber(): Promise<number> {
  const cached = await redis.get(PUZZLE_NUMBER_KEY);
  if (cached) {
    return parseInt(cached, 10);
  }

  // Calculate days since launch
  const launch = new Date(LAUNCH_DATE);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  launch.setHours(0, 0, 0, 0);
  const daysSinceLaunch = Math.floor((today.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24));
  const puzzleNumber = Math.max(1, daysSinceLaunch + 1);

  await redis.set(PUZZLE_NUMBER_KEY, puzzleNumber.toString());
  return puzzleNumber;
}

/**
 * Get normalized date string in UTC (YYYY-MM-DD)
 * Ensures consistent date regardless of server timezone
 */
function getNormalizedDateString(date: Date = new Date()): string {
  // Use UTC to ensure consistency across all servers/timezones
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  return utcDate.toISOString().split('T')[0];
}

/**
 * Generate or retrieve daily puzzle
 * Uses hash-based selection to ensure same puzzle for everyone on same day
 */
export async function getDailyPuzzle(date: Date = new Date()): Promise<Puzzle> {
  // Normalize to UTC date string to ensure consistency
  const dateString = getNormalizedDateString(date);
  const cacheKey = `${PUZZLE_CACHE_PREFIX}${dateString}`;

  // Check if we need to generate a new puzzle (date changed)
  const lastDate = await redis.get(LAST_PUZZLE_DATE_KEY);
  const dateChanged = lastDate !== dateString;

  // Check cache - but verify the cached puzzle is for today's date
  const cached = await redis.get(cacheKey);
  if (cached && !dateChanged) {
    const cachedPuzzle = JSON.parse(cached) as Puzzle;
    // Double-check the cached puzzle is for today
    if (cachedPuzzle.date === dateString) {
      console.log(`Returning cached puzzle for ${dateString}`);
      return cachedPuzzle;
    }
  }

  // If date changed, clear old caches
  if (dateChanged && lastDate) {
    console.log(`Date changed from ${lastDate} to ${dateString} - clearing old cache`);
    try {
      await redis.delete(`${PUZZLE_CACHE_PREFIX}${lastDate}`);
    } catch (err) {
      // Ignore if key doesn't exist
    }
  }

  // Generate new puzzle using hash-based post selection
  const puzzleNumber = await getPuzzleNumber();
  const normalizedDate = new Date(dateString + 'T00:00:00Z');

  // Prefer library first for fast response; refresh library in background for next time
  let source: RedditPost;
  try {
    source = await getDailyPost(normalizedDate);
    refreshLibraryInBackground();
  } catch (error) {
    console.error('Daily puzzle: no post in library, syncing from Reddit:', error);
    try {
      const redditPosts = await fetchTrendingPosts(100);
      if (redditPosts.length > 0) await syncRedditPostsToLibrary(redditPosts);
      source = await getDailyPost(normalizedDate);
    } catch (err2) {
      console.error('Error in daily puzzle (Reddit sync or getDailyPost):', err2);
      source = await getDailyPost(normalizedDate);
    }
  }

  const puzzleId = `daily-${dateString}`;
  const seed = getDailyPuzzleSeed(normalizedDate, puzzleId);
  const cipherMap = generateCipherMap(seed);
  const plainText = source.title.toUpperCase();
  const cipherText = encryptText(plainText, cipherMap);

  const puzzle: Puzzle = {
    id: puzzleId,
    cipherText,
    plainText,
    source,
    seed,
    date: dateString,
    mode: 'daily',
  };

  // Cache for 48 hours (safety buffer) - but will be replaced tomorrow anyway
  await redis.set(cacheKey, JSON.stringify(puzzle), { expirationTtl: 172800 });
  
  // Update last puzzle date
  await redis.set(LAST_PUZZLE_DATE_KEY, dateString);
  
  console.log(`Generated NEW daily puzzle for ${dateString} (puzzle #${puzzleNumber}, post: "${source.title.substring(0, 50)}...")`);
  
  return puzzle;
}

/**
 * Fire-and-forget: fetch from Reddit and sync to library so future practice loads stay fresh.
 * Does not block the response.
 */
function refreshLibraryInBackground(subreddit?: string): void {
  void (async () => {
    try {
      if (subreddit) {
        const batch = await fetchPostsForSubreddit(subreddit, 50);
        if (batch.length > 0) await syncRedditPostsToLibrary(batch);
      } else {
        const posts = await fetchTrendingPosts(50);
        if (posts.length > 0) await syncRedditPostsToLibrary(posts);
      }
    } catch (e) {
      console.warn('Background library refresh failed:', e);
    }
  })();
}

/**
 * Generate a practice puzzle.
 * Uses library first for fast load; refreshes library in the background for next time.
 * Falls back to Reddit fetch only when the library is empty or has no posts for the subreddit.
 */
export async function getPracticePuzzle(
  subreddit?: string,
  requestSeed?: number | string
): Promise<Puzzle> {
  let source: RedditPost;
  const seedForSelection = requestSeed ?? Date.now();

  console.log(`Getting practice puzzle${subreddit ? ` for ${subreddit}` : ''}`);

  // Fast path: try library first so we can return immediately
  try {
    source = await getRandomPost(subreddit, seedForSelection);
    console.log(`Using library post from ${source.subreddit}`);
    refreshLibraryInBackground(subreddit);
  } catch {
    // Slow path: library empty or no posts for subreddit — fetch from Reddit, sync, then use result
    if (subreddit) {
      try {
        const batch = await fetchPostsForSubreddit(subreddit, 50);
        if (batch.length > 0) {
          await syncRedditPostsToLibrary(batch);
          source = selectPostFromPool(batch, seedForSelection);
          console.log(
            `Using post from ${source.subreddit} (selected from batch of ${batch.length} by seed)`
          );
        } else {
          throw new Error('No posts returned for subreddit');
        }
      } catch (error) {
        console.error(
          `Error fetching batch for ${subreddit}, using library:`,
          error
        );
        try {
          source = await getRandomPost(subreddit, seedForSelection);
          console.log(`Using database post from ${source.subreddit}`);
        } catch {
          source = await getRandomPost(undefined, seedForSelection);
        }
      }
    } else {
      try {
        const redditPost = await fetchRedditPost();
        if (redditPost) {
          source = redditPost;
          await syncRedditPostsToLibrary([source]);
          console.log(`Using Reddit post from ${source.subreddit}`);
        } else {
          throw new Error('No Reddit post found');
        }
      } catch (error) {
        console.error('Error fetching from Reddit, using database:', error);
        source = await getRandomPost(undefined, seedForSelection);
        console.log(`Using database post from ${source.subreddit}`);
      }
    }
  }

  const puzzleId = `practice-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const seed = getPracticePuzzleSeed(puzzleId);
  const cipherMap = generateCipherMap(seed);
  const plainText = source.title.toUpperCase();
  const cipherText = encryptText(plainText, cipherMap);

  return {
    id: puzzleId,
    cipherText,
    plainText,
    source,
    seed,
    date: new Date().toISOString().split('T')[0],
    mode: 'practice',
  };
}

/**
 * Validate if puzzle is solved
 */
export function validatePuzzle(
  puzzle: Puzzle,
  userMappings: Record<string, string>
): { isSolved: boolean; correctMappings: number; totalMappings: number } {
  const cipherLetters = new Set(puzzle.cipherText.match(/[A-Z]/g) || []);
  let correctMappings = 0;
  let totalMappings = 0;

  for (const cipherLetter of cipherLetters) {
    const userGuess = userMappings[cipherLetter];
    if (userGuess) {
      totalMappings++;
      // Regenerate cipher map to check
      const cipherMap = generateCipherMap(puzzle.seed);
      if (userGuess === cipherMap.decode[cipherLetter]) {
        correctMappings++;
      }
    }
  }

  const isSolved =
    totalMappings === cipherLetters.size &&
    correctMappings === cipherLetters.size;

  return { isSolved, correctMappings, totalMappings };
}
