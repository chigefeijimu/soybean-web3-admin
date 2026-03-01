import { Controller, Get, Query } from '@nestjs/common';
import { FearGreedService, FearGreedIndex, FearGreedHistory } from './fear-greed.service';

@Controller('web3/fear-greed')
export class FearGreedController {
  constructor(private readonly fearGreedService: FearGreedService) {}

  /**
   * 获取当前恐惧贪婪指数
   */
  @Get()
  async getCurrentIndex(): Promise<FearGreedIndex> {
    return this.fearGreedService.getCurrentIndex();
  }

  /**
   * 获取历史数据
   * @param limit 返回数量 (默认30，最大90)
   */
  @Get('history')
  async getHistory(
    @Query('limit') limit?: string
  ): Promise<FearGreedHistory> {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    return this.fearGreedService.getHistory(Math.min(Math.max(limitNum, 1), 90));
  }

  /**
   * 获取指定日期范围的数据
   * @param start 开始日期 (Unix timestamp)
   * @param end 结束日期 (Unix timestamp)
   */
  @Get('range')
  async getByDateRange(
    @Query('start') start: string,
    @Query('end') end: string
  ): Promise<FearGreedHistory> {
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    
    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error('Invalid date parameters');
    }
    
    return this.fearGreedService.getByDateRange(startNum, endNum);
  }
}
