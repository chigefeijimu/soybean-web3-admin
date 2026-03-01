import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { DappBrowserService } from './dapp-browser.service';

interface Dapp {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  logo?: string;
  chains: number[];
  isCustom?: boolean;
}

@Controller('web3/dapp-browser')
export class DappBrowserController {
  constructor(private readonly dappBrowserService: DappBrowserService) {}

  @Get('list')
  async getDappList(@Query('category') category?: string) {
    return this.dappBrowserService.getDappList(category);
  }

  @Get('categories')
  async getCategories() {
    return this.dappBrowserService.getCategories();
  }

  @Get(':id')
  async getDapp(@Param('id') id: string) {
    return this.dappBrowserService.getDapp(id);
  }

  @Post('custom')
  async addCustomDapp(@Body() dapp: Partial<Dapp>) {
    return this.dappBrowserService.addCustomDapp(dapp);
  }

  @Delete('custom/:id')
  async removeCustomDapp(@Param('id') id: string) {
    return this.dappBrowserService.removeCustomDapp(id);
  }

  @Get('search/query')
  async searchDapps(@Query('q') query: string) {
    return this.dappBrowserService.searchDapps(query);
  }

  @Get('trending/list')
  async getTrendingDapps() {
    return this.dappBrowserService.getTrendingDapps();
  }
}
