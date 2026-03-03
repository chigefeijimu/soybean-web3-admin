import { Injectable } from '@nestjs/common';

export interface MonitoredContract {
  id: string;
  address: string;
  chain: string;
  name?: string;
  description?: string;
  events: string[];
  alertEnabled: boolean;
  notifyEmail?: boolean;
  notifyWebhook?: boolean;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastEventAt?: Date;
  eventCount: number;
}

export interface ContractEvent {
  id: string;
  contractId: string;
  contractAddress: string;
  chain: string;
  eventName: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  timestamp: Date;
  from: string;
  data: Record<string, unknown>;
  topics: string[];
}

export interface ContractAlert {
  id: string;
  contractId: string;
  contractAddress: string;
  chain: string;
  eventType: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  triggeredAt: Date;
  acknowledged: boolean;
  data: Record<string, unknown>;
}

export interface MonitoredContractStats {
  totalContracts: number;
  activeContracts: number;
  totalEvents: number;
  eventsLast24h: number;
  eventsLast7d: number;
  alertsTriggered: number;
  chains: string[];
}

@Injectable()
export class Web3SmartContractMonitorService {
  private contracts: Map<string, MonitoredContract> = new Map();
  private events: Map<string, ContractEvent[]> = new Map();
  private alerts: Map<string, ContractAlert[]> = new Map();

