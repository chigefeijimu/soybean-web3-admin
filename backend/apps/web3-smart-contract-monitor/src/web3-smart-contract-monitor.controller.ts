import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { 
  Web3SmartContractMonitorService, 
  MonitoredContract, 
  ContractEvent, 
  ContractAlert 
} from './web3-smart-contract-monitor.service';

@Controller('web3-smart-contract-monitor')
export class Web3SmartContractMonitorController {
  constructor(private readonly service: Web3SmartContractMonitorService) {}

  // ==================== Contracts ====================

  // Get all monitored contracts
  @Get('contracts')
  getContracts(
    @Query('chain') chain?: string,
    @Query('active') active?: string
  ): MonitoredContract[] {
    let contracts = chain 
      ? this.service.getContractsByChain(chain)
      : this.service.getContracts();

    if (active !== undefined) {
      contracts = contracts.filter(c => c.isActive === (active === 'true'));
    }

    return contracts;
  }

  // Get contract by ID
  @Get('contracts/:id')
  getContractById(@Param('id') id: string): MonitoredContract | undefined {
    return this.service.getContractById(id);
  }

  // Search contracts
  @Get('contracts-search')
  searchContracts(@Query('q') query: string): MonitoredContract[] {
    return this.service.searchContracts(query);
  }

  // Get contract by address
  @Get('address/:address')
  getContractByAddress(@Param('address') address: string): MonitoredContract | undefined {
    return this.service.getContractByAddress(address);
  }

  // Add new contract to monitor
  @Post('contracts')
  addContract(@Body() data: {
    address: string;
    chain: string;
    name?: string;
    description?: string;
    events?: string[];
    alertEnabled?: boolean;
    notifyEmail?: boolean;
    notifyWebhook?: boolean;
    webhookUrl?: string;
    isActive?: boolean;
  }): MonitoredContract {
    return this.service.addContract(data);
  }

  // Update contract
  @Put('contracts/:id')
  updateContract(
    @Param('id') id: string,
    @Body() updates: Partial<MonitoredContract>
  ): MonitoredContract | null {
    return this.service.updateContract(id, updates);
  }

  // Delete contract
  @Delete('contracts/:id')
  deleteContract(@Param('id') id: string): { success: boolean } {
    const deleted = this.service.deleteContract(id);
    return { success: deleted };
  }

  // Toggle contract active status
  @Post('contracts/:id/toggle')
  toggleContract(@Param('id') id: string): MonitoredContract | null {
    return this.service.toggleContract(id);
  }

  // ==================== Events ====================

  // Get all events
  @Get('events')
  getAllEvents(@Query('limit') limit?: string): ContractEvent[] {
    return this.service.getAllEvents(limit ? parseInt(limit) : undefined);
  }

  // Get events by chain
  @Get('events/chain/:chain')
  getEventsByChain(
    @Param('chain') chain: string,
    @Query('limit') limit?: string
  ): ContractEvent[] {
    return this.service.getEventsByChain(chain, limit ? parseInt(limit) : undefined);
  }

  // Get events for specific contract
  @Get('contracts/:id/events')
  getContractEvents(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('timeframe') timeframe?: '24h' | '7d' | '30d'
  ): ContractEvent[] {
    if (timeframe) {
      return this.service.getRecentEvents(id, timeframe);
    }
    return this.service.getContractEvents(id, limit ? parseInt(limit) : undefined);
  }

  // Simulate new event
  @Post('contracts/:id/events/simulate')
  simulateEvent(@Param('id') id: string): ContractEvent | null {
    return this.service.simulateEvent(id);
  }

  // ==================== Alerts ====================

  // Get all alerts
  @Get('alerts')
  getAllAlerts(
    @Query('limit') limit?: string,
    @Query('acknowledged') acknowledged?: string
  ): ContractAlert[] {
    let alerts = this.service.getAllAlerts(limit ? parseInt(limit) : undefined);
    
    if (acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === (acknowledged === 'true'));
    }
    
    return alerts;
  }

  // Get alerts for contract
  @Get('contracts/:id/alerts')
  getContractAlerts(@Param('id') id: string): ContractAlert[] {
    return this.service.getContractAlerts(id);
  }

  // Create alert
  @Post('alerts')
  createAlert(@Body() data: {
    contractId: string;
    contractAddress: string;
    chain: string;
    eventType: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
    data?: Record<string, unknown>;
  }): ContractAlert {
    return this.service.createAlert(data);
  }

  // Acknowledge alert
  @Post('alerts/:id/acknowledge')
  acknowledgeAlert(@Param('id') id: string): ContractAlert | null {
    return this.service.acknowledgeAlert(id);
  }

  // ==================== Configuration ====================

  // Get supported chains
  @Get('config/chains')
  getSupportedChains(): string[] {
    return this.service.getSupportedChains();
  }

  // Get common events
  @Get('config/events')
  getCommonEvents(): string[] {
    return this.service.getCommonEvents();
  }

  // ==================== Statistics ====================

  // Get statistics
  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
