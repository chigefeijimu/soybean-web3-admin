<template>
  <div class="wallet-group-analyzer">
    <div class="header">
      <h2>👥 Wallet Group Analyzer</h2>
      <p>Analyze multiple wallets as a group to understand collective behavior</p>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <div class="input-group">
        <label>Wallet Addresses (one per line)</label>
        <textarea
          v-model="walletAddresses"
          placeholder="0x1234...&#10;0xabcd...&#10;0x5678..."
          rows="5"
        ></textarea>
      </div>
      
      <div class="chains-select">
        <label>Chains to Analyze</label>
        <div class="chain-checkboxes">
          <label v-for="chain in availableChains" :key="chain.id">
            <input type="checkbox" v-model="selectedChains" :value="chain.id">
            {{ chain.name }}
          </label>
        </div>
      </div>

      <button @click="analyzeGroup" :disabled="loading" class="analyze-btn">
        {{ loading ? 'Analyzing...' : 'Analyze Group' }}
      </button>
    </div>

    <!-- Results Section -->
    <div v-if="results" class="results">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card">
          <div class="card-label">Total Wallets</div>
          <div class="card-value">{{ results.totalWallets }}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Balance</div>
          <div class="card-value">${{ formatNumber(results.summary.totalBalanceUSD) }}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Transactions</div>
          <div class="card-value">{{ formatNumber(results.summary.totalTransactions) }}</div>
        </div>
        <div class="card">
          <div class="card-label">Unique Tokens</div>
          <div class="card-value">{{ results.summary.uniqueTokens }}</div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="risk-section">
        <h3>⚠️ Risk Assessment</h3>
        <div class="risk-cards">
          <div class="risk-card" :class="results.riskAssessment.concentrationRisk">
            <span class="risk-label">Concentration Risk</span>
            <span class="risk-value">{{ results.riskAssessment.concentrationRisk.toUpperCase() }}</span>
          </div>
          <div class="risk-card">
            <span class="risk-label">Avg Daily Transactions</span>
            <span class="risk-value">{{ results.activityStats.avgDailyTransactions.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <!-- Common Tokens -->
      <div v-if="results.summary.commonTokens.length" class="section">
        <h3>🔗 Common Tokens (held by 50%+ wallets)</h3>
        <div class="token-list">
          <div v-for="token in results.summary.commonTokens" :key="token.symbol" class="token-item">
            <span class="token-symbol">{{ token.symbol }}</span>
            <span class="token-value">${{ formatNumber(token.totalUSD) }}</span>
            <span class="token-count">{{ token.count }} wallets</span>
          </div>
        </div>
      </div>

      <!-- Top Holdings -->
      <div v-if="results.topHoldings.length" class="section">
        <h3>📊 Top Holdings Across Group</h3>
        <div class="holdings-chart">
          <div v-for="(holding, idx) in results.topHoldings" :key="holding.symbol" class="holding-bar">
            <div class="holding-label">
              <span>{{ holding.symbol }}</span>
              <span>${{ formatNumber(holding.totalUSD) }}</span>
            </div>
            <div class="bar-container">
              <div 
                class="bar" 
                :style="{ width: (holding.totalUSD / results.topHoldings[0].totalUSD * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet Details -->
      <div class="section">
        <h3>💼 Individual Wallet Breakdown</h3>
        <div class="wallet-table">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Balance</th>
                <th>Transactions</th>
                <th>Chains</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wallet in results.wallets" :key="wallet.address">
                <td class="address">{{ truncateAddress(wallet.address) }}</td>
                <td>${{ formatNumber(wallet.totalBalanceUSD) }}</td>
                <td>{{ wallet.transactionCount }}</td>
                <td>
                  <span v-for="chain in Object.keys(wallet.chains)" :key="chain" class="chain-badge">
                    {{ chain }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Timeline -->
      <div class="section">
        <h3>📈 Activity Timeline</h3>
        <div class="timeline-controls">
          <button @click="loadTimeline" :disabled="timelineLoading">
            {{ timelineLoading ? 'Loading...' : 'Load 30-Day Timeline' }}
          </button>
        </div>
        <div v-if="timeline.length" class="timeline-chart">
          <div v-for="day in timeline" :key="day.date" class="timeline-day">
            <div class="day-label">{{ formatDate(day.date) }}</div>
            <div class="day-bar" :style="{ height: getTimelineHeight(day.transactions) + 'px' }"></div>
            <div class="day-stats">
              <div>{{ day.transactions }} tx</div>
              <div>${{ formatNumber(day.volumeUSD) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { makeRequest } = useWeb3();

const walletAddresses = ref('');
const selectedChains = ref(['eth', 'polygon', 'arbitrum']);
const loading = ref(false);
const results = ref<any>(null);
const timeline = ref<any[]>([]);
const timelineLoading = ref(false);

const availableChains = [
  { id: 'eth', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'bsc', name: 'BNB Chain' },
  { id: 'base', name: 'Base' },
  { id: 'avalanche', name: 'Avalanche' },
];

const analyzeGroup = async () => {
  const addresses = walletAddresses.value
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.startsWith('0x'));
  
  if (addresses.length === 0) {
    alert('Please enter at least one valid wallet address');
    return;
  }

  loading.value = true;
  try {
    const response = await makeRequest({
      url: '/api/web3/wallet-group/analyze',
      method: 'POST',
      data: {
        addresses,
        chains: selectedChains.value,
      },
    });
    results.value = response;
  } catch (error) {
    console.error('Error analyzing group:', error);
    alert('Failed to analyze wallet group');
  } finally {
    loading.value = false;
  }
};

const loadTimeline = async () => {
  const addresses = walletAddresses.value
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.startsWith('0x'));
  
  if (addresses.length === 0) return;

  timelineLoading.value = true;
  try {
    const response = await makeRequest({
      url: `/api/web3/wallet-group/timeline?addresses=${addresses.join(',')}&days=30`,
    });
    timeline.value = response;
  } catch (error) {
    console.error('Error loading timeline:', error);
  } finally {
    timelineLoading.value = false;
  }
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(num);
};

const truncateAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTimelineHeight = (txs: number) => {
  const maxTxs = Math.max(...timeline.value.map((d: any) => d.transactions), 1);
  return Math.max((txs / maxTxs) * 100, 5);
};
</script>

<style scoped>
.wallet-group-analyzer {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.input-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.input-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
}

.chains-select {
  margin-bottom: 16px;
}

.chains-select label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.chain-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chain-checkboxes label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: normal;
}

.analyze-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #4338ca;
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.card-label {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #111;
}

.risk-section {
  background: #fef2f2;
  padding: 20px;
  border-radius: 12px;
}

.risk-section h3 {
  margin: 0 0 16px;
  color: #991b1b;
}

.risk-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.risk-card {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.risk-card.high {
  border: 2px solid #ef4444;
}

.risk-card.medium {
  border: 2px solid #f59e0b;
}

.risk-card.low {
  border: 2px solid #10b981;
}

.risk-label {
  font-size: 12px;
  color: #6b7280;
}

.risk-value {
  font-size: 18px;
  font-weight: 700;
}

.section h3 {
  margin: 0 0 16px;
  color: #333;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.token-symbol {
  font-weight: 600;
  min-width: 80px;
}

.token-value {
  color: #10b981;
  font-weight: 600;
}

.token-count {
  color: #6b7280;
  font-size: 13px;
}

.holdings-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.holding-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.holding-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.bar-container {
  height: 24px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  transition: width 0.3s ease;
}

.wallet-table {
  overflow-x: auto;
}

.wallet-table table {
  width: 100%;
  border-collapse: collapse;
}

.wallet-table th,
.wallet-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.wallet-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.wallet-table .address {
  font-family: monospace;
  font-size: 13px;
}

.chain-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
}

.timeline-controls {
  margin-bottom: 16px;
}

.timeline-controls button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.timeline-controls button:disabled {
  opacity: 0.6;
}

.timeline-chart {
  display: flex;
  gap: 4px;
  height: 200px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.timeline-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 30px;
}

.day-label {
  font-size: 10px;
  color: #6b7280;
  transform: rotate(-45deg);
  white-space: nowrap;
}

.day-bar {
  width: 20px;
  background: #4f46e5;
  border-radius: 2px;
  margin: 4px 0;
}

.day-stats {
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
}
</style>
