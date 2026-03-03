<template>
  <div class="token-balance-history">
    <div class="header">
      <h2>📊 Token Balance History</h2>
      <p class="subtitle">Cross-chain token balance history tracking and analytics</p>
    </div>

    <!-- Address Input -->
    <div class="address-section">
      <div class="input-group">
        <input 
          v-model="address" 
          placeholder="Enter wallet address (0x...)" 
          class="address-input"
        />
        <select v-model="selectedChains" multiple class="chain-select">
          <option v-for="chain in supportedChains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
        <button @click="loadDashboard" :disabled="!address" class="load-btn">
          Load Data
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading balance history...</p>
    </div>

    <div v-else-if="dashboardData" class="dashboard">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card total-value">
          <div class="card-label">Total Portfolio Value</div>
          <div class="card-value">${{ formatNumber(dashboardData.summary.totalValue) }}</div>
          <div class="card-change" :class="dashboardData.summary.changePercent24h >= 0 ? 'positive' : 'negative'">
            {{ dashboardData.summary.changePercent24h >= 0 ? '↑' : '↓' }}
            ${{ formatNumber(Math.abs(dashboardData.summary.change24h)) }}
            ({{ dashboardData.summary.changePercent24h.toFixed(2) }}%)
          </div>
        </div>
        <div class="summary-card">
          <div class="card-label">Top Chain</div>
          <div class="card-value">{{ getChainName(dashboardData.summary.topChain) }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Top Token</div>
          <div class="card-value">{{ dashboardData.summary.topToken }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Active Chains</div>
          <div class="card-value">{{ dashboardData.chainDistribution.length }}</div>
        </div>
      </div>

      <!-- Portfolio Chart -->
      <div class="chart-section">
        <h3>📈 Portfolio Value Over Time</h3>
        <div class="chart-container">
          <canvas ref="portfolioChart"></canvas>
        </div>
        <div class="chart-controls">
          <button 
            v-for="range in timeRanges" 
            :key="range"
            :class="['range-btn', { active: selectedRange === range }]"
            @click="changeTimeRange(range)"
          >
            {{ range }}
          </button>
        </div>
      </div>

      <!-- Balance Changes -->
      <div class="changes-section" v-if="dashboardData.balanceChanges?.length">
        <h3>🔄 Recent Balance Changes</h3>
        <div class="changes-table">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Chain</th>
                <th>Previous</th>
                <th>Current</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(change, idx) in dashboardData.balanceChanges" :key="idx">
                <td class="token-symbol">{{ change.symbol }}</td>
                <td>{{ getChainName(change.chainId) }}</td>
                <td>${{ formatNumber(parseFloat(change.previousBalance) * 1000) }}</td>
                <td>${{ formatNumber(parseFloat(change.currentBalance) * 1000) }}</td>
                <td :class="change.changePercent >= 0 ? 'positive' : 'negative'">
                  {{ change.changePercent >= 0 ? '+' : '' }}{{ change.changePercent.toFixed(2) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chain Distribution -->
      <div class="distribution-section">
        <h3>⛓️ Chain Distribution</h3>
        <div class="distribution-chart">
          <canvas ref="chainChart"></canvas>
        </div>
      </div>

      <!-- Token Distribution -->
      <div class="distribution-section">
        <h3>🪙 Token Distribution</h3>
        <div class="token-bars">
          <div 
            v-for="token in dashboardData.tokenDistribution" 
            :key="token.token"
            class="token-bar"
          >
            <div class="token-info">
              <span class="token-name">{{ token.token }}</span>
              <span class="token-value">${{ formatNumber(token.value) }}</span>
            </div>
            <div class="bar-container">
              <div class="bar" :style="{ width: token.percent + '%' }"></div>
            </div>
            <span class="token-percent">{{ token.percent }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to view balance history</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const address = ref('');
const selectedChains = ref(['1', '137', '42161']);
const selectedRange = ref('30d');
const loading = ref(false);
const dashboardData = ref(null);
const portfolioChart = ref(null);
const chainChart = ref(null);

let portfolioChartInstance = null;
let chainChartInstance = null;

const supportedChains = [
  { id: '1', name: 'Ethereum' },
  { id: '137', name: 'Polygon' },
  { id: '42161', name: 'Arbitrum' },
  { id: '10', name: 'Optimism' },
  { id: '56', name: 'BSC' },
  { id: '8453', name: 'Base' },
  { id: '43114', name: 'Avalanche' },
];

const timeRanges = ['7d', '30d', '90d', '1y'];

const getChainName = (chainId) => {
  const chain = supportedChains.find(c => c.id === chainId);
  return chain ? chain.name : chainId;
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const loadDashboard = async () => {
  if (!address.value) return;
  
  loading.value = true;
  try {
    const chains = selectedChains.value.join(',');
    const response = await fetch(
      `/api/token-balance-history/dashboard?address=${address.value}&chains=${chains}`
    );
    dashboardData.value = await response.json();
    
    setTimeout(() => {
      renderCharts();
    }, 100);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  } finally {
    loading.value = false;
  }
};

const changeTimeRange = async (range) => {
  selectedRange.value = range;
  loading.value = true;
  try {
    const chains = selectedChains.value.join(',');
    const response = await fetch(
      `/api/token-balance-history/portfolio-snapshots?address=${address.value}&chains=${chains}&timeRange=${range}`
    );
    const data = await response.json();
    dashboardData.value.portfolioSnapshots = data.snapshots;
    renderCharts();
  } catch (error) {
    console.error('Failed to load snapshots:', error);
  } finally {
    loading.value = false;
  }
};

const renderCharts = () => {
  if (!dashboardData.value) return;

  // Portfolio Chart
  if (portfolioChart.value) {
    if (portfolioChartInstance) portfolioChartInstance.destroy();
    
    const ctx = portfolioChart.value.getContext('2d');
    const snapshots = dashboardData.value.portfolioSnapshots || [];
    
    portfolioChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: snapshots.map(s => s.date),
        datasets: [{
          label: 'Portfolio Value (USD)',
          data: snapshots.map(s => s.balanceUsd),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$${formatNumber(ctx.raw)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: {
              callback: (value) => '$' + formatNumber(value)
            }
          }
        }
      }
    });
  }

  // Chain Distribution Chart
  if (chainChart.value) {
    if (chainChartInstance) chainChartInstance.destroy();
    
    const ctx = chainChart.value.getContext('2d');
    const chainData = dashboardData.value.chainDistribution || [];
    
    const colors = ['#627eea', '#8247e5', '#3c3c3d', '#ff007a', '#f0b90b', '#0052ff', '#e84142'];
    
    chainChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chainData.map(c => getChainName(c.chainId)),
        datasets: [{
          data: chainData.map(c => c.value),
          backgroundColor: colors.slice(0, chainData.length),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#fff' }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: $${formatNumber(ctx.raw)}`
            }
          }
        }
      }
    });
  }
};

