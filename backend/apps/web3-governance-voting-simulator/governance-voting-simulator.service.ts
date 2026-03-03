import { Injectable } from '@nestjs/common';

interface Proposal {
  id: string;
  title: string;
  description: string;
  dao: string;
  chain: string;
  status: 'active' | 'pending' | 'passed' | 'failed' | 'executed';
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  quorum: string;
  startBlock: number;
  endBlock: number;
  proposer: string;
  createdAt: string;
}

interface VotingScenario {
  id: string;
  name: string;
  description: string;
  proposals: Proposal[];
}

interface SimulationResult {
  scenarioId: string;
  proposalId: string;
  currentFor: number;
  currentAgainst: number;
  currentAbstain: number;
  simulationFor: number;
  simulationAgainst: number;
  simulationAbstain: number;
  projectedOutcome: 'pass' | 'fail' | 'tie';
  passProbability: number;
  quorumReachProbability: number;
  requiredVotesToPass: number;
  requiredVotesForQuorum: number;
  votingPowerDistribution: {
    largeHolders: number;
    mediumHolders: number;
    smallHolders: number;
  };
  riskAssessment: 'low' | 'medium' | 'high';
  recommendations: string[];
  timestamp: string;
}

interface VotingPowerAnalysis {
  address: string;
  votingPower: number;
  votingPowerPercentage: number;
  votesCast: number;
  participationRate: number;
  historicalAlignment: number;
  category: 'whale' | 'large' | 'medium' | 'small';
}

interface DelegateProfile {
  address: string;
  name: string;
  reputation: 'legend' | 'veteran' | 'expert' | 'trusted' | 'new';
  votingPower: number;
  participationRate: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  delegates: number;
  category: string;
}

const MOCK_DAOS = [
  { name: 'Uniswap', chain: 'Ethereum', token: 'UNI' },
  { name: 'Aave', chain: 'Ethereum', token: 'AAVE' },
  { name: 'Compound', chain: 'Ethereum', token: 'COMP' },
  { name: 'MakerDAO', chain: 'Ethereum', token: 'MKR' },
  { name: 'Curve', chain: 'Ethereum', token: 'CRV' },
  { name: 'Lido', chain: 'Ethereum', token: 'LDO' },
  { name: 'ENS', chain: 'Ethereum', token: 'ENS' },
  { name: 'Optimism', chain: 'Optimism', token: 'OP' },
  { name: 'Arbitrum', chain: 'Arbitrum', token: 'ARB' },
  { name: 'Polygon', chain: 'Polygon', token: 'MATIC' },
  { name: 'GMX', chain: 'Arbitrum', token: 'GMX' },
  { name: 'Rocket Pool', chain: 'Ethereum', token: 'RPL' },
  { name: 'Synthetix', chain: 'Ethereum', token: 'SNX' },
  { name: 'Balancer', chain: 'Ethereum', token: 'BAL' },
  { name: 'Connext', chain: 'Ethereum', token: 'NEXT' },
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-001',
    title: 'Allocate Treasury Funds for Ecosystem Grants',
    description: 'Proposal to allocate 5M USDC from the treasury for ecosystem development grants.',
    dao: 'Uniswap',
    chain: 'Ethereum',
    status: 'active',
    forVotes: '2500000',
    againstVotes: '800000',
    abstainVotes: '200000',
    totalVotes: '3500000',
    quorum: '4000000',
    startBlock: 18500000,
    endBlock: 18550000,
    proposer: '0x1234...abcd',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'prop-002',
    title: 'Update Interest Rate Model',
    description: 'Update the interest rate model to adjust borrowing rates for stablecoins.',
    dao: 'Aave',
    chain: 'Ethereum',
    status: 'active',
    forVotes: '180000',
    againstVotes: '45000',
    abstainVotes: '15000',
    totalVotes: '240000',
    quorum: '320000',
    startBlock: 18450000,
    endBlock: 18500000,
    proposer: '0x5678...efgh',
    createdAt: '2026-03-02T14:00:00Z',
  },
  {
    id: 'prop-003',
    title: 'Add New Collateral Type',
    description: 'Proposal to add cbBTC as a new collateral type on the protocol.',
    dao: 'Compound',
    chain: 'Ethereum',
    status: 'pending',
    forVotes: '0',
    againstVotes: '0',
    abstainVotes: '0',
    totalVotes: '0',
    quorum: '200000',
    startBlock: 18550000,
    endBlock: 18600000,
    proposer: '0xabcd...1234',
    createdAt: '2026-03-03T09:00:00Z',
  },
  {
    id: 'prop-004',
    title: 'Reduce Protocol Fees',
    description: 'Reduce the protocol swap fee from 0.3% to 0.25%.',
    dao: 'Curve',
    chain: 'Ethereum',
    status: 'active',
    forVotes: '15000000',
    againstVotes: '8000000',
    abstainVotes: '1000000',
    totalVotes: '24000000',
    quorum: '30000000',
    startBlock: 18400000,
    endBlock: 18450000,
    proposer: '0x9876...klmn',
    createdAt: '2026-02-28T16:00:00Z',
  },
  {
    id: 'prop-005',
    title: 'Enable New Trading Pool',
    description: 'Enable ETH/USDC stable pool with 0.01% fee tier.',
    dao: 'Uniswap',
    chain: 'Ethereum',
    status: 'passed',
    forVotes: '5000000',
    againstVotes: '200000',
    abstainVotes: '100000',
    totalVotes: '5300000',
    quorum: '4000000',
    startBlock: 18350000,
    endBlock: 18400000,
    proposer: '0xdef0...5678',
    createdAt: '2026-02-25T11:00:00Z',
  },
];

