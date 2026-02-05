# Scoring System Documentation

## Overview

The scoring system rewards speed, accuracy, and independence (solving without hints).

## Scoring Formula

### Base Score
- **Starting Points**: 10,000 points

### Time Bonus (Speed)
- **Formula**: `5000 * e^(-time/300)` where time is in seconds
- **Purpose**: Exponential decay rewards faster solves exponentially more
- **Examples**:
  - 30 seconds: ~4,500 bonus points
  - 2 minutes: ~3,000 bonus points
  - 5 minutes: ~1,500 bonus points
  - 10 minutes: ~500 bonus points
  - 15+ minutes: ~100 bonus points

### Hint Penalty (Independence)
- **Penalty**: 750 points per hint
- **Purpose**: Encourages solving without hints
- **Examples**:
  - 0 hints: 0 penalty
  - 1 hint: -750 points
  - 2 hints: -1,500 points
  - 3 hints: -2,250 points

### Mistake Penalty (Accuracy)
- **Penalty**: 100 points per mistake
- **Purpose**: Rewards accuracy and careful solving
- **Examples**:
  - 0 mistakes: 0 penalty
  - 1 mistake: -100 points
  - 5 mistakes: -500 points
  - 10 mistakes: -1,000 points

## Score Calculation

```
Final Score = Base Score + Time Bonus - Hint Penalty - Mistake Penalty
Final Score = 10,000 + (5000 * e^(-time/300)) - (hints * 750) - (mistakes * 100)
```

## Score Examples

### Perfect Solve (No Hints, No Mistakes)
- **30 seconds**: ~14,500 points
- **2 minutes**: ~13,000 points
- **5 minutes**: ~11,500 points
- **10 minutes**: ~10,500 points

### With Hints
- **2 minutes, 1 hint, 0 mistakes**: ~12,250 points
- **5 minutes, 2 hints, 0 mistakes**: ~10,000 points
- **10 minutes, 3 hints, 0 mistakes**: ~8,250 points

### With Mistakes
- **2 minutes, 0 hints, 5 mistakes**: ~12,500 points
- **5 minutes, 1 hint, 10 mistakes**: ~9,500 points

### Worst Case
- **15+ minutes, 3 hints, 20 mistakes**: ~6,100 points

## Minimum Score

- **Floor**: 100 points (safety minimum)

## Score Storage

- **Daily Puzzles**: Scores are stored in Redis for potential leaderboards
- **Practice Puzzles**: Scores are calculated and displayed but not stored (for leaderboards)

## Design Philosophy

1. **Speed Matters**: Exponential time bonus means solving quickly is highly rewarded
2. **Independence Rewarded**: Hints have significant penalty (750 points each)
3. **Accuracy Valued**: Mistakes reduce score, encouraging careful solving
4. **Balanced**: All three factors (speed, hints, mistakes) significantly impact final score

## Future Enhancements

Potential improvements:
- Puzzle difficulty multiplier (longer puzzles = higher base score)
- Streak bonuses for consecutive daily solves
- Leaderboard rankings
- Percentile rankings
