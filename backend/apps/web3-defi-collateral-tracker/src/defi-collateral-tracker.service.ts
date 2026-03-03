import { Injectable } from '@nestjs/common';
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';

export interface CollateralPosition {
  id: string;
  protocol: string;
  chain: string;
  address: string;
  collateralType: string;
  collateralToken: string;
  collateralAmount: number;
  collateralValue: number;
  borrowedAmount: number;
  borrowedValue: number;
  healthFactor: number;
  liquidationPrice: number;
  currentPrice: number;
  maxLTV: number;
  apy: number;
}

export interface CollateralSummary {
  totalCollateralValue: number;
  totalBorrowedValue: number;
  netValue: number;
  overallHealthFactor: number;
  liquidationRisk: 'safe' | 'warning' | 'danger' | 'critical';
  positions: CollateralPosition[];
  byChain: Record<string, { collateral: number; borrowed: number }>;
  byProtocol: Record<string, { collateral: number; borrowed: number }>;
}

@Injectable()
export class DefiCollateralTrackerService {
  private readonly supportedProtocols = [
    'Aave',
    'Compound',
    'Liquity',
    'MakerDAO',
    'Morpho',
    'Gearbox',
    'Rho',
    'Kashi',
  ];

  private readonly supportedChains = [
    'Ethereum',
    'Polygon',
    'Arbitrum',
    'Optimism',
    'Base',
    'Avalanche',
    'BSC',
  ];

  async getCollateralPositions(
    address: string,
    chains?: string[],
  ): Promise<CollateralPosition[]> {
    const selectedChains = chains?.length ? chains : this.supportedChains;
    const positions: CollateralPosition[] = [];

    for (const chain of selectedChains) {
      const chainPositions = await this.getChainPositions(address, chain);
      positions.push(...chainPositions);
    }

    return positions;
  }

  private async getChainPositions(
    address: string,
    chain: string,
  ): Promise<CollateralPosition[]> {
    const protocols = this.getProtocolsForChain(chain);
    const positions: CollateralPosition[] = [];

    for (const protocol of protocols) {
      const protocolPositions = await this.getProtocolPositions(
        address,
        protocol,
        chain,
      );
      positions.push(...protocolPositions);
    }

    return positions;
  }

  private getProtocolsForChain(chain: string): string[] {
    const protocolChainMap: Record<string, string[]> = {
      Ethereum: ['Aave', 'Compound', 'MakerDAO', 'Liquity', 'Morpho', 'Gearbox'],
      Polygon: ['Aave', 'Compound', 'Liquity', 'Gearbox'],
      Arbitrum: ['Aave', 'Compound', 'Gearbox'],
      Optimism: ['Aave', 'Compound'],
      Base: ['Aave', 'Compound'],
      Avalanche: ['Aave', 'Compound'],
      BSC: ['Aave', 'Venus'],
    };
    return protocolChainMap[chain] || ['Aave'];
  }

  private async getProtocolPositions(
    address: string,
    protocol: string,
    chain: string,
  ): Promise<CollateralPosition[]> {
    const numPositions = Math.floor(Math.random() * 3) + 1;
    const positions: CollateralPosition[] = [];

    const collateralTokens = this.getCollateralTokensForProtocol(protocol);

    for (let i = 0; i < numPositions; i++) {
      const token = collateralTokens[Math.floor(Math.random() * collateralTokens.length)];
      const collateralAmount = Math.random() * 10000 + 100;
      const currentPrice = this.getTokenPrice(token);
      const collateralValue = collateralAmount * currentPrice;
      const maxLTV = 0.7 + Math.random() * 0.2;
      const borrowedRatio = Math.random() * 0.6;
      const borrowedValue = collateralValue * borrowedRatio * maxLTV;
      const borrowedAmount = borrowedValue / currentPrice;
      const healthFactor = collateralValue > 0 
        ? (collateralValue * maxLTV) / borrowedValue 
        : 999;
      const liquidationBuffer = 1 - borrowedRatio;
      const liquidationPrice = currentPrice * (1 - liquidationBuffer * 0.9);

      positions.push({
        id: `${protocol}-${chain}-${token}-${i}`,
        protocol,
        chain,
        address,
        collateralType: token,
        collateralToken: token,
        collateralAmount,
        collateralValue,
        borrowedAmount,
        borrowedValue,
        healthFactor: Math.min(healthFactor, 999),
        liquidationPrice,
        currentPrice,
        maxLTV,
        apy: Math.random() * 5 + 1,
      });
    }

    return positions;
  }

