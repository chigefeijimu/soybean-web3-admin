<template>
  <div class="token-impersonator-scanner">
    <div class="header">
      <h2>🎭 Token Impersonator Scanner</h2>
      <p>Detect fake tokens that impersonate popular cryptocurrencies</p>
    </div>

    <!-- Scan Options -->
    <div class="scan-options">
      <div class="option-card" :class="{ active: scanMode === 'token' }" @click="scanMode = 'token'">
        <span class="icon">🔍</span>
        <h3>Scan Token</h3>
        <p>Check a specific token contract for impersonation risks</p>
      </div>
      <div class="option-card" :class="{ active: scanMode === 'wallet' }" @click="scanMode = 'wallet'">
        <span class="icon">💼</span>
        <h3>Scan Wallet</h3>
        <p>Check all tokens in a wallet for impersonator tokens</p>
      </div>
      <div class="option-card" :class="{ active: scanMode === 'search' }" @click="scanMode = 'search'">
        <span class="icon">📋</span>
        <h3>Check Similar</h3>
        <p>Search for tokens with similar names</p>
      </div>
    </div>

    <!-- Input Form -->
    <div class="input-section">
      <div v-if="scanMode === 'token'" class="form-group">
        <label>Token Contract Address</label>
        <div class="input-row">
          <input 
            v-model="tokenAddress" 
            placeholder="0x..."
            @keyup.enter="scanToken"
          />
          <select v-model="selectedChain">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
          <button @click="scanToken" :disabled="loading">
            {{ loading ? 'Scanning...' : 'Scan Token' }}
          </button>
        </div>
      </div>

      <div v-else-if="scanMode === 'wallet'" class="form-group">
        <label>Wallet Address</label>
        <div class="input-row">
          <input 
            v-model="walletAddress" 
            placeholder="0x..."
            @keyup.enter="scanWallet"
          />
          <select v-model="selectedChain">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
          <button @click="scanWallet" :disabled="loading">
            {{ loading ? 'Scanning...' : 'Scan Wallet' }}
          </button>
        </div>
      </div>

      <div v-else class="form-group">
        <label>Token Name to Check</label>
        <div class="input-row">
          <input 
            v-model="searchName" 
            placeholder="e.g., Bitcoin, Ethereum..."
            @keyup.enter="checkSimilar"
          />
          <select v-model="selectedChain">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
          <button @click="checkSimilar" :disabled="loading">
            {{ loading ? 'Searching...' : 'Search' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result" class="results">
      <!-- Token Scan Results -->
      <div v-if="scanMode === 'token' && result.analysis" class="result-card">
        <div class="risk-badge" :class="result.analysis.riskLevel">
          <span class="score">{{ result.analysis.riskScore }}</span>
          <span class="level">{{ result.analysis.riskLevel.toUpperCase() }} RISK</span>
        </div>
        
        <div class="token-info">
          <h3>{{ result.token?.name || 'Unknown Token' }}</h3>
          <p class="symbol">{{ result.token?.symbol || '???' }}</p>
          <p class="address">{{ tokenAddress }}</p>
        </div>

        <!-- Risk Factors -->
        <div v-if="result.analysis.risks.length > 0" class="risk-factors">
          <h4>⚠️ Risk Factors</h4>
          <ul>
            <li v-for="(risk, idx) in result.analysis.risks" :key="idx">
              {{ risk }}
            </li>
          </ul>
        </div>

        <!-- Recommendations -->
        <div v-if="result.analysis.recommendations" class="recommendations">
          <h4>📋 Recommendations</h4>
          <ul>
            <li v-for="(rec, idx) in result.analysis.recommendations" :key="idx">
              {{ rec }}
            </li>
          </ul>
        </div>

        <!-- DexScreener Data -->
        <div v-if="result.dexScreener?.pair" class="dex-data">
          <h4>📊 Market Data</h4>
          <div class="data-grid">
            <div class="data-item">
              <span class="label">Liquidity</span>
              <span class="value">${{ formatNumber(result.dexScreener.pair.liquidity?.usd || 0) }}</span>
            </div>
            <div class="data-item">
              <span class="label">Volume 24h</span>
              <span class="value">${{ formatNumber(result.dexScreener.pair.volume?.h24 || 0) }}</span>
            </div>
            <div class="data-item">
              <span class="label">Price</span>
              <span class="value">${{ result.dexScreener.pair.priceUsd || 'N/A' }}</span>
            </div>
            <div class="data-item">
              <span class="label">Buys/Sells 24h</span>
              <span class="value">{{ result.dexScreener.pair.txns?.h24?.buys || 0 }} / {{ result.dexScreener.pair.txns?.h24?.sells || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet Scan Results -->
      <div v-else-if="scanMode === 'wallet' && result.summary" class="result-card">
        <div class="wallet-summary">
          <h3>📊 Wallet Scan Summary</h3>
          <div class="summary-stats">
            <div class="stat safe">
              <span class="count">{{ result.summary.safe }}</span>
              <span class="label">Safe</span>
            </div>
            <div class="stat warning">
              <span class="count">{{ result.summary.warning }}</span>
              <span class="label">Warning</span>
            </div>
            <div class="stat danger">
              <span class="count">{{ result.summary.dangerous }}</span>
              <span class="label">Dangerous</span>
            </div>
          </div>
        </div>

        <!-- High Risk Tokens -->
        <div v-if="result.highRiskTokens?.length > 0" class="high-risk-section">
          <h4>🚨 High Risk Tokens Found</h4>
          <div class="token-list">
            <div v-for="item in result.highRiskTokens" :key="item.token.address" class="token-item danger">
              <div class="token-details">
                <span class="name">{{ item.token.name || item.token.symbol }}</span>
                <span class="address">{{ shortenAddress(item.token.address) }}</span>
              </div>
              <div class="risk-score">
                {{ item.analysis?.riskScore || 'N/A' }}
              </div>
            </div>
          </div>
        </div>

        <!-- All Results -->
        <div v-if="result.scannedResults" class="all-results">
          <h4>All Scanned Tokens</h4>
          <div class="token-list">
            <div 
              v-for="item in result.scannedResults.slice(0, 20)" 
              :key="item.token.address" 
              class="token-item"
              :class="item.analysis?.riskLevel || 'unknown'"
            >
              <div class="token-details">
                <span class="name">{{ item.token.name || item.token.symbol }}</span>
                <span class="address">{{ shortenAddress(item.token.address) }}</span>
              </div>
              <div class="risk-score" :class="item.analysis?.riskLevel">
                {{ item.analysis?.riskScore ?? 'N/A' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Similar Tokens Search Results -->
      <div v-else-if="scanMode === 'search' && result.results" class="result-card">
        <h3>� similar Tokens for "{{ result.query }}"</h3>
        <div class="similar-tokens">
          <div v-for="token in result.results.slice(0, 15)" :key="token.pairAddress" class="similar-token">
            <div class="token-header">
              <span class="token-name">{{ token.baseToken?.name }}</span>
              <span class="token-symbol">{{ token.baseToken?.symbol }}</span>
            </div>
            <div class="token-price">
              <span class="price">${{ token.priceUsd || 'N/A' }}</span>
              <span class="change" :class="token.priceChange?.h24 >= 0 ? 'up' : 'down'">
                {{ token.priceChange?.h24 >= 0 ? '+' : '' }}{{ token.priceChange?.h24?.toFixed(2) || 0 }}%
              </span>
            </div>
            <div class="token-pair">
              <span class="pair">{{ token.dexId }}: {{ token.pairAddress?.slice(0, 6) }}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Tokens Reference -->
    <div class="popular-tokens-section">
      <h3>🔐 Popular Tokens to Watch Out For</h3>
      <p class="subtitle">Scammers often create fake versions of these tokens</p>
      <div class="popular-grid">
        <div v-for="token in popularTokens" :key="token.symbol" class="popular-token">
          <span class="symbol">{{ token.symbol }}</span>
          <span class="name">{{ token.name }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Scanning for impersonator tokens...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const scanMode = ref<'token' | 'wallet' | 'search'>('token');
const tokenAddress = ref('');
const walletAddress = ref('');
const searchName = ref('');
const selectedChain = ref('1');
const loading = ref(false);
const result = ref<any>(null);

const chains = [
  { id: '1', name: 'Ethereum' },
  { id: '56', name: 'BSC' },
  { id: '137', name: 'Polygon' },
  { id: '42161', name: 'Arbitrum' },
  { id: '10', name: 'Optimism' },
];

const popularTokens = ref<any[]>([]);

const scanToken = async () => {
  if (!tokenAddress.value) return;
  
  loading.value = true;
  result.value = null;
  
  try {
    const response = await fetch(
      `/api/web3/token-impersonator/scan-token?address=${tokenAddress.value}&chain=${selectedChain.value}`
    );
    const data = await response.json();
    result.value = data;
  } catch (error) {
    console.error('Scan error:', error);
    result.value = { success: false, error: 'Failed to scan token' };
  }
  
  loading.value = false;
};

const scanWallet = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  result.value = null;
  
  try {
    const response = await fetch(
      `/api/web3/token-impersonator/scan-wallet?wallet=${walletAddress.value}&chain=${selectedChain.value}`
    );
    const data = await response.json();
    result.value = data;
  } catch (error) {
    console.error('Scan error:', error);
    result.value = { success: false, error: 'Failed to scan wallet' };
  }
  
  loading.value = false;
};

const checkSimilar = async () => {
  if (!searchName.value) return;
  
  loading.value = true;
  result.value = null;
  
  try {
    const response = await fetch(
      `/api/web3/token-impersonator/check-similar?name=${encodeURIComponent(searchName.value)}&chain=${selectedChain.value}`
    );
    const data = await response.json();
    result.value = data;
  } catch (error) {
    console.error('Search error:', error);
    result.value = { success: false, error: 'Failed to search' };
  }
  
  loading.value = false;
};

const formatNumber = (num: number) => {
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const shortenAddress = (addr: string) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

onMounted(async () => {
  try {
    const response = await fetch('/api/web3/token-impersonator/popular-tokens');
    const data = await response.json();
    if (data.success) {
      popularTokens.value = data.tokens;
    }
  } catch (error) {
    console.error('Failed to load popular tokens:', error);
  }
});
</script>

<style scoped>
.token-impersonator-scanner {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.scan-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.option-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.option-card:hover {
  border-color: #4f46e5;
}

.option-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
}

.option-card .icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.option-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.option-card p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.input-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-row input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
}

.input-row select {
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
}

.input-row button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.input-row button:hover:not(:disabled) {
  background: #4338ca;
}

.input-row button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.results {
  margin-bottom: 24px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
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

.risk-badge .score {
  font-size: 24px;
  font-weight: bold;
}

.risk-badge .level {
  font-size: 14px;
  font-weight: 600;
}

.token-info {
  margin-bottom: 20px;
}

.token-info h3 {
  margin: 0 0 4px;
}

.token-info .symbol {
  color: #666;
  margin: 0 0 4px;
}

.token-info .address {
  font-family: monospace;
  color: #666;
  font-size: 13px;
}

.risk-factors, .recommendations, .dex-data {
  margin-bottom: 20px;
}

.risk-factors h4, .recommendations h4, .dex-data h4 {
  margin: 0 0 12px;
}

.risk-factors ul, .recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.risk-factors li {
  color: #991b1b;
  margin-bottom: 6px;
}

.recommendations li {
  color: #065f46;
  margin-bottom: 6px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.data-item {
  text-align: center;
}

.data-item .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.data-item .value {
  font-size: 16px;
  font-weight: 600;
}

.wallet-summary {
  text-align: center;
  margin-bottom: 24px;
}

.summary-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 16px;
}

.stat {
  text-align: center;
}

.stat .count {
  display: block;
  font-size: 36px;
  font-weight: bold;
}

.stat.safe .count { color: #059669; }
.stat.warning .count { color: #d97706; }
.stat.danger .count { color: #dc2626; }

.stat .label {
  font-size: 14px;
  color: #666;
}

.high-risk-section {
  margin-bottom: 24px;
}

.high-risk-section h4 {
  color: #991b1b;
  margin-bottom: 12px;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ccc;
}

.token-item.danger {
  border-left-color: #dc2626;
  background: #fef2f2;
}

.token-item.warning {
  border-left-color: #d97706;
  background: #fffbeb;
}

.token-item.safe {
  border-left-color: #059669;
  background: #ecfdf5;
}

.token-item .token-details {
  display: flex;
  flex-direction: column;
}

.token-item .name {
  font-weight: 600;
}

.token-item .address {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.token-item .risk-score {
  font-size: 18px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 4px;
}

.token-item .risk-score.high { color: #dc2626; }
.token-item .risk-score.medium { color: #d97706; }
.token-item .risk-score.low { color: #059669; }

.all-results h4 {
  margin-bottom: 12px;
}

.similar-tokens {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.similar-token {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.similar-token .token-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.similar-token .token-name {
  font-weight: 600;
}

.similar-token .token-symbol {
  color: #666;
}

.similar-token .token-price {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.similar-token .price {
  font-weight: 600;
}

.similar-token .change.up { color: #059669; }
.similar-token .change.down { color: #dc2626; }

.similar-token .pair {
  font-size: 12px;
  color: #666;
}

.popular-tokens-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.popular-tokens-section h3 {
  margin: 0 0 4px;
}

.popular-tokens-section .subtitle {
  color: #666;
  margin-bottom: 16px;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.popular-token {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.popular-token .symbol {
  display: block;
  font-weight: 600;
  font-size: 16px;
}

.popular-token .name {
  font-size: 12px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
