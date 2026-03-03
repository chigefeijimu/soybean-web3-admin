import { Injectable } from '@nestjs/common';

export interface SecurityScanResult {
  address: string;
  chain: string;
  score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  vulnerabilities: Vulnerability[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: SecurityFinding[];
  contractAnalysis: ContractAnalysis;
  timestamp: number;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  recommendation: string;
  lineNumber?: number;
}

export interface SecurityFinding {
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  details: string;
}

export interface ContractAnalysis {
  hasReentrancyGuard: boolean;
  hasPausable: boolean;
  hasOwnable: boolean;
  isUpgradeable: boolean;
  isProxy: boolean;
  hasAccessControl: boolean;
  hasReentrancy: boolean;
  hasIntegerOverflow: boolean;
  hasUncheckedCall: boolean;
  hasDelegateCall: boolean;
  hasSelfDestruct: boolean;
  hasTxOrigin: boolean;
  hasExternalCalls: boolean;
  hasMathErrors: boolean;
  linesOfCode: number;
  functions: number;
  events: number;
  modifiers: number;
}

@Injectable()
export class ContractSecurityScannerService {
  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'zkevm', 'zksync', 'linea'
  ];

  private readonly commonVulnerabilities = [
    { id: 'VULN-001', title: 'Reentrancy Vulnerability', severity: 'critical' as const, category: 'Access Control' },
    { id: 'VULN-002', title: 'Integer Overflow/Underflow', severity: 'high' as const, category: 'Arithmetic' },
    { id: 'VULN-003', title: 'Unchecked External Call', severity: 'high' as const, category: 'Error Handling' },
    { id: 'VULN-004', title: 'Access Control Missing', severity: 'critical' as const, category: 'Access Control' },
    { id: 'VULN-005', title: 'tx.origin Usage', severity: 'medium' as const, category: 'Security' },
    { id: 'VULN-006', title: 'Delegatecall to Untrusted Contract', severity: 'critical' as const, category: 'External Interaction' },
    { id: 'VULN-007', title: 'Selfdestruct Usage', severity: 'high' as const, category: 'Centralization' },
    { id: 'VULN-008', title: 'Floating Pragma', severity: 'low' as const, category: 'Best Practice' },
    { id: 'VULN-009', title: 'Missing Pausable Mechanism', severity: 'medium' as const, category: 'Emergency Stop' },
    { id: 'VULN-010', title: 'Unverified External Interface', severity: 'medium' as const, category: 'External Interaction' },
  ];

