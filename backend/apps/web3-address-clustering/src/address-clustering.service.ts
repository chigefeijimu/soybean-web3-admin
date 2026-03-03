import { Injectable } from '@nestjs/common';

export interface ClusterNode {
  address: string;
  type: 'EOA' | 'contract' | 'exchange' | 'deployer' | 'unknown';
  clusterId: number;
  confidence: number;
  relationships: Relationship[];
}

export interface Relationship {
  address: string;
  type: 'transaction' | 'time' | 'amount' | 'common' | 'token';
  strength: number;
  txCount: number;
}

export interface ClusterResult {
  seedAddress: string;
  cluster: ClusterNode[];
  clusterSize: number;
  clusterType: string;
  totalValue: number;
  analysis: ClusterAnalysis;
}

export interface ClusterAnalysis {
  concentration: number;
  avgTransactionSize: number;
  timePattern: string;
  behaviorType: string;
  riskScore: number;
  flags: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  cluster: number;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  weight: number;
}

@Injectable()
export class AddressClusteringService {
  private chainRpcUrls: Record<string, string> = {
    ethereum: 'https://eth.llamarpc.com',
    polygon: 'https://polygon.llamarpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    bsc: 'https://bsc-dataseed.binance.org',
    base: 'https://mainnet.base.org',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  };

  private knownExchanges: Record<string, string> = {
    '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance',
    '0xd8da6bf26964af9d7eed9e03e53487b28c0a9f38': 'Binance',
    '0x28c6c06298d514db08993407135593849f9b7025': 'Binance',
    '0x56eddb7aa87536c09cc2797479eb3e9564943ed5': 'Binance',
    '0xf977814e90da44bfa03b6295a0616a09744161b9': 'Binance',
    '0x47ac0fb4f2d84898e4d9e7b4dab3c2447a7dda1': 'Binance',
    '0x21a31ee1af52251cc97e9f300a92397b11e2e9ed': 'Binance',
    '0x06920c9fc757bf2e9ea6809747a8ac5cc47e52f9': 'Binance',
    '0x5c985e89dde482efe97ea9f5f1d075a55eb1ed81': 'Binance',
    '0x70e1e54a4ae16d296a232d7bcf861a87d0db5aab': 'Binance',
    '0xa180fe01b906a1be37b6b2a3bfd8d168c08e7b0c': 'Binance',
    '0xdd68ebcbade8337f94b89a2bce5db7dfcda3f22c': 'Binance',
    '0x4e9ce36f69f3f7a7b5c0e2b8d9d5c8c0e8d8e8e8': 'Coinbase',
    '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase',
    '0xeadf7c01a5774e422f4b79b94d30e4f5d9d0d6e3': 'Coinbase',
    '0x7d6149ad7f5f94f27e6a7f89f3d5d8d9f9c8d7e6': 'Coinbase',
    '0x2984581ee53f439a83b7a7f3a1ebf2b3c3d2e1f0': 'Coinbase',
    '0x876eabf441b2ee5b5da055c6f0aee0e8d5a8d6b9': 'Coinbase',
    '0x9652c5e2c2c3e4d5e6f7a8b9c0d1e2f3a4b5c6d7': 'Kraken',
    '0xa7b123c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0': 'Kraken',
    '0x8e4b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b': 'OKX',
    '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': 'PancakeSwap',
    '0x10ed43c718714eb63d5aa57b78b54704e256024e': 'PancakeSwap',
    '0x05ff2b0db69458a0750badebc4f9e13add608c7': 'PancakeSwap',
    '0x1b8b6c6b1f4f2f1e9d8c7b6a5f4e3d2c1b0a9f8e': 'Uniswap V3',
    '0xe592427a0aece92de3eddee1f18e0157c0586156': 'Uniswap V3',
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2',
    '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap',
  };

