import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DefiProtocolDiscoveryService, UserPreferences, DiscoveryResponse, ProtocolRecommendation } from './defi-protocol-discovery.service';

@Controller('api/defi-protocol-discovery')
export class DefiProtocolDiscoveryController {
  constructor(private readonly defiProtocolDiscoveryService: DefiProtocolDiscoveryService) {}

  @Post('discover')
  @HttpCode(HttpStatus.OK)
  discoverProtocols(@Body() preferences: UserPreferences): DiscoveryResponse {
    return this.defiProtocolDiscoveryService.discoverProtocols(preferences);
  }

  @Get('trending')
  getTrendingProtocols(): ProtocolRecommendation[] {
    return this.defiProtocolDiscoveryService.getTrendingProtocols();
  }

  @Get('categories')
  getAllCategories(): string[] {
    return this.defiProtocolDiscoveryService.getAllCategories();
  }

  @Get('chains')
  getAllChains(): string[] {
    return this.defiProtocolDiscoveryService.getAllChains();
  }

  @Get('category/:category')
  getProtocolsByCategory(@Param('category') category: string): ProtocolRecommendation[] {
    return this.defiProtocolDiscoveryService.getProtocolsByCategory(category);
  }

  @Get('protocol/:name')
  getProtocolDetails(@Param('name') name: string): ProtocolRecommendation | null {
    return this.defiProtocolDiscoveryService.getProtocolDetails(name);
  }

  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
