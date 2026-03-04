import { Injectable } from '@nestjs/common';

interface SentimentData {
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

interface SocialStats {
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

@Injectable()
export class DefiProtocolSentimentService {
  private readonly protocols = [
    'uniswap', 'aave', 'compound', 'curve', 'lido', 'yearn',
    'makerdao', 'balancer', 'sushiswap', 'gmx', 'dydx', 'rocket-pool',
    'morpho', 'gearbox', 'pendle', 'convex', 'stargate', 'across',
    'optimism', 'arbitrum', 'polygon', 'base', 'avalanche', 'solana',
  ];

  private readonly chains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'solana'
  ];

  private generateSentimentScore(): number {
    return Math.floor(Math.random() * 40) + 30; // 30-70
  }

  private generateSentimentDistribution() {
    const positive = Math.floor(Math.random() * 50) + 30;
    const negative = Math.floor(Math.random() * 20) + 5;
    return {
      positive,
      negative,
      neutral: 100 - positive - negative,
    };
  }

  private getRandomKeywords(): string[] {
    const allKeywords = [
      'yield farming', 'staking', 'governance', 'upgrade', 'partnership',
      'audit', 'TVL', '激励机制', 'DAO', 'airdrop', 'migration',
      'v3', 'protocol', 'defi', 'layer2', 'bridging', ' liquidity',
    ];
    const count = Math.floor(Math.random() * 5) + 3;
    const shuffled = allKeywords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getTrend(): 'bullish' | 'bearish' | 'neutral' {
    const rand = Math.random();
    if (rand < 0.3) return 'bullish';
    if (rand < 0.5) return 'bearish';
    return 'neutral';
  }

  getOverview() {
    const totalProtocols = this.protocols.length;
    const avgSentiment = Math.floor(this.protocols.reduce((sum, p) => 
      sum + this.generateSentimentScore(), 0) / totalProtocols);
    
    const bullishCount = Math.floor(Math.random() * 10) + 5;
    const bearishCount = Math.floor(Math.random() * 5) + 2;
    
    return {
      totalProtocols,
      avgSentiment,
      bullishCount,
      bearishCount,
      neutralCount: totalProtocols - bullishCount - bearishCount,
      mostBullish: this.protocols.slice(0, 5),
      mostBearish: this.protocols.slice(-3),
      lastUpdated: new Date().toISOString(),
    };
  }

  getProtocolSentiment(protocol: string, chain?: string): SentimentData {
    const normalizedProtocol = protocol.toLowerCase();
    const selectedChain = chain?.toLowerCase() || 'ethereum';
    
    const twitter = this.generateSentimentScore();
    const discord = this.generateSentimentScore();
    const reddit = this.generateSentimentScore();
    const github = this.generateSentimentScore();
    const news = this.generateSentimentScore();
    
    const overall = Math.floor((twitter + discord + reddit + github + news) / 5);
    
    return {
      protocol: normalizedProtocol,
      chain: selectedChain,
      overall,
      twitter,
      discord,
      reddit,
      github,
      news,
      trend: this.getTrend(),
      mentionCount: Math.floor(Math.random() * 10000) + 500,
      engagementRate: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      sentimentDistribution: this.generateSentimentDistribution(),
      topKeywords: this.getRandomKeywords(),
      recentSentiment: [
        {
          source: 'twitter',
          sentiment: twitter,
          date: new Date().toISOString(),
          highlights: `Trending discussion about ${normalizedProtocol}`,
        },
        {
          source: 'discord',
          sentiment: discord,
          date: new Date().toISOString(),
          highlights: 'Active community engagement',
        },
        {
          source: 'reddit',
          sentiment: reddit,
          date: new Date().toISOString(),
          highlights: 'Recent subreddit posts analysis',
        },
      ],
    };
  }

  getTrendingProtocols(timeframe?: string) {
    const timeRange = timeframe || '24h';
    const trending = this.protocols.slice(0, 15).map((protocol, index) => ({
      protocol,
      sentiment: this.generateSentimentScore(),
      mentions: Math.floor(Math.random() * 5000) + 100,
      trend: index < 5 ? 'up' : index < 10 ? 'stable' : 'down',
      change: parseFloat((Math.random() * 20 - 10).toFixed(2)),
    }));
    
    return {
      timeframe: timeRange,
      trending: trending.sort((a, b) => b.mentions - a.mentions),
      lastUpdated: new Date().toISOString(),
    };
  }

  compareProtocols(protocols: string[]): Record<string, SentimentData> {
    const result: Record<string, SentimentData> = {};
    
    for (const protocol of protocols) {
      result[protocol] = this.getProtocolSentiment(protocol);
    }
    
    return result;
  }

  getSentimentHistory(protocol: string, days: number) {
    const history = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      history.push({
        date: date.toISOString().split('T')[0],
        sentiment: this.generateSentimentScore(),
        mentions: Math.floor(Math.random() * 2000) + 100,
        positive: Math.floor(Math.random() * 50) + 30,
        negative: Math.floor(Math.random() * 20) + 5,
        neutral: Math.floor(Math.random() * 30) + 20,
      });
    }
    
    return {
      protocol: protocol.toLowerCase(),
      days,
      history,
      averageSentiment: Math.floor(history.reduce((sum, h) => sum + h.sentiment, 0) / history.length),
      sentimentTrend: this.getTrend(),
    };
  }

