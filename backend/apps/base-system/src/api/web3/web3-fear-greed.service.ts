import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface FearGreedIndex {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export interface FearGreedHistory {
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
  }>;
}

@Injectable()
export class FearGreedService {
  private readonly baseUrl = 'https://api.alternative.me/fng';

  constructor(private readonly httpService: HttpService) {}

  /**
   * 获取当前恐惧贪婪指数
   */
  async getCurrentIndex(): Promise<FearGreedIndex> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl)
      );
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      throw new HttpException('No data returned from API', HttpStatus.NO_CONTENT);
    } catch (error) {
      console.error('FearGreed API Error:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch fear and greed index',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * 获取历史恐惧贪婪指数
   * @param limit 返回数量 (默认30，最大90)
   */
  async getHistory(limit: number = 30): Promise<FearGreedHistory> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/?limit=${limit}`)
      );
      
      if (response.data && response.data.data) {
        return { data: response.data.data };
      }
      
      throw new HttpException('No data returned from API', HttpStatus.NO_CONTENT);
    } catch (error) {
      console.error('FearGreed History API Error:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch fear and greed history',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * 获取指定日期范围的恐惧贪婪指数
   * @param startDate 开始日期 (Unix timestamp)
   * @param endDate 结束日期 (Unix timestamp)
   */
  async getByDateRange(startDate: number, endDate: number): Promise<FearGreedHistory> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/?start=${startDate}&end=${endDate}`)
      );
      
      if (response.data && response.data.data) {
        return { data: response.data.data };
      }
      
      throw new HttpException('No data returned from API', HttpStatus.NO_CONTENT);
    } catch (error) {
      console.error('FearGreed DateRange API Error:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch fear and greed data by date range',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
