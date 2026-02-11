// API request/response types

import type { Puzzle, GameState, Score, ShareResult } from './puzzle';

// ===== Puzzle API =====

export interface GetDailyPuzzleResponse {
  type: 'daily-puzzle';
  puzzle: Puzzle;
  puzzleNumber: number; // Days since launch or similar
  /** True if the current user already completed today's puzzle */
  completed?: boolean;
  /** Stored score when completed is true */
  completedScore?: {
    score: number;
    time: number;
    hintsUsed: number;
    mistakes: number;
    puzzleId: string;
    date: string;
    username: string;
  };
}

/** One past play for history (view original post, success rate, resume in-progress) */
export interface PlayHistoryEntry {
  puzzleId: string;
  date: string;
  score: number;
  time: number;
  hintsUsed: number;
  mistakes: number;
  mode: 'daily' | 'practice';
  postLink: string;
  subreddit: string;
  title: string;
  /** True when user skipped or left without solving; has savedPuzzle + userMappings for resume */
  isInProgress?: boolean;
  /** Full puzzle JSON for resume (only when isInProgress) */
  savedPuzzle?: Puzzle;
  /** Cipher letter -> plain letter (only when isInProgress) */
  userMappings?: Record<string, string>;
  /** Elapsed seconds when saved (only when isInProgress) */
  elapsedTime?: number;
}

export interface GetPracticePuzzleRequest {
  subreddit?: string;
}

export interface GetPracticePuzzleResponse {
  type: 'practice-puzzle';
  puzzle: Puzzle;
}

export interface ValidatePuzzleRequest {
  puzzleId: string;
  userMappings: Record<string, string>;
  /** Required for practice puzzles (server doesn't cache them): seed + cipherText to validate */
  seed?: string;
  cipherText?: string;
}

export interface ValidatePuzzleResponse {
  type: 'validate';
  isSolved: boolean;
  correctMappings: number;
  totalMappings: number;
}

// ===== Score API =====

export interface SubmitScoreRequest {
  puzzleId: string;
  time: number;
  hintsUsed: number;
  mistakes: number;
  mode: 'daily' | 'practice';
  /** For play history: link to original Reddit post */
  postLink?: string;
  /** For play history: subreddit (e.g. r/Showerthoughts) */
  subreddit?: string;
  /** For play history: puzzle title */
  title?: string;
}

export interface SubmitScoreResponse {
  type: 'score-submitted';
  score: Score;
  rank?: number; // User's rank on the leaderboard (1-indexed)
  totalPlayers?: number; // Total players on leaderboard
}

// ===== Leaderboard API =====

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  time: number;
  hintsUsed: number;
}

export interface GetLeaderboardResponse {
  type: 'leaderboard';
  puzzleId: string;
  entries: LeaderboardEntry[];
  userRank?: number; // Current user's rank if on leaderboard
  userEntry?: LeaderboardEntry; // Current user's entry if on leaderboard
  totalPlayers: number;
}

// ===== Share API =====

export interface GenerateShareRequest {
  puzzleId: string;
  time: number;
  hintsUsed: number;
  score: number;
}

export interface GenerateShareResponse {
  type: 'share-generated';
  shareResult: ShareResult;
}

// ===== History API =====

export interface GetScoreHistoryResponse {
  type: 'score-history';
  history: PlayHistoryEntry[];
}

export interface SaveProgressRequest {
  puzzleId: string;
  puzzle: Puzzle;
  userMappings: Record<string, string>;
  elapsedTime: number;
  hintsUsed: number;
  mistakes: number;
  mode: 'daily' | 'practice';
  postLink?: string;
  subreddit?: string;
  title?: string;
}

export interface SaveProgressResponse {
  type: 'progress-saved';
}

// ===== Error Response =====

export interface ErrorResponse {
  status: 'error';
  message: string;
}
