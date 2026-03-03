<template>
  <div class="token-launch-scanner">
    <div class="header">
      <h2>🚀 Token Launch Scanner</h2>
      <div class="chain-filter">
        <select v-model="selectedChain" @change="loadLaunches">
          <option value="">All Chains</option>
          <option value="1">Ethereum</option>
          <option value="137">Polygon</option>
          <option value="42161">Arbitrum</option>
          <option value="10">Optimism</option>
          <option value="56">BSC</option>
          <option value="8453">Base</option>
          <option value="43114">Avalanche</option>
        </select>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Launches</div>
        <div class="stat-value">{{ stats.totalLaunches }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Last 24h</div>
        <div class="stat-value">{{ stats.active24h }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">Suspicious</div>
        <div class="stat-value">{{ stats.suspiciousCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Liquidity</div>
        <div class="stat-value">{{ stats.avgLiquidity }} ETH</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'recent' }]" 
        @click="activeTab = 'recent'; loadLaunches()"
      >
        Recent Launches
      </button>
      <button 
        :class="['tab', { active: activeTab === 'trending' }]" 
        @click="activeTab = 'trending'; loadTrending()"
      >
        Trending 🔥
      </button>
      <button 
        :class="['tab', { active: activeTab === 'suspicious' }]" 
        @click="activeTab = 'suspicious'; loadSuspicious()"
      >
        ⚠️ Suspicious
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Loading...</div>

    <!-- Token List -->
    <div v-else class="token-list">
      <div 
        v-for="token in tokens" 
        :key="token.id" 
        :class="['token-card', { suspicious: token.suspicious }]"
        @click="showTokenDetails(token)"
      >
        <div class="token-header">
          <div class="token-icon">{{ token.symbol.charAt(0) }}</div>
          <div class="token-info">
            <div class="token-name">{{ token.name }}</div>
            <div class="token-symbol">{{ token.symbol }}</div>
          </div>
          <div class="token-chain">{{ getChainName(token.chainId) }}</div>
        </div>
        
        <div class="token-stats">
          <div class="stat">
            <span class="label">Price</span>
            <span class="value">${{ token.price }}</span>
          </div>
          <div class="stat">
            <span class="label">Holders</span>
            <span class="value">{{ formatNumber(token.holders) }}</span>
          </div>
          <div class="stat">
            <span class="label">24h Volume</span>
            <span class="value">${{ formatNumber(token.volume24h) }}</span>
          </div>
          <div class="stat">
            <span class="label">Risk</span>
            <span :class="['risk-badge', getRiskClass(token.riskScore)]">
              {{ token.riskScore }}
            </span>
          </div>
        </div>

        <div class="token-time">
          {{ getTimeAgo(token.timestamp) }}
        </div>
      </div>
    </div>

    <!-- Token Details Modal -->
    <div v-if="selectedToken" class="modal-overlay" @click="selectedToken = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedToken.name }} ({{ selectedToken.symbol }})</h3>
          <button class="close-btn" @click="selectedToken = null">×</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-row">
            <span class="label">Contract</span>
            <span class="value address">{{ truncateAddress(selectedToken.address) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Deployer</span>
            <span class="value address">{{ truncateAddress(selectedToken.deployer) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Initial Liquidity</span>
            <span class="value">{{ selectedToken.initialLiquidity }} {{ selectedToken.liquidityToken }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Current Price</span>
            <span class="value">${{ selectedToken.price }}</span>
          </div>
          <div class="detail-row">
            <span class="label">24h Volume</span>
            <span class="value">${{ formatNumber(selectedToken.volume24h) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Holders</span>
            <span class="value">{{ formatNumber(selectedToken.holders) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Deployed</span>
            <span class="value">{{ new Date(selectedToken.timestamp).toLocaleString() }}</span>
          </div>
          
          <div class="risk-analysis">
            <h4>Risk Analysis</h4>
            <div class="risk-score" :class="getRiskClass(riskAnalysis.score)">
              Risk Score: {{ riskAnalysis.score }}/100
            </div>
            <ul v-if="riskAnalysis.factors.length">
              <li v-for="(factor, idx) in riskAnalysis.factors" :key="idx">{{ factor }}</li>
            </ul>
            <div class="recommendation">{{ riskAnalysis.recommendation }}</div>
          </div>

          <button class="action-btn" @click="addToWatchlist(selectedToken)">
            ⭐ Add to Watchlist
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface TokenLaunch {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  deployer: string;
  initialLiquidity: string;
  liquidityToken: string;
  price: string;
  timestamp: number;
  txHash: string;
  holders: number;
  volume24h: string;
  suspicious: boolean;
  riskScore: number;
}

interface Stats {
  totalLaunches: number;
  active24h: number;
  suspiciousCount: number;
  avgLiquidity: string;
}

const loading = ref(false);
const tokens = ref<TokenLaunch[]>([]);
const activeTab = ref('recent');
const selectedChain = ref('');
const selectedToken = ref<TokenLaunch | null>(null);
const riskAnalysis = ref<{ score: number; factors: string[]; recommendation: string }>({
  score: 0,
  factors: [],
  recommendation: ''
});

const stats = computed<Stats>(() => {
  if (tokens.value.length === 0) {
    return { totalLaunches: 0, active24h: 0, suspiciousCount: 0, avgLiquidity: '0' };
  }
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const active24h = tokens.value.filter(t => t.timestamp > dayAgo).length;
  const suspiciousCount = tokens.value.filter(t => t.suspicious).length;
  const totalLiquidity = tokens.value.reduce((sum, t) => sum + parseFloat(t.initialLiquidity), 0);
  const avgLiquidity = tokens.value.length > 0 ? (totalLiquidity / tokens.value.length).toFixed(2) : '0';
  
  return {
    totalLaunches: tokens.value.length,
    active24h,
    suspiciousCount,
    avgLiquidity
  };
});

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BSC',
  8453: 'Base',
  43114: 'Avalanche'
};

function getChainName(chainId: number): string {
  return chainNames[chainId] || `Chain ${chainId}`;
}

function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
  return n.toString();
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

function getRiskClass(score: number): string {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  return 'high';
}

async function loadLaunches() {
  loading.value = true;
  try {
    const chainId = selectedChain.value ? parseInt(selectedChain.value) : undefined;
    const res = await fetch(`/api/web3/token-launch-scanner/launches?chainId=${chainId || ''}&limit=20`);
    const data = await res.json();
    tokens.value = data;
  } catch (e) {
    console.error('Failed to load launches:', e);
  }
  loading.value = false;
}

async function loadTrending() {
  loading.value = true;
  try {
    const chainId = selectedChain.value ? parseInt(selectedChain.value) : undefined;
    const res = await fetch(`/api/web3/token-launch-scanner/trending?chainId=${chainId || ''}&limit=10`);
    const data = await res.json();
    tokens.value = data;
  } catch (e) {
    console.error('Failed to load trending:', e);
  }
  loading.value = false;
}

async function loadSuspicious() {
  loading.value = true;
  try {
    const chainId = selectedChain.value ? parseInt(selectedChain.value) : undefined;
    const res = await fetch(`/api/web3/token-launch-scanner/suspicious?chainId=${chainId || ''}&limit=20`);
    const data = await res.json();
    tokens.value = data;
  } catch (e) {
    console.error('Failed to load suspicious:', e);
  }
  loading.value = false;
}

async function showTokenDetails(token: TokenLaunch) {
  selectedToken.value = token;
  try {
    const res = await fetch(`/api/web3/token-launch-scanner/analyze/${token.address}?chainId=${token.chainId}`);
    riskAnalysis.value = await res.json();
  } catch (e) {
    riskAnalysis.value = {
      score: token.riskScore,
      factors: [],
      recommendation: 'Analysis unavailable'
    };
  }
}

async function addToWatchlist(token: TokenLaunch) {
  try {
    await fetch('/api/web3/token-launch-scanner/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: token.address,
        name: token.name
      })
    });
    alert('Added to watchlist!');
  } catch (e) {
    console.error('Failed to add to watchlist:', e);
  }
}

onMounted(() => {
  loadLaunches();
});
</script>

<style scoped>
.token-launch-scanner {
  padding: 20px;
  background: #0f0f23;
  min-height: 100vh;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.chain-filter select {
  padding: 8px 16px;
  background: #1a1a2e;
  border: 1px solid #333;
  color: #fff;
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #1a1a2e;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.stat-card.warning {
  border: 1px solid #f39c12;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  background: #1a1a2e;
  border: none;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: #6366f1;
  color: #fff;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #888;
}

.token-list {
  display: grid;
  gap: 12px;
}

.token-card {
  background: #1a1a2e;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.token-card:hover {
  transform: translateY(-2px);
}

.token-card.suspicious {
  border: 1px solid #e74c3c;
}

.token-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.token-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.token-info {
  flex: 1;
}

.token-name {
  font-weight: bold;
  font-size: 16px;
}

.token-symbol {
  color: #888;
  font-size: 14px;
}

.token-chain {
  background: #2d2d44;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.token-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.token-stats .stat {
  text-align: center;
}

.token-stats .label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.token-stats .value {
  font-weight: bold;
}

.risk-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.risk-badge.low {
  background: #27ae60;
}

.risk-badge.medium {
  background: #f39c12;
}

.risk-badge.high {
  background: #e74c3c;
}

.token-time {
  font-size: 12px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1a2e;
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.detail-row .label {
  color: #888;
}

.detail-row .value.address {
  font-family: monospace;
  font-size: 12px;
}

.risk-analysis {
  margin-top: 20px;
  padding: 16px;
  background: #0f0f23;
  border-radius: 8px;
}

.risk-analysis h4 {
  margin: 0 0 12px 0;
}

.risk-score {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}

.risk-score.low { color: #27ae60; }
.risk-score.medium { color: #f39c12; }
.risk-score.high { color: #e74c3c; }

.risk-analysis ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #e74c3c;
}

.recommendation {
  margin-top: 12px;
  padding: 8px;
  background: #2d2d44;
  border-radius: 4px;
}

.action-btn {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  background: #6366f1;
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.action-btn:hover {
  background: #4f46e5;
}
</style>
