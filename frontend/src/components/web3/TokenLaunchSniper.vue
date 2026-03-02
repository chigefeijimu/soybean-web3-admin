<template>
  <div class="token-launch-sniper">
    <div class="sniper-header">
      <div class="header-left">
        <h2>🎯 Token Launch Sniper</h2>
        <p class="subtitle">Monitor new token launches and catch potential gems early</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
          <option value="base">Base</option>
        </select>
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🚀</div>
        <div class="stat-content">
          <div class="stat-value">{{ recentLaunches.length }}</div>
          <div class="stat-label">New Pairs (24h)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <div class="stat-value">{{ trendingTokens.length }}</div>
          <div class="stat-label">Trending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👀</div>
        <div class="stat-content">
          <div class="stat-value">{{ watchedTokens.length }}</div>
          <div class="stat-label">Watching</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ sniperScore || '-' }}</div>
          <div class="stat-label">Avg Score</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Recent Launches Tab -->
    <div v-if="activeTab === 'recent'" class="tab-content">
      <div class="section-header">
        <h3>🚀 Recent Launches</h3>
        <div class="filter-group">
          <input 
            v-model="searchQuery" 
            placeholder="Search tokens..." 
            class="search-input"
          />
        </div>
      </div>
      
      <div v-if="loading" class="loading">Loading launches...</div>
      
      <div v-else class="pairs-grid">
        <div 
          v-for="pair in filteredLaunches" 
          :key="pair.pairAddress"
          class="pair-card"
          @click="analyzePair(pair)"
        >
          <div class="pair-header">
            <span class="dex-badge">{{ pair.dex }}</span>
            <span class="chain-badge">{{ pair.chain }}</span>
          </div>
          <div class="pair-tokens">
            <span class="token">{{ pair.token0?.symbol }}</span>
            <span class="swap-icon">⇄</span>
            <span class="token">{{ pair.token1?.symbol }}</span>
          </div>
          <div class="pair-address">
            <code>{{ shortenAddress(pair.pairAddress) }}</code>
          </div>
          <div class="pair-stats">
            <div class="stat">
              <span class="label">TVL</span>
              <span class="value">${{ formatNumber(pair.tvlUSD || pair.totalValueLockedUSD || 0) }}</span>
            </div>
            <div class="stat">
              <span class="label">Vol 24h</span>
              <span class="value">${{ formatNumber(pair.volume24h || pair.volumeUSD || 0) }}</span>
            </div>
          </div>
          <div class="pair-actions">
            <button @click.stop="watchToken(pair)" class="action-btn watch">
              👁️ Watch
            </button>
            <button @click.stop="copyAddress(pair.pairAddress)" class="action-btn copy">
              📋
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="filteredLaunches.length === 0" class="empty-state">
        No recent launches found
      </div>
    </div>

    <!-- Trending Tab -->
    <div v-if="activeTab === 'trending'" class="tab-content">
      <div class="section-header">
        <h3>🔥 Trending Launches</h3>
        <p class="section-desc">High volume/potential tokens sorted by sniper score</p>
      </div>
      
      <div class="trending-list">
        <div 
          v-for="token in trendingTokens" 
          :key="token.pairAddress"
          class="trending-item"
          @click="showTokenDetails(token)"
        >
          <div class="trending-rank">
            <span class="rank">{{ trendingTokens.indexOf(token) + 1 }}</span>
          </div>
          <div class="trending-info">
            <div class="token-names">
              <span class="symbol">{{ token.token0?.symbol }}</span>
              <span class="sep">/</span>
              <span class="symbol">{{ token.token1?.symbol }}</span>
            </div>
            <div class="pair-address">
              <code>{{ shortenAddress(token.pairAddress) }}</code>
            </div>
          </div>
          <div class="trending-stats">
            <div class="trending-stat">
              <span class="label">TVL</span>
              <span class="value">${{ formatNumber(token.tvlUSD) }}</span>
            </div>
            <div class="trending-stat">
              <span class="label">Volume</span>
              <span class="value">${{ formatNumber(token.volume24h) }}</span>
            </div>
          </div>
          <div class="score-badge" :class="getScoreClass(token.potentialScore)">
            {{ token.potentialScore }}
          </div>
        </div>
      </div>
      
      <div v-if="trendingTokens.length === 0" class="empty-state">
        No trending tokens found
      </div>
    </div>

    <!-- Watchlist Tab -->
    <div v-if="activeTab === 'watchlist'" class="tab-content">
      <div class="section-header">
        <h3>👀 Watchlist</h3>
        <button @click="showAddToken = true" class="add-btn">
          + Add Token
        </button>
      </div>
      
      <div class="watchlist-grid">
        <div 
          v-for="token in watchedTokens" 
          :key="token.address"
          class="watchlist-card"
        >
          <div class="watchlist-header">
            <span class="symbol">{{ token.symbol }}</span>
            <span class="age">{{ token.age || 0 }}h ago</span>
          </div>
          <div class="watchlist-address">
            <code>{{ shortenAddress(token.address) }}</code>
          </div>
          <div class="watchlist-actions">
            <button @click="analyzeWatchedToken(token)" class="analyze-btn">
              🔍 Analyze
            </button>
            <button @click="removeFromWatchlist(token.address)" class="remove-btn">
              ✕
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="watchedTokens.length === 0" class="empty-state">
        <p>No tokens in watchlist</p>
        <p class="hint">Add tokens to monitor their potential</p>
      </div>
    </div>

    <!-- Analyze Tab -->
    <div v-if="activeTab === 'analyze'" class="tab-content">
      <div class="section-header">
        <h3>🔍 Token Analyzer</h3>
      </div>
      
      <div class="analyze-form">
        <input 
          v-model="analyzeAddress" 
          placeholder="Enter token address (0x...)" 
          class="address-input"
        />
        <button @click="analyzeToken" class="analyze-btn-large" :disabled="analyzing">
          {{ analyzing ? 'Analyzing...' : '🔍 Analyze Token' }}
        </button>
      </div>
      
      <div v-if="analysisResult" class="analysis-result">
        <div class="result-header" :class="analysisResult.recommendation?.toLowerCase()">
          <span class="recommendation">{{ analysisResult.recommendation }}</span>
          <span class="score">Sniper Score: {{ analysisResult.sniperScore }}/100</span>
        </div>
        
        <div class="factors-list">
          <h4>Analysis Factors</h4>
          <ul>
            <li v-for="(factor, idx) in analysisResult.factors" :key="idx">
              {{ factor }}
            </li>
          </ul>
        </div>
        
        <div v-if="analysisResult.token" class="token-info">
          <h4>Token Info</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Name</span>
              <span class="value">{{ analysisResult.token.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Symbol</span>
              <span class="value">{{ analysisResult.token.symbol }}</span>
            </div>
            <div class="info-item">
              <span class="label">Price</span>
              <span class="value">${{ analysisResult.token.price?.toFixed(6) || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Market Cap</span>
              <span class="value">${{ formatNumber(analysisResult.token.marketCap || 0) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="analysisResult.honeypot" class="honeypot-check">
          <h4>Honeypot Check</h4>
          <div class="check-item">
            <span>Is Honeypot:</span>
            <span :class="analysisResult.honeypot.isHoneypot ? 'danger' : 'safe'">
              {{ analysisResult.honeypot.isHoneypot ? '⚠️ Yes' : '✅ No' }}
            </span>
          </div>
          <div class="check-item">
            <span>Risk Level:</span>
            <span :class="analysisResult.honeypot.risk?.toLowerCase()">
              {{ analysisResult.honeypot.risk }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Token Modal -->
    <div v-if="showAddToken" class="modal-overlay" @click="showAddToken = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Token to Watchlist</h3>
          <button @click="showAddToken = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <input 
            v-model="newTokenAddress" 
            placeholder="Token address (0x...)" 
            class="modal-input"
          />
          <input 
            v-model="newTokenSymbol" 
            placeholder="Token symbol (e.g., PEPE)" 
            class="modal-input"
          />
        </div>
        <div class="modal-footer">
          <button @click="addToWatchlist" class="submit-btn">
            Add to Watchlist
          </button>
        </div>
      </div>
    </div>

    <!-- Token Details Modal -->
    <div v-if="selectedPair" class="modal-overlay" @click="selectedPair = null">
      <div class="modal large" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedPair.token0?.symbol }} / {{ selectedPair.token1?.symbol }}</h3>
          <button @click="selectedPair = null" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="pair-details">
            <div class="detail-row">
              <span class="label">Pair Address</span>
              <code>{{ selectedPair.pairAddress }}</code>
            </div>
            <div class="detail-row">
              <span class="label">Token 0</span>
              <span>{{ selectedPair.token0?.name }} ({{ selectedPair.token0?.symbol }})</span>
            </div>
            <div class="detail-row">
              <span class="label">Token 1</span>
              <span>{{ selectedPair.token1?.name }} ({{ selectedPair.token1?.symbol }})</span>
            </div>
            <div class="detail-row">
              <span class="label">TVL</span>
              <span>${{ formatNumber(selectedPair.tvlUSD || selectedPair.totalValueLockedUSD || 0) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Volume 24h</span>
              <span>${{ formatNumber(selectedPair.volume24h || selectedPair.volumeUSD || 0) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">DEX</span>
              <span>{{ selectedPair.dex || 'Uniswap' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Chain</span>
              <span>{{ selectedPair.chain }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="watchToken(selectedPair); selectedPair = null" class="action-btn watch">
              👁️ Add to Watchlist
            </button>
            <button @click="copyAddress(selectedPair.pairAddress)" class="action-btn copy">
              📋 Copy Address
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { makeHttpRequest } = useWeb3();

// State
const loading = ref(false);
const analyzing = ref(false);
const activeTab = ref('recent');
const selectedChain = ref('ethereum');
const searchQuery = ref('');
const showAddToken = ref(false);
const newTokenSymbol = ref('');
const selectedPair = ref<any>(null);
const analyzeAddress = ref('');
const analysisResult = ref<any>(null);
const sniperScore = ref<number | null>(null);

// Data
const recentLaunches = ref<any[]>([]);
const trendingTokens = ref<any[]>([]);
const watchedTokens = ref<any[]>([]);

// Tabs
const tabs = [
  { id: 'recent', label: 'Recent', icon: '🚀' },
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'watchlist', label: 'Watchlist', icon: '👀' },
  { id: 'analyze', label: 'Analyze', icon: '🔍' },
];

// Computed
const filteredLaunches = computed(() => {
  if (!searchQuery.value) return recentLaunches.value;
  const query = searchQuery.value.toLowerCase();
  return recentLaunches.value.filter(
    (pair) =>
      pair.token0?.symbol?.toLowerCase().includes(query) ||
      pair.token1?.symbol?.toLowerCase().includes(query) ||
      pair.pairAddress?.toLowerCase().includes(query)
  );
});

// Methods
const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchRecentLaunches(),
      fetchTrendingLaunches(),
      fetchWatchedTokens(),
    ]);
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    loading.value = false;
  }
};

const fetchRecentLaunches = async () => {
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/recent-launches',
      params: { chain: selectedChain.value, limit: 30 },
    });
    if (response?.success) {
      recentLaunches.value = response.data || [];
    }
  } catch (error) {
    console.error('Error fetching recent launches:', error);
  }
};

const fetchTrendingLaunches = async () => {
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/trending-launches',
      params: { chain: selectedChain.value },
    });
    if (response?.success) {
      trendingTokens.value = response.data || [];
      // Calculate average sniper score
      if (trendingTokens.value.length > 0) {
        const total = trendingTokens.value.reduce((sum: number, t: any) => sum + (t.potentialScore || 0), 0);
        sniperScore.value = Math.round(total / trendingTokens.value.length);
      }
    }
  } catch (error) {
    console.error('Error fetching trending launches:', error);
  }
};

const fetchWatchedTokens = async () => {
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/sniper-alerts',
    });
    if (response?.success) {
      watchedTokens.value = response.data || [];
    }
  } catch (error) {
    console.error('Error fetching watched tokens:', error);
  }
};

