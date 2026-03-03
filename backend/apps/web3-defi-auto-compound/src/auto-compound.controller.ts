import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AutoCompoundService, CreateScheduleDto, AutoCompoundSchedule, CompoundExecution } from './auto-compound.service';

@Controller()
export class AutoCompoundController {
  constructor(private readonly autoCompoundService: AutoCompoundService) {}

  @Get('protocols')
  getSupportedProtocols() {
    return this.autoCompoundService.getSupportedProtocols();
  }

  @Get('chains')
  getSupportedChains() {
    return this.autoCompoundService.getSupportedChains();
  }

  @Get('dashboard')
  getDashboardStats(@Query('userId') userId?: string) {
    return this.autoCompoundService.getDashboardStats(userId);
  }

  @Get('schedules')
  getSchedules(@Query('userId') userId?: string) {
    return this.autoCompoundService.getSchedules(userId);
  }

  @Get('schedules/:id')
  getScheduleById(@Param('id') id: string) {
    return this.autoCompoundService.getScheduleById(id);
  }

  @Post('schedules')
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.autoCompoundService.createSchedule(dto);
  }

  @Put('schedules/:id')
  updateSchedule(@Param('id') id: string, @Body() updates: Partial<AutoCompoundSchedule>) {
    return this.autoCompoundService.updateSchedule(id, updates);
  }

  @Delete('schedules/:id')
  deleteSchedule(@Param('id') id: string) {
    return { success: this.autoCompoundService.deleteSchedule(id) };
  }

  @Post('schedules/:id/pause')
  pauseSchedule(@Param('id') id: string) {
    return this.autoCompoundService.pauseSchedule(id);
  }

  @Post('schedules/:id/resume')
  resumeSchedule(@Param('id') id: string) {
    return this.autoCompoundService.resumeSchedule(id);
  }

  @Get('schedules/:id/executions')
  getScheduleExecutions(@Param('id') id: string) {
    return this.autoCompoundService.getExecutions(id);
  }

  @Get('executions')
  getAllExecutions(@Query('userId') userId?: string) {
    return this.autoCompoundService.getAllExecutions(userId);
  }

  @Get('positions')
  getProtocolPositions(
    @Query('protocol') protocol?: string,
    @Query('chainId') chainId?: string,
  ) {
    return this.autoCompoundService.getProtocolPositions(
      protocol,
      chainId ? parseInt(chainId) : undefined
    );
  }

  @Get('simulate/:id')
  simulateCompound(@Param('id') id: string) {
    return this.autoCompoundService.simulateCompound(id);
  }
}
