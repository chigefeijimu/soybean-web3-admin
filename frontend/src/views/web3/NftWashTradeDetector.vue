<template>
  <div class="nft-wash-trade-detector">
    <div class="header-section">
      <h1>🧼 NFT Wash Trade Detector</h1>
      <p class="subtitle">Detect artificial trading volume and protect yourself from manipulated NFT markets</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter NFT collection address (e.g., 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB)"
          class="address-input"
          @keyup.enter="analyzeCollection"
        />
        <select v-model="selectedChain" class="chain-select">
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="base">Base</option>
          <option value="solana">Solana</option>
        </select>
        <button @click="analyzeCollection" class="analyze-btn" :disabled="loading">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="stats-grid" v-if="analysisResult">
      <div class="stat-card" :class="getRiskClass(analysisResult.riskLevel)">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-label">Risk Level</div>
          <div class="stat-value">{{ analysisResult.riskLevel }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">Total Sales</div>
          <div class="stat-value">{{ analysisResult.totalSales }}</div>
        </div>
      </div>
      
      <div class="stat-card warning">
        <div class="stat-icon">🚿</div>
        <div class="stat-content">
          <div class="stat-label">Wash Trades</div>
          <div class="stat-value">{{ analysisResult.washTrades }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">Wash Volume</div>
          <div class="stat-value">{{ analysisResult.washVolumePercentage }}%</div>
        </div>
      </div>
    </div>

    <!-- Analysis Result -->
    <div class="result-section" v-if="analysisResult">
      <div class="section-card">
        <h2>📈 Collection Analysis</h2>
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-label">Collection</span>
            <span class="metric-value">{{ shortenAddress(analysisResult.collection) }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Chain</span>
            <span class="metric-value">{{ analysisResult.chain }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Total Volume</span>
            <span class="metric-value">{{ analysisResult.totalVolume }} ETH</span>
          </div>
          <div class="metric">
            <span class="metric-label">Suspicious Volume</span>
            <span class="metric-value warning">{{ analysisResult.washTradeVolume }} ETH</span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section-card recommendations">
        <h2>💡 Recommendations</h2>
        <ul>
          <li v-for="(rec, idx) in analysisResult.recommendations" :key="idx">
            {{ rec }}
          </li>
        </ul>
      </div>

      <!-- Detected Patterns -->
      <div class="section-card patterns" v-if="analysisResult.detectedPatterns && analysisResult.detectedPatterns.length > 0">
        <h2>🔍 Detected Patterns</h2>
        <div class="pattern-tags">
          <span 
            v-for="(pattern, idx) in analysisResult.detectedPatterns" 
            :key="idx" 
            class="pattern-tag"
          >
            {{ pattern }}
          </span>
        </div>
      </div>
    </div>

    <!-- Sales History -->
    <div class="sales-section" v-if="salesData && salesData.sales && salesData.sales.length > 0">
      <div class="section-card">
        <h2>📜 Sales History with Wash Trade Analysis</h2>
        <div class="table-container">
          <table class="sales-table">
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Price (ETH)</th>
                <th>Seller</th>
                <th>Buyer</th>
                <th>Wash Score</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sale, idx) in salesData.sales" :key="idx" :class="{ 'wash-trade': sale.isWashTrade }">
                <td>#{{ sale.tokenId }}</td>
                <td>{{ sale.price }}</td>
                <td class="address">{{ shortenAddress(sale.seller) }}</td>
                <td class="address">{{ shortenAddress(sale.buyer) }}</td>
                <td>
                  <div class="score-bar">
                    <div class="score-fill" :style="{ width: sale.washTradeScore + '%' }" :class="getScoreClass(sale.washTradeScore)"></div>
                    <span class="score-text">{{ sale.washTradeScore }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="sale.isWashTrade ? 'suspicious' : 'legitimate'">
                    {{ sale.isWashTrade ? '🚨 Suspicious' : '✅ Legitimate' }}
                  </span>
                </td>
                <td>{{ sale.timeAgo }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Suspicious Accounts -->
    <div class="accounts-section" v-if="suspiciousAccounts && suspiciousAccounts.suspiciousAccounts && suspiciousAccounts.suspiciousAccounts.length > 0">
      <div class="section-card">
        <h2>👤 Suspicious Accounts</h2>
        <div class="accounts-grid">
          <div 
            v-for="(account, idx) in suspiciousAccounts.suspiciousAccounts.slice(0, 10)" 
            :key="idx" 
            class="account-card"
          >
            <div class="account-address">{{ shortenAddress(account.address) }}</div>
            <div class="account-stats">
              <span class="account-score" :class="getScoreClass(account.avgScore)">
                Risk Score: {{ account.avgScore }}
              </span>
              <span class="account-trades">{{ account.trades }} trades</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk Score Gauge -->
    <div class="risk-section" v-if="riskScore">
      <div class="section-card">
        <h2>🎯 Risk Assessment</h2>
        <div class="risk-gauge">
          <div class="gauge-container">
            <div class="gauge-label">Risk Score</div>
            <div class="gauge-value" :class="getRiskClass(riskScore.riskLevel)">
              {{ riskScore.riskScore }}/100
            </div>
            <div class="gauge-level">{{ riskScore.riskLevel }}</div>
            <div class="gauge-confidence">Confidence: {{ riskScore.confidence }}</div>
          </div>
          <div class="risk-factors">
            <div class="factor">
              <span class="factor-label">Wash Trade Percentage</span>
              <span class="factor-value">{{ riskScore.factors.washTradePercentage }}%</span>
            </div>
            <div class="factor">
              <span class="factor-label">Avg Wash Score</span>
              <span class="factor-value">{{ riskScore.factors.avgWashTradeScore }}</span>
            </div>
            <div class="factor">
              <span class="factor-label">Sample Size</span>
              <span class="factor-value">{{ riskScore.factors.sampleSize }} sales</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Supported Patterns Info -->
    <div class="patterns-section">
      <div class="section-card">
        <h2>📚 Supported Wash Trade Patterns</h2>
        <div class="patterns-info">
          <div class="pattern-item" v-for="pattern in patterns" :key="pattern.name">
            <div class="pattern-name">
              <span class="pattern-badge" :class="pattern.severity">{{ pattern.severity }}</span>
              {{ pattern.name.replace(/_/g, ' ') }}
            </div>
            <div class="pattern-desc">{{ pattern.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-overlay" v-if="loading">
      <div class="spinner"></div>
      <p>Analyzing NFT collection for wash trading patterns...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get } from '@/utils/http';

const searchAddress = ref('0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB');
const selectedChain = ref('ethereum');
const loading = ref(false);
const analysisResult = ref<any>(null);
const salesData = ref<any>(null);
const suspiciousAccounts = ref<any>(null);
const riskScore = ref<any>(null);
const patterns = ref<any[]>([]);

const analyzeCollection = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  try {
    // Get analysis
    const result = await get(`/nft-wash-trade/analyze/${searchAddress.value}?chain=${selectedChain.value}`);
    analysisResult.value = result;
    
    // Get sales data
    const sales = await get(`/nft-wash-trade/sales/${searchAddress.value}?limit=20`);
    salesData.value = sales;
    
    // Get suspicious accounts
    const accounts = await get(`/nft-wash-trade/suspicious-accounts/${searchAddress.value}`);
    suspiciousAccounts.value = accounts;
    
    // Get risk score
    const risk = await get(`/nft-wash-trade/risk-score/${searchAddress.value}`);
    riskScore.value = risk;
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    loading.value = false;
  }
};

const fetchPatterns = async () => {
  try {
    const result = await get('/nft-wash-trade/patterns');
    patterns.value = result.patterns;
  } catch (error) {
    console.error('Failed to fetch patterns:', error);
  }
};

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getRiskClass = (level: string) => {
  const map: Record<string, string> = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  };
  return map[level] || '';
};

const getScoreClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

onMounted(() => {
  fetchPatterns();
  analyzeCollection();
});
</script>

<style scoped>
.nft-wash-trade-detector {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.address-input {
  flex: 1;
  min-width: 300px;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.chain-select {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.analyze-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.warning {
  border-left: 4px solid #ff9800;
}

.stat-card.critical {
  border-left: 4px solid #f44336;
  background: #fff5f5;
}

.stat-icon {
  font-size: 32px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-card h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
}

.metric-value.warning {
  color: #f44336;
}

.recommendations ul {
  list-style: none;
  padding: 0;
}

.recommendations li {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.pattern-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pattern-tag {
  padding: 6px 12px;
  background: #e3f2fd;
  border-radius: 16px;
  font-size: 12px;
  color: #1565c0;
}

.table-container {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th,
.sales-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.sales-table th {
  font-weight: 600;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

.sales-table tr.wash-trade {
  background: #fff5f5;
}

.address {
  font-family: monospace;
  font-size: 12px;
}

.score-bar {
  width: 80px;
  height: 20px;
  background: #eee;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}

.score-fill.high {
  background: linear-gradient(90deg, #f44336, #ff5722);
}

.score-fill.medium {
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

.score-fill.low {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.suspicious {
  background: #ffebee;
  color: #c62828;
}

.status-badge.legitimate {
  background: #e8f5e9;
  color: #2e7d32;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.account-card {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.account-address {
  font-family: monospace;
  font-size: 13px;
  margin-bottom: 8px;
}

.account-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.account-score.high {
  color: #f44336;
}

.account-score.medium {
  color: #ff9800;
}

.account-score.low {
  color: #4caf50;
}

.risk-gauge {
  display: flex;
  gap: 32px;
  align-items: center;
}

.gauge-container {
  text-align: center;
  min-width: 150px;
}

.gauge-value {
  font-size: 36px;
  font-weight: 700;
}

.gauge-value.critical {
  color: #f44336;
}

.gauge-value.high {
  color: #ff5722;
}

.gauge-value.medium {
  color: #ff9800;
}

.gauge-value.low {
  color: #4caf50;
}

.gauge-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.gauge-level {
  font-size: 18px;
  font-weight: 600;
  margin-top: 8px;
}

.gauge-confidence {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.risk-factors {
  flex: 1;
}

.factor {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.factor-label {
  color: #666;
}

.factor-value {
  font-weight: 600;
}

.patterns-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pattern-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.pattern-name {
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pattern-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
}

.pattern-badge.HIGH {
  background: #ffebee;
  color: #c62828;
}

.pattern-badge.MEDIUM {
  background: #fff3e0;
  color: #e65100;
}

.pattern-badge.LOW {
  background: #e8f5e9;
  color: #2e7d32;
}

.pattern-desc {
  font-size: 13px;
  color: #666;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 16px;
  color: #666;
}
</style>