const watchToken = async (pair: any) => {
  const tokenAddress = pair.token1?.id || pair.token1?.address;
  const symbol = pair.token1?.symbol;
  
  if (!tokenAddress) return;
  
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/watch-token',
      method: 'POST',
      data: { address: tokenAddress, symbol },
    });
    if (response?.success) {
      await fetchWatchedTokens();
    }
  } catch (error) {
    console.error('Error watching token:', error);
  }
};

const addToWatchlist = async () => {
  if (!newTokenAddress.value) return;
  
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/watch-token',
      method: 'POST',
      data: { 
        address: newTokenAddress.value, 
        symbol: newTokenSymbol.value || 'UNKNOWN' 
      },
    });
    if (response?.success) {
      showAddToken.value = false;
      newTokenAddress.value = '';
      newTokenSymbol.value = '';
      await fetchWatchedTokens();
    }
  } catch (error) {
    console.error('Error adding token:', error);
  }
};

const removeFromWatchlist = async (address: string) => {
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/unwatch-token',
      method: 'POST',
      data: { address },
    });
    if (response?.success) {
      await fetchWatchedTokens();
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

const analyzeToken = async () => {
  if (!analyzeAddress.value) return;
  
  analyzing.value = true;
  try {
    const response = await makeHttpRequest({
      url: '/api/web3/token-launch-sniper/analyze-token',
      params: { address: analyzeAddress.value, chain: selectedChain.value },
    });
    if (response?.success) {
      analysisResult.value = response.data;
    }
  } catch (error) {
    console.error('Error analyzing token:', error);
  } finally {
    analyzing.value = false;
  }
};

const analyzePair = (pair: any) => {
  selectedPair.value = pair;
};

const analyzeWatchedToken = (token: any) => {
  analyzeAddress.value = token.address;
  activeTab.value = 'analyze';
  analyzeToken();
};

const showTokenDetails = (token: any) => {
  selectedPair.value = token;
};

const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getScoreClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

// Watch for chain changes
import { watch } from 'vue';
watch(selectedChain, () => {
  refreshData();
});

// Mount
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.token-launch-sniper {
  padding: 20px;
  background: #0d1117;
  min-height: 100vh;
  color: #e6edf3;
}

.sniper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.subtitle {
  margin: 4px 0 0;
  color: #8b949e;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.chain-select {
  padding: 8px 16px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #e6edf3;
  cursor: pointer;
}

.refresh-btn {
  padding: 8px 16px;
  background: #238636;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2ea043;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: #8b949e;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #30363d;
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #8b949e;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #21262d;
  color: #e6edf3;
}

.tab-btn.active {
  background: #238636;
  color: #fff;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #fff;
}

.section-desc {
  color: #8b949e;
  font-size: 14px;
  margin: 4px 0 0;
}

.search-input {
  padding: 8px 12px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #e6edf3;
  width: 200px;
}

/* Pairs Grid */
.pairs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pair-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.pair-card:hover {
  border-color: #238636;
}

.pair-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dex-badge, .chain-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #21262d;
  color: #8b949e;
}

