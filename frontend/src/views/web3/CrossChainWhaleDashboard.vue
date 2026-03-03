<template>
  <div class="cross-chain-whale-dashboard">
    <div class="header">
      <h2>🐋 Cross-chain Whale Dashboard - 跨链巨鲸活动监控</h2>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="">全部链</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="avalanche">Avalanche</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
        </select>
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="overview-cards" v-if="overview">
      <div class="overview-card">
        <div class="card-title">📊 24h Volume</div>
        <div class="card-value">${{ formatNumber(overview.totalVolume24h) }}</div>
        <div class="card-subtitle">总交易量</div>
      </div>
      <div class="overview-card">
        <div class="card-title">🔢 Transactions</div>
        <div class="card-value">{{ overview.totalTransactions24h }}</div>
        <div class="card-subtitle">大额交易数</div>
      </div>
      <div class="overview-card">
        <div class="card-title">📈 Avg Size</div>
        <div class="card-value">${{ formatNumber(overview.avgTransactionSize) }}</div>
        <div class="card-subtitle">平均交易额</div>
      </div>
      <div class="overview-card">
        <div class="card-title">🐋 Active Whales</div>
        <div class="card-value">{{ overview.activeWhales }}</div>
        <div class="card-subtitle">活跃巨鲸</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Transactions Tab -->
    <div v-if="activeTab === 'transactions'" class="tab-content">
      <h3>🐋 Recent Large Transactions - 最新大额交易</h3>
      <div class="transactions-list">
        <div 
          v-for="tx in recentTransactions" 
          :key="tx.hash" 
          class="transaction-card"
          :class="tx.type"
        >
          <div class="tx-header">
            <span class="tx-chain">{{ getChainIcon(tx.chain) }} {{ tx.chain }}</span>
            <span class="tx-type">{{ tx.type }}</span>
            <span class="tx-time">{{ formatTime(tx.timestamp) }}</span>
          </div>
          <div class="tx-details">
            <div class="tx-from">
              <span class="label">From:</span>
              <span class="address">{{ formatAddress(tx.from) }}</span>
            </div>
            <div class="tx-arrow">→</div>
            <div class="tx-to">
              <span class="label">To:</span>
              <span class="address">{{ formatAddress(tx.to) }}</span>
            </div>
          </div>
          <div class="tx-value">
            <span class="token-amount">{{ tx.value.toFixed(4) }} {{ tx.token }}</span>
            <span class="usd-value">${{ formatNumber(tx.valueUsd) }}</span>
          </div>
          <div class="tx-hash">
            <a :href="getExplorerUrl(tx.chain, tx.hash)" target="_blank">
              {{ formatAddress(tx.hash) }} ↗
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Chains Tab -->
    <div v-if="activeTab === 'chains'" class="tab-content">
      <h3>⛓️ Chain Statistics - 各链统计</h3>
      <div class="chains-grid">
        <div 
          v-for="chain in chainStats" 
          :key="chain.chain" 
          class="chain-card"
          @click="selectChain(chain.chain)"
        >
          <div class="chain-header">
            <span class="chain-icon">{{ getChainIcon(chain.chain) }}</span>
            <span class="chain-name">{{ chain.chain }}</span>
          </div>
          <div class="chain-stats">
            <div class="stat-row">
              <span class="stat-label">Volume:</span>
              <span class="stat-value">${{ formatNumber(chain.totalVolume) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Transactions:</span>
              <span class="stat-value">{{ formatNumber(chain.txCount) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Avg Size:</span>
              <span class="stat-value">${{ formatNumber(chain.avgTransactionSize) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Whales:</span>
              <span class="stat-value">{{ chain.whaleCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard Tab -->
    <div v-if="activeTab === 'leaderboard'" class="tab-content">
      <h3>🏆 Whale Leaderboard - 巨鲸排行榜</h3>
      <div class="leaderboard">
        <div 
          v-for="whale in leaderboard" 
          :key="whale.rank" 
          class="leaderboard-row"
        >
          <div class="rank" :class="'rank-' + whale.rank">{{ whale.rank }}</div>
          <div class="whale-info">
            <span class="whale-label">{{ whale.label }}</span>
            <span class="whale-address">{{ formatAddress(whale.address) }}</span>
          </div>
          <div class="whale-type">
            <span class="type-badge" :class="whale.type">{{ whale.type }}</span>
          </div>
          <div class="whale-stats">
            <span class="volume">${{ formatNumber(whale.volume24h) }}</span>
            <span class="tx-count">{{ whale.txCount24h }} txs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Tab -->
    <div v-if="activeTab === 'timeline'" class="tab-content">
      <h3>📊 Whale Activity Timeline - 活动时间线</h3>
      <div class="timeline-chart">
        <div class="chart-placeholder">
          <div class="bars">
            <div 
              v-for="(volume, index) in timelineData.volumes" 
              :key="index"
              class="bar"
              :style="{ height: (volume / Math.max(...timelineData.volumes) * 100) + '%' }"
              :title="timelineData.labels[index] + ': $' + formatNumber(volume)"
            ></div>
          </div>
          <div class="labels">
            <span v-for="(label, index) in timelineData.labels" :key="index">
              {{ index % 4 === 0 ? label : '' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Flows Tab -->
    <div v-if="activeTab === 'flows'" class="tab-content">
      <h3>🌉 Cross-chain Flows - 跨链资金流向</h3>
      <div class="flows-list">
        <div 
          v-for="flow in crossChainFlows" 
          :key="flow.fromChain + '-' + flow.toChain" 
          class="flow-card"
        >
          <div class="flow-route">
            <span class="from-chain">{{ getChainIcon(flow.fromChain) }} {{ flow.fromChain }}</span>
            <span class="flow-arrow">→</span>
            <span class="to-chain">{{ getChainIcon(flow.toChain) }} {{ flow.toChain }}</span>
          </div>
          <div class="flow-stats">
            <span class="volume">${{ formatNumber(flow.volume) }}</span>
            <span class="tx-count">{{ flow.transactions }} txs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts Tab -->
    <div v-if="activeTab === 'alerts'" class="tab-content">
      <h3>🔔 Alert Configurations - 警报配置</h3>
      <div class="alerts-section">
        <div class="create-alert">
          <h4>Create New Alert</h4>
          <div class="alert-form">
            <input 
              v-model="newAlert.name" 
              placeholder="Alert Name" 
              class="input"
            />
            <input 
              v-model.number="newAlert.threshold" 
              type="number" 
              placeholder="Threshold (USD)" 
              class="input"
            />
            <select v-model="newAlert.chains" multiple class="input select-multiple">
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="avalanche">Avalanche</option>
              <option value="bsc">BSC</option>
            </select>
            <button @click="createAlert" class="btn-create">Create Alert</button>
          </div>
        </div>
        <div class="alerts-list">
          <div 
            v-for="alert in alertConfigs" 
            :key="alert.id" 
            class="alert-card"
            :class="{ enabled: alert.enabled }"
          >
            <div class="alert-header">
              <span class="alert-name">{{ alert.name }}</span>
              <span class="alert-status">{{ alert.enabled ? '✅' : '❌' }}</span>
            </div>
            <div class="alert-details">
              <span class="threshold">Threshold: ${{ formatNumber(alert.threshold) }}</span>
              <span class="chains">Chains: {{ alert.chains.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { crossChainWhaleApi, type WhaleTransaction, type ChainStats } from '@/service/crossChainWhale';

const loading = ref(false);
const activeTab = ref('transactions');
const selectedChain = ref('');

const overview = ref<any>(null);
const recentTransactions = ref<WhaleTransaction[]>([]);
const chainStats = ref<ChainStats[]>([]);
const leaderboard = ref<any[]>([]);
const timelineData = ref({ labels: [] as string[], volumes: [] as number[] });
const crossChainFlows = ref<any[]>([]);
const alertConfigs = ref<any[]>([]);

const newAlert = ref({
  name: '',
  threshold: 100000,
  chains: ['ethereum'],
});

const tabs = [
  { id: 'transactions', name: 'Transactions', icon: '💸' },
  { id: 'chains', name: 'Chains', icon: '⛓️' },
  { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
  { id: 'timeline', name: 'Timeline', icon: '📊' },
  { id: 'flows', name: 'Cross-chain Flows', icon: '🌉' },
  { id: 'alerts', name: 'Alerts', icon: '🔔' },
];

const chainIcons: Record<string, string> = {
  ethereum: '🔷',
  polygon: '🟣',
  arbitrum: '🔵',
  optimism: '🔴',
  avalanche: '🟠',
  bsc: '🟡',
  base: '⚪',
  solana: '⚡',
  zksync: '⚫',
  starknet: '🌟',
  linea: '🟢',
  scroll: '🔶',
  mantle: '🟩',
};

const getChainIcon = (chain: string) => chainIcons[chain.toLowerCase()] || '🔗';

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  if (address.length < 16) return address;
  return address.slice(0, 6) + '...' + address.slice(-4);
};

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
};

const getExplorerUrl = (chain: string, hash: string): string => {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    avalanche: 'https://snowtrace.io/tx/',
    bsc: 'https://bscscan.com/tx/',
    base: 'https://basescan.org/tx/',
  };
  return (explorers[chain] || 'https://etherscan.io/tx/') + hash;
};

const selectChain = (chain: string) => {
  selectedChain.value = chain;
  activeTab.value = 'chains';
};

const refreshData = async () => {
  loading.value = true;
  try {
    const [overviewData, txData, chainData, leaderboardData, timelineDataRes, flowsData, alertsData] = await Promise.all([
      crossChainWhaleApi.getOverview(),
      crossChainWhaleApi.getTransactions(20),
      crossChainWhaleApi.getChainStats(),
      crossChainWhaleApi.getLeaderboard(10),
      crossChainWhaleApi.getTimeline(24),
      crossChainWhaleApi.getCrossChainFlows(),
      crossChainWhaleApi.getAlerts(),
    ]);
    
    overview.value = overviewData;
    recentTransactions.value = txData;
    chainStats.value = chainData;
    leaderboard.value = leaderboardData;
    timelineData.value = timelineDataRes;
    crossChainFlows.value = flowsData;
    alertConfigs.value = alertsData;
  } catch (error) {
    console.error('Failed to fetch whale dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const createAlert = async () => {
  try {
    const alert = await crossChainWhaleApi.createAlert({
      name: newAlert.value.name,
      threshold: newAlert.value.threshold,
      chains: newAlert.value.chains,
    });
    alertConfigs.value.push(alert);
    newAlert.value = { name: '', threshold: 100000, chains: ['ethereum'] };
  } catch (error) {
    console.error('Failed to create alert:', error);
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.cross-chain-whale-dashboard {
  padding: 20px;
  background: #0d1117;
  min-height: 100vh;
  color: #e6edf3;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.chain-select, .btn-refresh {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #30363d;
  background: #161b22;
  color: #e6edf3;
  cursor: pointer;
}

.btn-refresh:hover {
  background: #21262d;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.card-title {
  font-size: 14px;
  color: #8b949e;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #58a6ff;
}

.card-subtitle {
  font-size: 12px;
  color: #8b949e;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #30363d;
  padding-bottom: 10px;
}

.tab {
  padding: 10px 20px;
  background: transparent;
  border: none;
  color: #8b949e;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab:hover {
  background: #21262d;
}

.tab.active {
  background: #21262d;
  color: #58a6ff;
}

.tab-content {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 20px;
}

.tab-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.tx-chain {
  color: #58a6ff;
}

.tx-type {
  text-transform: uppercase;
  font-size: 11px;
  padding: 2px 6px;
  background: #21262d;
  border-radius: 4px;
}

.tx-time {
  color: #8b949e;
}

.tx-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.tx-from, .tx-to {
  display: flex;
  gap: 4px;
}

.label {
  color: #8b949e;
}

.address {
  font-family: monospace;
  color: #7ee787;
}

.tx-arrow {
  color: #8b949e;
}

.tx-value {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.token-amount {
  font-weight: bold;
  color: #f0f6fc;
}

.usd-value {
  color: #7ee787;
}

.tx-hash a {
  color: #58a6ff;
  text-decoration: none;
  font-size: 12px;
}

.chains-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.chain-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.chain-card:hover {
  border-color: #58a6ff;
}

.chain-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.chain-icon {
  font-size: 20px;
}

.chain-name {
  font-weight: bold;
  text-transform: capitalize;
}

.chain-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.stat-label {
  color: #8b949e;
}

.stat-value {
  color: #e6edf3;
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
}

.rank {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
}

.rank-1 { background: #ffd700; color: #000; }
.rank-2 { background: #c0c0c0; color: #000; }
.rank-3 { background: #cd7f32; color: #000; }

.whale-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.whale-label {
  font-weight: bold;
}

.whale-address {
  font-size: 12px;
  color: #8b949e;
  font-family: monospace;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
}

.type-badge.exchange { background: #f0f6fc; color: #000; }
.type-badge.dao { background: #7c3aed; color: #fff; }
.type-badge.whale { background: #059669; color: #fff; }
.type-badge.team { background: #dc2626; color: #fff; }
.type-badge.defi { background: #0891b2; color: #fff; }

.whale-stats {
  text-align: right;
}

.volume {
  display: block;
  font-weight: bold;
  color: #7ee787;
}

.tx-count {
  font-size: 12px;
  color: #8b949e;
}

.timeline-chart {
  height: 300px;
  padding: 20px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.bar {
  flex: 1;
  background: linear-gradient(to top, #238636, #58a6ff);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  cursor: pointer;
}

.bar:hover {
  background: linear-gradient(to top, #2ea043, #79c0ff);
}

.labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8b949e;
  margin-top: 8px;
}

.flows-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
}

.flow-route {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-arrow {
  color: #58a6ff;
}

.flow-stats {
  text-align: right;
}

.flow-stats .volume {
  display: block;
  font-weight: bold;
  color: #7ee787;
}

.flow-stats .tx-count {
  font-size: 12px;
  color: #8b949e;
}

.alerts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.create-alert {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.create-alert h4 {
  margin-top: 0;
}

.alert-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #161b22;
  color: #e6edf3;
}

.select-multiple {
  height: 100px;
}

.btn-create {
  padding: 10px;
  background: #238636;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-create:hover {
  background: #2ea043;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px;
  opacity: 0.6;
}

.alert-card.enabled {
  opacity: 1;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alert-name {
  font-weight: bold;
}

.alert-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #8b949e;
}

@media (max-width: 1200px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chains-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .alerts-section {
    grid-template-columns: 1fr;
  }
}
</style>
