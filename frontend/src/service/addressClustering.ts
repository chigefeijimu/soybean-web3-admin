import { request } from '@/service/request'

/**
 * Address Clustering Analyzer API Service
 */

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

export interface ClusterAnalysis {
  concentration: number;
  avgTransactionSize: number;
  timePattern: string;
  behaviorType: string;
  riskScore: number;
  flags: string[];
}

export interface ClusterResult {
  seedAddress: string;
  cluster: ClusterNode[];
  clusterSize: number;
  clusterType: string;
  totalValue: number;
  analysis: ClusterAnalysis;
}

export interface RelationshipResult {
  address1: string;
  address2: string;
  chain: string;
  relationship: {
    type: string;
    strength: string;
    confidence: number;
    flags: string[];
  };
  metrics: {
    directTransactions: number;
    commonPartners: number;
    timeSimilarity: number;
    amountSimilarity: number;
  };
  analysis: string;
}

export interface ClusterGraph {
  address: string;
  chain: string;
  depth: number;
  nodes: GraphNode[];
  links: GraphLink[];
  statistics: {
    totalNodes: number;
    totalLinks: number;
    clusterType: string;
  };
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

export interface HubAddress {
  address: string;
  type: string;
  name: string;
  connections: number;
}

const API_BASE = '/api/address-clustering';

export const addressClusteringApi = {
  /**
   * Analyze address cluster from a seed address
   */
  analyzeCluster(params: {
    address: string;
    chain?: string;
    depth?: number;
  }) {
    return request.get<any, ClusterResult>(`${API_BASE}/analyze`, { params });
  },

  /**
   * Get cluster for a specific address
   */
  getCluster(params: {
    address: string;
    chain?: string;
    depth?: number;
  }) {
    return request.get<any, ClusterResult>(`${API_BASE}/cluster/${params.address}`, {
      params: { chain: params.chain, depth: params.depth }
    });
  },

  /**
   * Find clusters among multiple addresses
   */
  findCluster(data: {
    addresses: string[];
    chain?: string;
    method?: 'transaction' | 'time' | 'amount' | 'combined';
  }) {
    return request.post<any, any>(`${API_BASE}/cluster`, data);
  },

  /**
   * Analyze relationship between two addresses
   */
  getRelationship(params: {
    address1: string;
    address2: string;
    chain?: string;
  }) {
    return request.get<any, RelationshipResult>(
      `${API_BASE}/relationship/${params.address1}/${params.address2}`,
      { params: { chain: params.chain } }
    );
  },

  /**
   * Generate cluster graph visualization data
   */
  getClusterGraph(params: {
    address: string;
    chain?: string;
    depth?: number;
  }) {
    return request.get<any, ClusterGraph>(`${API_BASE}/graph/${params.address}`, {
      params: { chain: params.chain, depth: params.depth }
    });
  },

  /**
   * Batch cluster discovery from multiple seed addresses
   */
  batchCluster(data: {
    seedAddresses: string[];
    chain?: string;
    maxResults?: number;
  }) {
    return request.post<any, any>(`${API_BASE}/batch`, data);
  },

  /**
   * Get top hub addresses
   */
  getTopHubs(params: {
    chain?: string;
    limit?: number;
  }) {
    return request.get<any, { chain: string; hubs: HubAddress[]; totalHubs: number; timestamp: string }>(
      `${API_BASE}/top-hubs`,
      { params }
    );
  },

  /**
   * Health check
   */
  health() {
    return request.get<any, { status: string; service: string; timestamp: string }>(
      `${API_BASE}/health`
    );
  },
};
