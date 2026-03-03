import { Injectable } from '@nestjs/common';

export interface DaoProposal {
  id: string;
  dao: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'executing' | 'canceled' | 'pending';
  votesFor: number;
  votesAgainst: number;
  startBlock: number;
  endBlock: number;
  proposer: string;
  chain: string;
  createdAt: number;
  updatedAt: number;
}

export interface Alert {
  id: string;
  userId: string;
  dao: string;
  alertType: 'new_proposal' | 'proposal_passed' | 'proposal_failed' | 'vote_started' | 'vote_ending';
  threshold: number;
  enabled: boolean;
  webhookUrl?: string;
  email?: string;
  createdAt: number;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  proposalId: string;
  dao: string;
  triggeredAt: number;
  notified: boolean;
  notificationMethod: 'webhook' | 'email' | 'none';
}

@Injectable()
export class DaoProposalAlertService {
  private proposals: Map<string, DaoProposal[]> = new Map();
  private alerts: Map<string, Alert[]> = new Map();
  private alertHistory: AlertHistory[] = [];

  // Supported DAOs
  private readonly supportedDaos = [
    { name: 'Uniswap', chain: 'Ethereum', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
    { name: 'Aave', chain: 'Ethereum', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
    { name: 'MakerDAO', chain: 'Ethereum', address: '0x9f8F72aA9304c8B593d555F12eF6589cC4B2A5B6' },
    { name: 'Compound', chain: 'Ethereum', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888' },
    { name: 'Curve', chain: 'Ethereum', address: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
    { name: 'Lido', chain: 'Ethereum', address: '0x5A98FCBeb4f1A7E7Cc63D5d7C3f10f8b5e1f3c9' },
    { name: 'ENS', chain: 'Ethereum', address: '0xC18360217D8F7Ab5e3cde0bF6B8895dDd6E7c3d6' },
    { name: 'Optimism', chain: 'Optimism', address: '0x4200000000000000000000000000000000000042' },
    { name: 'Arbitrum', chain: 'Arbitrum', address: '0x912CE59144191C1204E64563FEcB197A5C072a65' },
    { name: 'Polygon', chain: 'Polygon', address: '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39' },
  ];

  constructor() {
    this.initializeMockProposals();
  }

  private initializeMockProposals() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    // Initialize proposals for each DAO
    this.supportedDaos.forEach((dao) => {
      const proposals: DaoProposal[] = [
        {
          id: `${dao.name.toLowerCase()}-001`,
          dao: dao.name,
          title: `Improve ${dao.name} Protocol Efficiency`,
          description: `Proposal to optimize the ${dao.name} protocol for better gas efficiency and user experience.`,
          status: 'active',
          votesFor: Math.floor(Math.random() * 100000),
          votesAgainst: Math.floor(Math.random() * 20000),
          startBlock: 18000000 + Math.floor(Math.random() * 100000),
          endBlock: 18100000 + Math.floor(Math.random() * 100000),
          proposer: `0x${Math.random().toString(16).substr(2, 40)}`,
          chain: dao.chain,
          createdAt: now - day * 2,
          updatedAt: now,
        },
        {
          id: `${dao.name.toLowerCase()}-002`,
          dao: dao.name,
          title: `${dao.name} Treasury Diversification`,
          description: `Proposal to diversify the ${dao.name} treasury into stablecoins and other assets.`,
          status: 'passed',
          votesFor: Math.floor(Math.random() * 200000),
          votesAgainst: Math.floor(Math.random() * 10000),
          startBlock: 17900000 + Math.floor(Math.random() * 100000),
          endBlock: 18000000 + Math.floor(Math.random() * 100000),
          proposer: `0x${Math.random().toString(16).substr(2, 40)}`,
          chain: dao.chain,
          createdAt: now - day * 5,
          updatedAt: now - day,
        },
        {
          id: `${dao.name.toLowerCase()}-003`,
          dao: dao.name,
          title: `Add New ${dao.name} Features`,
          description: `Proposal to add new features to enhance the ${dao.name} ecosystem.`,
          status: 'pending',
          votesFor: 0,
          votesAgainst: 0,
          startBlock: 18200000 + Math.floor(Math.random() * 100000),
          endBlock: 18300000 + Math.floor(Math.random() * 100000),
          proposer: `0x${Math.random().toString(16).substr(2, 40)}`,
          chain: dao.chain,
          createdAt: now,
          updatedAt: now,
        },
      ];
      this.proposals.set(dao.name, proposals);
    });
  }

  // Get all supported DAOs
  getSupportedDaos() {
    return this.supportedDaos;
  }

  // Get proposals for a specific DAO
  getProposals(dao?: string, status?: string, chain?: string) {
    let allProposals: DaoProposal[] = [];
    
    if (dao) {
      allProposals = this.proposals.get(dao) || [];
    } else {
      this.proposals.forEach((proposals) => {
        allProposals = allProposals.concat(proposals);
      });
    }

    if (status) {
      allProposals = allProposals.filter((p) => p.status === status);
    }
    if (chain) {
      allProposals = allProposals.filter((p) => p.chain === chain);
    }

    return allProposals.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get proposal details
  getProposalById(id: string): DaoProposal | undefined {
    for (const proposals of this.proposals.values()) {
      const proposal = proposals.find((p) => p.id === id);
      if (proposal) return proposal;
    }
    return undefined;
  }

  // Create alert for a DAO
  createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };

    const userAlerts = this.alerts.get(alert.userId) || [];
    userAlerts.push(newAlert);
    this.alerts.set(alert.userId, userAlerts);

    return newAlert;
  }

  // Get alerts for a user
  getAlerts(userId: string): Alert[] {
    return this.alerts.get(userId) || [];
  }

  // Update alert
  updateAlert(userId: string, alertId: string, updates: Partial<Alert>): Alert | null {
    const userAlerts = this.alerts.get(userId);
    if (!userAlerts) return null;

    const index = userAlerts.findIndex((a) => a.id === alertId);
    if (index === -1) return null;

    userAlerts[index] = { ...userAlerts[index], ...updates };
    this.alerts.set(userId, userAlerts);

    return userAlerts[index];
  }

  // Delete alert
  deleteAlert(userId: string, alertId: string): boolean {
    const userAlerts = this.alerts.get(userId);
    if (!userAlerts) return false;

    const index = userAlerts.findIndex((a) => a.id === alertId);
    if (index === -1) return false;

    userAlerts.splice(index, 1);
    this.alerts.set(userId, userAlerts);

    return true;
  }

  // Get alert history
  getAlertHistory(userId: string, limit = 50): AlertHistory[] {
    return this.alertHistory
      .filter((h) => {
        const alert = this.alerts.get(userId)?.find((a) => a.id === h.alertId);
        return !!alert;
      })
      .slice(-limit);
  }

  // Check and trigger alerts
  checkAlerts(): AlertHistory[] {
    const triggered: AlertHistory[] = [];
    const allProposals = this.getProposals();

    this.alerts.forEach((userAlerts, userId) => {
      userAlerts.forEach((alert) => {
        if (!alert.enabled) return;

        const matchingProposals = allProposals.filter((p) => 
          p.dao === alert.dao || alert.dao === '*'
        );

        matchingProposals.forEach((proposal) => {
          let shouldTrigger = false;
          let alertType = alert.alertType;

          switch (alert.alertType) {
            case 'new_proposal':
              shouldTrigger = proposal.status === 'pending';
              break;
            case 'vote_started':
              shouldTrigger = proposal.status === 'active';
              break;
            case 'proposal_passed':
              shouldTrigger = proposal.status === 'passed';
              break;
            case 'proposal_failed':
              shouldTrigger = proposal.status === 'failed';
              break;
            case 'vote_ending':
              // Check if proposal is ending soon (within threshold blocks)
              shouldTrigger = proposal.status === 'active' && 
                (proposal.endBlock - proposal.startBlock) < alert.threshold;
              break;
          }

          if (shouldTrigger) {
            const history: AlertHistory = {
              id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              alertId: alert.id,
              proposalId: proposal.id,
              dao: proposal.dao,
              triggeredAt: Date.now(),
              notified: false,
              notificationMethod: alert.webhookUrl ? 'webhook' : alert.email ? 'email' : 'none',
            };
            this.alertHistory.push(history);
            triggered.push(history);
          }
        });
      });
    });

    return triggered;
  }

  // Get DAO statistics
  getDaoStats(dao?: string): any {
    const proposals = this.getProposals(dao);
    
    const stats = {
      totalProposals: proposals.length,
      activeProposals: proposals.filter((p) => p.status === 'active').length,
      passedProposals: proposals.filter((p) => p.status === 'passed').length,
      failedProposals: proposals.filter((p) => p.status === 'failed').length,
      pendingProposals: proposals.filter((p) => p.status === 'pending').length,
      byChain: {} as Record<string, number>,
      byDao: {} as Record<string, number>,
    };

    proposals.forEach((p) => {
      stats.byChain[p.chain] = (stats.byChain[p.chain] || 0) + 1;
      stats.byDao[p.dao] = (stats.byDao[p.dao] || 0) + 1;
    });

    return stats;
  }
}
