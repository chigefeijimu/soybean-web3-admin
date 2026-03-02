import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

// 代币价格接口
export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d?: number;
  marketCap?: number;
  volume24h?: number;
  timestamp: number;
}

// 持仓接口
export interface TokenHolding {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  balanceUsd: number;
  price: number;
  change24h: number;
  chain: string;
}

// 提醒接口
export interface Alert {
  id: string;
  userId: string;
  type: 'price_above' | 'price_below' | 'holdings_change' | 'gas_low' | 'gas_high';
  token: string;
  chain: string;
  threshold: number;
  condition: string;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: number;
  createdAt: number;
  webhookUrl?: string;
}

// 提醒历史
export interface AlertHistory {
  id: string;
  alertId: string;
  alertType: string;
  token: string;
  chain: string;
  message: string;
  triggeredAt: number;
  price?: number;
  holdings?: string;
}

// 钱包持仓响应
export interface PortfolioResponse {
  address: string;
  chain: string;
  totalValueUsd: number;
  holdings: TokenHolding[];
  timestamp: number;
}

// 价格提醒响应
export interface PriceAlertResponse {
  symbol: string;
  chain: string;
  currentPrice: number;
  alerts: {
    above: number[];
    below: number[];
  };
}

// 热门代币响应
export interface TrendingToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  trend: 'up' | 'down' | 'stable';
}

// Gas价格响应
export interface GasPriceResponse {
  chain: string;
  slow: number;
  normal: number;
  fast: number;
  unit: string;
  timestamp: number;
}

@Injectable()
export class PortfolioAlertApiService {
  // 模拟价格数据 (实际应从CoinGecko等API获取)
  private mockPrices: Record<string, TokenPrice> = {
    ETH: { symbol: 'ETH', name: 'Ethereum', price: 1850.5, change24h: 2.3, change7d: 5.8, marketCap: 220e9, volume24h: 15e9, timestamp: Date.now() },
    BTC: { symbol: 'BTC', name: 'Bitcoin', price: 43500, change24h: 1.5, change7d: 4.2, marketCap: 850e9, volume24h: 28e9, timestamp: Date.now() },
    BNB: { symbol: 'BNB', name: 'BNB', price: 312.8, change24h: -0.5, change7d: 2.1, marketCap: 48e9, volume24h: 1.2e9, timestamp: Date.now() },
    SOL: { symbol: 'SOL', name: 'Solana', price: 98.5, change24h: 5.2, change7d: 12.3, marketCap: 42e9, volume24h: 3.5e9, timestamp: Date.now() },
    ARB: { symbol: 'ARB', name: 'Arbitrum', price: 1.15, change24h: 3.1, change7d: 8.5, marketCap: 1.2e9, volume24h: 450e6, timestamp: Date.now() },
    OP: { symbol: 'OP', name: 'Optimism', price: 2.35, change24h: 2.8, change7d: 6.2, marketCap: 2.1e9, volume24h: 320e6, timestamp: Date.now() },
    MATIC: { symbol: 'MATIC', name: 'Polygon', price: 0.78, change24h: -1.2, change7d: -3.5, marketCap: 7.2e9, volume24h: 580e6, timestamp: Date.now() },
    AVAX: { symbol: 'AVAX', name: 'Avalanche', price: 35.5, change24h: 1.8, change7d: 4.5, marketCap: 13e9, volume24h: 850e6, timestamp: Date.now() },
    LINK: { symbol: 'LINK', name: 'Chainlink', price: 14.2, change24h: 4.5, change7d: 9.8, marketCap: 8.2e9, volume24h: 620e6, timestamp: Date.now() },
    UNI: { symbol: 'UNI', name: 'Uniswap', price: 6.85, change24h: 2.1, change7d: 5.5, marketCap: 5.1e9, volume24h: 280e6, timestamp: Date.now() },
    AAVE: { symbol: 'AAVE', name: 'Aave', price: 95.5, change24h: 3.2, change7d: 7.8, marketCap: 1.4e9, volume24h: 180e6, timestamp: Date.now() },
    DAI: { symbol: 'DAI', name: 'Dai', price: 1.0, change24h: 0.01, change7d: -0.02, marketCap: 5.3e9, volume24h: 420e6, timestamp: Date.now() },
    USDC: { symbol: 'USDC', name: 'USD Coin', price: 1.0, change24h: 0.0, change7d: 0.0, marketCap: 42e9, volume24h: 35e9, timestamp: Date.now() },
    USDT: { symbol: 'USDT', name: 'Tether', price: 1.0, change24h: 0.0, change7d: 0.01, marketCap: 95e9, volume24h: 55e9, timestamp: Date.now() },
  };

