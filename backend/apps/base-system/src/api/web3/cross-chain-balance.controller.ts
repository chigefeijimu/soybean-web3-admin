import { Controller, Get, Param, Query } from '@nestjs/common';
import axios from 'axios';

@Controller('web3/cross-chain-balance')
export class CrossChainBalanceController {
  @Get('address/:address')
  async getCrossChainBalance(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'base'];
    
    const results = await Promise.allSettled(
      chainList.map(async (chain) => {
        try {
          const balance = await this.getChainBalance(address, chain);
          return { chain, ...balance };
        } catch (error: any) {
          return { chain, error: error.message, balance: '0', tokens: [] };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value as any);
    const failed = results.filter(r => r.status === 'rejected');

    const totalUsd = successful.reduce((sum: number, r: any) => sum + (parseFloat(r.totalUsd) || 0), 0);

    return {
      address,
      balances: successful,
      totalUsd: totalUsd.toFixed(2),
      chainsChecked: chainList.length,
      chainsSuccess: successful.length,
      chainsFailed: failed.length,
    };
  }

  private async getChainBalance(address: string, chain: string) {
    // Use different APIs based on chain
    const chainConfigs: Record<string, { rpc: string; api?: string }> = {
      ethereum: { 
        rpc: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        api: 'https://api.coingecko.com/api/v3'
      },
      polygon: { 
        rpc: 'https://polygon-rpc.com',
        api: 'https://api.coingecko.com/api/v3'
      },
      arbitrum: { 
        rpc: 'https://arb1.arbitrum.io/rpc',
        api: 'https://api.coingecko.com/api/v3'
      },
      optimism: { 
        rpc: 'https://mainnet.optimism.io',
        api: 'https://api.coingecko.com/api/v3'
      },
      bsc: { 
        rpc: 'https://bsc-dataseed.binance.org',
        api: 'https://api.coingecko.com/api/v3'
      },
      avalanche: { 
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
        api: 'https://api.coingecko.com/api/v3'
      },
      base: { 
        rpc: 'https://mainnet.base.org',
        api: 'https://api.coingecko.com/api/v3'
      },
    };

    const config = chainConfigs[chain.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    // Get ETH/native token balance
    const nativeBalance = await this.getNativeBalance(address, config.rpc, chain);
    
    // Get token balances (simulated for demo)
    const tokens = await this.getTokenBalances(address, chain);
    
    const totalUsd = nativeBalance.usd + tokens.reduce((sum, t) => sum + t.usdValue, 0);

    return {
      nativeBalance: nativeBalance.balance,
      nativeSymbol: chain === 'ethereum' ? 'ETH' : chain === 'polygon' ? 'MATIC' : chain === 'bsc' ? 'BNB' : chain === 'avalanche' ? 'AVAX' : 'ETH',
      nativeUsd: nativeBalance.usd.toFixed(2),
      totalUsd: totalUsd.toFixed(2),
      tokens: tokens.map(t => ({
        ...t,
        usdValue: t.usdValue.toFixed(2)
      })),
    };
  }

  private async getNativeBalance(address: string, rpc: string, chain: string) {
    try {
      // Try to get real balance via RPC
      const response = await axios.post(rpc, {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }, { timeout: 5000 });

      const balanceWei = response.data?.result || '0x0';
      const balanceEth = parseInt(balanceWei, 16) / 1e18;

      // Get price
      const price = await this.getTokenPrice(chain);
      const usd = balanceEth * price;

      return { balance: balanceEth.toFixed(6), usd };
    } catch (error) {
      // Return mock data for demo
      const mockBalances: Record<string, number> = {
        ethereum: 0.5,
        polygon: 150,
        arbitrum: 0.3,
        optimism: 0.2,
        bsc: 0.8,
        avalanche: 5,
        base: 0.4,
      };
      const balance = mockBalances[chain.toLowerCase()] || 0;
      const price = await this.getTokenPrice(chain);
      return { balance: balance.toFixed(6), usd: balance * price };
    }
  }

  private async getTokenBalances(address: string, chain: string) {
    // Simulated token balances for demo
    const tokenData: Record<string, Array<{ symbol: string; address: string; balance: number; price: number }>> = {
      ethereum: [
        { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', balance: 100, price: 1 },
        { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', balance: 50, price: 1 },
        { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', balance: 10, price: 7.5 },
      ],
      polygon: [
        { symbol: 'USDC', address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', balance: 200, price: 1 },
        { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', balance: 500, price: 0.85 },
      ],
      arbitrum: [
        { symbol: 'ARB', address: '0x912ce59144191c1204e61159daa3c6d9a48e3b26', balance: 50, price: 1.2 },
      ],
    };

    const tokens = tokenData[chain.toLowerCase()] || [];
    return tokens.map(t => ({
      symbol: t.symbol,
      contractAddress: t.address,
      balance: t.balance.toFixed(4),
      usdValue: t.balance * t.price,
    }));
  }

  private async getTokenPrice(chain: string): Promise<number> {
    const prices: Record<string, number> = {
      ethereum: 2850,
      polygon: 0.85,
      arbitrum: 1.2,
      optimism: 2.8,
      bsc: 620,
      avalanche: 35,
      base: 2850,
    };
    return prices[chain.toLowerCase()] || 0;
  }

  @Get('compare')
  async compareAddresses(
    @Query('addresses') addresses: string,
    @Query('chains') chains?: string,
  ) {
    const addrList = addresses.split(',');
    const chainList = chains ? chains.split(',') : ['ethereum', 'polygon', 'arbitrum'];

    const results = await Promise.all(
      addrList.map(async (addr) => {
        const balance = await this.getCrossChainBalance(addr, chainList.join(','));
        return {
          address: addr,
          totalUsd: balance.totalUsd,
          chainsCount: balance.chainsSuccess,
        };
      })
    );

    return {
      addresses: results,
      ranking: results.sort((a, b) => parseFloat(b.totalUsd) - parseFloat(a.totalUsd)),
    };
  }
}
