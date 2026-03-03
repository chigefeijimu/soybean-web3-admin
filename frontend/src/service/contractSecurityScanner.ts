import request from '@/service/request';

export interface SecurityScanResult {
  address: string;
  chain: string;
  score: number;
  grade: string;
  vulnerabilities: Vulnerability[];
  riskLevel: string;
  findings: SecurityFinding[];
  contractAnalysis: ContractAnalysis;
  timestamp: number;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: string;
  category: string;
  description: string;
  recommendation: string;
}

export interface SecurityFinding {
  type: string;
  description: string;
  severity: string;
  details: string;
}

export interface ContractAnalysis {
  hasReentrancyGuard: boolean;
  hasPausable: boolean;
  hasOwnable: boolean;
  hasAccessControl: boolean;
  isUpgradeable: boolean;
  isProxy: boolean;
  hasReentrancy: boolean;
  hasIntegerOverflow: boolean;
  hasUncheckedCall: boolean;
  hasDelegateCall: boolean;
  hasSelfDestruct: boolean;
  has_txOrigin: boolean;
  hasExternalCalls: boolean;
  hasMathErrors: boolean;
  linesOfCode: number;
  functions: number;
  events: number;
  modifiers: number;
}

export interface SecurityStats {
  totalScanned: number;
  averageScore: number;
  commonVulnerabilities: { type: string; count: number }[];
  riskDistribution: { critical: number; high: number; medium: number; low: number };
}

export const contractSecurityScanner = {
  scanContract(address: string, chain: string) {
    return request({
      url: '/api/web3/contract-security/scan',
      method: 'POST',
      data: { address, chain },
    });
  },

  scanMultiple(addresses: string[], chain: string) {
    return request({
      url: '/api/web3/contract-security/scan/batch',
      method: 'POST',
      data: { addresses, chain },
    });
  },

  getStats(chain: string = 'ethereum') {
    return request({
      url: '/api/web3/contract-security/stats',
      method: 'GET',
      params: { chain },
    });
  },

  getSupportedChains() {
    return request({
      url: '/api/web3/contract-security/chains',
      method: 'GET',
    });
  },

  getCommonVulnerabilities() {
    return request({
      url: '/api/web3/contract-security/common-vulnerabilities',
      method: 'GET',
    });
  },
};

export default contractSecurityScanner;
