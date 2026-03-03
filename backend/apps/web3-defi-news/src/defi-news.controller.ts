import { Controller, Get, Query, Param } from '@nestjs/common';
import { DefiNewsService, DefiNewsResponse } from './defi-news.service';

@Controller('api/defi-news')
export class DefiNewsController {
  constructor(private readonly defiNewsService: DefiNewsService) {}

  @Get()
  async getNews(
    @Query('protocol') protocol?: string,
    @Query('category') category?: string,
    @Query('sentiment') sentiment?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<DefiNewsResponse> {
    return this.defiNewsService.getNews({
      protocol,
      category,
      sentiment,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get('protocols')
  async getProtocols() {
    return this.defiNewsService.getProtocols();
  }

  @Get('protocol/:protocolId')
  async getProtocolNews(@Param('protocolId') protocolId: string) {
    return this.defiNewsService.getProtocolNews(protocolId);
  }

  @Get('trending')
  async getTrending() {
    return this.defiNewsService.getTrending();
  }

  @Get('categories')
  async getCategories() {
    return this.defiNewsService.getCategories();
  }
}
