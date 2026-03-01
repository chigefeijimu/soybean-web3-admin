<template>
  <div class="wallet-analyzer">
    <div class="header-section">
      <h2>🔍 Wallet Transaction Pattern Analyzer</h2>
      <p class="subtitle">Analyze wallet behavior patterns, detect bot/human, identify trading patterns</p>
    </div>

    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter Ethereum address (0x...)"
          @keyup.enter="analyzeWallet"
        />
        <button @click="analyzeWallet" :disabled="loading">
          {{ loading ? 'Analyzing...' : 'Analyze Wallet' }}
        </button>
      </div>
      <div class="quick-addresses">
        <span class="label">Quick:</span>
        <button 
          v-for="addr in quickAddresses" 
          :key="addr.label"
          @click="searchAddress = addr.address; analyzeWallet()"
          class="quick-btn"
        >
          {{ addr.label }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="analysis" class="analysis-results">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-label">Total Transactions</div>
          <div class="card-value">{{ analysis.summary.totalTransactions }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Wallet Age</div>
          <div class="card-value">{{ analysis.summary.walletAge }} days</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Total Volume</div>
          <div class="card-value">{{ analysis.summary.totalVolume }} ETH</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Unique Tokens</div>
          <div class="card-value">{{ analysis.summary.uniqueTokens }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Unique Contracts</div>
          <div class="card-value">{{ analysis.summary.uniqueContracts }}</div>
        </div>
        <div class="summary-card classification">
          <div class="card-label">Classification</div>
          <div class="card-value type-badge" :class="analysis.classification.type">
            {{ analysis.classification.type.toUpperCase() }}
          </div>
          <div class="confidence">Confidence: {{ (analysis.classification.confidence * 100).toFixed(0) }}%</div>
        </div>
      </div>

      <!-- Risk Score -->
      <div class="risk-section">
        <h3>🛡️ Risk Assessment</h3>
        <div class="risk-meter">
          <div class="risk-bar">
            <div 
              class="risk-fill" 
              :style="{ width: analysis.risk.score + '%' }"
              :class="getRiskClass(analysis.risk.score)"
            ></div>
          </div>
          <div class="risk-score">{{ analysis.risk.score }}/100</div>
        </div>
        <div class="risk-factors" v-if="analysis.risk.factors.length">
          <h4>Factors:</h4>
          <ul>
            <li v-for="factor in analysis.risk.factors" :key="factor">{{ factor }}</li>
          </ul>
        </div>
        <div class="risk-flags" v-if="analysis.risk.flags.length">
          <span v-for="flag in analysis.risk.flags" :key="flag" class="flag-badge">
            {{ flag }}
          </span>
        </div>
      </div>

      <!-- Patterns -->
      <div class="patterns-section">
        <h3>📊 Transaction Patterns</h3>
        
        <div class="pattern-group">
          <h4>🔥 Trading Activity</h4>
          <div class="pattern-grid">
            <div class="pattern-item">
              <span class="pattern-label">Swap Count</span>
              <span class="pattern-value">{{ analysis.patterns.trading.swapCount }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Avg Swap Interval</span>
              <span class="pattern-value">{{ analysis.patterns.trading.avgSwapInterval }} min</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Preferred DEX</span>
              <span class="pattern-value">{{ analysis.patterns.trading.preferredDex.join(', ') || 'N/A' }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Tokens Traded</span>
              <span class="pattern-value">{{ analysis.patterns.trading.tokensTraded.length }}</span>
            </div>
          </div>
        </div>

        <div class="pattern-group">
          <h4>🧪 DeFi Interactions</h4>
          <div class="pattern-grid">
            <div class="pattern-item">
              <span class="pattern-label">Protocols Used</span>
              <span class="pattern-value">{{ analysis.patterns.defi.protocols.join(', ') || 'None' }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Active Positions</span>
              <span class="pattern-value">{{ analysis.patterns.defi.positions }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Total Deposited</span>
              <span class="pattern-value">{{ analysis.patterns.defi.totalDeposited }} ETH</span>
            </div>
          </div>
        </div>

        <div class="pattern-group" v-if="analysis.patterns.nft.totalNfts > 0">
          <h4>🖼️ NFT Activity</h4>
          <div class="pattern-grid">
            <div class="pattern-item">
              <span class="pattern-label">Collections</span>
              <span class="pattern-value">{{ analysis.patterns.nft.collections.join(', ') }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Total NFTs</span>
              <span class="pattern-value">{{ analysis.patterns.nft.totalNfts }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Est. Floor Value</span>
              <span class="pattern-value">{{ analysis.patterns.nft.floorValue }} ETH</span>
            </div>
          </div>
        </div>

        <div class="pattern-group">
          <h4>⏰ Timing Patterns</h4>
          <div class="pattern-grid">
            <div class="pattern-item">
              <span class="pattern-label">Avg Tx/Day</span>
              <span class="pattern-value">{{ analysis.patterns.timing.avgTxPerDay }}</span>
            </div>
            <div class="pattern-item">
              <span class="pattern-label">Active Hours</span>
              <span class="pattern-value">{{ analysis.patterns.timing.activeHours.slice(0, 5).join(', ') }}{{ analysis.patterns.timing.activeHours.length > 5 ? '...' : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Labels -->
      <div class="labels-section" v-if="analysis.classification.labels.length">
        <h3>🏷️ Labels</h3>
        <div class="labels-list">
          <span v-for="label in analysis.classification.labels" :key="label" class="label-badge">
            {{ label }}
          </span>
        </div>
      </div>

      <!-- Insights -->
      <div class="insights-section" v-if="analysis.insights.length">
        <h3>💡 Insights</h3>
        <ul class="insights-list">
          <li v-for="(insight, idx) in analysis.insights" :key="idx">{{ insight }}</li>
        </ul>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section" v-if="analysis.recommendations.length">
        <h3>✅ Recommendations</h3>
        <ul class="recommendations-list">
          <li v-for="(rec, idx) in analysis.recommendations" :key="idx">{{ rec }}</li>
        </ul>
      </div>
    </div>

    <div v-else-if="!loading && !error" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>Enter a wallet address to analyze</h3>
      <p>The analyzer will examine transaction patterns, classify the wallet type, and provide risk assessment</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { makeRequest } = useWeb3();

const searchAddress = ref('');
const loading = ref(false);
const error = ref('');
const analysis = ref<any>(null);

const quickAddresses = [
  { label: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { label: 'CZ', address: '0x28C6c06298d514Db089934071355E5743bf21d61' },
];

async function analyzeWallet() {
  if (!searchAddress.value) {
    error.value = 'Please enter a wallet address';
    return;
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(searchAddress.value)) {
    error.value = 'Invalid Ethereum address format';
    return;
  }

  loading.value = true;
  error.value = '';
  analysis.value = null;

  try {
    const response = await makeRequest('/api/web3/wallet-analyzer/analyze', {
      method: 'GET',
      params: { address: searchAddress.value }
    });
    
    analysis.value = response;
  } catch (e: any) {
    error.value = e.message || 'Failed to analyze wallet';
  } finally {
    loading.value = false;
  }
}

function getRiskClass(score: number): string {
  if (score >= 70) return 'safe';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'critical';
}
</script>

<style scoped>
.wallet-analyzer {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.search-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
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
  font-weight: 600;
}

.search-box button:disabled {
  background: #999;
  cursor: not-allowed;
}

.quick-addresses {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-addresses .label {
  color: #666;
  font-size: 14px;
}

.quick-btn {
  padding: 4px 12px;
  background: #e5e7eb;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.quick-btn:hover {
  background: #d1d5db;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.summary-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.summary-card.classification {
  background: #eef2ff;
}

.card-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.type-badge.bot { background: #fee2e2; color: #dc2626; }
.type-badge.human { background: #dcfce7; color: #16a34a; }
.type-badge.whale { background: #dbeafe; color: #2563eb; }
.type-badge.defi-protocol { background: #f3e8ff; color: #9333ea; }
.type-badge.exchange { background: #ffedd5; color: #ea580c; }

.confidence {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.risk-section, .patterns-section, .labels-section, .insights-section, .recommendations-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.risk-section h3, .patterns-section h3, .labels-section h3, .insights-section h3, .recommendations-section h3 {
  margin: 0 0 16px 0;
}

.risk-meter {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.risk-bar {
  flex: 1;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.risk-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.risk-fill.safe { background: #22c55e; }
.risk-fill.medium { background: #eab308; }
.risk-fill.low { background: #f97316; }
.risk-fill.critical { background: #dc2626; }

.risk-score {
  font-weight: 700;
  min-width: 60px;
}

.risk-factors h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.risk-factors ul {
  margin: 0;
  padding-left: 20px;
}

.risk-factors li {
  font-size: 14px;
  margin-bottom: 4px;
}

.risk-flags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.flag-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.pattern-group {
  margin-bottom: 20px;
}

.pattern-group h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #374151;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.pattern-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pattern-label {
  font-size: 12px;
  color: #666;
}

.pattern-value {
  font-weight: 600;
}

.labels-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.label-badge {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.insights-list, .recommendations-list {
  margin: 0;
  padding-left: 20px;
}

.insights-list li, .recommendations-list li {
  margin-bottom: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
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
}
</style>