  // 模拟Gas价格
  private gasPrices: Record<string, GasPriceResponse> = {
    eth: { chain: 'ETH', slow: 15, normal: 25, fast: 40, unit: 'Gwei', timestamp: Date.now() },
    arb: { chain: 'ARB', slow: 0.01, normal: 0.05, fast: 0.15, unit: 'Gwei', timestamp: Date.now() },
    opt: { chain: 'OPT', slow: 0.001, normal: 0.005, fast: 0.02, unit: 'Gwei', timestamp: Date.now() },
    pol: { chain: 'POL', slow: 30, normal: 50, fast: 80, unit: 'Gwei', timestamp: Date.now() },
    avax: { chain: 'AVAX', slow: 20, normal: 35, fast: 60, unit: 'Gwei', timestamp: Date.now() },
    bsc: { chain: 'BSC', slow: 3, normal: 5, fast: 8, unit: 'Gwei', timestamp: Date.now() },
    base: { chain: 'BASE', slow: 0.01, normal: 0.05, fast: 0.2, unit: 'Gwei', timestamp: Date.now() },
  };

  // 存储的提醒
  private alerts: Map<string, Alert> = new Map();
  private alertHistory: AlertHistory[] = [];

  constructor(private httpService: HttpService) {}

  // 获取代币价格
  async getTokenPrice(symbol: string, chain: string = 'eth'): Promise<TokenPrice | null> {
    const upperSymbol = symbol.toUpperCase();
    const price = this.mockPrices[upperSymbol];
    
    if (price) {
      return {
        ...price,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  // 批量获取代币价格
  async getBatchPrices(symbols: string[], chain: string = 'eth'): Promise<TokenPrice[]> {
    const prices: TokenPrice[] = [];
    for (const symbol of symbols) {
      const price = await this.getTokenPrice(symbol, chain);
      if (price) {
        prices.push(price);
      }
    }
    return prices;
  }

  // 获取钱包持仓
  async getWalletPortfolio(address: string, chain: string = 'eth'): Promise<PortfolioResponse> {
    // 模拟钱包持仓数据
    const holdings: TokenHolding[] = [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', balance: '2.5', balanceUsd: 4626.25, price: 1850.5, change24h: 2.3, chain },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', balance: '5000', balanceUsd: 5000, price: 1.0, change24h: 0, chain },
      { symbol: 'LINK', name: 'Chainlink', address: '0x514910771af9ca656af840dff83e8264ecf986ca', balance: '100', balanceUsd: 1420, price: 14.2, change24h: 4.5, chain },
    ];

    const totalValueUsd = holdings.reduce((sum, h) => sum + h.balanceUsd, 0);

    return {
      address,
      chain,
      totalValueUsd,
      holdings,
      timestamp: Date.now(),
    };
  }

  // 创建价格提醒
  async createPriceAlert(params: {
    userId: string;
    token: string;
    chain: string;
    condition: 'above' | 'below';
    threshold: number;
    webhookUrl?: string;
  }): Promise<Alert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alert: Alert = {
      id,
      userId: params.userId,
      type: params.condition === 'above' ? 'price_above' : 'price_below',
      token: params.token.toUpperCase(),
      chain: params.chain,
      threshold: params.threshold,
      condition: params.condition,
      enabled: true,
      triggered: false,
      createdAt: Date.now(),
      webhookUrl: params.webhookUrl,
    };

    this.alerts.set(id, alert);
    return alert;
  }

  // 创建持仓变化提醒
  async createHoldingAlert(params: {
    userId: string;
    token: string;
    chain: string;
    changePercent: number;
    webhookUrl?: string;
  }): Promise<Alert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alert: Alert = {
      id,
      userId: params.userId,
      type: 'holdings_change',
      token: params.token.toUpperCase(),
      chain: params.chain,
      threshold: params.changePercent,
      condition: `change > ${params.changePercent}%`,
      enabled: true,
      triggered: false,
      createdAt: Date.now(),
      webhookUrl: params.webhookUrl,
    };

    this.alerts.set(id, alert);
    return alert;
  }

  // 创建Gas价格提醒
  async createGasAlert(params: {
    userId: string;
    chain: string;
    condition: 'above' | 'below';
    threshold: number;
    webhookUrl?: string;
  }): Promise<Alert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alert: Alert = {
      id,
      userId: params.userId,
      type: params.condition === 'above' ? 'gas_high' : 'gas_low',
      token: 'GAS',
      chain: params.chain,
      threshold: params.threshold,
      condition: `gas ${params.condition} ${params.threshold} Gwei`,
      enabled: true,
      triggered: false,
      createdAt: Date.now(),
      webhookUrl: params.webhookUrl,
    };

