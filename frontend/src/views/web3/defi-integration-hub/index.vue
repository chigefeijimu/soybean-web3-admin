<template>
  <div class="defi-integration-hub">
    <div class="header">
      <h1>🔗 DeFi Integration Hub</h1>
      <p class="subtitle">Unified multi-protocol DeFi position management</p>
    </div>

    <!-- Search & Controls -->
    <div class="controls">
      <div class="search-box">
        <input 
          v-model="searchAddress" 
          placeholder="Enter wallet address..."
          @keyup.enter="loadPortfolio"
        />
        <button @click="loadPortfolio" :disabled="loading">
          {{ loading ? 'Loading...' : 'Analyze Portfolio' }}
        </button>
      </div>
    </div>

    <!-- Portfolio Summary -->
    <div v-if="portfolioSummary" class="summary-cards">
      <div class="card total-value">
        <div class="card-label">Total Portfolio Value</div>
        <div class="card-value">${{ formatNumber(portfolioSummary.totalValue) }}</div>
        <div class="card-change" :class="portfolioSummary.change24h >= 0 ? 'positive' : 'negative'">
          {{ portfolioSummary.change24h >= 0 ? '↑' : '↓' }} {{ Math.abs(portfolioSummary.change24h).toFixed(2) }}% (24h)
        </div>
      </div>

      <div class="card risk-score">
        <div class="card-label">Risk Score</div>
        <div class="card-value">{{ portfolioSummary.riskScore }}</div>
        <div class="card-grade">{{ getGrade(portfolioSummary.riskScore) }}</div>
      </div>

      <div class="card apy">
        <div class="card-label">Weighted APY</div>
        <div class="card-value">{{ portfolioSummary.weightedApy.toFixed(2) }}%</div>
        <div class="card-sub">Average yield</div>
      </div>

      <div class="card positions">
        <div class="card-label">Active Positions</div>
        <div class="card-value">{{ positions.length }}</div>
        <div class="card-sub">Across {{ Object.keys(portfolioSummary.positionsByProtocol || {}).length }} protocols</div>
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

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Positions Tab -->
      <div v-if="activeTab === 'positions'" class="positions-tab">
        <div v-if="positions.length === 0" class="empty-state">
          <p>No positions found. Add a position to get started.</p>
        </div>
        <div v-else class="positions-grid">
          <div v-for="(pos, idx) in positions" :key="idx" class="position-card">
            <div class="position-header">
              <span class="protocol-name">{{ pos.protocol }}</span>
              <span class="chain-badge">{{ pos.chain }}</span>
            </div>
            <div class="position-type">{{ pos.positionType }}</div>
            <div class="position-value">${{ formatNumber(pos.currentValue) }}</div>
            <div class="position-apy">{{ pos.apy?.toFixed(2) }}% APY</div>
            <div class="position-tokens">
              <span v-for="token in pos.tokens.slice(0, 2)" :key="token" class="token-tag">
                {{ token.slice(0, 6) }}...
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Protocols Tab -->
      <div v-if="activeTab === 'protocols'" class="protocols-tab">
        <div class="protocols-grid">
          <div v-for="protocol in supportedProtocols" :key="protocol.name" class="protocol-card">
            <div class="protocol-header">
              <span class="protocol-name">{{ protocol.name }}</span>
              <span class="category-badge">{{ protocol.category }}</span>
            </div>
            <div class="protocol-chains">
              <span v-for="chain in protocol.chains" :key="chain" class="chain-tag">
                {{ chain }}
              </span>
            </div>
            <div class="protocol-features">
              <span v-for="feature in protocol.features" :key="feature" class="feature-tag">
                {{ feature }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Opportunities Tab -->
      <div v-if="activeTab === 'opportunities'" class="opportunities-tab">
        <div class="filters">
          <select v-model="opportunityFilter.chain" @change="loadOpportunities">
            <option value="">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="base">Base</option>
            <option value="bsc">BSC</option>
            <option value="avalanche">Avalanche</option>
          </select>
        </div>
        <div class="opportunities-grid">
          <div v-for="opp in opportunities" :key="opp.poolId" class="opportunity-card">
            <div class="opp-header">
              <span class="protocol">{{ opp.protocol }}</span>
              <span class="risk-badge" :class="opp.riskLevel">{{ opp.riskLevel }}</span>
            </div>
            <div class="opp-chain">{{ opp.chain }}</div>
            <div class="opp-tokens">{{ opp.tokens.join(' / ') }}</div>
            <div class="opp-apy">{{ opp.apy.toFixed(1) }}% APY</div>
            <div class="opp-stats">
              <div class="stat">
                <span class="label">TVL</span>
                <span class="value">${{ formatNumber(opp.tvl) }}</span>
              </div>
              <div class="stat">
                <span class="label">24h Vol</span>
                <span class="value">${{ formatNumber(opp.volume24h) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Health Tab -->
      <div v-if="activeTab === 'health'" class="health-tab">
        <div v-if="portfolioHealth" class="health-dashboard">
          <div class="health-score-display">
            <div class="score-circle" :class="portfolioHealth.grade.toLowerCase()">
              <span class="grade">{{ portfolioHealth.grade }}</span>
              <span class="score">{{ portfolioHealth.healthScore }}</span>
            </div>
          </div>

          <div class="health-metrics">
            <div class="metric">
              <div class="metric-label">Diversification Score</div>
              <div class="metric-bar">
                <div class="bar-fill" :style="{ width: portfolioHealth.diversificationScore + '%' }"></div>
              </div>
              <div class="metric-value">{{ portfolioHealth.diversificationScore }}/100</div>
            </div>

            <div class="metric">
              <div class="metric-label">Concentration Risk</div>
              <div class="metric-bar">
                <div class="bar-fill risk" :style="{ width: portfolioHealth.concentrationRisk + '%' }"></div>
              </div>
              <div class="metric-value">{{ portfolioHealth.concentrationRisk }}/100</div>
            </div>

            <div class="metric">
              <div class="metric-label">Liquidity Score</div>
              <div class="metric-bar">
                <div class="bar-fill" :style="{ width: portfolioHealth.liquidityScore + '%' }"></div>
              </div>
              <div class="metric-value">{{ portfolioHealth.liquidityScore }}/100</div>
            </div>
          </div>

          <div class="risk-factors" v-if="portfolioHealth.riskFactors.length > 0">
            <h3>⚠️ Risk Factors</h3>
            <ul>
              <li v-for="factor in portfolioHealth.riskFactors" :key="factor">{{ factor }}</li>
            </ul>
          </div>

          <div class="recommendations" v-if="portfolioHealth.recommendations.length > 0">
            <h3>💡 Recommendations</h3>
            <ul>
              <li v-for="rec in portfolioHealth.recommendations" :key="rec">{{ rec }}</li>
            </ul>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>Enter a wallet address to analyze portfolio health</p>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="history-tab">
        <div v-if="positionHistory.length === 0" class="empty-state">
          <p>No position history found</p>
        </div>
        <div v-else class="history-list">
          <div v-for="(item, idx) in positionHistory" :key="idx" class="history-item">
            <div class="history-action" :class="item.action">
              {{ item.action }}
            </div>
            <div class="history-details">
              <span class="protocol">{{ item.protocol }}</span>
              <span class="chain">{{ item.chain }}</span>
            </div>
            <div class="history-value">${{ formatNumber(item.usdValue) }}</div>
            <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { defiHubApi } from '@/service/modules/defi-integration-hub';

const searchAddress = ref('0x1234567890abcdef1234567890abcdef12345678');
const loading = ref(false);
const activeTab = ref('positions');

const tabs = [
  { id: 'positions', name: 'Positions', icon: '📊' },
  { id: 'protocols', name: 'Protocols', icon: '🔗' },
  { id: 'opportunities', name: 'Opportunities', icon: '💎' },
  { id: 'health', name: 'Health', icon: '💚' },
  { id: 'history', name: 'History', icon: '📜' },
];

const portfolioSummary = ref<any>(null);
const positions = ref<any[]>([]);
const supportedProtocols = ref<any[]>([]);
const opportunities = ref<any[]>([]);
const portfolioHealth = ref<any>(null);
const positionHistory = ref<any[]>([]);

const opportunityFilter = ref({
  chain: '',
});

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const getGrade = (score: number) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const loadPortfolio = async () => {
  loading.value = true;
  try {
    const [summary, posList, health, history] = await Promise.all([
      defiHubApi.getPortfolioSummary(searchAddress.value),
      defiHubApi.getPositions(searchAddress.value),
      defiHubApi.getPortfolioHealth(searchAddress.value),
      defiHubApi.getPositionHistory(searchAddress.value),
    ]);
    
    portfolioSummary.value = summary;
    positions.value = posList;
    portfolioHealth.value = health;
    positionHistory.value = history;
  } catch (error) {
    console.error('Failed to load portfolio:', error);
  }
  loading.value = false;
};

const loadProtocols = async () => {
  try {
    supportedProtocols.value = await defiHubApi.getSupportedProtocols();
  } catch (error) {
    console.error('Failed to load protocols:', error);
  }
};

const loadOpportunities = async () => {
  try {
    opportunities.value = await defiHubApi.findYieldOpportunities(
      opportunityFilter.value.chain || undefined
    );
  } catch (error) {
    console.error('Failed to load opportunities:', error);
  }
};

onMounted(() => {
  loadPortfolio();
  loadProtocols();
  loadOpportunities();
});
</script>

<style scoped>
.defi-integration-hub {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.controls {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-box button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.search-box button:disabled {
  background: #999;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
}

.card-change {
  font-size: 14px;
  margin-top: 4px;
}

.card-change.positive { color: #10b981; }
.card-change.negative { color: #ef4444; }

.card-grade {
  font-size: 24px;
  font-weight: 700;
  color: #4f46e5;
}

.card-sub {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
}

.tab.active {
  background: #4f46e5;
  color: white;
}

.tab-content {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.position-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.position-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.protocol-name {
  font-weight: 600;
}

.chain-badge {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.position-type {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
  margin-bottom: 8px;
}

.position-value {
  font-size: 20px;
  font-weight: 600;
}

.position-apy {
  color: #10b981;
  font-size: 14px;
}

.position-tokens {
  margin-top: 8px;
}

.token-tag {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  margin-right: 4px;
}

.protocols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.protocol-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.protocol-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category-badge {
  background: #d1fae5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.protocol-chains {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.chain-tag {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.protocol-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.feature-tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.filters {
  margin-bottom: 16px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.opportunities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.opportunity-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.opp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.risk-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.risk-badge.low { background: #d1fae5; color: #059669; }
.risk-badge.medium { background: #fef3c7; color: #d97706; }
.risk-badge.high { background: #fee2e2; color: #dc2626; }

.opp-chain {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
  margin-bottom: 4px;
}

.opp-tokens {
  font-size: 14px;
  margin-bottom: 8px;
}

.opp-apy {
  font-size: 24px;
  font-weight: 600;
  color: #10b981;
}

.opp-stats {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 11px;
  color: #666;
}

.stat .value {
  font-size: 14px;
  font-weight: 500;
}

.health-dashboard {
  background: white;
  padding: 24px;
  border-radius: 12px;
}

.health-score-display {
  text-align: center;
  margin-bottom: 24px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 4px solid #ddd;
}

.score-circle.a { border-color: #10b981; }
.score-circle.b { border-color: #22c55e; }
.score-circle.c { border-color: #eab308; }
.score-circle.d { border-color: #f97316; }
.score-circle.f { border-color: #ef4444; }

.score-circle .grade {
  font-size: 36px;
  font-weight: 700;
}

.score-circle .score {
  font-size: 14px;
  color: #666;
}

.health-metrics {
  margin-bottom: 24px;
}

.metric {
  margin-bottom: 16px;
}

.metric-label {
  font-size: 14px;
  margin-bottom: 4px;
}

.metric-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s;
}

.bar-fill.risk {
  background: #ef4444;
}

.metric-value {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.risk-factors, .recommendations {
  margin-top: 24px;
}

.risk-factors h3, .recommendations h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.risk-factors ul, .recommendations ul {
  list-style: none;
  padding: 0;
}

.risk-factors li, .recommendations li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  color: #666;
}

.recommendations li::before {
  content: '✓ ';
  color: #10b981;
}

.history-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.history-action {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.history-action.deposit { background: #d1fae5; color: #059669; }
.history-action.withdraw { background: #fee2e2; color: #dc2626; }
.history-action.swap { background: #e0e7ff; color: #4f46e5; }
.history-action.stake { background: #fef3c7; color: #d97706; }
.history-action.claim { background: #f3e8ff; color: #9333ea; }

.history-details {
  flex: 1;
  margin-left: 16px;
}

.history-details .protocol {
  font-weight: 500;
}

.history-details .chain {
  color: #666;
  margin-left: 8px;
  font-size: 12px;
}

.history-value {
  font-weight: 500;
}

.history-time {
  color: #999;
  font-size: 12px;
  margin-left: 16px;
}
</style>
