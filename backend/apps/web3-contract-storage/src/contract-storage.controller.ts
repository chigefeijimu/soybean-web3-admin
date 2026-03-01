import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ContractStorageService, ContractStorageResult } from './contract-storage.service';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

class GetStorageDto {
  @IsString()
  address: string;

  @IsNumber()
  chainId: number;

  @IsString()
  slot: string;

  @IsOptional()
  @IsNumber()
  blockNumber?: number;
}

class GetMultipleSlotsDto {
  @IsString()
  address: string;

  @IsNumber()
  chainId: number;

  @IsArray()
  slots: string[];

  @IsOptional()
  @IsNumber()
  blockNumber?: number;
}

class GetMappingStorageDto {
  @IsString()
  address: string;

  @IsNumber()
  chainId: number;

  @IsNumber()
  mappingSlot: number;

  @IsOptional()
  @IsString()
  keyType?: string;

  @IsOptional()
  @IsString()
  valueType?: string;
}

@Controller('web3/contract-storage')
export class ContractStorageController {
  constructor(private readonly contractStorageService: ContractStorageService) {}

  @Get('slot/:chainId/:address/:slot')
  async getStorageAt(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
    @Param('slot') slot: string,
    @Query('blockNumber') blockNumber?: string,
  ): Promise<ContractStorageResult> {
    return this.contractStorageService.getStorageAt(
      address,
      chainId,
      slot,
      blockNumber ? parseInt(blockNumber) : 16,
    );
  }

  @Post('slots')
  async getMultipleSlots(@Body() dto: GetMultipleSlotsDto): Promise<ContractStorageResult> {
    return this.contractStorageService.getMultipleSlots(
      dto.address,
      dto.chainId,
      dto.slots,
      dto.blockNumber || 16,
    );
  }

  @Get('code/:chainId/:address')
  async getContractCode(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
  ): Promise<any> {
    return this.contractStorageService.getContractCode(address, chainId);
  }

  @Get('layout/:chainId/:address')
  async getStorageLayout(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
  ): Promise<any> {
    return this.contractStorageService.getStorageLayout(address, chainId);
  }

  @Post('mapping')
  async getMappingStorage(@Body() dto: GetMappingStorageDto): Promise<any> {
    return this.contractStorageService.getMappingStorage(
      dto.address,
      dto.chainId,
      dto.mappingSlot,
      dto.keyType || 'address',
      dto.valueType || 'uint256',
    );
  }

  @Get('health')
  async health(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
