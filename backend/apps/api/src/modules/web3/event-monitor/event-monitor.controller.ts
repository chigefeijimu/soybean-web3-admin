import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EventMonitorService, EventSubscription, ContractEvent, EventAlert } from './event-monitor.service';

class CreateSubscriptionDto {
  userId?: string;
  chain: string;
  contractAddress: string;
  eventName: string;
  eventSignature: string;
  conditions?: { field: string; operator: string; value: string }[];
  webhookUrl?: string;
}

class UpdateSubscriptionDto {
  chain?: string;
  contractAddress?: string;
  eventName?: string;
  eventSignature?: string;
  conditions?: { field: string; operator: string; value: string }[];
  webhookUrl?: string;
}

class QueryEventsDto {
  chain?: string;
  contractAddress?: string;
  eventName?: string;
  fromBlock?: number;
  toBlock?: number;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}

class SimulateEventDto {
  chain: string;
  contractAddress: string;
  eventName: string;
  eventSignature: string;
  blockNumber?: number;
  args?: Record<string, unknown>;
}

@Controller('web3/event-monitor')
export class EventMonitorController {
  constructor(private readonly eventMonitorService: EventMonitorService) {}

  // Get event templates
  @Get('templates')
  getEventTemplates() {
    return this.eventMonitorService.getEventTemplates();
  }

  // Get protocol event signatures
  @Get('templates/:protocol')
  getProtocolEvents(@Param('protocol') protocol: string) {
    return this.eventMonitorService.getProtocolEventSignatures(protocol);
  }

  // Get supported chains
  @Get('chains')
  getSupportedChains() {
    return this.eventMonitorService.getSupportedChains();
  }

  // Get event statistics
  @Get('stats')
  getEventStats() {
    return this.eventMonitorService.getEventStats();
  }

  // Get recent events
  @Get('events')
  getRecentEvents(@Query('limit') limit?: number) {
    return this.eventMonitorService.getRecentEvents(limit || 20);
  }

  // Query events with filters
  @Post('events/query')
  queryEvents(@Body() query: QueryEventsDto) {
    return this.eventMonitorService.queryEvents({
      ...query,
      fromTimestamp: query.fromTimestamp ? new Date(query.fromTimestamp) : undefined,
      toTimestamp: query.toTimestamp ? new Date(query.toTimestamp) : undefined,
    });
  }

  // Get events for a specific contract
  @Get('contracts/:chain/:address/events')
  getContractEvents(
    @Param('chain') chain: string,
    @Param('address') address: string,
    @Query('limit') limit?: number,
  ) {
    return this.eventMonitorService.getContractEvents(chain, address, limit || 50);
  }

  // Get user subscriptions
  @Get('subscriptions')
  getUserSubscriptions(@Query('userId') userId: string) {
    return this.eventMonitorService.getUserSubscriptions(userId || 'user_1');
  }

  // Get subscription by ID
  @Get('subscriptions/:id')
  getSubscriptionById(@Param('id') id: string) {
    return this.eventMonitorService.getSubscriptionById(id);
  }

  // Create a new subscription
  @Post('subscriptions')
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.eventMonitorService.createSubscription({
      ...dto,
      conditions: dto.conditions?.map(c => ({
        field: c.field,
        operator: c.operator as any,
        value: c.value,
      })),
    });
  }

  // Update subscription
  @Put('subscriptions/:id')
  updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.eventMonitorService.updateSubscription(id, {
      ...dto,
      conditions: dto.conditions?.map(c => ({
        field: c.field,
        operator: c.operator as any,
        value: c.value,
      })),
    });
  }

  // Delete subscription
  @Delete('subscriptions/:id')
  deleteSubscription(@Param('id') id: string) {
    return { success: this.eventMonitorService.deleteSubscription(id) };
  }

  // Toggle subscription active status
  @Put('subscriptions/:id/toggle')
  toggleSubscription(
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    return this.eventMonitorService.toggleSubscription(id, active);
  }

  // Get user alerts
  @Get('alerts')
  getUserAlerts(@Query('userId') userId: string) {
    return this.eventMonitorService.getUserAlerts(userId || 'user_1');
  }

  // Get alert statistics
  @Get('alerts/stats')
  getAlertStats(@Query('userId') userId: string) {
    return this.eventMonitorService.getAlertStats(userId || 'user_1');
  }

  // Simulate an event (for testing)
  @Post('simulate')
  simulateEvent(@Body() dto: SimulateEventDto) {
    return this.eventMonitorService.simulateEvent(dto);
  }
}
