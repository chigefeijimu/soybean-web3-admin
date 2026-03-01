import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface PriceAlert {
  id: string;
  token: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  userId?: string;
  createdAt: Date;
  triggered: boolean;
  triggeredAt?: Date;
}

@Injectable()
export class Web3PriceAlertService {
  private alerts: Map<string, PriceAlert> = new Map();
  private idCounter = 1;

  // 模拟价格数据（实际应对接CoinGecko等API）
  private mockPrices: Record<string, number> = {
    ETH: 2850,
    BTC: 67500,
    BNB: 580,
    MATIC: 0.85,
    SOL: 145,
    AVAX: 35,
    LINK: 14.5,
    DOT: 7.2,
  };

  constructor(private readonly httpService: HttpService) {}

  async createAlert(createAlertDto: {
    token: string;
    symbol: string;
    targetPrice: number;
    condition: 'above' | 'below';
    userId?: string;
  }): Promise<PriceAlert> {
    const id = String(this.idCounter++);
    const alert: PriceAlert = {
      id,
      ...createAlertDto,
      createdAt: new Date(),
      triggered: false,
    };
    this.alerts.set(id, alert);
    
    // 立即检查是否已触发
    await this.checkAndTriggerAlert(id);
    
    return alert;
  }

  async getAlerts(userId?: string): Promise<PriceAlert[]> {
    const allAlerts = Array.from(this.alerts.values());
    if (userId) {
      return allAlerts.filter(a => a.userId === userId);
    }
    return allAlerts;
  }

  async deleteAlert(id: string): Promise<{ success: boolean }> {
    const deleted = this.alerts.delete(id);
    return { success: deleted };
  }

  async checkPriceAlerts(token: string): Promise<{
    currentPrice: number;
    triggeredAlerts: PriceAlert[];
  }> {
    const currentPrice = await this.getTokenPrice(token);
    const tokenAlerts = Array.from(this.alerts.values())
      .filter(a => a.token.toUpperCase() === token.toUpperCase() && !a.triggered);
    
    const triggered: PriceAlert[] = [];
    
    for (const alert of tokenAlerts) {
      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice);
      
      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = new Date();
        triggered.push(alert);
      }
    }
    
    return { currentPrice, triggeredAlerts: triggered };
  }

  async checkAndTriggerAlert(id: string): Promise<PriceAlert | null> {
    const alert = this.alerts.get(id);
    if (!alert || alert.triggered) return null;
    
    const currentPrice = await this.getTokenPrice(alert.token);
    const shouldTrigger = 
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);
    
    if (shouldTrigger) {
      alert.triggered = true;
      alert.triggeredAt = new Date();
      return alert;
    }
    
    return null;
  }

  private async getTokenPrice(token: string): Promise<number> {
    // 优先使用mock价格，实际应对接CoinGecko API
    const upperToken = token.toUpperCase();
    
    if (this.mockPrices[upperToken]) {
      // 添加小幅随机波动模拟实时价格
      const fluctuation = (Math.random() - 0.5) * 0.02;
      return this.mockPrices[upperToken] * (1 + fluctuation);
    }
    
    // 尝试从CoinGecko获取真实价格
    try {
      const tokenId = this.getCoinGeckoId(token);
      const response = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/simple/price`, {
          params: {
            ids: tokenId,
            vs_currencies: 'usd',
          },
        }),
      );
      
      if (response.data && response.data[tokenId]) {
        return response.data[tokenId].usd;
      }
    } catch (error) {
      console.error('Failed to fetch price from CoinGecko:', error);
    }
    
    // 返回默认值
    return 0;
  }

  private getCoinGeckoId(token: string): string {
    const mapping: Record<string, string> = {
      ETH: 'ethereum',
      BTC: 'bitcoin',
      BNB: 'binancecoin',
      MATIC: 'matic-network',
      SOL: 'solana',
      AVAX: 'avalanche-2',
      LINK: 'chainlink',
      DOT: 'polkadot',
    };
    return mapping[token.toUpperCase()] || token.toLowerCase();
  }
}
