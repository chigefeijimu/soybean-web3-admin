<template>
  <div class="nft-wash-trade-detector">
    <div class="header">
      <h2>🧼 NFT Wash Trade Detector</h2>
      <p>Detect wash trading and artificial volume in NFT collections</p>
    </div>

    <!-- Collection Input -->
    <div class="form-section">
      <label>NFT Collection Address</label>
      <div class="input-group">
        <input 
          v-model="collectionAddress" 
          placeholder="0x..."
          @keyup.enter="analyzeCollection"
        />
        <select v-model="selectedChain">
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="base">Base</option>
        </select>
        <button @click="analyzeCollection" :disabled="loading" class="analyze-btn">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
      <div class="quick-select">
        <span>Quick Select:</span>
        <button @click="setCollection('0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB')">CryptoPunks</button>
        <button @click="setCollection('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D')">BAYC</button>
        <button @click="setCollection('0x23581767a106ae21c074b2276D25e5C3e136a68b')">Moonbirds</button>
      </div>
    </div>

    <!-- Analysis Results -->
    <div v-if="analysisResult" class="results-section">
      <!-- Risk Score Card -->
      <div class="risk-card" :class="analysisResult.riskLevel.toLowerCase()">
        <div class="risk-score">
          <div class="score-circle">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="circle"
                :stroke-dasharray="`${riskScore}, 100`"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div class="score-value">{{ riskScore }}</div>
          </div>
          <div class="risk-label">Risk Level: {{ analysisResult.riskLevel }}</div>
        </div>
        <div class="risk-stats">
          <div class="stat">
            <span class="stat-value">{{ analysisResult.totalSales }}</span>
            <span class="stat-label">Total Sales</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ analysisResult.washTrades }}</span>
            <span class="stat-label">Wash Trades</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ analysisResult.washTradePercentage }}%</span>
            <span class="stat-label">Wash Trade %</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ analysisResult.washVolumePercentage }}%</span>
            <span class="stat-label">Wash Volume %</span>
          </div>
        </div>
      </div>

      <!-- Volume Stats -->
      <div class="volume-stats">
        <div class="volume-card">
          <span class="volume-label">Total Volume</span>
          <span class="volume-value">{{ analysisResult.totalVolume }} ETH</span>
        </div>
        <div class="volume-card wash">
          <span class="volume-label">Suspicious Volume</span>
          <span class="volume-value">{{ analysisResult.washTradeVolume }} ETH</span>
        </div>
      </div>

      <!-- Detected Patterns -->
      <div v-if="analysisResult.detectedPatterns?.length" class="patterns-section">
        <h3>🚨 Detected Patterns</h3>
        <div class="pattern-tags">
          <span v-for="pattern in analysisResult.detectedPatterns" :key="pattern" class="pattern-tag">
            {{ pattern }}
          </span>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="analysisResult.recommendations?.length" class="recommendations-section">
        <h3>💡 Recommendations</h3>
        <ul>
          <li v-for="(rec, index) in analysisResult.recommendations" :key="index">{{ rec }}</li>
        </ul>
      </div>

      <!-- Sales History -->
      <div class="sales-section">
        <div class="section-header">
          <h3>📊 Recent Sales with Wash Trade Analysis</h3>
          <button @click="loadSales" :disabled="loadingSales" class="refresh-btn">
            {{ loadingSales ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        <div class="sales-table">
          <table>
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Price (ETH)</th>
                <th>Wash Score</th>
                <th>Status</th>
                <th>Patterns</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in sales" :key="sale.tokenId" :class="{ 'wash-trade': sale.isWashTrade }">
                <td>#{{ sale.tokenId }}</td>
                <td>{{ sale.price }}</td>
                <td>
                  <div class="score-bar">
                    <div class="score-fill" :style="{ width: sale.washTradeScore + '%' }" :class="getScoreClass(sale.washTradeScore)"></div>
                    <span>{{ sale.washTradeScore }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', sale.isWashTrade ? 'suspicious' : 'legitimate']">
                    {{ sale.isWashTrade ? '⚠️ Suspicious' : '✓ Legitimate' }}
                  </span>
                </td>
                <td>
                  <span v-if="sale.patterns?.length" class="pattern-dots" :title="sale.patterns.join(', ')">
                    {{ sale.patterns.length }} patterns
                  </span>
                  <span v-else class="no-patterns">-</span>
                </td>
                <td>{{ sale.timeAgo }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Suspicious Accounts -->
      <div class="accounts-section">
        <h3>👤 Suspicious Accounts</h3>
        <button @click="loadSuspiciousAccounts" :disabled="loadingAccounts" class="refresh-btn">
          {{ loadingAccounts ? 'Loading...' : 'Load Accounts' }}
        </button>
        <div v-if="suspiciousAccounts.length" class="accounts-list">
          <div v-for="account in suspiciousAccounts" :key="account.address" class="account-card">
            <div class="account-address">{{ formatAddress(account.address) }}</div>
            <div class="account-stats">
              <span>Trades: {{ account.trades }}</span>
              <span>Avg Score: {{ account.avgScore }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Patterns Reference -->
    <div class="patterns-reference">
      <h3>📚 Wash Trading Patterns</h3>
      <div class="pattern-cards">
        <div class="pattern-card">
          <div class="pattern-name">Same Buyer & Seller</div>
          <div class="pattern-desc">Same address appears as both buyer and seller</div>
          <div class="pattern-severity high">HIGH Severity</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-name">Circular Transfer</div>
          <div class="pattern-desc">Funds circulate between known addresses</div>
          <div class="pattern-severity high">HIGH Severity</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-name">Price Manipulation</div>
          <div class="pattern-desc">Unusual price patterns detected</div>
          <div class="pattern-severity medium">MEDIUM Severity</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-name">Rapid Flip</div>
          <div class="pattern-desc">Same NFT sold within short time period</div>
          <div class="pattern-severity medium">MEDIUM Severity</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-name">Wash Loop</div>
          <div class="pattern-desc">Repeated buying and selling between accounts</div>
          <div class="pattern-severity high">HIGH Severity</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-name">Volume Spike</div>
          <div class="pattern-desc">Unusual trading volume spike</div>
          <div class="pattern-severity low">LOW Severity</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const collectionAddress = ref('');
const selectedChain = ref('ethereum');
const loading = ref(false);
const loadingSales = ref(false);
const loadingAccounts = ref(false);
const analysisResult = ref<any>(null);
const sales = ref<any[]>([]);
const suspiciousAccounts = ref<any[]>([]);

const riskScore = computed(() => {
  if (!analysisResult.value) return 0;
  const { washTrades, totalSales } = analysisResult.value;
  const percentage = totalSales > 0 ? washTrades / totalSales : 0;
  return Math.min(100, Math.round(percentage * 100 + 40));
});

const setCollection = (address: string) => {
  collectionAddress.value = address;
  analyzeCollection();
};

const analyzeCollection = async () => {
  if (!collectionAddress.value) return;
  
  loading.value = true;
  try {
    // Simulated API call - replace with actual API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Sample response
    const isWashTrade = collectionAddress.value.toLowerCase() === '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb' || 
                       collectionAddress.value.toLowerCase() === '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
    
    if (isWashTrade) {
      analysisResult.value = {
        collection: collectionAddress.value,
        chain: selectedChain.value,
        totalSales: 156,
        washTrades: 45,
        washTradePercentage: '28.85',
        totalVolume: '2,340.50',
        washTradeVolume: '892.30',
        washVolumePercentage: '38.12',
        riskLevel: 'HIGH',
        detectedPatterns: ['same_buyer_seller: 23', 'circular_transfer: 15', 'price_manipulation: 7'],
        recommendations: [
          'HIGH RISK: Significant wash trading detected. Exercise extreme caution.',
          'Consider avoiding this collection until more legitimate trading activity is observed.',
          'Monitor this collection regularly for changes in trading patterns.',
        ],
        lastUpdated: new Date().toISOString(),
      };
      
      sales.value = [
        { tokenId: '78', price: 45.5, washTradeScore: 92, isWashTrade: true, patterns: ['same_buyer_seller', 'price_manipulation'], timeAgo: '1h ago' },
        { tokenId: '234', price: 46.2, washTradeScore: 88, isWashTrade: true, patterns: ['circular_transfer', 'rapid_flip'], timeAgo: '30m ago' },
        { tokenId: '456', price: 44.8, washTradeScore: 35, isWashTrade: false, patterns: [], timeAgo: '2h ago' },
        { tokenId: '789', price: 45.0, washTradeScore: 75, isWashTrade: true, patterns: ['wash_loop'], timeAgo: '3h ago' },
        { tokenId: '123', price: 43.5, washTradeScore: 28, isWashTrade: false, patterns: [], timeAgo: '5h ago' },
      ];
      
      suspiciousAccounts.value = [
        { address: '0x1234567890abcdef1234567890abcdef12345678', trades: 12, avgScore: '89.5' },
        { address: '0xabcdef1234567890abcdef1234567890abcdef12', trades: 8, avgScore: '85.2' },
        { address: '0x9876543210abcdef9876543210abcdef98765432', trades: 5, avgScore: '72.8' },
      ];
    } else {
      analysisResult.value = {
        collection: collectionAddress.value,
        chain: selectedChain.value,
        totalSales: 89,
        washTrades: 8,
        washTradePercentage: '8.99',
        totalVolume: '1,250.00',
        washTradeVolume: '125.00',
        washVolumePercentage: '10.00',
        riskLevel: 'LOW',
        detectedPatterns: [],
        recommendations: [
          'LOW RISK: No significant wash trading detected.',
          'This collection appears to have legitimate trading activity.',
        ],
        lastUpdated: new Date().toISOString(),
      };
      
      sales.value = [
        { tokenId: '55', price: 12.5, washTradeScore: 15, isWashTrade: false, patterns: [], timeAgo: '1h ago' },
        { tokenId: '89', price: 13.0, washTradeScore: 22, isWashTrade: false, patterns: [], timeAgo: '2h ago' },
        { tokenId: '134', price: 11.8, washTradeScore: 18, isWashTrade: false, patterns: [], timeAgo: '4h ago' },
      ];
      
      suspiciousAccounts.value = [];
    }
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    loading.value = false;
  }
};

const loadSales = async () => {
  loadingSales.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  loadingSales.value = false;
};

const loadSuspiciousAccounts = async () => {
  loadingAccounts.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  loadingAccounts.value = false;
};

const getScoreClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
</script>

<style scoped>
.nft-wash-trade-detector {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.form-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.input-group select {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  min-width: 120px;
}

.analyze-btn {
  padding: 10px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #4338ca;
}

.analyze-btn:disabled {
  background: #999;
  cursor: not-allowed;
}

.quick-select {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-select span {
  font-size: 13px;
  color: #666;
}

.quick-select button {
  padding: 4px 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-select button:hover {
  background: #e5e7eb;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.risk-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  gap: 32px;
  align-items: center;
}

.risk-card.high {
  border-left: 4px solid #ef4444;
}

.risk-card.medium {
  border-left: 4px solid #f59e0b;
}

.risk-card.low {
  border-left: 4px solid #22c55e;
}

.risk-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.score-circle {
  position: relative;
  width: 100px;
  height: 100px;
}

.circular-chart {
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
}

.risk-card.high .circle { stroke: #ef4444; }
.risk-card.medium .circle { stroke: #f59e0b; }
.risk-card.low .circle { stroke: #22c55e; }

@keyframes progress {
  0% { stroke-dasharray: 0, 100; }
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: bold;
}

.risk-label {
  margin-top: 8px;
  font-weight: 600;
}

.risk-card.high .risk-label { color: #ef4444; }
.risk-card.medium .risk-label { color: #f59e0b; }
.risk-card.low .risk-label { color: #22c55e; }

.risk-stats {
  display: flex;
  gap: 32px;
  flex: 1;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.volume-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.volume-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.volume-card.wash {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.volume-label {
  font-size: 13px;
  color: #666;
}

.volume-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.volume-card.wash .volume-value {
  color: #ef4444;
}

.patterns-section, .recommendations-section, .sales-section, .accounts-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.patterns-section h3, .recommendations-section h3, .sales-section h3, .accounts-section h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.pattern-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pattern-tag {
  padding: 4px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 16px;
  font-size: 13px;
}

.recommendations-section ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations-section li {
  margin-bottom: 8px;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.refresh-btn {
  padding: 6px 14px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.sales-table {
  overflow-x: auto;
}

.sales-table table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th, .sales-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.sales-table th {
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.sales-table tr.wash-trade {
  background: #fef2f2;
}

.score-bar {
  position: relative;
  height: 20px;
  background: #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
}

.score-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.3s;
}

.score-fill.high { background: #ef4444; }
.score-fill.medium { background: #f59e0b; }
.score-fill.low { background: #22c55e; }

.score-bar span {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
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
  background: #fef2f2;
  color: #dc2626;
}

.status-badge.legitimate {
  background: #f0fdf4;
  color: #16a34a;
}

.pattern-dots {
  color: #f59e0b;
  cursor: help;
}

.no-patterns {
  color: #999;
}

.accounts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.account-card {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
}

.account-address {
  font-family: monospace;
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.account-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.patterns-reference {
  margin-top: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.patterns-reference h3 {
  margin: 0 0 16px 0;
}

.pattern-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.pattern-card {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid #ccc;
}

.pattern-card:nth-child(1), .pattern-card:nth-child(2), .pattern-card:nth-child(5) {
  border-left-color: #ef4444;
}

.pattern-card:nth-child(3), .pattern-card:nth-child(4) {
  border-left-color: #f59e0b;
}

.pattern-card:nth-child(6) {
  border-left-color: #22c55e;
}

.pattern-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.pattern-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.pattern-severity {
  font-size: 12px;
  font-weight: 500;
}

.pattern-severity.high { color: #ef4444; }
.pattern-severity.medium { color: #f59e0b; }
.pattern-severity.low { color: #22c55e; }
</style>