  // Supported chains
  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
    'solana',
  ];

  // Common event signatures
  private readonly commonEvents = [
    'Transfer(address,address,uint256)',
    'Approval(address,address,uint256)',
    'Swap(address,uint256,uint256,uint256,uint256,address)',
    'Mint(address,uint256)',
    'Burn(address,uint256)',
    'Deposit(address,uint256)',
    'Withdraw(address,uint256)',
    'Claim(address,uint256)',
    'Staked(address,uint256)',
    'Unstaked(address,uint256)',
    'Paused(address)',
    'Unpaused(address)',
    'RoleGranted(bytes32,address,address)',
    'RoleRevoked(bytes32,address,address)',
  ];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add some demo contracts
    const demoContracts: MonitoredContract[] = [
      {
        id: '1',
        address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        chain: 'ethereum',
        name: 'Uniswap V2 Router',
        description: 'Main Uniswap V2 Router contract',
        events: ['Swap(address,uint256,uint256,uint256,uint256,address)', 'Transfer(address,address,uint256)'],
        alertEnabled: true,
        notifyEmail: true,
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        lastEventAt: new Date(),
        eventCount: 1542,
      },
      {
        id: '2',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        chain: 'arbitrum',
        name: 'Uniswap V3 Factory',
        description: 'Uniswap V3 Factory on Arbitrum',
        events: ['PoolCreated(address,address,uint24,int24,address)'],
        alertEnabled: true,
        notifyWebhook: true,
        webhookUrl: 'https://example.com/webhook',
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        eventCount: 328,
      },
      {
        id: '3',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        chain: 'ethereum',
        name: 'WBTC',
        description: 'Wrapped Bitcoin',
        events: ['Transfer(address,address,uint256)', 'Mint(address,uint256)', 'Burn(address,uint256)'],
        alertEnabled: false,
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        eventCount: 8921,
      },
    ];

    demoContracts.forEach((contract) => {
      this.contracts.set(contract.id, contract);
      this.events.set(contract.id, this.generateMockEvents(contract));
    });
  }

  private generateMockEvents(contract: MonitoredContract): ContractEvent[] {
    const events: ContractEvent[] = [];
    const eventNames = contract.events.length > 0 ? contract.events : this.commonEvents.slice(0, 2);
    const numEvents = Math.floor(Math.random() * 20) + 5;

    for (let i = 0; i < numEvents; i++) {
      const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];
      const fromAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D4Df',
        '0xAb5801a7D398351b8bE11C439e05C5B3259aEC9B',
      ];

      events.push({
        id: `${contract.id}-event-${i}`,
        contractId: contract.id,
        contractAddress: contract.address,
        chain: contract.chain,
        eventName,
        blockNumber: 18000000 + Math.floor(Math.random() * 100000),
        blockHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
        transactionHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        from: fromAddresses[Math.floor(Math.random() * fromAddresses.length)],
        data: this.generateMockEventData(eventName),
        topics: [eventName],
      });
    }

    // Sort by timestamp descending
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateMockEventData(eventName: string): Record<string, unknown> {
    if (eventName.includes('Transfer')) {
      return {
        from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        to: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        value: Math.floor(Math.random() * 1000000),
      };
    } else if (eventName.includes('Swap')) {
      return {
        sender: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount0In: Math.floor(Math.random() * 10000),
        amount1In: Math.floor(Math.random() * 10000),
        amount0Out: Math.floor(Math.random() * 10000),
        amount1Out: Math.floor(Math.random() * 10000),
        to: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      };
    }
    return { value: Math.floor(Math.random() * 1000000) };
  }

  // Get all monitored contracts
  getContracts(): MonitoredContract[] {
    return Array.from(this.contracts.values());
  }

  // Get contract by ID
  getContractById(id: string): MonitoredContract | undefined {
    return this.contracts.get(id);
  }

  // Get contracts by chain
  getContractsByChain(chain: string): MonitoredContract[] {
    return Array.from(this.contracts.values()).filter(
      (c) => c.chain.toLowerCase() === chain.toLowerCase()
    );
  }

  // Add new contract to monitor
  addContract(data: {
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
    const id = Date.now().toString();
    const contract: MonitoredContract = {
      id,
      address: data.address,
      chain: data.chain,
      name: data.name,
      description: data.description,
      events: data.events || this.commonEvents.slice(0, 3),
      alertEnabled: data.alertEnabled ?? true,
      notifyEmail: data.notifyEmail ?? true,
      notifyWebhook: data.notifyWebhook ?? false,
      webhookUrl: data.webhookUrl,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      eventCount: 0,
    };

    this.contracts.set(id, contract);
    this.events.set(id, []);
    return contract;
  }

  // Update contract
  updateContract(id: string, updates: Partial<MonitoredContract>): MonitoredContract | null {
    const contract = this.contracts.get(id);
    if (!contract) return null;

    const updated = { ...contract, ...updates, updatedAt: new Date() };
    this.contracts.set(id, updated);
    return updated;
  }

  // Delete contract
  deleteContract(id: string): boolean {
    const existed = this.contracts.has(id);
    this.contracts.delete(id);
    this.events.delete(id);
    this.alerts.delete(id);
    return existed;
  }

  // Toggle contract active status
  toggleContract(id: string): MonitoredContract | null {
    const contract = this.contracts.get(id);
    if (!contract) return null;

    contract.isActive = !contract.isActive;
    contract.updatedAt = new Date();
    this.contracts.set(id, contract);
    return contract;
  }

  // Get events for a contract
  getContractEvents(contractId: string, limit?: number): ContractEvent[] {
    const events = this.events.get(contractId) || [];
    return limit ? events.slice(0, limit) : events;
  }

  // Get all recent events
  getAllEvents(limit?: number): ContractEvent[] {
    const allEvents: ContractEvent[] = [];
    this.events.forEach((events) => {
      allEvents.push(...events);
    });
    return allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit || 100);
  }

  // Get events by chain
  getEventsByChain(chain: string, limit?: number): ContractEvent[] {
    return this.getAllEvents().filter(
      (e) => e.chain.toLowerCase() === chain.toLowerCase()
    ).slice(0, limit || 100);
  }

  // Get recent events (last 24h, 7d)
  getRecentEvents(contractId: string, timeframe: '24h' | '7d' | '30d' = '24h'): ContractEvent[] {
    const events = this.events.get(contractId) || [];
    const now = Date.now();
    const ms = timeframe === '24h' ? 24 * 60 * 60 * 1000 : 
                timeframe === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                30 * 24 * 60 * 60 * 1000;
    
    return events.filter((e) => now - e.timestamp.getTime() < ms);
  }

  // Get alerts for a contract
  getContractAlerts(contractId: string): ContractAlert[] {
    return this.alerts.get(contractId) || [];
  }

  // Get all alerts
  getAllAlerts(limit?: number): ContractAlert[] {
    const allAlerts: ContractAlert[] = [];
    this.alerts.forEach((alerts) => {
      allAlerts.push(...alerts);
    });
    return allAlerts
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit || 100);
  }

  // Create alert
  createAlert(data: {
    contractId: string;
    contractAddress: string;
    chain: string;
    eventType: string;
    message: string;
    severity?: 'info' | 'warning' | 'critical';
    data?: Record<string, unknown>;
  }): ContractAlert {
    const alert: ContractAlert = {
      id: Date.now().toString(),
      contractId: data.contractId,
      contractAddress: data.contractAddress,
      chain: data.chain,
      eventType: data.eventType,
      message: data.message,
      severity: data.severity || 'info',
      triggeredAt: new Date(),
      acknowledged: false,
      data: data.data || {},
    };

    const contractAlerts = this.alerts.get(data.contractId) || [];
    contractAlerts.push(alert);
    this.alerts.set(data.contractId, contractAlerts);

    return alert;
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): ContractAlert | null {
    for (const [_, alerts] of this.alerts) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        return alert;
      }
    }
    return null;
  }

  // Get supported chains
  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  // Get common events
  getCommonEvents(): string[] {
    return this.commonEvents;
  }

  // Get statistics
  getStats(): MonitoredContractStats {
    const contracts = Array.from(this.contracts.values());
    const now = Date.now();
    const ms24h = 24 * 60 * 60 * 1000;
    const ms7d = 7 * 24 * 60 * 60 * 1000;

    let totalEvents = 0;
    let eventsLast24h = 0;
    let eventsLast7d = 0;
    let alertsTriggered = 0;

    this.events.forEach((events) => {
      totalEvents += events.length;
      eventsLast24h += events.filter((e) => now - e.timestamp.getTime() < ms24h).length;
      eventsLast7d += events.filter((e) => now - e.timestamp.getTime() < ms7d).length;
    });

    this.alerts.forEach((alerts) => {
      alertsTriggered += alerts.length;
    });

    const chains = [...new Set(contracts.map((c) => c.chain))];

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter((c) => c.isActive).length,
      totalEvents,
      eventsLast24h,
      eventsLast7d,
      alertsTriggered,
      chains,
    };
  }

  // Search contracts
  searchContracts(query: string): MonitoredContract[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.contracts.values()).filter(
      (c) =>
        c.address.toLowerCase().includes(lowerQuery) ||
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Get contract by address
  getContractByAddress(address: string): MonitoredContract | undefined {
    return Array.from(this.contracts.values()).find(
      (c) => c.address.toLowerCase() === address.toLowerCase()
    );
  }

  // Add event to contract (simulate new event)
  simulateEvent(contractId: string): ContractEvent | null {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    const eventNames = contract.events.length > 0 ? contract.events : this.commonEvents.slice(0, 2);
    const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];

    const event: ContractEvent = {
      id: `${contractId}-event-${Date.now()}`,
      contractId,
      contractAddress: contract.address,
      chain: contract.chain,
      eventName,
      blockNumber: 18000000 + Math.floor(Math.random() * 100000),
      blockHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
      transactionHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
      timestamp: new Date(),
      from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      data: this.generateMockEventData(eventName),
      topics: [eventName],
    };

    const contractEvents = this.events.get(contractId) || [];
    contractEvents.unshift(event);
    this.events.set(contractId, contractEvents);

    // Update contract
    contract.lastEventAt = event.timestamp;
    contract.eventCount += 1;
    this.contracts.set(contractId, contract);

    return event;
  }
}
