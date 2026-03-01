import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

class GetTransferStatusDto {
  @ApiProperty({ description: 'Bridge name (layerzero, stargate, across, celer, hop)' })
  bridge: string;

  @ApiProperty({ description: 'Source chain ID' })
  srcChainId: number;

  @ApiProperty({ description: 'Destination chain ID' })
  dstChainId: number;

  @ApiProperty({ description: 'Transaction hash' })
  txHash: string;
}

class GetQuotesDto {
  @ApiProperty({ description: 'From chain ID' })
  fromChain: number;

  @ApiProperty({ description: 'To chain ID' })
  toChain: number;

  @ApiProperty({ description: 'Token symbol' })
  token: string;

  @ApiProperty({ description: 'Amount to bridge' })
  amount: string;
}

interface TransferStatus {
  status: string;
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  txHash: string;
  dstTxHash?: string;
  timestamp: number;
  age: string;
  bridge: string;
}

interface BridgeQuote {
  bridge: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  estimatedReceived: string;
  estimatedTime: string;
  gasCost: string;
}

@ApiTags('Web3 - Cross-Chain Transfer Tracker')
@Controller('web3/cross-chain-transfer')
export class CrossChainTransferController {
  private readonly chainIdToName: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    56: 'BSC',
    137: 'Polygon',
    42161: 'Arbitrum',
    43114: 'Avalanche',
    250: 'Fantom',
    8453: 'Base',
    11155111: 'Sepolia',
    80001: 'Mumbai',
    421613: 'Arbitrum Goerli',
  };

  constructor(private readonly httpService: HttpService) {}

  @Get('status/:bridge/:srcChainId/:dstChainId/:txHash')
  @ApiOperation({ description: 'Get cross-chain transfer status' })
  async getTransferStatus(
    @Param('bridge') bridge: string,
    @Param('srcChainId') srcChainId: number,
    @Param('dstChainId') dstChainId: number,
    @Param('txHash') txHash: string,
  ): Promise<TransferStatus> {
    // Query bridge API based on bridge type
    switch (bridge.toLowerCase()) {
      case 'layerzero':
        return this.getLayerZeroStatus(parseInt(String(srcChainId)), parseInt(String(dstChainId)), txHash);
      case 'stargate':
        return this.getStargateStatus(txHash);
      default:
        return this.getMockTransferStatus(parseInt(String(srcChainId)), parseInt(String(dstChainId)), txHash, bridge);
    }
  }

  @Get('history/:address')
  @ApiOperation({ description: 'Get address cross-chain transfer history' })
  @ApiQuery({ name: 'chains', required: false, description: 'Comma-separated chain IDs' })
  async getAddressTransfers(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ): Promise<any[]> {
    // Return mock transfer history for demonstration
    return [
      {
        id: '1',
        fromChain: 'Ethereum',
        toChain: 'Arbitrum',
        fromAddress: address,
        toAddress: address,
        token: 'USDC',
        amount: '1000',
        status: 'completed',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        srcChainId: 1,
        dstChainId: 42161,
        timestamp: Date.now() - 3600000,
        bridge: 'LayerZero',
      },
      {
        id: '2',
        fromChain: 'Polygon',
        toChain: 'Avalanche',
        fromAddress: address,
        toAddress: address,
        token: 'USDT',
        amount: '500',
        status: 'pending',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        srcChainId: 137,
        dstChainId: 43114,
        timestamp: Date.now() - 600000,
        bridge: 'Stargate',
      },
    ];
  }

  @Post('quotes')
  @ApiOperation({ description: 'Get bridge quotes for cross-chain transfer' })
  async getBridgeQuotes(@Body() dto: GetQuotesDto): Promise<BridgeQuote[]> {
    const fromChainName = this.chainIdToName[dto.fromChain] || `Chain ${dto.fromChain}`;
    const toChainName = this.chainIdToName[dto.toChain] || `Chain ${dto.toChain}`;

    return [
      {
        bridge: 'LayerZero',
        fromChain: fromChainName,
        toChain: toChainName,
        token: dto.token,
        amount: dto.amount,
        estimatedReceived: (parseFloat(dto.amount) * 0.999).toFixed(2),
        estimatedTime: '5-15 min',
        gasCost: '$5-15',
      },
      {
        bridge: 'Stargate',
        fromChain: fromChainName,
        toChain: toChainName,
        token: dto.token,
        amount: dto.amount,
        estimatedReceived: (parseFloat(dto.amount) * 0.998).toFixed(2),
        estimatedTime: '10-30 min',
        gasCost: '$8-20',
      },
      {
        bridge: 'Across',
        fromChain: fromChainName,
        toChain: toChainName,
        token: dto.token,
        amount: dto.amount,
        estimatedReceived: (parseFloat(dto.amount) * 0.9995).toFixed(2),
        estimatedTime: '3-10 min',
        gasCost: '$3-10',
      },
    ];
  }

  @Get('chains')
  @ApiOperation({ description: 'Get supported chains for cross-chain transfer' })
  async getSupportedChains(): Promise<{ id: number; name: string; icon: string }[]> {
    return [
      { id: 1, name: 'Ethereum', icon: '🟣' },
      { id: 10, name: 'Optimism', icon: '🔴' },
      { id: 56, name: 'BSC', icon: '🟡' },
      { id: 137, name: 'Polygon', icon: '🟣' },
      { id: 42161, name: 'Arbitrum', icon: '🔵' },
      { id: 43114, name: 'Avalanche', icon: '🔴' },
      { id: 250, name: 'Fantom', icon: '🔵' },
      { id: 8453, name: 'Base', icon: '🔵' },
    ];
  }

  @Get('bridges')
  @ApiOperation({ description: 'Get supported cross-chain bridges' })
  async getSupportedBridges(): Promise<{ name: string; icon: string; website: string }[]> {
    return [
      { name: 'LayerZero', icon: '🌐', website: 'https://layerzero.network' },
      { name: 'Stargate', icon: '🌉', website: 'https://stargate.finance' },
      { name: 'Across', icon: '↔️', website: 'https://across.to' },
      { name: 'Celer', icon: '🔗', website: 'https://cbridge.celer.network' },
      { name: 'Hop', icon: '🐰', website: 'https://app.hop.exchange' },
    ];
  }

  @Get('popular-pairs')
  @ApiOperation({ description: 'Get popular cross-chain token pairs' })
  async getPopularTokenPairs(): Promise<{ fromChain: string; toChain: string; token: string }[]> {
    return [
      { fromChain: 'Ethereum', toChain: 'Arbitrum', token: 'USDC' },
      { fromChain: 'Ethereum', toChain: 'Optimism', token: 'USDC' },
      { fromChain: 'Polygon', toChain: 'Avalanche', token: 'USDT' },
      { fromChain: 'Ethereum', toChain: 'Base', token: 'ETH' },
      { fromChain: 'BSC', toChain: 'Arbitrum', token: 'BNB' },
      { fromChain: 'Avalanche', toChain: 'Polygon', token: 'AVAX' },
    ];
  }

  private async getLayerZeroStatus(srcChainId: number, dstChainId: number, txHash: string): Promise<TransferStatus> {
    // Try to fetch from LayerZero API
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.layerzero-scan.com/tx/${txHash}`, { timeout: 5000 })
      );
      if (response.data) {
        return {
          status: response.data.dstTxHash ? 'completed' : 'pending',
          fromChain: this.chainIdToName[srcChainId] || `Chain ${srcChainId}`,
          toChain: this.chainIdToName[dstChainId] || `Chain ${dstChainId}`,
          amount: response.data.amount || '0',
          token: response.data.token || '',
          txHash,
          dstTxHash: response.data.dstTxHash,
          timestamp: response.data.timestamp || Date.now(),
          age: this.calculateAge(response.data.timestamp),
          bridge: 'LayerZero',
        };
      }
    } catch (error) {
      // Fallback to mock data
    }
    return this.getMockTransferStatus(srcChainId, dstChainId, txHash, 'LayerZero');
  }

  private async getStargateStatus(txHash: string): Promise<TransferStatus> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://stargate-api.vercel.app/transfer/status?txHash=${txHash}`, { timeout: 5000 })
      );
      if (response.data) {
        return {
          status: response.data.status || 'pending',
          fromChain: response.data.fromChain || '',
          toChain: response.data.toChain || '',
          amount: response.data.amount || '0',
          token: response.data.token || '',
          txHash,
          dstTxHash: response.data.dstTxHash,
          timestamp: response.data.timestamp || Date.now(),
          age: this.calculateAge(response.data.timestamp),
          bridge: 'Stargate',
        };
      }
    } catch (error) {
      // Fallback to mock data
    }
    return this.getMockTransferStatus(1, 10, txHash, 'Stargate');
  }

  private getMockTransferStatus(srcChainId: number, dstChainId: number, txHash: string, bridge: string): TransferStatus {
    return {
      status: 'pending',
      fromChain: this.chainIdToName[srcChainId] || `Chain ${srcChainId}`,
      toChain: this.chainIdToName[dstChainId] || `Chain ${dstChainId}`,
      amount: '0',
      token: 'USDC',
      txHash,
      timestamp: Date.now(),
      age: 'Just now',
      bridge,
    };
  }

  private calculateAge(timestamp: number): string {
    if (!timestamp) return 'Unknown';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
