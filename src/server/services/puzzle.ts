// Puzzle generation and management service

import { redis } from '@devvit/web/server';
import {
  generateCipherMap,
  encryptText,
  getDailyPuzzleSeed,
  getPracticePuzzleSeed,
} from '../../shared/cryptogram/engine';
import type { Puzzle, RedditPost } from '../../shared/types/puzzle';
import { getDailyPost, getRandomPost } from './post-database';
import { fetchTrendingPosts, fetchRandomPost as fetchRedditPost } from './reddit';

/**
 * Hash a string to a number (deterministic)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

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
  
  // Try to fetch from Reddit API first, fallback to database
  let source: RedditPost;
  try {
    const redditPosts = await fetchTrendingPosts(100);
    if (redditPosts.length > 0) {
      // Use date hash to deterministically select from Reddit posts
      const hash = hashString(`daily-${dateString}`);
      const index = hash % redditPosts.length;
      source = redditPosts[index];
      console.log(`Selected Reddit post ${index} from ${redditPosts.length} posts for ${dateString}`);
    } else {
      throw new Error('No Reddit posts available');
    }
  } catch (error) {
    console.error('Error fetching from Reddit, using database:', error);
    // Fallback to database
    const normalizedDate = new Date(dateString + 'T00:00:00Z');
    source = await getDailyPost(normalizedDate);
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
 * Generate a practice puzzle
 * Tries Reddit API first, falls back to database
 * Optionally filter by subreddit
 */
export async function getPracticePuzzle(subreddit?: string): Promise<Puzzle> {
  let source: RedditPost;
  
  console.log(`Getting practice puzzle${subreddit ? ` for ${subreddit}` : ''}`);
  
  try {
    // Try Reddit API first
    const redditPost = await fetchRedditPost(subreddit);
    if (redditPost) {
      source = redditPost;
      console.log(`Using Reddit post from ${source.subreddit} (requested: ${subreddit || 'any'})`);
      
      // Verify subreddit matches if one was requested
      if (subreddit) {
        const requestedNormalized = subreddit.toLowerCase().replace(/^r\//, '');
        const actualNormalized = source.subreddit.toLowerCase().replace(/^r\//, '');
        if (requestedNormalized !== actualNormalized) {
          console.warn(`Subreddit mismatch: requested ${subreddit}, got ${source.subreddit}`);
        }
      }
    } else {
      throw new Error('No Reddit post found');
    }
  } catch (error) {
    console.error(`Error fetching from Reddit${subreddit ? ` for ${subreddit}` : ''}, using database:`, error);
    // Fallback to database - this will also filter by subreddit if provided
    try {
      source = await getRandomPost(subreddit);
      console.log(`Using database post from ${source.subreddit} (requested: ${subreddit || 'any'})`);
    } catch (dbError) {
      // If database also fails and subreddit was specified, try without filter
      if (subreddit) {
        console.warn(`No posts found for ${subreddit} in database, trying without filter`);
        source = await getRandomPost();
      } else {
        throw dbError;
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