.pair-tokens {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.token {
  font-weight: 600;
  color: #fff;
}

.swap-icon {
  color: #8b949e;
}

.pair-address {
  margin-bottom: 12px;
}

.pair-address code {
  font-size: 12px;
  color: #8b949e;
  background: #0d1117;
  padding: 2px 6px;
  border-radius: 4px;
}

.pair-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 10px;
  color: #8b949e;
}

.stat .value {
  font-size: 14px;
  color: #fff;
}

.pair-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.watch {
  background: #238636;
  color: #fff;
}

.action-btn.copy {
  background: #21262d;
  color: #8b949e;
}

/* Trending List */
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.trending-item:hover {
  border-color: #238636;
}

.trending-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #21262d;
  border-radius: 50%;
}

.trending-rank .rank {
  font-weight: 600;
  color: #fff;
}

.trending-info {
  flex: 1;
}

.token-names {
  display: flex;
  align-items: center;
  gap: 4px;
}

.token-names .symbol {
  font-weight: 600;
  color: #fff;
}

.token-names .sep {
  color: #8b949e;
}

.pair-address code {
  font-size: 11px;
  color: #8b949e;
}

.trending-stats {
  display: flex;
  gap: 24px;
}

.trending-stat {
  display: flex;
  flex-direction: column;
}

