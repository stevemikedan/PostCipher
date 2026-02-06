import { useState, useEffect, useRef } from 'react';
import { useCryptogram } from '../hooks/useCryptogram';
import { formatTime } from '../../shared/types/puzzle';
import { generateCipherMap } from '../../shared/cryptogram/engine';

type GameMode = 'daily' | 'practice';

export const App = () => {
  const [mode, setMode] = useState<GameMode>('daily');
  const [showKey, setShowKey] = useState(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('');
  const [availableSubreddits, setAvailableSubreddits] = useState<string[]>([]);
  
  const {
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
  } = useCryptogram({ mode, subreddit: selectedSubreddit || undefined });

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

  // Generate Reddit link - permalink should be a relative path from Reddit API
  const getRedditLink = (source: typeof puzzle.source) => {
    if (!source.permalink) {
      // Fallback: create search URL if no permalink
      const subreddit = source.subreddit.replace('r/', '').replace('r', '');
      const searchQuery = encodeURIComponent(source.title);
      return `https://reddit.com/r/${subreddit}/search/?q=${searchQuery}&restrict_sr=1&sort=relevance&t=all`;
    }
    
    // If it's already a full URL, use it
    if (source.permalink.startsWith('http')) {
      return source.permalink;
    }
    
    // Reddit permalinks are relative paths like /r/subreddit/comments/postid/title/
    // Prepend reddit.com to make it a full URL
    if (source.permalink.startsWith('/')) {
      return `https://reddit.com${source.permalink}`;
    }
    
    // If it doesn't start with /, it might be malformed, try to construct it
    // Format: /r/subreddit/comments/postid/title/
    const subreddit = source.subreddit.replace('r/', '').replace('r', '');
    return `https://reddit.com/r/${subreddit}/comments/${source.id}`;
  };

  const redditLink = puzzle ? getRedditLink(puzzle.source) : null;

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
          {mode === 'practice' && (
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-2 sm:px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 hover:bg-zinc-700 flex-shrink-0"
            >
              {showKey ? 'Hide' : 'Show'} Key
            </button>
          )}
        </div>

        {/* Mode selector */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setMode('daily');
                setSelectedSubreddit('');
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
              onClick={() => setMode('practice')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base ${
                mode === 'practice'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Practice
            </button>
            {mode === 'practice' && !isSolved && (
              <button
                onClick={loadNextPuzzle}
                className="px-3 sm:px-4 py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-500 text-white text-sm sm:text-base"
              >
                🔄 New Puzzle
              </button>
            )}
          </div>
          
          {/* Subreddit selector for practice mode */}
          {mode === 'practice' && availableSubreddits.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400">Filter by subreddit:</label>
              <select
                value={selectedSubreddit}
                onChange={(e) => setSelectedSubreddit(e.target.value)}
                className="px-3 py-1 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">All Subreddits</option>
                {availableSubreddits.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
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

        {/* Victory Modal Overlay */}
        {isSolved && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-xl p-4 sm:p-6 md:p-8 border border-emerald-500/50 text-center max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="text-4xl sm:text-5xl mb-2">🎉</div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 mb-2">SOLVED!</h2>
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
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                {mode === 'daily' && (
                  <button
                    onClick={async () => {
                      const shareText = await generateShare();
                      if (shareText) {
                        await navigator.clipboard.writeText(shareText);
                        alert('Share text copied to clipboard!');
                      }
                    }}
                    className="px-4 sm:px-6 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg font-bold text-sm sm:text-base"
                  >
                    📋 Copy Share Text
                  </button>
                )}
                {mode === 'practice' && (
                  <button
                    onClick={loadNextPuzzle}
                    className="px-4 sm:px-6 py-2 bg-green-500 hover:bg-green-400 rounded-lg font-bold text-sm sm:text-base"
                  >
                    ➡️ Next Puzzle
                  </button>
                )}
                {redditLink && (
                  <a
                    href={redditLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg font-bold text-center block text-sm sm:text-base"
                  >
                    View Original Post →
                  </a>
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
      </div>
    </div>
  );
};
