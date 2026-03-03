import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ContractSecurityScannerService, SecurityScanResult } from './contract-security-scanner.service';

class ScanContractDto {
  address: string;
  chain: string;
}

class ScanMultipleDto {
  addresses: string[];
  chain: string;
}

@Controller('web3/contract-security')
export class ContractSecurityScannerController {
  constructor(private readonly scannerService: ContractSecurityScannerService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'Contract Security Scanner' };
  }

  @Get('chains')
  getSupportedChains() {
    return {
      chains: [
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
        { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
        { id: 'optimism', name: 'Optimism', symbol: 'ETH' },
        { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB' },
        { id: 'base', name: 'Base', symbol: 'ETH' },
        { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
        { id: 'zkevm', name: 'zkEVM', symbol: 'ETH' },
        { id: 'zksync', name: 'zkSync Era', symbol: 'ETH' },
        { id: 'linea', name: 'Linea', symbol: 'ETH' },
      ],
    };
  }

  @Post('scan')
  async scanContract(@Body() dto: ScanContractDto): Promise<SecurityScanResult> {
    return this.scannerService.scanContract(dto.address, dto.chain);
  }

  @Post('scan/batch')
  async scanMultiple(@Body() dto: ScanMultipleDto): Promise<SecurityScanResult[]> {
    return this.scannerService.scanMultiple(dto.addresses, dto.chain);
  }

  @Get('scan/:address')
  async scanContractGet(
    @Param('address') address: string,
    @Query('chain') chain: string,
  ): Promise<SecurityScanResult> {
    return this.scannerService.scanContract(address, chain || 'ethereum');
  }

  @Get('stats')
  async getStats(@Query('chain') chain: string) {
    return this.scannerService.getSecurityStats(chain || 'ethereum');
  }

  @Get('common-vulnerabilities')
  getCommonVulnerabilities() {
    return {
      vulnerabilities: [
        {
          id: 'VULN-001',
          title: 'Reentrancy Vulnerability',
          severity: 'critical',
          category: 'Access Control',
          description: 'Allows an attacker to re-enter a function before the first execution completes',
          recommendation: 'Use ReentrancyGuard or checks-effects-interactions pattern',
        },
        {
          id: 'VULN-002',
          title: 'Integer Overflow/Underflow',
          severity: 'high',
          category: 'Arithmetic',
          description: 'Arithmetic operations can wrap around causing unexpected behavior',
          recommendation: 'Use Solidity 0.8+ or SafeMath library',
        },
        {
          id: 'VULN-003',
          title: 'Unchecked External Call',
          severity: 'high',
          category: 'Error Handling',
          description: 'External call return value not checked',
          recommendation: 'Always check return values or use SafeERC20',
        },
        {
          id: 'VULN-004',
          title: 'Access Control Missing',
          severity: 'critical',
          category: 'Access Control',
          description: 'Critical functions lack proper access control',
          recommendation: 'Implement Ownable, AccessControl, or Pausable',
        },
        {
          id: 'VULN-005',
          title: 'tx.origin Usage',
          severity: 'medium',
          category: 'Security',
          description: 'Using tx.origin for authorization is vulnerable to phishing',
          recommendation: 'Use msg.sender instead of tx.origin',
        },
        {
          id: 'VULN-006',
          title: 'Delegatecall to Untrusted Contract',
          severity: 'critical',
          category: 'External Interaction',
          description: 'Delegatecall can lead to storage manipulation',
          recommendation: 'Validate target contract and use immutable args',
        },
        {
          id: 'VULN-007',
          title: 'Selfdestruct Usage',
          severity: 'high',
          category: 'Centralization',
          description: 'Contract can be permanently destroyed',
          recommendation: 'Use timelock or multisig for selfdestruct',
        },
        {
          id: 'VULN-008',
          title: 'Floating Pragma',
          severity: 'low',
          category: 'Best Practice',
          description: 'Lock pragma to a specific compiler version',
          recommendation: 'Lock pragma to a specific version',
        },
        {
          id: 'VULN-009',
          title: 'Missing Pausable Mechanism',
          severity: 'medium',
          category: 'Emergency Stop',
          description: 'No way to pause contract in emergency',
          recommendation: 'Implement Pausable for emergency response',
        },
        {
          id: 'VULN-010',
          title: 'Unverified External Interface',
          severity: 'medium',
          category: 'External Interaction',
          description: 'External contract interface not verified',
          recommendation: 'Verify external contract interfaces',
        },
      ],
    };
  }
}
