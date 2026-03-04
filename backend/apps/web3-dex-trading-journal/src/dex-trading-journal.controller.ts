import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { 
  DexTradingJournalService, 
  DexTradeQueryDto, 
  DexTradeCreateDto, 
  DexTradeDto, 
  DexTradingSummaryDto,
  DexTradeAnalysisDto,
  TimeRange
} from './dex-trading-journal.service';

@ApiTags('DEX Trading Journal')
@Controller()
export class DexTradingJournalController {
  constructor(private readonly journalService: DexTradingJournalService) {}

  @Get('trades')
  @ApiOperation({ summary: 'Get trading journal entries for a wallet address' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'timeRange', required: false, enum: TimeRange })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of trades' })
  getTrades(@Query() query: DexTradeQueryDto) {
    return this.journalService.getTrades(query);
  }

  @Get('trades/:id')
  @ApiOperation({ summary: 'Get a specific trade by ID' })
  @ApiResponse({ status: 200, description: 'Trade details', type: DexTradeDto })
  getTradeById(@Param('id') id: string) {
    return this.journalService.getTradeById(id);
  }

  @Post('trades')
  @ApiOperation({ summary: 'Add a new trade entry' })
  @ApiResponse({ status: 201, description: 'Trade created', type: DexTradeDto })
  createTrade(@Body() dto: DexTradeCreateDto) {
    return this.journalService.createTrade(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get trading summary and statistics' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'timeRange', required: false, enum: TimeRange })
  @ApiResponse({ status: 200, description: 'Trading summary', type: DexTradingSummaryDto })
  getTradingSummary(@Query('address') address: string, @Query('timeRange') timeRange?: TimeRange) {
    return this.journalService.getTradingSummary(address, timeRange);
  }

  @Get('analysis')
  @ApiOperation({ summary: 'Get trading analysis and insights' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Trading analysis', type: DexTradeAnalysisDto })
  getTradingAnalysis(@Query('address') address: string) {
    return this.journalService.getTradingAnalysis(address);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get DEX rankings by volume' })
  @ApiResponse({ status: 200, description: 'DEX rankings' })
  getDexRankings() {
    return this.journalService.getDexRankings();
  }
}
