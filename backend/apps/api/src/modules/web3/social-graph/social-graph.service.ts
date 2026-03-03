import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface AddressInteraction {
  address: string;
  label?: string;
  type: 'sent' | 'received' | 'both';
  count: number;
  volume: number;
  firstInteraction: number;
  lastInteraction: number;
}

interface GraphNode {
  id: string;
  label?: string;
  type: 'address' | 'contract' | 'exchange' | 'dao' | 'unknown';
  centrality: number;
  totalVolume: number;
  txCount: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  volume: number;
  type: string;
}

interface SocialGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  statistics: {
    totalNodes: number;
    totalEdges: number;
    totalVolume: number;
    avgDegree: number;
    density: number;
    clusters: number;
  };
  centralAddresses: GraphNode[];
  communities: string[][];
}

@Injectable()
export class SocialGraphService {
  private readonly chains = {
    ethereum: 'eth',
    polygon: 'polygon',
    arbitrum: 'arb',
    optimism: 'opt',
    bsc: 'bsc',
    base: 'base',
    avalanche: 'avax',
  };

  private readonly knownLabels: Record<string, { type: string; label: string }> = {
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': { type: 'vitalik', label: 'Vitalik Buterin' },
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': { type: 'exchange', label: 'Uniswap V2 Router' },
    '0xE592427A0AEce92De3Edee1F18E0157C05861564': { type: 'exchange', label: 'Uniswap V3 Router' },
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': { type: 'exchange', label: 'Uniswap V3 Factory' },
    '0xCBcdf492a09412F867058b58DBd8c8D5E2b4404c': { type: 'exchange', label: 'SushiSwap: Router' },
    '0x10ED43C718714eb63d5aA57B78B54704E256024E': { type: 'exchange', label: 'PancakeSwap Router' },
    '0x8BA1f109551bD432803012645Ac136ddd64DBA72': { type: 'exchange', label: 'Curve Finance' },
    '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': { type: 'dao', label: 'Aave DAO' },
    '0x5f4dC7c04B6Da0bEEd04bB45A0eA3D4E45D2a7e8': { type: 'dao', label: 'Uniswap DAO' },
  };

  constructor(private readonly httpService: HttpService) {}

