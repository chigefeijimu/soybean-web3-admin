import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

interface SnapshotData {
  address: string;
  timestamp: number;
  totalValue: number;
  chain: string;
  tokens: {
    symbol: string;
    address: string;
    balance: number;
    value: number;
    chain: string;
  }[];
  nfts: {
    collection: string;
    tokenId: string;
    value: number;
  }[];
}

@ApiTags('Wallet Snapshot')
@Controller('api/web3/wallet-snapshot')
export class WalletSnapshotController {
  private snapshots: Map<string, SnapshotData[]> = new Map();

  @Post('save')
  @ApiOperation({ summary: 'Save a wallet portfolio snapshot' })
  @ApiResponse({ status: 200, description: 'Snapshot saved successfully' })
  async saveSnapshot(@Body() data: SnapshotData) {
    const address = data.address.toLowerCase();
    if (!this.snapshots.has(address)) {
      this.snapshots.set(address, []);
    }
    
    const snapshot: SnapshotData = {
      ...data,
      address,
      timestamp: Date.now(),
    };
    
    const existingSnapshots = this.snapshots.get(address) || [];
    existingSnapshots.push(snapshot);
    
    // Keep only last 100 snapshots per address
    if (existingSnapshots.length > 100) {
      existingSnapshots.shift();
    }
    
    return {
      success: true,
      snapshotId: existingSnapshots.length - 1,
      totalSnapshots: existingSnapshots.length,
    };
  }

  @Get('list/:address')
  @ApiOperation({ summary: 'Get all snapshots for a wallet' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  async getSnapshots(
    @Param('address') address: string,
    @Query('limit') limit?: number,
  ) {
    const addr = address.toLowerCase();
    const snapshots = this.snapshots.get(addr) || [];
    
    let result = snapshots.sort((a, b) => b.timestamp - a.timestamp);
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return {
      address: addr,
      total: snapshots.length,
      snapshots: result,
    };
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two snapshots' })
  @ApiQuery({ name: 'address', required: true })
  @ApiQuery({ name: 'startIndex', required: false })
  @ApiQuery({ name: 'endIndex', required: false })
  async compareSnapshots(
    @Query('address') address: string,
    @Query('startIndex') startIndex?: number,
    @Query('endIndex') endIndex?: number,
  ) {
    const addr = address.toLowerCase();
    const snapshots = this.snapshots.get(addr) || [];
    
    if (snapshots.length < 2) {
      return { error: 'Need at least 2 snapshots to compare' };
    }
    
    const end = endIndex !== undefined ? endIndex : snapshots.length - 1;
    const start = startIndex !== undefined ? startIndex : snapshots.length - 2;
    
    const newer = snapshots[end];
    const older = snapshots[start];
    
    const valueChange = newer.totalValue - older.totalValue;
    const percentChange = older.totalValue > 0 
      ? ((valueChange / older.totalValue) * 100) 
      : 0;
    
    // Calculate token changes
    const tokenChanges = this.calculateTokenChanges(older.tokens, newer.tokens);
    
    return {
      newer: {
        timestamp: newer.timestamp,
        totalValue: newer.totalValue,
      },
      older: {
        timestamp: older.timestamp,
        totalValue: older.totalValue,
      },
      change: {
        value: valueChange,
        percent: percentChange.toFixed(2),
      },
      tokenChanges,
      daysDiff: Math.floor((newer.timestamp - older.timestamp) / (1000 * 60 * 60 * 24)),
    };
  }

  private calculateTokenChanges(oldTokens: any[], newTokens: any[]) {
    const changes: any[] = [];
    const oldMap = new Map(oldTokens.map(t => [t.symbol, t]));
    const newMap = new Map(newTokens.map(t => [t.symbol, t]));
    
    // Find new tokens
    for (const [symbol, token] of newMap) {
      if (!oldMap.has(symbol)) {
        changes.push({ symbol, change: 'new', value: token.value });
      }
    }
    
    // Find removed tokens
    for (const [symbol, token] of oldMap) {
      if (!newMap.has(symbol)) {
        changes.push({ symbol, change: 'removed', value: -token.value });
      }
    }
    
    // Find value changes
    for (const [symbol, newToken] of newMap) {
      const oldToken = oldMap.get(symbol);
      if (oldToken) {
        const change = newToken.value - oldToken.value;
        if (Math.abs(change) > 0.01) {
          changes.push({ 
            symbol, 
            change: change > 0 ? 'increased' : 'decreased', 
            value: change,
            percent: ((change / oldToken.value) * 100).toFixed(2),
          });
        }
      }
    }
    
    return changes;
  }

  @Get('history/:address')
  @ApiOperation({ summary: 'Get portfolio value history' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look back' })
  async getHistory(
    @Param('address') address: string,
    @Query('days') days?: number,
  ) {
    const addr = address.toLowerCase();
    const snapshots = this.snapshots.get(addr) || [];
    
    const now = Date.now();
    const cutoff = days 
      ? now - (days * 24 * 60 * 60 * 1000) 
      : 0;
    
    const filtered = snapshots
      .filter(s => s.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const history = filtered.map(s => ({
      timestamp: s.timestamp,
      date: new Date(s.timestamp).toISOString().split('T')[0],
      totalValue: s.totalValue,
    }));
    
    // Calculate metrics
    if (history.length > 0) {
      const values = history.map(h => h.totalValue);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const current = values[values.length - 1];
      const first = values[0];
      const periodChange = ((current - first) / first * 100).toFixed(2);
      
      return {
        address: addr,
        period: { days: days || 'all' },
        history,
        metrics: {
          current,
          max,
          min,
          periodChange,
          volatility: ((max - min) / ((max + min) / 2) * 100).toFixed(2),
        },
      };
    }
    
    return { address: addr, history: [], metrics: null };
  }

  @Delete(':address')
  @ApiOperation({ summary: 'Delete all snapshots for an address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async deleteSnapshots(@Param('address') address: string) {
    const addr = address.toLowerCase();
    const count = (this.snapshots.get(addr) || []).length;
    this.snapshots.delete(addr);
    
    return {
      success: true,
      deleted: count,
    };
  }
}
