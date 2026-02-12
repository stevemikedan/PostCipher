import { useState, useEffect, useRef, type ReactNode } from 'react';
import { navigateTo } from '@devvit/web/client';
import { useCryptogram } from '../hooks/useCryptogram';
import { formatTime } from '../../shared/types/puzzle';
import { generateCipherMap } from '../../shared/cryptogram/engine';
import type { PlayHistoryEntry, LeaderboardEntry } from '../../shared/types/api';
import { getRedditPostUrl } from '../../shared/reddit-link';
import { TERMS_CONTENT } from '../legal/terms-content';
import { PRIVACY_CONTENT } from '../legal/privacy-content';

type GameMode = 'daily' | 'practice';

function renderLegalContent(content: string): ReactNode {
  const lines = content.split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line == null) { i++; continue; }
    if (line.startsWith('# ')) {
      out.push(<h1 key={i} className="text-lg font-bold text-white mt-4 mb-2 first:mt-0">{line.slice(2)}</h1>);
      i++;
    } else if (line.startsWith('## ')) {
      out.push(<h2 key={i} className="text-sm font-bold text-zinc-300 mt-3 mb-1">{line.slice(3)}</h2>);
      i++;
    } else if (line.startsWith('- ')) {
      out.push(<li key={i} className="text-zinc-400 text-sm ml-4">{line.slice(2)}</li>);
      i++;
    } else if (line.trim() === '') {
      i++;
    } else {
      out.push(<p key={i} className="text-zinc-400 text-sm mb-2">{line}</p>);
      i++;
    }
  }
  return <div className="space-y-0">{out}</div>;
}

