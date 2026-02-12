// Post database system for deterministic daily puzzle selection
// Uses real Reddit posts - curated fallback library + posts pulled via Devvit API

import { redis } from '@devvit/web/server';
import { getDifficulty, isCipherFriendly } from '../../shared/cryptogram/cipher-fit';
import type { RedditPost } from '../../shared/types/puzzle';
import { getAllCuratedPosts } from './puzzle-library';

/** Whether a post is a good fit for substitution cipher (stored or computed from title) */
function postIsCipherFriendly(post: RedditPost): boolean {
  return post.cipherFriendly ?? isCipherFriendly(post.title);
}

const POST_DB_KEY = 'postcipher:posts:all';
const POST_COUNT_KEY = 'postcipher:posts:count';
const DAILY_USED_POSTS_KEY = 'postcipher:daily:used';

/** Max posts to keep in library (Redis handles 10k+ efficiently) */
export const MAX_DB_SIZE = 10000;

/**
 * Initialize the post database in Redis with curated real posts
 * These are actual Reddit posts with valid IDs and permalinks
 */
export async function initializePostDatabase(): Promise<void> {
  try {
    const existing = await redis.get(POST_COUNT_KEY);
    if (existing) {
      // Database already initialized
      return;
    }

    // Seed with curated real Reddit posts
    const curatedPosts = getAllCuratedPosts();
    
    // Ensure all posts have cipher-friendly and difficulty attributes
    const posts: RedditPost[] = curatedPosts.map((post) => ({
      ...post,
      cipherFriendly: post.cipherFriendly ?? isCipherFriendly(post.title),
      difficulty: post.difficulty ?? getDifficulty(post.title),
    }));

    await redis.set(POST_DB_KEY, JSON.stringify(posts));
    await redis.set(POST_COUNT_KEY, posts.length.toString());

    console.log(`Initialized post database with ${posts.length} curated real posts`);
  } catch (error) {
    // If no context, initialization will happen on first request
    if (error instanceof Error && error.message.includes('No context')) {
      console.log('Post database initialization deferred - will initialize on first request');
      return;
    }
    throw error;
  }
}

/**
 * Add a new post to the database
 */
export async function addPostToDatabase(post: RedditPost): Promise<void> {
  const existingJson = await redis.get(POST_DB_KEY);
  const posts: RedditPost[] = existingJson ? JSON.parse(existingJson) : [];
  
  posts.push(post);
  
  await redis.set(POST_DB_KEY, JSON.stringify(posts));
  await redis.set(POST_COUNT_KEY, posts.length.toString());
}

/**
 * Build a proper permalink for a post if it doesn't have one.
 * Priority:
 * 1. Keep existing permalink if it contains /comments/
 * 2. Build from id + subreddit for real Reddit posts
 * 3. Fall back to subreddit link for curated posts
 */
