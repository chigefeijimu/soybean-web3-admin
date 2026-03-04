<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// API Base URL
const API_BASE = '/api/web3';

// Types
interface LendingRate {
  chainId: number;
  chain: string;
  protocol: string;
  protocolId: string;
  logo: string;
  supplyRate: Record<string, number>;
  borrowRate: Record<string, number>;
  tvl: string;
  apy: number;
  apr: number;
}

interface RateSummary {
  totalProtocols: number;
  averageSupplyRate: string;
  averageBorrowRate: string;
  bestSupply: number;
  lowestBorrow: number;
}

interface BestRate {
  protocol: string;
  chain: string;
  rate: string;
}

interface Opportunity {
  protocol: string;
  chain: string;
  apy: number;
  logo: string;
  amount: number;
  annualYield: string;
  monthlyYield: string;
  dailyYield: string;
}

interface TrendData {
  date: string;
  rate: string;
  raw: number;
}

interface Protocol {
  id: string;
  name: string;
  logo: string;
  description: string;
  chains: number[];
  features: string[];
  riskLevel: string;
  tvl: string;
}

interface Asset {
  symbol: string;
  name: string;
  logo: string;
  color: string;
}

// State
const lendingRates = ref<LendingRate[]>([]);
const summary = ref<RateSummary | null>(null);
const bestRates = ref<{ bestSupply: BestRate[]; lowestBorrow: BestRate[] } | null>(null);
const protocols = ref<Protocol[]>([]);
const assets = ref<Asset[]>([]);
const trends = ref<TrendData[]>([]);
const opportunities = ref<Opportunity[]>([]);

const loading = ref(false);
const error = ref('');
const activeTab = ref('compare');

// Filter state
const selectedChain = ref('all');
const selectedProtocol = ref('all');
const selectedAsset = ref('USDC');
const sortBy = ref('apy');

// Calculator state
const calcAmount = ref(10000);
const calcDays = ref(30);
const calcResult = ref<{ earnings: number; apy: number } | null>(null);

// Load data
async function loadLendingRates() {
  loading.value = true;
  error.value = '';
  
  try {
    const chainParam = selectedChain.value !== 'all' ? `&chainId=${selectedChain.value}` : '';
    const protocolParam = selectedProtocol.value !== 'all' ? `&protocol=${selectedProtocol.value}` : '';
    
    const response = await fetch(`${API_BASE}/lending-rates/compare?${chainParam}${protocolParam}`);
    const data = await response.json();
    
    lendingRates.value = data.data;
    summary.value = data.summary;
    bestRates.value = data.bestRates;
  } catch (e) {
    error.value = 'Failed to load lending rates';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function loadProtocols() {
  try {
    const response = await fetch(`${API_BASE}/lending-rates/protocols`);
    const data = await response.json();
    protocols.value = data.data;
  } catch (e) {
    console.error(e);
  }
}

async function loadAssets() {
  try {
    const response = await fetch(`${API_BASE}/lending-rates/assets`);
    const data = await response.json();
    assets.value = data.data;
  } catch (e) {
    console.error(e);
  }
}

async function loadTrends() {
  try {
    const response = await fetch(`${API_BASE}/lending-rates/trends?asset=${selectedAsset.value}&days=30`);
    const data = await response.json();
    trends.value = data.data;
  } catch (e) {
    console.error(e);
  }
}

async function loadOpportunities() {
  try {
    const response = await fetch(`${API_BASE}/lending-rates/opportunities?amount=${calcAmount.value}&asset=${selectedAsset.value}`);
    const data = await response.json();
    opportunities.value = data.data;
  } catch (e) {
    console.error(e);
  }
}

// Filtered rates
const filteredRates = computed(() => {
  let data = [...lendingRates.value];
  
  if (selectedChain.value !== 'all') {
    data = data.filter(r => r.chainId === Number(selectedChain.value));
  }
  
  if (selectedProtocol.value !== 'all') {
    data = data.filter(r => r.protocolId === selectedProtocol.value);
  }
  
  if (sortBy.value === 'apy') {
    data.sort((a, b) => b.apy - a.apy);
  } else if (sortBy.value === 'tvl') {
    data.sort((a, b) => parseFloat(b.tvl.replace(/[$,B]/g, '')) - parseFloat(a.tvl.replace(/[$,B]/g, '')));
  }
  
  return data;
});

// Unique chains
const uniqueChains = computed(() => {
  const chains = new Set(lendingRates.value.map(r => r.chain));
  return ['all', ...Array.from(chains)];
});

// Format functions
function formatApy(apy: number): string {
  return (apy * 100).toFixed(2) + '%';
}

function getSupplyRate(rate: LendingRate, asset: string = 'USDC'): number {
  return rate.supplyRate[asset] || rate.apy;
}

function getBorrowRate(rate: LendingRate, asset: string = 'USDC'): number {
  return rate.borrowRate[asset] || 0;
}

function getApyColor(apy: number): string {
  if (apy >= 0.05) return '#10B981';
  if (apy >= 0.04) return '#3B82F6';
  if (apy >= 0.03) return '#F59E0B';
  return '#6B7280';
}

function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    Ethereum: '#627EEA',
    Polygon: '#8247E5',
    Arbitrum: '#28A0F0',
    Base: '#0052FF',
    Avalanche: '#E84142',
    BSC: '#F3BA2F',
    Solana: '#9945FF',
  };
  return colors[chain] || '#6B7280';
}

