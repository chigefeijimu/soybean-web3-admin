import { NestFactory } from '@nestjs/core';
import { Module, Get, Post, Body, Query } from '@nestjs/common';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'token_unlock' | 'dao_vote' | 'airdrop' | 'conference' | 'listing' | 'mainnet' | 'upgrade';
  chain?: string;
  token?: string;
  url?: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface TokenUnlock {
  token: string;
  amount: string;
  unlockPercentage: number;
  date: string;
  recipient: string;
}

class CryptoCalendarService {
  private events: CalendarEvent[] = [
    {
      id: '1',
      title: 'UNI Token Unlock',
      description: 'Uniswap team and investor token unlock',
      date: '2026-03-15',
      type: 'token_unlock',
      token: 'UNI',
      chain: 'Ethereum',
      url: 'https://uniswap.org',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'ARB Token Unlock',
      description: 'Arbitrum DAO treasury and investor token unlock',
      date: '2026-03-20',
      type: 'token_unlock',
      token: 'ARB',
      chain: 'Arbitrum',
      url: 'https://arbitrum.foundation',
      status: 'upcoming'
    },
    {
      id: '3',
      title: 'OP Token Unlock',
      description: 'OptimismRetroactive Public Goods Funding Round',
      date: '2026-03-10',
      type: 'token_unlock',
      token: 'OP',
      chain: 'Optimism',
      url: 'https://optimism.io',
      status: 'upcoming'
    },
    {
      id: '4',
      title: 'Aave Governance Proposal: V3 Migration',
      description: 'Aave V3 migration and parameter updates',
      date: '2026-03-05',
      endDate: '2026-03-12',
      type: 'dao_vote',
      chain: 'Ethereum',
      url: 'https://aave.com/governance',
      status: 'active'
    },
    {
      id: '5',
      title: 'Uniswap V4 Launch',
      description: 'Uniswap V4 mainnet deployment announcement',
      date: '2026-03-25',
      type: 'mainnet',
      chain: 'Ethereum',
      url: 'https://uniswap.org',
      status: 'upcoming'
    },
    {
      id: '6',
      title: 'zkSync Era Token Launch',
      description: 'zkSync Era native token generation event',
      date: '2026-04-01',
      type: 'token_unlock',
      chain: 'zkSync',
      url: 'https://zksync.io',
      status: 'upcoming'
    },
    {
      id: '7',
      title: 'Starknet Token Distribution',
      description: 'STRK token distribution to early participants',
      date: '2026-03-30',
      type: 'airdrop',
      chain: 'Starknet',
      url: 'https://starknet.io',
      status: 'upcoming'
    },
    {
      id: '8',
      title: 'ETH Denver Conference 2026',
      description: 'Annual Ethereum conference in Denver',
      date: '2026-03-12',
      endDate: '2026-03-15',
      type: 'conference',
      url: 'https://ethdenver.com',
      status: 'upcoming'
    },
    {
      id: '9',
      title: 'Compound Governance: Rate Updates',
      description: 'Proposal to update collateral factors for WBTC',
      date: '2026-03-08',
      endDate: '2026-03-11',
      type: 'dao_vote',
      chain: 'Ethereum',
      url: 'https://compound.finance/governance',
      status: 'active'
    },
    {
      id: '10',
      title: 'LayerZero Airdrop Claim Deadline',
      description: 'Last day to claim ZRO airdrop',
      date: '2026-03-31',
      type: 'airdrop',
      chain: 'Multi-chain',
      url: 'https://layerzero.network',
      status: 'upcoming'
    }
  ];

  async getEvents(type?: string, chain?: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    let filtered = [...this.events];
    
    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }
    if (chain) {
      filtered = filtered.filter(e => e.chain?.toLowerCase() === chain.toLowerCase());
    }
    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }
    
    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getEventById(id: string): Promise<CalendarEvent | undefined> {
    return this.events.find(e => e.id === id);
  }

  async getUpcomingUnlocks(days: number = 30): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.events.filter(e => 
      e.type === 'token_unlock' && 
      e.date >= now.toISOString().split('T')[0] &&
      e.date <= future.toISOString().split('T')[0]
    );
  }

  async getActiveVotes(): Promise<CalendarEvent[]> {
    return this.events.filter(e => e.type === 'dao_vote' && e.status === 'active');
  }

  async getTokenUnlocksByAddress(address: string): Promise<any[]> {
    // Simulated token unlocks for a wallet address
    return [
      {
        token: 'ARB',
        amount: '125000',
        unlockDate: '2026-03-20',
        percentage: 15.5,
        totalVested: 806000,
        unlocked: 125000
      },
      {
        token: 'OP',
        amount: '50000',
        unlockDate: '2026-03-10',
        percentage: 10,
        totalVested: 500000,
        unlocked: 450000
      }
    ];
  }
}

@Controller('web3/crypto-calendar')
class CryptoCalendarController {
  constructor(private readonly calendarService: CryptoCalendarService) {}

  @Get('events')
  async getEvents(
    @Query('type') type?: string,
    @Query('chain') chain?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.calendarService.getEvents(type, chain, startDate, endDate);
  }

  @Get('event/:id')
  async getEventById(@Query('id') id: string) {
    return this.calendarService.getEventById(id);
  }

  @Get('unlocks')
  async getUpcomingUnlocks(@Query('days') days?: string) {
    return this.calendarService.getUpcomingUnlocks(days ? parseInt(days) : 30);
  }

  @Get('votes/active')
  async getActiveVotes() {
    return this.calendarService.getActiveVotes();
  }

  @Get('wallet/unlocks')
  async getWalletUnlocks(@Query('address') address: string) {
    return this.calendarService.getTokenUnlocksByAddress(address);
  }

  @Get('stats')
  async getStats() {
    const events = await this.calendarService.getEvents();
    const now = new Date().toISOString().split('T')[0];
    
    return {
      total: events.length,
      upcoming: events.filter(e => e.status === 'upcoming').length,
      active: events.filter(e => e.status === 'active').length,
      tokenUnlocks: events.filter(e => e.type === 'token_unlock').length,
      daoVotes: events.filter(e => e.type === 'dao_vote').length,
      airdrops: events.filter(e => e.type === 'airdrop').length,
      conferences: events.filter(e => e.type === 'conference').length,
      thisWeek: events.filter(e => e.date >= now && e.date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).length,
      thisMonth: events.filter(e => e.date >= now && e.date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).length
    };
  }
}

@Module({
  controllers: [CryptoCalendarController],
  providers: [CryptoCalendarService],
})
export class CryptoCalendarModule {}

async function bootstrap() {
  const app = await NestFactory.create(CryptoCalendarModule);
  app.enableCors();
  await app.listen(3002);
  console.log('Crypto Calendar service running on port 3002');
}
bootstrap();