@Injectable()
export class GovernanceVotingSimulatorService {
  private readonly votingScenarios: VotingScenario[] = [
    {
      id: 'scenario-optimistic',
      name: 'Optimistic Scenario',
      description: 'Assumes maximum voter participation and favorable market conditions',
      proposals: MOCK_PROPOSALS,
    },
    {
      id: 'scenario-pessimistic',
      name: 'Pessimistic Scenario',
      description: 'Assumes low participation and unfavorable market conditions',
      proposals: MOCK_PROPOSALS,
    },
    {
      id: 'scenario-realistic',
      name: 'Realistic Scenario',
      description: 'Based on historical voting patterns and current market data',
      proposals: MOCK_PROPOSALS,
    },
  ];

  getSupportedDAOs() {
    return MOCK_DAOS.map((dao) => ({
      ...dao,
      activeProposals: Math.floor(Math.random() * 5) + 1,
      totalProposals: Math.floor(Math.random() * 20) + 10,
      avgParticipation: (Math.random() * 20 + 30).toFixed(1) + '%',
    }));
  }

  getProposals(dao?: string, status?: string) {
    let proposals = [...MOCK_PROPOSALS];
    if (dao) {
      proposals = proposals.filter((p) => p.dao.toLowerCase() === dao.toLowerCase());
    }
    if (status) {
      proposals = proposals.filter((p) => p.status === status);
    }
    return proposals;
  }

  getProposalById(proposalId: string) {
    return MOCK_PROPOSALS.find((p) => p.id === proposalId);
  }

