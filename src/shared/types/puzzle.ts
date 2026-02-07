// Puzzle-related type definitions

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  upvotes: number;
  permalink: string;
  createdUtc: number;
  /** True if title has no digits and is mostly letters/spaces (good for substitution cipher) */
  cipherFriendly?: boolean;
  /** Derived from title length/word count for filtering or display */
  difficulty?: PuzzleDifficulty;
}

export interface Puzzle {
  id: string;
  cipherText: string;
  plainText: string;
  source: RedditPost;
  seed: string;
  date: string; // ISO date string
  mode: 'daily' | 'practice';
}

export interface GameState {
  puzzle: Puzzle | null;
  userMappings: Record<string, string>; // cipherLetter -> plainLetter
  selectedCipher: string | null;
  hintsUsed: number;
  hintsRevealed: string[]; // cipher letters that were revealed via hints
  isSolved: boolean;
  startTime: number; // timestamp
  elapsedTime: number; // seconds
  mistakes: number;
}

export interface Score {
  score: number;
  time: number; // seconds
  hintsUsed: number;
  mistakes: number;
  puzzleId: string;
  date: string;
  username: string;
}

export interface ShareResult {
  puzzleNumber: number;
  date: string;
  time: number;
  hintsUsed: number;
  score: number;
  shareText: string;
  postLink: string;
}

/**
 * Calculate score based on time, hints, and mistakes
 * 
 * Scoring Formula:
 * - Base score: 10,000 points
 * - Time bonus: Exponential decay - faster solves get exponentially more points
 *   Formula: timeBonus = 5000 * e^(-time/300) where time is in seconds
 *   This means: 30s = ~4500 bonus, 2min = ~3000 bonus, 5min = ~1500 bonus, 10min = ~500 bonus
 * - Hint penalty: 750 points per hint (significant penalty to encourage solving without hints)
 * - Mistake penalty: 100 points per mistake (accuracy matters)
 * 
 * Maximum possible score: ~15,000 (perfect solve in <30 seconds with no hints/mistakes)
 * Minimum score: 100 (safety floor)
 */
export function calculateScore(
  elapsedTime: number,
  hintsUsed: number,
  mistakes: number
): number {
  const BASE_SCORE = 10000;
  
  // Time bonus: Exponential decay rewards speed
  // Faster solves get exponentially more bonus points
  // Using e^(-time/300) gives good curve:
  // - 30 seconds: ~4500 bonus
  // - 2 minutes: ~3000 bonus  
  // - 5 minutes: ~1500 bonus
  // - 10 minutes: ~500 bonus
  // - 15+ minutes: ~100 bonus
  const TIME_BONUS_MULTIPLIER = 5000;
  const TIME_DECAY_RATE = 300; // seconds for 1/e decay
  const timeBonus = TIME_BONUS_MULTIPLIER * Math.exp(-elapsedTime / TIME_DECAY_RATE);
  
  // Hint penalty: Significant penalty to encourage solving without hints
  const HINT_PENALTY = 750;
  const hintPenalty = hintsUsed * HINT_PENALTY;
  
  // Mistake penalty: Accuracy matters
  const MISTAKE_PENALTY = 100;
  const mistakePenalty = mistakes * MISTAKE_PENALTY;
  
  // Calculate final score
  let score = BASE_SCORE + timeBonus - hintPenalty - mistakePenalty;
  
  // Ensure minimum score floor
  return Math.max(Math.round(score), 100);
}

/**
 * Format time as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate shareable result text
 */
export function generateShareText(
  puzzleNumber: number,
  date: string,
  time: number,
  hintsUsed: number,
  score: number
): string {
  return `🔐 Reddit Cryptogram #${puzzleNumber} - ${date}\n⏱️ ${formatTime(time)} | 💡 ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} | Score: ${score.toLocaleString()}`;
}
