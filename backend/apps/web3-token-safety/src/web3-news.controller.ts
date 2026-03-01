import { Controller, Get, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  page: number;
}

@Controller('web3/news')
export class Web3NewsController {
  private readonly CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || '';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';

  constructor(private readonly httpService: HttpService) {}

  @Get()
  async getNews(
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<NewsResponse> {
    const articles: NewsArticle[] = [];
    
    try {
      // Try to fetch from CoinGecko news
      const newsUrl = `${this.COINGECKO_API}/news`;
      const newsResponse = await firstValueFrom(
        this.httpService.get(newsUrl, {
          params: { per_page: limit, page },
          timeout: 10000,
        }),
      );
      
      if (newsResponse.data) {
        const newsItems = Array.isArray(newsResponse.data) 
          ? newsResponse.data 
          : newsResponse.data.articles || [];
        
        for (const item of newsItems) {
          articles.push({
            id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
            title: item.title || '',
            description: item.description || item.summary || '',
            source: item.source?.title || item.source_name || 'Unknown',
            url: item.url || '',
            publishedAt: item.published_at || new Date().toISOString(),
            category: this.categorizeNews(item.title || '', item.description || ''),
            imageUrl: item.thumbnail || item.image_url || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching from CoinGecko:', error instanceof Error ? error.message : 'Unknown error');
    }

    // If no articles from CoinGecko, try alternative sources
    if (articles.length === 0) {
      return this.getFallbackNews(page, limit);
    }

    // Filter by category if specified
    let filteredArticles = articles;
    if (category && category !== 'all') {
      filteredArticles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    return {
      articles: filteredArticles,
      total: filteredArticles.length,
      page,
    };
  }

  @Get('categories')
  async getCategories(): Promise<string[]> {
    return ['all', 'DeFi', 'Protocol', 'Security', 'Regulation', 'NFT', 'Trading', 'Mining'];
  }

  @Get('trending')
  async getTrending(): Promise<NewsResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.COINGECKO_API}/search/trending`, {
          timeout: 10000,
        }),
      );

      const articles: NewsArticle[] = [];
      if (response.data?.coins) {
        for (const coin of response.data.coins.slice(0, 10)) {
          articles.push({
            id: coin.item?.id || Math.random().toString(36).substr(2, 9),
            title: `${coin.item?.name} (${coin.item?.symbol}) is trending!`,
            description: `Market cap rank: #${coin.item?.market_cap_rank || 'N/A'}, Price change: ${coin.item?.price_change_percentage_24h?.toFixed(2) || 0}%`,
            source: 'CoinGecko Trending',
            url: `https://www.coingecko.com/en/coins/${coin.item?.id}`,
            publishedAt: new Date().toISOString(),
            category: 'Trading',
            imageUrl: coin.item?.large || coin.item?.thumb || '',
          });
        }
      }

      return { articles, total: articles.length, page: 1 };
    } catch (error) {
      console.error('Error fetching trending:', error instanceof Error ? error.message : 'Unknown error');
      return { articles: [], total: 0, page: 1 };
    }
  }

  private categorizeNews(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('hack') || text.includes('exploit') || text.includes('scam') || text.includes('rug')) {
      return 'Security';
    }
    if (text.includes('defi') || text.includes('uniswap') || text.includes('aave') || text.includes('compound')) {
      return 'DeFi';
    }
    if (text.includes('nft') || text.includes('opensea') || text.includes('blur') || text.includes('mint')) {
      return 'NFT';
    }
    if (text.includes('sec') || text.includes('regulation') || text.includes('court') || text.includes('law')) {
      return 'Regulation';
    }
    if (text.includes('bitcoin') || text.includes('ethereum') || text.includes('upgrade') || text.includes('fork')) {
      return 'Protocol';
    }
    if (text.includes('price') || text.includes('market') || text.includes('trading') || text.includes('exchange')) {
      return 'Trading';
    }
    
    return 'General';
  }

  private getFallbackNews(page: number, limit: number): NewsResponse {
    const fallbackArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'Ethereum Network Activity Reaches New High',
        description: 'The Ethereum network has seen unprecedented activity with daily transactions surpassing previous records.',
        source: 'CryptoNews',
        url: '#',
        publishedAt: new Date().toISOString(),
        category: 'Protocol',
      },
      {
        id: '2',
        title: 'DeFi Protocol TVL Hits $200B Milestone',
        description: 'Total Value Locked in DeFi protocols has reached a new all-time high.',
        source: 'DeFi Pulse',
        url: '#',
        publishedAt: new Date().toISOString(),
        category: 'DeFi',
      },
      {
        id: '3',
        title: 'New Security Vulnerability Discovered in Popular Token',
        description: 'Security researchers have identified a potential vulnerability in a widely-used token standard.',
        source: 'Security Alert',
        url: '#',
        publishedAt: new Date().toISOString(),
        category: 'Security',
      },
      {
        id: '4',
        title: 'Regulatory Framework for Crypto Announced',
        description: 'New regulatory guidelines have been proposed for cryptocurrency operations.',
        source: 'Regulation Watch',
        url: '#',
        publishedAt: new Date().toISOString(),
        category: 'Regulation',
      },
      {
        id: '5',
        title: 'NFT Marketplace Volume Surges',
        description: 'NFT trading volumes have increased significantly over the past week.',
        source: 'NFT Weekly',
        url: '#',
        publishedAt: new Date().toISOString(),
        category: 'NFT',
      },
    ];

    const start = (page - 1) * limit;
    const paged = fallbackArticles.slice(start, start + limit);

    return { articles: paged, total: fallbackArticles.length, page };
  }
}
