import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AddressLabelService } from './address-label.service';

@ApiTags('Address Label')
@Controller('address-label')
export class AddressLabelController {
  constructor(private readonly addressLabelService: AddressLabelService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for address labels' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  async search(
    @Query('query') query?: string,
    @Query('category') category?: string,
  ) {
    return this.addressLabelService.searchLabels(query, category);
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get label for a specific address' })
  async getAddressLabel(@Param('address') address: string) {
    return this.addressLabelService.getLabelByAddress(address);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return this.addressLabelService.getCategories();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular/known addresses' })
  async getPopularLabels() {
    return this.addressLabelService.getPopularLabels();
  }

  @Get('whale-alerts')
  @ApiOperation({ summary: 'Get known whale addresses' })
  async getWhaleAddresses() {
    return this.addressLabelService.getWhaleAddresses();
  }

  @Get('cex-wallets')
  @ApiOperation({ summary: 'Get known CEX wallet addresses' })
  async getCexWallets() {
    return this.addressLabelService.getCexWallets();
  }
}