export const App = () => {
  const [mode, setMode] = useState<GameMode>('daily');
  const [showKey, setShowKey] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('');
  const [customSubreddit, setCustomSubreddit] = useState<string>('');
  const [appliedCustomSubreddit, setAppliedCustomSubreddit] = useState<string>('');
  const [availableSubreddits, setAvailableSubreddits] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | undefined>();
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const practiceFilter = selectedSubreddit || appliedCustomSubreddit;
  
  const {
    gameState,
    loading,
    error,
    currentScore,
    handleTileClick,
    handleLetterClick,
    handleLetterInput,
    removeLetterMapping,
    useHint,
    clearAll,
    loadNextPuzzle,
    saveProgress,
    loadFromHistoryEntry,
  } = useCryptogram({ mode, ...(practiceFilter ? { subreddit: practiceFilter } : {}) });

  // Load available subreddits for practice mode
  useEffect(() => {
    if (mode === 'practice') {
      fetch('/api/practice/subreddits')
        .then((res) => res.json())
        .then((data) => {
          if (data.subreddits) {
            setAvailableSubreddits(data.subreddits);
          }
        })
        .catch((err) => console.error('Failed to load subreddits', err));
    }
  }, [mode]);

  // Load game post URL for sharing (short Reddit link to this game post)

  // Fetch leaderboard when daily puzzle is solved
  useEffect(() => {
    if (mode === 'daily' && gameState.isSolved && gameState.puzzle?.id) {
      setLeaderboardLoading(true);
      fetch(`/api/leaderboard/daily?puzzleId=${encodeURIComponent(gameState.puzzle.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.type === 'leaderboard') {
            setLeaderboard(data.entries || []);
            setUserRank(data.userRank);
            setTotalPlayers(data.totalPlayers || 0);
          }
        })
        .catch((err) => console.error('Failed to load leaderboard', err))
        .finally(() => setLeaderboardLoading(false));
    }
  }, [mode, gameState.isSolved, gameState.puzzle?.id]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard event handler for physical keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.isSolved || !gameState.selectedCipher) return;
      
      // Handle letter input
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleLetterInput(e.key);
      }
      
      // Handle backspace/delete to remove mapping
      if ((e.key === 'Backspace' || e.key === 'Delete') && gameState.selectedCipher) {
        e.preventDefault();
        removeLetterMapping(gameState.selectedCipher);
      }
      
      // Handle Escape to deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        handleTileClick(gameState.selectedCipher);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isSolved, gameState.selectedCipher, handleLetterInput, removeLetterMapping, handleTileClick]);

  // Focus input when tile is selected (for mobile keyboard)
  useEffect(() => {
    if (gameState.selectedCipher && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState.selectedCipher]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">🔐</div>
          <div className="text-lg">Loading puzzle...</div>
        </div>
      </div>
    );
  }

  if (error || !gameState.puzzle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white p-4">
        <div className="text-center">
          <div className="text-2xl mb-4">❌</div>
          <div className="text-lg mb-2">Error loading puzzle</div>
          <div className="text-sm text-zinc-400">{error || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  const { puzzle, userMappings, selectedCipher, hintsUsed, hintsRevealed, isSolved, elapsedTime, mistakes } = gameState;
  const usedLetters = new Set(Object.values(userMappings));

  // Render cipher text with tiles
  const renderPuzzle = () => {
    const words = puzzle.cipherText.split(' ');

    return (
      <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-3 sm:gap-y-4 md:gap-y-6 p-2 sm:p-4 w-full">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-0.5 sm:gap-1">
            {word.split('').map((char, ci) => {
              const isCipher = /[A-Z]/.test(char);
              const guess = userMappings[char];
              const isSelected = selectedCipher === char;
              const isHint = hintsRevealed.includes(char);
              const isCorrect = isSolved && guess;

              if (!isCipher) {
                return (
                  <div
                    key={ci}
                    className="w-4 h-10 sm:w-6 sm:h-12 md:w-8 md:h-14 flex items-center justify-center text-zinc-500 text-sm sm:text-lg md:text-xl font-bold"
                  >
                    {char}
                  </div>
                );
              }

              return (
                <div
                  key={ci}
                  onClick={() => {
                    // Normal selection behavior
                    handleTileClick(char);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    // Double-click to remove mapping (if not a hint)
                    if (guess && !isHint) {
                      removeLetterMapping(char);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Right-click to remove mapping (if not a hint)
                    if (guess && !isHint) {
                      removeLetterMapping(char);
                    }
                  }}
                  className={`
                    w-6 h-10 sm:w-7 sm:h-12 md:w-8 md:h-14 lg:w-10 lg:h-16 flex flex-col items-center justify-center rounded-md sm:rounded-lg cursor-pointer
                    transition-all duration-150 select-none relative
                    ${
                      isSelected
                        ? 'bg-orange-500 ring-2 ring-orange-300 scale-105'
                        : isHint
                          ? 'bg-blue-600/30 border-2 border-blue-500'
                          : isCorrect
                            ? 'bg-emerald-600/30 border-2 border-emerald-500'
                            : 'bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-500'
                    }
                  `}
                  title={
                    guess && !isHint
                      ? 'Double-click or right-click to remove mapping'
                      : isSelected
                        ? 'Type a letter or press Delete to remove'
                        : 'Click to select'
                  }
                >
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm lg:text-lg font-mono font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}
                  >
                    {char}
                  </span>
                  <span
                    className={`
                    text-[10px] sm:text-xs md:text-sm lg:text-lg font-bold h-3 sm:h-4 md:h-5 lg:h-6
                    ${isHint ? 'text-blue-400' : isCorrect ? 'text-emerald-400' : 'text-white'}
                  `}
                  >
                    {guess || '_'}
                  </span>
                  {guess && !isHint && !isSelected && (
                    <span className="absolute top-0 right-0 text-[8px] sm:text-xs text-zinc-500 opacity-50">×</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Keyboard rows
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  // Cipher key for debug
  const cipherMap = puzzle ? generateCipherMap(puzzle.seed) : null;

  const redditLink = puzzle ? getRedditPostUrl(puzzle.source) : null;

  // Merge current solved puzzle into history for display; dedupe by puzzleId so daily shows once
  const displayHistory = (() => {
    const list = [...playHistory];
    if (gameState.isSolved && gameState.puzzle && currentScore != null) {
      if (!list.some((e) => e.puzzleId === gameState.puzzle!.id)) {
        const src = gameState.puzzle.source;
        const postLink = getRedditPostUrl(src);
        list.unshift({
          puzzleId: gameState.puzzle.id,
          date: gameState.puzzle.date,
          score: currentScore,
          time: gameState.elapsedTime,
          hintsUsed: gameState.hintsUsed,
          mistakes: gameState.mistakes,
          mode: gameState.puzzle.mode,
          postLink,
          subreddit: src.subreddit ?? '',
          title: src.title ?? '',
        });
      }
    }
    const seen = new Set<string>();
    return list.filter((e) => {
      if (e.puzzleId.startsWith('daily-') && e.mode === 'practice') return false;
      if (seen.has(e.puzzleId)) return false;
      seen.add(e.puzzleId);
      return true;
    });
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white p-2 sm:p-4 overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black truncate">
              <span className="text-orange-500">🔐</span> CRYPTOGRAM
            </h1>
            <p className="text-xs text-zinc-500">
              {mode === 'daily' ? 'Daily Reddit Puzzle' : 'Practice Mode'}
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <div
              className={`font-mono text-xl sm:text-2xl md:text-3xl font-bold ${isSolved ? 'text-emerald-400' : 'text-white'}`}
            >
              {formatTime(elapsedTime)}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={async () => {
                setShowHistory(true);
                setHistoryLoading(true);
                try {
                  const res = await fetch('/api/score/history');
                  const data = await res.json();
                  setPlayHistory(data.history ?? []);
                } catch (e) {
                  setPlayHistory([]);
                } finally {
                  setHistoryLoading(false);
                }
              }}
              className="px-2 sm:px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:bg-zinc-700"
            >
              📊 History
            </button>
            {mode === 'practice' && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="px-2 sm:px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:bg-zinc-700"
              >
                {showKey ? 'Hide' : 'Show'} Key
              </button>
            )}
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                await saveProgress?.();
                setMode('daily');
                setSelectedSubreddit('');
                setCustomSubreddit('');
                setAppliedCustomSubreddit('');
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base ${
                mode === 'daily'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Daily
            </button>
            <button
              onClick={async () => {
                await saveProgress?.();
                setMode('practice');
                setCustomSubreddit('');
                setAppliedCustomSubreddit('');
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base ${
                mode === 'practice'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Practice
            </button>
            {!isSolved && gameState.puzzle && (
              <button
                type="button"
                onClick={async () => {
                  await saveProgress?.();
                  setShowHistory(true);
                  setHistoryLoading(false);
                  const res = await fetch('/api/score/history');
                  const data = await res.json().catch(() => ({ history: [] }));
                  setPlayHistory(data.history ?? []);
                }}
                className="px-3 sm:px-4 py-2 rounded-lg font-semibold bg-amber-600 hover:bg-amber-500 text-white text-sm sm:text-base"
                title="Save progress and find this puzzle in History to resume later"
              >
                ⏸ Pause & save
              </button>
            )}
            {mode === 'practice' && !isSolved && (
              <button
                onClick={loadNextPuzzle}
                className="px-3 sm:px-4 py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-500 text-white text-sm sm:text-base"
              >
                🔄 New Puzzle
              </button>
            )}
          </div>
          
          {/* Filter: Trending or by subreddit (dropdown + custom) for practice */}
          {mode === 'practice' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-zinc-400">Filter:</label>
              <select
                value={selectedSubreddit}
                onChange={(e) => {
                  setSelectedSubreddit(e.target.value);
                  setCustomSubreddit('');
                  setAppliedCustomSubreddit('');
                }}
                className="px-3 py-1 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-orange-500 focus:outline-none"
                title="Popular = hot posts from multiple subreddits, sorted by upvotes"
              >
                <option value="">Popular</option>
                {availableSubreddits.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <span className="text-zinc-500 text-sm">or custom:</span>
              <span className="text-zinc-400 text-sm">r/</span>
              <input
                type="text"
                value={customSubreddit}
                onChange={(e) => setCustomSubreddit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const name = customSubreddit.trim().replace(/^r\/?/, '');
                    if (name) {
                      setAppliedCustomSubreddit(`r/${name}`);
                      setSelectedSubreddit('');
                    }
                  }
                }}
                placeholder="subreddit (Enter to apply)"
                className="w-28 sm:w-32 px-2 py-1 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-orange-500 focus:outline-none text-sm placeholder-zinc-500"
                aria-label="Custom subreddit name — press Enter to apply"
              />
              <button
                type="button"
                onClick={() => {
                  const name = customSubreddit.trim().replace(/^r\/?/, '');
                  if (name) {
                    setAppliedCustomSubreddit(`r/${name}`);
                    setSelectedSubreddit('');
                  }
                }}
                className="px-2 py-1 bg-orange-500 hover:bg-orange-400 rounded-lg text-xs font-medium text-white"
              >
                Go
              </button>
              <p className="text-zinc-500 text-xs w-full mt-0.5">
                Popular = hot posts from several subreddits, sorted by upvotes. Type any subreddit and press Enter or Go.
              </p>
            </div>
          )}
        </div>

        {/* Source info */}
        <div className="bg-zinc-800/50 rounded-lg p-2 sm:p-3 mb-4 border border-zinc-700">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
            <span className="text-orange-400 font-bold">{puzzle.source.subreddit}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 truncate">{puzzle.source.author}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400">⬆ {puzzle.source.upvotes.toLocaleString()}</span>
          </div>
        </div>

        {/* Cipher Key (Debug) */}
        {showKey && cipherMap && (
          <div className="bg-zinc-900 rounded-lg p-3 mb-4 border border-yellow-600/50">
            <p className="text-xs text-yellow-500 mb-2 font-bold">🔑 CIPHER KEY (Debug Mode)</p>
            <div className="flex flex-wrap gap-1 text-xs font-mono">
              {Object.entries(cipherMap.encode).map(([plain, cipher]) => (
                <div key={plain} className="bg-zinc-800 px-2 py-1 rounded">
                  <span className="text-zinc-500">{cipher}</span>
                  <span className="text-zinc-600 mx-1">→</span>
                  <span className="text-emerald-400">{plain}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Original: "{puzzle.plainText}"</p>
          </div>
        )}

        {/* Play History Modal */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Play History</h2>
                <div className="flex items-center gap-2">
                  {displayHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDialog({
                          message: 'Clear all play history? This cannot be undone.',
                          onConfirm: async () => {
                            try {
                              const res = await fetch('/api/history/clear', { method: 'POST' });
                              if (res.ok) {
                                setPlayHistory([]);
                              }
                            } catch (err) {
                              console.error('Failed to clear history:', err);
                            }
                            setConfirmDialog(null);
                          },
                        });
                      }}
                      className="text-xs px-2 py-1 bg-zinc-700 hover:bg-red-600 rounded text-zinc-400 hover:text-white"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {historyLoading ? (
                  <p className="text-zinc-400 text-sm">Loading...</p>
                ) : displayHistory.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No puzzles yet. Solve one or pause and save to see it here!</p>
                ) : (
                  <>
                    <p className="text-zinc-400 text-xs mb-3">
                      {displayHistory.length} puzzle{displayHistory.length !== 1 ? 's' : ''} in history
                      {displayHistory.filter((e) => e.score > 0).length > 0 && (
                        <> · Avg score: {Math.round(displayHistory.filter((e) => e.score > 0).reduce((a, e) => a + e.score, 0) / displayHistory.filter((e) => e.score > 0).length).toLocaleString()}</>
                      )}
                    </p>
                    <ul className="space-y-2">
                      {displayHistory.map((entry, i) => (
                        <li
                          key={`${entry.puzzleId}-${i}`}
                          className="bg-zinc-800/80 rounded-lg p-3 text-left border border-zinc-700"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-orange-400 font-semibold text-xs uppercase">{entry.mode}</span>
                              <span className="text-zinc-500 text-xs ml-2">{entry.date}</span>
                              {entry.isInProgress && (
                                <span className="ml-2 text-amber-400 text-xs">In progress</span>
                              )}
                              <p className="text-white text-sm truncate mt-0.5" title={entry.isInProgress ? undefined : (entry.title || '')}>
                                {entry.isInProgress ? 'Paused puzzle — resume to continue' : (entry.title || '—')}
                              </p>
                              <p className="text-zinc-400 text-xs mt-1">
                                {entry.isInProgress ? (
                                  <>Paused at {formatTime(entry.elapsedTime ?? entry.time)} · {entry.subreddit}</>
                                ) : (
                                  <>{entry.score.toLocaleString()} pts · {formatTime(entry.time)} · {entry.subreddit}</>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-shrink-0 gap-1">
                              {entry.isInProgress && entry.savedPuzzle ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    loadFromHistoryEntry(entry);
                                    setMode(entry.savedPuzzle!.mode);
                                    if (entry.savedPuzzle!.mode === 'practice' && entry.subreddit) {
                                      setSelectedSubreddit(entry.subreddit);
                                      setCustomSubreddit('');
                                      setAppliedCustomSubreddit('');
                                    } else {
                                      setSelectedSubreddit('');
                                      setCustomSubreddit('');
                                      setAppliedCustomSubreddit('');
                                    }
                                    setShowHistory(false);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium"
                                >
                                  Resume
                                </button>
                              ) : null}
                              {/* Only show View Post for solved puzzles (not in-progress) to prevent spoilers */}
                              {/* Only show if we have valid source data - postLink must contain /comments/ to be a real post link */}
                              {!entry.isInProgress && (() => {
                                // Use savedPuzzle source if available, otherwise check if postLink is a valid post URL
                                const entryUrl = entry.savedPuzzle 
                                  ? getRedditPostUrl(entry.savedPuzzle.source)
                                  : (entry.postLink && entry.postLink.includes('/comments/')) 
                                    ? entry.postLink 
                                    : null;
                                return entryUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => navigateTo(entryUrl)}
                                    className="px-2 py-1 rounded text-xs font-medium text-white bg-orange-500 hover:bg-orange-400"
                                  >
                                    View Post
                                  </button>
                                ) : null;
                              })()}
                              {/* Delete single entry button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const puzzleIdToDelete = entry.puzzleId;
                                  setConfirmDialog({
                                    message: 'Remove this entry from history?',
                                    onConfirm: async () => {
                                      try {
                                        const res = await fetch('/api/history/delete', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ puzzleId: puzzleIdToDelete }),
                                        });
                                        if (res.ok) {
                                          setPlayHistory((prev) => prev.filter((e) => e.puzzleId !== puzzleIdToDelete));
                                        }
                                      } catch (err) {
                                        console.error('Failed to delete history entry:', err);
                                      }
                                      setConfirmDialog(null);
                                    },
                                  });
                                }}
                                className="px-2 py-1 bg-zinc-700 hover:bg-red-600 rounded text-xs font-medium text-zinc-400 hover:text-white"
                                title="Remove from history"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Victory Modal Overlay - daily and practice */}
        {isSolved && puzzle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-xl p-4 sm:p-6 md:p-8 border border-emerald-500/50 text-center max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="text-4xl sm:text-5xl mb-2">🎉</div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 mb-2">SOLVED!</h2>
              <p className="text-sm text-zinc-400 mb-1">{mode === 'practice' ? 'Congratulations! You solved the puzzle.' : 'Congratulations! You solved today\'s puzzle.'}</p>
              <p className="text-sm sm:text-base text-zinc-300 italic mb-4 break-words">"{puzzle.plainText}"</p>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    {currentScore.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">SCORE</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatTime(elapsedTime)}</div>
                  <div className="text-xs text-zinc-500">TIME</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{hintsUsed}</div>
                  <div className="text-xs text-zinc-500">HINTS</div>
                </div>
                {mode === 'practice' && (
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{mistakes}</div>
                    <div className="text-xs text-zinc-500">MISTAKES</div>
                  </div>
                )}
              </div>

              {/* Daily Leaderboard */}
              {mode === 'daily' && (
                <div className="mt-4 mb-2">
                  <h3 className="text-sm font-bold text-zinc-400 mb-2 flex items-center justify-center gap-2">
                    <span>🏆</span> TODAY'S LEADERBOARD
                    {userRank && totalPlayers > 0 && (
                      <span className="text-emerald-400 font-normal">
                        (You: #{userRank} of {totalPlayers})
                      </span>
                    )}
                  </h3>
                  {leaderboardLoading ? (
                    <div className="text-zinc-500 text-sm py-2">Loading...</div>
                  ) : leaderboard.length > 0 ? (
                    <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-zinc-500 text-xs border-b border-zinc-700">
                            <th className="py-1 px-2 text-left">#</th>
                            <th className="py-1 px-2 text-left">Player</th>
                            <th className="py-1 px-2 text-right">Score</th>
                            <th className="py-1 px-2 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard.map((entry) => (
                            <tr 
                              key={entry.rank} 
                              className={`border-b border-zinc-700/50 last:border-0 ${
                                entry.rank === userRank ? 'bg-emerald-900/30' : ''
                              }`}
                            >
                              <td className="py-1.5 px-2 text-left">
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                              </td>
                              <td className="py-1.5 px-2 text-left truncate max-w-[100px]">
                                {entry.username}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono">
                                {entry.score.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-zinc-400">
                                {formatTime(entry.time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-sm py-2">Be the first to set a score!</div>
                  )}
                </div>
              )}
              
              {/* Action Buttons: View Original Post, Share to Reddit, Copy, Continue / Next */}
              <div className="flex flex-col gap-2 mt-4">
                {redditLink && (
                  <button
                    type="button"
                    onClick={() => navigateTo(redditLink)}
                    className="w-full px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg font-bold text-sm sm:text-base text-white text-center"
                  >
                    🔗 View Original Post
                  </button>
                )}
                {mode === 'daily' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        // Copy score text with game link - for sharing anywhere
                        const text = `I scored ${currentScore.toLocaleString()} in ${formatTime(elapsedTime)} with ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} on PostCipher!\n\nPlay: https://www.reddit.com/r/PostCipher/`;
                        try {
                          await navigator.clipboard.writeText(text);
                          setCopyFeedback(true);
                          setTimeout(() => setCopyFeedback(false), 2500);
                        } catch {
                          alert(`Copy this to share:\n\n${text}`);
                        }
                      }}
                      className={`flex-1 px-4 sm:px-6 py-2 rounded-lg font-bold text-sm sm:text-base ${
                        copyFeedback ? 'bg-green-500' : 'bg-zinc-600 hover:bg-zinc-500'
                      }`}
                    >
                      {copyFeedback ? '✓ Copied!' : '📋 Copy Score'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo(`https://www.reddit.com/r/PostCipher/submit?title=${encodeURIComponent(`PostCipher - Score: ${currentScore.toLocaleString()} | Time: ${formatTime(elapsedTime)} | Hints: ${hintsUsed}`)}&text=${encodeURIComponent(`I just solved today's PostCipher puzzle!\n\n🏆 Score: ${currentScore.toLocaleString()}\n⏱️ Time: ${formatTime(elapsedTime)}\n💡 Hints used: ${hintsUsed}\n\nCan you beat my score? Play the daily puzzle: https://www.reddit.com/r/PostCipher/`)}`)}
                      className="flex-1 px-4 sm:px-6 py-2 rounded-lg font-bold text-sm sm:text-base bg-blue-500 hover:bg-blue-400 text-center"
                    >
                      📤 Share to Reddit
                    </button>
                  </div>
                )}
                {mode === 'daily' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('practice');
                      setSelectedSubreddit('');
                      setCustomSubreddit('');
                      setAppliedCustomSubreddit('');
                    }}
                    className="px-4 sm:px-6 py-2 bg-green-500 hover:bg-green-400 rounded-lg font-bold text-sm sm:text-base"
                  >
                    🎮 Continue in Practice Mode
                  </button>
                )}
                {mode === 'practice' && (
                  <button
                    type="button"
                    onClick={loadNextPuzzle}
                    className="px-4 sm:px-6 py-2 bg-green-500 hover:bg-green-400 rounded-lg font-bold text-sm sm:text-base"
                  >
                    ➡️ Next Puzzle
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hidden input for mobile keyboard - positioned but invisible */}
        {!isSolved && (
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={1}
            value=""
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z]$/.test(value)) {
                handleLetterInput(value);
              }
              // Clear input after handling
              e.target.value = '';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedCipher) {
                  removeLetterMapping(selectedCipher);
                }
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                if (selectedCipher) {
                  handleTileClick(selectedCipher);
                }
                e.preventDefault();
              }
            }}
            className="absolute opacity-0 pointer-events-none w-0 h-0 -z-10"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}

        {/* Visual indicator when tile is selected */}
        {!isSolved && selectedCipher && (
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-2 mb-4 text-center text-xs sm:text-sm">
            <span className="text-orange-400 font-bold">{selectedCipher}</span> selected - Type a letter on your keyboard or use the on-screen keyboard
          </div>
        )}

        {/* Puzzle Grid */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 mb-4 overflow-hidden -mx-2 sm:mx-0">
          <div className="w-full px-2 sm:px-4 py-2 sm:py-4">
            {renderPuzzle()}
          </div>
        </div>

        {/* Controls */}
        {!isSolved && (
          <div className="flex justify-between items-center mb-4 px-1 sm:px-2 gap-1 sm:gap-2">
            <button
              onClick={useHint}
              disabled={hintsUsed >= 3}
              className={`
                px-2 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm
                ${
                  hintsUsed < 3
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/30'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              💡 <span className="hidden sm:inline">Hint</span> <span className="bg-blue-600/30 px-1 sm:px-2 py-0.5 rounded text-xs">{3 - hintsUsed}</span>
            </button>

            <div className="text-xs sm:text-sm text-zinc-500 text-center flex-1 min-w-0 px-1">
              {selectedCipher ? (
                <span>
                  Selected: <span className="text-orange-400 font-bold">{selectedCipher}</span>
                  <br className="hidden sm:block" />
                  <span className="text-[10px] sm:text-xs">Type a letter or use keyboard</span>
                </span>
              ) : (
                <span>
                  Tap a tile to select
                  <br className="hidden sm:block" />
                  <span className="text-[10px] sm:text-xs">Double-click to remove mapping</span>
                </span>
              )}
            </div>

            <button
              onClick={clearAll}
              className="px-2 sm:px-4 py-2 rounded-lg font-semibold bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30 text-xs sm:text-sm"
            >
              Clear
            </button>
          </div>
        )}

        {/* Keyboard */}
        {!isSolved && (
          <div className="space-y-0.5 sm:space-y-1">
            {rows.map((row, ri) => (
              <div
                key={ri}
                className="flex justify-center gap-0.5 sm:gap-1"
                style={{
                  paddingLeft: ri === 1 ? '2%' : ri === 2 ? '6%' : 0,
                  paddingRight: ri === 1 ? '2%' : ri === 2 ? '6%' : 0,
                }}
              >
                {row.map((letter) => {
                  const isUsed = usedLetters.has(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      disabled={!selectedCipher}
                      className={`
                        flex-1 max-w-[28px] sm:max-w-[36px] md:max-w-[40px] h-8 sm:h-10 md:h-12 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm md:text-lg transition-all
                        ${
                          !selectedCipher
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : isUsed
                              ? 'bg-zinc-900 text-zinc-700 border border-zinc-800'
                              : 'bg-gradient-to-b from-zinc-600 to-zinc-700 text-white hover:from-orange-500 hover:to-orange-600 active:scale-95'
                        }
                      `}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Footer: Terms & Privacy */}
        <footer className="mt-6 pt-4 pb-2 border-t border-zinc-800 text-center text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="hover:text-zinc-300 underline"
          >
            Terms of Service
          </button>
          {' · '}
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="hover:text-zinc-300 underline"
          >
            Privacy Policy
          </button>
        </footer>
      </div>

      {/* Terms of Service modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Terms of Service</h2>
              <button type="button" onClick={() => setShowTerms(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-left">
              {renderLegalContent(TERMS_CONTENT)}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Privacy Policy</h2>
              <button type="button" onClick={() => setShowPrivacy(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-left">
              {renderLegalContent(PRIVACY_CONTENT)}
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog (since confirm() is blocked in sandboxed iframe) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-sm w-full p-6 text-center">
            <p className="text-white text-sm mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
