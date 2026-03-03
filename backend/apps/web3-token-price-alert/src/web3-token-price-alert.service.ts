import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface PriceAlert {
  id: string;
  token: string;
  chain: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice: number;
  notifyEmail: boolean;
  notifyWebhook: boolean;
  webhookUrl?: string;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface PriceAlertNotification {
  id: string;
  alertId: string;
  token: string;
  chain: string;
  targetPrice: number;
  triggeredPrice: number;
  condition: 'above' | 'below';
  triggeredAt: Date;
  notified: boolean;
}

export interface TokenPrice {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: Date;
}

// Supported tokens database
const SUPPORTED_TOKENS: Record<string, { name: string; symbol: string }> = {
  ETH: { name: 'Ethereum', symbol: 'ETH' },
  BTC: { name: 'Bitcoin', symbol: 'BTC' },
  SOL: { name: 'Solana', symbol: 'SOL' },
  BNB: { name: 'Binance Coin', symbol: 'BNB' },
  XRP: { name: 'Ripple', symbol: 'XRP' },
  ADA: { name: 'Cardano', symbol: 'ADA' },
  AVAX: { name: 'Avalanche', symbol: 'AVAX' },
  DOGE: { name: 'Dogecoin', symbol: 'DOGE' },
  DOT: { name: 'Polkadot', symbol: 'DOT' },
  MATIC: { name: 'Polygon', symbol: 'MATIC' },
  LINK: { name: 'Chainlink', symbol: 'LINK' },
  UNI: { name: 'Uniswap', symbol: 'UNI' },
  AAVE: { name: 'Aave', symbol: 'AAVE' },
  MKR: { name: 'Maker', symbol: 'MKR' },
  CRV: { name: 'Curve DAO', symbol: 'CRV' },
  LDO: { name: 'Lido DAO', symbol: 'LDO' },
  ARB: { name: 'Arbitrum', symbol: 'ARB' },
  OP: { name: 'Optimism', symbol: 'OP' },
  APT: { name: 'Aptos', symbol: 'APT' },
  SAND: { name: 'The Sandbox', symbol: 'SAND' },
};

// Simulated price data (in production, this would come from price APIs)
const generateMockPrice = (symbol: string): number => {
  const basePrices: Record<string, number> = {
    ETH: 3250.50,
    BTC: 67800.00,
    SOL: 145.20,
    BNB: 585.30,
    XRP: 0.62,
    ADA: 0.58,
    AVAX: 38.50,
    DOGE: 0.15,
    DOT: 7.85,
    MATIC: 0.92,
    LINK: 18.75,
    UNI: 12.40,
    AAVE: 95.80,
    MKR: 1850.00,
    CRV: 0.65,
    LDO: 2.85,
    ARB: 1.45,
    OP: 2.75,
    APT: 9.80,
    SAND: 0.52,
  };
  
  const base = basePrices[symbol] || 100;
  // Add some randomness to simulate price changes
  const variation = (Math.random() - 0.5) * 0.02 * base;
  return base + variation;
};

@Injectable()
export class Web3TokenPriceAlertService {
  private alerts: PriceAlert[] = [];
  private notifications: PriceAlertNotification[] = [];
  
  constructor() {
    this.initializeDefaultAlerts();
  }

  private initializeDefaultAlerts() {
    this.alerts = [
      {
        id: '1',
        token: 'ETH',
        chain: 'ethereum',
        targetPrice: 3500,
        condition: 'above',
        currentPrice: 3250.50,
        notifyEmail: true,
        notifyWebhook: false,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: '2',
        token: 'BTC',
        chain: 'ethereum',
        targetPrice: 70000,
        condition: 'above',
        currentPrice: 67800.00,
        notifyEmail: true,
        notifyWebhook: true,
        webhookUrl: 'https://example.com/webhook',
        isActive: true,
        createdAt: new Date(Date.now() - 172800000),
      },
      {
        id: '3',
        token: 'SOL',
        chain: 'solana',
        targetPrice: 150,
        condition: 'above',
        currentPrice: 145.20,
        notifyEmail: false,
        notifyWebhook: true,
        isActive: true,
        createdAt: new Date(Date.now() - 43200000),
      },
    ];
  }

  // Get all price alerts
  getAlerts(): PriceAlert[] {
    return this.alerts;
  }

  // Get alert by ID
  getAlertById(id: string): PriceAlert | undefined {
    return this.alerts.find(a => a.id === id);
  }

  // Create new price alert
  createAlert(alert: Omit<PriceAlert, 'id' | 'currentPrice' | 'triggeredAt' | 'createdAt'>): PriceAlert {
    const tokenInfo = SUPPORTED_TOKENS[alert.token.toUpperCase()];
    const currentPrice = generateMockPrice(alert.token.toUpperCase());
    
    const newAlert: PriceAlert = {
      ...alert,
      id: Date.now().toString(),
      currentPrice,
      createdAt: new Date(),
    };
    
    this.alerts.push(newAlert);
    return newAlert;
  }

  // Update price alert
  updateAlert(id: string, updates: Partial<PriceAlert>): PriceAlert | null {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    this.alerts[index] = { ...this.alerts[index], ...updates };
    return this.alerts[index];
  }

  // Delete price alert
  deleteAlert(id: string): boolean {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.alerts.splice(index, 1);
    return true;
  }

  // Toggle alert active status
  toggleAlert(id: string): PriceAlert | null {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return null;
    
    alert.isActive = !alert.isActive;
    return alert;
  }

  // Get current token price
  async getTokenPrice(token: string, chain: string = 'ethereum'): Promise<TokenPrice> {
    const upperToken = token.toUpperCase();
    const tokenInfo = SUPPORTED_TOKENS[upperToken];
    
    if (!tokenInfo) {
      throw new Error(`Token ${token} not supported`);
    }
    
    const price = generateMockPrice(upperToken);
    const change24h = (Math.random() - 0.5) * 10;
    const change7d = (Math.random() - 0.5) * 20;
    
    return {
      symbol: upperToken,
      name: tokenInfo.name,
      chain,
      price,
      change24h,
      change7d,
      marketCap: price * (Math.random() * 1000000000 + 100000000),
      volume24h: price * (Math.random() * 10000000 + 1000000),
      lastUpdated: new Date(),
    };
  }

  // Get multiple token prices
  async getMultipleTokenPrices(tokens: string[], chain: string = 'ethereum'): Promise<TokenPrice[]> {
    const prices: TokenPrice[] = [];
    
    for (const token of tokens) {
      try {
        const price = await this.getTokenPrice(token, chain);
        prices.push(price);
      } catch (error) {
        // Skip unsupported tokens
      }
    }
    
    return prices;
  }

  // Get supported tokens list
  getSupportedTokens(): Array<{ symbol: string; name: string }> {
    return Object.entries(SUPPORTED_TOKENS).map(([symbol, info]) => ({
      symbol,
      name: info.name,
    }));
  }

  // Get notifications
  getNotifications(alertId?: string): PriceAlertNotification[] {
    if (alertId) {
      return this.notifications.filter(n => n.alertId === alertId);
    }
    return this.notifications;
  }

  // Mark notification as sent
  markNotificationSent(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    
    notification.notified = true;
    return true;
  }

  // Check prices and trigger alerts
  async checkPrices(): Promise<PriceAlertNotification[]> {
    const triggeredAlerts: PriceAlertNotification[] = [];
    
    for (const alert of this.alerts) {
      if (!alert.isActive) continue;
      
      // Get current price
      const currentPrice = generateMockPrice(alert.token.toUpperCase());
      
      // Update alert with current price
      alert.currentPrice = currentPrice;
      
      // Check if alert should trigger
      let shouldTrigger = false;
      
      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }
      
      if (shouldTrigger && !alert.triggeredAt) {
        const notification: PriceAlertNotification = {
          id: Date.now().toString(),
          alertId: alert.id,
          token: alert.token,
          chain: alert.chain,
          targetPrice: alert.targetPrice,
          triggeredPrice: currentPrice,
          condition: alert.condition,
          triggeredAt: new Date(),
          notified: false,
        };
        
        this.notifications.unshift(notification);
        triggeredAlerts.push(notification);
        
        // Mark alert as triggered
        alert.triggeredAt = new Date();
        
        // Send notifications (in production, this would call email/webhook APIs)
        if (alert.notifyWebhook && alert.webhookUrl) {
          await this.sendWebhookNotification(notification, alert.webhookUrl);
        }
      }
    }
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    return triggeredAlerts;
  }

  // Send webhook notification
  private async sendWebhookNotification(notification: PriceAlertNotification, webhookUrl: string): Promise<void> {
    // In production, this would make an actual HTTP request
    console.log(`[Webhook] Sending price alert to ${webhookUrl}:`, notification);
  }

  // Reset triggered alert
  resetAlert(id: string): PriceAlert | null {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return null;
    
    alert.triggeredAt = undefined;
    return alert;
  }

  // Get price alert statistics
  getStats() {
    const totalAlerts = this.alerts.length;
    const activeAlerts = this.alerts.filter(a => a.isActive).length;
    const triggeredAlerts = this.alerts.filter(a => a.triggeredAt).length;
    const totalNotifications = this.notifications.length;
    const unreadNotifications = this.notifications.filter(n => !n.notified).length;
    
    // Calculate average price change
    const alertsWithPriceChange = this.alerts.filter(a => a.currentPrice > 0);
    const avgChange = alertsWithPriceChange.length > 0
      ? alertsWithPriceChange.reduce((sum, a) => {
          const change = a.condition === 'above' 
            ? (a.currentPrice - a.targetPrice) / a.targetPrice * 100
            : (a.targetPrice - a.currentPrice) / a.targetPrice * 100;
          return sum + change;
        }, 0) / alertsWithPriceChange.length
      : 0;
    
    return {
      totalAlerts,
      activeAlerts,
      triggeredAlerts,
      totalNotifications,
      unreadNotifications,
      avgChangeToTarget: avgChange.toFixed(2),
      supportedTokens: Object.keys(SUPPORTED_TOKENS).length,
    };
  }

  // Get price history for a token (simulated)
  getPriceHistory(token: string, days: number = 7): Array<{ timestamp: Date; price: number }> {
    const upperToken = token.toUpperCase();
    const basePrice = generateMockPrice(upperToken);
    const history: Array<{ timestamp: Date; price: number }> = [];
    
    for (let i = days; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 86400000);
      const variation = (Math.random() - 0.5) * 0.1 * basePrice;
      history.push({
        timestamp,
        price: basePrice + variation,
      });
    }
    
    return history;
  }
}
