import { Injectable } from '@nestjs/common';

export interface BackupData {
  version: string;
  timestamp: number;
  type: 'full' | 'partial';
  data: {
    wallets?: WalletBackup[];
    watchlists?: WatchlistBackup[];
    alerts?: AlertBackup[];
    strategies?: StrategyBackup[];
    settings?: SettingsBackup;
  };
}

export interface WalletBackup {
  address: string;
  chain: string;
  name?: string;
  tags?: string[];
  addedAt: number;
}

export interface WatchlistBackup {
  id: string;
  name: string;
  tokens: { address: string; chain: string }[];
  createdAt: number;
}

export interface AlertBackup {
  id: string;
  type: 'price' | 'gas' | 'volume' | 'custom';
  condition: {
    token?: string;
    chain?: string;
    direction?: 'above' | 'below';
    value?: number;
  };
  enabled: boolean;
  createdAt: number;
}

export interface StrategyBackup {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  createdAt: number;
}

export interface SettingsBackup {
  theme?: 'light' | 'dark' | 'auto';
  currency?: string;
  notifications?: {
    email?: boolean;
    telegram?: boolean;
    webhook?: boolean;
  };
}

export interface ExportRequest {
  type: 'full' | 'wallets' | 'watchlists' | 'alerts' | 'strategies';
  wallets?: string[];
  watchlistIds?: string[];
  alertIds?: string[];
  strategyIds?: string[];
}

export interface ImportRequest {
  data: BackupData;
  merge?: boolean;
  replace?: boolean;
}

@Injectable()
export class PortfolioBackupService {
  private backups: Map<string, BackupData> = new Map();

  // Generate sample backup data
  generateSampleBackup(type: ExportRequest['type'] = 'full'): BackupData {
    const now = Date.now();
    
    const sampleData: BackupData = {
      version: '1.0.0',
      timestamp: now,
      type: type === 'full' ? 'full' : 'partial',
      data: {},
    };

    if (type === 'full' || type === 'wallets') {
      sampleData.data.wallets = [
        {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
          chain: 'ethereum',
          name: 'Main Wallet',
          tags: ['primary', 'hot'],
          addedAt: now - 86400000 * 30,
        },
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          chain: 'polygon',
          name: 'DeFi Portfolio',
          tags: ['defi'],
          addedAt: now - 86400000 * 15,
        },
      ];
    }

    if (type === 'full' || type === 'watchlists') {
      sampleData.data.watchlists = [
        {
          id: 'wl-1',
          name: 'DeFi Tokens',
          tokens: [
            { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'ethereum' },
            { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chain: 'ethereum' },
          ],
          createdAt: now - 86400000 * 10,
        },
        {
          id: 'wl-2',
          name: 'Layer 2',
          tokens: [
            { address: '0x50BCE64397C75488425053E1449d565d00d2d0A1', chain: 'polygon' },
            { address: '0x3c499c542cEFb5E97413187d6490eb5b15A36117', chain: 'arbitrum' },
          ],
          createdAt: now - 86400000 * 5,
        },
      ];
    }

    if (type === 'full' || type === 'alerts') {
      sampleData.data.alerts = [
        {
          id: 'alert-1',
          type: 'price',
          condition: {
            token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            chain: 'ethereum',
            direction: 'above',
            value: 100,
          },
          enabled: true,
          createdAt: now - 86400000 * 7,
        },
        {
          id: 'alert-2',
          type: 'gas',
          condition: {
            chain: 'ethereum',
            direction: 'below',
            value: 30,
          },
          enabled: true,
          createdAt: now - 86400000 * 3,
        },
      ];
    }

    if (type === 'full' || type === 'strategies') {
      sampleData.data.strategies = [
        {
          id: 'strat-1',
          name: 'Stablecoin Yield',
          type: 'yield_farming',
          config: {
            protocol: 'aave',
            token: 'USDC',
            chain: 'ethereum',
          },
          createdAt: now - 86400000 * 20,
        },
      ];
    }

    sampleData.data.settings = {
      theme: 'dark',
      currency: 'USD',
      notifications: {
        email: true,
        telegram: false,
        webhook: true,
      },
    };

