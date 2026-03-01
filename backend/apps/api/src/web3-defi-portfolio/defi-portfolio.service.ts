import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DefiPortfolioDto, DefiPositionDto } from './dto/defi-portfolio.dto';

// Common token addresses across chains
const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  1: {
    // Ethereum
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EescdeCB5c811',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  },
  137: {
    // Polygon
    MATIC: '0x0000000000000000000000000000000000000000',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39',
    WMATIC: '0x0d500B1d8E8ef31E21C99d1Db9A6444d3ADf1270',
  },
  42161: {
    // Arbitrum
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC395C4ccDB9090E8d6B4a56',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f78341539c28h2',
    UNI: '0xFa7F8980b0f1E64A2062791cc3b4e249C29419ab',
    AAVE: '0xba5Dd1d6042530d170CE6f3435d7476B2606180b',
  },
};

// Mock DeFi protocol addresses (in real app, these would be real protocol contracts)
const PROTOCOLS = {
  uniswap: {
    name: 'Uniswap',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  },
  aave: {
    name: 'Aave',
    lendingPool: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    aToken: '0x3Ed3B47Dd3EC5aC1D3D8d6A50d300D5f3E8fC8b7',
  },
  compound: {
    name: 'Compound',
    cToken: '0x5d3a536E4D6DbD611c4D2eC12e4152aDb79762bD',
  },
  curve: {
    name: 'Curve',
    registry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7dd9c2d7f5',
  },
};

@Injectable()
export class DefiPortfolioService {
  private readonly etherscanApiKey: string;
  private readonly covalentApiKey: string;

  constructor(private configService: ConfigService) {
    this.etherscanApiKey = this.configService.get('ETHERSCAN_API_KEY') || '';
    this.covalentApiKey = this.configService.get('COVALENT_API_KEY') || '';
  }

  async getPortfolio(walletAddress: string, chainId: number = 1, protocols?: string): Promise<DefiPortfolioDto> {
    const address = walletAddress.toLowerCase();
    
    // Get token balances from multiple sources
    const tokenBalances = await this.getTokenBalances(address, chainId);
    
    // Get DeFi positions
    const positions = await this.getDefiPositions(address, chainId, tokenBalances);
    
    // Filter by requested protocols if specified
    let filteredPositions = positions;
    if (protocols) {
      const requestedProtocols = protocols.split(',').map(p => p.trim().toLowerCase());
      filteredPositions = positions.filter(p => requestedProtocols.includes(p.protocol.toLowerCase()));
    }

    // Calculate totals
    const totalValueUsd = filteredPositions.reduce((sum, p) => sum + p.valueUsd, 0);
    const weightedApy = filteredPositions.reduce((sum, p) => sum + (p.apy * p.valueUsd), 0) / (totalValueUsd || 1);
    
    // Generate protocol breakdown
    const protocolBreakdown = this.generateProtocolBreakdown(filteredPositions);

    // Simulate 24h change (in real app, this would be calculated from historical data)
    const change24h = (Math.random() - 0.5) * 10;

    return {
      walletAddress: address,
      totalValueUsd,
      totalApy: weightedApy,
      change24h,
      positions: filteredPositions,
      protocolBreakdown,
    };
  }

