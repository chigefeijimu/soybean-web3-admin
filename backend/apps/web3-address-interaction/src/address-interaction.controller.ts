import { Controller, Get, Query } from '@nestjs/common';
import { AddressInteractionService } from './address-interaction.service';

@Controller('web3/address-interaction')
export class AddressInteractionController {
  constructor(private readonly addressInteractionService: AddressInteractionService) {}

  @Get('analyze')
  async analyzeInteraction(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.addressInteractionService.analyzeInteraction(
      address1,
      address2,
      parseInt(chainId, 10),
    );
  }

  @Get('transactions')
  async getCommonTransactions(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.addressInteractionService.getCommonTransactions(
      address1,
      address2,
      parseInt(chainId, 10),
    );
  }

  @Get('timeline')
  async getInteractionTimeline(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chainId') chainId: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.addressInteractionService.getInteractionTimeline(
      address1,
      address2,
      parseInt(chainId, 10),
      parseInt(limit, 10),
    );
  }

  @Get('statistics')
  async getInteractionStats(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.addressInteractionService.getInteractionStats(
      address1,
      address2,
      parseInt(chainId, 10),
    );
  }
}
