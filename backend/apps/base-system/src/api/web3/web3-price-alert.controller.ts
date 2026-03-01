import { Controller, Get, Post, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Web3PriceAlertService } from './web3-price-alert.service';

@ApiTags('Web3 Price Alert')
@Controller('web3/price-alerts')
export class Web3PriceAlertController {
  constructor(private readonly priceAlertService: Web3PriceAlertService) {}

  @Post()
  @ApiOperation({ summary: '创建价格提醒' })
  async createAlert(
    @Body() createAlertDto: {
      token: string;
      symbol: string;
      targetPrice: number;
      condition: 'above' | 'below';
      userId?: string;
    },
  ) {
    return this.priceAlertService.createAlert(createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: '获取价格提醒列表' })
  async getAlerts(@Query('userId') userId?: string) {
    return this.priceAlertService.getAlerts(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除价格提醒' })
  async deleteAlert(@Param('id') id: string) {
    return this.priceAlertService.deleteAlert(id);
  }

  @Post(':id/trigger')
  @ApiOperation({ summary: '手动触发价格提醒检查' })
  async triggerCheck(@Param('id') id: string) {
    return this.priceAlertService.checkAndTriggerAlert(id);
  }

  @Get('check/:token')
  @ApiOperation({ summary: '检查代币价格是否触发提醒' })
  async checkPrice(@Param('token') token: string) {
    return this.priceAlertService.checkPriceAlerts(token);
  }
}
