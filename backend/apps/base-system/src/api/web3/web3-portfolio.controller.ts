import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('Web3 Portfolio')
@Controller('web3')
export class Web3PortfolioController {
  constructor(private readonly httpService: HttpService) {}

  @Get('portfolio')
  @ApiOperation({ summary: '查询钱包代币持仓' })
  async getPortfolio(
    @Query('address') address: string,
    @Query('chainId') chainId: number = 1,
  ) {
    // 验证地址格式
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid wallet address');
    }

    // 使用 Etherscan API 获取代币余额
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    const chain = this.getChainConfig(chainId);
    
    try {
      // 获取 ETH 余额
      const ethBalance = await this.getEthBalance(address, chain);
      
      // 获取代币列表
      const tokens = await this.getTokenBalances(address, chain, apiKey);
      
      // 计算总 USD 价值
      const totalUsdValue = this.calculateTotalValue(ethBalance, tokens);
      
      return {
        address,
        chainId,
        ethBalance,
        tokens,
        totalUsdValue,
      };
    } catch (error) {
      console.error('Portfolio fetch error:', error);
      throw new Error('Failed to fetch portfolio');
    }
  }

  @Get('chains')
  @ApiOperation({ summary: '获取支持的链列表' })
  getChains() {
    return [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 56, name: 'BSC', symbol: 'BNB' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
    ];
  }

  private getChainConfig(chainId: number) {
    const chains: Record<number, { name: string; apiUrl: string }> = {
      1: { name: 'Ethereum', apiUrl: 'https://api.etherscan.io/api' },
      56: { name: 'BSC', apiUrl: 'https://api.bscscan.com/api' },
      137: { name: 'Polygon', apiUrl: 'https://api.polygonscan.com/api' },
      42161: { name: 'Arbitrum', apiUrl: 'https://api.arbiscan.io/api' },
      10: { name: 'Optimism', apiUrl: 'https://api-optimistic.etherscan.io/api' },
    };
    return chains[chainId] || chains[1];
  }

  private async getEthBalance(address: string, chain: { name: string; apiUrl: string }): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(chain.apiUrl, {
          params: {
            module: 'account',
            action: 'balance',
            address,
            tag: 'latest',
          },
        }),
      );
      
      if (response.data.status === '1') {
        return response.data.result;
      }
      return '0';
    } catch {
      return '0';
    }
  }

  private async getTokenBalances(
    address: string, 
    chain: { name: string; apiUrl: string },
    apiKey: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(chain.apiUrl, {
          params: {
            module: 'account',
            action: 'tokentx',
            address,
            page: 1,
            offset: 100,
            sort: 'desc',
          },
        }),
      );

      if (response.data.status !== '1' || !response.data.result) {
        return [];
      }

      // 去重并获取代币列表
      const tokenMap = new Map<string, any>();
      const txs = response.data.result.slice(0, 100);
      
      for (const tx of txs) {
        const tokenAddress = tx.contractAddress.toLowerCase();
        if (!tokenMap.has(tokenAddress)) {
          tokenMap.set(tokenAddress, {
            token: {
              symbol: tx.tokenSymbol || 'Unknown',
              name: tx.tokenName || 'Unknown Token',
              decimals: parseInt(tx.tokenDecimal) || 18,
              contractAddress: tx.contractAddress,
            },
            balance: tx.value,
            price: '0',
            usdValue: '0',
          });
        }
      }

      return Array.from(tokenMap.values());
    } catch {
      return [];
    }
  }

  private calculateTotalValue(ethBalance: string, tokens: any[]): string {
    const ethValue = parseFloat(ethBalance) / 1e18 * 3000; // 简化计算
    
    let totalValue = ethValue;
    tokens.forEach(token => {
      totalValue += parseFloat(token.usdValue) || 0;
    });

    return totalValue.toFixed(2);
  }
}
