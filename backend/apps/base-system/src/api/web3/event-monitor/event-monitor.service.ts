import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface EventSubscription {
  id: string;
  userId: string;
  chain: string;
  contractAddress: string;
  eventName: string;
  eventSignature: string;
  conditions: EventCondition[];
  webhookUrl?: string;
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

export interface EventCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith';
  value: string;
}

export interface ContractEvent {
  chain: string;
  contractAddress: string;
  eventName: string;
  eventSignature: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  logIndex: number;
  timestamp: Date;
  args: Record<string, unknown>;
}

export interface EventAlert {
  id: string;
  subscriptionId: string;
  event: ContractEvent;
  matchedConditions: string[];
  triggeredAt: Date;
  delivered: boolean;
}

// Common event signatures for popular protocols
const COMMON_EVENT_SIGNATURES: Record<string, { name: string; signature: string }[]> = {
  'ERC20': [
    { name: 'Transfer', signature: 'Transfer(address,address,uint256)' },
    { name: 'Approval', signature: 'Approval(address,address,uint256)' },
  ],
  'ERC721': [
    { name: 'Transfer', signature: 'Transfer(address,address,uint256)' },
    { name: 'Approval', signature: 'Approval(address,address,uint256)' },
    { name: 'ApprovalForAll', signature: 'ApprovalForAll(address,address,bool)' },
  ],
  'UniswapV3': [
    { name: 'Swap', signature: 'Swap(address,address,int256,int256,uint160,uint128,int24)' },
    { name: 'Mint', signature: 'Mint(address,address,int24,int24,uint128,uint256,uint256)' },
    { name: 'Burn', signature: 'Burn(address,int24,int24,uint128,uint256,uint256)' },
    { name: 'Collect', signature: 'Collect(address,int24,int24,uint128,uint128)' },
  ],
  'Aave': [
    { name: 'Deposit', signature: 'Deposit(address,address,uint256,address)' },
    { name: 'Withdraw', signature: 'Withdraw(address,address,uint256,address)' },
    { name: 'Borrow', signature: 'Borrow(address,uint256,uint256,uint256,address)' },
    { name: 'Repay', signature: 'Repay(address,uint256,address)' },
    { name: 'LiquidationCall', signature: 'LiquidationCall(address,address,address,uint256,bool,address)' },
  ],
  'Curve': [
    { name: 'TokenExchange', signature: 'TokenExchange(address,int128,uint256,int128,uint256)' },
    { name: 'AddLiquidity', signature: 'AddLiquidity(address,uint256[2],uint256)' },
    { name: 'RemoveLiquidity', signature: 'RemoveLiquidity(address,uint256,uint256[2])' },
  ],
};

@Injectable()
export class EventMonitorService {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private events: ContractEvent[] = [];
  private alerts: EventAlert[] = [];
  private idCounter = 1;

  constructor(private eventEmitter: EventEmitter2) {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add some sample subscriptions
    const sampleSubscriptions: EventSubscription[] = [
      {
        id: 'sub_1',
        userId: 'user_1',
        chain: 'ethereum',
        contractAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        eventName: 'Swap',
        eventSignature: 'Swap(address,address,int256,int256,uint160,uint128,int24)',
        conditions: [],
        active: true,
        createdAt: new Date('2026-03-01'),
      },
      {
        id: 'sub_2',
        userId: 'user_1',
        chain: 'ethereum',
        contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        eventName: 'Transfer',
        eventSignature: 'Transfer(address,address,uint256)',
        conditions: [
          { field: 'to', operator: 'eq', value: '0x1234567890123456789012345678901234567890' }
        ],
        active: true,
        createdAt: new Date('2026-03-02'),
      },
    ];

    sampleSubscriptions.forEach(sub => this.subscriptions.set(sub.id, sub));

    // Add sample events
    const sampleEvents: ContractEvent[] = [
      {
        chain: 'ethereum',
        contractAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        eventName: 'Swap',
        eventSignature: 'Swap(address,address,int256,int256,uint160,uint128,int24)',
        blockNumber: 19234567,
        blockHash: '0xabc123',
        transactionHash: '0xdef456789',
        logIndex: 0,
        timestamp: new Date('2026-03-03T08:00:00Z'),
        args: {
          sender: '0xabc123',
          recipient: '0xdef456',
          amount0: '-1000000000000000000',
          amount1: '3500000000000000000',
          sqrtPriceX96: '2500000000000000000000000',
          liquidity: '1000000000000000000',
          tick: 2000,
        },
      },
      {
        chain: 'ethereum',
        contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        eventName: 'Transfer',
        eventSignature: 'Transfer(address,address,uint256)',
        blockNumber: 19234568,
        blockHash: '0xabc124',
        transactionHash: '0xdef456790',
        logIndex: 1,
        timestamp: new Date('2026-03-03T08:10:00Z'),
        args: {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x1234567890123456789012345678901234567890',
          value: '500000000000000000000',
        },
      },
    ];

    this.events = sampleEvents;
  }

