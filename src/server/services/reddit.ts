// Reddit API service for fetching posts

import { reddit } from '@devvit/web/server';
import type { RedditPost } from '../../shared/types/puzzle';

/**
 * Enable mock mode for testing Reddit API behavior
 * Set USE_MOCK_REDDIT=true in environment or change this to true
 */
const USE_MOCK_REDDIT = process.env.USE_MOCK_REDDIT === 'true' || false;

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
 * Check if text meets content requirements
 */
function isValidContent(text: string): boolean {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);

  // Length checks
  if (trimmed.length < CONTENT_FILTERS.minLength) return false;
  if (trimmed.length > CONTENT_FILTERS.maxLength) return false;
  if (words.length < CONTENT_FILTERS.minWords) return false;
  if (words.length > CONTENT_FILTERS.maxWords) return false;

  // Basic quality checks
  if (trimmed.length < 20) return false; // Too short
  if (words.length < 5) return false; // Too few words

  // Check for excessive special characters
  const specialCharRatio = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length / trimmed.length;
  if (specialCharRatio > 0.3) return false; // Too many special chars

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
 * Fetch trending posts from Reddit
 * Fetches from multiple subreddits and filters for cryptogram-appropriate content
 */
export async function fetchTrendingPosts(limit: number = 50): Promise<RedditPost[]> {
  // Use mock data if mock mode is enabled
  if (USE_MOCK_REDDIT) {
    const { getMockTrendingPosts } = await import('./reddit-mock');
    return getMockTrendingPosts(limit);
  }

  try {
    const subreddits = Array.from(CONTENT_FILTERS.whitelistedSubreddits);
    const allPosts: RedditPost[] = [];

    // Fetch posts from multiple subreddits using Reddit's public JSON API
    for (const subredditName of subreddits.slice(0, 10)) {
      try {
        // Use Reddit's public JSON API since reddit.getPosts may not be available
        const url = `https://www.reddit.com/r/${subredditName}/hot.json?limit=25`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'PostCipher/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const posts = data.data?.children || [];

        for (const item of posts) {
          const post = item.data;
          if (!post) continue;

          // Only use post titles (not selftext) for cryptograms
          const title = post.title || '';
          
          if (
            title &&
            isValidContent(title) &&
            isAllowedSubreddit(post.subreddit || subredditName)
          ) {
            // Build proper permalink - Reddit permalinks are relative paths
            const permalink = post.permalink 
              ? post.permalink.startsWith('/') 
                ? post.permalink 
                : `/${post.permalink}`
              : `/r/${post.subreddit || subredditName}/comments/${post.id}`;

            allPosts.push({
              id: post.id,
              title: title,
              subreddit: `r/${post.subreddit || subredditName}`,
              author: post.author || 'unknown',
              upvotes: post.score || 0,
              permalink: permalink,
              createdUtc: post.created_utc || Date.now() / 1000,
            });
          }
        }
      } catch (error) {
        // Reddit API may require domain allowlisting in Devvit
        // Silently continue - fallback to curated library will handle it
        // Only log unexpected errors (not 403/Forbidden which is expected)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('403') && !errorMessage.includes('Forbidden')) {
          console.error(`Error fetching from r/${subredditName}:`, error);
        }
        // Continue to next subreddit
      }
    }

    // Sort by upvotes and return top results
    const sorted = allPosts
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, limit);

    console.log(`Fetched ${sorted.length} posts from Reddit API`);
    return sorted;
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return [];
  }
}

/**
 * Fetch a random post from Reddit (for practice mode)
 * Optionally filter by specific subreddit
 * Falls back to curated library if Reddit API unavailable
 */
