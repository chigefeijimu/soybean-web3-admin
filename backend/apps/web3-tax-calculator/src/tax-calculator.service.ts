import { Injectable } from '@nestjs/common';
import axios from 'axios';

export type CostBasisMethod = 'FIFO' | 'LIFO' | 'HIFO' | 'SPECIFIC';

export interface TaxTransaction {
  hash: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'reward' | 'airdrop' | 'fork' | 'mining';
  token: string;
  amount: number;
  priceUSD: number;
  feeUSD: number;
  totalUSD: number;
  gainLoss?: number;
  shortTerm?: boolean;
}

export interface TaxSummary {
  address: string;
  taxYear: number;
  costBasisMethod: string;
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  totalVolume: number;
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  shortTermGains: number;
  longTermGains: number;
  shortTermLosses: number;
  longTermLosses: number;
  taxableEvents: number;
  nonTaxableEvents: number;
  estimatedTax: number;
}

export interface TaxReport {
  taxYear: number;
  costBasisMethod: string;
  transactions: TaxTransaction[];
  summary: TaxSummary;
  topGains: { token: string; gain: number }[];
  topLosses: { token: string; loss: number }[];
}

@Injectable()
export class TaxCalculatorService {
  // Mock tax rates by jurisdiction
  private readonly taxRates = [
    { jurisdiction: 'US Federal', shortTermRate: 37, longTermRate: 20 },
    { jurisdiction: 'US California', shortTermRate: 13.3, longTermRate: 13.3 },
    { jurisdiction: 'UK', shortTermRate: 20, longTermRate: 20 },
    { jurisdiction: 'Germany', shortTermRate: 26.375, longTermRate: 0 },
    { jurisdiction: 'Canada', shortTermRate: 50, longTermRate: 25 },
    { jurisdiction: 'Australia', shortTermRate: 45, longTermRate: 22.5 },
    { jurisdiction: 'Japan', shortTermRate: 45, longTermRate: 20 },
    { jurisdiction: 'Singapore', shortTermRate: 0, longTermRate: 0 },
  ];

  // Common token prices (mock data - would come from price API)
  private readonly tokenPrices: Record<string, number> = {
    'ETH': 2850,
    'BTC': 85000,
    'USDC': 1.0,
    'USDT': 1.0,
    'DAI': 1.0,
    'LINK': 18.5,
    'UNI': 12.5,
    'AAVE': 280,
    'SNX': 4.2,
    'CRV': 0.55,
    'MATIC': 0.85,
    'ARB': 1.75,
    'OP': 3.2,
    'SOL': 145,
    'AVAX': 38,
    'DOT': 7.5,
    'ADA': 0.45,
    'XRP': 0.55,
    'DOGE': 0.12,
  };

  /**
   * Get tax summary for a wallet address
   */
  async getTaxSummary(address: string, taxYear: number, method: CostBasisMethod): Promise<TaxSummary> {
    const transactions = await this.getTransactionsFromChain(address, 200);
    const yearTransactions = transactions.filter(t => {
      const txYear = new Date(t.timestamp * 1000).getFullYear();
      return txYear === taxYear;
    });

    return this.calculateTaxSummary(address, taxYear, method, yearTransactions);
  }

  /**
   * Calculate complete tax report
   */
  async calculateTaxReport(
    transactions: TaxTransaction[],
    method: CostBasisMethod,
    taxYear: number
  ): Promise<TaxReport> {
    // Process transactions with cost basis method
    const processedTransactions = this.processTransactionsWithCostBasis(
      transactions,
      method,
      taxYear
    );

    // Calculate summary
    const summary = this.calculateTaxSummary(
      'unknown',
      taxYear,
      method,
      processedTransactions
    );

    // Calculate top gains and losses by token
    const tokenGains = new Map<string, number>();
    const tokenLosses = new Map<string, number>();

    for (const tx of processedTransactions) {
      if (tx.type === 'sell' && tx.gainLoss !== undefined) {
        if (tx.gainLoss > 0) {
          tokenGains.set(tx.token, (tokenGains.get(tx.token) || 0) + tx.gainLoss);
        } else {
          tokenLosses.set(tx.token, (tokenLosses.get(tx.token) || 0) + Math.abs(tx.gainLoss));
        }
      }
    }

    const topGains = Array.from(tokenGains.entries())
      .map(([token, gain]) => ({ token, gain }))
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 5);

    const topLosses = Array.from(tokenLosses.entries())
      .map(([token, loss]) => ({ token, loss }))
      .sort((a, b) => b.loss - a.loss)
      .slice(0, 5);

