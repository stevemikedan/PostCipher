import '../index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-6 p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {/* Logo/Icon */}
      <div className="text-6xl mb-2">🔐</div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-4xl font-black mb-2">
          <span className="text-orange-500">POST</span>
          <span className="text-white">CIPHER</span>
        </h1>
        <p className="text-lg text-zinc-400">Daily Reddit Cryptogram Puzzle</p>
      </div>

      {/* Date */}
      <div className="text-center">
        <p className="text-sm text-zinc-500">Today's Puzzle</p>
        <p className="text-lg font-semibold text-zinc-300">{today}</p>
      </div>

      {/* Description */}
      <div className="text-center max-w-md">
        <p className="text-zinc-400 text-sm leading-relaxed">
          Solve the daily cryptogram puzzle from trending Reddit posts. Use hints wisely, solve
          quickly, and share your score!
        </p>
      </div>

      {/* Start Button */}
      <button
        className="flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg w-full max-w-xs h-14 rounded-lg cursor-pointer transition-all shadow-lg hover:shadow-orange-500/50 active:scale-95"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        🎮 Play Now
      </button>

      {/* Features */}
      <div className="flex gap-6 text-xs text-zinc-500 mt-4">
        <div className="text-center">
          <div className="text-lg">📅</div>
          <div>Daily Puzzle</div>
        </div>
        <div className="text-center">
          <div className="text-lg">💡</div>
          <div>3 Hints</div>
        </div>
        <div className="text-center">
          <div className="text-lg">🏆</div>
          <div>Scoring</div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