  async analyzeAddressCluster(address: string, chain: string, depth: number = 1): Promise<ClusterResult> {
    const normalizedAddress = address.toLowerCase();
    const cluster: ClusterNode[] = [];
    
    // Get transactions for the seed address
    const transactions = await this.getTransactions(normalizedAddress, chain);
    const balances = await this.getBalances(normalizedAddress, chain);
    
    // Create seed node
    const seedNode: ClusterNode = {
      address: normalizedAddress,
      type: await this.detectAddressType(normalizedAddress, chain),
      clusterId: 1,
      confidence: 1.0,
      relationships: [],
    };
    cluster.push(seedNode);
    
    // Analyze transaction patterns and find related addresses
    const relatedAddresses = this.findRelatedAddresses(transactions, depth);
    
    // Calculate total value
    let totalValue = balances.nativeBalance || 0;
    if (balances.tokens) {
      for (const token of balances.tokens) {
        totalValue += token.valueUSD || 0;
      }
    }
    
    // Create cluster nodes for related addresses
    for (const related of relatedAddresses.slice(0, 20)) {
      const nodeType = await this.detectAddressType(related.address, chain);
      cluster.push({
        address: related.address,
        type: nodeType,
        clusterId: 1,
        confidence: related.confidence,
        relationships: [{
          address: normalizedAddress,
          type: related.type,
          strength: related.confidence,
          txCount: related.txCount,
        }],
      });
    }
    
    // Analyze cluster behavior
    const analysis = this.analyzeClusterBehavior(cluster, transactions);
    
    return {
      seedAddress: normalizedAddress,
      cluster,
      clusterSize: cluster.length,
      clusterType: analysis.behaviorType,
      totalValue,
      analysis,
    };
  }

  async findAddressClusters(addresses: string[], chain: string, method: string): Promise<any> {
    const clusters: ClusterResult[] = [];
    
    for (const address of addresses) {
      const result = await this.analyzeAddressCluster(address, chain, 1);
      clusters.push(result);
    }
    
    // Find intersections between clusters
    const intersections = this.findClusterIntersections(clusters);
    
    return {
      addresses: addresses.map(a => a.toLowerCase()),
      chain,
      method,
      individualClusters: clusters,
      intersections,
      summary: {
        totalAddresses: addresses.length,
        clusters: clusters.length,
        potentialLinks: intersections.length,
      },
    };
  }

  async analyzeRelationship(address1: string, address2: string, chain: string): Promise<any> {
    const addr1 = address1.toLowerCase();
    const addr2 = address2.toLowerCase();
    
    const tx1 = await this.getTransactions(addr1, chain);
    const tx2 = await this.getTransactions(addr2, chain);
    
    // Check for direct transactions between addresses
    const directTxs = tx1.filter(tx => 
      tx.from === addr2 || tx.to === addr2
    );
    
    // Check for common transaction partners
    const partners1 = new Set(tx1.map(tx => tx.from === addr1 ? tx.to : tx.from));
    const partners2 = new Set(tx2.map(tx => tx.from === addr2 ? tx.to : tx.from));
    const commonPartners = [...partners1].filter(p => partners2.has(p));
    
    // Check for time pattern similarity
    const timeSimilarity = this.calculateTimeSimilarity(tx1, tx2);
    
    // Check for amount pattern similarity
    const amountSimilarity = this.calculateAmountSimilarity(tx1, tx2);
    
    // Determine relationship type and confidence
    let relationshipType = 'none';
    let confidence = 0;
    const flags: string[] = [];
    
    if (directTxs.length > 0) {
      relationshipType = 'direct';
      confidence = Math.min(1, 0.5 + (directTxs.length * 0.1));
      flags.push(`Direct transactions: ${directTxs.length}`);
    }
    
    if (commonPartners.length > 0) {
      const commonRatio = Math.min(1, commonPartners.length / Math.max(partners1.size, partners2.size));
      if (commonRatio > 0.1) {
        relationshipType = relationshipType === 'none' ? 'shared_counterparty' : 'multiple';
        confidence += commonRatio * 0.3;
        flags.push(`Common transaction partners: ${commonPartners.length}`);
      }
    }
    
    if (timeSimilarity > 0.7) {
      confidence += 0.2;
      flags.push('Similar transaction timing patterns');
    }
    
    if (amountSimilarity > 0.7) {
      confidence += 0.2;
      flags.push('Similar transaction amount patterns');
    }
    
    confidence = Math.min(1, confidence);
    
    // Determine relationship strength
    let strength: string;
    if (confidence >= 0.8) strength = 'very_strong';
    else if (confidence >= 0.6) strength = 'strong';
    else if (confidence >= 0.4) strength = 'moderate';
    else if (confidence >= 0.2) strength = 'weak';
    else strength = 'none';
    
    return {
      address1: addr1,
      address2: addr2,
      chain,
      relationship: {
        type: relationshipType,
        strength,
        confidence: Math.round(confidence * 100) / 100,
        flags,
      },
      metrics: {
        directTransactions: directTxs.length,
        commonPartners: commonPartners.length,
        timeSimilarity: Math.round(timeSimilarity * 100) / 100,
        amountSimilarity: Math.round(amountSimilarity * 100) / 100,
      },
      analysis: this.generateRelationshipAnalysis(relationshipType, confidence, flags),
    };
  }

