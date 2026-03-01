<template>
  <div class="token-holder-analyzer">
    <div class="header">
      <h2>📊 Token Holder Distribution Analyzer</h2>
      <p class="subtitle">Analyze token holder distribution and concentration risk</p>
    </div>

    <!-- Search Form -->
    <div class="search-section">
      <div class="input-group">
        <input
          v-model="tokenAddress"
          type="text"
          placeholder="Enter token contract address (e.g., 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)"
          class="address-input"
          @keyup.enter="fetchHolders"
        />
        <select v-model="selectedChain" class="chain-select">
          <option :value="1">Ethereum</option>
          <option :value="137">Polygon</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
          <option :value="56">BSC</option>
        </select>
        <button @click="fetchHolders" :disabled="loading" class="search-btn">
          {{ loading ? 'Loading...' : 'Analyze' }}
        </button>
      </div>
      
      <!-- Quick Select -->
      <div class="quick-select">
        <span>Quick:</span>
        <button 
          v-for="token in quickTokens" 
          :key="token.address"
          @click="selectToken(token.address)"
          class="quick-btn"
        >
          {{ token.symbol }}
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Results -->
    <div v-if="holderData" class="results">
      <!-- Token Info Card -->
      <div class="token-info-card">
        <div class="token-header">
          <div class="token-icon">{{ holderData.tokenSymbol.charAt(0) }}</div>
          <div class="token-details">
            <h3>{{ holderData.tokenName }} ({{ holderData.tokenSymbol }})</h3>
            <p class="token-address">{{ shortenAddress(holderData.tokenAddress) }}</p>
          </div>
          <div class="risk-badge" :class="holderData.concentrationRisk">
            {{ getRiskLabel(holderData.concentrationRisk) }}
          </div>
        </div>
        <div class="token-stats">
          <div class="stat">
            <span class="stat-label">Total Supply</span>
            <span class="stat-value">{{ formatNumber(holderData.totalSupply) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Holders</span>
            <span class="stat-value">{{ formatNumber(holderData.holdersCount) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Contract Balance</span>
            <span class="stat-value">{{ holderData.contractPercentage.toFixed(2) }}%</span>
          </div>
        </div>
      </div>

      <!-- Concentration Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <h4>Top 10 Holders</h4>
          <div class="metric-value" :class="getMetricClass(holderData.top10Percentage)">
            {{ holderData.top10Percentage }}%
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: holderData.top10Percentage + '%' }"></div>
          </div>
        </div>
        <div class="metric-card">
          <h4>Top 20 Holders</h4>
          <div class="metric-value" :class="getMetricClass(holderData.top20Percentage)">
            {{ holderData.top20Percentage }}%
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: holderData.top20Percentage + '%' }"></div>
          </div>
        </div>
        <div class="metric-card">
          <h4>Top 50 Holders</h4>
          <div class="metric-value" :class="getMetricClass(holderData.top50Percentage)">
            {{ holderData.top50Percentage }}%
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: holderData.top50Percentage + '%' }"></div>
          </div>
        </div>
        <div class="metric-card">
          <h4>Contract Holdings</h4>
          <div class="metric-value neutral">
            {{ holderData.contractPercentage.toFixed(2) }}%
          </div>
          <div class="progress-bar">
            <div class="progress contract" :style="{ width: holderData.contractPercentage + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Distribution Chart -->
      <div class="chart-section">
        <h3>📈 Distribution Breakdown</h3>
        <div class="distribution-chart">
          <div 
            v-for="(item, index) in holderData.distribution" 
            :key="item.range"
            class="bar-container"
          >
            <div class="bar" :style="{ height: item.percentage * 3 + 'px' }">
              <span class="bar-value">{{ item.percentage }}%</span>
            </div>
            <span class="bar-label">{{ item.range }}</span>
          </div>
        </div>
      </div>

      <!-- Holders Table -->
      <div class="holders-section">
        <h3>🏆 Top Holders</h3>
        <div class="table-container">
          <table class="holders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Address</th>
                <th>Balance</th>
                <th>Percentage</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="holder in holderData.holders.slice(0, 20)" :key="holder.address">
                <td>{{ holder.rank }}</td>
                <td class="address-cell">
                  <span class="address">{{ shortenAddress(holder.address) }}</span>
                  <span v-if="holder.label" class="label-badge">{{ holder.label }}</span>
                </td>
                <td>{{ holder.balanceFormatted }}</td>
                <td :class="holder.rank <= 10 ? 'top-holder' : ''">{{ holder.percentage }}%</td>
                <td>
                  <span :class="['type-badge', holder.isContract ? 'contract' : 'eoa']">
                    {{ holder.isContract ? 'Contract' : 'EOA' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Insights -->
      <div class="insights-section">
        <h3>💡 Insights</h3>
        <div class="insights-grid">
          <div class="insight-card" :class="holderData.concentrationRisk">
            <div class="insight-icon">{{ getInsightIcon(holderData.concentrationRisk) }}</div>
            <div class="insight-content">
              <h4>Concentration Risk</h4>
              <p>{{ getInsightText(holderData) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && !error" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>Token Holder Distribution Analyzer</h3>
      <p>Enter a token contract address to analyze its holder distribution</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const tokenAddress = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const error = ref('');
const holderData = ref(null);

const quickTokens = [
  { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  { symbol: 'AAVE', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
  { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
  { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca' }
];

const selectToken = (address) => {
  tokenAddress.value = address;
  fetchHolders();
};

const fetchHolders = async () => {
  if (!tokenAddress.value) {
    error.value = 'Please enter a token address';
    return;
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.value)) {
    error.value = 'Invalid token address format';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(
      `/api/web3/data-viz/token-holders?address=${tokenAddress.value}&chainId=${selectedChain.value}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch holder data');
    }
    
    holderData.value = await response.json();
  } catch (err) {
    error.value = err.message || 'An error occurred while fetching data';
  } finally {
    loading.value = false;
  }
};

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toLocaleString();
};

const getRiskLabel = (risk) => {
  const labels = {
    'low': '🟢 Low Risk',
    'medium': '🟡 Medium Risk',
    'high': '🟠 High Risk',
    'very-high': '🔴 Very High Risk'
  };
  return labels[risk] || 'Unknown';
};

const getMetricClass = (percentage) => {
  if (percentage > 80) return 'danger';
  if (percentage > 60) return 'warning';
  if (percentage > 40) return 'caution';
  return 'safe';
};

const getInsightIcon = (risk) => {
  const icons = {
    'low': '✅',
    'medium': '⚠️',
    'high': '🚨',
    'very-high': '⛔'
  };
  return icons[risk] || '📊';
};

const getInsightText = (data) => {
  if (data.concentrationRisk === 'very-high') {
    return `This token has extremely high concentration risk with Top 10 holders owning ${data.top10Percentage}% of supply. This is highly unusual and could indicate a scam or pre-mined token.`;
  } else if (data.concentrationRisk === 'high') {
    return `High concentration detected - Top 10 holders control ${data.top10Percentage}% of tokens. Be cautious of rug pull risks.`;
  } else if (data.concentrationRisk === 'medium') {
    return `Moderate concentration with Top 10 at ${data.top10Percentage}%. Fair distribution but still worth monitoring.`;
  } else {
    return `Good distribution - Top 10 holders own only ${data.top10Percentage}%. This is a healthy, decentralized token.`;
  }
};
</script>

<style scoped>
.token-holder-analyzer {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1a1a2e;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  transition: border-color 0.2s;
}

.address-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.chain-select {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.search-btn {
  padding: 12px 24px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #4338ca;
}

.search-btn:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.quick-select {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-select span {
  color: #666;
  font-size: 14px;
}

.quick-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #e5e7eb;
  border-color: #4f46e5;
}

.error-message {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  margin-bottom: 24px;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.token-info-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.token-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.token-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.token-details h3 {
  margin: 0;
  font-size: 18px;
}

.token-address {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.risk-badge {
  margin-left: auto;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.risk-badge.low { background: #d1fae5; color: #065f46; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fed7aa; color: #c2410c; }
.risk-badge.very-high { background: #fee2e2; color: #dc2626; }

.token-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.metric-card h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.metric-value.danger { color: #dc2626; }
.metric-value.warning { color: #f59e0b; }
.metric-value.caution { color: #eab308; }
.metric-value.safe { color: #10b981; }
.metric-value.neutral { color: #4f46e5; }

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #4f46e5;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress.contract {
  background: #8b5cf6;
}

.chart-section {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-section h3 {
  margin: 0 0 20px 0;
}

.distribution-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 20px 0;
}

.bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar {
  width: 60px;
  background: linear-gradient(180deg, #4f46e5, #7c3aed);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
  min-height: 20px;
}

.bar-value {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.bar-label {
  font-size: 12px;
  color: #666;
}

.holders-section {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.holders-section h3 {
  margin: 0 0 16px 0;
}

.table-container {
  overflow-x: auto;
}

.holders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.holders-table th,
.holders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.holders-table th {
  font-weight: 600;
  color: #666;
  background: #f9fafb;
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address {
  font-family: monospace;
  color: #4f46e5;
}

.label-badge {
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 11px;
}

.top-holder {
  font-weight: 600;
  color: #4f46e5;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.type-badge.contract {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.eoa {
  background: #d1fae5;
  color: #065f46;
}

.insights-section {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.insights-section h3 {
  margin: 0 0 16px 0;
}

.insights-grid {
  display: grid;
  gap: 16px;
}

.insight-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
}

.insight-card.low { background: #d1fae5; }
.insight-card.medium { background: #fef3c7; }
.insight-card.high { background: #fed7aa; }
.insight-card.very-high { background: #fee2e2; }

.insight-icon {
  font-size: 24px;
}

.insight-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.insight-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0;
  color: #666;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .token-stats {
    grid-template-columns: 1fr;
  }
  
  .input-group {
    flex-direction: column;
  }
}
</style>
