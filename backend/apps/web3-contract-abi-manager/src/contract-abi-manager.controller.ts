import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ContractAbiManagerService, ABIEntry, DecodedTransaction, FunctionSignature } from './contract-abi-manager.service';

class AddABIDto {
  name: string;
  address: string;
  chain: string;
  abi: string;
  tags?: string[];
}

class DecodeTxDto {
  chain: string;
  address: string;
  data: string;
}

class LookupSignatureDto {
  selector: string;
}

@Controller('contract-abi')
export class ContractAbiManagerController {
  constructor(private readonly abiService: ContractAbiManagerService) {}

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  async addABI(@Body() dto: AddABIDto): Promise<ABIEntry> {
    return this.abiService.addABI(dto.name, dto.address, dto.chain, dto.abi, dto.tags || []);
  }

  @Get('get/:chain/:address')
  async getABI(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ): Promise<ABIEntry | null> {
    return this.abiService.getABI(chain, address.toLowerCase());
  }

  @Post('search')
  async searchABIs(@Body('query') query: string): Promise<ABIEntry[]> {
    return this.abiService.searchABIs(query);
  }

  @Get('list')
  async listABIs(
    @Query('chain') chain?: string,
    @Query('tags') tags?: string,
  ): Promise<ABIEntry[]> {
    const tagList = tags ? tags.split(',') : undefined;
    return this.abiService.listABIs(chain, tagList);
  }

  @Post('decode-tx')
  async decodeTransaction(@Body() dto: DecodeTxDto): Promise<DecodedTransaction | null> {
    return this.abiService.decodeTransaction(dto.chain, dto.address.toLowerCase(), dto.data);
  }

  @Post('lookup-signature')
  async lookupSignature(@Body() dto: LookupSignatureDto): Promise<FunctionSignature | null> {
    return this.abiService.lookupSignature(dto.selector);
  }

  @Get('signatures')
  async getFunctionSignatures(): Promise<FunctionSignature[]> {
    return this.abiService.getFunctionSignatures();
  }

  @Post('verify')
  async verifyABI(
    @Body() dto: { chain: string; address: string; code: string },
  ): Promise<{ verified: boolean }> {
    const verified = await this.abiService.verifyABI(dto.chain, dto.address.toLowerCase(), dto.code);
    return { verified };
  }

  @Delete('delete/:chain/:address')
  async deleteABI(
    @Param('chain') chain: string,
    @Param('address') address: string,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.abiService.deleteABI(chain, address.toLowerCase());
    return { deleted };
  }

  @Get('popular')
  async getPopularABIs(): Promise<ABIEntry[]> {
    return this.abiService.getPopularABIs();
  }

  @Get('stats')
  async getStats(): Promise<{
    totalABIs: number;
    totalFunctions: number;
    totalEvents: number;
    chains: Record<string, number>;
  }> {
    return this.abiService.getStats();
  }
}
