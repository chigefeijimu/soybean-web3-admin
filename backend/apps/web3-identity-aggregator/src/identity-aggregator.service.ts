import { Injectable } from '@nestjs/common';

interface IdentityRecord {
  address: string;
  ens?: string;
  sol?: string;
  ud?: string;
  lens?: string;
  twitter?: string;
  github?: string;
  farcaster?: string;
}

interface ReputationScore {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    identityVerification: number;
    domainAge: number;
    socialConnections: number;
    crossChainPresence: number;
    activityLevel: number;
  };
}

interface SocialConnection {
  type: string;
  identifier: string;
  displayName: string;
  verified: boolean;
}

@Injectable()
export class IdentityAggregatorService {
  // Simulated database of known identities
  private identityDb: Map<string, IdentityRecord> = new Map();
  private domainDb: Map<string, string> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some sample data
    const sampleIdentities: IdentityRecord[] = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB1',
        ens: 'vitalik.eth',
        twitter: '@VitalikButerin',
        farcaster: 'vitalik',
      },
      {
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        ens: 'satoshi.eth',
        twitter: '@satoshi',
      },
      {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik actual
        ens: 'vitalik.eth',
        lens: 'lens/@vitalik',
        twitter: '@VitalikButerin',
      },
      {
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        ens: 'devcon.eth',
        twitter: '@ethereum',
      },
    ];

    sampleIdentities.forEach((identity) => {
      this.identityDb.set(identity.address.toLowerCase(), identity);
      if (identity.ens) {
        this.domainDb.set(identity.ens.toLowerCase(), identity.address.toLowerCase());
      }
    });
  }

  async resolveIdentity(address: string): Promise<any> {
    const normalizedAddress = address.toLowerCase();
    const identity = this.identityDb.get(normalizedAddress);

    if (!identity) {
      // Generate mock data for unknown addresses
      return {
        address: normalizedAddress,
        resolved: false,
        ens: this.generateMockEns(normalizedAddress),
        sol: this.generateMockSol(normalizedAddress),
        ud: this.generateMockUd(normalizedAddress),
      };
    }

    return {
      address: normalizedAddress,
      resolved: true,
      ens: identity.ens,
      sol: identity.sol,
      ud: identity.ud,
      lens: identity.lens,
      twitter: identity.twitter,
      github: identity.github,
      farcaster: identity.farcaster,
    };
  }

  async reverseResolve(domain: string): Promise<any> {
    const normalizedDomain = domain.toLowerCase();
    const address = this.domainDb.get(normalizedDomain);

    if (!address) {
      // Check domain type and return mock
      if (normalizedDomain.endsWith('.eth')) {
        return {
          domain: normalizedDomain,
          address: this.generateMockAddress(normalizedDomain),
          type: 'ENS',
          resolved: false,
        };
      } else if (normalizedDomain.endsWith('.sol')) {
        return {
          domain: normalizedDomain,
          address: this.generateMockAddress(normalizedDomain),
          type: 'Solana',
          resolved: false,
        };
      } else if (normalizedDomain.endsWith('.crypto') || normalizedDomain.endsWith('.nft')) {
        return {
          domain: normalizedDomain,
          address: this.generateMockAddress(normalizedDomain),
          type: 'Unstoppable',
          resolved: false,
        };
      }
      return { domain: normalizedDomain, resolved: false };
    }

    return {
      domain: normalizedDomain,
      address,
      type: 'ENS',
      resolved: true,
    };
  }

  async getIdentityProfile(address: string): Promise<any> {
    const normalizedAddress = address.toLowerCase();
    const identity = this.identityDb.get(normalizedAddress);

    const baseProfile = {
      address: normalizedAddress,
      primaryDomain: identity?.ens || this.generateMockEns(normalizedAddress),
      domains: {
        ens: identity?.ens || null,
        sol: identity?.sol || this.generateMockSol(normalizedAddress),
        ud: identity?.ud || this.generateMockUd(normalizedAddress),
      },
      social: {
        twitter: identity?.twitter || null,
        github: identity?.github || null,
        lens: identity?.lens || null,
        farcaster: identity?.farcaster || null,
      },
      verified: {
        ens: !!identity?.ens,
        twitter: !!identity?.twitter,
        lens: !!identity?.lens,
      },
      metadata: {
        createdAt: this.generateRandomDate(),
        lastUpdated: new Date().toISOString(),
        chainPresence: this.getChainPresence(normalizedAddress),
      },
    };

    return baseProfile;
  }

  async getReputationScore(address: string): Promise<ReputationScore> {
    const normalizedAddress = address.toLowerCase();
    const identity = this.identityDb.get(normalizedAddress);

    // Calculate reputation based on various factors
    const identityVerification = identity ? 30 : 10;
    const domainAge = Math.floor(Math.random() * 25) + 5;
    const socialConnections = identity ? Object.keys(identity).length * 10 : 5;
    const crossChainPresence = identity ? 20 : Math.floor(Math.random() * 10);
    const activityLevel = Math.floor(Math.random() * 20) + 10;

    const score = Math.min(
      100,
      identityVerification + domainAge + socialConnections + crossChainPresence + activityLevel
    );

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'S';
    else if (score >= 75) grade = 'A';
    else if (score >= 60) grade = 'B';
    else if (score >= 45) grade = 'C';
    else if (score >= 30) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      factors: {
        identityVerification,
        domainAge,
        socialConnections,
        crossChainPresence,
        activityLevel,
      },
    };
  }

  async getSocialGraph(address: string): Promise<any> {
    const normalizedAddress = address.toLowerCase();
    const identity = this.identityDb.get(normalizedAddress);

    // Generate mock social connections
    const connections: SocialConnection[] = [];

    if (identity?.twitter) {
      connections.push({
        type: 'twitter',
        identifier: identity.twitter,
        displayName: identity.twitter,
        verified: true,
      });
    }

    if (identity?.lens) {
      connections.push({
        type: 'lens',
        identifier: identity.lens,
        displayName: identity.lens,
        verified: true,
      });
    }

    if (identity?.farcaster) {
      connections.push({
        type: 'farcaster',
        identifier: identity.farcaster,
        displayName: identity.farcaster,
        verified: true,
      });
    }

    // Add some mock connections
    connections.push(
      {
        type: 'ens',
        identifier: `${normalizedAddress.slice(0, 8)}.eth`,
        displayName: `${normalizedAddress.slice(0, 8)}.eth`,
        verified: !!identity?.ens,
      },
      {
        type: 'lens',
        identifier: `lens/@user${normalizedAddress.slice(2, 6)}`,
        displayName: `@user${normalizedAddress.slice(2, 6)}`,
        verified: false,
      }
    );

    return {
      address: normalizedAddress,
      connections,
      totalConnections: connections.length,
      verifiedConnections: connections.filter((c) => c.verified).length,
      graph: this.generateMockGraph(normalizedAddress),
    };
  }

  async getCrossChainIdentities(address: string): Promise<any> {
    const normalizedAddress = address.toLowerCase();
    const identity = this.identityDb.get(normalizedAddress);

    return {
      address: normalizedAddress,
      identities: {
        ethereum: {
          address: normalizedAddress,
          ens: identity?.ens || null,
          primary: true,
        },
        solana: {
          address: this.generateMockSolAddress(normalizedAddress),
          domain: identity?.sol || null,
        },
        polygon: {
          address: this.generateMockPolygonAddress(normalizedAddress),
          domain: null,
        },
        arbitrum: {
          address: this.generateMockArbitrumAddress(normalizedAddress),
          domain: null,
        },
        optimism: {
          address: this.generateMockOptimismAddress(normalizedAddress),
          domain: null,
        },
        base: {
          address: this.generateMockBaseAddress(normalizedAddress),
          domain: null,
        },
        avalanche: {
          address: this.generateMockAvalancheAddress(normalizedAddress),
          domain: null,
        },
      },
      unifiedProfile: {
        displayName: identity?.ens || identity?.twitter || normalizedAddress.slice(0, 8),
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedAddress}`,
        verified: !!identity?.ens,
      },
    };
  }

  async getPopularDomains(chain?: string): Promise<any> {
    const domains = [
      { domain: 'vitalik.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'satoshi.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'devcon.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'paradigm.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'aave.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'uniswap.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'makerdao.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'curve.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: 'lido.eth', type: 'ENS', chain: 'ethereum', holders: 1 },
      { domain: '1inch.sol', type: 'Solana', chain: 'solana', holders: 15234 },
      { domain: 'raydium.sol', type: 'Solana', chain: 'solana', holders: 8934 },
      { domain: 'jupiter.sol', type: 'Solana', chain: 'solana', holders: 12456 },
      { domain: 'usdc.crypto', type: 'Unstoppable', chain: 'multi', holders: 45678 },
      { domain: 'btc.crypto', type: 'Unstoppable', chain: 'multi', holders: 34567 },
      { domain: 'eth.crypto', type: 'Unstoppable', chain: 'multi', holders: 23456 },
    ];

    if (chain) {
      return domains.filter((d) => d.chain === chain);
    }
    return domains;
  }

  async verifyIdentity(address: string, identity: string): Promise<any> {
    const normalizedAddress = address.toLowerCase();
    const normalizedIdentity = identity.toLowerCase();

    // Check if identity matches
    const existing = this.identityDb.get(normalizedAddress);
    const matches = existing
      ? Object.values(existing).some(
          (v) => v && v.toLowerCase() === normalizedIdentity
        )
      : false;

    return {
      address: normalizedAddress,
      identity: normalizedIdentity,
      verified: matches,
      timestamp: new Date().toISOString(),
    };
  }

  async getStats(): Promise<any> {
    return {
      totalIdentities: this.identityDb.size,
      totalDomains: this.domainDb.size,
      chains: ['ethereum', 'solana', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'],
      domainTypes: ['ENS', 'Solana', 'Unstoppable Domains', 'Lens', 'Farcaster'],
      verifiedProfiles: Math.floor(this.identityDb.size * 0.7),
      popularDomains: await this.getPopularDomains(),
    };
  }

  private generateMockEns(address: string): string {
    const adjectives = ['crypto', 'defi', 'web3', 'eth', 'moon', 'star', 'galaxy'];
    const nouns = ['whale', 'hunter', 'builder', 'degen', 'hodler', 'trader'];
    return `${adjectives[address.charCodeAt(2) % adjectives.length]}${nouns[address.charCodeAt(3) % nouns.length]}.eth`;
  }

  private generateMockSol(address: string): string {
    return `${address.slice(2, 8)}.sol`;
  }

  private generateMockUd(address: string): string {
    return `${address.slice(2, 10)}.crypto`;
  }

  private generateMockAddress(domain: string): string {
    return `0x${domain.replace(/[^a-f0-9]/g, '').slice(0, 40)}`;
  }

  private generateRandomDate(): string {
    const start = new Date(2015, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString();
  }

  private getChainPresence(address: string): string[] {
    const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'];
    const count = (address.charCodeAt(0) % 4) + 2;
    return chains.slice(0, count);
  }

  private generateMockGraph(address: string): any {
    return {
      nodes: [
        { id: address, type: 'self', label: 'You' },
        { id: '0x111', type: 'following', label: 'User1' },
        { id: '0x222', type: 'following', label: 'User2' },
        { id: '0x333', type: 'follower', label: 'User3' },
      ],
      edges: [
        { source: address, target: '0x111', type: 'follows' },
        { source: address, target: '0x222', type: 'follows' },
        { source: '0x333', source: address, type: 'follows' },
      ],
    };
  }

  private generateMockSolAddress(ethAddress: string): string {
    return `${ethAddress.slice(2, 10)}...${ethAddress.slice(-8)}`;
  }

  private generateMockPolygonAddress(ethAddress: string): string {
    return ethAddress;
  }

  private generateMockArbitrumAddress(ethAddress: string): string {
    return ethAddress;
  }

  private generateMockOptimismAddress(ethAddress: string): string {
    return ethAddress;
  }

  private generateMockBaseAddress(ethAddress: string): string {
    return ethAddress;
  }

  private generateMockAvalancheAddress(ethAddress: string): string {
    return ethAddress;
  }
}
