// Cryptogram Engine - Core cipher generation and encryption logic

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Mulberry32 PRNG - deterministic random number generator
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string to a number
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Seeded shuffle - deterministic array shuffling
 */
export function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface CipherMap {
  encode: Record<string, string>;
  decode: Record<string, string>;
}

/**
 * Generate a cipher map from a seed string
 * Ensures no letter maps to itself
 */
export function generateCipherMap(seedString: string): CipherMap {
  const seedNum = hashString(seedString);
  const rng = mulberry32(seedNum);
  const shuffled = seededShuffle(ALPHABET, rng);

  // Ensure no letter maps to itself
  for (let i = 0; i < ALPHABET.length; i++) {
    if (shuffled[i] === ALPHABET[i]) {
      const swapIdx = (i + 1) % ALPHABET.length;
      [shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i]];
    }
  }

  const encode: Record<string, string> = {};
  const decode: Record<string, string> = {};
  for (let i = 0; i < ALPHABET.length; i++) {
    encode[ALPHABET[i]] = shuffled[i];
    decode[shuffled[i]] = ALPHABET[i];
  }

  return { encode, decode };
}

/**
 * Encrypt text using a cipher map
 */
export function encryptText(text: string, map: CipherMap): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => (ALPHABET.includes(char) ? map.encode[char] : char))
    .join('');
}

/**
 * Generate seed string for daily puzzle
 */
export function getDailyPuzzleSeed(date: Date, puzzleId: string): string {
  const dateString = date.toISOString().split('T')[0];
  return `cryptogram-${dateString}-${puzzleId}`;
}

/**
 * Generate seed string for practice puzzle
 */
export function getPracticePuzzleSeed(puzzleId: string): string {
  return `cryptogram-practice-${puzzleId}`;
}