  async analyzeAddress(address: string, chain: string = 'ethereum', depth: number = 2): Promise<SocialGraphResult> {
    const chainId = this.chains[chain.toLowerCase()] || 'eth';
    
    // Simulate graph analysis (in production, would query indexers/graph nodes)
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    // Root address
    const rootLabel = this.getKnownLabel(address);
    nodes.push({
      id: address.toLowerCase(),
      label: rootLabel?.label || address.substring(0, 10) + '...',
      type: this.getAddressType(address, rootLabel),
      centrality: 100,
      totalVolume: Math.random() * 10000000 + 100000,
      txCount: Math.floor(Math.random() * 5000) + 100,
    });

    // Generate simulated connected addresses based on depth
    const connectedCount = Math.min(Math.pow(8, depth), 50);
    for (let i = 0; i < connectedCount; i++) {
      const connectedAddress = this.generateAddress(i);
      const connectedLabel = this.getKnownLabel(connectedAddress);
      
      nodes.push({
        id: connectedAddress.toLowerCase(),
        label: connectedLabel?.label || connectedAddress.substring(0, 10) + '...',
        type: this.getAddressType(connectedAddress, connectedLabel),
        centrality: Math.random() * 80 + 10,
        totalVolume: Math.random() * 5000000 + 10000,
        txCount: Math.floor(Math.random() * 1000) + 10,
      });

      // Create edges
      if (Math.random() > 0.3) {
        edges.push({
          source: address.toLowerCase(),
          target: connectedAddress.toLowerCase(),
          weight: Math.random() * 10 + 1,
          volume: Math.random() * 1000000 + 1000,
          type: Math.random() > 0.5 ? 'transfer' : 'swap',
        });
      }
    }

    // Add some cross-connections for depth > 1
    if (depth > 1) {
      for (let i = 1; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() > 0.85) {
            edges.push({
              source: nodes[i].id,
              target: nodes[j].id,
              weight: Math.random() * 5 + 0.5,
              volume: Math.random() * 500000 + 500,
              type: Math.random() > 0.5 ? 'transfer' : 'contract_call',
            });
          }
        }
      }
    }

    // Calculate statistics
    const totalVolume = nodes.reduce((sum, n) => sum + n.totalVolume, 0);
    const avgDegree = edges.length > 0 ? (edges.length * 2) / nodes.length : 0;
    const density = nodes.length > 1 ? edges.length / (nodes.length * (nodes.length - 1) / 2) : 0;
    
    // Simple clustering
    const visited = new Set<string>();
    const communities: string[][] = [];
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const community = this.findCommunity(node.id, edges, visited);
        if (community.length > 1) {
          communities.push(community);
        }
      }
    });

    // Central addresses (top 5 by centrality)
    const centralAddresses = [...nodes]
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 5);

    return {
      nodes,
      edges,
      statistics: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalVolume,
        avgDegree: parseFloat(avgDegree.toFixed(2)),
        density: parseFloat(density.toFixed(4)),
        communities: communities.length,
      },
      centralAddresses,
      communities: communities.slice(0, 5),
    };
  }

  async getAddressInteractions(address: string, chain: string = 'ethereum', limit: number = 50): Promise<AddressInteraction[]> {
    const chainId = this.chains[chain.toLowerCase()] || 'eth';
    
    // Simulate interaction data
    const interactions: AddressInteraction[] = [];
    const interactionCount = Math.min(limit, 30);
    
    for (let i = 0; i < interactionCount; i++) {
      const interactingAddress = this.generateAddress(i + 100);
      const label = this.getKnownLabel(interactingAddress);
      
      interactions.push({
        address: interactingAddress,
        label: label?.label,
        type: Math.random() > 0.5 ? 'sent' : Math.random() > 0.5 ? 'received' : 'both',
        count: Math.floor(Math.random() * 100) + 1,
        volume: Math.random() * 1000000 + 1000,
        firstInteraction: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastInteraction: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
    
    return interactions.sort((a, b) => b.volume - a.volume);
  }

  async compareAddresses(addresses: string[], chain: string = 'ethereum'): Promise<{
    commonConnections: string[];
    totalVolume: number;
    similarity: number;
    sharedProtocols: string[];
  }> {
    // Find common connections
    const allConnections = new Set<string>();
    const connectionCounts = new Map<string, number>();
    
    for (const addr of addresses) {
      for (let i = 0; i < 20; i++) {
        const conn = this.generateAddress(addr.charCodeAt(0) + i);
        allConnections.add(conn);
        connectionCounts.set(conn, (connectionCounts.get(conn) || 0) + 1);
      }
    }
    
    // Common connections appear in multiple addresses
    const commonConnections = Array.from(connectionCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([addr]) => addr)
      .slice(0, 10);
    
    // Simulated shared protocols
    const protocols = ['Uniswap', 'Aave', 'Compound', 'Curve', 'SushiSwap', 'OpenSea'];
    const sharedProtocols = protocols.filter(() => Math.random() > 0.5).slice(0, 3);
    
    const similarity = addresses.length > 1 
      ? commonConnections.length / (addresses.length * 10) 
      : 0;
    
    return {
      commonConnections,
      totalVolume: Math.random() * 10000000 * addresses.length,
      similarity: parseFloat(Math.min(similarity * 100, 100).toFixed(2)),
      sharedProtocols,
    };
  }

  async findInfluencers(chain: string = 'ethereum', minVolume: number = 1000000): Promise<{
    influencers: Array<{
      address: string;
      label?: string;
      followers: number;
      influence: number;
      category: string;
    }>;
  }> {
    const influencers = [];
    const categories = ['whale', 'trader', 'dao_member', 'defi_user', 'nft_collector', 'developer'];
    
    for (let i = 0; i < 20; i++) {
      const address = this.generateAddress(i);
      const label = this.getKnownLabel(address);
      
      influencers.push({
        address,
        label: label?.label,
        followers: Math.floor(Math.random() * 10000) + 100,
        influence: Math.random() * 100,
        category: categories[Math.floor(Math.random() * categories.length)],
      });
    }
    
    return {
      influencers: influencers.sort((a, b) => b.influence - a.influence),
    };
  }

  private getKnownLabel(address: string): { type: string; label: string } | undefined {
    const normalizedAddress = address.toLowerCase();
    return this.knownLabels[normalizedAddress];
  }

  private getAddressType(address: string, label?: { type: string; label: string }): 'address' | 'contract' | 'exchange' | 'dao' | 'unknown' {
    if (label) {
      if (label.type === 'exchange') return 'exchange';
      if (label.type === 'dao') return 'dao';
      if (label.type === 'vitalik') return 'address';
    }
    
    // Heuristic: contracts have specific patterns
    if (address.startsWith('0x') && address.length === 42) {
      const lastChars = address.slice(-4);
      if (lastChars === '0000') return 'contract';
    }
    
    return 'address';
  }

  private generateAddress(seed: number): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[(seed * (i + 1) * 7) % 16];
    }
    return address;
  }

  private findCommunity(startNode: string, edges: GraphEdge[], visited: Set<string>): string[] {
    const community: string[] = [startNode];
    visited.add(startNode);
    
    const queue = [startNode];
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      edges.forEach(edge => {
        let neighbor: string | null = null;
        if (edge.source === current && !visited.has(edge.target)) {
          neighbor = edge.target;
        } else if (edge.target === current && !visited.has(edge.source)) {
          neighbor = edge.source;
        }
        
        if (neighbor && edge.weight > 2) {
          visited.add(neighbor);
          community.push(neighbor);
          queue.push(neighbor);
        }
      });
    }
    
    return community;
  }
}
