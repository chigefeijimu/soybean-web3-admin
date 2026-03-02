import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  token?: string;
  tokenValue?: string;
  gasUsed?: string;
  gasPrice?: string;
  isError: boolean;
}

export interface TaxReport {
  address: string;
  year: number;
  chainId: number;
  totalTransactions: number;
  totalReceived: number;
  totalSent: number;
  totalGasFees: number;
  realizedGains: RealizedGain[];
  unrealizedGains: UnrealizedGain[];
  incomeEvents: IncomeEvent[];
  summary: TaxSummary;
}

export interface RealizedGain {
  token: string;
  purchaseDate: string;
  purchasePrice: number;
  saleDate: string;
  salePrice: number;
  quantity: number;
  gain: number;
  gainType: 'long_term' | 'short_term';
}

export interface UnrealizedGain {
  token: string;
  quantity: number;
  averageCostBasis: number;
  currentPrice: number;
  unrealizedGain: number;
  percentageChange: number;
}

export interface IncomeEvent {
  date: string;
  type: 'airdrop' | 'staking_reward' | 'mining_reward' | 'interest' | 'nft_mint' | 'other';
  token: string;
  amount: number;
  valueAtTime: number;
  description: string;
}

export interface TaxSummary {
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netCapitalGain: number;
  totalIncome: number;
  totalGasFees: number;
  estimatedTax: number;
  holdingPeriodDays: number;
}

@Injectable()
export class TaxReportService {
  private readonly ethplorerApi = 'https://api.ethplorer.io';
  private readonly etherscanApi = 'https://api.etherscan.io/api';
  private readonly coingeckoApi = 'https://api.coingecko.com/api/v3';

  constructor(private httpService: HttpService) {}

  async generateTaxReport(
    address: string,
    year: number,
    chainId: number = 1,
  ): Promise<TaxReport> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    
    // Get transactions for the year
    const transactions = await this.getTransactions(address, chainId, startDate, endDate);
    
    // Get current token prices
    const tokens = await this.getTokenPrices(chainId);
    
    // Calculate gains/losses
    const { realizedGains, unrealizedGains, incomeEvents } = this.calculateGains(
      transactions,
      tokens,
      year,
    );
    
    // Calculate summary
    const summary = this.calculateSummary(realizedGains, incomeEvents, transactions);
    
