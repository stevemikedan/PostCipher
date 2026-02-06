// Post database system for deterministic daily puzzle selection

import { redis } from '@devvit/web/server';
import type { RedditPost } from '../../shared/types/puzzle';
import { CURATED_QUOTES } from './puzzle-library';

const POST_DB_KEY = 'postcipher:posts:all';
const POST_COUNT_KEY = 'postcipher:posts:count';

/**
 * Initialize the post database in Redis
 * This should be called once to seed the database
 * Must be called within a request context (lazy initialization)
 */
export async function initializePostDatabase(): Promise<void> {
  try {
    const existing = await redis.get(POST_COUNT_KEY);
    if (existing) {
      // Database already initialized
      return;
    }

    // Store all posts in Redis
    const posts: RedditPost[] = CURATED_QUOTES.map((quote, index) => ({
      ...quote,
      id: `post-${index}`,
      permalink: `https://reddit.com/${quote.subreddit}`,
      createdUtc: Date.now() / 1000 - (CURATED_QUOTES.length - index) * 86400, // Stagger dates
    }));

    // Store posts as JSON array
    await redis.set(POST_DB_KEY, JSON.stringify(posts));
    await redis.set(POST_COUNT_KEY, posts.length.toString());

    console.log(`Initialized post database with ${posts.length} posts`);
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
  return count ? parseInt(count, 10) : CURATED_QUOTES.length;
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
 * This ensures everyone gets the same post on the same day
 */
export async function getDailyPost(date: Date = new Date()): Promise<RedditPost> {
  await initializePostDatabase();
  
  // Normalize to UTC date string to ensure consistency
  const dateString = date.toISOString().split('T')[0];
  const posts = await getAllPosts();
  
  if (posts.length === 0) {
    throw new Error('No posts available in database');
  }
  
  // Use date string as seed for deterministic selection
  // This ensures same date = same hash = same post for all users
  const hash = hashString(`daily-${dateString}`);
  const index = hash % posts.length;
  
  console.log(`Selected post ${index} from ${posts.length} posts for date ${dateString} (hash: ${hash})`);
  
  return posts[index];
}

/**
 * Get a random post for practice mode
 * Optionally filter by subreddit
 * Uses timestamp-based seed to ensure variety between requests
 */
export async function getRandomPost(subreddit?: string): Promise<RedditPost> {
  await initializePostDatabase();
  
  let posts = await getAllPosts();
  
  // Filter by subreddit if specified
  if (subreddit) {
    const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
    posts = posts.filter((post) => 
      post.subreddit.toLowerCase().replace(/^r\//, '') === normalizedSubreddit
    );
    
    if (posts.length === 0) {
      throw new Error(`No posts found for subreddit: ${subreddit}`);
    }
  }
  
  if (posts.length === 0) {
    throw new Error('No posts available in database');
  }
  
  // Use timestamp-based seed for better variety (changes every second)
  // This ensures different puzzles even when there are only a few options
  const timestampSeed = Math.floor(Date.now() / 1000); // Changes every second
  const seedHash = hashString(`practice-${timestampSeed}-${subreddit || 'all'}`);
  const randomIndex = seedHash % posts.length;
  
  console.log(`Selected post ${randomIndex} from ${posts.length} posts${subreddit ? ` for ${subreddit}` : ''} (seed: ${seedHash})`);
  
  return posts[randomIndex];
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