.trending-stat .label {
  font-size: 10px;
  color: #8b949e;
}

.trending-stat .value {
  font-size: 14px;
  color: #fff;
}

.score-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.score-badge.high {
  background: #238636;
  color: #fff;
}

.score-badge.medium {
  background: #9e6a03;
  color: #fff;
}

.score-badge.low {
  background: #da3633;
  color: #fff;
}

/* Watchlist */
.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.watchlist-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.watchlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.watchlist-header .symbol {
  font-weight: 600;
  font-size: 18px;
  color: #fff;
}

.watchlist-header .age {
  font-size: 12px;
  color: #8b949e;
}

.watchlist-address {
  margin-bottom: 12px;
}

.watchlist-address code {
  font-size: 12px;
  color: #8b949e;
}

.watchlist-actions {
  display: flex;
  gap: 8px;
}

.analyze-btn {
  flex: 1;
  padding: 8px;
  background: #238636;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.remove-btn {
  padding: 8px 12px;
  background: #da3633;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.add-btn {
  padding: 8px 16px;
  background: #238636;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

/* Analyze */
.analyze-form {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #e6edf3;
  font-size: 14px;
}

.analyze-btn-large {
  padding: 12px 24px;
  background: #238636;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.analyze-btn-large:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.analysis-result {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.result-header.buy {
  background: rgba(35, 134, 54, 0.2);
  border: 1px solid #238636;
}

.result-header.watch {
  background: rgba(158, 106, 3, 0.2);
  border: 1px solid #9e6a03;
}

.result-header.avoid {
  background: rgba(218, 54, 51, 0.2);
  border: 1px solid #da3633;
}

.recommendation {
  font-size: 24px;
  font-weight: 600;
}

.result-header.buy .recommendation { color: #3fb950; }
.result-header.watch .recommendation { color: #d29922; }
.result-header.avoid .recommendation { color: #f85149; }

.score {
  font-size: 16px;
  color: #8b949e;
}

.factors-list {
  margin-bottom: 16px;
}

.factors-list h4 {
  margin: 0 0 8px;
  color: #fff;
}

.factors-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.factors-list li {
  padding: 4px 0;
  color: #8b949e;
}

.token-info h4, .honeypot-check h4 {
  margin: 0 0 12px;
  color: #fff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 12px;
  color: #8b949e;
}

.info-item .value {
  font-size: 14px;
  color: #fff;
}

.check-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #30363d;
}

.check-item .danger { color: #f85149; }
.check-item .safe { color: #3fb950; }
.check-item .low { color: #3fb950; }
.check-item .medium { color: #d29922; }
.check-item .high { color: #f85149; }

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.modal.large {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #30363d;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
}

.close-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  cursor: pointer;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

.modal-input {
  width: 100%;
  padding: 10px 12px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #e6edf3;
  margin-bottom: 12px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #30363d;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  background: #238636;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.pair-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
}

.detail-row .label {
  color: #8b949e;
}

.detail-row code {
  font-size: 12px;
  color: #8b949e;
  background: #0d1117;
  padding: 2px 6px;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-actions .action-btn {
  flex: 1;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #8b949e;
}

.empty-state .hint {
  font-size: 14px;
  margin-top: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #8b949e;
}
</style>
