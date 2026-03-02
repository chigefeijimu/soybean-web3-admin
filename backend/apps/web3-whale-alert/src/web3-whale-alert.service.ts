import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface WhaleAlert {
  id: string;
  address: string;
  label: string;
  chain: string;
  threshold: number;
  alertType: 'above' | 'below' | 'any';
  notifyEmail: boolean;
  notifyTelegram: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  chain: string;
  timestamp: Date;
  valueUSD: number;
}

export interface WhaleAlertNotification {
  id: string;
  alertId: string;
  address: string;
  transaction: WhaleTransaction;
  triggeredAt: Date;
  notified: boolean;
}

@Injectable()
export class Web3WhaleAlertService {
  private alerts: WhaleAlert[] = [];
  private notifications: WhaleAlertNotification[] = [];
  
  // Known whale addresses database
  private knownWhales = new Map<string, { label: string; category: string }>([
    ['0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', { label: 'Vitalik Buterin', category: 'founder' }],
    ['0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', { label: 'Gavin Wood', category: 'founder' }],
    ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', { label: 'Vitalik (CB)', category: 'founder' }],
    ['0x8ba1f109551bD432803012645Ac136ddd64DBA72', { label: 'Coinbase Cold', category: 'cex' }],
    ['0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', { label: 'Binance Cold', category: 'cex' }],
    ['0x28C6c06298d514Db089934071355E5743bf21d60', { label: 'Binance Hot', category: 'cex' }],
    ['0x5a52E96BAcdaBb82fd95763E52aC3fc9BfaaB6c4', { label: 'Kraken', category: 'cex' }],
    ['0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', { label: 'Binance Cold 2', category: 'cex' }],
    ['0x0A5046079187B1A06bDCFe4C3e9E2E4E2a7f69b9', { label: 'Wintermute', category: 'market-maker' }],
    ['0xfCb359AcC31C7f6C4Cf3C67E5aE82C8f9cD7F1d1', label: 'Wintermute 2', category: 'market-maker' }],
  ]);

  constructor() {
    // Initialize with some default whale alerts
    this.initializeDefaultAlerts();
  }

  private initializeDefaultAlerts() {
    this.alerts = [
      {
        id: '1',
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        label: 'Vitalik Buterin',
        chain: 'ethereum',
        threshold: 10,
        alertType: 'any',
        notifyEmail: true,
        notifyTelegram: false,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        label: 'Coinbase Cold Wallet',
        chain: 'ethereum',
        threshold: 100,
        alertType: 'above',
        notifyEmail: true,
        notifyTelegram: true,
        isActive: true,
        createdAt: new Date(),
      },
    ];
  }

  // Get all whale alerts
  getAlerts(): WhaleAlert[] {
    return this.alerts;
  }

  // Get alert by ID
  getAlertById(id: string): WhaleAlert | undefined {
    return this.alerts.find(a => a.id === id);
  }

  // Create new whale alert
  createAlert(alert: Omit<WhaleAlert, 'id' | 'createdAt'>): WhaleAlert {
    const newAlert: WhaleAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    this.alerts.push(newAlert);
    return newAlert;
  }

  // Update whale alert
  updateAlert(id: string, updates: Partial<WhaleAlert>): WhaleAlert | null {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    this.alerts[index] = { ...this.alerts[index], ...updates };
    return this.alerts[index];
  }

  // Delete whale alert
  deleteAlert(id: string): boolean {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.alerts.splice(index, 1);
    return true;
  }

  // Get known whales list
  getKnownWhales(): Array<{ address: string; label: string; category: string }> {
    return Array.from(this.knownWhales.entries()).map(([address, data]) => ({
      address,
      ...data,
    }));
  }

  // Add custom whale address
  addCustomWhale(address: string, label: string, category: string = 'custom'): void {
    this.knownWhales.set(address.toLowerCase(), { label, category });
  }

  // Get whale transactions (simulated)
  async getWhaleTransactions(
    chain: string = 'ethereum',
    minValueUSD: number = 10000,
    limit: number = 50
  ): Promise<WhaleTransaction[]> {
    // In production, this would call blockchain APIs
    // Simulating transactions whale
    const transactions: WhaleTransaction[] = [
      {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        to: '0x1234567890abcdef1234567890abcdef1234567890a',
        amount: 100,
        token: 'ETH',
        chain: 'ethereum',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        valueUSD: 250000,
      },
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        from: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        to: '0x9876543210fedcba9876543210fedcba9876543210',
        amount: 500,
        token: 'ETH',
        chain: 'ethereum',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        valueUSD: 1250000,
      },
      {
        hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        from: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        to: '0x111222333444555666777888999aaabbbcccddd',
        amount: 250,
        token: 'ETH',
        chain: 'ethereum',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        valueUSD: 625000,
      },
      {
        hash: '0xaaa111222333444555666777888999000111222333444555666777888999000',
        from: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
        to: '0xbbb111222333444555666777888999000111222333',
        amount: 10000,
        token: 'USDC',
        chain: 'ethereum',
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
        valueUSD: 10000,
      },
      {
        hash: '0xccc111222333444555666777888999000111222333444555666777888999111',
        from: '0x28C6c06298d514Db089934071355E5743bf21d60',
        to: '0xddd111222333444555666777888999000111222333',
        amount: 1500,
        token: 'ETH',
        chain: 'ethereum',
        timestamp: new Date(Date.now() - 1000 * 60 * 240),
        valueUSD: 3750000,
      },
    ];

    return transactions.filter(t => t.valueUSD >= minValueUSD).slice(0, limit);
  }

  // Get notifications
  getNotifications(alertId?: string): WhaleAlertNotification[] {
    if (alertId) {
      return this.notifications.filter(n => n.alertId === alertId);
    }
    return this.notifications;
  }

  // Check for whale movements and trigger alerts
  async checkWhaleMovements(): Promise<WhaleAlertNotification[]> {
    const triggeredAlerts: WhaleAlertNotification[] = [];
    
    // Get recent transactions
    const transactions = await this.getWhaleTransactions('ethereum', 10000);
    
    for (const alert of this.alerts) {
      if (!alert.isActive) continue;
      
      const matchingTx = transactions.find(tx => 
        tx.from.toLowerCase() === alert.address.toLowerCase() ||
        tx.to.toLowerCase() === alert.address.toLowerCase()
      );
      
      if (!matchingTx) continue;
      
      // Check if alert should trigger
      const shouldTrigger = 
        alert.alertType === 'any' ||
        (alert.alertType === 'above' && matchingTx.valueUSD >= alert.threshold * 1000) ||
        (alert.alertType === 'below' && matchingTx.valueUSD < alert.threshold * 1000);
      
      if (shouldTrigger) {
        const notification: WhaleAlertNotification = {
          id: Date.now().toString(),
          alertId: alert.id,
          address: alert.address,
          transaction: matchingTx,
          triggeredAt: new Date(),
          notified: false,
        };
        
        this.notifications.unshift(notification);
        triggeredAlerts.push(notification);
      }
    }
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    return triggeredAlerts;
  }

  // Mark notification as sent
  markNotificationSent(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    
    notification.notified = true;
    return true;
  }

  // Get whale statistics
  getWhaleStats() {
    const totalAlerts = this.alerts.length;
    const activeAlerts = this.alerts.filter(a => a.isActive).length;
    const totalNotifications = this.notifications.length;
    const unreadNotifications = this.notifications.filter(n => !n.notified).length;
    
    return {
      totalAlerts,
      activeAlerts,
      totalNotifications,
      unreadNotifications,
      knownWhalesCount: this.knownWhales.size,
    };
  }
}
