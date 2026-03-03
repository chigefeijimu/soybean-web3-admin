import { Injectable } from '@nestjs/common';

interface VulnerabilityPattern {
  id: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  detectionMethod: string;
  recommendation: string;
}

interface AuditResult {
  address: string;
  chain: string;
  timestamp: number;
  contractVerified: boolean;
  hasProxy: boolean;
  proxyAdmin: string | null;
  contractType: string;
  owner: string | null;
  ownershipStatus: 'none' | 'single' | 'multisig' | 'timelock' | 'dao';
  vulnerabilities: Vulnerability[];
  gasAnalysis: GasAnalysis;
  accessControl: AccessControlAnalysis;
  overallScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  codeQuality: CodeQuality;
}

interface Vulnerability {
  id: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  location: string;
  recommendation: string;
}

interface GasAnalysis {
  estimatedDeployGas: number;
  optimizationScore: number;
  suggestions: string[];
}

interface AccessControlAnalysis {
  ownershipType: string;
  pausable: boolean;
  upgradeable: boolean;
  mintable: boolean;
  burnable: boolean;
  hasAccessControl: boolean;
  rolesDefined: string[];
  risk: 'low' | 'medium' | 'high';
}

interface CodeQuality {
  hasDocumentation: boolean;
  hasTests: boolean;
  licenseIdentified: boolean;
  solidityVersion: string;
  linesOfCode: number;
  score: number;
}

interface AuditHistory {
  address: string;
  chain: string;
  audits: {
    timestamp: number;
    score: number;
    riskLevel: string;
  }[];
}

