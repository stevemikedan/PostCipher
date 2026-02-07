// Reddit API service for fetching posts
// Uses Devvit Reddit API client (getHotPosts, getPostById, etc.) when available — no HTTP allowlist needed

import { reddit } from '@devvit/web/server';
import { getDifficulty, isCipherFriendly } from '../../shared/cryptogram/cipher-fit';
import type { RedditPost } from '../../shared/types/puzzle';

/** Only use posts that are a good fit for substitution cipher (no digits, mostly letters) */
function filterCipherFriendly(posts: RedditPost[]): RedditPost[] {
  return posts.filter((p) => p.cipherFriendly === true);
}

/**
 * Enable mock mode for testing Reddit API behavior
 * Set USE_MOCK_REDDIT=true in environment or change this to true
 */
const USE_MOCK_REDDIT = process.env.USE_MOCK_REDDIT === 'true' || false;

/** Minimal shape of a post returned by Devvit Reddit API (getHotPosts, getPostById, etc.) */
type DevvitPostLike = {
  id: string;
  title: string;
  permalink: string;
  score: number;
  subredditName: string;
  authorName: string;
  createdAt: Date | number;
};

/** Convert a Devvit API Post to our RedditPost type */
function devvitPostToRedditPost(p: DevvitPostLike): RedditPost {
  const id = p.id.replace(/^t3_/, '');
  const permalink = p.permalink.startsWith('/') ? p.permalink : `/${p.permalink}`;
  const author = p.authorName?.startsWith('u/') ? p.authorName : `u/${p.authorName || 'unknown'}`;
  const createdUtc =
    p.createdAt instanceof Date ? p.createdAt.getTime() / 1000 : Number(p.createdAt) / 1000 || Date.now() / 1000;
  const title = p.title;
  return {
    id,
    title,
    subreddit: p.subredditName?.startsWith('r/') ? p.subredditName : `r/${p.subredditName || 'unknown'}`,
    author,
    upvotes: p.score ?? 0,
    permalink,
    createdUtc,
    cipherFriendly: isCipherFriendly(title),
    difficulty: getDifficulty(title),
  };
}

