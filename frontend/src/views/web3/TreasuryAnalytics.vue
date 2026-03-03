<template>
  <div class="treasury-analytics">
    <div class="header">
      <h1>🏛️ Cross-chain DAO Treasury Analytics</h1>
      <p>Track and analyze DAO treasury assets across multiple chains</p>
    </div>

    <!-- Supported DAOs -->
    <div class="section">
      <h2>Supported DAOs</h2>
      <div class="dao-grid">
        <div 
          v-for="dao in supportedDaos" 
          :key="dao.name"
          class="dao-card"
          :class="{ active: selectedDao === dao.name }"
          @click="selectDao(dao.name)"
        >
          <div class="dao-name">{{ dao.name }}</div>
          <div class="dao-chain">{{ dao.chain }}</div>
        </div>
      </div>
    </div>

    <!-- Overview Section -->
    <div v-if="selectedDao" class="section">
      <h2>{{ selectedDao }} Treasury Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Value</div>
          <div class="stat-value">${{ formatNumber(treasuryData.totalValue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Assets</div>
          <div class="stat-value">{{ treasuryData.assets?.length || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chains</div>
          <div class="stat-value">{{ treasuryData.chains?.length || 0 }}</div>
        </div>
        <div class="stat-card" :class="healthClass">
          <div class="stat-label">Health Score</div>
          <div class="stat-value">{{ treasuryData.health?.score }}/100</div>
          <div class="stat-rating">{{ treasuryData.health?.rating }}</div>
        </div>
      </div>
    </div>

    <!-- Health Details -->
    <div v-if="selectedDao && treasuryData.health" class="section">
      <h2>Treasury Health Analysis</h2>
      <div class="health-grid">
        <div class="health-card">
          <div class="health-label">Diversification</div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: treasuryData.health.diversification + '%' }"></div>
          </div>
          <div class="health-value">{{ treasuryData.health.diversification }}%</div>
        </div>
        <div class="health-card">
          <div class="health-label">Liquidity</div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: treasuryData.health.liquidity + '%' }"></div>
          </div>
          <div class="health-value">{{ treasuryData.health.liquidity }}%</div>
        </div>
        <div class="health-card">
          <div class="health-label">Sustainability</div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: treasuryData.health.sustainability + '%' }"></div>
          </div>
          <div class="health-value">{{ treasuryData.health.sustainability }}%</div>
        </div>
      </div>
      <div class="health-factors">
        <h3>Analysis Factors:</h3>
        <ul>
          <li v-for="(factor, idx) in treasuryData.health.factors" :key="idx">{{ factor }}</li>
        </ul>
      </div>
    </div>

    <!-- Asset Allocation -->
    <div v-if="selectedDao && treasuryData.assets" class="section">
      <h2>Asset Allocation</h2>
      <div class="allocation-table">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Chain</th>
              <th>Balance</th>
              <th>Value</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in treasuryData.assets" :key="asset.symbol">
              <td>{{ asset.symbol }}</td>
              <td><span class="chain-tag">{{ asset.chain }}</span></td>
              <td>{{ formatNumber(asset.balance) }}</td>
              <td>${{ formatNumber(asset.value) }}</td>
              <td>
                <div class="percentage-bar">
                  <div class="percentage-fill" :style="{ width: asset.percentage + '%' }"></div>
                  <span>{{ asset.percentage.toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Allocation Charts -->
    <div v-if="selectedDao && allocationData.byChain" class="section">
      <h2>Distribution Analysis</h2>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>By Chain</h3>
          <div class="chain-distribution">
            <div v-for="(value, chain) in allocationData.byChain" :key="chain" class="chain-item">
              <span class="chain-name">{{ chain }}</span>
              <span class="chain-value">${{ formatNumber(value) }}</span>
            </div>
          </div>
        </div>
        <div class="chart-card">
          <h3>By Category</h3>
          <div class="category-distribution">
            <div v-for="(value, category) in allocationData.byCategory" :key="category" class="category-item">
              <span class="category-name">{{ category }}</span>
              <span class="category-value">${{ formatNumber(value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Treasury History -->
    <div v-if="selectedDao && historyData.timestamps" class="section">
      <h2>Treasury Value History</h2>
      <div class="history-chart">
        <div class="chart-placeholder">
          <div v-for="(value, idx) in historyData.values" :key="idx" 
            class="chart-bar"
            :style="{ height: (value / Math.max(...historyData.values) * 100) + '%' }"
            :title="`$${formatNumber(value)}`"
          ></div>
        </div>
        <div class="chart-labels">
          <span>{{ daysAgo(historyData.timestamps[0]) }}</span>
          <span>{{ daysAgo(historyData.timestamps[Math.floor(historyData.timestamps.length/2)]) }}</span>
          <span>Now</span>
        </div>
      </div>
    </div>

    <!-- Recent Flows -->
    <div v-if="selectedDao && treasuryData.flows" class="section">
      <h2>Recent Treasury Flows</h2>
      <div class="flows-list">
        <div v-for="(flow, idx) in treasuryData.flows.slice(0, 10)" :key="idx" 
          class="flow-item"
          :class="flow.type"
        >
          <div class="flow-type">{{ flow.type === 'inflow' ? '📥 Inflow' : '📤 Outflow' }}</div>
          <div class="flow-amount">${{ formatNumber(flow.amount) }} {{ flow.token }}</div>
          <div class="flow-time">{{ formatTime(flow.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="selectedDao && alerts.length > 0" class="section">
      <h2>Treasury Alerts</h2>
      <div class="alerts-list">
        <div v-for="(alert, idx) in alerts" :key="idx" 
          class="alert-item"
          :class="alert.severity"
        >
          <div class="alert-severity">{{ alert.severity.toUpperCase() }}</div>
          <div class="alert-message">{{ alert.message }}</div>
        </div>
      </div>
    </div>

    <!-- DAO Comparison -->
    <div class="section">
      <h2>DAO Treasury Comparison</h2>
      <div class="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>DAO</th>
              <th>Total Value</th>
              <th>24h Change</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in comparisonData" :key="item.dao">
              <td>#{{ item.rank }}</td>
              <td>{{ item.dao }}</td>
              <td>${{ formatNumber(item.totalValue) }}</td>
              <td :class="item.change24h >= 0 ? 'positive' : 'negative'">
                {{ item.change24h >= 0 ? '+' : '' }}{{ item.change24h.toFixed(1) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { treasuryApi } from '@/service/api';

const supportedDaos = ref([
  { name: 'Uniswap', chain: 'ethereum' },
  { name: 'Aave', chain: 'ethereum' },
  { name: 'MakerDAO', chain: 'ethereum' },
  { name: 'Compound', chain: 'ethereum' },
  { name: 'Curve', chain: 'ethereum' },
  { name: 'Lido', chain: 'ethereum' },
  { name: 'ENS', chain: 'ethereum' },
  { name: 'Balancer', chain: 'ethereum' },
]);

const selectedDao = ref('Uniswap');
const treasuryData = ref<any>({});
const allocationData = ref<any>({});
const historyData = ref<any>({});
const alerts = ref<any[]>([]);
const comparisonData = ref<any[]>([]);

const healthClass = computed(() => {
  const score = treasuryData.value.health?.score || 0;
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
});

async function loadTreasuryData() {
  if (!selectedDao.value) return;
  
  try {
    const [overview, allocation, history, alertsData, comparison] = await Promise.all([
      treasuryApi.getTreasuryOverview(selectedDao.value),
      treasuryApi.getAssetAllocation(selectedDao.value),
      treasuryApi.getTreasuryHistory(selectedDao.value, 30),
      treasuryApi.getTreasuryAlerts(selectedDao.value),
      treasuryApi.getAllTreasuries(),
    ]);
    
    treasuryData.value = overview;
    allocationData.value = allocation;
    historyData.value = history;
    alerts.value = alertsData;
    comparisonData.value = comparison;
  } catch (error) {
    console.error('Failed to load treasury data:', error);
  }
}

function selectDao(dao: string) {
  selectedDao.value = dao;
  loadTreasuryData();
}

function formatNumber(value: number): string {
  if (!value && value !== 0) return '0';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toFixed(2);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function daysAgo(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  return `${days}d ago`;
}

onMounted(() => {
  loadTreasuryData();
});
</script>

<style scoped>
.treasury-analytics {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #1a1a2e;
}

.header p {
  color: #666;
  font-size: 14px;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #1a1a2e;
}

.dao-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.dao-card {
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.dao-card:hover {
  border-color: #4f46e5;
}

.dao-card.active {
  border-color: #4f46e5;
  background: #f5f3ff;
}

.dao-name {
  font-weight: 600;
  font-size: 14px;
}

.dao-chain {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.excellent { border-left: 4px solid #10b981; }
.stat-card.good { border-left: 4px solid #3b82f6; }
.stat-card.fair { border-left: 4px solid #f59e0b; }
.stat-card.poor { border-left: 4px solid #ef4444; }

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-top: 8px;
}

.stat-rating {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  text-transform: capitalize;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.health-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.health-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.health-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  transition: width 0.3s;
}

.health-value {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
  text-align: right;
}

.health-factors {
  margin-top: 16px;
  background: white;
  padding: 16px;
  border-radius: 8px;
}

.health-factors h3 {
  font-size: 14px;
  margin-bottom: 8px;
}

.health-factors ul {
  list-style: none;
  padding: 0;
}

.health-factors li {
  padding: 4px 0;
  color: #666;
  font-size: 13px;
}

.health-factors li::before {
  content: "✓ ";
  color: #10b981;
}

.allocation-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.allocation-table th,
.allocation-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.allocation-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.chain-tag {
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
}

.percentage-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.percentage-fill {
  height: 6px;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 3px;
  min-width: 20px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.chart-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chart-card h3 {
  font-size: 14px;
  margin-bottom: 12px;
}

.chain-distribution,
.category-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-item,
.category-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.chain-name,
.category-name {
  font-size: 13px;
  font-weight: 500;
}

.chain-value,
.category-value {
  font-size: 13px;
  color: #666;
}

.history-chart {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #4f46e5, #7c3aed);
  border-radius: 4px 4px 0 0;
  min-width: 8px;
  transition: height 0.3s;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.flows-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.flow-item.inflow {
  border-left: 3px solid #10b981;
}

.flow-item.outflow {
  border-left: 3px solid #ef4444;
}

.flow-type {
  font-size: 13px;
  font-weight: 500;
  min-width: 100px;
}

.flow-amount {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.flow-time {
  font-size: 12px;
  color: #666;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.alert-item.low {
  border-left: 3px solid #10b981;
}

.alert-item.medium {
  border-left: 3px solid #f59e0b;
}

.alert-item.high {
  border-left: 3px solid #ef4444;
}

.alert-severity {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
}

.alert-item.low .alert-severity { color: #10b981; }
.alert-item.medium .alert-severity { color: #f59e0b; }
.alert-item.high .alert-severity { color: #ef4444; }

.alert-message {
  font-size: 13px;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.comparison-table th,
.comparison-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.comparison-table td.positive {
  color: #10b981;
}

.comparison-table td.negative {
  color: #ef4444;
}
</style>
