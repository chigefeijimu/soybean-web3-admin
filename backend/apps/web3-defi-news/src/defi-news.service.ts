import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  protocol: string;
  category: 'announcement' | 'governance' | 'update' | 'security' | 'partnership' | 'market';
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface DefiNewsResponse {
  news: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class DefiNewsService {
  private readonly protocols = [
    { id: 'uniswap', name: 'Uniswap', category: 'DEX' },
    { id: 'aave', name: 'Aave', category: 'Lending' },
    { id: 'compound', name: 'Compound', category: 'Lending' },
    { id: 'curve', name: 'Curve', category: 'DEX' },
    { id: 'lido', name: 'Lido', category: 'Liquid Staking' },
    { id: 'yearn', name: 'Yearn', category: 'Yield' },
    { id: 'makerdao', name: 'MakerDAO', category: 'Lending' },
    { id: 'balancer', name: 'Balancer', category: 'DEX' },
    { id: 'sushiswap', name: 'SushiSwap', category: 'DEX' },
    { id: 'arbitrum', name: 'Arbitrum', category: 'L2' },
    { id: 'optimism', name: 'Optimism', category: 'L2' },
    { id: 'chainlink', name: 'Chainlink', category: 'Oracle' },
    { id: 'avalanche', name: 'Avalanche', category: 'L1' },
    { id: 'polygon', name: 'Polygon', category: 'L2' },
    { id: 'gnosis', name: 'Gnosis', category: 'DEX' },
  ];

  private generateMockNews(): NewsArticle[] {
    const categories: NewsArticle['category'][] = ['announcement', 'governance', 'update', 'security', 'partnership', 'market'];
    const sentiments: NewsArticle['sentiment'][] = ['positive', 'negative', 'neutral'];
    const titles = [
      'Protocol Announces New Tokenomics Upgrade',
      'Governance Proposal Passes with 95% Support',
      'Security Audit Completed by Top Firm',
      'Partnership with Major DeFi Protocol',
      'TVL Reaches All-Time High',
      'New Feature Launch: Cross-Chain Swaps',
      'Community Treasury Allocation Approved',
      'Yield Farming Pool Now Live',
      'Protocol Migration Completed Successfully',
      'Bug Bounty Program Launched',
      'Integration with LayerZero',
      'New Staking Rewards Announced',
      'Governance Vote: Parameter Changes',
      'Protocol Revenue Hits Record',
      'Mobile App Now Available',
    ];
    const summaries = [
      'The protocol has announced significant changes to its tokenomics model, aiming to improve long-term sustainability and incentivize holders.',
      'A major governance proposal has passed with overwhelming community support, paving the way for protocol upgrades.',
      'A comprehensive security audit has been completed with no critical issues found, ensuring protocol safety.',
      'Strategic partnership aims to enhance DeFi interoperability and provide better yields for users.',
      'Total Value Locked has reached a new all-time high, indicating growing user confidence.',
    ];

    const news: NewsArticle[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const protocol = this.protocols[Math.floor(Math.random() * this.protocols.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const summary = summaries[Math.floor(Math.random() * summaries.length)];
      
      const hoursAgo = Math.floor(Math.random() * 168); // Last week
      const publishedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      news.push({
        id: `news-${i + 1}`,
        title: `${protocol.name} ${title}`,
        summary,
        source: ['DeFi Pulse', 'The Block', 'CoinDesk', 'CryptoSlate', 'Decrypt'][Math.floor(Math.random() * 5)],
        url: `https://example.com/news/${protocol.id}-${i + 1}`,
        publishedAt: publishedAt.toISOString(),
        protocol: protocol.name,
        category,
        sentiment,
      });
    }

    return news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  private allNews: NewsArticle[] = this.generateMockNews();

  async getNews(options: {
    protocol?: string;
    category?: string;
    sentiment?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<DefiNewsResponse> {
    let filtered = [...this.allNews];

    if (options.protocol) {
      filtered = filtered.filter(n => 
        n.protocol.toLowerCase().includes(options.protocol!.toLowerCase())
      );
    }

    if (options.category) {
      filtered = filtered.filter(n => n.category === options.category);
    }

    if (options.sentiment) {
      filtered = filtered.filter(n => n.sentiment === options.sentiment);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) || 
        n.summary.toLowerCase().includes(searchLower) ||
        n.protocol.toLowerCase().includes(searchLower)
      );
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      news: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async getProtocols() {
    return this.protocols;
  }

  async getProtocolNews(protocolId: string): Promise<NewsArticle[]> {
    return this.allNews
      .filter(n => n.protocol.toLowerCase() === protocolId.toLowerCase())
      .slice(0, 20);
  }

  async getTrending(): Promise<{ protocol: string; newsCount: number }[]> {
    const counts: Record<string, number> = {};
    
    for (const news of this.allNews) {
      counts[news.protocol] = (counts[news.protocol] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([protocol, newsCount]) => ({ protocol, newsCount }))
      .sort((a, b) => b.newsCount - a.newsCount)
      .slice(0, 10);
  }

  async getCategories() {
    return [
      { id: 'announcement', name: 'Announcements', count: this.allNews.filter(n => n.category === 'announcement').length },
      { id: 'governance', name: 'Governance', count: this.allNews.filter(n => n.category === 'governance').length },
      { id: 'update', name: 'Protocol Updates', count: this.allNews.filter(n => n.category === 'update').length },
      { id: 'security', name: 'Security', count: this.allNews.filter(n => n.category === 'security').length },
      { id: 'partnership', name: 'Partnerships', count: this.allNews.filter(n => n.category === 'partnership').length },
      { id: 'market', name: 'Market News', count: this.allNews.filter(n => n.category === 'market').length },
    ];
  }
}
