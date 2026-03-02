<template>
  <div class="tax-report-container">
    <div class="header">
      <h2>📊 Crypto Tax Report Generator</h2>
      <div class="header-actions">
        <button @click="refreshReport" class="btn-refresh" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Refresh
        </button>
      </div>
    </div>

    <!-- Input Form -->
    <div class="input-section">
      <div class="form-group">
        <label>Wallet Address</label>
        <input 
          type="text" 
          v-model="address" 
          placeholder="0x..."
          class="address-input"
        />
      </div>
      <div class="form-group">
        <label>Tax Year</label>
        <select v-model="selectedYear">
          <option :value="2025">2025</option>
          <option :value="2024">2024</option>
          <option :value="2023">2023</option>
          <option :value="2022">2022</option>
        </select>
      </div>
      <div class="form-group">
        <label>Blockchain</label>
        <select v-model="selectedChain">
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }} ({{ chain.symbol }})
          </option>
        </select>
      </div>
      <button @click="generateReport" class="btn-generate" :disabled="loading || !address">
        {{ loading ? 'Generating...' : '📊 Generate Report' }}
      </button>
    </div>

    <!-- Report Summary -->
    <div v-if="report" class="report-section">
      <div class="report-header">
        <h3>Tax Report Summary - {{ report.year }}</h3>
        <button @click="exportCSV" class="btn-export">
          📥 Export CSV
        </button>
      </div>

      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card" :class="{ positive: report.summary.netCapitalGain > 0, negative: report.summary.netCapitalGain < 0 }">
          <span class="metric-label">Net Capital Gain/Loss</span>
          <span class="metric-value">${{ formatNumber(report.summary.netCapitalGain) }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Total Income</span>
          <span class="metric-value">${{ formatNumber(report.summary.totalIncome) }}</span>
        </div>
        <div class="metric-card warning">
          <span class="metric-label">Estimated Tax</span>
          <span class="metric-value">${{ formatNumber(report.summary.estimatedTax) }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Gas Fees Paid</span>
          <span class="metric-value">${{ formatNumber(report.summary.totalGasFees) }}</span>
        </div>
      </div>

      <!-- Gains Breakdown -->
      <div class="gains-section">
        <h4>💰 Capital Gains/Losses</h4>
        <div class="gains-stats">
          <div class="gain-stat positive">
            <span>Realized Gains</span>
            <span>+${{ formatNumber(report.summary.totalRealizedGains) }}</span>
          </div>
          <div class="gain-stat negative">
            <span>Realized Losses</span>
            <span>-${{ formatNumber(report.summary.totalRealizedLosses) }}</span>
          </div>
          <div class="gain-stat">
            <span>Transactions</span>
            <span>{{ report.totalTransactions }}</span>
          </div>
          <div class="gain-stat">
            <span>Avg Holding Period</span>
            <span>{{ Math.round(report.summary.holdingPeriodDays) }} days</span>
          </div>
        </div>
      </div>

      <!-- Realized Gains Table -->
      <div v-if="report.realizedGains.length > 0" class="table-section">
        <h4>📈 Realized Gains/Losses</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Quantity</th>
              <th>Cost Basis</th>
              <th>Sale Price</th>
              <th>Gain/Loss</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(gain, idx) in report.realizedGains" :key="idx" :class="{ positive: gain.gain > 0, negative: gain.gain < 0 }">
              <td>{{ gain.token }}</td>
              <td>{{ formatNumber(gain.quantity) }}</td>
              <td>${{ formatNumber(gain.purchasePrice) }}</td>
              <td>${{ formatNumber(gain.salePrice) }}</td>
              <td :class="{ gain: gain.gain > 0, loss: gain.gain < 0 }">
                {{ gain.gain > 0 ? '+' : '' }}${{ formatNumber(gain.gain) }}
              </td>
              <td>
                <span class="badge" :class="gain.gainType">
                  {{ gain.gainType === 'long_term' ? '📈 Long-term' : '📉 Short-term' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Unrealized Gains Table -->
      <div v-if="report.unrealizedGains.length > 0" class="table-section">
        <h4>💎 Current Holdings (Unrealized)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Quantity</th>
              <th>Avg Cost</th>
              <th>Current Price</th>
              <th>Unrealized P&L</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(gain, idx) in report.unrealizedGains" :key="idx" :class="{ positive: gain.unrealizedGain > 0, negative: gain.unrealizedGain < 0 }">
              <td>{{ gain.token }}</td>
              <td>{{ formatNumber(gain.quantity) }}</td>
              <td>${{ formatNumber(gain.averageCostBasis) }}</td>
              <td>${{ formatNumber(gain.currentPrice) }}</td>
              <td :class="{ gain: gain.unrealizedGain > 0, loss: gain.unrealizedGain < 0 }">
                {{ gain.unrealizedGain > 0 ? '+' : '' }}${{ formatNumber(gain.unrealizedGain) }}
              </td>
              <td :class="{ gain: gain.percentageChange > 0, loss: gain.percentageChange < 0 }">
                {{ gain.percentageChange > 0 ? '+' : '' }}{{ gain.percentageChange.toFixed(2) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Income Events -->
      <div v-if="report.incomeEvents.length > 0" class="table-section">
        <h4>🎁 Income Events (Airdrops, Staking, etc.)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Token</th>
              <th>Amount</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(event, idx) in report.incomeEvents" :key="idx">
              <td>{{ formatDate(event.date) }}</td>
              <td>
                <span class="badge income">{{ event.type }}</span>
              </td>
              <td>{{ event.token }}</td>
              <td>{{ formatNumber(event.amount) }}</td>
              <td>${{ formatNumber(event.valueAtTime) }}</td>
              <td>{{ event.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Generating tax report...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!report && !loading && hasSearched" class="empty-state">
      <p>No tax data found for this address in {{ selectedYear }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const API_BASE = '/api/web3';

interface Chain {
  id: number;
  name: string;
  symbol: string;
}

interface RealizedGain {
  token: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  gain: number;
  gainType: string;
}

interface UnrealizedGain {
  token: string;
  quantity: number;
  averageCostBasis: number;
  currentPrice: number;
  unrealizedGain: number;
  percentageChange: number;
}

interface IncomeEvent {
  date: string;
  type: string;
  token: string;
  amount: number;
  valueAtTime: number;
  description: string;
}

interface TaxSummary {
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netCapitalGain: number;
  totalIncome: number;
  totalGasFees: number;
  estimatedTax: number;
  holdingPeriodDays: number;
}

interface TaxReport {
  address: string;
  year: number;
  chainId: number;
  totalTransactions: number;
  totalReceived: number;
  totalSent: number;
  totalGasFees: number;
  realizedGains: RealizedGain[];
  unrealizedGains: UnrealizedGain[];
  incomeEvents: IncomeEvent[];
  summary: TaxSummary;
}

const address = ref('');
const selectedYear = ref(2025);
const selectedChain = ref(1);
const loading = ref(false);
const report = ref<TaxReport | null>(null);
const hasSearched = ref(false);
const chains = ref<Chain[]>([
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
]);

const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

const fetchChains = async () => {
  try {
    const res = await fetch(`${API_BASE}/tax-report/chains`);
    chains.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch chains:', e);
  }
};

const generateReport = async () => {
  if (!address.value) return;
  
  loading.value = true;
  hasSearched.value = true;
  
  try {
    const url = `${API_BASE}/tax-report/generate?address=${address.value}&year=${selectedYear.value}&chainId=${selectedChain.value}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error('Error:', data.error);
      report.value = null;
    } else {
      report.value = data;
    }
  } catch (e) {
    console.error('Failed to generate report:', e);
    report.value = null;
  } finally {
    loading.value = false;
  }
};

const refreshReport = () => {
  if (address.value) {
    generateReport();
  }
};

const exportCSV = async () => {
  if (!report.value) return;
  
  try {
    const url = `${API_BASE}/tax-report/export-csv?address=${report.value.address}&year=${report.value.year}&chainId=${report.value.chainId}`;
    window.open(url, '_blank');
  } catch (e) {
    console.error('Failed to export CSV:', e);
  }
};

onMounted(() => {
  fetchChains();
});
</script>

<style scoped>
.tax-report-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.btn-refresh {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #f0f0f0;
  font-size: 14px;
}

.btn-refresh:disabled {
  opacity: 0.6;
}

.input-section {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.address-input {
  width: 400px;
}

.btn-generate {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-generate:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-export {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.metric-card.positive {
  border-color: #4CAF50;
  background: #f1f8f4;
}

.metric-card.negative {
  border-color: #f44336;
  background: #fdf2f2;
}

.metric-card.warning {
  border-color: #ff9800;
  background: #fff8e1;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
}

.gains-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.gains-section h4 {
  margin: 0 0 16px 0;
}

.gains-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.gain-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.gain-stat span:first-child {
  font-size: 12px;
  color: #666;
}

.gain-stat span:last-child {
  font-size: 18px;
  font-weight: 600;
}

.gain-stat.positive span:last-child {
  color: #4CAF50;
}

.gain-stat.negative span:last-child {
  color: #f44336;
}

.table-section {
  margin-bottom: 24px;
}

.table-section h4 {
  margin: 0 0 12px 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 12px;
  color: #666;
}

.data-table tr.positive {
  background: #f1f8f4;
}

.data-table tr.negative {
  background: #fdf2f2;
}

.data-table td.gain {
  color: #4CAF50;
  font-weight: 600;
}

.data-table td.loss {
  color: #f44336;
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.badge.long_term {
  background: #e3f2fd;
  color: #1976d2;
}

.badge.short_term {
  background: #fff3e0;
  color: #f57c00;
}

.badge.income {
  background: #f3e5f5;
  color: #7b1fa2;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  background: #f8f9fa;
  border-radius: 12px;
}
</style>