export async function fetchRandomPost(subreddit?: string): Promise<RedditPost | null> {
  // Use mock data if mock mode is enabled
  if (USE_MOCK_REDDIT) {
    const { getRandomMockPost } = await import('./reddit-mock');
    const mockPost = getRandomMockPost(subreddit);
    if (mockPost) {
      console.log(`[MOCK MODE] Using mock post from ${mockPost.subreddit}`);
      return mockPost;
    }
    // If no mock post found for subreddit, fall through to curated library
  }

  try {
    let posts: RedditPost[] = [];

    if (subreddit) {
      // Fetch from specific subreddit using Reddit's public JSON API
      const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
      console.log(`Fetching posts from r/${normalizedSubreddit}`);
      
      try {
        const url = `https://www.reddit.com/r/${normalizedSubreddit}/hot.json?limit=50`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'PostCipher/1.0',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const redditPosts = data.data?.children || [];
          console.log(`Found ${redditPosts.length} posts from r/${normalizedSubreddit}`);

          for (const item of redditPosts) {
            const post = item.data;
            if (!post) continue;

            const title = post.title || '';
            if (title && isValidContent(title)) {
              // Ensure subreddit matches what was requested
              const postSubreddit = post.subreddit || normalizedSubreddit;
              const permalink = post.permalink 
                ? post.permalink.startsWith('/') 
                  ? post.permalink 
                  : `/${post.permalink}`
                : `/r/${postSubreddit}/comments/${post.id}`;

              posts.push({
                id: post.id,
                title: title,
                subreddit: `r/${postSubreddit}`, // Use actual subreddit from post
                author: post.author || 'unknown',
                upvotes: post.score || 0,
                permalink: permalink,
                createdUtc: post.created_utc || Date.now() / 1000,
              });
            }
          }
          
          console.log(`Filtered to ${posts.length} valid posts from r/${normalizedSubreddit}`);
        }
      } catch (error) {
        // Reddit API may require domain allowlisting in Devvit
        // Silently continue - fallback to curated library will handle it
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('403') && !errorMessage.includes('Forbidden')) {
          console.error(`Error fetching from r/${normalizedSubreddit}:`, error);
        }
      }
    } else {
      // Fetch from multiple subreddits
      posts = await fetchTrendingPosts(30);
    }

    if (posts.length === 0) {
      // Fallback to curated library, but try to match subreddit if specified
      console.log(`No Reddit posts found${subreddit ? ` for ${subreddit}` : ''}, falling back to curated library`);
      const { getRandomCuratedQuote } = await import('./puzzle-library');
      const fallbackPost = getRandomCuratedQuote();
      
      // If subreddit was specified, try to find a match in curated library
      if (subreddit) {
        const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
        // Check if curated library has posts from this subreddit
        const { CURATED_QUOTES } = await import('./puzzle-library');
        const matchingQuotes = CURATED_QUOTES.filter(
          (q) => q.subreddit.toLowerCase().replace(/^r\//, '') === normalizedSubreddit
        );
        
        if (matchingQuotes.length > 0) {
          // Use timestamp-based seed for variety
          const timestampSeed = Math.floor(Date.now() / 1000);
          const seedHash = hashString(`curated-${timestampSeed}-${normalizedSubreddit}`);
          const randomIndex = seedHash % matchingQuotes.length;
          const randomQuote = matchingQuotes[randomIndex];
          return {
            ...randomQuote,
            id: `curated-${Date.now()}-${Math.random()}`,
            permalink: `https://reddit.com/${randomQuote.subreddit}`,
            createdUtc: Date.now() / 1000,
          };
        }
      }
      
      return fallbackPost;
    }
  
    // Use timestamp-based seed for better variety (changes every second)
    // This ensures different puzzles even when there are only a few options
    const timestampSeed = Math.floor(Date.now() / 1000);
    const seedHash = hashString(`reddit-${timestampSeed}-${subreddit || 'all'}`);
    const randomIndex = seedHash % posts.length;
    const selectedPost = posts[randomIndex];
    console.log(`Selected post ${randomIndex} from ${posts.length} posts from ${selectedPost.subreddit}: "${selectedPost.title.substring(0, 50)}..."`);
    return selectedPost;
  } catch (error) {
    console.error('Error fetching random post:', error);
    // Fallback to curated library
    const { getRandomCuratedQuote } = await import('./puzzle-library');
    return getRandomCuratedQuote();
  }
}

/**
 * Get post by ID from Reddit
 */
export async function getPostById(postId: string): Promise<RedditPost | null> {
  try {
    // Use Reddit's public JSON API
    const url = `https://www.reddit.com/api/info.json?id=t3_${postId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PostCipher/1.0',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const items = data.data?.children || [];
    if (items.length === 0) return null;

    const post = items[0].data;
    if (!post) return null;

    const permalink = post.permalink 
      ? post.permalink.startsWith('/') 
        ? post.permalink 
        : `/${post.permalink}`
      : `/r/${post.subreddit}/comments/${post.id}`;

    return {
      id: post.id,
      title: post.title || '',
      subreddit: `r/${post.subreddit || 'unknown'}`,
      author: post.author || 'unknown',
      upvotes: post.score || 0,
      permalink: permalink,
      createdUtc: post.created_utc || Date.now() / 1000,
    };
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}