  private getCollateralTokensForProtocol(protocol: string): string[] {
    const tokenMap: Record<string, string[]> = {
      Aave: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'AAVE', 'LINK'],
      Compound: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'COMP', 'UNI'],
      Liquity: ['ETH', 'LUSD'],
      MakerDAO: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'MKR'],
      Morpho: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI', 'UNI', 'LINK'],
      Gearbox: ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI'],
      Venus: ['ETH', 'BNB', 'USDC', 'USDT', 'XVS'],
    };
    return tokenMap[protocol] || ['ETH', 'USDC'];
  }

  private getTokenPrice(token: string): number {
    const prices: Record<string, number> = {
      ETH: 3250,
      WBTC: 68500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      AAVE: 285,
      LINK: 18.5,
      COMP: 52,
      UNI: 9.8,
      LUSD: 1,
      MKR: 1450,
      BNB: 580,
      XVS: 6.2,
      WETH: 3250,
    };
    return prices[token] || 100;
  }

  async getCollateralSummary(address: string, chains?: string[]): Promise<CollateralSummary> {
    const positions = await this.getCollateralPositions(address, chains);

    const totalCollateralValue = positions.reduce((sum, p) => sum + p.collateralValue, 0);
    const totalBorrowedValue = positions.reduce((sum, p) => sum + p.borrowedValue, 0);
    const netValue = totalCollateralValue - totalBorrowedValue;

    const avgHealthFactor = positions.length > 0
      ? positions.reduce((sum, p) => sum + p.healthFactor, 0) / positions.length
      : 999;

    let liquidationRisk: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';
    if (avgHealthFactor < 1.1) liquidationRisk = 'critical';
    else if (avgHealthFactor < 1.5) liquidationRisk = 'danger';
    else if (avgHealthFactor < 2) liquidationRisk = 'warning';

    const byChain: Record<string, { collateral: number; borrowed: number }> = {};
    const byProtocol: Record<string, { collateral: number; borrowed: number }> = {};

    for (const pos of positions) {
      if (!byChain[pos.chain]) {
        byChain[pos.chain] = { collateral: 0, borrowed: 0 };
      }
      byChain[pos.chain].collateral += pos.collateralValue;
      byChain[pos.chain].borrowed += pos.borrowedValue;

      if (!byProtocol[pos.protocol]) {
        byProtocol[pos.protocol] = { collateral: 0, borrowed: 0 };
      }
      byProtocol[pos.protocol].collateral += pos.collateralValue;
      byProtocol[pos.protocol].borrowed += pos.borrowedValue;
    }

    return {
      totalCollateralValue,
      totalBorrowedValue,
      netValue,
      overallHealthFactor: Math.min(avgHealthFactor, 999),
      liquidationRisk,
      positions,
      byChain,
      byProtocol,
    };
  }

  async getLiquidationAlerts(address: string): Promise<any[]> {
    const positions = await this.getCollateralPositions(address);
    const alerts: any[] = [];

    for (const pos of positions) {
      if (pos.healthFactor < 1.2) {
        alerts.push({
          type: 'liquidation_warning',
          severity: pos.healthFactor < 1.05 ? 'critical' : 'high',
          position: pos,
          message: `${pos.collateralToken} on ${pos.protocol} (${pos.chain}) is at risk of liquidation`,
        });
      }

      const priceChange = (pos.currentPrice - pos.liquidationPrice) / pos.currentPrice;
      if (priceChange < 0.1) {
        alerts.push({
          type: 'price_approaching_liquidation',
          severity: priceChange < 0.05 ? 'critical' : 'medium',
          position: pos,
          message: `${pos.collateralToken} price is within ${(priceChange * 100).toFixed(1)}% of liquidation price`,
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  async getOptimizationSuggestions(address: string): Promise<any[]> {
    const summary = await this.getCollateralSummary(address);
    const suggestions: any[] = [];

    if (summary.overallHealthFactor < 1.5) {
      suggestions.push({
        type: 'increase_collateral',
        priority: 'high',
        message: 'Your health factor is low. Consider adding more collateral to avoid liquidation.',
        potentialBenefit: 'Reduce liquidation risk',
      });
    }

    if (summary.overallHealthFactor > 3) {
      suggestions.push({
        type: 'optimize_borrowing',
        priority: 'medium',
        message: 'Your health factor is healthy. You may be able to borrow more efficiently.',
        potentialBenefit: 'Increase capital efficiency',
      });
    }

    const stablecoinRatio = Object.entries(summary.byProtocol)
      .filter(([protocol]) => ['Aave', 'Compound'].includes(protocol))
      .reduce((sum, [, data]) => sum + data.collateral, 0) / summary.totalCollateralValue;

    if (stablecoinRatio < 0.2) {
      suggestions.push({
        type: 'diversify_collateral',
        priority: 'low',
        message: 'Consider diversifying your collateral with stablecoins for lower volatility.',
        potentialBenefit: 'Reduce portfolio volatility',
      });
    }

    return suggestions;
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  getSupportedProtocols(): string[] {
    return this.supportedProtocols;
  }
}

@Controller('defi-collateral-tracker')
export class DefiCollateralTrackerController {
  constructor(private readonly service: DefiCollateralTrackerService) {}

  @Get('positions/:address')
  async getPositions(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ): Promise<CollateralPosition[]> {
    const chainList = chains ? chains.split(',') : undefined;
    return this.service.getCollateralPositions(address, chainList);
  }

  @Get('summary/:address')
  async getSummary(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ): Promise<CollateralSummary> {
    const chainList = chains ? chains.split(',') : undefined;
    return this.service.getCollateralSummary(address, chainList);
  }

  @Get('alerts/:address')
  async getAlerts(@Param('address') address: string): Promise<any[]> {
    return this.service.getLiquidationAlerts(address);
  }

  @Get('suggestions/:address')
  async getSuggestions(@Param('address') address: string): Promise<any[]> {
    return this.service.getOptimizationSuggestions(address);
  }

  @Get('chains')
  async getChains(): Promise<string[]> {
    return this.service.getSupportedChains();
  }

  @Get('protocols')
  async getProtocols(): Promise<string[]> {
    return this.service.getSupportedProtocols();
  }
}