// Calculate earnings
function calculateEarnings() {
  if (!filteredRates.value.length) return;
  
  const bestRate = filteredRates.value[0];
  const annualRate = bestRate.apy;
  const dailyRate = annualRate / 365;
  
  calcResult.value = {
    earnings: calcAmount.value * dailyRate * calcDays.value,
    apy: annualRate,
  };
}

// Get asset color
function getAssetColor(symbol: string): string {
  const asset = assets.value.find(a => a.symbol === symbol);
  return asset?.color || '#6B7280';
}

onMounted(() => {
  loadProtocols();
  loadAssets();
  loadLendingRates();
  loadTrends();
  loadOpportunities();
});
</script>

<template>
  <div class="lending-rate-comparator">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">💰</span>
          Cross-chain Lending Rate Comparator
        </h1>
        <p class="page-desc">Compare lending rates across DeFi protocols and chains</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'compare' }]"
          @click="activeTab = 'compare'"
        >
          Rate Comparison
        </button>
        <button 
          :class="['tab', { active: activeTab === 'trends' }]"
          @click="activeTab = 'trends'"
        >
          Rate Trends
        </button>
        <button 
          :class="['tab', { active: activeTab === 'opportunities' }]"
          @click="activeTab = 'opportunities'"
        >
          Best Opportunities
        </button>
        <button 
          :class="['tab', { active: activeTab === 'calculator' }]"
          @click="activeTab = 'calculator'"
        >
          Calculator
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading lending rates...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadLendingRates" class="retry-btn">Retry</button>
    </div>

    <!-- Content -->
    <div v-else class="content">
      <!-- Summary Cards -->
      <div v-if="summary && activeTab === 'compare'" class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-value">{{ summary.totalProtocols }}</div>
            <div class="card-label">Total Protocols</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <div class="card-value">{{ summary.averageSupplyRate }}</div>
            <div class="card-label">Avg. Supply Rate</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">📉</div>
          <div class="card-content">
            <div class="card-value">{{ summary.averageBorrowRate }}</div>
            <div class="card-label">Avg. Borrow Rate</div>
          </div>
        </div>
        <div class="summary-card highlight">
          <div class="card-icon">🏆</div>
          <div class="card-content">
            <div class="card-value">{{ formatApy(summary.bestSupply) }}</div>
            <div class="card-label">Best Supply Rate</div>
          </div>
        </div>
      </div>

      <!-- Compare Tab -->
      <div v-if="activeTab === 'compare'" class="compare-section">
        <!-- Filters -->
        <div class="filters-bar">
          <div class="filter-group">
            <label>Chain:</label>
            <select v-model="selectedChain" @change="loadLendingRates">
              <option value="all">All Chains</option>
              <option value="1">Ethereum</option>
              <option value="137">Polygon</option>
              <option value="42161">Arbitrum</option>
              <option value="8453">Base</option>
              <option value="43114">Avalanche</option>
              <option value="56">BSC</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Protocol:</label>
            <select v-model="selectedProtocol" @change="loadLendingRates">
              <option value="all">All Protocols</option>
              <option value="aave">Aave</option>
              <option value="compound">Compound</option>
              <option value="morpho">Morpho</option>
              <option value="liquity">Liquity</option>
              <option value="gearbox">Gearbox</option>
              <option value="venus">Venus</option>
              <option value="radiant">Radiant</option>
              <option value="kamino">Kamino</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Asset:</label>
            <select v-model="selectedAsset" @change="loadLendingRates">
              <option v-for="asset in assets" :key="asset.symbol" :value="asset.symbol">
                {{ asset.symbol }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>Sort by:</label>
            <select v-model="sortBy">
              <option value="apy">APY</option>
              <option value="tvl">TVL</option>
            </select>
          </div>
        </div>

        <!-- Rates Table -->
        <div class="rates-table-container">
          <table class="rates-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Chain</th>
                <th>TVL</th>
                <th>Supply APY</th>
                <th>Borrow APR</th>
                <th>Spread</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rate in filteredRates" :key="`${rate.protocolId}-${rate.chainId}`">
                <td>
                  <div class="protocol-cell">
                    <span class="protocol-logo">{{ rate.logo }}</span>
                    <span class="protocol-name">{{ rate.protocol }}</span>
                  </div>
                </td>
                <td>
                  <span 
                    class="chain-badge" 
                    :style="{ backgroundColor: getChainColor(rate.chain) + '20', color: getChainColor(rate.chain) }"
                  >
                    {{ rate.chain }}
                  </span>
                </td>
                <td class="tvl-cell">{{ rate.tvl }}</td>
                <td>
                  <span class="apy-value" :style="{ color: getApyColor(rate.apy) }">
                    {{ formatApy(rate.apy) }}
                  </span>
                </td>
                <td>
                  <span class="borrow-value">
                    {{ formatApy(getBorrowRate(rate, selectedAsset)) }}
                  </span>
                </td>
                <td>
                  <span class="spread-value">
                    {{ formatApy(getBorrowRate(rate, selectedAsset) - getSupplyRate(rate, selectedAsset)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Trends Tab -->
      <div v-if="activeTab === 'trends'" class="trends-section">
        <div class="trends-header">
          <h3>Supply Rate Trends - {{ selectedAsset }}</h3>
          <div class="asset-selector">
            <button 
              v-for="asset in assets.slice(0, 6)" 
              :key="asset.symbol"
              :class="['asset-btn', { active: selectedAsset === asset.symbol }]"
              :style="{ '--asset-color': asset.color }"
              @click="selectedAsset = asset.symbol; loadTrends()"
            >
              {{ asset.symbol }}
            </button>
          </div>
        </div>
        
        <div class="trends-chart">
          <div class="chart-placeholder">
            <div class="chart-visual">
              <svg viewBox="0 0 800 200" class="trend-svg">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:0" />
                  </linearGradient>
                </defs>
                <path 
                  v-if="trends.length"
                  :d="generateChartPath(trends)"
                  fill="url(#areaGradient)"
                  stroke="#3B82F6"
                  stroke-width="2"
                />
              </svg>
            </div>
            <div class="trend-stats">
              <div class="trend-stat">
                <span class="stat-label">30d Avg</span>
                <span class="stat-value">
                  {{ trends.length ? (trends.reduce((s, t) => s + t.raw, 0) / trends.length * 100).toFixed(2) + '%' : 'N/A' }}
                </span>
              </div>
              <div class="trend-stat">
                <span class="stat-label">High</span>
                <span class="stat-value text-green">
                  {{ trends.length ? (Math.max(...trends.map(t => t.raw)) * 100).toFixed(2) + '%' : 'N/A' }}
                </span>
              </div>
              <div class="trend-stat">
                <span class="stat-label">Low</span>
                <span class="stat-value text-red">
                  {{ trends.length ? (Math.min(...trends.map(t => t.raw)) * 100).toFixed(2) + '%' : 'N/A' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="trends-list">
          <div v-for="trend in trends.slice(-7).reverse()" :key="trend.date" class="trend-item">
            <span class="trend-date">{{ trend.date }}</span>
            <span class="trend-rate">{{ trend.rate }}</span>
          </div>
        </div>
      </div>

      <!-- Opportunities Tab -->
      <div v-if="activeTab === 'opportunities'" class="opportunities-section">
        <div class="opportunities-header">
          <h3>Best Lending Opportunities for {{ calcAmount.toLocaleString() }} {{ selectedAsset }}</h3>
          <div class="opp-controls">
            <input 
              type="number" 
              v-model.number="calcAmount" 
              @change="loadOpportunities"
              class="amount-input"
              placeholder="Amount"
            />
            <select v-model="selectedAsset" @change="loadOpportunities">
              <option v-for="asset in assets" :key="asset.symbol" :value="asset.symbol">
                {{ asset.symbol }}
              </option>
            </select>
          </div>
        </div>

        <div class="opportunities-grid">
          <div 
            v-for="(opp, idx) in opportunities" 
            :key="idx"
            :class="['opp-card', { top: idx === 0 }]"
          >
            <div class="opp-rank">{{ idx + 1 }}</div>
            <div class="opp-content">
              <div class="opp-header">
                <span class="opp-logo">{{ opp.logo }}</span>
                <span class="opp-protocol">{{ opp.protocol }}</span>
                <span class="opp-chain">{{ opp.chain }}</span>
              </div>
              <div class="opp-apy">{{ (opp.apy * 100).toFixed(2) }}% APY</div>
              <div class="opp-yields">
                <div class="yield-item">
                  <span class="yield-label">Daily</span>
                  <span class="yield-value">${{ opp.dailyYield }}</span>
                </div>
                <div class="yield-item">
                  <span class="yield-label">Monthly</span>
                  <span class="yield-value">${{ opp.monthlyYield }}</span>
                </div>
                <div class="yield-item">
                  <span class="yield-label">Annual</span>
                  <span class="yield-value">${{ opp.annualYield }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calculator Tab -->
      <div v-if="activeTab === 'calculator'" class="calculator-section">
        <div class="calculator-card">
          <h3>Lending Earnings Calculator</h3>
          <div class="calc-form">
            <div class="calc-input">
              <label>Principal Amount</label>
              <div class="input-group">
                <input type="number" v-model.number="calcAmount" />
                <select v-model="selectedAsset">
                  <option v-for="asset in assets" :key="asset.symbol" :value="asset.symbol">
                    {{ asset.symbol }}
                  </option>
                </select>
              </div>
            </div>
            <div class="calc-input">
              <label>Duration (days)</label>
              <input type="number" v-model.number="calcDays" />
            </div>
            <button @click="calculateEarnings" class="calc-btn">Calculate</button>
          </div>

          <div v-if="calcResult" class="calc-result">
            <div class="result-header">Estimated Earnings</div>
            <div class="result-value">${{ calcResult.earnings.toFixed(2) }}</div>
            <div class="result-details">
              <span>Based on {{ formatApy(calcResult.apy) }} APY</span>
            </div>
          </div>
        </div>

        <div class="best-rates-card" v-if="bestRates">
          <h3>Current Best Rates</h3>
          <div class="best-list">
            <h4>Best Supply Rates</h4>
            <div v-for="rate in bestRates.bestSupply" :key="rate.protocol" class="best-item">
              <span class="best-protocol">{{ rate.protocol }}</span>
              <span class="best-chain">{{ rate.chain }}</span>
              <span class="best-rate">{{ rate.rate }}</span>
            </div>
          </div>
          <div class="best-list">
            <h4>Lowest Borrow Rates</h4>
            <div v-for="rate in bestRates.lowestBorrow" :key="rate.protocol" class="best-item">
              <span class="best-protocol">{{ rate.protocol }}</span>
              <span class="best-chain">{{ rate.chain }}</span>
              <span class="best-rate">{{ rate.rate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Helper function for chart path
function generateChartPath(data: TrendData[]): string {
  if (!data.length) return '';
  
  const max = Math.max(...data.map(d => d.raw));
  const min = Math.min(...data.map(d => d.raw));
  const range = max - min || 1;
  
  const width = 800;
  const height = 200;
  const padding = 10;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((d.raw - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });
  
  return `M${points.join(' L')} L${width - padding},${height - padding} L${padding},${height - padding} Z`;
}
</script>

<style scoped>
.lending-rate-comparator {
  padding: 24px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.title-icon {
  font-size: 32px;
}

.page-desc {
  color: #94a3b8;
  margin: 0;
}

.tabs-container {
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #334155;
  padding-bottom: 12px;
}

.tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab:hover {
  background: #1e293b;
  color: #e2e8f0;
}

.tab.active {
  background: #3b82f6;
  color: white;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card.highlight {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.card-icon {
  font-size: 32px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
}

.card-label {
  font-size: 12px;
  color: #94a3b8;
}

.summary-card.highlight .card-label {
  color: rgba(255,255,255,0.8);
}

.filters-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: #94a3b8;
}

.filter-group select {
  padding: 8px 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
}

.rates-table-container {
  overflow-x: auto;
}

.rates-table {
  width: 100%;
  border-collapse: collapse;
}

.rates-table th,
.rates-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.rates-table th {
  background: #1e293b;
  font-weight: 600;
  font-size: 14px;
  color: #94a3b8;
}

.rates-table tr:hover {
  background: #1e293b;
}

.protocol-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.protocol-logo {
  font-size: 20px;
}

.protocol-name {
  font-weight: 500;
}

.chain-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tvl-cell {
  color: #94a3b8;
}

.apy-value {
  font-weight: 600;
  font-size: 16px;
}

.borrow-value {
  color: #f87171;
}

.spread-value {
  color: #94a3b8;
  font-size: 14px;
}

.trends-section, .opportunities-section, .calculator-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
}

.trends-header, .opportunities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.trends-header h3, .opportunities-header h3 {
  margin: 0;
  font-size: 18px;
}

.asset-selector {
  display: flex;
  gap: 8px;
}

.asset-btn {
  padding: 6px 12px;
  background: #334155;
  border: none;
  border-radius: 4px;
  color: #e2e8f0;
  cursor: pointer;
  font-size: 12px;
}

.asset-btn.active {
  background: var(--asset-color, #3b82f6);
}

.chart-placeholder {
  background: #0f172a;
  border-radius: 8px;
  padding: 24px;
}

.chart-visual {
  height: 200px;
  margin-bottom: 16px;
}

.trend-svg {
  width: 100%;
  height: 100%;
}

.trend-stats {
  display: flex;
  gap: 24px;
}

.trend-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.text-green {
  color: #10b981;
}

.stat-value.text-red {
  color: #ef4444;
}

.trends-list {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #0f172a;
  border-radius: 6px;
  min-width: 80px;
}

.trend-date {
  font-size: 11px;
  color: #94a3b8;
}

.trend-rate {
  font-size: 14px;
  font-weight: 600;
}

.opp-controls {
  display: flex;
  gap: 8px;
}

.amount-input {
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  width: 120px;
}

.opportunities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.opp-card {
  background: #0f172a;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
}

.opp-card.top {
  border: 2px solid #fbbf24;
}

.opp-rank {
  width: 32px;
  height: 32px;
  background: #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.opp-card.top .opp-rank {
  background: #fbbf24;
  color: #0f172a;
}

.opp-content {
  flex: 1;
}

.opp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.opp-logo {
  font-size: 20px;
}

.opp-protocol {
  font-weight: 600;
}

.opp-chain {
  font-size: 12px;
  color: #94a3b8;
}

.opp-apy {
  font-size: 20px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 12px;
}

.opp-yields {
  display: flex;
  gap: 16px;
}

.yield-item {
  display: flex;
  flex-direction: column;
}

.yield-label {
  font-size: 11px;
  color: #94a3b8;
}

.yield-value {
  font-size: 14px;
  font-weight: 500;
}

.calculator-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .calculator-section {
    grid-template-columns: 1fr;
  }
}

.calculator-card, .best-rates-card {
  background: #0f172a;
  border-radius: 12px;
  padding: 24px;
}

.calculator-card h3, .best-rates-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.calc-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calc-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calc-input label {
  font-size: 14px;
  color: #94a3b8;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input, .calc-input input {
  flex: 1;
  padding: 10px 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 16px;
}

.input-group select, .calc-form select {
  padding: 10px 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #e2e8f0;
}

.calc-btn {
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.calc-btn:hover {
  background: #2563eb;
}

.calc-result {
  margin-top: 24px;
  text-align: center;
  padding: 20px;
  background: #1e293b;
  border-radius: 8px;
}

.result-header {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.result-value {
  font-size: 36px;
  font-weight: 700;
  color: #10b981;
}

.result-details {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 8px;
}

.best-list {
  margin-bottom: 20px;
}

.best-list h4 {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 12px 0;
}

.best-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #334155;
}

.best-protocol {
  font-weight: 500;
}

.best-chain {
  font-size: 12px;
  color: #94a3b8;
}

.best-rate {
  font-weight: 600;
  color: #10b981;
}
</style>
