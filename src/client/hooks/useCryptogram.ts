// Hook for managing cryptogram game state

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Puzzle,
  GameState,
  Score,
} from '../../shared/types/puzzle';
import type {
  GetDailyPuzzleResponse,
  GetPracticePuzzleResponse,
  ValidatePuzzleResponse,
  SubmitScoreResponse,
  PlayHistoryEntry,
} from '../../shared/types/api';
import { generateCipherMap } from '../../shared/cryptogram/engine';
import { calculateScore } from '../../shared/types/puzzle';
import { getRedditPostUrl } from '../../shared/reddit-link';

interface UseCryptogramOptions {
  mode: 'daily' | 'practice';
  subreddit?: string;
}

export const useCryptogram = (options: UseCryptogramOptions) => {
  const [gameState, setGameState] = useState<GameState>({
    puzzle: null,
    userMappings: {},
    selectedCipher: null,
    hintsUsed: 0,
    hintsRevealed: [],
    isSolved: false,
    startTime: Date.now(),
    elapsedTime: 0,
    mistakes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  /** Ensures each "New Puzzle" request gets a unique seed so the server picks a different post */
  const practiceSeedRef = useRef(0);
  /** When true, skip the next effect-driven load (e.g. after resuming from history) */
  const skipNextLoadRef = useRef(false);
  /** Prevent submitting score more than once per puzzle (validate can fire multiple times) */
  const submittedPuzzleIdsRef = useRef<Set<string>>(new Set());

  // Load puzzle
  useEffect(() => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }
    const loadPuzzle = async () => {
      setLoading(true);
      setError(null);
      setScore(null);
      try {
        let endpoint = options.mode === 'daily' ? '/api/puzzle/daily' : '/api/puzzle/practice';
        if (options.mode === 'practice') {
          const params = new URLSearchParams();
          if (options.subreddit) params.set('subreddit', options.subreddit);
          practiceSeedRef.current += 1;
          params.set('seed', String(practiceSeedRef.current));
          endpoint += `?${params.toString()}`;
        }
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: GetDailyPuzzleResponse | GetPracticePuzzleResponse = await res.json();
        const puzzle = data.puzzle;

        // If daily and user already completed today, show completed state
        const dailyData = data as GetDailyPuzzleResponse;
        const completed = options.mode === 'daily' && dailyData.completed && dailyData.completedScore;
        const cs = dailyData.completedScore;

        setGameState({
          puzzle,
          userMappings: {}, // will show solved quote in modal
          selectedCipher: null,
          hintsUsed: completed && cs ? cs.hintsUsed : 0,
          hintsRevealed: [],
          isSolved: !!completed,
          startTime: Date.now(),
          elapsedTime: completed && cs ? cs.time : 0,
          mistakes: completed && cs ? cs.mistakes : 0,
        });
        if (completed && cs) setScore(cs);
      } catch (err) {
        console.error('Failed to load puzzle', err);
        setError(err instanceof Error ? err.message : 'Failed to load puzzle');
      } finally {
        setLoading(false);
      }
    };

    void loadPuzzle();
  }, [options.mode, options.subreddit]);

  // Timer
  useEffect(() => {
    if (gameState.isSolved || !gameState.puzzle) return;

    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.isSolved, gameState.puzzle]);

  // Validate puzzle
  const validatePuzzle = useCallback(async () => {
    if (!gameState.puzzle) return;

    try {
      const res = await fetch('/api/puzzle/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: gameState.puzzle.id,
          userMappings: gameState.userMappings,
          ...(gameState.puzzle.id.startsWith('practice-')
            ? { seed: gameState.puzzle.seed, cipherText: gameState.puzzle.cipherText }
            : {}),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ValidatePuzzleResponse = await res.json();

      if (data.isSolved) {
        setGameState((prev) => ({ ...prev, isSolved: true }));

        if (submittedPuzzleIdsRef.current.has(gameState.puzzle.id)) return;
        submittedPuzzleIdsRef.current.add(gameState.puzzle.id);

        // Submit score once per puzzle for both daily and practice (and store for history)
        try {
          const src = gameState.puzzle.source;
          const postLink = getRedditPostUrl(src);
          const scoreRes = await fetch('/api/score/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              puzzleId: gameState.puzzle.id,
              time: gameState.elapsedTime,
              hintsUsed: gameState.hintsUsed,
              mistakes: gameState.mistakes,
              mode: options.mode,
              postLink,
              subreddit: src.subreddit ?? '',
              title: src.title ?? '',
            }),
          });

          if (scoreRes.ok) {
            const scoreData: SubmitScoreResponse = await scoreRes.json();
            setScore(scoreData.score);
          }
        } catch (err) {
          console.error('Failed to submit score', err);
        }
      }
    } catch (err) {
      console.error('Failed to validate puzzle', err);
    }
  }, [gameState.puzzle, gameState.userMappings, gameState.elapsedTime, gameState.hintsUsed, gameState.mistakes, options.mode]);

  // Validate whenever mappings change
  useEffect(() => {
    if (gameState.puzzle && Object.keys(gameState.userMappings).length > 0) {
      void validatePuzzle();
    }
  }, [gameState.userMappings, gameState.puzzle, validatePuzzle]);

  const handleTileClick = useCallback((cipherLetter: string) => {
    if (gameState.isSolved) return;
    if (gameState.hintsRevealed.includes(cipherLetter)) return;

    setGameState((prev) => ({
      ...prev,
      selectedCipher: prev.selectedCipher === cipherLetter ? null : cipherLetter,
    }));
  }, [gameState.isSolved, gameState.hintsRevealed]);

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (gameState.isSolved || !gameState.selectedCipher) return;

      const selectedCipher = gameState.selectedCipher;
      const upperLetter = letter.toUpperCase();

      // Only accept A-Z
      if (!/^[A-Z]$/.test(upperLetter)) return;

      // Check if letter is already used
      const alreadyUsedFor = Object.entries(gameState.userMappings).find(
        ([k, v]) => v === upperLetter && k !== selectedCipher
      );

      let newMappings: Record<string, string>;
      if (alreadyUsedFor) {
        // Remove from previous mapping and add to new
        newMappings = { ...gameState.userMappings };
        delete newMappings[alreadyUsedFor[0]];
        newMappings[selectedCipher] = upperLetter;
      } else {
        newMappings = { ...gameState.userMappings, [selectedCipher]: upperLetter };
      }

      // Check if correct for mistake tracking
      let mistakeIncrement = 0;
      if (gameState.puzzle) {
        const cipherMap = generateCipherMap(gameState.puzzle.seed);
        if (cipherMap.decode[selectedCipher] !== upperLetter) {
          mistakeIncrement = 1;
        }
      }

      setGameState((prev) => ({
        ...prev,
        userMappings: newMappings,
        selectedCipher: null,
        mistakes: prev.mistakes + mistakeIncrement,
      }));
    },
    [gameState.isSolved, gameState.selectedCipher, gameState.userMappings, gameState.puzzle]
  );

  const handleLetterClick = useCallback(
    (letter: string) => {
      handleLetterInput(letter);
    },
    [handleLetterInput]
  );

  const removeLetterMapping = useCallback(
    (cipherLetter: string) => {
      if (gameState.isSolved) return;
      if (gameState.hintsRevealed.includes(cipherLetter)) return; // Can't remove hints

      const newMappings = { ...gameState.userMappings };
      delete newMappings[cipherLetter];

      setGameState((prev) => ({
        ...prev,
        userMappings: newMappings,
        selectedCipher: null,
      }));
    },
    [gameState.isSolved, gameState.hintsRevealed, gameState.userMappings]
  );

  const useHint = useCallback(() => {
    if (!gameState.puzzle || gameState.hintsUsed >= 3 || gameState.isSolved) return;

    const cipherLetters = [
      ...new Set(gameState.puzzle.cipherText.match(/[A-Z]/g) || []),
    ];
    const unrevealed = cipherLetters.filter(
      (c) => !gameState.hintsRevealed.includes(c) && !gameState.userMappings[c]
    );

    if (unrevealed.length > 0) {
      const toReveal = unrevealed[0];
      // Generate cipher map to get correct mapping
      const cipherMap = generateCipherMap(gameState.puzzle.seed);
      const correctLetter = cipherMap.decode[toReveal];

      setGameState((prev) => ({
        ...prev,
        hintsRevealed: [...prev.hintsRevealed, toReveal],
        userMappings: { ...prev.userMappings, [toReveal]: correctLetter },
        hintsUsed: prev.hintsUsed + 1,
      }));
    }
  }, [gameState.puzzle, gameState.hintsUsed, gameState.hintsRevealed, gameState.userMappings, gameState.isSolved]);

  const clearAll = useCallback(() => {
    const kept: Record<string, string> = {};
    gameState.hintsRevealed.forEach((h) => {
      if (gameState.userMappings[h]) {
        kept[h] = gameState.userMappings[h];
      }
    });
    setGameState((prev) => ({
      ...prev,
      userMappings: kept,
      selectedCipher: null,
    }));
  }, [gameState.hintsRevealed, gameState.userMappings]);

  const currentScore = gameState.isSolved
    ? calculateScore(gameState.elapsedTime, gameState.hintsUsed, gameState.mistakes)
    : 0;

  const generateShare = useCallback(async (): Promise<string | null> => {
    if (!gameState.puzzle || !gameState.isSolved || options.mode !== 'daily') {
      return null;
    }

    try {
      const res = await fetch('/api/share/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: gameState.puzzle.id,
          time: gameState.elapsedTime,
          hintsUsed: gameState.hintsUsed,
          score: currentScore,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.shareResult?.shareText || null;
    } catch (err) {
      console.error('Failed to generate share', err);
      return null;
    }
  }, [gameState.puzzle, gameState.isSolved, gameState.elapsedTime, gameState.hintsUsed, options.mode, currentScore]);

  const saveProgress = useCallback(async () => {
    if (!gameState.puzzle || gameState.isSolved) return;
    const src = gameState.puzzle.source;
    const postLink = getRedditPostUrl(src);
    try {
      await fetch('/api/progress/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: gameState.puzzle.id,
          puzzle: gameState.puzzle,
          userMappings: gameState.userMappings,
          elapsedTime: gameState.elapsedTime,
          hintsUsed: gameState.hintsUsed,
          mistakes: gameState.mistakes,
          mode: options.mode,
          postLink,
          subreddit: src.subreddit ?? '',
          title: src.title ?? '',
        }),
      });
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  }, [gameState.puzzle, gameState.isSolved, gameState.userMappings, gameState.elapsedTime, gameState.hintsUsed, gameState.mistakes, options.mode]);

  const loadNextPuzzle = useCallback(async () => {
    if (options.mode !== 'practice') return;
    await saveProgress();
    setLoading(true);
    setError(null);
    setScore(null);
    try {
      const params = new URLSearchParams();
      if (options.subreddit) params.set('subreddit', options.subreddit);
      practiceSeedRef.current += 1;
      params.set('seed', String(practiceSeedRef.current));
      const res = await fetch(`/api/puzzle/practice?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: GetPracticePuzzleResponse = await res.json();
      const puzzle = data.puzzle;

      setGameState({
        puzzle,
        userMappings: {},
        selectedCipher: null,
        hintsUsed: 0,
        hintsRevealed: [],
        isSolved: false,
        startTime: Date.now(),
        elapsedTime: 0,
        mistakes: 0,
      });
    } catch (err) {
      console.error('Failed to load puzzle', err);
      setError(err instanceof Error ? err.message : 'Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  }, [options.mode, options.subreddit, saveProgress]);

  const loadFromHistoryEntry = useCallback((entry: PlayHistoryEntry) => {
    if (!entry.isInProgress || !entry.savedPuzzle) return;
    skipNextLoadRef.current = true;
    const puzzle = entry.savedPuzzle;
    setGameState({
      puzzle,
      userMappings: entry.userMappings ?? {},
      selectedCipher: null,
      hintsUsed: entry.hintsUsed ?? 0,
      hintsRevealed: [],
      isSolved: false,
      startTime: Date.now() - (entry.elapsedTime ?? 0) * 1000,
      elapsedTime: entry.elapsedTime ?? 0,
      mistakes: entry.mistakes ?? 0,
    });
    setScore(null);
  }, []);

  return {
    gameState,
    loading,
    error,
    score,
    currentScore,
    handleTileClick,
    handleLetterClick,
    handleLetterInput,
    removeLetterMapping,
    useHint,
    clearAll,
    generateShare,
    loadNextPuzzle,
    saveProgress,
    loadFromHistoryEntry,
  };
};
