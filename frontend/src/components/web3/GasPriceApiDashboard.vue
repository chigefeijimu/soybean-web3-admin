<template>
  <div class="gas-price-api-dashboard">
    <div class="header">
      <h2>⛽ Gas Price API Dashboard</h2>
      <div class="actions">
        <button @click="refreshAll" :disabled="loading" class="btn-refresh">
          {{ loading ? '⟳ Loading...' : '🔄 Refresh All' }}
        </button>
      </div>
    </div>

    <!-- Chain Selector -->
    <div class="chain-selector">
      <button 
        v-for="chain in supportedChains" 
        :key="chain.chainId"
        :class="['chain-btn', { active: selectedChain === chain.chainId }]"
        @click="selectChain(chain.chainId)"
      >
        {{ chain.chainName }}
      </button>
    </div>

    <!-- Current Gas Prices -->
    <div class="gas-cards" v-if="currentGas">
      <div class="gas-card slow">
        <div class="card-label">🐢 Slow</div>
        <div class="card-value">{{ currentGas.slow }}</div>
        <div class="card-unit">Gwei</div>
        <div class="card-time">~15-30 min</div>
      </div>
      <div class="gas-card normal">
        <div class="card-label">🚶 Normal</div>
        <div class="card-value">{{ currentGas.normal }}</div>
        <div class="card-unit">Gwei</div>
        <div class="card-time">~3-10 min</div>
      </div>
      <div class="gas-card fast">
        <div class="card-label">🚀 Fast</div>
        <div class="card-value">{{ currentGas.fast }}</div>
        <div class="card-unit">Gwei</div>
        <div class="card-time">~<1 min</div>
      </div>
    </div>

    <!-- Gas Prediction -->
    <div class="prediction-section" v-if="prediction">
      <h3>📈 Gas Price Prediction</h3>
      <div class="prediction-grid">
        <div class="prediction-card">
          <div class="pred-label">Trend</div>
          <div :class="['pred-value', prediction.trend]">
            {{ prediction.trend === 'rising' ? '📈 Rising' : prediction.trend === 'falling' ? '📉 Falling' : '➡️ Stable' }}
          </div>
        </div>
        <div class="prediction-card">
          <div class="pred-label">Confidence</div>
          <div class="pred-value">{{ prediction.confidence }}%</div>
        </div>
        <div class="prediction-card">
          <div class="pred-label">Next Peak</div>
          <div class="pred-value">{{ prediction.nextPeak }}</div>
        </div>
        <div class="prediction-card">
          <div class="pred-label">Next Low</div>
          <div class="pred-value">{{ prediction.nextLow }}</div>
        </div>
      </div>
    </div>

    <!-- Optimal Time -->
    <div class="optimal-section" v-if="optimalTime">
      <h3>🎯 Best Time to Transact</h3>
      <div class="optimal-card">
        <div class="optimal-time">{{ optimalTime.bestTime }}</div>
        <div class="optimal-gas">Estimated Gas: <strong>{{ optimalTime.estimatedGas }} Gwei</strong></div>
        <div class="optimal-confidence">Confidence: {{ optimalTime.confidence }}%</div>
      </div>
    </div>

    <!-- API Endpoints -->
    <div class="api-section">
      <h3>🔌 API Endpoints</h3>
      <div class="api-list">
        <div class="api-item" v-for="endpoint in apiEndpoints" :key="endpoint.url">
          <div class="api-method">{{ endpoint.method }}</div>
          <div class="api-url">{{ endpoint.url }}</div>
          <div class="api-desc">{{ endpoint.desc }}</div>
        </div>
      </div>
    </div>

    <!-- Gas History Chart -->
    <div class="history-section">
      <h3>📊 Gas Price History</h3>
      <div class="time-selector">
        <button 
          v-for="h in [1, 6, 12, 24]" 
          :key="h"
          :class="['time-btn', { active: historyHours === h }]"
          @click="loadHistory(h)"
        >
          {{ h }}h
        </button>
      </div>
      <div class="chart-container" v-if="historyData.length > 0">
        <canvas ref="chartCanvas"></canvas>
      </div>
      <div class="no-data" v-else>Loading chart data...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';

interface ChainGasPrice {
  chainId: number;
  chainName: string;
  slow: string;
  normal: string;
  fast: string;
  baseFee: string;
  lastUpdated: number;
}

interface GasPrediction {
  chainId: number;
  predictedLow: string;
  predictedNormal: string;
  predictedFast: string;
  confidence: number;
  trend: 'rising' | 'falling' | 'stable';
  nextPeak: string;
  nextLow: string;
}

interface GasHistoryPoint {
  timestamp: number;
  slow: number;
  normal: number;
  fast: number;
}

const supportedChains = ref([
  { chainId: 1, chainName: 'Ethereum' },
  { chainId: 137, chainName: 'Polygon' },
  { chainId: 42161, chainName: 'Arbitrum' },
  { chainId: 10, chainName: 'Optimism' },
  { chainId: 56, chainName: 'BSC' },
  { chainId: 8453, chainName: 'Base' },
]);

const selectedChain = ref(1);
const loading = ref(false);
const currentGas = ref<ChainGasPrice | null>(null);
const prediction = ref<GasPrediction | null>(null);
const optimalTime = ref<{ bestTime: string; estimatedGas: string; confidence: number } | null>(null);
const historyData = ref<GasHistoryPoint[]>([]);
const historyHours = ref(24);
const chartCanvas = ref<HTMLCanvasElement | null>(null);