  // Get all available event templates
  getEventTemplates() {
    return COMMON_EVENT_SIGNATURES;
  }

  // Get event signatures for a specific protocol
  getProtocolEventSignatures(protocol: string): { name: string; signature: string }[] {
    return COMMON_EVENT_SIGNATURES[protocol] || [];
  }

  // Get all subscriptions for a user
  getUserSubscriptions(userId: string): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.userId === userId);
  }

  // Get subscription by ID
  getSubscriptionById(id: string): EventSubscription | undefined {
    return this.subscriptions.get(id);
  }

  // Create a new subscription
  createSubscription(data: Partial<EventSubscription>): EventSubscription {
    const id = `sub_${this.idCounter++}`;
    const subscription: EventSubscription = {
      id,
      userId: data.userId || 'user_1',
      chain: data.chain || 'ethereum',
      contractAddress: data.contractAddress || '',
      eventName: data.eventName || 'Unknown',
      eventSignature: data.eventSignature || '',
      conditions: data.conditions || [],
      webhookUrl: data.webhookUrl,
      active: true,
      createdAt: new Date(),
    };

    this.subscriptions.set(id, subscription);
    return subscription;
  }

  // Update subscription
  updateSubscription(id: string, data: Partial<EventSubscription>): EventSubscription | null {
    const existing = this.subscriptions.get(id);
    if (!existing) return null;

    const updated: EventSubscription = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
    };

    this.subscriptions.set(id, updated);
    return updated;
  }

  // Delete subscription
  deleteSubscription(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  // Toggle subscription active status
  toggleSubscription(id: string, active: boolean): EventSubscription | null {
    return this.updateSubscription(id, { active });
  }

  // Query historical events
  queryEvents(params: {
    chain?: string;
    contractAddress?: string;
    eventName?: string;
    fromBlock?: number;
    toBlock?: number;
    fromTimestamp?: Date;
    toTimestamp?: Date;
    limit?: number;
    offset?: number;
  }): ContractEvent[] {
    let filtered = [...this.events];

    if (params.chain) {
      filtered = filtered.filter(e => e.chain === params.chain);
    }
    if (params.contractAddress) {
      filtered = filtered.filter(e => 
        e.contractAddress.toLowerCase() === params.contractAddress!.toLowerCase()
      );
    }
    if (params.eventName) {
      filtered = filtered.filter(e => e.eventName === params.eventName);
    }
    if (params.fromBlock) {
      filtered = filtered.filter(e => e.blockNumber >= params.fromBlock!);
    }
    if (params.toBlock) {
      filtered = filtered.filter(e => e.blockNumber <= params.toBlock!);
    }
    if (params.fromTimestamp) {
      filtered = filtered.filter(e => e.timestamp >= params.fromTimestamp!);
    }
    if (params.toTimestamp) {
      filtered = filtered.filter(e => e.timestamp <= params.toTimestamp!);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    return filtered.slice(offset, offset + limit);
  }

  // Get events for a specific contract
  getContractEvents(
    chain: string,
    contractAddress: string,
    limit = 50
  ): ContractEvent[] {
    return this.queryEvents({ chain, contractAddress, limit });
  }

  // Get recent events across all monitored contracts
  getRecentEvents(limit = 20): ContractEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get alerts for a user
  getUserAlerts(userId: string): EventAlert[] {
    const userSubscriptionIds = this.getUserSubscriptions(userId).map(s => s.id);
    return this.alerts
      .filter(alert => userSubscriptionIds.includes(alert.subscriptionId))
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  // Get alert statistics
  getAlertStats(userId: string) {
    const userAlerts = this.getUserAlerts(userId);
    const total = userAlerts.length;
    const delivered = userAlerts.filter(a => a.delivered).length;
    const pending = total - delivered;

    // Group by event type
    const byEventType = userAlerts.reduce((acc, alert) => {
      const eventName = alert.event.eventName;
      acc[eventName] = (acc[eventName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by chain
    const byChain = userAlerts.reduce((acc, alert) => {
      const chain = alert.event.chain;
      acc[chain] = (acc[chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      delivered,
      pending,
      byEventType,
      byChain,
    };
  }

  // Simulate triggering an event (for demo purposes)
  simulateEvent(eventData: Partial<ContractEvent>): EventAlert[] {
    const event: ContractEvent = {
      chain: eventData.chain || 'ethereum',
      contractAddress: eventData.contractAddress || '',
      eventName: eventData.eventName || 'Unknown',
      eventSignature: eventData.eventSignature || '',
      blockNumber: eventData.blockNumber || 19234570,
      blockHash: eventData.blockHash || '0xabc125',
      transactionHash: eventData.transactionHash || '0xdef456791',
      logIndex: eventData.logIndex || 0,
      timestamp: new Date(),
      args: eventData.args || {},
    };

    // Add to events history
    this.events.unshift(event);

    // Find matching subscriptions and create alerts
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(sub => 
      sub.active &&
      sub.chain === event.chain &&
      sub.contractAddress.toLowerCase() === event.contractAddress.toLowerCase() &&
      sub.eventName === event.eventName
    );

    const alerts: EventAlert[] = [];

    for (const sub of matchingSubscriptions) {
      const matchedConditions = this.checkConditions(event, sub.conditions);
      
      if (matchedConditions.length > 0 || sub.conditions.length === 0) {
        const alert: EventAlert = {
          id: `alert_${this.idCounter++}`,
          subscriptionId: sub.id,
          event,
          matchedConditions,
          triggeredAt: new Date(),
          delivered: false,
        };

        this.alerts.push(alert);
        
        // Update subscription last triggered time
        sub.lastTriggeredAt = new Date();
        
        // Emit event for webhook delivery
        this.eventEmitter.emit('event.alert', alert);
        
        alerts.push(alert);
      }
    }

    return alerts;
  }

  private checkConditions(event: ContractEvent, conditions: EventCondition[]): string[] {
    const matched: string[] = [];

    for (const condition of conditions) {
      const fieldValue = event.args[condition.field];
      
      if (fieldValue === undefined) continue;

      const valueStr = String(fieldValue);
      const conditionValue = condition.value;

      switch (condition.operator) {
        case 'eq':
          if (valueStr.toLowerCase() === conditionValue.toLowerCase()) {
            matched.push(`${condition.field} = ${conditionValue}`);
          }
          break;
        case 'contains':
          if (valueStr.toLowerCase().includes(conditionValue.toLowerCase())) {
            matched.push(`${condition.field} contains ${conditionValue}`);
          }
          break;
        case 'startsWith':
          if (valueStr.toLowerCase().startsWith(conditionValue.toLowerCase())) {
            matched.push(`${condition.field} starts with ${conditionValue}`);
          }
          break;
        case 'gt':
          if (BigInt(valueStr) > BigInt(conditionValue)) {
            matched.push(`${condition.field} > ${conditionValue}`);
          }
          break;
        case 'lt':
          if (BigInt(valueStr) < BigInt(conditionValue)) {
            matched.push(`${condition.field} < ${conditionValue}`);
          }
          break;
        case 'gte':
          if (BigInt(valueStr) >= BigInt(conditionValue)) {
            matched.push(`${condition.field} >= ${conditionValue}`);
          }
          break;
        case 'lte':
          if (BigInt(valueStr) <= BigInt(conditionValue)) {
            matched.push(`${condition.field} <= ${conditionValue}`);
          }
          break;
      }
    }

    return matched;
  }

  // Get supported chains
  getSupportedChains(): string[] {
    return [
      'ethereum',
      'polygon',
      'arbitrum',
      'optimism',
      'bsc',
      'base',
      'avalanche',
      'zksync',
      'scroll',
    ];
  }

  // Get event statistics
  getEventStats() {
    const totalEvents = this.events.length;
    const totalSubscriptions = this.subscriptions.size;
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.active).length;
    const totalAlerts = this.alerts.length;

    // Events by chain
    const byChain = this.events.reduce((acc, event) => {
      acc[event.chain] = (acc[event.chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Events by type
    const byEventType = this.events.reduce((acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      totalSubscriptions,
      activeSubscriptions,
      totalAlerts,
      byChain,
      byEventType,
    };
  }
}