    this.alerts.set(id, alert);
    return alert;
  }

  // 获取用户提醒列表
  async getUserAlerts(userId: string): Promise<Alert[]> {
    const userAlerts: Alert[] = [];
    this.alerts.forEach((alert) => {
      if (alert.userId === userId) {
        userAlerts.push(alert);
      }
    });
    return userAlerts;
  }

  // 删除提醒
  async deleteAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (alert && alert.userId === userId) {
      this.alerts.delete(alertId);
      return true;
    }
    return false;
  }

  // 启用/禁用提醒
  async toggleAlert(alertId: string, userId: string, enabled: boolean): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (alert && alert.userId === userId) {
      alert.enabled = enabled;
      this.alerts.set(alertId, alert);
      return alert;
    }
    return null;
  }

  // 获取代币价格提醒
  async getPriceAlerts(symbol: string, chain: string): Promise<PriceAlertResponse> {
    const price = await this.getTokenPrice(symbol, chain);
    const currentPrice = price?.price || 0;

    const tokenAlerts: Alert[] = [];
    this.alerts.forEach((alert) => {
      if (alert.token === symbol.toUpperCase() && alert.chain === chain) {
        tokenAlerts.push(alert);
      }
    });

    const above = tokenAlerts
      .filter(a => a.type === 'price_above' && a.enabled && !a.triggered)
      .map(a => a.threshold);
    
    const below = tokenAlerts
      .filter(a => a.type === 'price_below' && a.enabled && !a.triggered)
      .map(a => a.threshold);

    return {
      symbol: symbol.toUpperCase(),
      chain,
      currentPrice,
      alerts: { above, below },
    };
  }

  // 获取热门代币
  async getTrendingTokens(limit: number = 10): Promise<TrendingToken[]> {
    const tokens = Object.values(this.mockPrices)
      .map(p => ({
        symbol: p.symbol,
        name: p.name,
        price: p.price,
        change24h: p.change24h,
        volume24h: p.volume24h || 0,
        trend: p.change24h > 2 ? 'up' : p.change24h < -2 ? 'down' : 'stable' as const,
      }))
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, limit);

    return tokens;
  }

  // 获取Gas价格
  async getGasPrice(chain: string): Promise<GasPriceResponse | null> {
    const gasPrice = this.gasPrices[chain.toLowerCase()];
    if (gasPrice) {
      return {
        ...gasPrice,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  // 批量获取Gas价格
  async getBatchGasPrices(chains: string[]): Promise<GasPriceResponse[]> {
    const prices: GasPriceResponse[] = [];
    for (const chain of chains) {
      const price = await this.getGasPrice(chain);
      if (price) {
        prices.push(price);
      }
    }
    return prices;
  }

  // 获取提醒历史
  async getAlertHistory(userId: string, limit: number = 50): Promise<AlertHistory[]> {
    return this.alertHistory
      .filter(h => {
        const alert = this.alerts.get(h.alertId);
        return alert?.userId === userId;
      })
      .slice(-limit)
      .reverse();
  }

  // 检查并触发提醒
  async checkAlerts(): Promise<AlertHistory[]> {
    const triggeredAlerts: AlertHistory[] = [];

    this.alerts.forEach(async (alert) => {
      if (!alert.enabled || alert.triggered) return;

      let shouldTrigger = false;
      let message = '';

      if (alert.type === 'price_above' || alert.type === 'price_below') {
        const price = await this.getTokenPrice(alert.token, alert.chain);
        if (price) {
          if (alert.type === 'price_above' && price.price >= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.token} price ($${price.price}) is above $${alert.threshold}`;
          } else if (alert.type === 'price_below' && price.price <= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.token} price ($${price.price}) is below $${alert.threshold}`;
          }
        }
      } else if (alert.type === 'gas_high' || alert.type === 'gas_low') {
        const gas = await this.getGasPrice(alert.chain);
        if (gas) {
          if (alert.type === 'gas_high' && gas.fast >= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.chain} gas price (${gas.fast} Gwei) is high`;
          } else if (alert.type === 'gas_low' && gas.slow <= alert.threshold) {
            shouldTrigger = true;
            message = `${alert.chain} gas price (${gas.slow} Gwei) is low`;
          }
        }
      }

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = Date.now();
        
        const history: AlertHistory = {
          id: `history_${Date.now()}`,
          alertId: alert.id,
          alertType: alert.type,
          token: alert.token,
          chain: alert.chain,
          message,
          triggeredAt: Date.now(),
        };
        
        this.alertHistory.push(history);
        triggeredAlerts.push(history);

        // 发送Webhook通知
        if (alert.webhookUrl) {
          this.sendWebhook(alert.webhookUrl, history);
        }
      }
    });

    return triggeredAlerts;
  }

  // 发送Webhook通知
  private async sendWebhook(url: string, data: AlertHistory) {
    try {
      // 这里可以集成实际的HTTP请求来发送webhook
      console.log(`[Webhook] Sending to ${url}:`, data);
    } catch (error) {
      console.error('[Webhook] Failed to send:', error);
    }
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  // API信息
  async getApiInfo() {
    return {
      name: 'Web3 Portfolio Alert API',
      version: '1.0.0',
      description: 'REST API for Web3 portfolio alerts and price monitoring',
      endpoints: {
        'GET /api/price/:symbol': 'Get token price',
        'GET /api/prices': 'Batch get token prices',
        'GET /api/portfolio/:address': 'Get wallet portfolio',
        'POST /api/alerts/price': 'Create price alert',
        'POST /api/alerts/holding': 'Create holding alert',
        'POST /api/alerts/gas': 'Create gas alert',
        'GET /api/alerts': 'Get user alerts',
        'DELETE /api/alerts/:id': 'Delete alert',
        'GET /api/gas/:chain': 'Get gas price',
        'GET /api/trending': 'Get trending tokens',
        'GET /api/health': 'Health check',
      },
    };
  }
}