onMounted(() => {
  // Default address for demo
  address.value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1';
  loadDashboard();
});
</script>

<style scoped>
.token-balance-history {
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
}

.address-section {
  background: #1e293b;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.address-input {
  flex: 1;
  min-width: 300px;
  padding: 12px 16px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font-size: 14px;
}

.chain-select {
  padding: 12px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  min-width: 150px;
}

.load-btn {
  padding: 12px 24px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.load-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.load-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
}

.card-label {
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
}

.card-change {
  font-size: 14px;
  margin-top: 8px;
}

.card-change.positive { color: #22c55e; }
.card-change.negative { color: #ef4444; }

.chart-section {
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
}

.chart-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.chart-container {
  height: 300px;
  margin-bottom: 16px;
}

.chart-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.range-btn {
  padding: 8px 16px;
  background: #334155;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.range-btn.active {
  background: #6366f1;
}

.changes-section {
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
}

.changes-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.changes-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

th {
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
}

.token-symbol {
  font-weight: 600;
  color: #6366f1;
}

.positive { color: #22c55e; }
.negative { color: #ef4444; }

.distribution-section {
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
}

.distribution-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.distribution-chart {
  height: 250px;
}

.token-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.token-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-info {
  min-width: 120px;
}

.token-name {
  font-weight: 600;
  margin-right: 8px;
}

.token-value {
  color: #94a3b8;
  font-size: 12px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s;
}

.token-percent {
  min-width: 50px;
  text-align: right;
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}
</style>