function ensureValidPermalink(post: RedditPost): string {
  const raw = (post.permalink ?? '').trim();
  // If it already has /comments/, it's a valid post link
  if (raw.includes('/comments/')) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  
  // If we have a real Reddit post ID, build the permalink
  const id = (post.id ?? '').trim();
  if (id && !id.startsWith('curated-') && !id.startsWith('post-') && !id.startsWith('practice-')) {
    const sub = (post.subreddit || 'r/reddit').replace(/^r\//, '');
    // Strip t3_ prefix if present
    const cleanId = id.replace(/^t3_/, '');
    return `/r/${sub}/comments/${cleanId}`;
  }
  
  // For curated posts, just link to the subreddit
  const sub = (post.subreddit || 'r/reddit').replace(/^r\//, '');
  return `/r/${sub}`;
}

/**
 * Sync Reddit posts to the library
 * Adds new posts, updates existing ones (keeps higher upvotes), and trims to max size
 */
export async function syncRedditPostsToLibrary(
  newPosts: RedditPost[],
  maxSize: number = MAX_DB_SIZE
): Promise<number> {
  await initializePostDatabase();

  const existingJson = await redis.get(POST_DB_KEY);
  const existingPosts: RedditPost[] = existingJson ? JSON.parse(existingJson) : [];

  const existingPostMap = new Map<string, RedditPost>();
  existingPosts.forEach((post) => existingPostMap.set(post.id, post));

  let newPostsAdded = 0;

  for (const newPost of newPosts) {
    const withAttrs = {
      ...newPost,
      cipherFriendly: newPost.cipherFriendly ?? isCipherFriendly(newPost.title),
      difficulty: newPost.difficulty ?? getDifficulty(newPost.title),
      permalink: ensureValidPermalink(newPost),
    };
    if (existingPostMap.has(newPost.id)) {
      const index = existingPosts.findIndex((p) => p.id === newPost.id);
      if (index !== -1) {
        existingPosts[index] = {
          ...withAttrs,
          upvotes: Math.max(existingPosts[index].upvotes, newPost.upvotes),
        };
      }
    } else {
      existingPosts.push(withAttrs);
      newPostsAdded++;
    }
  }

  // Backfill cipherFriendly/difficulty/permalink for existing posts
  for (const post of existingPosts) {
    if (post.cipherFriendly === undefined) (post as RedditPost).cipherFriendly = isCipherFriendly(post.title);
    if (post.difficulty === undefined) (post as RedditPost).difficulty = getDifficulty(post.title);
    // Fix permalinks for existing posts
    (post as RedditPost).permalink = ensureValidPermalink(post);
  }

  existingPosts.sort((a, b) => b.upvotes - a.upvotes);
  const trimmedPosts = existingPosts.slice(0, maxSize);

  await redis.set(POST_DB_KEY, JSON.stringify(trimmedPosts));
  await redis.set(POST_COUNT_KEY, trimmedPosts.length.toString());

  console.log(`Synced ${newPosts.length} posts: ${newPostsAdded} new, ${trimmedPosts.length} total in library`);
  return newPostsAdded;
}

/**
 * Fix permalinks for all existing posts in the library
 * Call this to repair posts that were saved with bad/missing permalinks
 */
export async function repairLibraryPermalinks(): Promise<number> {
  const existingJson = await redis.get(POST_DB_KEY);
  if (!existingJson) return 0;

  const posts: RedditPost[] = JSON.parse(existingJson);
  let fixedCount = 0;

  for (const post of posts) {
    const oldPermalink = post.permalink;
    const newPermalink = ensureValidPermalink(post);
    if (oldPermalink !== newPermalink) {
      post.permalink = newPermalink;
      fixedCount++;
    }
  }

  if (fixedCount > 0) {
    await redis.set(POST_DB_KEY, JSON.stringify(posts));
    console.log(`Fixed permalinks for ${fixedCount} posts`);
  }

  return fixedCount;
}

/**
 * Get set of post IDs that have been used for daily puzzles
 */
async function getUsedDailyPostIds(): Promise<Set<string>> {
  const usedJson = await redis.get(DAILY_USED_POSTS_KEY);
  if (!usedJson) return new Set();
  return new Set(JSON.parse(usedJson) as string[]);
}

/**
 * Mark a post as used for daily puzzle
 */
async function markPostAsUsedForDaily(postId: string): Promise<void> {
  const usedIds = await getUsedDailyPostIds();
  usedIds.add(postId);
  await redis.set(DAILY_USED_POSTS_KEY, JSON.stringify(Array.from(usedIds)));
}

/**
 * Reset used posts tracking (e.g. after ~1 year or when running low on unused posts)
 */
export async function resetUsedDailyPosts(): Promise<void> {
  await redis.del(DAILY_USED_POSTS_KEY);
  console.log('Reset daily puzzle used posts tracking');
}

/**
 * Get all posts from database
 */
export async function getAllPosts(): Promise<RedditPost[]> {
  await initializePostDatabase(); // Ensure DB is initialized
  
  const postsJson = await redis.get(POST_DB_KEY);
  if (!postsJson) {
    await initializePostDatabase();
    return getAllPosts();
  }
  
  return JSON.parse(postsJson) as RedditPost[];
}

/**
 * Get post count
 */
export async function getPostCount(): Promise<number> {
  await initializePostDatabase();
  
  const count = await redis.get(POST_COUNT_KEY);
  if (count) return parseInt(count, 10);
  // Fallback to curated posts count if Redis not initialized
  return getAllCuratedPosts().length;
}

/**
 * Hash a string to a number (deterministic)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get daily puzzle post using hash-based selection
 * Ensures same post for everyone on same day; prevents repeats by tracking used posts
 * Uses stable ordering (sort by post ID) so selection does not depend on database size
 */
export async function getDailyPost(date: Date = new Date()): Promise<RedditPost> {
  await initializePostDatabase();

  const dateString = date.toISOString().split('T')[0];
  const allPosts = await getAllPosts();

  if (allPosts.length === 0) {
    throw new Error('No posts available in database');
  }

  const usedIds = await getUsedDailyPostIds();
  const availablePosts = allPosts.filter((post) => !usedIds.has(post.id));

  // Prefer cipher-friendly posts (no digits, mostly letters) for better puzzle experience
  const cipherFriendlyPool = availablePosts.filter(postIsCipherFriendly);
  const selectionPool = cipherFriendlyPool.length > 0 ? cipherFriendlyPool : availablePosts;

  // If we've used most posts, reset tracking (e.g. after ~1 year)
  if (availablePosts.length < allPosts.length * 0.1) {
    console.log(`Low on unused posts (${availablePosts.length}/${allPosts.length}), resetting tracking`);
    await resetUsedDailyPosts();
    const hash = hashString(`daily-${dateString}`);
    const index = hash % allPosts.length;
    const selectedPost = allPosts[index];
    await markPostAsUsedForDaily(selectedPost.id);
    console.log(`Selected post ${index} from ${allPosts.length} posts for ${dateString} (hash: ${hash})`);
    return selectedPost;
  }

  // Stable ordering by post ID so selection does not change when DB size changes
  const sortedPosts = [...selectionPool].sort((a, b) => a.id.localeCompare(b.id));
  const hash = hashString(`daily-${dateString}`);
  const index = hash % sortedPosts.length;
  const selectedPost = sortedPosts[index];

  await markPostAsUsedForDaily(selectedPost.id);
  console.log(
    `Selected unused post ${index} from ${sortedPosts.length} available (${allPosts.length} total, cipher-friendly pool: ${cipherFriendlyPool.length}) for ${dateString}`
  );

  return selectedPost;
}

/**
 * Select one post from a given array using a deterministic seed (same seed = same post).
 * Prefers cipher-friendly posts. Use this when you have a fresh batch (e.g. from Reddit) so
 * selection uses that batch instead of the full library.
 */
export function selectPostFromPool(posts: RedditPost[], seed: number | string): RedditPost {
  if (posts.length === 0) throw new Error('No posts in pool');
  const cipherFriendlyPool = posts.filter(postIsCipherFriendly);
  const selectionPool = cipherFriendlyPool.length > 0 ? cipherFriendlyPool : posts;
  const seedHash = hashString(`practice-${seed}-pool`);
  const randomIndex = seedHash % selectionPool.length;
  return selectionPool[randomIndex];
}

/**
 * Get a random post for practice mode
 * Optionally filter by subreddit; optional seed ensures different post per "New Puzzle" click
 */
export async function getRandomPost(
  subreddit?: string,
  seed?: number | string
): Promise<RedditPost> {
  await initializePostDatabase();

  let posts = await getAllPosts();

  if (subreddit) {
    const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
    posts = posts.filter(
      (post) =>
        post.subreddit.toLowerCase().replace(/^r\//, '') === normalizedSubreddit
    );
    if (posts.length === 0) {
      throw new Error(`No posts found for subreddit: ${subreddit}`);
    }
  }

  if (posts.length === 0) {
    throw new Error('No posts available in database');
  }

  // Prefer cipher-friendly posts; fall back to all if none match
  const cipherFriendlyPool = posts.filter(postIsCipherFriendly);
  const selectionPool = cipherFriendlyPool.length > 0 ? cipherFriendlyPool : posts;

  const seedKey = seed ?? Date.now();
  const seedHash = hashString(`practice-${seedKey}-${subreddit || 'all'}`);
  const randomIndex = seedHash % selectionPool.length;

  console.log(
    `Selected post ${randomIndex} from ${selectionPool.length} posts${subreddit ? ` for ${subreddit}` : ''} (seed: ${seedHash}, cipher-friendly pool: ${cipherFriendlyPool.length})`
  );

  return selectionPool[randomIndex];
}

/**
 * Get list of available subreddits
 * Returns whitelisted subreddits that we fetch from via Reddit API
 */
export async function getAvailableSubreddits(): Promise<string[]> {
  // Return the whitelisted subreddits from Reddit service
  // These are the subreddits we actually fetch posts from
  const { getWhitelistedSubreddits } = await import('./reddit');
  return getWhitelistedSubreddits();
}

/**
 * Get a post by ID
 */
export async function getPostById(id: string): Promise<RedditPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.id === id) || null;
}