  getSentimentAlerts(protocol?: string) {
    const alerts = [];
    const targetProtocols = protocol ? [protocol] : this.protocols.slice(0, 10);
    
    for (const p of targetProtocols) {
      const sentiment = this.generateSentimentScore();
      
      if (sentiment < 35) {
        alerts.push({
          protocol: p,
          type: 'negative_sentiment',
          severity: sentiment < 25 ? 'critical' : 'warning',
          message: `${p} sentiment has dropped significantly`,
          currentSentiment: sentiment,
          threshold: 30,
          timestamp: new Date().toISOString(),
        });
      } else if (sentiment > 65) {
        alerts.push({
          protocol: p,
          type: 'positive_sentiment',
          severity: 'info',
          message: `${p} is trending positively`,
          currentSentiment: sentiment,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    return {
      alerts,
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
    };
  }

  getSocialStats(protocol: string): SocialStats {
    const normalizedProtocol = protocol.toLowerCase();
    
    return {
      protocol: normalizedProtocol,
      twitter: {
        followers: Math.floor(Math.random() * 500000) + 10000,
        engagement: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        trending: Math.random() > 0.7,
      },
      discord: {
        members: Math.floor(Math.random() * 200000) + 5000,
        online: Math.floor(Math.random() * 50000) + 1000,
        growth: parseFloat((Math.random() * 10 - 2).toFixed(2)),
      },
      reddit: {
        subscribers: Math.floor(Math.random() * 300000) + 5000,
        activeUsers: Math.floor(Math.random() * 10000) + 500,
        postsPerDay: Math.floor(Math.random() * 50) + 5,
      },
      github: {
        stars: Math.floor(Math.random() * 10000) + 500,
        forks: Math.floor(Math.random() * 2000) + 100,
        contributors: Math.floor(Math.random() * 200) + 20,
        recentCommits: Math.floor(Math.random() * 100) + 10,
      },
    };
  }

  getProtocolNews(protocol: string) {
    const normalizedProtocol = protocol.toLowerCase();
    const newsItems = [];
    
    const newsTypes = [
      { type: 'partnership', title: `${normalizedProtocol} announces new partnership` },
      { type: 'upgrade', title: `${normalizedProtocol} protocol upgrade incoming` },
      { type: 'audit', title: `${normalizedProtocol} completes audit` },
      { type: 'launch', title: `${normalizedProtocol} launches new feature` },
      { type: 'grant', title: `${normalizedProtocol} receives ecosystem grant` },
    ];
    
    for (let i = 0; i < 10; i++) {
      const newsType = newsTypes[Math.floor(Math.random() * newsTypes.length)];
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 72));
      
      newsItems.push({
        id: `news-${i}`,
        protocol: normalizedProtocol,
        type: newsType.type,
        title: newsType.title,
        sentiment: this.generateSentimentScore(),
        source: ['twitter', 'reddit', 'news'][Math.floor(Math.random() * 3)],
        date: date.toISOString(),
        url: `https://example.com/news/${i}`,
      });
    }
    
    return {
      protocol: normalizedProtocol,
      news: newsItems.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()),
      total: newsItems.length,
    };
  }
}
