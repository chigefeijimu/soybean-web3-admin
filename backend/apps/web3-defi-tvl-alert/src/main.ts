import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import axios from 'axios';

interface TVLAlert {
  id: string;
  userId: string;
  protocol: string;
  chain: string;
  condition: 'increase_above' | 'decrease_below' | 'change_percent';
  threshold: number;
  currentTVL?: number;
  previousTVL?: number;
  enabled: boolean;
  webhookUrl?: string;
  createdAt: Date;
}

interface AlertHistory {
  id: string;
  alertId: string;
  userId: string;
  protocol: string;
  chain: string;
  previousTVL: number;
  currentTVL: number;
  changePercent: number;
  triggeredAt: Date;
  notified: boolean;
}

interface ProtocolTVL {
  protocol: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChangePercent7d: number;
}

// 模拟数据存储
const alerts: Map<string, TVLAlert> = new Map();
const alertHistory: AlertHistory[] = [];

// DeFi协议TVL数据（模拟数据，实际会调用DeFiLlama API）
const DEFILLAMA_API = 'https://api.llama.fi';

// 支持的链
const SUPPORTED_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 'solana'];

// 支持的协议
const SUPPORTED_PROTOCOLS = [
  'aave', 'uniswap', 'lido', 'curve', 'compound', 'yearn', 'makerdao', 
  'balancer', 'morpho', 'gearbox', 'frax', 'rocket-pool', 'stargate',
  'venus', 'pancakeswap', 'sushiswap', 'quick', 'trader-joe', 'velodrome'
];

@Controller('api')
class DefiTvlAlertController {
  
  // ============ TVL数据接口 ============

  @Get('tvl/:protocol')
  async getProtocolTVL(
    @Param('protocol') protocol: string,
    @Query('chain') chain: string = 'ethereum',
  ): Promise<ProtocolTVL | { error: string }> {
    try {
      const tvlData = await this.getProtocolTVLData(protocol, chain);
      return tvlData;
    } catch (e) {
      return { error: 'Protocol not found or API error' };
    }
  }

  @Get('tvl')
  async getAllProtocolsTVL(@Query('chain') chain: string = 'ethereum'): Promise<ProtocolTVL[]> {
    return this.getTopProtocolsTVL(chain);
  }

  @Get('tvl/chains')
  async getChainsTVL(): Promise<{ chain: string; tvl: number; change24h: number }[]> {
    try {
      const response = await axios.get(`${DEFILLAMA_API}/chains`, { timeout: 10000 });
      return response.data.protocols?.slice(0, 20).map((p: any) => ({
        chain: p.name?.toLowerCase() || p.chain,
        tvl: p.tvl || 0,
        change24h: p.change_1d || 0,
      })) || [];
    } catch (e) {
      // 返回模拟数据
      return [
        { chain: 'ethereum', tvl: 150000000000, change24h: 2.5 },
        { chain: 'polygon', tvl: 1200000000, change24h: 1.8 },
        { chain: 'arbitrum', tvl: 3500000000, change24h: 3.2 },
        { chain: 'optimism', tvl: 2800000000, change24h: -1.2 },
        { chain: 'bsc', tvl: 4500000000, change24h: 0.5 },
        { chain: 'avalanche', tvl: 1200000000, change24h: -2.1 },
        { chain: 'base', tvl: 1800000000, change24h: 5.3 },
      ];
    }
  }

  @Get('tvl/history/:protocol')
  async getProtocolTVLHistory(
    @Param('protocol') protocol: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('days') days: string = '30',
  ): Promise<{ timestamp: number; tvl: number }[] | { error: string }> {
    try {
      const response = await axios.get(
        `${DEFILLAMA_API}/protocol/${protocol.toLowerCase()}`,
        { timeout: 10000 }
      );
      
      const chainData = response.data.chainTvls?.[chain] || response.data.chainTvls?.ethereum;
      if (!chainData || !chainData.tvl) {
        return { error: 'Protocol TVL data not found' };
      }
      
      const daysNum = parseInt(days) || 30;
      const cutoffTime = Date.now() - daysNum * 24 * 60 * 60 * 1000;
      
      return chainData.tvl
        .filter((p: any) => p.date * 1000 >= cutoffTime)
        .map((p: any) => ({ timestamp: p.date * 1000, tvl: p.totalValueUSD }));
    } catch (e) {
      // 返回模拟历史数据
      const daysNum = parseInt(days) || 30;
      const history: { timestamp: number; tvl: number }[] = [];
      const baseTVL = 2500000000;
      
      for (let i = daysNum; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variance = (Math.random() - 0.5) * 200000000;
        history.push({
          timestamp: date.getTime(),
          tvl: baseTVL + variance + (daysNum - i) * 10000000,
        });
      }
      return history;
    }
  }

  // ============ 警报接口 ============