@Injectable()
export class ContractSecurityAuditService {
  private readonly auditHistory = new Map<string, AuditHistory>();
  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'zkevm', 'zksync'
  ];

  private readonly vulnerabilityPatterns: VulnerabilityPattern[] = [
    {
      id: 'reentrancy',
      name: 'Reentrancy Vulnerability',
      category: 'Access Control',
      severity: 'critical',
      description: 'The contract is vulnerable to reentrancy attacks where an attacker can call back into the contract before the state is updated.',
      detectionMethod: 'Check for external calls followed by state changes without proper checks-effects-interactions pattern.',
      recommendation: 'Use Checks-Effects-Interactions pattern, implement ReentrancyGuard, or use PullPayment pattern.'
    },
    {
      id: 'access-control',
      name: 'Missing Access Control',
      category: 'Access Control',
      severity: 'critical',
      description: 'Critical functions lack access control modifiers, allowing anyone to execute them.',
      detectionMethod: 'Analyze function modifiers and visibility. Check if onlyOwner or role-based controls exist.',
      recommendation: 'Implement role-based access control (OpenZeppelin AccessControl) for sensitive functions.'
    },
    {
      id: 'tx-origin',
      name: 'tx.origin Usage',
      category: 'Access Control',
      severity: 'high',
      description: 'Using tx.origin for authorization can be exploited by phishing contracts.',
      detectionMethod: 'Search for tx.origin in authorization logic.',
      recommendation: 'Use msg.sender instead of tx.origin for authorization.'
    },
    {
      id: 'unchecked-call',
      name: 'Unchecked Low-Level Calls',
      category: 'Error Handling',
      severity: 'medium',
      description: 'Return value of low-level calls is not checked, leading to silent failures.',
      detectionMethod: 'Check if call返回值 is used after low-level calls.',
      recommendation: 'Always check return values or use SafeERC20 library.'
    },
    {
      id: 'integer-overflow',
      name: 'Integer Overflow/Underflow',
      category: 'Arithmetic',
      severity: 'high',
      description: 'Arithmetic operations can overflow or underflow without proper checks (pre-Solc 0.8).',
      detectionMethod: 'Check Solidity version and usage of SafeMath or solc >= 0.8.0.',
      recommendation: 'Use Solidity 0.8+ or SafeMath library for arithmetic operations.'
    },
    {
      id: 'front-running',
      name: 'Front-Running Vulnerability',
      category: 'Timing',
      severity: 'medium',
      description: 'Transactions can be front-run due to public mempool visibility.',
      detectionMethod: 'Analyze trading functions for lack of commit-reveal or batch auction mechanisms.',
      recommendation: 'Consider using commit-reveal scheme or batch auctions for sensitive operations.'
    },
    {
      id: 'dos',
      name: 'Denial of Service',
      category: 'Availability',
      severity: 'high',
      description: 'Contract can be rendered unusable through various attack vectors.',
      detectionMethod: 'Check for unbounded loops, external call dependencies, and Ether sent to payable functions.',
      recommendation: 'Avoid unbounded loops, implement pull payment pattern, use withdrawal mechanism.'
    },
    {
      id: 'permittion',
      name: 'Missing Pausable',
      category: 'Emergency Stop',
      severity: 'medium',
      description: 'Contract lacks pause functionality for emergency situations.',
      detectionMethod: 'Check for Pausable contract inheritance.',
      recommendation: 'Consider implementing Pausable contract for emergency stop capability.'
    },
    {
      id: 'upgradeable',
      name: 'Upgradeable Contract Risk',
      category: 'Upgradability',
      severity: 'medium',
      description: 'Upgradeable contracts have additional trust assumptions.',
      detectionMethod: 'Check for proxy pattern (delegatecall, proxy contract).',
      recommendation: 'Ensure proxy admin is properly secured, consider timelock for upgrades.'
    },
    {
      id: 'centralization',
      name: 'Centralization Risk',
      category: 'Architecture',
      severity: 'high',
      description: 'Single point of failure - owner can rug the contract.',
      detectionMethod: 'Analyze ownership structure and critical functions.',
      recommendation: 'Implement multisig, timelock, or DAO governance for critical operations.'
    }
  ];

  async auditContract(address: string, chain: string): Promise<AuditResult> {
    if (!this.supportedChains.includes(chain.toLowerCase())) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid contract address');
    }

    // Simulate contract analysis (in production, would fetch actual contract data)
    const vulnerabilities = this.analyzeVulnerabilities(address, chain);
    const gasAnalysis = this.analyzeGasOptimization(address, chain);
    const accessControl = this.analyzeAccessControl(address, chain);
    const codeQuality = this.analyzeCodeQuality(address, chain);

    // Calculate overall score (0-100)
    let score = 100;
    vulnerabilities.forEach(v => {
      switch (v.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    score = Math.max(0, score);

    // Determine risk level
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    if (score >= 90) riskLevel = 'safe';
    else if (score >= 70) riskLevel = 'low';
    else if (score >= 50) riskLevel = 'medium';
    else if (score >= 30) riskLevel = 'high';
    else riskLevel = 'critical';

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilities, accessControl, gasAnalysis);

    const result: AuditResult = {
      address,
      chain,
      timestamp: Date.now(),
      contractVerified: Math.random() > 0.3, // Simulated
      hasProxy: Math.random() > 0.7,
      proxyAdmin: Math.random() > 0.7 ? '0x' + this.generateRandomAddress() : null,
      contractType: this.detectContractType(address),
      owner: '0x' + this.generateRandomAddress(),
      ownershipStatus: this.detectOwnershipStatus(),
      vulnerabilities,
      gasAnalysis,
      accessControl,
      overallScore: score,
      riskLevel,
      recommendations,
      codeQuality
    };

    // Store in history
    this.storeAuditResult(address, chain, score, riskLevel);

    return result;
  }

  async batchAudit(addresses: string[], chain: string): Promise<{ results: AuditResult[]; summary: any }> {
    const results: AuditResult[] = [];
    
    for (const address of addresses) {
      try {
        const result = await this.auditContract(address, chain);
        results.push(result);
      } catch (error) {
        // Skip failed audits
      }
    }

    // Calculate summary
    const scores = results.map(r => r.overallScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const criticalCount = results.filter(r => r.riskLevel === 'critical').length;
    const highCount = results.filter(r => r.riskLevel === 'high').length;

    return {
      results,
      summary: {
        totalAudited: results.length,
        averageScore: Math.round(avgScore),
        riskDistribution: {
          safe: results.filter(r => r.riskLevel === 'safe').length,
          low: results.filter(r => r.riskLevel === 'low').length,
          medium: results.filter(r => r.riskLevel === 'medium').length,
          high: results.filter(r => r.riskLevel === 'high').length,
          critical: criticalCount
        },
        commonVulnerabilities: this.getCommonVulnerabilities(results)
      }
    };
  }

  async getAuditHistory(address: string, chain: string): Promise<AuditHistory> {
    const key = `${chain}:${address}`.toLowerCase();
    return this.auditHistory.get(key) || { address, chain, audits: [] };
  }

  getVulnerabilityPatterns(category?: string): VulnerabilityPattern[] {
    if (category) {
      return this.vulnerabilityPatterns.filter(v => v.category === category);
    }
    return this.vulnerabilityPatterns;
  }

  async getCommonIssues(chain: string): Promise<any> {
    const chainIssues = {
      ethereum: [
        { issue: 'Unverified contracts', count: 15420, severity: 'high' },
        { issue: 'Proxy pattern without timelock', count: 8930, severity: 'medium' },
        { issue: 'Missing reentrancy guard', count: 12100, severity: 'high' }
      ],
      polygon: [
        { issue: 'Unverified contracts', count: 8930, severity: 'high' },
        { issue: 'Centralized ownership', count: 12400, severity: 'medium' }
      ],
      arbitrum: [
        { issue: 'Unverified contracts', count: 5620, severity: 'high' },
        { issue: 'Upgradeable proxies', count: 3420, severity: 'medium' }
      ],
      optimism: [
        { issue: 'Unverified contracts', count: 4210, severity: 'high' },
        { issue: 'Missing access control', count: 2890, severity: 'high' }
      ],
      bsc: [
        { issue: 'Mintable tokens', count: 23400, severity: 'high' },
        { issue: 'Unverified contracts', count: 45600, severity: 'high' },
        { issue: ' Honeypot patterns', count: 8900, severity: 'critical' }
      ],
      base: [
        { issue: 'Unverified contracts', count: 2340, severity: 'high' },
        { issue: 'Proxy pattern', count: 1200, severity: 'medium' }
      ],
      avalanche: [
        { issue: 'Unverified contracts', count: 5670, severity: 'high' },
        { issue: 'Missing pausable', count: 3450, severity: 'medium' }
      ],
      zkevm: [
        { issue: 'Unverified contracts', count: 1890, severity: 'high' }
      ],
      zksync: [
        { issue: 'Unverified contracts', count: 2340, severity: 'high' }
      ]
    };

    return chainIssues[chain.toLowerCase()] || chainIssues.ethereum;
  }

  private analyzeVulnerabilities(address: string, chain: string): Vulnerability[] {
    // Simulate vulnerability detection based on address hash for consistency
    const hash = parseInt(address.slice(2, 10), 16);
    const vulnerabilities: Vulnerability[] = [];

    // Use deterministic selection based on address
    if (hash % 3 === 0) {
      vulnerabilities.push({
        id: 'access-control',
        name: 'Missing Access Control',
        category: 'Access Control',
        severity: 'high',
        description: 'Critical functions lack proper access control modifiers.',
        location: 'Contract: setOwner()',
        recommendation: 'Add onlyOwner or role-based access control.'
      });
    }

    if (hash % 5 === 0) {
      vulnerabilities.push({
        id: 'unchecked-call',
        name: 'Unchecked Low-Level Calls',
        category: 'Error Handling',
        severity: 'medium',
        description: 'Return value of address.call() is not checked.',
        location: 'Contract: _transfer()',
        recommendation: 'Use SafeERC20 or check return value.'
      });
    }

    if (hash % 7 === 0) {
      vulnerabilities.push({
        id: 'permittion',
        name: 'Missing Pausable',
        category: 'Emergency Stop',
        severity: 'medium',
        description: 'Contract lacks emergency pause functionality.',
        location: 'Contract: missing Pausable',
        recommendation: 'Consider adding Pausable contract.'
      });
    }

    if (hash % 11 === 0) {
      vulnerabilities.push({
        id: 'centralization',
        name: 'Centralization Risk',
        category: 'Architecture',
        severity: 'high',
        description: 'Single owner can control critical contract functions.',
        location: 'Contract: owner address',
        recommendation: 'Implement multisig or DAO governance.'
      });
    }

    return vulnerabilities;
  }

  private analyzeGasOptimization(address: string, chain: string): GasAnalysis {
    const hash = parseInt(address.slice(2, 10), 16);
    
    const suggestions: string[] = [];
    if (hash % 2 === 0) suggestions.push('Use custom errors instead of require strings to save gas');
    if (hash % 3 === 0) suggestions.push('Cache array length in loops');
    if (hash % 5 === 0) suggestions.push('Use gasleft() for inline gas checks');
    if (hash % 7 === 0) suggestions.push('Pack structs tightly to reduce storage slots');
    if (hash % 11 === 0) suggestions.push('Use immutable variables for constants');

    const optimizationScore = Math.max(0, 100 - (suggestions.length * 12));

    return {
      estimatedDeployGas: 500000 + (hash % 10) * 50000,
      optimizationScore,
      suggestions
    };
  }

  private analyzeAccessControl(address: string, chain: string): AccessControlAnalysis {
    const hash = parseInt(address.slice(2, 10), 16);
    
    return {
      ownershipType: hash % 4 === 0 ? 'multisig' : 'single',
      pausable: hash % 3 !== 0,
      upgradeable: hash % 5 === 0,
      mintable: hash % 7 === 0,
      burnable: hash % 2 === 0,
      hasAccessControl: hash % 3 !== 0,
      rolesDefined: hash % 4 === 0 ? ['DEFAULT_ADMIN_ROLE', 'MINTER_ROLE', 'PAUSER_ROLE'] : ['DEFAULT_ADMIN_ROLE'],
      risk: hash % 3 === 0 ? 'high' : hash % 2 === 0 ? 'medium' : 'low'
    };
  }

  private analyzeCodeQuality(address: string, chain: string): CodeQuality {
    const hash = parseInt(address.slice(2, 10), 16);
    
    return {
      hasDocumentation: hash % 3 !== 0,
      hasTests: hash % 4 !== 0,
      licenseIdentified: hash % 5 !== 0,
      solidityVersion: hash % 3 === 0 ? '0.8.19' : hash % 2 === 0 ? '0.8.0' : '0.7.6',
      linesOfCode: 100 + (hash % 50) * 10,
      score: Math.max(0, 100 - (hash % 3) * 20 - (hash % 2) * 15)
    };
  }

  private detectContractType(address: string): string {
    const hash = parseInt(address.slice(2, 10), 16);
    const types = ['ERC20', 'ERC721', 'ERC1155', 'Uniswap V3 Pool', 'Aave V3 Pool', 'Custom'];
    return types[hash % types.length];
  }

  private detectOwnershipStatus(): 'none' | 'single' | 'multisig' | 'timelock' | 'dao' {
    return 'single';
  }

  private generateRecommendations(
    vulnerabilities: Vulnerability[],
    accessControl: AccessControlAnalysis,
    gasAnalysis: GasAnalysis
  ): string[] {
    const recommendations: string[] = [];

    vulnerabilities.forEach(v => {
      recommendations.push(v.recommendation);
    });

    if (!accessControl.pausable) {
      recommendations.push('Consider adding Pausable contract for emergency stop capability');
    }

    if (accessControl.risk === 'high') {
      recommendations.push('Implement multisig wallet for contract ownership');
    }

    if (gasAnalysis.optimizationScore < 70) {
      recommendations.push('Review gas optimization suggestions and implement improvements');
    }

    return recommendations;
  }

  private storeAuditResult(address: string, chain: string, score: number, riskLevel: string): void {
    const key = `${chain}:${address}`.toLowerCase();
    const history = this.auditHistory.get(key) || { address, chain, audits: [] };
    
    history.audits.push({
      timestamp: Date.now(),
      score,
      riskLevel
    });

    // Keep only last 10 audits
    if (history.audits.length > 10) {
      history.audits = history.audits.slice(-10);
    }

    this.auditHistory.set(key, history);
  }

  private getCommonVulnerabilities(results: AuditResult[]): string[] {
    const counts = new Map<string, number>();
    
    results.forEach(r => {
      r.vulnerabilities.forEach(v => {
        counts.set(v.name, (counts.get(v.name) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count})`);
  }

  private generateRandomAddress(): string {
    return Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}
