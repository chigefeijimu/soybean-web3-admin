import { request } from '../request';

const baseUrl = 'http://localhost:3006';

export interface SentimentOverview {
  totalProtocols: number;
  avgSentiment: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  mostBullish: string[];
  mostBearish: string[];
  lastUpdated: string;
}

export interface SentimentData {
  protocol: string;
  chain: string;
  overall: number;
  twitter: number;
  discord: number;
  reddit: number;
  github: number;
  news: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  mentionCount: number;
  engagementRate: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topKeywords: string[];
  recentSentiment: Array<{
    source: string;
    sentiment: number;
    date: string;
    highlights: string;
  }>;
}

export interface TrendingProtocol {
  protocol: string;
  sentiment: number;
  mentions: number;
  trend: string;
  change: number;
}

export interface SocialStats {
  protocol: string;
  twitter: {
    followers: number;
    engagement: number;
    trending: boolean;
  };
  discord: {
    members: number;
    online: number;
    growth: number;
  };
  reddit: {
    subscribers: number;
    activeUsers: number;
    postsPerDay: number;
  };
  github: {
    stars: number;
    forks: number;
    contributors: number;
    recentCommits: number;
  };
}

export const defiProtocolSentiment = {
  getOverview: () => request.get(`${baseUrl}/defi-protocol-sentiment/overview`),
  
  getProtocolSentiment: (protocol: string, chain?: string) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/protocol`, { 
      params: { protocol, chain } 
    }),
  
  getTrendingProtocols: (timeframe?: string) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/trending`, { 
      params: { timeframe } 
    }),
  
  compareProtocols: (protocols: string[]) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/compare`, { 
      params: { protocols: protocols.join(',') } 
    }),
  
  getSentimentHistory: (protocol: string, days?: number) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/history`, { 
      params: { protocol, days } 
    }),
  
  getSentimentAlerts: (protocol?: string) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/alerts`, { 
      params: { protocol } 
    }),
  
  getSocialStats: (protocol: string) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/social-stats`, { 
      params: { protocol } 
    }),
  
  getProtocolNews: (protocol: string) => 
    request.get(`${baseUrl}/defi-protocol-sentiment/news`, { 
      params: { protocol } 
    }),
};
