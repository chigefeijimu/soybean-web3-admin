<template>
  <div class="gas-comparison">
    <div class="header">
      <h2>🔥 Cross-chain Gas Comparison</h2>
      <div class="actions">
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          {{ loading ? '⏳' : '🔄' }} Refresh
        </button>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="comparison" class="recommendations">
      <div class="rec-card cheapest">
        <div class="rec-icon">💰</div>
        <div class="rec-label">Cheapest</div>
        <div class="rec-value">{{ comparison.recommendations.cheapest.name }}</div>
        <div class="rec-save">Save {{ comparison.recommendations.cheapest.savings }}%</div>
      </div>
      <div class="rec-card fastest">
        <div class="rec-icon">⚡</div>
        <div class="rec-label">Fastest</div>
        <div class="rec-value">{{ comparison.recommendations.fastest.name }}</div>
        <div class="rec-speed">{{ comparison.recommendations.fastest.speed }}</div>
      </div>
      <div class="rec-card best-value">
        <div class="rec-icon">🎯</div>
        <div class="rec-label">Best Value</div>
        <div class="rec-value">{{ comparison.recommendations.bestValue.name }}</div>
        <div class="rec-score">Score: {{ comparison.recommendations.bestValue.score }}</div>
      </div>
    </div>

    <!-- Chain Gas List -->
    <div class="chains-grid">
      <div 
        v-for="chain in comparison?.chains" 
        :key="chain.chainId"
        class="chain-card"
        :class="{ selected: selectedChain === chain.chainId }"
        @click="selectChain(chain.chainId)"
      >
        <div class="chain-header">
          <span class="chain-badge" :class="chain.type">{{ chain.type }}</span>
          <span class="chain-name">{{ chain.name }}</span>
        </div>
        <div class="gas-prices">
          <div class="gas-row">
            <span class="gas-label">Gas Price</span>
            <span class="gas-value">{{ chain.gasPrice }} Gwei</span>
          </div>
          <div class="gas-row">
            <span class="gas-label">Est. Cost</span>
            <span class="gas-value usd">${{ chain.gasPriceUSD }}</span>
          </div>
          <div class="gas-row" v-if="chain.totalGasCostUSD">
            <span class="gas-label">Total (L1+L2)</span>
            <span class="gas-value usd">${{ chain.totalGasCostUSD }}</span>
          </div>
        </div>
        <div class="gas-speeds">
          <span class="speed low">Slow: {{ chain.low }}</span>
          <span class="speed med">Normal: {{ chain.medium }}</span>
          <span class="speed high">Fast: {{ chain.high }}</span>
        </div>
      </div>
    </div>

    <!-- Chain Selector -->
    <div class="chain-selector">
      <label>Select Chain:</label>
      <select v-model="selectedChain" @change="fetchChainGas">
        <option value="">-- Select --</option>
        <option v-for="chain in availableChains" :key="chain.chainId" :value="chain.chainId">
          {{ chain.name }} ({{ chain.type }})
        </option>
      </select>
    </div>

    <!-- Single Chain Details -->
    <div v-if="selectedChainData" class="chain-details">
      <h3>{{ selectedChainData.name }} Details</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">Chain ID</span>
          <span class="value">{{ selectedChainData.chainId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Type</span>
          <span class="value">{{ selectedChainData.type }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Gas Price</span>
          <span class="value">{{ selectedChainData.gasPrice }} Gwei</span>
        </div>
        <div class="detail-item">
          <span class="label">Cost (USD/1k gas)</span>
          <span class="value">${{ selectedChainData.gasPriceUSD }}</span>
        </div>
        <div class="detail-item" v-if="selectedChainData.l1GasPrice">
          <span class="label">L1 Gas Price</span>
          <span class="value">{{ selectedChainData.l1GasPrice }} Gwei</span>
        </div>
        <div class="detail-item">
          <span class="label">Last Updated</span>
          <span class="value">{{ formatTime(selectedChainData.lastUpdated) }}</span>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface ChainInfo {
  chainId: string;
  name: string;
  type: 'L1' | 'L2';
  explorer?: string;
  color?: string;
}

interface GasData {
  chainId: string;
  name: string;
  type: 'L1' | 'L2';
  gasPrice: string;
  gasPriceUSD: number;
  low: number;
  medium: number;
  high: number;
  l1GasPrice?: number;
  totalGasCostUSD?: number;
  lastUpdated: number;
}

interface Comparison {
  chains: GasData[];
  recommendations: {
    cheapest: { chainId: string; name: string; savings: number };
    fastest: { chainId: string; name: string; speed: string };
    bestValue: { chainId: string; name: string; score: number };
  };
  timestamp: number;
}

const API_BASE = 'http://localhost:3015';
const loading = ref(false);
const error = ref('');
const comparison = ref<Comparison | null>(null);
const selectedChain = ref('');
const availableChains = ref<ChainInfo[]>([]);

const selectedChainData = computed(() => {
  if (!selectedChain.value || !comparison.value) return null;
  return comparison.value.chains.find(c => c.chainId === selectedChain.value) || null;
});

async function fetchComparison() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get(`${API_BASE}/gas-comparison`);
    comparison.value = res.data;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch gas comparison';
  } finally {
    loading.value = false;
  }
}

async function fetchChains() {
  try {
    const res = await axios.get(`${API_BASE}/gas-comparison/chains`);
    availableChains.value = res.data.chains;
  } catch (e: any) {
    console.error('Failed to fetch chains:', e);
  }
}

async function refreshData() {
  await fetchComparison();
}

function selectChain(chainId: string) {
  selectedChain.value = chainId;
}

function fetchChainGas() {
  // Chain is already selected via computed
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

onMounted(async () => {
  await Promise.all([fetchComparison(), fetchChains()]);
});
</script>

<style scoped>
.gas-comparison {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.btn-refresh {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recommendations {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.rec-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.rec-card.cheapest {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.rec-card.fastest {
  background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
}

.rec-card.best-value {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.rec-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.rec-label {
  font-size: 12px;
  text-transform: uppercase;
  opacity: 0.9;
}

.rec-value {
  font-size: 20px;
  font-weight: bold;
  margin: 8px 0;
}

.rec-save, .rec-speed, .rec-score {
  font-size: 14px;
  opacity: 0.9;
}

.chains-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chain-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.chain-card:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.chain-card.selected {
  border-color: #2196F3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.chain-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.chain-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.chain-badge.L1 {
  background: #E3F2FD;
  color: #1976D2;
}

.chain-badge.L2 {
  background: #FFF3E0;
  color: #F57C00;
}

.chain-name {
  font-weight: bold;
  font-size: 16px;
}

.gas-prices {
  margin-bottom: 12px;
}

.gas-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.gas-label {
  color: #666;
  font-size: 13px;
}

.gas-value {
  font-weight: 600;
  font-size: 14px;
}

.gas-value.usd {
  color: #4CAF50;
}

.gas-speeds {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.speed {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.speed.low {
  background: #FFEBEE;
  color: #C62828;
}

.speed.med {
  background: #E8F5E9;
  color: #2E7D32;
}

.speed.high {
  background: #E3F2FD;
  color: #1565C0;
}

.chain-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.chain-selector label {
  font-weight: 600;
}

.chain-selector select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.chain-details {
  background: white;
  border: 2px solid #2196F3;
  border-radius: 12px;
  padding: 20px;
}

.chain-details h3 {
  margin-top: 0;
  color: #1976D2;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.detail-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.error {
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  margin-top: 16px;
}
</style>