  async scanContract(address: string, chain: string): Promise<SecurityScanResult> {
    const normalizedAddress = address.toLowerCase();
    const normalizedChain = chain.toLowerCase();
    
    // Validate chain
    if (!this.supportedChains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${this.supportedChains.join(', ')}`);
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
      throw new Error('Invalid contract address format');
    }

    // Simulate contract analysis (in production, this would fetch actual contract bytecode/ABI)
    const analysis = this.analyzeContractBytecode(normalizedAddress, normalizedChain);
    const vulnerabilities = this.detectVulnerabilities(analysis);
    const findings = this.generateFindings(analysis, vulnerabilities);
    const score = this.calculateSecurityScore(vulnerabilities, analysis);
    const grade = this.getGrade(score);
    const riskLevel = this.getRiskLevel(score);

    return {
      address: normalizedAddress,
      chain: normalizedChain,
      score,
      grade,
      vulnerabilities,
      riskLevel,
      findings,
      contractAnalysis: analysis,
      timestamp: Date.now(),
    };
  }

  async scanMultiple(addresses: string[], chain: string): Promise<SecurityScanResult[]> {
    const results: SecurityScanResult[] = [];
    for (const address of addresses) {
      try {
        const result = await this.scanContract(address, chain);
        results.push(result);
      } catch (error) {
        console.error(`Error scanning ${address}:`, error);
      }
    }
    return results;
  }

  async getSecurityStats(chain: string): Promise<{
    totalScanned: number;
    averageScore: number;
    commonVulnerabilities: { type: string; count: number }[];
    riskDistribution: { critical: number; high: number; medium: number; low: number };
  }> {
    // Simulated statistics
    return {
      totalScanned: Math.floor(Math.random() * 10000) + 1000,
      averageScore: Math.floor(Math.random() * 30) + 65,
      commonVulnerabilities: [
        { type: 'Reentrancy', count: Math.floor(Math.random() * 500) + 100 },
        { type: 'Access Control', count: Math.floor(Math.random() * 400) + 80 },
        { type: 'Integer Overflow', count: Math.floor(Math.random() * 300) + 50 },
        { type: 'Unchecked Call', count: Math.floor(Math.random() * 250) + 40 },
        { type: 'tx.origin', count: Math.floor(Math.random() * 200) + 30 },
      ],
      riskDistribution: {
        critical: Math.floor(Math.random() * 50) + 10,
        high: Math.floor(Math.random() * 200) + 50,
        medium: Math.floor(Math.random() * 500) + 100,
        low: Math.floor(Math.random() * 800) + 200,
      },
    };
  }

  private analyzeContractBytecode(address: string, chain: string): ContractAnalysis {
    // Simulated bytecode analysis
    const hashNum = parseInt(address.slice(2, 10), 16);
    
    return {
      hasReentrancyGuard: hashNum % 3 !== 0,
      hasPausable: hashNum % 2 === 0,
      hasOwnable: hashNum % 4 !== 1,
      isUpgradeable: hashNum % 5 === 0,
      isProxy: hashNum % 7 === 0,
      hasAccessControl: hashNum % 3 === 0,
      hasReentrancy: hashNum % 11 === 0,
      hasIntegerOverflow: hashNum % 13 === 0,
      hasUncheckedCall: hashNum % 17 === 0,
      hasDelegateCall: hashNum % 19 === 0,
      hasSelfDestruct: hashNum % 23 === 0,
      hasTxOrigin: hashNum % 29 === 0,
      hasExternalCalls: hashNum % 31 === 0,
      hasMathErrors: hashNum % 37 === 0,
      linesOfCode: (hashNum % 500) + 100,
      functions: (hashNum % 30) + 5,
      events: (hashNum % 15) + 2,
      modifiers: (hashNum % 8) + 1,
    };
  }

  private detectVulnerabilities(analysis: ContractAnalysis): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    if (analysis.hasReentrancy && !analysis.hasReentrancyGuard) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[0],
        description: 'Contract may be vulnerable to reentrancy attacks. No reentrancy guard detected.',
        recommendation: 'Add reentrancy guard (e.g., OpenZeppelin ReentrancyGuard) or use checks-effects-interactions pattern.',
      });
    }

    if (analysis.hasIntegerOverflow) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[1],
        description: 'Contract uses Solidity < 0.8.0 or lacks SafeMath for arithmetic operations.',
        recommendation: 'Use Solidity 0.8+ with built-in overflow checks or OpenZeppelin SafeMath library.',
      });
    }

    if (analysis.hasUncheckedCall) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[2],
        description: 'Contract has unchecked external calls which may silently fail.',
        recommendation: 'Always check return values of external calls or use SafeERC20.',
      });
    }

    if (!analysis.hasAccessControl && !analysis.hasOwnable) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[3],
        description: 'No access control mechanism detected. Critical functions may be callable by anyone.',
        recommendation: 'Implement OpenZeppelin Ownable, AccessControl, or Pausable.',
      });
    }

    if (analysis.hasTxOrigin) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[4],
        description: 'Contract uses tx.origin for authorization which is vulnerable to phishing.',
        recommendation: 'Use msg.sender instead of tx.origin for authorization.',
      });
    }

    if (analysis.hasDelegateCall && !analysis.hasAccessControl) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[5],
        description: 'Contract uses delegatecall with untrusted contracts.',
        recommendation: 'Validate the target contract is trusted and has proper access controls.',
      });
    }

    if (analysis.hasSelfDestruct) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[6],
        description: 'Contract contains selfdestruct which can permanently destroy the contract.',
        recommendation: 'Review if selfdestruct is necessary. Consider timelock or multisig requirements.',
      });
    }

    if (!analysis.hasPausable) {
      vulnerabilities.push({
        ...this.commonVulnerabilities[8],
        description: 'No emergency stop mechanism. Cannot pause in case of vulnerability.',
        recommendation: 'Implement OpenZeppelin Pausable for emergency response capability.',
      });
    }

    // Add info-level findings
    if (analysis.isProxy) {
      vulnerabilities.push({
        id: 'VULN-INFO-001',
        title: 'Proxy Pattern Detected',
        severity: 'info',
        category: 'Architecture',
        description: 'Contract is using a proxy pattern. Ensure implementation is properly initialized.',
        recommendation: 'Follow OpenZeppelin proxy upgrade patterns and initialize implementation.',
      });
    }

    return vulnerabilities;
  }

  private generateFindings(analysis: ContractAnalysis, vulnerabilities: Vulnerability[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    if (analysis.functions > 20) {
      findings.push({
        type: 'Complexity',
        description: 'Contract has many functions',
        severity: 'low',
        details: `${analysis.functions} functions detected. Consider splitting into smaller contracts.`,
      });
    }

    if (analysis.isUpgradeable) {
      findings.push({
        type: 'Upgradeability',
        description: 'Upgradeable contract detected',
        severity: 'medium',
        details: 'Ensure upgrade authority is properly secured and timelocks are in place.',
      });
    }

    if (analysis.hasExternalCalls) {
      findings.push({
        type: 'External Interactions',
        description: 'Contract makes external calls',
        severity: 'low',
        details: 'External calls should always be at the end of functions (checks-effects-interactions).',
      });
    }

    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalVulns.length > 0) {
      findings.push({
        type: 'Critical Issues',
        description: `${criticalVulns.length} critical vulnerabilities found`,
        severity: 'critical',
        details: 'Immediate action required. Do not deploy without fixing critical issues.',
      });
    }

    return findings;
  }

  private calculateSecurityScore(vulnerabilities: Vulnerability[], analysis: ContractAnalysis): number {
    let score = 100;

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
        case 'info':
          score -= 1;
          break;
      }
    }

    // Bonus points for security features
    if (analysis.hasReentrancyGuard) score += 5;
    if (analysis.hasPausable) score += 5;
    if (analysis.hasAccessControl) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private getGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 25) return 'high';
    return 'critical';
  }
}
