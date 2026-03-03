// Protocol Health Monitor Service
import request from './request';

export interface ProtocolHealthStatus {
  protocolId: string;
  protocolName: string;
  chain: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  healthScore: number;
  lastCheck: string;
  issues: HealthIssue[];
  metrics: ProtocolMetrics;
  trend: HealthTrend;
}

export interface HealthIssue {
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detectedAt: string;
  value?: number;
  threshold?: number;
}

export interface ProtocolMetrics {
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  volume24h: number;
  userCount: number;
  activeUsers24h: number;
  transactionCount24h: number;
  averageApr: number;
  volatilityScore: number;
  liquidityScore: number;
  concentrationScore: number;
}

export interface HealthTrend {
  direction: 'up' | 'down' | 'stable';
  changeRate: number;
  confidence: number;
}

export interface HealthOverview {
  totalProtocols: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  averageHealthScore: number;
  lastUpdate: string;
  chainsStatus: ChainHealthSummary[];
}

export interface ChainHealthSummary {
  chain: string;
  protocolCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  averageScore: number;
}

export interface ProtocolHealthResponse {
  protocol: ProtocolHealthStatus;
  historicalScores: HistoricalScore[];
  recommendations: string[];
}

export interface HistoricalScore {
  timestamp: string;
  score: number;
  status: string;
}

export interface HealthAlert {
  id: string;
  protocolId: string;
  protocolName: string;
  chain: string;
  issue: HealthIssue;
  createdAt: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

// API Functions
export const getHealthOverview = () => {
  return request.get('/web3/protocol-health/overview');
};

export const getProtocolHealth = (protocolId: string) => {
  return request.get(`/web3/protocol-health/${protocolId}`);
};

export const checkProtocolHealth = (protocolId: string) => {
  return request.get(`/web3/protocol-health/${protocolId}/check`);
};

export const getProtocolsByChain = (chain: string) => {
  return request.get(`/web3/protocol-health/chain/${chain}`);
};

export const getProtocolsByStatus = (status: string) => {
  return request.get(`/web3/protocol-health/status/${status}`);
};

export const getAllProtocols = () => {
  return request.get('/web3/protocol-health/all');
};

export const checkAllProtocols = () => {
  return request.get('/web3/protocol-health/check-all');
};

export const getAlerts = (acknowledged?: boolean) => {
  const params = acknowledged !== undefined ? { acknowledged } : {};
  return request.get('/web3/protocol-health/alerts', { params });
};

export const acknowledgeAlert = (alertId: string) => {
  return request.post(`/web3/protocol-health/alerts/${alertId}/acknowledge`);
};

export const resolveAlert = (alertId: string) => {
  return request.post(`/web3/protocol-health/alerts/${alertId}/resolve`);
};

export default {
  getHealthOverview,
  getProtocolHealth,
  checkProtocolHealth,
  getProtocolsByChain,
  getProtocolsByStatus,
  getAllProtocols,
  checkAllProtocols,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
};
