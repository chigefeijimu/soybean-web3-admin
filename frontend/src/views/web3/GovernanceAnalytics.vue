<template>
  <div class="governance-analytics">
    <div class="page-header">
      <h1>🌐 Cross-chain Governance Analytics</h1>
      <p class="subtitle">Track DAO governance participation across multiple chains</p>
    </div>

    <!-- Overview Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏛️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalDAOs }}</div>
          <div class="stat-label">Total DAOs</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalProposals.toLocaleString() }}</div>
          <div class="stat-label">Total Proposals</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalVoters.toLocaleString() }}</div>
          <div class="stat-label">Total Voters</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🗳️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalVotes.toLocaleString() }}</div>
          <div class="stat-label">Total Votes</div>
        </div>
      </div>
    </div>

    <!-- Chain Distribution -->
    <div class="section">
      <h2>📊 Chain Distribution</h2>
      <div class="chain-grid">
        <div v-for="chain in stats.chains" :key="chain.chain" class="chain-card">
          <div class="chain-header">
            <span class="chain-name">{{ formatChain(chain.chain) }}</span>
            <span class="chain-score" :class="getChainScoreClass(chain.avgParticipation)">
              {{ (chain.avgParticipation * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="chain-stats">
            <div class="chain-stat">
              <span class="label">DAOs</span>
              <span class="value">{{ chain.daos }}</span>
            </div>
            <div class="chain-stat">
              <span class="label">Proposals</span>
              <span class="value">{{ chain.proposals }}</span>
            </div>
            <div class="chain-stat">
              <span class="label">Voters</span>
              <span class="value">{{ chain.voters.toLocaleString() }}</span>
            </div>
          </div>
          <div class="participation-bar">
            <div class="bar-fill" :style="{ width: `${chain.avgParticipation * 100}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- DAO Comparison -->
    <div class="section">
      <h2>🏆 DAO Rankings</h2>
      <div class="dao-table">
        <table>
          <thead>
            <tr>
              <th>DAO</th>
              <th>Chain</th>
              <th>Proposals</th>
              <th>Active</th>
              <th>Passed</th>
              <th>Voters</th>
              <th>Participation</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dao in stats.daoComparison" :key="dao.dao">
              <td class="dao-name">{{ dao.dao }}</td>
              <td>
                <span class="chain-badge" :class="dao.chain">{{ formatChain(dao.chain) }}</span>
              </td>
              <td>{{ dao.totalProposals }}</td>
              <td>{{ dao.activeProposals }}</td>
              <td class="passed">{{ dao.passedProposals }}</td>
              <td>{{ dao.totalVoters.toLocaleString() }}</td>
              <td>{{ (dao.participationRate * 100).toFixed(1) }}%</td>
              <td>
                <span class="score-badge" :class="getScoreClass(dao.governanceScore)">
                  {{ dao.governanceScore }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Participation Trends -->
    <div class="section">
      <h2>📈 Participation Trends</h2>
      <div class="participation-chart">
        <div class="chart-placeholder">
          <div class="trend-indicator" :class="participation.participationTrend">
            {{ participation.participationTrend === 'increasing' ? '📈' : participation.participationTrend === 'decreasing' ? '📉' : '➡️' }}
            {{ participation.participationTrend.toUpperCase() }}
          </div>
          <div class="participation-metrics">
            <div class="metric">
              <span class="metric-label">Total Participants</span>
              <span class="metric-value">{{ participation.totalParticipants.toLocaleString() }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Active Voters</span>
              <span class="metric-value">{{ participation.activeVoters.toLocaleString() }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Avg Participation</span>
              <span class="metric-value">{{ (participation.avgParticipationRate * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cross-chain Participation -->
    <div class="section">
      <h2>🔗 Cross-chain Voting</h2>
      <div class="cross-chain-grid">
        <div v-for="item in stats.crossChainParticipation" :key="item.dao" class="cross-chain-card">
          <div class="cc-header">
            <span class="cc-dao">{{ item.dao }}</span>
            <span class="cc-votes">{{ item.totalVotes.toLocaleString() }} votes</span>
          </div>
          <div class="cc-chains">
            <span v-for="chain in item.chains" :key="chain" class="chain-tag" :class="chain">
              {{ formatChain(chain) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts Section -->
    <div class="section alerts-section">
      <h2>🔔 Governance Alerts</h2>
      <div class="alerts-grid">
        <div class="alert-card ending-soon">
          <h4>⏰ Ending Soon</h4>
          <div class="alert-list">
            <div v-for="proposal in alerts.endingSoon" :key="proposal.id" class="alert-item">
              <span class="proposal-title">{{ proposal.title }}</span>
              <span class="time-left">{{ getTimeLeft(proposal.endTime) }}</span>
            </div>
            <div v-if="alerts.endingSoon.length === 0" class="no-data">No proposals ending soon</div>
          </div>
        </div>
        <div class="alert-card new-proposals">
          <h4>🆕 New Proposals</h4>
          <div class="alert-list">
            <div v-for="proposal in alerts.newProposals" :key="proposal.id" class="alert-item">
              <span class="proposal-title">{{ proposal.title }}</span>
              <span class="status-badge active">Active</span>
            </div>
            <div v-if="alerts.newProposals.length === 0" class="no-data">No new proposals</div>
          </div>
        </div>
        <div class="alert-card passed">
          <h4>✅ Recently Passed</h4>
          <div class="alert-list">
            <div v-for="proposal in alerts.recentlyPassed" :key="proposal.id" class="alert-item">
              <span class="proposal-title">{{ proposal.title }}</span>
              <span class="status-badge passed">Passed</span>
            </div>
            <div v-if="alerts.recentlyPassed.length === 0" class="no-data">No recently passed</div>
          </div>
        </div>
        <div class="alert-card failed">
          <h4>❌ Recently Failed</h4>
          <div class="alert-list">
            <div v-for="proposal in alerts.recentlyFailed" :key="proposal.id" class="alert-item">
              <span class="proposal-title">{{ proposal.title }}</span>
              <span class="status-badge failed">Failed</span>
            </div>
            <div v-if="alerts.recentlyFailed.length === 0" class="no-data">No recently failed</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface ChainStats {
  chain: string;
  daos: number;
  proposals: number;
  voters: number;
  votes: number;
  avgParticipation: number;
}

interface DAOStats {
  dao: string;
  chain: string;
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
  totalVoters: number;
  totalVotes: number;
  participationRate: number;
  governanceScore: number;
}

interface CrossChainItem {
  dao: string;
  chains: string[];
  totalVotes: number;
}

interface ProposalInfo {
  id: string;
  title: string;
  endTime: number;
}

interface Alerts {
  newProposals: ProposalInfo[];
  endingSoon: ProposalInfo[];
  recentlyPassed: ProposalInfo[];
  recentlyFailed: ProposalInfo[];
}

interface Participation {
  totalParticipants: number;
  activeVoters: number;
  avgParticipationRate: number;
  participationTrend: string;
}

const stats = ref<{
  totalDAOs: number;
  totalProposals: number;
  totalVoters: number;
  totalVotes: number;
  chains: ChainStats[];
  daoComparison: DAOStats[];
  crossChainParticipation: CrossChainItem[];
}>({
  totalDAOs: 0,
  totalProposals: 0,
  totalVoters: 0,
  totalVotes: 0,
  chains: [],
  daoComparison: [],
  crossChainParticipation: [],
});

const participation = ref<Participation>({
  totalParticipants: 0,
  activeVoters: 0,
  avgParticipationRate: 0,
  participationTrend: 'stable',
});

const alerts = ref<Alerts>({
  newProposals: [],
  endingSoon: [],
  recentlyPassed: [],
  recentlyFailed: [],
});

const loading = ref(true);

const fetchData = async () => {
  try {
    // Fetch cross-chain stats
    const crossChainRes = await fetch('/api/governance-analytics/cross-chain');
    const crossChainData = await crossChainRes.json();
    stats.value = crossChainData;

    // Fetch participation
    const participationRes = await fetch('/api/governance-analytics/participation');
    participation.value = await participationRes.json();

    // Fetch alerts
    const alertsRes = await fetch('/api/governance-analytics/alerts');
    alerts.value = await alertsRes.json();
  } catch (error) {
    console.error('Failed to fetch governance analytics:', error);
    // Use mock data for demo
    stats.value = {
      totalDAOs: 15,
      totalProposals: 847,
      totalVoters: 24580,
      totalVotes: 1567890,
      chains: [
        { chain: 'ethereum', daos: 8, proposals: 320, voters: 12000, votes: 650000, avgParticipation: 0.72 },
        { chain: 'arbitrum', daos: 2, proposals: 145, voters: 4500, votes: 280000, avgParticipation: 0.65 },
        { chain: 'optimism', daos: 2, proposals: 128, voters: 3800, votes: 245000, avgParticipation: 0.61 },
        { chain: 'polygon', daos: 1, proposals: 89, voters: 2100, votes: 156000, avgParticipation: 0.58 },
        { chain: 'base', daos: 1, proposals: 95, voters: 1680, votes: 134000, avgParticipation: 0.55 },
        { chain: 'avalanche', daos: 1, proposals: 70, voters: 500, votes: 63000, avgParticipation: 0.48 },
      ],
      daoComparison: [
        { dao: 'Uniswap', chain: 'ethereum', totalProposals: 156, activeProposals: 3, passedProposals: 128, failedProposals: 25, totalVoters: 4500, totalVotes: 380000, participationRate: 0.78, governanceScore: 92 },
        { dao: 'Aave', chain: 'ethereum', totalProposals: 98, activeProposals: 2, passedProposals: 82, failedProposals: 14, totalVoters: 3200, totalVotes: 245000, participationRate: 0.74, governanceScore: 88 },
        { dao: 'MakerDAO', chain: 'ethereum', totalProposals: 145, activeProposals: 4, passedProposals: 118, failedProposals: 23, totalVoters: 2800, totalVotes: 198000, participationRate: 0.71, governanceScore: 85 },
        { dao: 'Compound', chain: 'ethereum', totalProposals: 87, activeProposals: 1, passedProposals: 72, failedProposals: 14, totalVoters: 2100, totalVotes: 156000, participationRate: 0.68, governanceScore: 82 },
        { dao: 'Curve', chain: 'ethereum', totalProposals: 76, activeProposals: 2, passedProposals: 61, failedProposals: 13, totalVoters: 1850, totalVotes: 134000, participationRate: 0.65, governanceScore: 79 },
      ],
      crossChainParticipation: [
        { dao: 'Uniswap', chains: ['ethereum', 'arbitrum'], totalVotes: 380000 },
        { dao: 'Aave', chains: ['ethereum', 'polygon'], totalVotes: 245000 },
        { dao: 'GMX', chains: ['arbitrum', 'avalanche'], totalVotes: 156000 },
        { dao: 'Lido', chains: ['ethereum', 'polygon'], totalVotes: 134000 },
      ],
    };

    participation.value = {
      totalParticipants: 24580,
      activeVoters: 8500,
      avgParticipationRate: 0.68,
      participationTrend: 'increasing',
    };

    alerts.value = {
      newProposals: [
        { id: '1', title: 'Treasury Diversification Proposal', endTime: Date.now() + 3 * 24 * 60 * 60 * 1000 },
        { id: '2', title: 'Protocol Fee Adjustment', endTime: Date.now() + 5 * 24 * 60 * 60 * 1000 },
      ],
      endingSoon: [
        { id: '3', title: 'Risk Parameter Update', endTime: Date.now() + 12 * 60 * 60 * 1000 },
      ],
      recentlyPassed: [
        { id: '4', title: 'Community Grant Program', endTime: Date.now() - 2 * 24 * 60 * 60 * 1000 },
        { id: '5', title: 'Technical Upgrade Implementation', endTime: Date.now() - 5 * 24 * 60 * 60 * 1000 },
      ],
      recentlyFailed: [
        { id: '6', title: 'Emergency Funding Request', endTime: Date.now() - 3 * 24 * 60 * 60 * 1000 },
      ],
    };
  } finally {
    loading.value = false;
  }
};

const formatChain = (chain: string): string => {
  const chainNames: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    base: 'Base',
    avalanche: 'Avalanche',
    bsc: 'BSC',
  };
  return chainNames[chain] || chain;
};

const getChainScoreClass = (score: number): string => {
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
};

const getScoreClass = (score: number): string => {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'average';
  return 'poor';
};

const getTimeLeft = (endTime: number): string => {
  const now = Date.now();
  const diff = endTime - now;

  if (diff < 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  return '< 1h';
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.governance-analytics {
  padding: 24px;
  background: #0f1419;
  min-height: 100vh;
  color: #e7e9ea;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
}

.subtitle {
  color: #8b98a5;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #1c1f26;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 14px;
  color: #8b98a5;
}

.section {
  margin-bottom: 32px;
}

.section h2 {
  font-size: 20px;
  margin-bottom: 16px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.chain-card {
  background: #1c1f26;
  border-radius: 12px;
  padding: 16px;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chain-name {
  font-weight: 600;
}

.chain-score {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.chain-score.high { background: #00ba7c; color: white; }
.chain-score.medium { background: #ffad1f; color: black; }
.chain-score.low { background: #f4212e; color: white; }

.chain-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.chain-stat {
  display: flex;
  flex-direction: column;
}

.chain-stat .label {
  font-size: 12px;
  color: #8b98a5;
}

.chain-stat .value {
  font-weight: 600;
}

.participation-bar {
  height: 4px;
  background: #2f3940;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1d9bf0, #00ba7c);
  transition: width 0.3s ease;
}

.dao-table {
  background: #1c1f26;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
}

th {
  background: #262c36;
  font-weight: 600;
  color: #8b98a5;
  font-size: 12px;
  text-transform: uppercase;
}

tr {
  border-bottom: 1px solid #2f3940;
}

tr:last-child {
  border-bottom: none;
}

.dao-name {
  font-weight: 600;
  color: #1d9bf0;
}

.chain-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.chain-badge.ethereum { background: #627eea; color: white; }
.chain-badge.arbitrum { background: #28a0f0; color: white; }
.chain-badge.optimism { background: #ff0420; color: white; }
.chain-badge.polygon { background: #8247e5; color: white; }

.passed {
  color: #00ba7c;
}

.score-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.score-badge.excellent { background: #00ba7c; color: white; }
.score-badge.good { background: #1d9bf0; color: white; }
.score-badge.average { background: #ffad1f; color: black; }
.score-badge.poor { background: #f4212e; color: white; }

.participation-chart {
  background: #1c1f26;
  border-radius: 12px;
  padding: 24px;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.trend-indicator {
  font-size: 18px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
}

.trend-indicator.increasing { background: rgba(0, 186, 124, 0.2); color: #00ba7c; }
.trend-indicator.decreasing { background: rgba(244, 33, 46, 0.2); color: #f4212e; }
.trend-indicator.stable { background: rgba(29, 155, 240, 0.2); color: #1d9bf0; }

.participation-metrics {
  display: flex;
  gap: 48px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-label {
  font-size: 14px;
  color: #8b98a5;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
}

.cross-chain-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.cross-chain-card {
  background: #1c1f26;
  border-radius: 12px;
  padding: 16px;
}

.cc-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.cc-dao {
  font-weight: 600;
}

.cc-votes {
  font-size: 12px;
  color: #8b98a5;
}

.cc-chains {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chain-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.alerts-section {
  margin-bottom: 48px;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.alert-card {
  background: #1c1f26;
  border-radius: 12px;
  padding: 16px;
}

.alert-card h4 {
  margin: 0 0 12px;
  font-size: 14px;
}

.alert-card.ending-soon { border-left: 3px solid #ffad1f; }
.alert-card.new-proposals { border-left: 3px solid #1d9bf0; }
.alert-card.passed { border-left: 3px solid #00ba7c; }
.alert-card.failed { border-left: 3px solid #f4212e; }

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #262c36;
  border-radius: 6px;
}

.proposal-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.time-left {
  font-size: 11px;
  color: #ffad1f;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.status-badge.active { background: #1d9bf0; color: white; }
.status-badge.passed { background: #00ba7c; color: white; }
.status-badge.failed { background: #f4212e; color: white; }

.no-data {
  font-size: 12px;
  color: #8b98a5;
  text-align: center;
  padding: 16px;
}
</style>