  @Post('alerts/tvl')
  async createTVLAlert(@Body() body: any): Promise<TVLAlert> {
    const alert: TVLAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: body.userId,
      protocol: body.protocol.toLowerCase(),
      chain: body.chain || 'ethereum',
      condition: body.condition as 'increase_above' | 'decrease_below' | 'change_percent',
      threshold: body.threshold,
      enabled: body.enabled !== false,
      webhookUrl: body.webhookUrl,
      createdAt: new Date(),
    };
    
    // 获取当前TVL作为基准
    try {
      const tvlData = await this.getProtocolTVLData(alert.protocol, alert.chain);
      alert.currentTVL = tvlData.tvl;
      alert.previousTVL = tvlData.tvl;
    } catch (e) {
      alert.currentTVL = 0;
      alert.previousTVL = 0;
    }
    
    alerts.set(alert.id, alert);
    return alert;
  }

  @Get('alerts/tvl')
  async getUserTVLAlerts(@Query('userId') userId: string): Promise<TVLAlert[]> {
    return Array.from(alerts.values()).filter(a => a.userId === userId);
  }

  @Get('alerts/tvl/:id')
  async getAlertById(@Param('id') alertId: string): Promise<TVLAlert | null> {
    return alerts.get(alertId) || null;
  }

  @Delete('alerts/tvl/:id')
  async deleteTVLAlert(
    @Param('id') alertId: string,
    @Query('userId') userId: string,
  ): Promise<{ success: boolean }> {
    const alert = alerts.get(alertId);
    if (alert && alert.userId === userId) {
      alerts.delete(alertId);
      return { success: true };
    }
    return { success: false };
  }

  @Post('alerts/tvl/:id/toggle')
  async toggleTVLAlert(
    @Param('id') alertId: string,
    @Body() body: { userId: string; enabled: boolean },
  ): Promise<TVLAlert | { error: string }> {
    const alert = alerts.get(alertId);
    if (!alert || alert.userId !== body.userId) {
      return { error: 'Alert not found or unauthorized' };
    }
    alert.enabled = body.enabled;
    alerts.set(alertId, alert);
    return alert;
  }

  @Post('alerts/tvl/:id/update')
  async updateTVLAlertThreshold(
    @Param('id') alertId: string,
    @Body() body: { userId: string; threshold?: number; condition?: string; webhookUrl?: string },
  ): Promise<TVLAlert | { error: string }> {
    const alert = alerts.get(alertId);
    if (!alert || alert.userId !== body.userId) {
      return { error: 'Alert not found or unauthorized' };
    }
    
    if (body.threshold !== undefined) alert.threshold = body.threshold;
    if (body.condition) alert.condition = body.condition as 'increase_above' | 'decrease_below' | 'change_percent';
    if (body.webhookUrl !== undefined) alert.webhookUrl = body.webhookUrl;
    
    alerts.set(alertId, alert);
    return alert;
  }

  @Get('alerts/tvl/history')
  async getAlertHistory(
    @Query('userId') userId: string,
    @Query('limit') limit: string = '50',
  ): Promise<AlertHistory[]> {
    const userHistory = alertHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, parseInt(limit) || 50);
    return userHistory;
  }

  @Post('alerts/tvl/check')
  async checkTVLAlerts(): Promise<{ triggered: number; alerts: AlertHistory[] }> {
    const triggeredAlerts: AlertHistory[] = [];
    
    for (const alert of Array.from(alerts.values())) {
      if (!alert.enabled) continue;
      
      try {
        const tvlData = await this.getProtocolTVLData(alert.protocol, alert.chain);
        const previousTVL = alert.currentTVL || tvlData.tvl;
        const currentTVL = tvlData.tvl;
        const changePercent = previousTVL ? ((currentTVL - previousTVL) / previousTVL) * 100 : 0;
        
        let shouldTrigger = false;
        
        switch (alert.condition) {
          case 'increase_above':
            shouldTrigger = currentTVL >= alert.threshold && previousTVL < alert.threshold;
            break;
          case 'decrease_below':
            shouldTrigger = currentTVL <= alert.threshold && previousTVL > alert.threshold;
            break;
          case 'change_percent':
            shouldTrigger = Math.abs(changePercent) >= alert.threshold;
            break;
        }
        
        if (shouldTrigger) {
          const history: AlertHistory = {
            id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alertId: alert.id,
            userId: alert.userId,
            protocol: alert.protocol,
            chain: alert.chain,
            previousTVL,
            currentTVL,
            changePercent,
            triggeredAt: new Date(),
            notified: false,
          };
          
          alertHistory.push(history);
          triggeredAlerts.push(history);
          
          // 更新alert的TVL
          alert.previousTVL = previousTVL;
          alert.currentTVL = currentTVL;
          alerts.set(alert.id, alert);
          
          // 发送webhook通知
          if (alert.webhookUrl) {
            this.sendWebhookNotification(alert, history);
          }
        }
      } catch (e) {
        console.error(`Error checking alert ${alert.id}:`, e);
      }
    }
    
    return { triggered: triggeredAlerts.length, alerts: triggeredAlerts };
  }

  // ============ 支持的协议和链 ============

  @Get('supported/protocols')
  async getSupportedProtocols(): Promise<string[]> {
    return SUPPORTED_PROTOCOLS;
  }

  @Get('supported/chains')
  async getSupportedChains(): Promise<string[]> {
    return SUPPORTED_CHAINS;
  }

  // ============ 系统接口 ============

  @Get('health')
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('info')
  async getApiInfo() {
    return {
      name: 'DeFi TVL Alert API',
      version: '1.0.0',
      description: 'Monitor DeFi protocol TVL changes and receive alerts',
      endpoints: {
        tvl: 'GET /api/tvl/:protocol - Get protocol TVL',
        tvlAll: 'GET /api/tvl - Get all protocols TVL',
        tvlChains: 'GET /api/tvl/chains - Get TVL by chains',
        tvlHistory: 'GET /api/tvl/history/:protocol - Get TVL history',
        createAlert: 'POST /api/alerts/tvl - Create TVL alert',
        getAlerts: 'GET /api/alerts/tvl?userId=xxx - Get user alerts',
        checkAlerts: 'POST /api/alerts/tvl/check - Check and trigger alerts',
      },
    };
  }

  // ============ 辅助方法 ============

  private async getProtocolTVLData(protocol: string, chain: string): Promise<ProtocolTVL> {
    try {
      const response = await axios.get(
        `${DEFILLAMA_API}/protocol/${protocol.toLowerCase()}`,
        { timeout: 10000 }
      );
      
      const chainData = response.data.chainTvls?.[chain] || response.data.chainTvls?.ethereum;
      const tvl = chainData?.tvl || response.data.tvl || 0;
      
      return {
        protocol: protocol.toLowerCase(),
        chain: chain,
        tvl: typeof tvl === 'number' ? tvl : tvl[tvl.length - 1]?.totalValueUSD || 0,
        tvlChange24h: chainData?.change_1d || response.data.change_1d || 0,
        tvlChangePercent7d: chainData?.change_7d || response.data.change_7d || 0,
      };
    } catch (e) {
      // 返回模拟数据
      const mockTVL = this.getMockTVL(protocol, chain);
      return mockTVL;
    }
  }

  private getMockTVL(protocol: string, chain: string): ProtocolTVL {
    const mockData: Record<string, number> = {
      'aave': 150000000000,
      'uniswap': 8000000000,
      'lido': 35000000000,
      'curve': 25000000000,
      'compound': 12000000000,
      'yearn': 8000000000,
      'makerdao': 10000000000,
      'balancer': 5000000000,
      'morpho': 3000000000,
      'venus': 2000000000,
      'pancakeswap': 3000000000,
      'sushiswap': 1500000000,
    };
    
    return {
      protocol: protocol.toLowerCase(),
      chain: chain,
      tvl: mockData[protocol.toLowerCase()] || 1000000000 + Math.random() * 5000000000,
      tvlChange24h: (Math.random() - 0.5) * 10,
      tvlChangePercent7d: (Math.random() - 0.5) * 20,
    };
  }

  private async getTopProtocolsTVL(chain: string): Promise<ProtocolTVL[]> {
    try {
      const response = await axios.get(`${DEFILLAMA_API}/overview/tvl`, {
        params: { chain: chain },
        timeout: 10000,
      });
      
      return response.data.protocols?.slice(0, 50).map((p: any) => ({
        protocol: p.name?.toLowerCase() || p.slug,
        chain: chain,
        tvl: p.tvl || 0,
        tvlChange24h: p.change_1d || 0,
        tvlChangePercent7d: p.change_7d || 0,
      })) || [];
    } catch (e) {
      // 返回模拟数据
      return SUPPORTED_PROTOCOLS.map(p => this.getMockTVL(p, chain));
    }
  }

  private async sendWebhookNotification(alert: TVLAlert, history: AlertHistory) {
    try {
      if (!alert.webhookUrl) return;
      
      const payload = {
        alert_type: 'TVL_CHANGE',
        protocol: alert.protocol,
        chain: alert.chain,
        condition: alert.condition,
        threshold: alert.threshold,
        previous_tvl: history.previousTVL,
        current_tvl: history.currentTVL,
        change_percent: history.changePercent.toFixed(2),
        timestamp: history.triggeredAt.toISOString(),
        message: `${alert.protocol.toUpperCase()} on ${alert.chain} TVL changed by ${history.changePercent.toFixed(2)}%`,
      };
      
      await axios.post(alert.webhookUrl, payload, { timeout: 5000 });
      
      // 标记为已通知
      history.notified = true;
    } catch (e) {
      console.error('Webhook notification failed:', e);
    }
  }
}

@Module({
  controllers: [DefiTvlAlertController],
})
class DefiTvlAlertModule {}

async function bootstrap() {
  const app = await NestFactory.create(DefiTvlAlertModule);
  const port = process.env.PORT || 3009;
  await app.listen(port);
  console.log(`DeFi TVL Alert API running on port ${port}`);
}

bootstrap();
