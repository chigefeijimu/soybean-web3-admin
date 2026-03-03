import { request } from '@/service/request';

export interface IdentityResolve {
  address: string;
  resolved: boolean;
  ens?: string;
  sol?: string;
  ud?: string;
  lens?: string;
  twitter?: string;
  github?: string;
  farcaster?: string;
}

export interface IdentityProfile {
  address: string;
  primaryDomain: string;
  domains: {
    ens: string | null;
    sol: string | null;
    ud: string | null;
  };
  social: {
    twitter: string | null;
    github: string | null;
    lens: string | null;
    farcaster: string | null;
  };
  verified: {
    ens: boolean;
    twitter: boolean;
    lens: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    chainPresence: string[];
  };
}

export interface ReputationScore {
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

export interface SocialGraph {
  address: string;
  connections: Array<{
    type: string;
    identifier: string;
    displayName: string;
    verified: boolean;
  }>;
  totalConnections: number;
  verifiedConnections: number;
  graph: any;
}

export interface CrossChainIdentities {
  address: string;
  identities: {
    ethereum: { address: string; ens: string | null; primary: boolean };
    solana: { address: string; domain: string | null };
    polygon: { address: string; domain: string | null };
    arbitrum: { address: string; domain: string | null };
    optimism: { address: string; domain: string | null };
    base: { address: string; domain: string | null };
    avalanche: { address: string; domain: string | null };
  };
  unifiedProfile: {
    displayName: string;
    avatar: string;
    verified: boolean;
  };
}

export const identityAggregator = {
  resolveAddress: (address: string) =>
    request.get<IdentityResolve>(`/identity-aggregator/resolve/${address}`),

  reverseResolve: (domain: string) =>
    request.get(`/identity-aggregator/reverse/${domain}`),

  getProfile: (address: string) =>
    request.get<IdentityProfile>(`/identity-aggregator/profile/${address}`),

  getReputation: (address: string) =>
    request.get<ReputationScore>(`/identity-aggregator/reputation/${address}`),

  getSocialGraph: (address: string) =>
    request.get<SocialGraph>(`/identity-aggregator/social-graph/${address}`),

  getCrossChainIdentities: (address: string) =>
    request.get<CrossChainIdentities>(`/identity-aggregator/cross-chain-identities/${address}`),

  getPopularDomains: (chain?: string) =>
    request.get('/identity-aggregator/popular-domains', { chain }),

  verifyIdentity: (address: string, identity: string) =>
    request.post('/identity-aggregator/verify', { address, identity }),

  getStats: () => request.get('/identity-aggregator/stats'),
};
