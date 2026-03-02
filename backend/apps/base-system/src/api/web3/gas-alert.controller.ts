import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Web3GasService } from './web3-gas.service';

export interface GasAlert {
  id: string;
  chainId: number;
  targetGasPrice: number;
  direction: 'below' | 'above';
  enabled: boolean;
  triggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

@ApiTags('Web3 Gas Alert')
@Controller('web3/gas-alert')
export class Web3GasAlertController {
  private alerts: Map<string, GasAlert> = new Map();
  private alertIdCounter = 1;

  constructor(private readonly web3GasService: Web3GasService) {
    // Initialize with some demo alerts
    this.alerts.set('1', {
      id: '1',
      chainId: 1,
      targetGasPrice: 30,
      direction: 'below',
      enabled: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    });
    this.alerts.set('2', {
      id: '2',
      chainId: 137,
      targetGasPrice: 50,
      direction: 'below',
      enabled: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    });
  }

  @Get('list')
  @ApiOperation({ summary: '获取Gas价格提醒列表' })
  async getAlerts() {
    return Array.from(this.alerts.values());
  }

  @Post('create')
  @ApiOperation({ summary: '创建Gas价格提醒' })
  async createAlert(
    @Body() body: { chainId: number; targetGasPrice: number; direction: 'below' | 'above' },
  ) {
    const id = String(this.alertIdCounter++);
    const alert: GasAlert = {
      id,
      chainId: body.chainId,
      targetGasPrice: body.targetGasPrice,
      direction: body.direction,
      enabled: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  @Post('toggle')
  @ApiOperation({ summary: '启用/禁用提醒' })
  async toggleAlert(@Body() body: { id: string; enabled: boolean }) {
    const alert = this.alerts.get(body.id);
    if (alert) {
      alert.enabled = body.enabled;
      return alert;
    }
    return { error: 'Alert not found' };
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除Gas价格提醒' })
  async deleteAlert(@Query('id') id: string) {
    return this.alerts.delete(id);
  }

  @Get('check')
  @ApiOperation({ summary: '检查Gas价格是否触发提醒' })
  async checkAlerts() {
    const alerts = Array.from(this.alerts.values()).filter((a) => a.enabled && !a.triggered);
    const gasPrices = await this.web3GasService.getAllGasPrices();
    const triggered: GasAlert[] = [];

    for (const alert of alerts) {
      const gasPrice = gasPrices.find((g) => g.chainId === alert.chainId);
      if (!gasPrice) continue;

      const currentGasPrice = gasPrice.normal || gasPrice.fast || gasPrice.slow || 0;
      const shouldTrigger =
        (alert.direction === 'below' && currentGasPrice <= alert.targetGasPrice) ||
        (alert.direction === 'above' && currentGasPrice >= alert.targetGasPrice);

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = new Date().toISOString();
        triggered.push(alert);
      }
    }

    return {
      alerts: Array.from(this.alerts.values()),
      triggered,
      gasPrices,
    };
  }

  @Get('status')
  @ApiOperation({ summary: '获取Gas价格提醒状态' })
  async getStatus() {
    const alerts = Array.from(this.alerts.values());
    const gasPrices = await this.web3GasService.getAllGasPrices();

    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((a) => a.enabled && !a.triggered).length,
      triggeredToday: alerts.filter((a) => a.triggered && a.triggeredAt?.startsWith(new Date().toISOString().split('T')[0])).length,
      gasPrices,
    };
  }
}
