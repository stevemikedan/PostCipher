/** Minimal shape needed to build a Reddit post URL */
export type RedditPostSource = {
  permalink?: string | null;
  subreddit?: string | null;
  id?: string | null;
};

const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Build the full Reddit post URL for "View post" / "View Original Post".
 * Priority: 
 * 1. Use permalink if it contains /comments/ (direct post link)
 * 2. Build from id + subreddit if we have a real Reddit post ID
 * 3. Fall back to subreddit link for curated posts
 */
export function getRedditPostUrl(source: RedditPostSource | null | undefined): string {
  if (!source) return '';
  
  const sub = (source.subreddit ?? '')
    .replace(/^r\//, '')
    .replace(/^r/, '')
    .trim() || 'reddit';
  
  const id = (source.id ?? '').trim();
  const raw = (source.permalink ?? '').trim();
  
  // Check if permalink points to a specific post (contains /comments/)
  if (raw && raw.includes('/comments/')) {
    if (raw.startsWith('http')) return raw;
    return `${REDDIT_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }
  
  // If we have an ID that looks like a real Reddit post ID, always build a proper link
  // This handles cases where permalink was saved incorrectly as just a subreddit URL
  if (id && !id.startsWith('curated-') && !id.startsWith('post-') && !id.startsWith('practice-')) {
    // Strip t3_ prefix if present
    const cleanId = id.replace(/^t3_/, '');
    return `${REDDIT_BASE}/r/${sub}/comments/${cleanId}`;
  }
  
  // For curated/practice posts without real IDs, link to the subreddit
  return `${REDDIT_BASE}/r/${sub}`;
}