const apiEndpoints = [
  { method: 'GET', url: '/api/gas-price', desc: 'All chains gas prices' },
  { method: 'GET', url: '/api/gas-price/:chainId', desc: 'Specific chain gas price' },
  { method: 'GET', url: '/api/gas-price/:chainId/prediction', desc: 'Gas price prediction' },
  { method: 'GET', url: '/api/gas-price/:chainId/history?hours=24', desc: 'Historical gas data' },
  { method: 'GET', url: '/api/gas-price/:chainId/optimal', desc: 'Optimal transaction time' },
];

async function loadGasPrice(chainId: number) {
  try {
    const response = await fetch(`/api/gas-price/${chainId}`);
    const data = await response.json();
    if (data.success) {
      currentGas.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load gas price:', error);
  }
}

async function loadPrediction(chainId: number) {
  try {
    const response = await fetch(`/api/gas-price/${chainId}/prediction`);
    const data = await response.json();
    if (data.success) {
      prediction.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load prediction:', error);
  }
}

async function loadOptimalTime(chainId: number) {
  try {
    const response = await fetch(`/api/gas-price/${chainId}/optimal`);
    const data = await response.json();
    if (data.success) {
      optimalTime.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load optimal time:', error);
  }
}

async function loadHistory(hours: number) {
  historyHours.value = hours;
  try {
    const response = await fetch(`/api/gas-price/${selectedChain.value}/history?hours=${hours}`);
    const data = await response.json();
    if (data.success) {
      historyData.value = data.data;
      await nextTick();
      drawChart();
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function drawChart() {
  if (!chartCanvas.value || historyData.value.length === 0) return;

  const canvas = chartCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = canvas.offsetWidth;
  canvas.height = 200;

  const data = historyData.value;
  const width = canvas.width;
  const height = canvas.height;
  const padding = 30;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find min/max values
  const allValues = data.flatMap(d => [d.slow, d.normal, d.fast]);
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;

  const getX = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2);
  const getY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);

  // Draw grid lines
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * (height - padding * 2);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Draw slow line (blue)
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.slow);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw normal line (yellow)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.normal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw fast line (red)
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.fast);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw legend
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('Slow', width - 60, 15);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('Normal', width - 60, 30);
  ctx.fillStyle = '#f87171';
  ctx.fillText('Fast', width - 60, 45);
}

async function selectChain(chainId: number) {
  selectedChain.value = chainId;
  await refreshAll();
}

async function refreshAll() {
  loading.value = true;
  await Promise.all([
    loadGasPrice(selectedChain.value),
    loadPrediction(selectedChain.value),
    loadOptimalTime(selectedChain.value),
    loadHistory(historyHours.value),
  ]);
  loading.value = false;
}

onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.gas-price-api-dashboard {
  padding: 20px;
  background: #0d1117;
  min-height: 100vh;
  color: #e6edf3;
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

.btn-refresh {
  background: #238636;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover:not(:disabled) {
  background: #2ea043;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chain-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chain-btn {
  background: #21262d;
  color: #8b949e;
  border: 1px solid #30363d;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.chain-btn:hover {
  background: #30363d;
}

.chain-btn.active {
  background: #1f6feb;
  color: white;
  border-color: #1f6feb;
}

.gas-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.gas-card {
  background: #161b22;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid #30363d;
}

.gas-card.slow { border-left: 4px solid #4ade80; }
.gas-card.normal { border-left: 4px solid #fbbf24; }
.gas-card.fast { border-left: 4px solid #f87171; }

.card-label {
  font-size: 14px;
  color: #8b949e;
  margin-bottom: 8px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 4px;
}

.card-unit {
  font-size: 14px;
  color: #8b949e;
}

.card-time {
  font-size: 12px;
  color: #6e7681;
  margin-top: 8px;
}

.prediction-section, .optimal-section, .api-section, .history-section {
  background: #161b22;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.prediction-section h3, .optimal-section h3, .api-section h3, .history-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.prediction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.prediction-card {
  background: #21262d;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.pred-label {
  font-size: 12px;
  color: #8b949e;
  margin-bottom: 8px;
}

.pred-value {
  font-size: 18px;
  font-weight: bold;
}

.pred-value.rising { color: #f87171; }
.pred-value.falling { color: #4ade80; }
.pred-value.stable { color: #fbbf24; }

.optimal-card {
  background: #21262d;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.optimal-time {
  font-size: 28px;
  font-weight: bold;
  color: #58a6ff;
  margin-bottom: 12px;
}

.optimal-gas {
  font-size: 16px;
  color: #8b949e;
  margin-bottom: 8px;
}

.optimal-confidence {
  font-size: 14px;
  color: #6e7681;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 12px;
  padding: 12px;
  background: #21262d;
  border-radius: 6px;
  align-items: center;
}

.api-method {
  background: #238636;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  font-weight: bold;
}

.api-url {
  font-family: monospace;
  color: #58a6ff;
  font-size: 13px;
}

.api-desc {
  color: #8b949e;
  font-size: 12px;
}

.time-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.time-btn {
  background: #21262d;
  color: #8b949e;
  border: 1px solid #30363d;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.time-btn.active {
  background: #1f6feb;
  color: white;
  border-color: #1f6feb;
}

.chart-container {
  background: #21262d;
  border-radius: 8px;
  padding: 16px;
}

.chart-container canvas {
  width: 100%;
  height: 200px;
}

.no-data {
  text-align: center;
  color: #8b949e;
  padding: 40px;
}
</style>