  simulateVoting(proposalId: string, scenarioId: string): SimulationResult {
    const proposal = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const forVotes = parseFloat(proposal.forVotes);
    const againstVotes = parseFloat(proposal.againstVotes);
    const abstainVotes = parseFloat(proposal.abstainVotes);
    const totalVotes = parseFloat(proposal.totalVotes);
    const quorum = parseFloat(proposal.quorum);

    // Scenario-based adjustments
    let participationMultiplier = 1.0;
    let sentimentShift = 0;

    switch (scenarioId) {
      case 'scenario-optimistic':
        participationMultiplier = 1.3;
        sentimentShift = 0.1;
        break;
      case 'scenario-pessimistic':
        participationMultiplier = 0.7;
        sentimentShift = -0.1;
        break;
      case 'scenario-realistic':
      default:
        participationMultiplier = 1.0;
        break;
    }

    const simulatedTotalVotes = totalVotes * participationMultiplier;
    const sentimentFactor = 1 + sentimentShift;
    const simulationFor = forVotes * sentimentFactor * participationMultiplier;
    const simulationAgainst = againstVotes * (2 - sentimentFactor) * participationMultiplier;
    const simulationAbstain = abstainVotes * participationMultiplier;

    const projectedOutcome =
      simulationFor > simulationAgainst ? 'pass' : simulationFor < simulationAgainst ? 'fail' : 'tie';

    // Calculate pass probability based on voting power distribution
    const passProbability =
      projectedOutcome === 'pass'
        ? 50 + Math.random() * 40
        : projectedOutcome === 'fail'
          ? 10 + Math.random() * 30
          : 40 + Math.random() * 20;

    // Calculate quorum reach probability
    const quorumReachProbability = (simulatedTotalVotes / quorum) * 100;
    const clampedQuorumProbability = Math.min(Math.max(quorumReachProbability, 0), 100);

    // Required votes calculations
    const requiredVotesToPass = Math.max(0, simulationAgainst + 1 - simulationFor);
    const requiredVotesForQuorum = Math.max(0, quorum - simulatedTotalVotes);

    // Voting power distribution (simulated)
    const votingPowerDistribution = {
      largeHolders: 60 + Math.random() * 15,
      mediumHolders: 25 + Math.random() * 10,
      smallHolders: 10 + Math.random() * 10,
    };

    // Risk assessment
    let riskAssessment: 'low' | 'medium' | 'high' = 'low';
    if (passProbability < 40 || clampedQuorumProbability < 50) {
      riskAssessment = 'high';
    } else if (passProbability < 60 || clampedQuorumProbability < 70) {
      riskAssessment = 'medium';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (requiredVotesToPass > 0) {
      recommendations.push(
        `Need ${(requiredVotesToPass / 1000000).toFixed(2)}M more votes for passage`,
      );
    }
    if (clampedQuorumProbability < 100) {
      recommendations.push(
        `Increase voter turnout by ${(100 - clampedQuorumProbability).toFixed(1)}% to reach quorum`,
      );
    }
    if (votingPowerDistribution.largeHolders > 70) {
      recommendations.push(
        'High concentration of voting power - monitor whale activity closely',
      );
    }
    if (simulationAgainst > simulationFor * 0.3) {
      recommendations.push(
        'Significant opposition detected - consider addressing concerns in discussion',
      );
    }
    recommendations.push(
      `Current scenario: ${scenarioId.replace('scenario-', '')} - results may vary`,
    );

    return {
      scenarioId,
      proposalId,
      currentFor: forVotes,
      currentAgainst: againstVotes,
      currentAbstain: abstainVotes,
      simulationFor: Math.round(simulationFor),
      simulationAgainst: Math.round(simulationAgainst),
      simulationAbstain: Math.round(simulationAbstain),
      projectedOutcome,
      passProbability: Math.round(passProbability * 10) / 10,
      quorumReachProbability: Math.round(clampedQuorumProbability * 10) / 10,
      requiredVotesToPass: Math.round(requiredVotesToPass),
      requiredVotesForQuorum: Math.round(requiredVotesForQuorum),
      votingPowerDistribution,
      riskAssessment,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  getVotingScenarios() {
    return this.votingScenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      proposalCount: scenario.proposals.length,
    }));
  }

  getVotingPowerAnalysis(proposalId: string): VotingPowerAnalysis[] {
    const proposal = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Generate mock voting power analysis
    const analysis: VotingPowerAnalysis[] = [];
    const categories = [
      { category: 'whale', count: 5, basePower: 500000 },
      { category: 'large', count: 15, basePower: 100000 },
      { category: 'medium', count: 50, basePower: 10000 },
      { category: 'small', count: 200, basePower: 1000 },
    ];

    let addressIndex = 0;
    categories.forEach((cat) => {
      for (let i = 0; i < cat.count; i++) {
        const votingPower = cat.basePower * (0.5 + Math.random());
        const totalVotingPower = categories.reduce(
          (acc, c) => acc + c.count * c.basePower * 0.75,
          0,
        );

        analysis.push({
          address: `0x${(addressIndex++).toString(16).padStart(4, '0')}...${Math.random()
            .toString(16)
            .slice(2, 6)}`,
          votingPower: Math.round(votingPower),
          votingPowerPercentage: Math.round((votingPower / totalVotingPower) * 10000) / 100,
          votesCast: Math.floor(Math.random() * 10),
          participationRate: Math.round(Math.random() * 100),
          historicalAlignment: Math.round(50 + Math.random() * 40),
          category: cat.category as 'whale' | 'large' | 'medium' | 'small',
        });
      }
    });

    return analysis.sort((a, b) => b.votingPower - a.votingPower);
  }

