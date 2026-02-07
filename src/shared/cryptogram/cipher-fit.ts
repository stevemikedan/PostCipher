/**
 * Cipher-fit: whether a title is a good fit for a substitution cipher puzzle.
 * Substitution ciphers only encode A–Z; numbers and heavy punctuation don't
 * get enciphered and can make puzzles look awkward or confusing.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Minimum ratio of characters that are letters or spaces (rest can be minimal punctuation) */
const MIN_LETTER_OR_SPACE_RATIO = 0.88;
/** Max ratio of non-letter/non-space characters (punctuation, digits, symbols) */
const MAX_OTHER_RATIO = 0.12;
/** No digits allowed for cipher-friendly (they don't encipher and clutter the puzzle) */
const ALLOW_DIGITS_FOR_FRIENDLY = false;
/** Allow at most this many digits before we consider it not cipher-friendly */
const MAX_DIGITS_FOR_FRIENDLY = 0;

/**
 * Returns true if the title is a good fit for a letter-substitution cryptogram:
 * - No (or negligible) digits
 * - Mostly letters and spaces; minimal punctuation/symbols
 */
export function isCipherFriendly(title: string): boolean {
  const t = title.trim();
  if (t.length < 20) return false;

  let letters = 0;
  let spaces = 0;
  let digits = 0;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (/[A-Za-z]/.test(c)) letters++;
    else if (c === ' ') spaces++;
    else if (/[0-9]/.test(c)) digits++;
  }

  if (ALLOW_DIGITS_FOR_FRIENDLY && digits > MAX_DIGITS_FOR_FRIENDLY) return false;
  if (!ALLOW_DIGITS_FOR_FRIENDLY && digits > 0) return false;

  const letterOrSpace = letters + spaces;
  const ratio = letterOrSpace / t.length;
  const otherRatio = 1 - ratio;

  return ratio >= MIN_LETTER_OR_SPACE_RATIO && otherRatio <= MAX_OTHER_RATIO;
}

/**
 * Difficulty based on length and word count (for future filtering or display).
 * Easy = short/simple; hard = long/dense.
 */
export function getDifficulty(title: string): Difficulty {
  const t = title.trim();
  const words = t.split(/\s+/).filter(Boolean).length;
  const len = t.length;

  if (len <= 120 && words <= 12) return 'easy';
  if (len <= 220 && words <= 22) return 'medium';
  return 'hard';
}