/** Fetch posts from one subreddit via Devvit Reddit API (no HTTP allowlist). Returns [] if API unavailable. */
async function fetchPostsFromSubredditViaDevvit(
  subredditName: string,
  options: { sort?: 'hot' | 'new' | 'top' | 'rising'; limit?: number; pageSize?: number; timeframe?: string } = {}
): Promise<RedditPost[]> {
  const { sort = 'hot', limit = 100, pageSize = 100, timeframe = 'day' } = options;
  const name = subredditName.replace(/^r\//, '');
  if (!isAllowedSubreddit(name)) return [];

  try {
    type Listing = { all(): Promise<unknown[]> };
    let listing: Listing;
    const opts = { subredditName: name, limit, pageSize } as const;
    const optsWithTime = { ...opts, timeframe } as const;

    if (sort === 'hot' && typeof (reddit as { getHotPosts?: (o: unknown) => Listing }).getHotPosts === 'function') {
      listing = (reddit as { getHotPosts: (o: unknown) => Listing }).getHotPosts(optsWithTime);
    } else if (sort === 'new' && typeof (reddit as { getNewPosts?: (o: unknown) => Listing }).getNewPosts === 'function') {
      listing = (reddit as { getNewPosts: (o: unknown) => Listing }).getNewPosts(opts);
    } else if (sort === 'top' && typeof (reddit as { getTopPosts?: (o: unknown) => Listing }).getTopPosts === 'function') {
      listing = (reddit as { getTopPosts: (o: unknown) => Listing }).getTopPosts(optsWithTime);
    } else if (sort === 'rising' && typeof (reddit as { getRisingPosts?: (o: unknown) => Listing }).getRisingPosts === 'function') {
      listing = (reddit as { getRisingPosts: (o: unknown) => Listing }).getRisingPosts(opts);
    } else if (typeof (reddit as { getHotPosts?: (o: unknown) => Listing }).getHotPosts === 'function') {
      listing = (reddit as { getHotPosts: (o: unknown) => Listing }).getHotPosts(optsWithTime);
    } else {
      return [];
    }

    const raw = await listing.all();
    const posts: RedditPost[] = [];
    for (const item of raw) {
      const p = item as DevvitPostLike;
      if (!p?.title || !isValidContentRelaxed(p.title)) continue;
      posts.push(devvitPostToRedditPost(p));
    }
    return posts;
  } catch (err) {
    console.error(`Devvit Reddit API (${sort}) failed for r/${name}:`, err);
    return [];
  }
}

/**
 * Content filter configuration
 */
const CONTENT_FILTERS = {
  minLength: 50,
  maxLength: 300,
  minWords: 10,
  maxWords: 40,
  blacklistedSubreddits: new Set([
    'nsfw',
    'gonewild',
    'porn',
    // Add more as needed
  ]),
  whitelistedSubreddits: new Set([
    'Showerthoughts',
    'AskReddit',
    'todayilearned',
    'mildlyinteresting',
    'funny',
    'wholesomememes',
    'LifeProTips',
    'explainlikeimfive',
    'GetMotivated',
    'quotes',
    'YouShouldKnow',
    'DeepThoughts',
    'Philosophy',
    'TrueOffMyChest',
    'UnpopularOpinion',
  ]),
};

/**
 * Get whitelisted subreddits as array with r/ prefix
 */
export function getWhitelistedSubreddits(): string[] {
  return Array.from(CONTENT_FILTERS.whitelistedSubreddits).map((sub) => `r/${sub}`);
};

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
 * Check if text meets content requirements (strict: for daily / trending)
 */
function isValidContent(text: string): boolean {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);

  if (trimmed.length < CONTENT_FILTERS.minLength) return false;
  if (trimmed.length > CONTENT_FILTERS.maxLength) return false;
  if (words.length < CONTENT_FILTERS.minWords) return false;
  if (words.length > CONTENT_FILTERS.maxWords) return false;
  if (trimmed.length < 20) return false;
  if (words.length < 5) return false;

  const specialCharRatio = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length / trimmed.length;
  if (specialCharRatio > 0.3) return false;

  return true;
}

/** Relaxed check for practice when fetching a single subreddit (many have shorter titles) */
function isValidContentRelaxed(text: string): boolean {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);

  if (trimmed.length < 20) return false;
  if (trimmed.length > CONTENT_FILTERS.maxLength) return false;
  if (words.length < 5) return false;
  if (words.length > CONTENT_FILTERS.maxWords) return false;

  const specialCharRatio = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length / trimmed.length;
  if (specialCharRatio > 0.3) return false;

  return true;
}

/**
 * Check if subreddit is allowed
 */
function isAllowedSubreddit(subreddit: string): boolean {
  const normalized = subreddit.toLowerCase().replace('r/', '');
  
  // Check blacklist
  if (CONTENT_FILTERS.blacklistedSubreddits.has(normalized)) {
    return false;
  }

  // If whitelist is populated, check it
  if (CONTENT_FILTERS.whitelistedSubreddits.size > 0) {
    return CONTENT_FILTERS.whitelistedSubreddits.has(normalized);
  }

  // Default: allow if not blacklisted
  return true;
}

/**
 * Fetch trending posts from Reddit (multiple subreddits, sorted by popularity)
 * Uses Devvit Reddit API first (no allowlist); falls back to HTTP fetch if needed
 */