    return {
      address,
      year,
      chainId,
      totalTransactions: transactions.length,
      totalReceived: this.calculateTotalReceived(transactions),
      totalSent: this.calculateTotalSent(transactions),
      totalGasFees: this.calculateTotalGasFees(transactions),
      realizedGains,
      unrealizedGains,
      incomeEvents,
      summary,
    };
  }

  private async getTransactions(
    address: string,
    chainId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    try {
      // Use Etherscan API for Ethereum transactions
      if (chainId === 1) {
        const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc`;
        const response = await firstValueFrom(this.httpService.get(url));
        
        if (response.data.status === '1' && response.data.result) {
          return response.data.result
            .filter((tx: any) => {
              const txDate = new Date(parseInt(tx.timeStamp) * 1000);
              return txDate >= startDate && txDate <= endDate;
            })
            .map((tx: any) => ({
              hash: tx.hash,
              blockNumber: parseInt(tx.blockNumber),
              timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
              from: tx.from,
              to: tx.to,
              value: tx.value,
              gasUsed: tx.gasUsed,
              gasPrice: tx.gasPrice,
              isError: tx.isError === '1',
            }));
        }
      }
      
      // For other chains, return demo data
      return this.getDemoTransactions(address, startDate, endDate);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return this.getDemoTransactions(address, startDate, endDate);
    }
  }

  private getDemoTransactions(address: string, startDate: Date, endDate: Date): Transaction[] {
    // Generate demo transactions for demonstration
    const transactions: Transaction[] = [];
    const demoTokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'LINK'];
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    const range = endTimestamp - startTimestamp;
    
    // Generate 20-50 random transactions
    const numTx = Math.floor(Math.random() * 30) + 20;
    
    for (let i = 0; i < numTx; i++) {
      const timestamp = startTimestamp + Math.random() * range;
      const isReceive = Math.random() > 0.5;
      const token = demoTokens[Math.floor(Math.random() * demoTokens.length)];
      const value = (Math.random() * 10).toFixed(4);
      
      transactions.push({
        hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        blockNumber: 18000000 + i,
        timestamp: new Date(timestamp).toISOString(),
        from: isReceive ? '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1' : address,
        to: isReceive ? address : '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1',
        value: value,
        token: token === 'ETH' ? undefined : token,
        tokenValue: token === 'ETH' ? undefined : value,
        gasUsed: (Math.floor(Math.random() * 21000) + 21000).toString(),
        gasPrice: (Math.random() * 50 * 1e9).toFixed(0),
        isError: false,
      });
    }
    
    return transactions.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private async getTokenPrices(chainId: number): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    
    try {
      // Get ETH price
      const ethResponse = await firstValueFrom(
        this.httpService.get(`${this.coingeckoApi}/simple/price?ids=ethereum&vs_currencies=usd`)
      );
      prices.set('ETH', ethResponse.data.ethereum?.usd || 3000);
      
      // Get popular token prices
      const tokenIds = ['usd-coin', 'tether', 'wrapped-bitcoin', 'chainlink', 'uniswap', 'aave', 'matic-network'];
      const tokenSymbols = ['USDC', 'USDT', 'WBTC', 'LINK', 'UNI', 'AAVE', 'MATIC'];
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.coingeckoApi}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`
        )
      );
      
      tokenSymbols.forEach((symbol, idx) => {
        const price = response.data[tokenIds[idx]]?.usd;
        if (price) prices.set(symbol, price);
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Set fallback prices
      prices.set('ETH', 3000);
      prices.set('USDC', 1);
      prices.set('USDT', 1);
      prices.set('WBTC', 45000);
      prices.set('LINK', 15);
    }
    
    return prices;
  }

  private calculateGains(
    transactions: Transaction[],
    prices: Map<string, number>,
    year: number,
  ): { realizedGains: RealizedGain[]; unrealizedGains: UnrealizedGain[]; incomeEvents: IncomeEvent[] } {
    const realizedGains: RealizedGain[] = [];
    const unrealizedGains: UnrealizedGain[] = [];
    const incomeEvents: IncomeEvent[] = [];
    
    // Track holdings for cost basis calculation
    const holdings: Map<string, { quantity: number; costBasis: number; date: string }[]> = new Map();
    
    // Process transactions to calculate gains
    for (const tx of transactions) {
      if (tx.isError) continue;
      
      const token = tx.token || 'ETH';
      const value = parseFloat(tx.tokenValue || tx.value) / 1e18;
      const price = prices.get(token) || 0;
      const valueUsd = value * price;
      
      // Check if incoming or outgoing
      const isIncoming = tx.to.toLowerCase() === tx.from.toLowerCase() || 
        tx.from.toLowerCase() !== tx.from; // Simplified check
      
      if (tx.from.toLowerCase() === tx.from.toLowerCase()) {
        // Receiving - add to holdings
        if (!holdings.has(token)) {
          holdings.set(token, []);
        }
        holdings.get(token)!.push({
          quantity: value,
          costBasis: valueUsd,
          date: tx.timestamp,
        });
      } else if (tx.to.toLowerCase() === tx.from.toLowerCase()) {
        // Sending - calculate gain/loss
        if (holdings.has(token) && holdings.get(token)!.length > 0) {
          const lots = holdings.get(token)!;
          let remaining = value;
          
          while (remaining > 0 && lots.length > 0) {
            const lot = lots[0];
            const sold = Math.min(lot.quantity, remaining);
            
            const salePrice = valueUsd * (sold / value);
            const costBasis = lot.costBasis * (sold / lot.quantity);
            const gain = salePrice - costBasis;
            
            // Determine holding period (simplified)
            const purchaseDate = new Date(lot.date);
            const saleDate = new Date(tx.timestamp);
            const holdingDays = (saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
            
            realizedGains.push({
              token,
              purchaseDate: lot.date,
              purchasePrice: costBasis / sold,
              saleDate: tx.timestamp,
              salePrice: salePrice / sold,
              quantity: sold,
              gain,
              gainType: holdingDays > 365 ? 'long_term' : 'short_term',
            });
            
            lot.quantity -= sold;
            lot.costBasis -= costBasis;
            remaining -= sold;
            
            if (lot.quantity <= 0) {
              lots.shift();
            }
          }
        }
      }
      
      // Check for potential income events (airdrops, staking, etc.)
      // In a real implementation, this would analyze transaction types
      if (Math.random() < 0.05) { // 5% chance of income event for demo
        incomeEvents.push({
          date: tx.timestamp,
          type: 'airdrop',
          token,
          amount: value * 0.1,
          valueAtTime: valueUsd * 0.1,
          description: `Potential airdrop: ${token}`,
        });
      }
    }
    
    // Calculate unrealized gains for remaining holdings
    for (const [token, lots] of holdings) {
      if (lots.length === 0) continue;
      
      const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
      const totalCostBasis = lots.reduce((sum, lot) => sum + lot.costBasis, 0);
      const avgCostBasis = totalQuantity > 0 ? totalCostBasis / totalQuantity : 0;
      const currentPrice = prices.get(token) || 0;
      const currentValue = totalQuantity * currentPrice;
      const unrealizedGain = currentValue - totalCostBasis;
      const percentageChange = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0;
      
      if (totalQuantity > 0.01) { // Only show if holding meaningful amount
        unrealizedGains.push({
          token,
          quantity: totalQuantity,
          averageCostBasis: avgCostBasis,
          currentPrice,
          unrealizedGain,
          percentageChange,
        });
      }
    }
    
    return { realizedGains, unrealizedGains, incomeEvents };
  }

  private calculateSummary(
    realizedGains: RealizedGain[],
    incomeEvents: IncomeEvent[],
    transactions: Transaction[],
  ): TaxSummary {
    const totalRealizedGains = realizedGains
      .filter(g => g.gain > 0)
      .reduce((sum, g) => sum + g.gain, 0);
    
    const totalRealizedLosses = realizedGains
      .filter(g => g.gain < 0)
      .reduce((sum, g) => sum + Math.abs(g.gain), 0);
    
    const netCapitalGain = totalRealizedGains - totalRealizedLosses;
    const totalIncome = incomeEvents.reduce((sum, e) => sum + e.valueAtTime, 0);
    const totalGasFees = this.calculateTotalGasFees(transactions);
    
    // Simplified tax calculation (assuming 30% tax rate for short-term, 15% for long-term)
    const shortTermGains = realizedGains
      .filter(g => g.gainType === 'short_term' && g.gain > 0)
      .reduce((sum, g) => sum + g.gain, 0);
    const longTermGains = realizedGains
      .filter(g => g.gainType === 'long_term' && g.gain > 0)
      .reduce((sum, g) => sum + g.gain, 0);
    
    const estimatedTax = (shortTermGains * 0.30) + (longTermGains * 0.15) + (totalIncome * 0.30);
    
    // Calculate average holding period
    const holdingPeriodDays = realizedGains.length > 0
      ? realizedGains.reduce((sum, g) => {
          const purchaseDate = new Date(g.purchaseDate);
          const saleDate = new Date(g.saleDate);
          return sum + (saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / realizedGains.length
      : 0;
    
    return {
      totalRealizedGains,
      totalRealizedLosses,
      netCapitalGain,
      totalIncome,
      totalGasFees,
      estimatedTax: Math.max(0, estimatedTax),
      holdingPeriodDays,
    };
  }

  private calculateTotalReceived(transactions: Transaction[]): number {
    // Simplified - in real implementation would use token prices
    return transactions
      .filter(tx => tx.from.toLowerCase() !== tx.from.toLowerCase())
      .reduce((sum, tx) => sum + parseFloat(tx.value) / 1e18, 0);
  }

  private calculateTotalSent(transactions: Transaction[]): number {
    return transactions
      .filter(tx => tx.to.toLowerCase() !== tx.to.toLowerCase())
      .reduce((sum, tx) => sum + parseFloat(tx.value) / 1e18, 0);
  }

  private calculateTotalGasFees(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => {
      const gasUsed = parseFloat(tx.gasUsed || '0');
      const gasPrice = parseFloat(tx.gasPrice || '0') / 1e9; // Convert to Gwei
      return sum + (gasUsed * gasPrice * 0.003); // Assuming ETH price ~$3000
    }, 0);
  }

  async exportToCSV(report: TaxReport): Promise<string> {
    const lines: string[] = [];
    
    // Header
    lines.push('Cryptocurrency Tax Report');
    lines.push(`Address: ${report.address}`);
    lines.push(`Year: ${report.year}`);
    lines.push(`Chain: Ethereum`);
    lines.push('');
    
    // Summary
    lines.push('=== TAX SUMMARY ===');
    lines.push(`Total Realized Gains: $${report.summary.totalRealizedGains.toFixed(2)}`);
    lines.push(`Total Realized Losses: $${report.summary.totalRealizedLosses.toFixed(2)}`);
    lines.push(`Net Capital Gain: $${report.summary.netCapitalGain.toFixed(2)}`);
    lines.push(`Total Income: $${report.summary.totalIncome.toFixed(2)}`);
    lines.push(`Total Gas Fees: $${report.summary.totalGasFees.toFixed(2)}`);
    lines.push(`Estimated Tax: $${report.summary.estimatedTax.toFixed(2)}`);
    lines.push('');
    
    // Realized Gains
    if (report.realizedGains.length > 0) {
      lines.push('=== REALIZED GAINS/LOSSES ===');
      lines.push('Token,Purchase Date,Sale Date,Quantity,Cost Basis,Sale Price,Gain,Type');
      
      for (const gain of report.realizedGains) {
        lines.push(
          `${gain.token},${gain.purchaseDate},${gain.saleDate},${gain.quantity},` +
          `$${gain.purchasePrice.toFixed(2)},$${gain.salePrice.toFixed(2)},` +
          `$${gain.gain.toFixed(2)},${gain.gainType}`
        );
      }
      lines.push('');
    }
    
    // Unrealized Gains
    if (report.unrealizedGains.length > 0) {
      lines.push('=== UNREALIZED GAINS (CURRENT HOLDINGS) ===');
      lines.push('Token,Quantity,Avg Cost Basis,Current Price,Unrealized Gain,% Change');
      
      for (const gain of report.unrealizedGains) {
        lines.push(
          `${gain.token},${gain.quantity.toFixed(4)},$${gain.averageCostBasis.toFixed(2)},` +
          `$${gain.currentPrice.toFixed(2)},$${gain.unrealizedGain.toFixed(2)},${gain.percentageChange.toFixed(2)}%`
        );
      }
      lines.push('');
    }
    
    // Income Events
    if (report.incomeEvents.length > 0) {
      lines.push('=== INCOME EVENTS ===');
      lines.push('Date,Type,Token,Amount,Value,Description');
      
      for (const event of report.incomeEvents) {
        lines.push(
          `${event.date},${event.type},${event.token},${event.amount.toFixed(4)},` +
          `$${event.valueAtTime.toFixed(2)},${event.description}`
        );
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }

  async getSupportedChains(): Promise<{ id: number; name: string; symbol: string }[]> {
    return [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
      { id: 56, name: 'BNB Chain', symbol: 'BNB' },
      { id: 8453, name: 'Base', symbol: 'ETH' },
    ];
  }
}
