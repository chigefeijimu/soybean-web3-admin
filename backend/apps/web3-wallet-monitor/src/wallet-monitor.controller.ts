import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';

export interface MonitoredWallet {
  id: string;
  address: string;
  chainId: number;
  label: string;
  createdAt: number;
  lastActivityAt: number | null;
  isActive: boolean;
}

export interface WalletActivity {
  id: string;
  address: string;
  chainId: number;
  hash: string;
  timestamp: number;
  type: 'incoming' | 'outgoing' | 'swap' | 'nft' | 'defi' | 'unknown';
  status: 'pending' | 'confirmed' | 'failed';
  value: string;
  valueUsd: number;
  token: string;
  from: string;
  to: string;
  gasUsed: number;
  gasFee: string;
}

export interface MonitorStats {
  totalMonitored: number;
  activeMonitors: number;
  totalActivities: number;
  todayActivities: number;
}

@Controller('wallet-monitor')
export class WalletMonitorController {
  private monitoredWallets: MonitoredWallet[] = [];
  private activities: WalletActivity[] = [];
  private idCounter = 1;

  // Add a wallet to monitor
  @Post('wallets')
  addWallet(
    @Body() body: { address: string; chainId: number; label?: string },
  ): MonitoredWallet {
    const existing = this.monitoredWallets.find(
      (w) => w.address.toLowerCase() === body.address.toLowerCase() && w.chainId === body.chainId,
    );
    if (existing) {
      existing.isActive = true;
      existing.label = body.label || existing.label;
      return existing;
    }

    const wallet: MonitoredWallet = {
      id: `wallet_${this.idCounter++}`,
      address: body.address.toLowerCase(),
      chainId: body.chainId,
      label: body.label || `Wallet ${this.monitoredWallets.length + 1}`,
      createdAt: Date.now(),
      lastActivityAt: null,
      isActive: true,
    };
    this.monitoredWallets.push(wallet);
    
    // Generate some mock historical activity
    this.generateMockActivity(wallet);
    
    return wallet;
  }

  // Get all monitored wallets
  @Get('wallets')
  getWallets(@Query('chainId') chainId?: string): MonitoredWallet[] {
    if (chainId) {
      return this.monitoredWallets.filter((w) => w.chainId === parseInt(chainId));
    }
    return this.monitoredWallets;
  }

  // Remove a monitored wallet
  @Delete('wallets/:id')
  removeWallet(@Param('id') id: string): { success: boolean } {
    const index = this.monitoredWallets.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.monitoredWallets[index].isActive = false;
      return { success: true };
    }
    return { success: false };
  }

  // Get activities for a wallet
  @Get('activities')
  getActivities(
    @Query('address') address?: string,
    @Query('chainId') chainId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ): WalletActivity[] {
    let filtered = this.activities;

    if (address) {
      filtered = filtered.filter((a) => a.address.toLowerCase() === address.toLowerCase());
    }
    if (chainId) {
      filtered = filtered.filter((a) => a.chainId === parseInt(chainId));
    }
    if (type) {
      filtered = filtered.filter((a) => a.type === type);
    }

    const limitNum = limit ? parseInt(limit) : 50;
    return filtered.slice(-limitNum).reverse();
  }

  // Get latest activities across all monitored wallets
  @Get('activities/latest')
  getLatestActivities(@Query('limit') limit?: string): WalletActivity[] {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.activities.slice(-limitNum).reverse();
  }

  // Get monitor statistics
  @Get('stats')
  getStats(): MonitorStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    return {
      totalMonitored: this.monitoredWallets.length,
      activeMonitors: this.monitoredWallets.filter((w) => w.isActive).length,
      totalActivities: this.activities.length,
      todayActivities: this.activities.filter((a) => a.timestamp >= todayStart).length,
    };
  }

  // Check for new activity (polling endpoint)
  @Get('check')
  checkNewActivity(@Query('since') since?: string): WalletActivity[] {
    const sinceTime = since ? parseInt(since) : Date.now() - 60000;
    return this.activities.filter((a) => a.timestamp >= sinceTime);
  }

  // Get activity summary by type
  @Get('summary')
  getActivitySummary(): { type: string; count: number; totalValue: number }[] {
    const summaryMap = new Map<string, { count: number; totalValue: number }>();

    for (const activity of this.activities) {
      const existing = summaryMap.get(activity.type) || { count: 0, totalValue: 0 };
      existing.count++;
      existing.totalValue += activity.valueUsd;
      summaryMap.set(activity.type, existing);
    }

    return Array.from(summaryMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      totalValue: data.totalValue,
    }));
  }

  // Generate mock activity data for demo
  private generateMockActivity(wallet: MonitoredWallet): void {
    const activityTypes: WalletActivity['type'][] = ['incoming', 'outgoing', 'swap', 'defi', 'nft'];
    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'LINK'];
    const now = Date.now();

    const count = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const isIncoming = Math.random() > 0.5;
      const value = (Math.random() * 10).toFixed(4);
      const valueUsd = parseFloat(value) * (token === 'ETH' ? 2500 : token === 'WBTC' ? 62000 : 1);

      const activity: WalletActivity = {
        id: `activity_${this.idCounter++}`,
        address: wallet.address,
        chainId: wallet.chainId,
        hash: `0x${Math.random().toString(16).slice(2, 66)}`,
        timestamp: now - (i * 3600000) - Math.floor(Math.random() * 3600000),
        type,
        status: 'confirmed',
        value,
        valueUsd,
        token,
        from: isIncoming ? `0x${Math.random().toString(16).slice(2, 42)}` : wallet.address,
        to: isIncoming ? wallet.address : `0x${Math.random().toString(16).slice(2, 42)}`,
        gasUsed: 21000 + Math.floor(Math.random() * 100000),
        gasFee: (0.001 + Math.random() * 0.01).toFixed(6),
      };
      
      this.activities.push(activity);
      wallet.lastActivityAt = activity.timestamp;
    }

    this.activities.sort((a, b) => a.timestamp - b.timestamp);
  }
}