export async function fetchTrendingPosts(limit: number = 50): Promise<RedditPost[]> {
  if (USE_MOCK_REDDIT) {
    const { getMockTrendingPosts } = await import('./reddit-mock');
    return getMockTrendingPosts(limit);
  }

  const subreddits = Array.from(CONTENT_FILTERS.whitelistedSubreddits).slice(0, 10);
  const allPosts: RedditPost[] = [];

  // Try Devvit Reddit API first (no domain allowlist needed)
  for (const subredditName of subreddits) {
    const posts = await fetchPostsFromSubredditViaDevvit(subredditName, {
      sort: 'hot',
      limit: 25,
      pageSize: 25,
      timeframe: 'day',
    });
    allPosts.push(...posts);
  }

  if (allPosts.length > 0) {
    const sorted = allPosts.sort((a, b) => b.upvotes - a.upvotes).slice(0, limit);
    console.log(`Fetched ${sorted.length} posts via Devvit Reddit API (trending)`);
    return sorted;
  }

  // Fallback: HTTP fetch (requires domain allowlist)
  try {
    for (const subredditName of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subredditName}/hot.json?limit=25`;
        const response = await fetch(url, { headers: { 'User-Agent': 'PostCipher/1.0' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const posts = data.data?.children || [];
        for (const item of posts) {
          const post = item.data;
          if (!post) continue;
          const title = post.title || '';
          if (!title || !isValidContent(title) || !isAllowedSubreddit(post.subreddit || subredditName)) continue;
          const permalink = post.permalink
            ? post.permalink.startsWith('/') ? post.permalink : `/${post.permalink}`
            : `/r/${post.subreddit || subredditName}/comments/${post.id}`;
          allPosts.push({
            id: post.id,
            title,
            subreddit: `r/${post.subreddit || subredditName}`,
            author: post.author || 'unknown',
            upvotes: post.score || 0,
            permalink,
            createdUtc: post.created_utc || Date.now() / 1000,
          });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.includes('403') && !msg.includes('Forbidden')) console.error(`Error fetching r/${subredditName}:`, error);
      }
    }
    const sorted = allPosts.sort((a, b) => b.upvotes - a.upvotes).slice(0, limit);
    if (sorted.length > 0) console.log(`Fetched ${sorted.length} posts via HTTP fallback`);
    return sorted;
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return [];
  }
}

/**
 * Fetch multiple posts from a single subreddit (for practice mode library sync)
 * Uses Devvit Reddit API first; optional sort (hot | new | top | rising)
 */
export async function fetchPostsForSubreddit(
  subreddit: string,
  limit: number = 50,
  sort: 'hot' | 'new' | 'top' | 'rising' = 'hot'
): Promise<RedditPost[]> {
  if (USE_MOCK_REDDIT) {
    const { getMockRedditPosts } = await import('./reddit-mock');
    return getMockRedditPosts(subreddit).slice(0, limit);
  }

  const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
  if (!isAllowedSubreddit(normalizedSubreddit)) return [];

  const pageSize = Math.min(limit, 100);
  let posts = await fetchPostsFromSubredditViaDevvit(normalizedSubreddit, {
    sort,
    limit: pageSize,
    pageSize,
    timeframe: 'day',
  });

  if (posts.length > 0) {
    console.log(`Fetched ${posts.length} valid posts from r/${normalizedSubreddit} via Devvit API (${sort})`);
    return posts.slice(0, limit);
  }

  // Fallback: HTTP fetch
  try {
    const url = `https://www.reddit.com/r/${normalizedSubreddit}/hot.json?limit=${pageSize}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'PostCipher/1.0' } });
    if (!response.ok) return [];
    const data = await response.json();
    const children = data.data?.children || [];
    posts = [];
    for (const item of children) {
      const post = item.data;
      if (!post) continue;
      const title = post.title || '';
      if (!title || !isValidContentRelaxed(title)) continue;
      const postSubreddit = post.subreddit || normalizedSubreddit;
      const permalink = post.permalink
        ? post.permalink.startsWith('/') ? post.permalink : `/${post.permalink}`
        : `/r/${postSubreddit}/comments/${post.id}`;
      posts.push({
        id: post.id,
        title,
        subreddit: `r/${postSubreddit}`,
        author: post.author || 'unknown',
        upvotes: post.score || 0,
        permalink,
        createdUtc: post.created_utc || Date.now() / 1000,
        cipherFriendly: isCipherFriendly(title),
        difficulty: getDifficulty(title),
      });
    }
    if (posts.length > 0) console.log(`Fetched ${posts.length} posts from r/${normalizedSubreddit} via HTTP`);
    return posts.slice(0, limit);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('403') && !msg.includes('Forbidden')) console.error(`Error fetching r/${normalizedSubreddit}:`, error);
    return [];
  }
}

/**
 * Fetch a random post from Reddit (for practice mode)
 * Uses Devvit API first; optionally filter by subreddit; falls back to curated library if needed
 */
