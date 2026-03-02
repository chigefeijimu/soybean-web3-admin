import { Injectable } from '@nestjs/common';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  balanceUsd: number;
  chain: string;
  logoUrl?: string;
}

interface PortfolioData {
  address: string;
  totalValueUsd: number;
  chains: {
    name: string;
    totalValueUsd: number;
    tokens: TokenBalance[];
  }[];
  generatedAt: string;
}

@Injectable()
export class PortfolioExportService {
  private readonly chainRpcUrls: Record<string, string> = {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    polygon: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/demo',
    optimism: 'https://opt-mainnet.g.alchemy.com/v2/demo',
    bsc: 'https://bsc-dataseed.binance.org',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    base: 'https://base-mainnet.g.alchemy.com/v2/demo',
  };

  private readonly tokenLists: Record<string, { symbol: string; name: string; address: string; decimals: number }[]> = {
    ethereum: [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
      { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
    ],
    polygon: [
      { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', decimals: 6 },
      { symbol: 'USDT', name: 'Tether', address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', decimals: 6 },
    ],
    arbitrum: [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cc2239327c5edb3a432268e3631', decimals: 6 },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912ce59144191c1204e64559fe8253a0e49e6548', decimals: 18 },
    ],
    optimism: [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', decimals: 6 },
      { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18 },
    ],
    bsc: [
      { symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
      { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18 },
    ],
    avalanche: [
      { symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', decimals: 6 },
    ],
    base: [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', address: '0x833589fcd6edb6e21f41078d7b4a0bf9351fea89', decimals: 6 },
    ],
  };

  private readonly tokenPrices: Record<string, number> = {
    ETH: 2450.00,
    USDC: 1.00,
    USDT: 1.00,
    WBTC: 62500.00,
    DAI: 1.00,
    MATIC: 0.85,
    ARB: 1.15,
    OP: 2.50,
    BNB: 580.00,
    AVAX: 38.00,
  };

  async getPortfolioData(address: string, chains: string[]): Promise<PortfolioData> {
    const result: PortfolioData = {
      address: address.toLowerCase(),
      totalValueUsd: 0,
      chains: [],
      generatedAt: new Date().toISOString(),
    };

    for (const chain of chains) {
      const tokens = await this.getChainBalances(address, chain);
      const chainValue = tokens.reduce((sum, t) => sum + t.balanceUsd, 0);
      
      if (tokens.length > 0 || chain === 'ethereum') {
        result.chains.push({
          name: chain,
          totalValueUsd: chainValue,
          tokens,
        });
        result.totalValueUsd += chainValue;
      }
    }

    return result;
  }

  private async getChainBalances(address: string, chain: string): Promise<TokenBalance[]> {
    const tokens = this.tokenLists[chain] || [];
    const balances: TokenBalance[] = [];

    // Simulate fetching balances for each token
    // In production, this would call actual blockchain nodes
    for (const token of tokens) {
      // Generate realistic-looking random balances
      const hasBalance = Math.random() > 0.3;
      if (hasBalance) {
        const balance = (Math.random() * 10).toFixed(token.decimals > 6 ? 6 : token.decimals);
        const balanceUsd = parseFloat(balance) * (this.tokenPrices[token.symbol] || 1);
        
        balances.push({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          balance: balance,
          balanceUsd: Math.round(balanceUsd * 100) / 100,
          chain: chain,
        });
      }
    }

    // Add some native token balance
    const nativeBalances: Record<string, { symbol: string; name: string }> = {
      ethereum: { symbol: 'ETH', name: 'Ethereum' },
      polygon: { symbol: 'MATIC', name: 'Polygon' },
      arbitrum: { symbol: 'ETH', name: 'Ethereum' },
      optimism: { symbol: 'ETH', name: 'Ethereum' },
      bsc: { symbol: 'BNB', name: 'BNB' },
      avalanche: { symbol: 'AVAX', name: 'Avalanche' },
      base: { symbol: 'ETH', name: 'Ethereum' },
    };

    if (nativeBalances[chain]) {
      const native = nativeBalances[chain];
      const balance = (Math.random() * 2).toFixed(18);
      const balanceUsd = parseFloat(balance) * (this.tokenPrices[native.symbol] || 1);
      
      balances.unshift({
        symbol: native.symbol,
        name: native.name,
        address: '0x0000000000000000000000000000000000000000',
        balance: balance,
        balanceUsd: Math.round(balanceUsd * 100) / 100,
        chain: chain,
      });
    }

    return balances;
  }

  async generateCsv(data: PortfolioData): Promise<string> {
    const lines: string[] = [];
    
    // Header
    lines.push('Chain,Symbol,Name,Address,Balance,USD Value');
    
    // Token rows
    for (const chain of data.chains) {
      for (const token of chain.tokens) {
        lines.push([
          chain.name,
          token.symbol,
          token.name,
          token.address,
          token.balance,
          token.balanceUsd.toString(),
        ].join(','));
      }
    }

    // Summary
    lines.push('');
    lines.push('Summary');
    lines.push(`Total Value (USD),${data.totalValueUsd.toFixed(2)}`);
    lines.push(`Generated At,${data.generatedAt}`);
    lines.push(`Address,${data.address}`);

    return lines.join('\n');
  }

  async generatePdf(data: PortfolioData): Promise<Buffer> {
    // Dynamic import for pdfkit
    const PDFDocument = require('pdfkit');
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).text('Portfolio Export Report', { align: 'center' });
      doc.moveDown();
      
      // Address
      doc.fontSize(12).text(`Address: ${data.address}`, { align: 'left' });
      doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);
      doc.moveDown();

      // Total Value
      doc.fontSize(18).text(`Total Value: $${data.totalValueUsd.toFixed(2)}`, { align: 'center' });
      doc.moveDown();

      // Chain breakdown
      doc.fontSize(14).text('Chain Breakdown:', { underline: true });
      doc.moveDown(0.5);

      for (const chain of data.chains) {
        doc.fontSize(12).text(`${chain.name.toUpperCase()}: $${chain.totalValueUsd.toFixed(2)}`);
        
        for (const token of chain.tokens) {
          doc.fontSize(10).text(`  ${token.symbol}: ${token.balance} ($${token.balanceUsd.toFixed(2)})`);
        }
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  getSupportedChains() {
    return Object.keys(this.chainRpcUrls).map(chain => ({
      id: chain,
      name: chain.charAt(0).toUpperCase() + chain.slice(1),
      rpcUrl: this.chainRpcUrls[chain].replace('/v2/demo', ''),
    }));
  }

  async getExportSummary(address: string, chains: string[]) {
    const data = await this.getPortfolioData(address, chains);
    
    return {
      address: data.address,
      totalValueUsd: data.totalValueUsd,
      chainCount: data.chains.length,
      tokenCount: data.chains.reduce((sum, c) => sum + c.tokens.length, 0),
      topToken: this.findTopToken(data),
      chainDistribution: data.chains.map(c => ({
        chain: c.name,
        valueUsd: c.totalValueUsd,
        percentage: data.totalValueUsd > 0 ? (c.totalValueUsd / data.totalValueUsd * 100).toFixed(2) + '%' : '0%',
      })),
      generatedAt: data.generatedAt,
    };
  }

  private findTopToken(data: PortfolioData): { symbol: string; valueUsd: number } | null {
    let topToken: { symbol: string; valueUsd: number } | null = null;
    let maxValue = 0;

    for (const chain of data.chains) {
      for (const token of chain.tokens) {
        if (token.balanceUsd > maxValue) {
          maxValue = token.balanceUsd;
          topToken = { symbol: token.symbol, valueUsd: token.balanceUsd };
        }
      }
    }

    return topToken;
  }
}
