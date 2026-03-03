import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DaoProposalAlertService, Alert, DaoProposal } from './dao-proposal-alert.service';

@Controller('dao-proposal-alert')
export class DaoProposalAlertController {
  constructor(private readonly service: DaoProposalAlertService) {}

  // Get all supported DAOs
  @Get('daos')
  getSupportedDaos() {
    return {
      success: true,
      data: this.service.getSupportedDaos(),
    };
  }

  // Get proposals with filters
  @Get('proposals')
  getProposals(
    @Query('dao') dao?: string,
    @Query('status') status?: string,
    @Query('chain') chain?: string,
  ) {
    const proposals = this.service.getProposals(dao, status, chain);
    return {
      success: true,
      data: proposals,
      total: proposals.length,
    };
  }

  // Get proposal by ID
  @Get('proposals/:id')
  getProposalById(@Param('id') id: string) {
    const proposal = this.service.getProposalById(id);
    if (!proposal) {
      return {
        success: false,
        error: 'Proposal not found',
      };
    }
    return {
      success: true,
      data: proposal,
    };
  }

  // Get DAO statistics
  @Get('stats')
  getDaoStats(@Query('dao') dao?: string) {
    const stats = this.service.getDaoStats(dao);
    return {
      success: true,
      data: stats,
    };
  }

  // Create alert
  @Post('alerts')
  createAlert(@Body() body: {
    userId: string;
    dao: string;
    alertType: Alert['alertType'];
    threshold?: number;
    enabled?: boolean;
    webhookUrl?: string;
    email?: string;
  }) {
    const alert = this.service.createAlert({
      userId: body.userId,
      dao: body.dao,
      alertType: body.alertType,
      threshold: body.threshold || 1000,
      enabled: body.enabled ?? true,
      webhookUrl: body.webhookUrl,
      email: body.email,
    });

    return {
      success: true,
      data: alert,
    };
  }

  // Get user's alerts
  @Get('alerts/:userId')
  getAlerts(@Param('userId') userId: string) {
    const alerts = this.service.getAlerts(userId);
    return {
      success: true,
      data: alerts,
      total: alerts.length,
    };
  }

  // Update alert
  @Put('alerts/:userId/:alertId')
  updateAlert(
    @Param('userId') userId: string,
    @Param('alertId') alertId: string,
    @Body() body: Partial<Alert>,
  ) {
    const alert = this.service.updateAlert(userId, alertId, body);
    if (!alert) {
      return {
        success: false,
        error: 'Alert not found',
      };
    }
    return {
      success: true,
      data: alert,
    };
  }

  // Delete alert
  @Delete('alerts/:userId/:alertId')
  deleteAlert(@Param('userId') userId: string, @Param('alertId') alertId: string) {
    const success = this.service.deleteAlert(userId, alertId);
    return {
      success,
      message: success ? 'Alert deleted successfully' : 'Alert not found',
    };
  }

  // Get alert history
  @Get('alerts/:userId/history')
  getAlertHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const history = this.service.getAlertHistory(
      userId,
      limit ? parseInt(limit, 10) : 50,
    );
    return {
      success: true,
      data: history,
      total: history.length,
    };
  }

  // Check and trigger alerts
  @Post('alerts/check')
  checkAlerts() {
    const triggered = this.service.checkAlerts();
    return {
      success: true,
      data: triggered,
      triggered: triggered.length,
    };
  }
}
