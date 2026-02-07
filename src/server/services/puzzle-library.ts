// Curated puzzle library (fallback when Reddit API fails)

import type { RedditPost } from '../../shared/types/puzzle';

/**
 * Curated library of quotes for fallback/demo purposes
 */
export const CURATED_QUOTES: Array<Omit<RedditPost, 'id' | 'permalink' | 'createdUtc'>> = [
  {
    title: 'The first person to hear a parrot talk was probably not okay for a while',
    subreddit: 'r/Showerthoughts',
    author: 'u/DeepThinkingRedditor',
    upvotes: 47200,
  },
  {
    title: 'What is something that everyone should know but most people do not',
    subreddit: 'r/AskReddit',
    author: 'u/CuriousMind',
    upvotes: 52300,
  },
  {
    title: 'Dogs probably think we are immortal since we barely age during their lifetime',
    subreddit: 'r/Showerthoughts',
    author: 'u/PetLover2023',
    upvotes: 52400,
  },
  {
    title: 'If you think about it a library is just a time machine that only goes forward',
    subreddit: 'r/Showerthoughts',
    author: 'u/BookWorm2024',
    upvotes: 31200,
  },
  {
    title: 'Today I learned that honey never spoils archaeologists have found edible honey in ancient Egyptian tombs',
    subreddit: 'r/todayilearned',
    author: 'u/HistoryBuff',
    upvotes: 28900,
  },
  {
    title: 'Every person you meet knows something you do not',
    subreddit: 'r/Showerthoughts',
    author: 'u/WiseOwl99',
    upvotes: 45600,
  },
  {
    title: 'The best time to plant a tree was twenty years ago the second best time is now',
    subreddit: 'r/GetMotivated',
    author: 'u/GardeningGuru',
    upvotes: 38900,
  },
  {
    title: 'You are not stuck in traffic you are traffic',
    subreddit: 'r/Showerthoughts',
    author: 'u/CommuterThoughts',
    upvotes: 42100,
  },
  {
    title: 'The only way to do great work is to love what you do',
    subreddit: 'r/GetMotivated',
    author: 'u/MotivationalMind',
    upvotes: 36700,
  },
  {
    title: 'Time flies like an arrow fruit flies like a banana',
    subreddit: 'r/Showerthoughts',
    author: 'u/WordPlayMaster',
    upvotes: 33400,
  },
  {
    title: 'A computer once beat me at chess but it was no match for me at kick boxing',
    subreddit: 'r/funny',
    author: 'u/TechHumor',
    upvotes: 41200,
  },
  {
    title: 'The early bird might get the worm but the second mouse gets the cheese',
    subreddit: 'r/Showerthoughts',
    author: 'u/ProverbLover',
    upvotes: 38900,
  },
  {
    title: 'I used to think I was indecisive but now I am not so sure',
    subreddit: 'r/Showerthoughts',
    author: 'u/PhilosophyFan',
    upvotes: 45100,
  },
  {
    title: 'The problem with quotes on the internet is that you can never be sure they are authentic',
    subreddit: 'r/Showerthoughts',
    author: 'u/InternetSage',
    upvotes: 52300,
  },
  {
    title: 'Why do we drive on parkways and park on driveways',
    subreddit: 'r/Showerthoughts',
    author: 'u/LanguageLover',
    upvotes: 47800,
  },
  {
    title: 'If you are not paying for the product then you are the product',
    subreddit: 'r/LifeProTips',
    author: 'u/TechAware',
    upvotes: 51200,
  },
  {
    title: 'The only thing standing between you and your goal is the story you keep telling yourself',
    subreddit: 'r/GetMotivated',
    author: 'u/MotivationalMind',
    upvotes: 44500,
  },
  {
    title: 'If you want to go fast go alone if you want to go far go together',
    subreddit: 'r/GetMotivated',
    author: 'u/TeamPlayer',
    upvotes: 39800,
  },
  {
    title: 'The best way to predict the future is to create it',
    subreddit: 'r/GetMotivated',
    author: 'u/FutureThinker',
    upvotes: 46700,
  },
  {
    title: 'Success is not final failure is not fatal it is the courage to continue that counts',
    subreddit: 'r/GetMotivated',
    author: 'u/ResilientMind',
    upvotes: 48900,
  },
  {
    title: 'The only impossible journey is the one you never begin',
    subreddit: 'r/GetMotivated',
    author: 'u/JourneySeeker',
    upvotes: 42300,
  },
  {
    title: 'In the middle of difficulty lies opportunity',
    subreddit: 'r/GetMotivated',
    author: 'u/OpportunityFinder',
    upvotes: 45600,
  },
  {
    title: 'The way to get started is to quit talking and begin doing',
    subreddit: 'r/GetMotivated',
    author: 'u/ActionTaker',
    upvotes: 44100,
  },
  {
    title: 'Life is what happens to you while you are busy making other plans',
    subreddit: 'r/quotes',
    author: 'u/LifeObserver',
    upvotes: 51200,
  },
  {
    title: 'The future belongs to those who believe in the beauty of their dreams',
    subreddit: 'r/GetMotivated',
    author: 'u/DreamBeliever',
    upvotes: 47800,
  },
  {
    title: 'It is during our darkest moments that we must focus to see the light',
    subreddit: 'r/GetMotivated',
    author: 'u/LightSeeker',
    upvotes: 46500,
  },
  {
    title: 'The only person you are destined to become is the person you decide to be',
    subreddit: 'r/GetMotivated',
    author: 'u/SelfDetermined',
    upvotes: 49200,
  },
  {
    title: 'Do not wait for the perfect moment start where you are use what you have',
    subreddit: 'r/LifeProTips',
    author: 'u/StartNow',
    upvotes: 43400,
  },
  {
    title: 'The greatest glory in living lies not in never falling but in rising every time we fall',
    subreddit: 'r/quotes',
    author: 'u/ResilientSoul',
    upvotes: 50100,
  },
  {
    title: 'Twenty years from now you will be more disappointed by the things you did not do',
    subreddit: 'r/GetMotivated',
    author: 'u/RegretAvoider',
    upvotes: 48700,
  },
  {
    title: 'The only limit to our realization of tomorrow will be our doubts of today',
    subreddit: 'r/GetMotivated',
    author: 'u/DoubtOvercomer',
    upvotes: 45300,
  },
  {
    title: 'What lies behind us and what lies before us are tiny matters compared to what lies within us',
    subreddit: 'r/quotes',
    author: 'u/InnerStrength',
    upvotes: 51900,
  },
  {
    title: 'The two most important days in your life are the day you are born and the day you find out why',
    subreddit: 'r/GetMotivated',
    author: 'u/PurposeFinder',
    upvotes: 49600,
  },
  {
    title: 'You miss one hundred percent of the shots you do not take',
    subreddit: 'r/GetMotivated',
    author: 'u/RiskTaker',
    upvotes: 51100,
  },
  {
    title: 'Whether you think you can or you think you cannot you are right',
    subreddit: 'r/GetMotivated',
    author: 'u/MindsetMaster',
    upvotes: 52800,
  },
  {
    title: 'The person who says it cannot be done should not interrupt the person doing it',
    subreddit: 'r/GetMotivated',
    author: 'u/DoerNotTalker',
    upvotes: 47300,
  },
  {
    title: 'It always seems impossible until it is done',
    subreddit: 'r/quotes',
    author: 'u/ImpossibleAchiever',
    upvotes: 50200,
  },
  {
    title: 'The only way to do great work is to love what you do',
    subreddit: 'r/GetMotivated',
    author: 'u/PassionWorker',
    upvotes: 46700,
  },
  {
    title: 'Innovation distinguishes between a leader and a follower',
    subreddit: 'r/LifeProTips',
    author: 'u/InnovationLeader',
    upvotes: 45400,
  },
  {
    title: 'Life is ten percent what happens to you and ninety percent how you respond to it',
    subreddit: 'r/GetMotivated',
    author: 'u/ResponseMaster',
    upvotes: 51300,
  },
  {
    title: 'The best time to plant a tree was twenty years ago the second best time is now',
    subreddit: 'r/GetMotivated',
    author: 'u/TreePlanter',
    upvotes: 48900,
  },
  {
    title: 'Do not let yesterday take up too much of today',
    subreddit: 'r/LifeProTips',
    author: 'u/PresentMoment',
    upvotes: 47600,
  },
  {
    title: 'You learn more from failure than from success do not let it stop you failure builds character',
    subreddit: 'r/GetMotivated',
    author: 'u/FailureLearner',
    upvotes: 49800,
  },
  {
    title: 'If you are working on something exciting that you really care about you do not have to be pushed',
    subreddit: 'r/GetMotivated',
    author: 'u/PassionWorker',
    upvotes: 52100,
  },
  {
    title: 'People who are crazy enough to think they can change the world are the ones who do',
    subreddit: 'r/GetMotivated',
    author: 'u/WorldChanger',
    upvotes: 50700,
  },
  {
    title: 'The only way to have a good day is to start it with a positive attitude',
    subreddit: 'r/LifeProTips',
    author: 'u/PositiveThinker',
    upvotes: 46200,
  },
  {
    title: 'Happiness is not something ready made it comes from your own actions',
    subreddit: 'r/GetMotivated',
    author: 'u/HappinessCreator',
    upvotes: 49500,
  },
  {
    title: 'The way to get started is to quit talking and begin doing',
    subreddit: 'r/GetMotivated',
    author: 'u/ActionOriented',
    upvotes: 44800,
  },
  {
    title: 'Do not be afraid to give up the good to go for the great',
    subreddit: 'r/GetMotivated',
    author: 'u/GreatnessSeeker',
    upvotes: 48400,
  },
  {
    title: 'The only thing worse than being blind is having sight but no vision',
    subreddit: 'r/quotes',
    author: 'u/Visionary',
    upvotes: 51600,
  },
  {
    title: 'The future depends on what you do today',
    subreddit: 'r/GetMotivated',
    author: 'u/TodayAction',
    upvotes: 47100,
  },
  {
    title: 'Success usually comes to those who are too busy to be looking for it',
    subreddit: 'r/LifeProTips',
    author: 'u/BusySuccess',
    upvotes: 50300,
  },
  {
    title: 'The only place where success comes before work is in the dictionary',
    subreddit: 'r/GetMotivated',
    author: 'u/WorkFirst',
    upvotes: 48500,
  },
  {
    title: 'Do what you can with what you have where you are',
    subreddit: 'r/GetMotivated',
    author: 'u/Resourceful',
    upvotes: 45800,
  },
  {
    title: 'The best preparation for tomorrow is doing your best today',
    subreddit: 'r/LifeProTips',
    author: 'u/TodayBest',
    upvotes: 49200,
  },
  {
    title: 'The only impossible thing is the thing you never attempt',
    subreddit: 'r/GetMotivated',
    author: 'u/AttemptMaker',
    upvotes: 50900,
  },
  {
    title: 'You do not have to be great to start but you have to start to be great',
    subreddit: 'r/GetMotivated',
    author: 'u/Starter',
    upvotes: 49900,
  },
  {
    title: 'The secret of getting ahead is getting started',
    subreddit: 'r/LifeProTips',
    author: 'u/Starter',
    upvotes: 48700,
  },
  {
    title: 'The best way out is always through',
    subreddit: 'r/quotes',
    author: 'u/ThroughGoer',
    upvotes: 46400,
  },
  {
    title: 'It is not whether you get knocked down it is whether you get up',
    subreddit: 'r/GetMotivated',
    author: 'u/Resilient',
    upvotes: 51400,
  },
  {
    title: 'The only failure is not trying',
    subreddit: 'r/GetMotivated',
    author: 'u/Tryer',
    upvotes: 48100,
  },
  {
    title: 'What you get by achieving your goals is not as important as what you become',
    subreddit: 'r/GetMotivated',
    author: 'u/GoalAchiever',
    upvotes: 50600,
  },
  {
    title: 'The journey of a thousand miles begins with one step',
    subreddit: 'r/quotes',
    author: 'u/StepTaker',
    upvotes: 52000,
  },
  {
    title: 'Do not watch the clock do what it does keep going',
    subreddit: 'r/GetMotivated',
    author: 'u/ClockIgnorer',
    upvotes: 49700,
  },
  {
    title: 'The only person you should try to be better than is the person you were yesterday',
    subreddit: 'r/LifeProTips',
    author: 'u/SelfImprover',
    upvotes: 51500,
  },
  {
    title: 'Success is walking from failure to failure with no loss of enthusiasm',
    subreddit: 'r/GetMotivated',
    author: 'u/Enthusiastic',
    upvotes: 50800,
  },
  {
    title: 'The harder you work for something the greater you will feel when you achieve it',
    subreddit: 'r/GetMotivated',
    author: 'u/HardWorker',
    upvotes: 50400,
  },
  {
    title: 'Your stomach thinks all potato is mashed',
    subreddit: 'r/Showerthoughts',
    author: 'u/PhilosophyFan99',
    upvotes: 38100,
  },
  {
    title: 'The word bed literally looks like a bed',
    subreddit: 'r/Showerthoughts',
    author: 'u/VisualThinker',
    upvotes: 28900,
  },
  {
    title: 'Explain like I am five why do we have different time zones',
    subreddit: 'r/explainlikeimfive',
    author: 'u/CuriousKid',
    upvotes: 34200,
  },
  {
    title: 'You should know that most people are not thinking about you they are thinking about themselves',
    subreddit: 'r/YouShouldKnow',
    author: 'u/SelfAware',
    upvotes: 38900,
  },
  {
    title: 'This mildly interesting fact will change how you see the world',
    subreddit: 'r/mildlyinteresting',
    author: 'u/FactFinder',
    upvotes: 45600,
  },
  {
    title: 'A small act of kindness can make someone entire day better',
    subreddit: 'r/wholesomememes',
    author: 'u/KindnessSpreader',
    upvotes: 52300,
  },
  // Extra variety for subreddits that had only one quote (so "New Puzzle" gives different posts when API is down)
  {
    title: 'What is a skill that took you years to learn but was totally worth it',
    subreddit: 'r/AskReddit',
    author: 'u/SkillSeeker',
    upvotes: 41200,
  },
  {
    title: 'Today I learned that the shortest war in history lasted thirty eight minutes',
    subreddit: 'r/todayilearned',
    author: 'u/HistoryNerd',
    upvotes: 32100,
  },
  {
    title: 'I told my wife she was drawing her eyebrows too high she looked surprised',
    subreddit: 'r/funny',
    author: 'u/DadJokesForever',
    upvotes: 28900,
  },
  {
    title: 'Explain like I am five why does the moon change shape in the sky',
    subreddit: 'r/explainlikeimfive',
    author: 'u/CuriousKid',
    upvotes: 25600,
  },
  {
    title: 'You should know that honey never spoils and can last for thousands of years',
    subreddit: 'r/YouShouldKnow',
    author: 'u/FactChecker',
    upvotes: 19800,
  },
  {
    title: 'This mildly interesting photo shows what happens when you leave bread in the sun',
    subreddit: 'r/mildlyinteresting',
    author: 'u/PhotoFan',
    upvotes: 22400,
  },
  {
    title: 'Sometimes the smallest step in the right direction ends up being the biggest step',
    subreddit: 'r/wholesomememes',
    author: 'u/PositiveVibes',
    upvotes: 36700,
  },
  {
    title: 'The unexamined life is not worth living according to ancient philosophy',
    subreddit: 'r/Philosophy',
    author: 'u/ThinkDeep',
    upvotes: 15200,
  },
  {
    title: 'Deep thoughts often come when we stop filling every moment with noise',
    subreddit: 'r/DeepThoughts',
    author: 'u/QuietMind',
    upvotes: 18300,
  },
  {
    title: 'Unpopular opinion but sometimes being alone is better than being with the wrong people',
    subreddit: 'r/UnpopularOpinion',
    author: 'u/HonestTake',
    upvotes: 22100,
  },
  {
    title: 'True off my chest sometimes I wonder if we are all just pretending to be okay',
    subreddit: 'r/TrueOffMyChest',
    author: 'u/RealTalk',
    upvotes: 19400,
  },
];

/**
 * Get a random quote from the curated library
 */
export function getRandomCuratedQuote(): RedditPost {
  const quote = CURATED_QUOTES[Math.floor(Math.random() * CURATED_QUOTES.length)];
  return {
    ...quote,
    id: `curated-${Date.now()}-${Math.random()}`,
    permalink: `https://reddit.com/${quote.subreddit}`,
    createdUtc: Date.now() / 1000,
  };
}

/**
 * Get a quote by index (for deterministic daily puzzles)
 */
export function getCuratedQuoteByIndex(index: number): RedditPost {
  const quote = CURATED_QUOTES[index % CURATED_QUOTES.length];
  return {
    ...quote,
    id: `curated-${index}`,
    permalink: `https://reddit.com/${quote.subreddit}`,
    createdUtc: Date.now() / 1000,
  };
}