    return sampleData;
  }

  // Export portfolio data
  async exportPortfolio(request: ExportRequest): Promise<BackupData> {
    const backup = this.generateSampleBackup(request.type);
    
    // Store the backup
    const backupId = `backup-${Date.now()}`;
    this.backups.set(backupId, backup);

    return backup;
  }

  // Import portfolio data
  async importPortfolio(request: ImportRequest): Promise<{
    success: boolean;
    imported: {
      wallets: number;
      watchlists: number;
      alerts: number;
      strategies: number;
    };
    merged?: number;
    message: string;
  }> {
    const { data, merge = false, replace = false } = request;

    // Validate backup data
    if (!data.version || !data.data) {
      return {
        success: false,
        imported: { wallets: 0, watchlists: 0, alerts: 0, strategies: 0 },
        message: 'Invalid backup data format',
      };
    }

    const imported = {
      wallets: data.data.wallets?.length || 0,
      watchlists: data.data.watchlists?.length || 0,
      alerts: data.data.alerts?.length || 0,
      strategies: data.data.strategies?.length || 0,
    };

    const merged = merge ? 1 : 0;

    // Store the imported data
    const backupId = `backup-imported-${Date.now()}`;
    this.backups.set(backupId, data);

    const message = replace 
      ? `Replaced portfolio with ${imported.wallets} wallets, ${imported.watchlists} watchlists, ${imported.alerts} alerts, ${imported.strategies} strategies`
      : merge 
        ? `Merged portfolio data: ${imported.wallets} new wallets, ${imported.watchlists} new watchlists, ${imported.alerts} new alerts, ${imported.strategies} new strategies`
        : `Imported ${imported.wallets} wallets, ${imported.watchlists} watchlists, ${imported.alerts} alerts, ${imported.strategies} strategies`;

    return {
      success: true,
      imported,
      merged: replace || merge ? merged : undefined,
      message,
    };
  }

  // Get backup history
  async getBackupHistory(userId: string = 'default'): Promise<{
    backups: { id: string; timestamp: number; type: string; size: number }[];
  }> {
    const backups: { id: string; timestamp: number; type: string; size: number }[] = [];
    
    this.backups.forEach((data, id) => {
      backups.push({
        id,
        timestamp: data.timestamp,
        type: data.type,
        size: JSON.stringify(data).length,
      });
    });

    return { backups: backups.slice(-10).reverse() };
  }

  // Validate backup data
  async validateBackup(data: BackupData): Promise<{
    valid: boolean;
    version: string;
    checks: {
      wallets: boolean;
      watchlists: boolean;
      alerts: boolean;
      strategies: boolean;
      settings: boolean;
    };
    issues: string[];
  }> {
    const issues: string[] = [];
    
    if (!data.version) issues.push('Missing version');
    if (!data.timestamp) issues.push('Missing timestamp');
    if (!data.data) issues.push('Missing data object');

    const checks = {
      wallets: Array.isArray(data.data?.wallets),
      watchlists: Array.isArray(data.data?.watchlists),
      alerts: Array.isArray(data.data?.alerts),
      strategies: Array.isArray(data.data?.strategies),
      settings: !!data.data?.settings,
    };

    return {
      valid: issues.length === 0,
      version: data.version || 'unknown',
      checks,
      issues,
    };
  }

  // Get supported export types
  getExportTypes(): { type: string; description: string; fields: string[] }[] {
    return [
      {
        type: 'full',
        description: 'Complete backup of all portfolio data',
        fields: ['wallets', 'watchlists', 'alerts', 'strategies', 'settings'],
      },
      {
        type: 'wallets',
        description: 'Wallet addresses and labels only',
        fields: ['wallets'],
      },
      {
        type: 'watchlists',
        description: 'Token watchlists only',
        fields: ['watchlists'],
      },
      {
        type: 'alerts',
        description: 'Price and notification alerts only',
        fields: ['alerts'],
      },
      {
        type: 'strategies',
        description: 'DeFi strategies only',
        fields: ['strategies'],
      },
    ];
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalBackups: number;
    totalDataSize: number;
    dataBreakdown: {
      wallets: number;
      watchlists: number;
      alerts: number;
      strategies: number;
    };
  }> {
    let totalSize = 0;
    const breakdown = { wallets: 0, watchlists: 0, alerts: 0, strategies: 0 };

    this.backups.forEach((data) => {
      totalSize += JSON.stringify(data).length;
      if (data.data.wallets) breakdown.wallets += data.data.wallets.length;
      if (data.data.watchlists) breakdown.watchlists += data.data.watchlists.length;
      if (data.data.alerts) breakdown.alerts += data.data.alerts.length;
      if (data.data.strategies) breakdown.strategies += data.data.strategies.length;
    });

    return {
      totalBackups: this.backups.size,
      totalDataSize: totalSize,
      dataBreakdown: breakdown,
    };
  }
}