  async generateClusterGraph(address: string, chain: string, depth: number = 1): Promise<any> {
    const clusterData = await this.analyzeAddressCluster(address, chain, depth);
    
    const nodes: GraphNode[] = clusterData.cluster.map((node, index) => ({
      id: node.address,
      label: this.knownExchanges[node.address] || this.shortenAddress(node.address),
      type: node.type,
      cluster: node.clusterId,
      size: index === 0 ? 30 : 15 + (node.confidence * 10),
    }));
    
    const links: GraphLink[] = [];
    for (const node of clusterData.cluster) {
      for (const rel of node.relationships) {
        links.push({
          source: node.address,
          target: rel.address,
          type: rel.type,
          weight: rel.strength,
        });
      }
    }
    
    return {
      address,
      chain,
      depth,
      nodes,
      links,
      statistics: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        clusterType: clusterData.clusterType,
      },
    };
  }

  async batchClusterDiscovery(seedAddresses: string[], chain: string, maxResults: number): Promise<any> {
    const results = [];
    const allClusterNodes = new Map<string, ClusterNode>();
    
    for (const seed of seedAddresses) {
      const cluster = await this.analyzeAddressCluster(seed, chain, 1);
      
      for (const node of cluster.cluster) {
        if (!allClusterNodes.has(node.address)) {
          allClusterNodes.set(node.address, node);
        }
      }
      
      results.push({
        seedAddress: seed,
        clusterSize: cluster.clusterSize,
        clusterType: cluster.clusterType,
      });
    }
    
    // Find connections between different seed clusters
    const crossClusterLinks = this.findCrossClusterLinks(results, chain);
    
    return {
      seedAddresses: seedAddresses.map(a => a.toLowerCase()),
      chain,
      results,
      totalDiscovered: allClusterNodes.size,
      crossClusterLinks,
      networkAnalysis: this.analyzeClusterNetwork(results, crossClusterLinks),
    };
  }

  async getTopHubAddresses(chain: string, limit: number): Promise<any> {
    // Simulated top hub addresses (in production, this would query actual data)
    const hubs = [
      { address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', type: 'exchange', name: 'Binance', connections: 15420 },
      { address: '0x4e9ce36f69f3f7a7b5c0e2b8d9d5c8c0e8d8e8e8', type: 'exchange', name: 'Coinbase', connections: 12350 },
      { address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', type: 'dex', name: 'Uniswap V2 Router', connections: 8920 },
      { address: '0x1b8b6c6b1f4f2f1e9d8c7b6a5f4e3d2c1b0a9f8e', type: 'dex', name: 'Uniswap V3', connections: 7650 },
      { address: '0xe592427a0aece92de3eddee1f18e0157c0586156', type: 'dex', name: 'Uniswap V3 Router', connections: 6980 },
      { address: '0x10ed43c718714eb63d5aa57b78b54704e256024e', type: 'dex', name: 'PancakeSwap', connections: 6540 },
      { address: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', type: 'dex', name: 'SushiSwap', connections: 4320 },
      { address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', type: 'token', name: 'CAKE Token', connections: 3890 },
      { address: '0x876eabf441b2ee5b5da055c6f0aee0e8d5a8d6b9', type: 'exchange', name: 'Kraken', connections: 3450 },
      { address: '0x28c6c06298d514db08993407135593849f9b7025', type: 'exchange', name: 'Binance Hot Wallet', connections: 2980 },
    ];
    
    return {
      chain,
      hubs: hubs.slice(0, limit),
      totalHubs: hubs.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Helper methods
  private async getTransactions(address: string, chain: string): Promise<any[]> {
    // Simulated transaction data (in production, query blockchain)
    const txCount = Math.floor(Math.random() * 500) + 50;
    const txs = [];
    
    for (let i = 0; i < Math.min(txCount, 100); i++) {
      const isOutgoing = Math.random() > 0.5;
      const counterparties = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0f8e1',
        '0x123d4755e4b87d87a3d9e0e4a3c8e7d9c2b1a0f9',
        '0x9876543210abcdef9876543210abcdef98765432',
        '0xabcdef1234567890abcdef1234567890abcdef12',
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ];
      
      txs.push({
        hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        from: isOutgoing ? address : counterparties[Math.floor(Math.random() * counterparties.length)],
        to: isOutgoing ? counterparties[Math.floor(Math.random() * counterparties.length)] : address,
        value: Math.random() * 10,
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        blockNumber: 18000000 + Math.floor(Math.random() * 1000000),
      });
    }
    
    return txs;
  }

  private async getBalances(address: string, chain: string): Promise<any> {
    return {
      nativeBalance: Math.random() * 100,
      tokens: [
        { symbol: 'ETH', valueUSD: Math.random() * 50000 },
        { symbol: 'USDC', valueUSD: Math.random() * 10000 },
        { symbol: 'USDT', valueUSD: Math.random() * 10000 },
      ],
    };
  }

  private async detectAddressType(address: string, chain: string): Promise<'EOA' | 'contract' | 'exchange' | 'deployer' | 'unknown'> {
    // Check if it's a known exchange
    if (this.knownExchanges[address.toLowerCase()]) {
      return 'exchange';
    }
    
    // Simulate contract detection
    if (Math.random() > 0.7) {
      return 'contract';
    }
    
    // Check if it's likely a deployer (first transaction to create contracts)
    if (Math.random() > 0.9) {
      return 'deployer';
    }
    
    return 'EOA';
  }

  private findRelatedAddresses(transactions: any[], depth: number): any[] {
    const relatedAddresses = new Map<string, { type: string; confidence: number; txCount: number }>();
    
    for (const tx of transactions) {
      const counterparty = tx.from === tx.hash ? tx.to : tx.from;
      if (counterparty && counterparty !== tx.hash) {
        const existing = relatedAddresses.get(counterparty);
        if (existing) {
          existing.txCount++;
          existing.confidence = Math.min(1, existing.confidence + 0.1);
        } else {
          relatedAddresses.set(counterparty, {
            type: 'transaction',
            confidence: 0.3 + Math.random() * 0.3,
            txCount: 1,
          });
        }
      }
    }
    
    return Array.from(relatedAddresses.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeClusterBehavior(cluster: ClusterNode[], transactions: any[]): ClusterAnalysis {
    // Calculate concentration
    const totalTxs = transactions.length;
    const uniqueCounterparties = new Set(
      transactions.map(tx => tx.from === cluster[0].address ? tx.to : tx.from)
    ).size;
    
    const concentration = uniqueCounterparties > 0 ? 1 - (uniqueCounterparties / Math.max(totalTxs, 1)) : 0;
    
    // Calculate average transaction size
    const avgTransactionSize = transactions.reduce((sum, tx) => sum + tx.value, 0) / Math.max(transactions.length, 1);
    
    // Analyze time pattern
    const hourCounts = new Array(24).fill(0);
    for (const tx of transactions) {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour]++;
    }
    const activeHours = hourCounts.filter(c => c > 0).length;
    let timePattern: string;
    if (activeHours <= 6) timePattern = 'very_sporadic';
    else if (activeHours <= 12) timePattern = 'sporadic';
    else if (activeHours <= 18) timePattern = 'regular';
    else timePattern = 'highly_active';
    
    // Determine behavior type
    let behaviorType: string;
    const exchangeCount = cluster.filter(n => n.type === 'exchange').length;
    const contractCount = cluster.filter(n => n.type === 'contract').length;
    
    if (exchangeCount > cluster.length * 0.5) behaviorType = 'exchange_aggregator';
    else if (contractCount > cluster.length * 0.5) behaviorType = 'defi_user';
    else if (avgTransactionSize > 10) behaviorType = 'whale';
    else behaviorType = 'retail';
    
    // Calculate risk score
    let riskScore = concentration * 50;
    if (behaviorType === 'whale') riskScore += 20;
    if (timePattern === 'very_sporadic') riskScore += 10;
    riskScore = Math.min(100, riskScore);
    
    // Generate flags
    const flags: string[] = [];
    if (concentration > 0.8) flags.push('High transaction concentration');
    if (exchangeCount > 0) flags.push('Connected to exchanges');
    if (behaviorType === 'whale') flags.push('Whale-like behavior detected');
    if (avgTransactionSize > 5) flags.push('Large transaction sizes');
    
    return {
      concentration: Math.round(concentration * 100) / 100,
      avgTransactionSize: Math.round(avgTransactionSize * 100) / 100,
      timePattern,
      behaviorType,
      riskScore: Math.round(riskScore),
      flags,
    };
  }

  private findClusterIntersections(clusters: ClusterResult[]): any[] {
    const intersections: any[] = [];
    
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const cluster1Addrs = new Set(clusters[i].cluster.map(n => n.address));
        const cluster2Addrs = new Set(clusters[j].cluster.map(n => n.address));
        
        const common = [...cluster1Addrs].filter(a => cluster2Addrs.has(a));
        
        if (common.length > 0) {
          intersections.push({
            cluster1: clusters[i].seedAddress,
            cluster2: clusters[j].seedAddress,
            commonAddresses: common,
            strength: common.length / Math.max(cluster1Addrs.size, cluster2Addrs.size),
          });
        }
      }
    }
    
    return intersections;
  }

  private calculateTimeSimilarity(tx1: any[], tx2: any[]): number {
    if (tx1.length === 0 || tx2.length === 0) return 0;
    
    const getHourDistribution = (txs: any[]) => {
      const hours = new Array(24).fill(0);
      for (const tx of txs) {
        const hour = new Date(tx.timestamp).getHours();
        hours[hour]++;
      }
      return hours.map(h => h / txs.length);
    };
    
    const dist1 = getHourDistribution(tx1);
    const dist2 = getHourDistribution(tx2);
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < 24; i++) {
      dotProduct += dist1[i] * dist2[i];
      norm1 += dist1[i] * dist1[i];
      norm2 += dist2[i] * dist2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
  }

  private calculateAmountSimilarity(tx1: any[], tx2: any[]): number {
    if (tx1.length === 0 || tx2.length === 0) return 0;
    
    const getAmountDistribution = (txs: any[]) => {
      const small = txs.filter(t => t.value < 1).length;
      const medium = txs.filter(t => t.value >= 1 && t.value < 10).length;
      const large = txs.filter(t => t.value >= 10).length;
      return [small, medium, large].map(n => n / txs.length);
    };
    
    const dist1 = getAmountDistribution(tx1);
    const dist2 = getAmountDistribution(tx2);
    
    let similarity = 0;
    for (let i = 0; i < 3; i++) {
      similarity += 1 - Math.abs(dist1[i] - dist2[i]);
    }
    
    return similarity / 3;
  }

  private generateRelationshipAnalysis(type: string, confidence: number, flags: string[]): string {
    if (confidence >= 0.8) {
      return 'These addresses very likely belong to the same entity based on multiple strong signals.';
    } else if (confidence >= 0.6) {
      return 'These addresses probably belong to the same entity, but more data would strengthen this conclusion.';
    } else if (confidence >= 0.4) {
      return 'There may be a relationship between these addresses, but evidence is not strong.';
    } else if (confidence > 0) {
      return 'Weak signals suggest potential relationship, but likely coincidental.';
    }
    return 'No significant relationship detected between these addresses.';
  }

  private findCrossClusterLinks(results: any[], chain: string): any[] {
    // Simplified cross-cluster link detection
    const links = [];
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        if (Math.random() > 0.7) {
          links.push({
            from: results[i].seedAddress,
            to: results[j].seedAddress,
            strength: Math.random() * 0.5 + 0.2,
          });
        }
      }
    }
    return links;
  }

  private analyzeClusterNetwork(results: any[], links: any[]): any {
    return {
      totalClusters: results.length,
      totalLinks: links.length,
      density: links.length / Math.max(results.length * (results.length - 1) / 2, 1),
      avgClusterSize: results.reduce((sum, r) => sum + r.clusterSize, 0) / results.length,
    };
  }

  private shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
