// API request/response types

import type { Puzzle, GameState, Score, ShareResult } from './puzzle';

// ===== Puzzle API =====

export interface GetDailyPuzzleResponse {
  type: 'daily-puzzle';
  puzzle: Puzzle;
  puzzleNumber: number; // Days since launch or similar
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
}

export interface SubmitScoreResponse {
  type: 'score-submitted';
  score: Score;
  rank?: number; // Optional leaderboard rank
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

// ===== Error Response =====

export interface ErrorResponse {
  status: 'error';
  message: string;
}
