/** Minimal shape needed to build a Reddit post URL */
export type RedditPostSource = {
  permalink?: string | null;
  subreddit?: string | null;
  id?: string | null;
};

const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Build the full Reddit post URL for "View post" / "View Original Post".
 * Uses permalink when present, otherwise builds from subreddit + id so the link always works.
 */
export function getRedditPostUrl(source: RedditPostSource | null | undefined): string {
  if (!source) return '';
  const sub = (source.subreddit ?? '')
    .replace(/^r\//, '')
    .replace(/^r/, '')
    .trim() || 'reddit';
  const raw = (source.permalink ?? '').trim();
  if (raw) {
    if (raw.startsWith('http')) return raw;
    return `${REDDIT_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }
  if (source.id) return `${REDDIT_BASE}/r/${sub}/comments/${source.id}`;
  return `${REDDIT_BASE}/r/${sub}`;
}
