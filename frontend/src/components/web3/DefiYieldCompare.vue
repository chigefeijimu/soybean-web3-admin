<template>
  <div class="defi-yield-compare">
    <div class="header">
      <h2>DeFi Yield Comparator 🧪</h2>
      <p class="subtitle">Compare yields across different DeFi protocols</p>
    </div>

    <!-- Asset Selection -->
    <div class="card">
      <h3>Select Asset</h3>
      <div class="asset-grid">
        <button
          v-for="asset in assets"
          :key="asset"
          :class="['asset-btn', { active: selectedAsset === asset }]"
          @click="selectAsset(asset)"
        >
          {{ asset }}
        </button>
      </div>
    </div>

    <!-- Best Rates -->
    <div class="card" v-if="bestRates">
      <h3>Best Rates for {{ selectedAsset }}</h3>
      <div class="rates-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Protocol</th>
              <th>Chain</th>
              <th>Type</th>
              <th>APY</th>
              <th>Est. Annual Return</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rate, index) in bestRates.opportunities" :key="index">
              <td>
                <span :class="['rank', { top3: index < 3 }]">#{{ index + 1 }}</span>
              </td>
              <td>
                <span class="protocol">{{ rate.protocol }}</span>
              </td>
              <td>
                <span class="chain">{{ rate.chain }}</span>
              </td>
              <td>
                <span class="type">{{ rate.type }}</span>
              </td>
              <td>
                <span class="apy">{{ rate.apy.toFixed(2) }}%</span>
              </td>
              <td class="return">
                ${{ rate.estimatedAnnualReturn }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Protocol Comparison -->
    <div class="card">
      <h3>Compare Protocols</h3>
      <div class="compare-form">
        <div class="form-group">
          <label>Select Protocols to Compare:</label>
          <div class="protocol-checkboxes">
            <label v-for="protocol in availableProtocols" :key="protocol" class="checkbox-label">
              <input
                type="checkbox"
                :value="protocol"
                v-model="selectedProtocols"
              >
              {{ protocol }}
            </label>
          </div>
        </div>
        <button class="compare-btn" @click="compareProtocols" :disabled="selectedProtocols.length < 2">
          Compare Selected
        </button>
      </div>

      <div v-if="comparisonResult" class="comparison-result">
        <div class="comparison-chart">
          <div
            v-for="(item, index) in comparisonResult.ranking"
            :key="index"
            class="bar-container"
          >
            <div class="bar-label">{{ item.protocol }}</div>
            <div class="bar-wrapper">
              <div
                class="bar"
                :style="{ width: (item.apy / maxApy * 100) + '%' }"
                :class="{ winner: index === 0 }"
              ></div>
            </div>
            <div class="bar-value">{{ item.apy.toFixed(2) }}%</div>
          </div>
        </div>

        <div v-if="comparisonResult.winner" class="winner-banner">
          🏆 Best Option: {{ comparisonResult.winner.protocol }} ({{ comparisonResult.winner.apy }}% APY)
          <br>
          <span class="extra-return">
            Extra return: ${{ comparisonResult.winner.extraReturn }}/year
          </span>
        </div>
      </div>
    </div>

    <!-- Trending Opportunities -->
    <div class="card">
      <h3>🔥 Trending Opportunities</h3>
      <div class="trending-grid">
        <div
          v-for="(opp, index) in trendingOpportunities"
          :key="index"
          class="trending-card"
          @click="selectAsset(opp.asset)"
        >
          <div class="trending-header">
            <span class="trending-rank">#{{ index + 1 }}</span>
            <span class="trending-asset">{{ opp.asset }}</span>
          </div>
          <div class="trending-protocol">{{ opp.protocol }}</div>
          <div class="trending-apy">{{ opp.apy.toFixed(2) }}% APY</div>
          <div class="trending-chain">{{ opp.chain }}</div>
        </div>
      </div>
    </div>

    <!-- Risk Analysis -->
    <div class="card">
      <h3>⚠️ Risk Analysis</h3>
      <div class="risk-summary">
        <div class="risk-stat">
          <span class="risk-label">Low Risk</span>
          <span class="risk-value low">{{ riskAnalysis?.riskDistribution?.low || 0 }}</span>
        </div>
        <div class="risk-stat">
          <span class="risk-label">Medium Risk</span>
          <span class="risk-value medium">{{ riskAnalysis?.riskDistribution?.medium || 0 }}</span>
        </div>
        <div class="risk-stat">
          <span class="risk-label">High Risk</span>
          <span class="risk-value high">{{ riskAnalysis?.riskDistribution?.high || 0 }}</span>
        </div>
      </div>

      <div class="protocols-risk-list">
        <div
          v-for="protocol in riskAnalysis?.protocols?.slice(0, 10)"
          :key="protocol.name"
          class="protocol-risk-item"
        >
          <div class="protocol-info">
            <span class="protocol-name">{{ protocol.name }}</span>
            <span class="protocol-chain">{{ protocol.chain }}</span>
          </div>
          <div class="risk-badge" :class="protocol.risk">
            {{ protocol.risk.toUpperCase() }}
          </div>
          <div class="protocol-tvl">{{ protocol.tvlFormatted }}</div>
        </div>
      </div>
    </div>

    <!-- Historical Rates -->
    <div class="card">
      <h3>📈 Historical APY (Last 30 Days)</h3>
      <div class="chart-placeholder">
        <div class="chart-bars">
          <div
            v-for="(rate, index) in historicalRates.slice(0, 20)"
            :key="index"
            class="chart-bar"
            :style="{ height: (rate.apy / maxHistoricalApy * 100) + '%' }"
            :title="`${rate.date}: ${rate.apy}%`"
          ></div>
        </div>
        <div class="chart-labels">
          <span v-for="(rate, index) in historicalRates.slice(0, 20)" :key="index">
            {{ rate.date.slice(5) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const { get } = useApi();

const assets = ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'stETH', 'MATIC', 'ARB'];
const selectedAsset = ref('USDC');
const bestRates = ref<any>(null);
const comparisonResult = ref<any>(null);
const trendingOpportunities = ref<any[]>([]);
const riskAnalysis = ref<any>(null);
const historicalRates = ref<any[]>([]);

const selectedProtocols = ref<string[]>([]);

const availableProtocols = computed(() => {
  if (!bestRates.value?.opportunities) return [];
  return bestRates.value.opportunities.map((r: any) => r.protocol);
});

const maxApy = computed(() => {
  if (!comparisonResult.value?.ranking) return 100;
  return Math.max(...comparisonResult.value.ranking.map((r: any) => r.apy));
});

const maxHistoricalApy = computed(() => {
  if (!historicalRates.value.length) return 10;
  return Math.max(...historicalRates.value.map((r: any) => parseFloat(r.apy)));
});

const selectAsset = async (asset: string) => {
  selectedAsset.value = asset;
  await loadBestRates();
};

const loadBestRates = async () => {
  try {
    const response = await axios.get(`/api/web3/defi-yield-compare/best-rates?asset=${selectedAsset.value}&amount=10000`);
    bestRates.value = response.data;
  } catch (e) {
    console.error('Failed to load best rates:', e);
  }
};

const compareProtocols = async () => {
  if (selectedProtocols.value.length < 2) return;
  try {
    const response = await axios.get(
      `/api/web3/defi-yield-compare/compare?protocols=${selectedProtocols.value.join(',')}&asset=${selectedAsset.value}&amount=10000`
    );
    comparisonResult.value = response.data;
  } catch (e) {
    console.error('Failed to compare protocols:', e);
  }
};

const loadTrending = async () => {
  try {
    const response = await axios.get('/api/web3/defi-yield-compare/trending?limit=8');
    trendingOpportunities.value = response.data;
  } catch (e) {
    console.error('Failed to load trending:', e);
  }
};

const loadRiskAnalysis = async () => {
  try {
    riskAnalysis.value = await get('/api/web3/defi-yield-compare/risk-analysis');
  } catch (e) {
    console.error('Failed to load risk analysis:', e);
  }
};

const loadHistoricalRates = async () => {
  try {
    historicalRates.value = await get(
      `/api/web3/defi-yield-compare/historical?asset=${selectedAsset.value}&days=30`
    );
  } catch (e) {
    console.error('Failed to load historical rates:', e);
  }
};

onMounted(async () => {
  await loadBestRates();
  await loadTrending();
  await loadRiskAnalysis();
  await loadHistoricalRates();
});
</script>

<style scoped>
.defi-yield-compare {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  margin: 0;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card h3 {
  margin: 0 0 16px 0;
  color: #1a1a2e;
  font-size: 16px;
}

.asset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.asset-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.asset-btn:hover {
  border-color: #6366f1;
}

.asset-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.rates-table table {
  width: 100%;
  border-collapse: collapse;
}

.rates-table th,
.rates-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.rates-table th {
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.rank {
  font-weight: bold;
  color: #999;
}

.rank.top3 {
  color: #f59e0b;
}

.protocol {
  font-weight: 600;
}

.chain {
  color: #666;
  font-size: 13px;
}

.type {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.apy {
  color: #10b981;
  font-weight: 600;
  font-size: 15px;
}

.return {
  font-weight: 600;
  color: #1a1a2e;
}

.compare-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.protocol-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.compare-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.compare-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comparison-result {
  margin-top: 20px;
}

.comparison-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 100px;
  font-weight: 500;
  font-size: 14px;
}

.bar-wrapper {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #6366f1;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar.winner {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.bar-value {
  width: 60px;
  text-align: right;
  font-weight: 600;
}

.winner-banner {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  margin-top: 20px;
  font-size: 18px;
  font-weight: 600;
}

.extra-return {
  font-size: 14px;
  opacity: 0.9;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.trending-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
}

.trending-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.trending-rank {
  color: #f59e0b;
  font-weight: bold;
}

.trending-asset {
  background: #6366f1;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.trending-protocol {
  font-weight: 600;
  margin-bottom: 4px;
}

.trending-apy {
  color: #10b981;
  font-size: 18px;
  font-weight: bold;
}

.trending-chain {
  color: #666;
  font-size: 12px;
}

.risk-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.risk-stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.risk-label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.risk-value {
  font-size: 24px;
  font-weight: bold;
}

.risk-value.low {
  color: #10b981;
}

.risk-value.medium {
  color: #f59e0b;
}

.risk-value.high {
  color: #ef4444;
}

.protocols-risk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.protocol-risk-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.protocol-info {
  flex: 1;
}

.protocol-name {
  font-weight: 600;
}

.protocol-chain {
  color: #666;
  font-size: 12px;
  margin-left: 8px;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin: 0 12px;
}

.risk-badge.low {
  background: #d1fae5;
  color: #065f46;
}

.risk-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.risk-badge.high {
  background: #fee2e2;
  color: #991b1b;
}

.protocol-tvl {
  color: #666;
  font-size: 13px;
}

.chart-placeholder {
  padding: 20px 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 150px;
  gap: 4px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.chart-labels {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  font-size: 10px;
  color: #999;
  overflow: hidden;
}

.chart-labels span {
  flex: 1;
  text-align: center;
}
</style>