  getTopDelegates(dao: string, limit = 10): DelegateProfile[] {
    const delegates: DelegateProfile[] = [];
    const reputations: DelegateProfile['reputation'][] = [
      'legend',
      'veteran',
      'expert',
      'trusted',
      'new',
    ];
    const categories = [
      'DeFi',
      'Infrastructure',
      'Governance',
      'Risk',
      'Development',
      'Community',
    ];

    for (let i = 0; i < limit; i++) {
      const votingPower = (limit - i) * 50000 * (0.8 + Math.random() * 0.4);
      delegates.push({
        address: `0xdel${i.toString(16).padStart(3, '0')}...${Math.random()
          .toString(16)
          .slice(2, 6)}`,
        name: `Delegate ${i + 1}`,
        reputation: reputations[Math.floor(Math.random() * reputations.length)],
        votingPower: Math.round(votingPower),
        participationRate: Math.round(70 + Math.random() * 30),
        forVotes: Math.round(votingPower * (0.5 + Math.random() * 0.4)),
        againstVotes: Math.round(votingPower * Math.random() * 0.3),
        abstainVotes: Math.round(votingPower * Math.random() * 0.1),
        delegates: Math.floor(Math.random() * 50),
        category: categories[Math.floor(Math.random() * categories.length)],
      });
    }

    return delegates;
  }

  getVotingHistory(address: string, dao?: string) {
    const history: Array<{
      proposalId: string;
      proposalTitle: string;
      dao: string;
      vote: 'for' | 'against' | 'abstain';
      votingPower: number;
      timestamp: string;
    }> = [];
    const voteTypes = ['for', 'against', 'abstain'] as const;

    for (let i = 0; i < 20; i++) {
      history.push({
        proposalId: `prop-${(i % 5 + 1).toString().padStart(3, '0')}`,
        proposalTitle: MOCK_PROPOSALS[i % MOCK_PROPOSALS.length].title,
        dao: MOCK_PROPOSALS[i % MOCK_PROPOSALS.length].dao,
        vote: voteTypes[Math.floor(Math.random() * 3)],
        votingPower: Math.round(1000 + Math.random() * 100000),
        timestamp: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    }

    return dao
      ? history.filter((h) => h.dao.toLowerCase() === dao.toLowerCase())
      : history;
  }

  getProposalTrends(dao?: string) {
    const proposals = dao
      ? MOCK_PROPOSALS.filter((p) => p.dao.toLowerCase() === dao.toLowerCase())
      : MOCK_PROPOSALS;

    return {
      totalProposals: proposals.length,
      passedProposals: proposals.filter((p) => p.status === 'passed').length,
      activeProposals: proposals.filter((p) => p.status === 'active').length,
      failedProposals: proposals.filter((p) => p.status === 'failed').length,
      avgParticipation: (60 + Math.random() * 20).toFixed(1) + '%',
      avgVoteDuration: '5 days',
      topDAOs: MOCK_DAOS.slice(0, 5).map((d) => ({
        name: d.name,
        proposals: Math.floor(Math.random() * 20) + 5,
      })),
    };
  }

  calculateVoteImpact(
    proposalId: string,
    additionalVotes: number,
    voteType: 'for' | 'against',
  ) {
    const proposal = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const currentFor = parseFloat(proposal.forVotes);
    const currentAgainst = parseFloat(proposal.againstVotes);
    const quorum = parseFloat(proposal.quorum);
    const totalVotes = parseFloat(proposal.totalVotes);

    let newFor = currentFor;
    let newAgainst = currentAgainst;

    if (voteType === 'for') {
      newFor += additionalVotes;
    } else {
      newAgainst += additionalVotes;
    }

    const newTotal = newFor + newAgainst;
    const quorumReached = newTotal >= quorum;
    const passes = newFor > newAgainst;

    return {
      proposalId,
      additionalVotes,
      voteType,
      before: {
        for: currentFor,
        against: currentAgainst,
        total: totalVotes,
        passes: currentFor > currentAgainst,
        quorumReached: totalVotes >= quorum,
      },
      after: {
        for: newFor,
        against: newAgainst,
        total: newTotal,
        passes,
        quorumReached,
      },
      outcome: passes && quorumReached ? 'pass' : 'fail',
      impactPercentage: Math.round((additionalVotes / Math.max(totalVotes, 1)) * 10000) / 100,
    };
  }
}
