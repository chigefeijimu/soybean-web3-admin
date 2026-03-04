<template>
  <div class="defi-protocol-metrics">
    <div class="header">
      <h1>📊 DeFi Protocol Metrics</h1>
      <p class="subtitle">Cross-chain DeFi protocol analytics and comparison</p>
    </div>

    <!-- Overview Cards -->
    <div class="overview-cards" v-if="overview">
      <div class="card">
        <div class="card-label">Total TVL</div>
        <div class="card-value">${{ formatNumber(overview.totalTvl) }}</div>
      </div>
      <div class="card">
        <div class="card-label">24h Volume</div>
        <div class="card-value">${{ formatNumber(overview.totalVolume24h) }}</div>
      </div>
      <div class="card">
        <div class="card-label">24h Fees</div>
        <div class="card-value">${{ formatNumber(overview.totalFees24h) }}</div>
      </div>
      <div class="card">
        <div class="card-label">24h Revenue</div>
        <div class="card-value">${{ formatNumber(overview.totalRevenue24h) }}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Users (24h)</div>
        <div class="card-value">{{ formatNumber(overview.totalUsers24h) }}</div>
      </div>
      <div class="card">
        <div class="card-label">Avg APY</div>
        <div class="card-value">{{ overview.avgApy?.toFixed(2) }}%</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="selectedChain" @change="loadProtocols">
        <option value="">All Chains</option>
        <option v-for="chain in chains" :key="chain.name" :value="chain.name">
          {{ chain.name }} ({{ chain.protocolCount }})
        </option>
      </select>
      <select v-model="selectedCategory" @change="loadProtocols">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat.name" :value="cat.name">
          {{ cat.name }}
        </option>
      </select>
      <select v-model="sortBy" @change="loadProtocols">
        <option value="tvl">Sort by TVL</option>
        <option value="volume24h">Sort by Volume</option>
        <option value="fees24h">Sort by Fees</option>
        <option value="avgApy">Sort by APY</option>
        <option value="riskScore">Sort by Risk</option>
      </select>
      <input type="text" v-model="searchQuery" placeholder="Search protocols..." @input="handleSearch" class="search-input" />
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="search-results">
      <h3>Search Results</h3>
      <div class="results-grid">
        <div v-for="result in searchResults" :key="result.id" class="result-item" @click="viewProtocol(result.id)">
          <div class="result-name">{{ result.name }}</div>
          <div class="result-meta">{{ result.chain }} • {{ result.category }}</div>
        </div>
      </div>
    </div>

    <!-- Protocols Table -->
    <div class="protocols-section" v-if="!selectedProtocol">
      <div class="section-header">
        <h2>Protocols ({{ protocols.length }})</h2>
        <button @click="showCompare = true" :disabled="compareList.length < 2" class="compare-btn">
          Compare ({{ compareList.length }})
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Protocol</th>
              <th>Chain</th>
              <th>Category</th>
              <th>TVL</th>
              <th>24h Change</th>
              <th>Volume</th>
              <th>Fees</th>
              <th>APY</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="protocol in protocols" :key="protocol.id" :class="{ selected: compareList.includes(protocol.id) }">
              <td><input type="checkbox" :checked="compareList.includes(protocol.id)" @change="toggleCompare(protocol.id)" /></td>
              <td class="protocol-name" @click="viewProtocol(protocol.id)">{{ protocol.name }}</td>
              <td><span class="chain-badge">{{ protocol.chain }}</span></td>
              <td>{{ protocol.category }}</td>
              <td>${{ formatNumber(protocol.tvl) }}</td>
              <td :class="protocol.tvlChange24h >= 0 ? 'positive' : 'negative'">
                {{ protocol.tvlChange24h >= 0 ? '+' : '' }}{{ protocol.tvlChange24h.toFixed(2) }}%
              </td>
              <td>${{ formatNumber(protocol.volume24h) }}</td>
              <td>${{ formatNumber(protocol.fees24h) }}</td>
              <td>{{ protocol.avgApy.toFixed(1) }}%</td>
              <td>
                <span class="risk-badge" :class="getRiskClass(protocol.riskScore)">
                  {{ protocol.riskScore }}
                </span>
              </td>
              <td>
                <button @click="viewProtocol(protocol.id)" class="view-btn">Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Protocol Details -->
    <div v-if="selectedProtocol" class="protocol-details">
      <button @click="selectedProtocol = null" class="back-btn">← Back to List</button>
      
      <div class="details-header">
        <h2>{{ selectedProtocol.name }}</h2>
        <span class="chain-badge large">{{ selectedProtocol.chain }}</span>
        <span class="category-badge">{{ selectedProtocol.category }}</span>
      </div>

      <div class="details-grid">
        <div class="detail-card">
          <div class="detail-label">TVL</div>
          <div class="detail-value">${{ formatNumber(selectedProtocol.tvl) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">24h Change</div>
          <div class="detail-value" :class="selectedProtocol.tvlChange24h >= 0 ? 'positive' : 'negative'">
            {{ selectedProtocol.tvlChange24h >= 0 ? '+' : '' }}{{ selectedProtocol.tvlChange24h.toFixed(2) }}%
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-label">7d Change</div>
          <div class="detail-value" :class="selectedProtocol.tvlChange7d >= 0 ? 'positive' : 'negative'">
            {{ selectedProtocol.tvlChange7d >= 0 ? '+' : '' }}{{ selectedProtocol.tvlChange7d.toFixed(2) }}%
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-label">24h Volume</div>
          <div class="detail-value">${{ formatNumber(selectedProtocol.volume24h) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">24h Fees</div>
          <div class="detail-value">${{ formatNumber(selectedProtocol.fees24h) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">24h Revenue</div>
          <div class="detail-value">${{ formatNumber(selectedProtocol.revenue24h) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">24h Users</div>
          <div class="detail-value">{{ formatNumber(selectedProtocol.users24h) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Avg APY</div>
          <div class="detail-value">{{ selectedProtocol.avgApy.toFixed(2) }}%</div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="risk-section">
        <h3>Risk Assessment</h3>
        <div class="risk-info">
          <div class="risk-score" :class="getRiskClass(selectedProtocol.riskScore)">
            Score: {{ selectedProtocol.riskScore }}
          </div>
          <div class="risk-level">
            Level: <strong>{{ selectedProtocol.riskScore < 20 ? 'LOW' : selectedProtocol.riskScore < 30 ? 'MEDIUM' : 'HIGH' }}</strong>
          </div>
        </div>
        <ul class="risk-factors" v-if="selectedProtocol.riskAssessment?.factors?.length">
          <li v-for="factor in selectedProtocol.riskAssessment.factors" :key="factor">{{ factor }}</li>
        </ul>
      </div>

      <!-- Audit Info -->
      <div class="audit-section">
        <h3>Audit Status</h3>
        <div class="audit-status" :class="selectedProtocol.auditStatus">
          {{ selectedProtocol.auditStatus?.toUpperCase() }}
        </div>
        <ul class="audit-list" v-if="selectedProtocol.auditInfo?.audits?.length">
          <li v-for="audit in selectedProtocol.auditInfo.audits" :key="audit">{{ audit }}</li>
        </ul>
      </div>

      <!-- Historical Chart -->
      <div class="chart-section" v-if="selectedProtocol.historicalData?.length">
        <h3>30-Day TVL History</h3>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div v-for="(data, index) in selectedProtocol.historicalData" :key="index" 
                 class="chart-bar" 
                 :style="{ height: (data.tvl / selectedProtocol.tvl * 100) + '%' }"
                 :title="data.date + ': $' + formatNumber(data.tvl)">
            </div>
          </div>
          <div class="chart-labels">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compare Modal -->
    <div v-if="showCompare" class="modal-overlay" @click="showCompare = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Protocol Comparison</h2>
          <button @click="showCompare = false" class="close-btn">×</button>
        </div>
        <div class="modal-body" v-if="compareData">
          <div class="compare-grid">
            <div class="compare-metric" v-for="(data, metric) in compareData.comparison" :key="metric">
              <h4>{{ formatMetricName(metric) }}</h4>
              <div class="compare-values">
                <div v-for="val in data.values" :key="val.id" class="compare-value" :class="{ winner: val.id === data.max.id, loser: val.id === data.min.id }">
                  <span class="val-name">{{ val.name }}</span>
                  <span class="val-num">{{ formatCompareValue(metric, val.value) }}</span>
                </div>
              </div>
              <div class="compare-summary">
                <span>Avg: {{ formatCompareValue(metric, data.avg) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { defiProtocolMetricsApi } from '@/service/api';

const overview = ref<any>(null);
const protocols = ref<any[]>([]);
const chains = ref<any[]>([]);
const categories = ref<any[]>([]);
const searchResults = ref<any[]>([]);

const selectedChain = ref('');
const selectedCategory = ref('');
const sortBy = ref('tvl');
const searchQuery = ref('');

const selectedProtocol = ref<any>(null);
const compareList = ref<string[]>([]);
const compareData = ref<any>(null);
const showCompare = ref(false);

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getRiskClass = (score: number) => {
  if (score < 20) return 'low';
  if (score < 30) return 'medium';
  return 'high';
};

const getRiskLabel = (score: number) => {
  if (score < 20) return 'Low';
  if (score < 30) return 'Medium';
  return 'High';
};

const formatMetricName = (metric: string) => {
  const names: Record<string, string> = {
    tvl: 'TVL',
    volume24h: '24h Volume',
    fees24h: '24h Fees',
    revenue24h: '24h Revenue',
    users24h: '24h Users',
    avgApy: 'Avg APY',
    riskScore: 'Risk Score',
  };
  return names[metric] || metric;
};

const formatCompareValue = (metric: string, value: number) => {
  if (metric === 'avgApy' || metric.includes('Change')) return value.toFixed(2) + '%';
  if (metric === 'riskScore') return value.toString();
  return '$' + formatNumber(value);
};

const loadOverview = async () => {
  try {
    overview.value = await defiProtocolMetricsApi.getOverview();
  } catch (e) {
    console.error('Failed to load overview:', e);
  }
};

const loadProtocols = async () => {
  try {
    const result = await defiProtocolMetricsApi.getProtocols(
      selectedChain.value,
      selectedCategory.value,
      sortBy.value
    );
    protocols.value = result.protocols || [];
  } catch (e) {
    console.error('Failed to load protocols:', e);
  }
};

const loadChains = async () => {
  try {
    chains.value = await defiProtocolMetricsApi.getChains();
    chains.value = chains.value.chains || [];
  } catch (e) {
    console.error('Failed to load chains:', e);
  }
};

const loadCategories = async () => {
  try {
    categories.value = await defiProtocolMetricsApi.getCategories();
    categories.value = categories.value.categories || [];
  } catch (e) {
    console.error('Failed to load categories:', e);
  }
};

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  try {
    const result = await defiProtocolMetricsApi.searchProtocols(searchQuery.value);
    searchResults.value = result.results || [];
  } catch (e) {
    console.error('Failed to search:', e);
  }
};

const viewProtocol = async (id: string) => {
  try {
    selectedProtocol.value = await defiProtocolMetricsApi.getProtocolDetails(id);
    searchResults.value = [];
    searchQuery.value = '';
  } catch (e) {
    console.error('Failed to load protocol details:', e);
  }
};

const toggleCompare = (id: string) => {
  const index = compareList.value.indexOf(id);
  if (index > -1) {
    compareList.value.splice(index, 1);
  } else {
    if (compareList.value.length < 5) {
      compareList.value.push(id);
    }
  }
};

const loadCompare = async () => {
  if (compareList.value.length < 2) return;
  try {
    compareData.value = await defiProtocolMetricsApi.compareProtocols(compareList.value.join(','));
  } catch (e) {
    console.error('Failed to load comparison:', e);
  }
};

onMounted(async () => {
  await Promise.all([loadOverview(), loadProtocols(), loadChains(), loadCategories()]);
});
</script>

<style scoped>
.defi-protocol-metrics {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.card:nth-child(2) { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.card:nth-child(3) { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.card:nth-child(4) { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.card:nth-child(5) { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.card:nth-child(6) { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }

.card-label {
  font-size: 14px;
  opacity: 0.9;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 8px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filters select, .filters input {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-results {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.result-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-name {
  font-weight: 600;
}

.result-meta {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.protocols-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.compare-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.compare-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.protocol-name {
  font-weight: 600;
  color: #667eea;
  cursor: pointer;
}

.protocol-name:hover {
  text-decoration: underline;
}

.chain-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.chain-badge.large {
  padding: 6px 12px;
  font-size: 14px;
}

.category-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.positive { color: #4caf50; }
.negative { color: #f44336; }

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.low { background: #e8f5e9; color: #2e7d32; }
.risk-badge.medium { background: #fff3e0; color: #ef6c00; }
.risk-badge.high { background: #ffebee; color: #c62828; }

.view-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.protocol-details {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.detail-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 20px;
  font-weight: 600;
}

.risk-section, .audit-section, .chart-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.risk-info {
  display: flex;
  gap: 24px;
  margin: 16px 0;
}

.risk-score {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
}

.risk-score.low { background: #e8f5e9; color: #2e7d32; }
.risk-score.medium { background: #fff3e0; color: #ef6c00; }
.risk-score.high { background: #ffebee; color: #c62828; }

.risk-factors, .audit-list {
  margin-top: 12px;
  padding-left: 20px;
}

.risk-factors li, .audit-list li {
  margin: 8px 0;
  color: #666;
}

.audit-status {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  margin: 12px 0;
}

.audit-status.audited { background: #e8f5e9; color: #2e7d32; }
.audit-status.partially-audited { background: #fff3e0; color: #ef6c00; }
.audit-status.unaudited { background: #ffebee; color: #c62828; }

.chart-placeholder {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  margin-top: 16px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 150px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2);
  min-width: 4px;
  border-radius: 2px 2px 0 0;
  transition: all 0.2s;
}

.chart-bar:hover {
  background: linear-gradient(to top, #f093fb, #f5576c);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.compare-grid {
  display: grid;
  gap: 20px;
}

.compare-metric {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.compare-metric h4 {
  margin-bottom: 12px;
}

.compare-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-value {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
}

.compare-value.winner {
  background: #e8f5e9;
}

.compare-value.loser {
  background: #ffebee;
}

.compare-summary {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style>