    return {
      taxYear,
      costBasisMethod: method,
      transactions: processedTransactions,
      summary,
      topGains,
      topLosses,
    };
  }

  /**
   * Get transactions from blockchain (mock implementation)
   */
  async getTransactionsFromChain(address: string, limit: number = 100): Promise<TaxTransaction[]> {
    // In production, this would fetch from Etherscan/Blockscout API
    // For now, generate realistic mock data
    const transactions: TaxTransaction[] = [];
    const tokens = Object.keys(this.tokenPrices);
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < limit; i++) {
      const timestamp = oneYearAgo + Math.random() * (now - oneYearAgo);
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const price = this.tokenPrices[token];
      const amount = Math.random() * 10 + 0.1;
      const typeRoll = Math.random();
      
      let type: TaxTransaction['type'];
      if (typeRoll < 0.4) {
        type = 'buy';
      } else if (typeRoll < 0.7) {
        type = 'sell';
      } else if (typeRoll < 0.85) {
        type = 'transfer_in';
      } else if (typeRoll < 0.95) {
        type = 'transfer_out';
      } else {
        type = 'reward';
      }

      const totalUSD = amount * price;
      const feeUSD = totalUSD * 0.003; // 0.3% fee

      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Math.floor(timestamp / 1000),
        type,
        token,
        amount,
        priceUSD: price,
        feeUSD,
        totalUSD,
      });
    }

    // Sort by timestamp
    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get gains/losses breakdown
   */
  async getGainsLosses(
    address: string,
    taxYear: number,
    method: CostBasisMethod
  ): Promise<{ transactions: TaxTransaction[]; totalGains: number; totalLosses: number }> {
    const transactions = await this.getTransactionsFromChain(address, 200);
    const yearTransactions = transactions.filter(t => {
      const txYear = new Date(t.timestamp * 1000).getFullYear();
      return txYear === taxYear;
    });

    const processed = this.processTransactionsWithCostBasis(yearTransactions, method, taxYear);
    
    let totalGains = 0;
    let totalLosses = 0;

    for (const tx of processed) {
      if (tx.type === 'sell' && tx.gainLoss !== undefined) {
        if (tx.gainLoss > 0) {
          totalGains += tx.gainLoss;
        } else {
          totalLosses += Math.abs(tx.gainLoss);
        }
      }
    }

    return {
      transactions: processed,
      totalGains: Math.round(totalGains * 100) / 100,
      totalLosses: Math.round(totalLosses * 100) / 100,
    };
  }

  /**
   * Get tax rates
   */
  getTaxRates(): { jurisdiction: string; shortTermRate: number; longTermRate: number }[] {
    return this.taxRates;
  }

  /**
   * Export tax report as CSV
   */
  async exportTaxReportCSV(
    address: string,
    taxYear: number,
    method: CostBasisMethod
  ): Promise<{ csv: string; filename: string }> {
    const { transactions, totalGains, totalLosses } = await this.getGainsLosses(address, taxYear, method);
    
    const headers = [
      'Date',
      'Transaction Type',
      'Token',
      'Amount',
      'Price (USD)',
      'Total (USD)',
      'Fee (USD)',
      'Gain/Loss (USD)',
      'Term',
      'Tx Hash',
    ];

    const rows = transactions.map(tx => {
      const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
      const term = tx.shortTerm ? 'Short-term' : 'Long-term';
      return [
        date,
        tx.type,
        tx.token,
        tx.amount.toString(),
        tx.priceUSD.toFixed(2),
        tx.totalUSD.toFixed(2),
        tx.feeUSD.toFixed(2),
        tx.gainLoss?.toFixed(2) || '0.00',
        term,
        tx.hash,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `tax_report_${address.slice(0, 6)}_${taxYear}.csv`;

    return { csv, filename };
  }

  /**
   * Get supported cost basis methods
   */
  getCostBasisMethods(): string[] {
    return ['FIFO', 'LIFO', 'HIFO', 'SPECIFIC'];
  }

  /**
   * Calculate wash sales
   */
  async calculateWashSales(
    address: string,
    taxYear: number
  ): Promise<{ disallowedLosses: number; affectedTransactions: number }> {
    // Simplified wash sale calculation
    // In production, would check for 30-day window before/after sale
    const transactions = await this.getTransactionsFromChain(address, 200);
    const sells = transactions.filter(t => t.type === 'sell');

    let disallowedLosses = 0;
    let affectedTransactions = 0;

    for (const sell of sells) {
      // Check for repurchase within 30 days (simplified)
      const sellDate = new Date(sell.timestamp * 1000);
      const repurchase = transactions.find(t => 
        t.type === 'buy' &&
        t.token === sell.token &&
        Math.abs(new Date(t.timestamp * 1000).getTime() - sellDate.getTime()) < 30 * 24 * 60 * 60 * 1000
      );

      if (repurchase && sell.totalUSD < repurchase.totalUSD) {
        // Simple calculation - in production would be more complex
        const loss = (sell.totalUSD - repurchase.totalUSD) * 0.5;
        if (loss < 0) {
          disallowedLosses += Math.abs(loss);
          affectedTransactions++;
        }
      }
    }

    return {
      disallowedLosses: Math.round(disallowedLosses * 100) / 100,
      affectedTransactions,
    };
  }

  /**
   * Process transactions with cost basis method
   */
  private processTransactionsWithCostBasis(
    transactions: TaxTransaction[],
    method: CostBasisMethod,
    taxYear: number
  ): TaxTransaction[] {
    const buys: { tx: TaxTransaction; remaining: number }[] = [];
    const processed: TaxTransaction[] = [];

    for (const tx of transactions) {
      const processedTx = { ...tx };

      if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'reward' || tx.type === 'airdrop' || tx.type === 'mining') {
        buys.push({ tx: processedTx, remaining: tx.amount });
        processedTx.gainLoss = 0;
        processedTx.shortTerm = false;
      } else if (tx.type === 'sell' || tx.type === 'transfer_out') {
        let remaining = tx.amount;
        let totalCostBasis = 0;

        // Sort buys based on method
        let sortedBuys = [...buys];
        switch (method) {
          case 'FIFO':
            // First in, first out - already sorted by timestamp
            break;
          case 'LIFO':
            sortedBuys.reverse();
            break;
          case 'HIFO':
            sortedBuys.sort((a, b) => b.tx.priceUSD - a.tx.priceUSD);
            break;
          case 'SPECIFIC':
            // Use specific identification - default to FIFO for simplicity
            break;
        }

        for (const buy of sortedBuys) {
          if (remaining <= 0) break;
          if (buy.remaining <= 0) continue;

          const used = Math.min(remaining, buy.remaining);
          totalCostBasis += used * buy.tx.priceUSD;
          buy.remaining -= used;
          remaining -= used;
        }

        // Calculate gain/loss
        const proceeds = tx.totalUSD - tx.feeUSD;
        processedTx.gainLoss = proceeds - totalCostBasis;

        // Determine short-term vs long-term (held > 1 year = long-term)
        const txDate = new Date(tx.timestamp * 1000);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        processedTx.shortTerm = txDate > oneYearAgo;
      }

      // Clean up fully used buys
      for (let i = buys.length - 1; i >= 0; i--) {
        if (buys[i].remaining <= 0.0001) {
          buys.splice(i, 1);
        }
      }

      processed.push(processedTx);
    }

    return processed;
  }

  /**
   * Calculate tax summary
   */
  private calculateTaxSummary(
    address: string,
    taxYear: number,
    method: CostBasisMethod,
    transactions: TaxTransaction[]
  ): TaxSummary {
    let totalBuys = 0;
    let totalSells = 0;
    let totalVolume = 0;
    let totalGains = 0;
    let totalLosses = 0;
    let shortTermGains = 0;
    let longTermGains = 0;
    let shortTermLosses = 0;
    let longTermLosses = 0;
    let taxableEvents = 0;
    let nonTaxableEvents = 0;

    for (const tx of transactions) {
      totalVolume += tx.totalUSD;

      if (tx.type === 'buy') {
        totalBuys++;
      } else if (tx.type === 'sell') {
        totalSells++;
        taxableEvents++;
        
        if (tx.gainLoss !== undefined) {
          if (tx.gainLoss > 0) {
            totalGains += tx.gainLoss;
            if (tx.shortTerm) {
              shortTermGains += tx.gainLoss;
            } else {
              longTermGains += tx.gainLoss;
            }
          } else {
            totalLosses += Math.abs(tx.gainLoss);
            if (tx.shortTerm) {
              shortTermLosses += Math.abs(tx.gainLoss);
            } else {
              longTermLosses += Math.abs(tx.gainLoss);
            }
          }
        }
      } else if (tx.type === 'transfer_in' || tx.type === 'reward' || tx.type === 'airdrop' || tx.type === 'mining') {
        nonTaxableEvents++;
      }
    }

    const netGainLoss = totalGains - totalLosses;
    
    // Estimate tax (simplified - using average US rate)
    const shortTermNet = shortTermGains - shortTermLosses;
    const longTermNet = longTermGains - longTermLosses;
    const estimatedTax = Math.max(0, shortTermNet * 0.32 + longTermNet * 0.2);

    return {
      address,
      taxYear,
      costBasisMethod: method,
      totalTransactions: transactions.length,
      totalBuys,
      totalSells,
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalGains: Math.round(totalGains * 100) / 100,
      totalLosses: Math.round(totalLosses * 100) / 100,
      netGainLoss: Math.round(netGainLoss * 100) / 100,
      shortTermGains: Math.round(shortTermGains * 100) / 100,
      longTermGains: Math.round(longTermGains * 100) / 100,
      shortTermLosses: Math.round(shortTermLosses * 100) / 100,
      longTermLosses: Math.round(longTermLosses * 100) / 100,
      taxableEvents,
      nonTaxableEvents,
      estimatedTax: Math.round(estimatedTax * 100) / 100,
    };
  }
}