  private async getTokenBalances(address: string, chainId: number): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};
    
    // Try to get real balances from API
    try {
      if (this.covalentApiKey) {
        const response = await axios.get(
          `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/`,
          {
            params: { key: this.covalentApiKey },
          }
        );
        
        if (response.data?.data?.items) {
          for (const item of response.data.data.items) {
            if (item.balance && parseFloat(item.balance) > 0) {
              balances[item.contract_ticker_symbol?.toUpperCase() || item.contract_address] = 
                parseFloat(item.balance) / Math.pow(10, item.contract_decimals || 18);
            }
          }
        }
      }
    } catch (error) {
      console.log('Covalent API not available, using mock data');
    }

    // If no real data, generate mock balances for demo
    if (Object.keys(balances).length === 0) {
      balances['ETH'] = 2.5 + Math.random() * 3;
      balances['USDC'] = 5000 + Math.random() * 5000;
      balances['USDT'] = 2000 + Math.random() * 3000;
      balances['UNI'] = 100 + Math.random() * 200;
      balances['AAVE'] = 20 + Math.random() * 50;
      balances['LINK'] = 500 + Math.random() * 1000;
    }

    return balances;
  }

  private async getDefiPositions(
    address: string, 
    chainId: number, 
    tokenBalances: Record<string, number>
  ): Promise<DefiPositionDto[]> {
    const positions: DefiPositionDto[] = [];
    
    // Generate positions based on token balances with DeFi protocol associations
    const tokenToProtocol: Record<string, { protocol: string; apy: number }[]> = {
      ETH: [
        { protocol: 'aave', apy: 3.2 + Math.random() * 2 },
        { protocol: 'compound', apy: 2.8 + Math.random() * 1.5 },
      ],
      USDC: [
        { protocol: 'aave', apy: 4.5 + Math.random() * 1 },
        { protocol: 'compound', apy: 3.8 + Math.random() * 1 },
        { protocol: 'curve', apy: 3.0 + Math.random() * 2 },
      ],
      USDT: [
        { protocol: 'aave', apy: 4.2 + Math.random() * 1 },
        { protocol: 'compound', apy: 3.5 + Math.random() * 1 },
      ],
      DAI: [
        { protocol: 'aave', apy: 3.8 + Math.random() * 1 },
        { protocol: 'curve', apy: 2.5 + Math.random() * 1.5 },
      ],
      UNI: [
        { protocol: 'uniswap', apy: 5 + Math.random() * 15 },
      ],
      AAVE: [
        { protocol: 'aave', apy: 4 + Math.random() * 3 },
      ],
      LINK: [
        { protocol: 'aave', apy: 2.5 + Math.random() * 1.5 },
        { protocol: 'uniswap', apy: 3 + Math.random() * 8 },
      ],
      WETH: [
        { protocol: 'uniswap', apy: 8 + Math.random() * 12 },
      ],
      MATIC: [
        { protocol: 'aave', apy: 5 + Math.random() * 3 },
      ],
      WMATIC: [
        { protocol: 'aave', apy: 6 + Math.random() * 4 },
      ],
    };

    const mockPrices: Record<string, number> = {
      ETH: 2500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      UNI: 8.5,
      AAVE: 180,
      LINK: 15,
      WETH: 2500,
      MATIC: 0.85,
      WMATIC: 0.85,
    };

    for (const [symbol, balance] of Object.entries(tokenBalances)) {
      if (balance > 0.01 && tokenToProtocol[symbol]) {
        for (const protocolInfo of tokenToProtocol[symbol]) {
          const price = mockPrices[symbol] || 1;
          const valueUsd = balance * price;
          
          positions.push({
            protocol: protocolInfo.protocol,
            symbol,
            tokenAddress: TOKEN_ADDRESSES[chainId]?.[symbol] || '',
            balance,
            valueUsd,
            apy: protocolInfo.apy,
            chainId,
          });
        }
      }
    }

    // Add some liquidity pool positions
    if (tokenBalances['ETH'] || tokenBalances['WETH']) {
      positions.push({
        protocol: 'uniswap',
        symbol: 'ETH-USDC',
        tokenAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', // ETH-USDC pool
        balance: 0.5 + Math.random() * 2,
        valueUsd: 1500 + Math.random() * 5000,
        apy: 15 + Math.random() * 25,
        poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
        chainId,
      });
    }

    return positions;
  }

  private generateProtocolBreakdown(positions: DefiPositionDto[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const position of positions) {
      if (!breakdown[position.protocol]) {
        breakdown[position.protocol] = 0;
      }
      breakdown[position.protocol] += position.valueUsd;
    }

    return breakdown;
  }

  async getProtocols(): Promise<{ name: string; tvl: string; apy: string }[]> {
    // Return mock protocol data
    return [
      { name: 'Uniswap', tvl: '$4.2B', apy: '3-15%' },
      { name: 'Aave', tvl: '$12B', apy: '2-8%' },
      { name: 'Compound', tvl: '$2.1B', apy: '2-5%' },
      { name: 'Curve', tvl: '$3.8B', apy: '2-10%' },
    ];
  }
}