export async function fetchRandomPost(subreddit?: string): Promise<RedditPost | null> {
  if (USE_MOCK_REDDIT) {
    const { getRandomMockPost } = await import('./reddit-mock');
    const mockPost = getRandomMockPost(subreddit);
    if (mockPost) {
      console.log(`[MOCK MODE] Using mock post from ${mockPost.subreddit}`);
      return mockPost;
    }
  }

  try {
    let posts: RedditPost[] = subreddit
      ? await fetchPostsForSubreddit(subreddit, 50, 'hot')
      : await fetchTrendingPosts(30);

    if (posts.length === 0) {
      console.log(`No Reddit posts found${subreddit ? ` for ${subreddit}` : ''}, falling back to curated library`);
      const { getRandomCuratedQuote } = await import('./puzzle-library');
      let fallbackPost = getRandomCuratedQuote();
      if (subreddit) {
        const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
        const { CURATED_QUOTES } = await import('./puzzle-library');
        const matchingQuotes = CURATED_QUOTES.filter(
          (q) => q.subreddit.toLowerCase().replace(/^r\//, '') === normalizedSubreddit
        );
        if (matchingQuotes.length > 0) {
          const timestampSeed = Math.floor(Date.now() / 1000);
          const seedHash = hashString(`curated-${timestampSeed}-${normalizedSubreddit}`);
          const randomQuote = matchingQuotes[seedHash % matchingQuotes.length];
          fallbackPost = {
            ...randomQuote,
            id: `curated-${Date.now()}-${Math.random()}`,
            permalink: `https://reddit.com/${randomQuote.subreddit}`,
            createdUtc: Date.now() / 1000,
          };
        }
      }
      return fallbackPost;
    }

    // Only use cipher-friendly posts (no digits, mostly letters) so the puzzle isn't full of unencodable characters
    const cipherFriendlyPool = filterCipherFriendly(posts);
    if (cipherFriendlyPool.length === 0) {
      console.log(`No cipher-friendly posts in fetch (${posts.length} total), returning null for library fallback`);
      return null;
    }

    const timestampSeed = Math.floor(Date.now() / 1000);
    const seedHash = hashString(`reddit-${timestampSeed}-${subreddit || 'all'}`);
    const selectedPost = cipherFriendlyPool[seedHash % cipherFriendlyPool.length];
    console.log(`Selected cipher-friendly post from ${cipherFriendlyPool.length} (${selectedPost.subreddit}): "${selectedPost.title.substring(0, 50)}..."`);
    return selectedPost;
  } catch (error) {
    console.error('Error fetching random post:', error);
    const { getRandomCuratedQuote } = await import('./puzzle-library');
    return getRandomCuratedQuote();
  }
}

/**
 * Get post by ID from Reddit (t3_ prefix optional)
 * Uses Devvit getPostById first, then HTTP fallback
 */
export async function getPostById(postId: string): Promise<RedditPost | null> {
  const fullId = postId.startsWith('t3_') ? postId : `t3_${postId}`;
  try {
    if (typeof (reddit as { getPostById?: (id: string) => Promise<unknown> }).getPostById === 'function') {
      const post = await (reddit as { getPostById: (id: string) => Promise<DevvitPostLike> }).getPostById(fullId);
      if (post?.title) return devvitPostToRedditPost(post);
    }
  } catch (err) {
    console.error(`Devvit getPostById(${fullId}) failed:`, err);
  }

  try {
    const response = await fetch(`https://www.reddit.com/api/info.json?id=${fullId}`, {
      headers: { 'User-Agent': 'PostCipher/1.0' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const items = data.data?.children || [];
    if (items.length === 0) return null;
    const post = items[0].data;
    if (!post) return null;
    const permalink = post.permalink
      ? post.permalink.startsWith('/') ? post.permalink : `/${post.permalink}`
      : `/r/${post.subreddit}/comments/${post.id}`;
    return {
      id: post.id,
      title: post.title || '',
      subreddit: `r/${post.subreddit || 'unknown'}`,
      author: post.author || 'unknown',
      upvotes: post.score || 0,
      permalink,
      createdUtc: post.created_utc || Date.now() / 1000,
    };
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}
