<template>
  <div class="defi-dashboard">
    <div class="header">
      <h2>📊 DeFi Dashboard</h2>
      <div class="actions">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address..." 
          class="address-input"
          @keyup.enter="loadDashboard"
        />
        <button @click="loadDashboard" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Load Dashboard' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading DeFi dashboard data...</p>
    </div>

    <div v-else-if="summary" class="dashboard-content">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card total-value">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <span class="card-label">Total Value</span>
            <span class="card-value">${{ formatNumber(summary.totalValueUSD) }}</span>
            <span class="card-change" :class="summary.weeklyChange >= 0 ? 'positive' : 'negative'">
              {{ summary.weeklyChange >= 0 ? '+' : '' }}{{ summary.weeklyChange.toFixed(2) }}% (7d)
            </span>
          </div>
        </div>

        <div class="summary-card yield">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <span class="card-label">Avg. APY</span>
            <span class="card-value">{{ summary.totalYieldAPY.toFixed(2) }}%</span>
            <span class="card-sub">Weighted Average</span>
          </div>
        </div>

        <div class="summary-card positions">
          <div class="card-icon">🎯</div>
          <div class="card-content">
            <span class="card-label">Active Positions</span>
            <span class="card-value">{{ summary.totalPositions }}</span>
            <span class="card-sub">Across {{ summary.activeProtocols }} protocols</span>
          </div>
        </div>

        <div class="summary-card risk">
          <div class="card-icon">⚠️</div>
          <div class="card-content">
            <span class="card-label">Risk Score</span>
            <span class="card-value">{{ summary.riskScore }}</span>
            <span class="card-sub risk-level" :class="summary.riskLevel">{{ summary.riskLevel }}</span>
          </div>
        </div>
      </div>

      <!-- Market Overview -->
      <div class="section market-overview">
        <h3>🌐 DeFi Market Overview</h3>
        <div v-if="marketOverview" class="market-grid">
          <div class="market-stat">
            <span class="stat-label">Total DeFi TVL</span>
            <span class="stat-value">${{ formatNumber(marketOverview.totalDefiTVL) }}</span>
            <span class="stat-change" :class="marketOverview.change24h >= 0 ? 'positive' : 'negative'">
              {{ marketOverview.change24h >= 0 ? '+' : '' }}{{ marketOverview.change24h }}% (24h)
            </span>
          </div>
          <div class="chain-tvl">
            <h4>Top Chains by TVL</h4>
            <div class="chain-list">
              <div v-for="chain in marketOverview.topChains.slice(0, 5)" :key="chain.name" class="chain-item">
                <span class="chain-name">{{ chain.name }}</span>
                <div class="chain-bar">
                  <div class="bar-fill" :style="{ width: chain.dominance + '%' }"></div>
                </div>
                <span class="chain-tvl-value">${{ formatNumber(chain.tvl) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Portfolio Distribution -->
      <div class="section distribution">
        <h3>📊 Portfolio Distribution</h3>
        <div v-if="distribution" class="distribution-content">
          <div class="distribution-chart">
            <div v-for="item in distribution.distribution" :key="item.category" class="dist-bar">
              <div class="dist-label">
                <span>{{ item.category }}</span>
                <span>${{ formatNumber(item.value) }} ({{ item.percentage.toFixed(1) }}%)</span>
              </div>
              <div class="dist-progress">
                <div class="progress-fill" :style="{ width: item.percentage + '%', backgroundColor: getCategoryColor(item.category) }"></div>
              </div>
            </div>
          </div>
          <div class="diversification-score">
            <div class="score-circle" :style="{ background: getScoreGradient(distribution.diversificationScore) }">
              <span class="score-value">{{ distribution.diversificationScore }}</span>
            </div>
            <span class="score-label">Diversification Score</span>
          </div>
        </div>
      </div>

      <!-- Yield Opportunities -->
      <div class="section yield-opportunities">
        <h3>🌾 Top Yield Opportunities</h3>
        <div class="yield-table">
          <table>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Token</th>
                <th>Chain</th>
                <th>APY</th>
                <th>TVL</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="opp in yieldOpportunities" :key="opp.protocol + opp.token">
                <td class="protocol-cell">
                  <span class="protocol-name">{{ opp.protocol }}</span>
                </td>
                <td>{{ opp.token }}</td>
                <td><span class="chain-badge">{{ opp.chain }}</span></td>
                <td class="apy-cell">{{ opp.apy.toFixed(2) }}%</td>
                <td>${{ formatNumber(opp.tvl) }}</td>
                <td>
                  <span class="risk-badge" :class="opp.risk">{{ opp.risk }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Risk Analysis -->
      <div v-if="riskAnalysis" class="section risk-analysis">
        <h3>🛡️ Risk Analysis</h3>
        <div class="risk-grid">
          <div class="risk-factors">
            <h4>Risk Factors</h4>
            <div class="factor-list">
              <div class="factor-item">
                <span class="factor-label">Concentration Risk</span>
                <div class="factor-bar">
                  <div class="bar-fill" :style="{ width: riskAnalysis.factors.concentration + '%' }"></div>
                </div>
                <span class="factor-value">{{ riskAnalysis.factors.concentration }}</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Volatility</span>
                <div class="factor-bar">
                  <div class="bar-fill" :style="{ width: riskAnalysis.factors.volatility + '%' }"></div>
                </div>
                <span class="factor-value">{{ riskAnalysis.factors.volatility }}</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Protocol Exposure</span>
                <div class="factor-bar">
                  <div class="bar-fill" :style="{ width: riskAnalysis.factors.protocolExposure + '%' }"></div>
                </div>
                <span class="factor-value">{{ riskAnalysis.factors.protocolExposure }}</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Liquidity</span>
                <div class="factor-bar">
                  <div class="bar-fill" :style="{ width: riskAnalysis.factors.liquidity + '%' }"></div>
                </div>
                <span class="factor-value">{{ riskAnalysis.factors.liquidity }}</span>
              </div>
            </div>
          </div>
          <div class="recommendations">
            <h4>Recommendations</h4>
            <ul>
              <li v-for="rec in riskAnalysis.recommendations" :key="rec">{{ rec }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Protocol Stats -->
      <div class="section protocol-stats">
        <h3>🏦 Top DeFi Protocols</h3>
        <div class="protocol-grid">
          <div v-for="proto in protocolStats" :key="proto.name" class="protocol-card">
            <div class="proto-header">
              <span class="proto-name">{{ proto.name }}</span>
              <span class="proto-category">{{ proto.category }}</span>
            </div>
            <div class="proto-stats">
              <div class="proto-stat">
                <span class="stat-label">TVL</span>
                <span class="stat-value">${{ formatNumber(proto.tvl) }}</span>
              </div>
              <div class="proto-stat">
                <span class="stat-label">APY</span>
                <span class="stat-value">{{ proto.apy.toFixed(1) }}%</span>
              </div>
              <div class="proto-stat">
                <span class="stat-label">Users</span>
                <span class="stat-value">{{ formatNumber(proto.users) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to view your DeFi dashboard</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const walletAddress = ref('');
const loading = ref(false);
const summary = ref<any>(null);
const marketOverview = ref<any>(null);
const distribution = ref<any>(null);
const yieldOpportunities = ref<any[]>([]);
const riskAnalysis = ref<any>(null);
const protocolStats = ref<any[]>([]);

const API_BASE = 'http://localhost:3018';

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Lending': '#3b82f6',
    'DEX': '#8b5cf6',
    'Staking': '#10b981',
    'Yield Farming': '#f59e0b',
    'Liquid Staking': '#06b6d4',
    'Bridge': '#ec4899',
  };
  return colors[category] || '#6b7280';
};

const getScoreGradient = (score: number): string => {
  if (score >= 70) return 'linear-gradient(135deg, #10b981, #059669)';
  if (score >= 40) return 'linear-gradient(135deg, #f59e0b, #d97706)';
  return 'linear-gradient(135deg, #ef4444, #dc2626)';
};

const loadDashboard = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const [summaryRes, marketRes, distRes, yieldRes, riskRes, protoRes] = await Promise.all([
      fetch(`${API_BASE}/api/defi-dashboard/summary?address=${walletAddress.value}`),
      fetch(`${API_BASE}/api/defi-dashboard/market-overview`),
      fetch(`${API_BASE}/api/defi-dashboard/portfolio-distribution?address=${walletAddress.value}`),
      fetch(`${API_BASE}/api/defi-dashboard/yield-opportunities?limit=10`),
      fetch(`${API_BASE}/api/defi-dashboard/risk-analysis?address=${walletAddress.value}`),
      fetch(`${API_BASE}/api/defi-dashboard/protocols`),
    ]);

    summary.value = await summaryRes.json();
    marketOverview.value = await marketRes.json();
    distribution.value = await distRes.json();
    yieldOpportunities.value = await yieldRes.json();
    riskAnalysis.value = await riskRes.json();
    protocolStats.value = await protoRes.json();
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Auto-load with a demo address if needed
});
</script>

<style scoped>
.defi-dashboard {
  padding: 24px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.actions {
  display: flex;
  gap: 12px;
}

.address-input {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  width: 300px;
  font-size: 14px;
}

.address-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  border: 1px solid #334155;
}

.card-icon {
  font-size: 32px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
}

.card-change {
  font-size: 13px;
}

.card-change.positive { color: #10b981; }
.card-change.negative { color: #ef4444; }

.card-sub {
  font-size: 12px;
  color: #64748b;
}

.risk-level {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.risk-level.low { background: #10b98133; color: #10b981; }
.risk-level.moderate { background: #f59e0b33; color: #f59e0b; }
.risk-level.high { background: #ef444433; color: #ef4444; }

.section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #334155;
}

.section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #f8fafc;
}

.market-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
}

.market-stat {
  display: flex;
  flex-direction: column;
}

.market-stat .stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.market-stat .stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-change {
  font-size: 14px;
}

.stat-change.positive { color: #10b981; }
.stat-change.negative { color: #ef4444; }

.chain-tvl h4 {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.chain-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-name {
  width: 80px;
  font-size: 13px;
}

.chain-bar {
  flex: 1;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.chain-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
}

.chain-tvl-value {
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: #94a3b8;
}

.distribution-content {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 24px;
  align-items: center;
}

.dist-bar {
  margin-bottom: 12px;
}

.dist-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.dist-progress {
  height: 10px;
  background: #334155;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.diversification-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 28px;
  font-weight: 700;
  color: white;
}

.score-label {
  font-size: 12px;
  color: #94a3b8;
}

.yield-table table {
  width: 100%;
  border-collapse: collapse;
}

.yield-table th,
.yield-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.yield-table th {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
}

.protocol-cell .protocol-name {
  font-weight: 600;
  color: #60a5fa;
}

.chain-badge {
  padding: 2px 8px;
  background: #334155;
  border-radius: 4px;
  font-size: 12px;
}

.apy-cell {
  color: #10b981;
  font-weight: 600;
}

.risk-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.risk-badge.low { background: #10b98133; color: #10b981; }
.risk-badge.medium { background: #f59e0b33; color: #f59e0b; }
.risk-badge.high { background: #ef444433; color: #ef4444; }

.risk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.risk-factors h4,
.recommendations h4 {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.factor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.factor-label {
  width: 140px;
  font-size: 13px;
}

.factor-bar {
  flex: 1;
  height: 8px;
  background: #334155;
  border-radius: 4px;
}

.factor-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
  border-radius: 4px;
}

.factor-value {
  width: 30px;
  text-align: right;
  font-size: 13px;
  color: #94a3b8;
}

.recommendations ul {
  list-style: none;
  padding: 0;
}

.recommendations li {
  padding: 8px 0;
  font-size: 13px;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
}

.recommendations li::before {
  content: "→ ";
  color: #3b82f6;
}

.protocol-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.protocol-card {
  background: #0f172a;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #334155;
}

.proto-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.proto-name {
  font-weight: 600;
  color: #60a5fa;
}

.proto-category {
  font-size: 11px;
  padding: 2px 6px;
  background: #334155;
  border-radius: 4px;
  color: #94a3b8;
}

.proto-stats {
  display: flex;
  justify-content: space-between;
}

.proto-stat {
  display: flex;
  flex-direction: column;
}

.proto-stat .stat-label {
  font-size: 10px;
  color: #64748b;
}

.proto-stat .stat-value {
  font-size: 14px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .protocol-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .distribution-content {
    grid-template-columns: 1fr;
  }
  
  .risk-grid {
    grid-template-columns: 1fr;
  }
}
</style>
