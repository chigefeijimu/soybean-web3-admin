import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RpcException } from '@nestjs/microservices';
import { ContractSecurityAuditService } from './contract-security-audit.service';

class AuditContractDto {
  address: string;
  chain: string;
}

class BatchAuditDto {
  addresses: string[];
  chain: string;
}

@ApiTags('Contract Security Audit')
@Controller('web3/contract-security-audit')
export class ContractSecurityAuditController {
  constructor(private readonly service: ContractSecurityAuditService) {}

  @Post('audit')
  @ApiOperation({ summary: 'Audit a smart contract for security vulnerabilities' })
  async auditContract(@Body(new ValidationPipe({ transform: true })) dto: AuditContractDto) {
    try {
      return await this.service.auditContract(dto.address, dto.chain);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @Post('batch-audit')
  @ApiOperation({ summary: 'Batch audit multiple smart contracts' })
  async batchAudit(@Body(new ValidationPipe({ transform: true })) dto: BatchAuditDto) {
    try {
      return await this.service.batchAudit(dto.addresses, dto.chain);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Get audit history for an address' })
  @ApiQuery({ name: 'address', required: true, description: 'Contract address' })
  @ApiQuery({ name: 'chain', required: true, description: 'Chain name' })
  async getAuditHistory(
    @Query('address') address: string,
    @Query('chain') chain: string
  ) {
    try {
      return await this.service.getAuditHistory(address, chain);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @Get('vulnerabilities')
  @ApiOperation({ summary: 'Get known vulnerability patterns' })
  @ApiQuery({ name: 'category', required: false, description: 'Vulnerability category' })
  async getVulnerabilityPatterns(@Query('category') category?: string) {
    return this.service.getVulnerabilityPatterns(category);
  }

  @Get('common-issues/:chain')
  @ApiOperation({ summary: 'Get common security issues for a chain' })
  @ApiParam({ name: 'chain', description: 'Chain name' })
  async getCommonIssues(@Param('chain') chain: string) {
    return this.service.getCommonIssues(chain);
  }
}
