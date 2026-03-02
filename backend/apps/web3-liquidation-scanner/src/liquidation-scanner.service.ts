import { Injectable } from '@nestjs/common';

interface LiquidationOpportunity {
  id: string;
  address: string;
  protocol: string;
  chain: string;
  collateralValueUsd: number;
  debtValueUsd: number;
  healthFactor: number;
  liquidationIncentive: number;
  estimatedProfit: number;
}

interface Position {
  address: string;
  protocol: string;
  chain: string;
  healthFactor: number;
  status: string;
  collateral: { symbol: string; amount: number; valueUsd: number }[];
  debt: { symbol: string; amount: number; valueUsd: number }[];
}

interface Alert {
  id: string;
  address: string;
  protocol: string;
  chain: string;
  type: string;
  healthFactor: number;
  message: string;
  createdAt: string;
}

interface ChainInfo {
  name: string;
  displayName: string;
}

interface ProtocolInfo {
  name: string;
  chain: string;
}

@Injectable()
export class LiquidationScannerService {
  // Simulated liquidation opportunities
  private generateOpportunities(): LiquidationOpportunity[] {
    const protocols = ['Aave V3', 'Aave V2', 'Compound', 'Liquity', 'Morpho'];
    const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base', 'Avalanche'];
    
    const opportunities: LiquidationOpportunity[] = [];
    
    for (let i = 0; i < 25; i++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const healthFactor = 0.8 + Math.random() * 0.4;
      const collateralValueUsd = 10000 + Math.random() * 500000;
      const debtValueUsd = collateralValueUsd * (1 - healthFactor / 2);
      const liquidationIncentive = protocol.includes('Aave') ? 5 : protocol.includes('Compound') ? 8 : 10;
      const estimatedProfit = (debtValueUsd * liquidationIncentive / 100) - (debtValueUsd * 0.01);
      
      opportunities.push({
        id: `opp-${i}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        protocol,
        chain,
        collateralValueUsd: Math.round(collateralValueUsd),
        debtValueUsd: Math.round(debtValueUsd),
        healthFactor: Math.round(healthFactor * 100) / 100,
        liquidationIncentive,
        estimatedProfit: Math.round(estimatedProfit * 100) / 100
      });
    }
    
    return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }

  // Simulated positions
  private generatePositions(): Position[] {
    const protocols = ['Aave V3', 'Aave V2', 'Compound', 'Liquity', 'Morpho'];
    const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base', 'Avalanche'];
    const tokens = [
      { symbol: 'ETH', price: 2500 },
      { symbol: 'WBTC', price: 45000 },
      { symbol: 'USDC', price: 1 },
      { symbol: 'USDT', price: 1 },
      { symbol: 'DAI', price: 1 },
      { symbol: 'stETH', price: 2400 },
    ];
    
    const positions: Position[] = [];
    
    for (let i = 0; i < 30; i++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const healthFactor = 0.5 + Math.random() * 2;
      
      const collateral: { symbol: string; amount: number; valueUsd: number }[] = [];
      const debt: { symbol: string; amount: number; valueUsd: number }[] = [];
      
      // Random collateral
      const numCollateral = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numCollateral; j++) {
        const token = tokens[Math.floor(Math.random() * tokens.length)];
        const amount = 1 + Math.random() * 50;
        collateral.push({
          symbol: token.symbol,
          amount: Math.round(amount * 1000) / 1000,
          valueUsd: Math.round(amount * token.price)
        });
      }
      
      // Random debt
      const numDebt = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < numDebt; j++) {
        const token = tokens[Math.floor(Math.random() * 3)]; // Stablecoins
        const amount = 1000 + Math.random() * 50000;
        debt.push({
          symbol: token.symbol,
          amount: Math.round(amount * 1000) / 1000,
          valueUsd: Math.round(amount)
        });
      }
      
      let status = 'healthy';
      if (healthFactor < 1) status = 'danger';
      else if (healthFactor < 1.5) status = 'warning';
      
      positions.push({
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        protocol,
        chain,
        healthFactor: Math.round(healthFactor * 100) / 100,
        status,
        collateral,
        debt
      });
    }
    
    return positions;
  }

  // Generate alerts
  private generateAlerts(): Alert[] {
    const protocols = ['Aave V3', 'Aave V2', 'Compound', 'Liquity', 'Morpho'];
    const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon'];
    const types = ['health_factor_warning', 'liquidation_risk', 'position_healthy'];
    
    const alerts: Alert[] = [];
    
    for (let i = 0; i < 15; i++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const healthFactor = 0.5 + Math.random() * 1.5;
      
      let message = '';
      if (type === 'health_factor_warning') {
        message = `Health factor is ${healthFactor.toFixed(2)}, below threshold`;
      } else if (type === 'liquidation_risk') {
        message = `High liquidation risk! Health factor: ${healthFactor.toFixed(2)}`;
      } else {
        message = `Position health improved to ${healthFactor.toFixed(2)}`;
      }
      
      alerts.push({
        id: `alert-${i}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        protocol,
        chain,
        type,
        healthFactor: Math.round(healthFactor * 100) / 100,
        message,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
      });
    }
    
    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStats() {
    const opportunities = this.generateOpportunities();
    const positions = this.generatePositions();
    
    const totalValueAtRisk = opportunities.reduce((sum, o) => sum + o.debtValueUsd, 0);
    const totalLiquidationValue = opportunities.reduce((sum, o) => sum + o.collateralValueUsd, 0);
    const avgHealthFactor = positions.reduce((sum, p) => sum + p.healthFactor, 0) / positions.length;
    
    return {
      totalValueAtRisk: Math.round(totalValueAtRisk),
      totalLiquidationValue: Math.round(totalLiquidationValue),
      activePositions: positions.length,
      avgHealthFactor: Math.round(avgHealthFactor * 100) / 100,
      opportunitiesCount: opportunities.length,
      dangerousPositions: positions.filter(p => p.healthFactor < 1).length
    };
  }

  async getOpportunities(chain?: string, protocol?: string, minProfit?: number) {
    let opportunities = this.generateOpportunities();
    
    if (chain) {
      opportunities = opportunities.filter(o => o.chain.toLowerCase() === chain.toLowerCase());
    }
    if (protocol) {
      opportunities = opportunities.filter(o => o.protocol.toLowerCase().includes(protocol.toLowerCase()));
    }
    if (minProfit) {
      opportunities = opportunities.filter(o => o.estimatedProfit >= minProfit);
    }
    
    return opportunities;
  }

  async getPositions() {
    return this.generatePositions();
  }

  async getAlerts(limit = 20) {
    return this.generateAlerts().slice(0, limit);
  }

  async getChains(): Promise<ChainInfo[]> {
    return [
      { name: 'ethereum', displayName: 'Ethereum' },
      { name: 'arbitrum', displayName: 'Arbitrum' },
      { name: 'optimism', displayName: 'Optimism' },
      { name: 'polygon', displayName: 'Polygon' },
      { name: 'base', displayName: 'Base' },
      { name: 'avalanche', displayName: 'Avalanche' }
    ];
  }

  async getProtocols(): Promise<ProtocolInfo[]> {
    return [
      { name: 'Aave V3', chain: 'Ethereum' },
      { name: 'Aave V3', chain: 'Arbitrum' },
      { name: 'Aave V3', chain: 'Optimism' },
      { name: 'Aave V3', chain: 'Polygon' },
      { name: 'Aave V3', chain: 'Base' },
      { name: 'Aave V2', chain: 'Ethereum' },
      { name: 'Compound', chain: 'Ethereum' },
      { name: 'Compound', chain: 'Arbitrum' },
      { name: 'Liquity', chain: 'Ethereum' },
      { name: 'Morpho', chain: 'Ethereum' },
      { name: 'Morpho', chain: 'Optimism' }
    ];
  }
}
