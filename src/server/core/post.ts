import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  const today = new Date().toISOString().split('T')[0];
  return await reddit.submitCustomPost({
    title: `🔐 Daily Cryptogram - ${today}`,
  });
};
