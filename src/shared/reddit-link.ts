/** Minimal shape needed to build a Reddit post URL */
export type RedditPostSource = {
  permalink?: string | null;
  subreddit?: string | null;
  id?: string | null;
};

const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Build the full Reddit post URL for "View post" / "View Original Post".
 * Uses permalink when present (if it points to a specific post), otherwise builds from subreddit + id.
 */
export function getRedditPostUrl(source: RedditPostSource | null | undefined): string {
  if (!source) return '';
  const sub = (source.subreddit ?? '')
    .replace(/^r\//, '')
    .replace(/^r/, '')
    .trim() || 'reddit';
  const raw = (source.permalink ?? '').trim();
  
  // Check if permalink points to a specific post (contains /comments/)
  if (raw && raw.includes('/comments/')) {
    if (raw.startsWith('http')) return raw;
    return `${REDDIT_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }
  
  // If we have an ID that looks like a real Reddit post ID, build a proper link
  const id = source.id ?? '';
  if (id && !id.startsWith('curated-') && !id.startsWith('post-')) {
    return `${REDDIT_BASE}/r/${sub}/comments/${id}`;
  }
  
  // For curated posts without real IDs, link to the subreddit
  return `${REDDIT_BASE}/r/${sub}`;
}
