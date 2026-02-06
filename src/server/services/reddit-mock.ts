// Mock Reddit API data for testing
// This simulates Reddit API responses with multiple posts per subreddit

import type { RedditPost } from '../../shared/types/puzzle';

/**
 * Mock Reddit posts organized by subreddit
 * Each subreddit has multiple posts to test variety
 */
const MOCK_REDDIT_POSTS: Record<string, RedditPost[]> = {
  'askreddit': [
    {
      id: 'mock-askreddit-1',
      title: 'What is something that everyone should know but most people do not',
      subreddit: 'r/AskReddit',
      author: 'u/CuriousMind',
      upvotes: 52300,
      permalink: '/r/AskReddit/comments/mock-askreddit-1',
      createdUtc: Date.now() / 1000 - 86400,
    },
    {
      id: 'mock-askreddit-2',
      title: 'What is a skill that everyone should learn but most people never do',
      subreddit: 'r/AskReddit',
      author: 'u/LifeSkillsGuru',
      upvotes: 41200,
      permalink: '/r/AskReddit/comments/mock-askreddit-2',
      createdUtc: Date.now() / 1000 - 172800,
    },
    {
      id: 'mock-askreddit-3',
      title: 'What is the best piece of advice you have ever received',
      subreddit: 'r/AskReddit',
      author: 'u/WiseAdvice',
      upvotes: 38900,
      permalink: '/r/AskReddit/comments/mock-askreddit-3',
      createdUtc: Date.now() / 1000 - 259200,
    },
    {
      id: 'mock-askreddit-4',
      title: 'What is something that seems easy but is actually very difficult',
      subreddit: 'r/AskReddit',
      author: 'u/RealityCheck',
      upvotes: 35600,
      permalink: '/r/AskReddit/comments/mock-askreddit-4',
      createdUtc: Date.now() / 1000 - 345600,
    },
    {
      id: 'mock-askreddit-5',
      title: 'What is a common misconception that drives you crazy',
      subreddit: 'r/AskReddit',
      author: 'u/FactChecker',
      upvotes: 47800,
      permalink: '/r/AskReddit/comments/mock-askreddit-5',
      createdUtc: Date.now() / 1000 - 432000,
    },
  ],
  'todayilearned': [
    {
      id: 'mock-til-1',
      title: 'Today I learned that honey never spoils archaeologists have found edible honey in ancient Egyptian tombs',
      subreddit: 'r/todayilearned',
      author: 'u/HistoryBuff',
      upvotes: 28900,
      permalink: '/r/todayilearned/comments/mock-til-1',
      createdUtc: Date.now() / 1000 - 86400,
    },
    {
      id: 'mock-til-2',
      title: 'Today I learned that octopuses have three hearts and blue blood',
      subreddit: 'r/todayilearned',
      author: 'u/MarineBiology',
      upvotes: 32400,
      permalink: '/r/todayilearned/comments/mock-til-2',
      createdUtc: Date.now() / 1000 - 172800,
    },
    {
      id: 'mock-til-3',
      title: 'Today I learned that bananas are berries but strawberries are not',
      subreddit: 'r/todayilearned',
      author: 'u/BotanyNerd',
      upvotes: 26700,
      permalink: '/r/todayilearned/comments/mock-til-3',
      createdUtc: Date.now() / 1000 - 259200,
    },
    {
      id: 'mock-til-4',
      title: 'Today I learned that the human brain uses about twenty percent of the body total energy',
      subreddit: 'r/todayilearned',
      author: 'u/NeuroscienceFan',
      upvotes: 31200,
      permalink: '/r/todayilearned/comments/mock-til-4',
      createdUtc: Date.now() / 1000 - 345600,
    },
  ],
  'quotes': [
    {
      id: 'mock-quotes-1',
      title: 'The only way to do great work is to love what you do',
      subreddit: 'r/quotes',
      author: 'u/MotivationalMind',
      upvotes: 36700,
      permalink: '/r/quotes/comments/mock-quotes-1',
      createdUtc: Date.now() / 1000 - 86400,
    },
    {
      id: 'mock-quotes-2',
      title: 'Success is not final failure is not fatal it is the courage to continue that counts',
      subreddit: 'r/quotes',
      author: 'u/InspirationalQuotes',
      upvotes: 42300,
      permalink: '/r/quotes/comments/mock-quotes-2',
      createdUtc: Date.now() / 1000 - 172800,
    },
    {
      id: 'mock-quotes-3',
      title: 'The future belongs to those who believe in the beauty of their dreams',
      subreddit: 'r/quotes',
      author: 'u/Dreamer2024',
      upvotes: 38900,
      permalink: '/r/quotes/comments/mock-quotes-3',
      createdUtc: Date.now() / 1000 - 259200,
    },
    {
      id: 'mock-quotes-4',
      title: 'In the middle of difficulty lies opportunity',
      subreddit: 'r/quotes',
      author: 'u/PhilosophyLover',
      upvotes: 34500,
      permalink: '/r/quotes/comments/mock-quotes-4',
      createdUtc: Date.now() / 1000 - 345600,
    },
    {
      id: 'mock-quotes-5',
      title: 'Be yourself everyone else is already taken',
      subreddit: 'r/quotes',
      author: 'u/AuthenticSelf',
      upvotes: 41200,
      permalink: '/r/quotes/comments/mock-quotes-5',
      createdUtc: Date.now() / 1000 - 432000,
    },
    {
      id: 'mock-quotes-6',
      title: 'The only impossible journey is the one you never begin',
      subreddit: 'r/quotes',
      author: 'u/JourneyStarter',
      upvotes: 37800,
      permalink: '/r/quotes/comments/mock-quotes-6',
      createdUtc: Date.now() / 1000 - 518400,
    },
    {
      id: 'mock-quotes-7',
      title: 'Life is what happens to you while you are busy making other plans',
      subreddit: 'r/quotes',
      author: 'u/LifeObserver',
      upvotes: 45600,
      permalink: '/r/quotes/comments/mock-quotes-7',
      createdUtc: Date.now() / 1000 - 604800,
    },
  ],
  'getmotivated': [
    {
      id: 'mock-motivated-1',
      title: 'The best time to plant a tree was twenty years ago the second best time is now',
      subreddit: 'r/GetMotivated',
      author: 'u/GardeningGuru',
      upvotes: 38900,
      permalink: '/r/GetMotivated/comments/mock-motivated-1',
      createdUtc: Date.now() / 1000 - 86400,
    },
    {
      id: 'mock-motivated-2',
      title: 'You do not have to be great to start but you have to start to be great',
      subreddit: 'r/GetMotivated',
      author: 'u/StartNow',
      upvotes: 41200,
      permalink: '/r/GetMotivated/comments/mock-motivated-2',
      createdUtc: Date.now() / 1000 - 172800,
    },
    {
      id: 'mock-motivated-3',
      title: 'The only person you should try to be better than is the person you were yesterday',
      subreddit: 'r/GetMotivated',
      author: 'u/PersonalGrowth',
      upvotes: 35600,
      permalink: '/r/GetMotivated/comments/mock-motivated-3',
      createdUtc: Date.now() / 1000 - 259200,
    },
  ],
  'showerthoughts': [
    {
      id: 'mock-shower-1',
      title: 'The first person to hear a parrot talk was probably not okay for a while',
      subreddit: 'r/Showerthoughts',
      author: 'u/DeepThinkingRedditor',
      upvotes: 47200,
      permalink: '/r/Showerthoughts/comments/mock-shower-1',
      createdUtc: Date.now() / 1000 - 86400,
    },
    {
      id: 'mock-shower-2',
      title: 'Dogs probably think we are immortal since we barely age during their lifetime',
      subreddit: 'r/Showerthoughts',
      author: 'u/PetLover2023',
      upvotes: 52400,
      permalink: '/r/Showerthoughts/comments/mock-shower-2',
      createdUtc: Date.now() / 1000 - 172800,
    },
    {
      id: 'mock-shower-3',
      title: 'If you think about it a library is just a time machine that only goes forward',
      subreddit: 'r/Showerthoughts',
      author: 'u/BookWorm2024',
      upvotes: 31200,
      permalink: '/r/Showerthoughts/comments/mock-shower-3',
      createdUtc: Date.now() / 1000 - 259200,
    },
  ],
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
 * Get mock posts for a subreddit
 * Simulates Reddit API response with multiple posts
 */
export function getMockRedditPosts(subreddit?: string): RedditPost[] {
  if (!subreddit) {
    // Return posts from all subreddits
    return Object.values(MOCK_REDDIT_POSTS).flat();
  }

  const normalizedSubreddit = subreddit.toLowerCase().replace(/^r\//, '');
  return MOCK_REDDIT_POSTS[normalizedSubreddit] || [];
}

/**
 * Get a random mock post (for testing)
 * Uses timestamp-based seed for variety
 */
export function getRandomMockPost(subreddit?: string): RedditPost | null {
  const posts = getMockRedditPosts(subreddit);
  
  if (posts.length === 0) {
    return null;
  }

  // Use timestamp-based seed for variety (changes every second)
  const timestampSeed = Math.floor(Date.now() / 1000);
  const seedHash = hashString(`mock-${timestampSeed}-${subreddit || 'all'}`);
  const randomIndex = seedHash % posts.length;
  
  console.log(`[MOCK] Selected post ${randomIndex} from ${posts.length} mock posts${subreddit ? ` for ${subreddit}` : ''}`);
  
  return posts[randomIndex];
}

/**
 * Get mock trending posts (for daily puzzle testing)
 */
export function getMockTrendingPosts(limit: number = 50): RedditPost[] {
  const allPosts = Object.values(MOCK_REDDIT_POSTS).flat();
  
  // Sort by upvotes and return top results
  const sorted = allPosts
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, limit);
  
  console.log(`[MOCK] Returning ${sorted.length} trending posts`);
  return sorted;
}
