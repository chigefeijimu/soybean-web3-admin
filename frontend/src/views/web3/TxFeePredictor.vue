<template>
  <div class="tx-fee-predictor">
    <div class="header">
      <h2>🔮 Transaction Fee Predictor</h2>
      <p>AI-driven fee prediction and optimal transaction timing</p>
    </div>

    <!-- Chain Selection -->
    <div class="section">
      <h3>Select Chain</h3>
      <div class="chain-grid">
        <div
          v-for="chain in chains"
          :key="chain.id"
          class="chain-card"
          :class="{ active: selectedChain === chain.id }"
          :style="{ borderColor: selectedChain === chain.id ? chain.color : 'transparent' }"
          @click="selectChain(chain.id)"
        >
          <span class="chain-icon" :style="{ backgroundColor: chain.color }"></span>
          <span class="chain-name">{{ chain.name }}</span>
        </div>
      </div>
    </div>

    <!-- Transaction Type -->
    <div class="section">
      <h3>Transaction Type</h3>
      <div class="tx-type-grid">
        <div
          v-for="type in txTypes"
          :key="type.id"
          class="tx-type-card"
          :class="{ active: selectedTxType === type.id }"
          @click="selectTxType(type.id)"
        >
          <span class="tx-type-name">{{ type.name }}</span>
          <span class="tx-type-gas">~{{ type.baseGasLimit.toLocaleString() }} gas</span>
        </div>
      </div>
    </div>

    <!-- Current Fee & Prediction -->
    <div class="section" v-if="prediction">
      <h3>📊 Fee Prediction</h3>
      <div class="prediction-grid">
        <div class="prediction-card current">
          <div class="card-label">Current Gas Price</div>
          <div class="card-value">{{ prediction.current.toFixed(2) }} <span class="unit">gwei</span></div>
        </div>
        <div class="prediction-card">
          <div class="card-label">Trend</div>
          <div class="card-value trend" :class="prediction.trend">
            {{ prediction.trend === 'rising' ? '📈 Rising' : prediction.trend === 'falling' ? '📉 Falling' : '➡️ Stable' }}
          </div>
        </div>
        <div class="prediction-card">
          <div class="card-label">Confidence</div>
          <div class="card-value">{{ prediction.confidence }}%</div>
        </div>
        <div class="prediction-card optimal">
          <div class="card-label">⏰ Optimal Time</div>
          <div class="card-value">{{ prediction.optimalTime }}</div>
        </div>
      </div>

      <!-- Predicted Fees -->
      <div class="predicted-fees">
        <h4>Predicted Gas Prices</h4>
        <div class="predicted-grid">
          <div class="predicted-item">
            <span class="time-label">1h</span>
            <span class="predicted-value">{{ prediction.predicted['1h'].toFixed(2) }} gwei</span>
          </div>
          <div class="predicted-item">
            <span class="time-label">4h</span>
            <span class="predicted-value">{{ prediction.predicted['4h'].toFixed(2) }} gwei</span>
          </div>
          <div class="predicted-item">
            <span class="time-label">12h</span>
            <span class="predicted-value">{{ prediction.predicted['12h'].toFixed(2) }} gwei</span>
          </div>
          <div class="predicted-item">
            <span class="time-label">24h</span>
            <span class="predicted-value">{{ prediction.predicted['24h'].toFixed(2) }} gwei</span>
          </div>
        </div>
      </div>

      <!-- Savings -->
      <div class="savings-card" v-if="prediction.savings.potential > 0">
        <div class="savings-icon">💰</div>
        <div class="savings-content">
          <div class="savings-title">Potential Savings</div>
          <div class="savings-value">{{ prediction.savings.potential.toLocaleString() }} gas ({{ prediction.savings.percentage }}%)</div>
          <div class="savings-note">Wait until {{ prediction.optimalTime }} for lower fees</div>
        </div>
      </div>
    </div>

    <!-- Gas Recommendations -->
    <div class="section" v-if="recommendations">
      <h3>⛽ Gas Speed Recommendations</h3>
      <div class="recommendation-grid">
        <div class="recommendation-card slow">
          <div class="rec-header">
            <span class="rec-speed">🐢 Slow</span>
            <span class="rec-time">~10-30 min</span>
          </div>
          <div class="rec-gas">{{ recommendations.slow.gasPrice.toFixed(2) }} gwei</div>
          <div class="rec-savings">Save {{ recommendations.slow.savings }}%</div>
        </div>
        <div class="recommendation-card normal">
          <div class="rec-header">
            <span class="rec-speed">🚗 Normal</span>
            <span class="rec-time">~1-5 min</span>
          </div>
          <div class="rec-gas">{{ recommendations.normal.gasPrice.toFixed(2) }} gwei</div>
          <div class="rec-savings">Standard</div>
        </div>
        <div class="recommendation-card fast">
          <div class="rec-header">
            <span class="rec-speed">🚀 Fast</span>
            <span class="rec-time">< 1 min</span>
          </div>
          <div class="rec-gas">{{ recommendations.fast.gasPrice.toFixed(2) }} gwei</div>
          <div class="rec-savings">Priority</div>
        </div>
      </div>
    </div>

    <!-- Historical Chart -->
    <div class="section">
      <h3>📈 Historical Gas Prices</h3>
      <div class="time-range-selector">
        <button
          v-for="range in timeRanges"
          :key="range"
          class="range-btn"
          :class="{ active: selectedTimeRange === range }"
          @click="selectTimeRange(range)"
        >
          {{ range }}
        </button>
      </div>
      <div class="chart-container" v-if="historicalData.data">
        <div class="chart-bars">
          <div
            v-for="(point, index) in historicalData.data.slice(-24)"
            :key="index"
            class="chart-bar"
            :style="{ height: (point.gasPrice / maxGasPrice * 100) + '%' }"
            :title="`${point.date}: ${point.gasPrice} gwei`"
          ></div>
        </div>
        <div class="chart-stats">
          <div class="stat">
            <span class="stat-label">Average</span>
            <span class="stat-value">{{ historicalData.statistics?.average?.toFixed(2) }} gwei</span>
          </div>
          <div class="stat">
            <span class="stat-label">Min</span>
            <span class="stat-value min">{{ historicalData.statistics?.minimum?.toFixed(2) }} gwei</span>
          </div>
          <div class="stat">
            <span class="stat-label">Max</span>
            <span class="stat-value max">{{ historicalData.statistics?.maximum?.toFixed(2) }} gwei</span>
          </div>
          <div class="stat">
            <span class="stat-label">Volatility</span>
            <span class="stat-value">{{ historicalData.statistics?.volatility }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chain Comparison -->
    <div class="section">
      <h3>🌐 Cross-chain Fee Comparison</h3>
      <div class="comparison-chains">
        <div
          v-for="chain in comparisonChains"
          :key="chain.id"
          class="comparison-checkbox"
          :class="{ active: selectedComparisonChains.includes(chain.id) }"
          @click="toggleComparisonChain(chain.id)"
        >
          <span class="chain-dot" :style="{ backgroundColor: chain.color }"></span>
          {{ chain.name }}
        </div>
      </div>
      <button class="compare-btn" @click="compareFees" :disabled="selectedComparisonChains.length < 2">
        Compare Fees
      </button>
      <div class="comparison-results" v-if="comparisonResult">
        <div class="result-card" v-for="chain in comparisonResult.chains" :key="chain.chain">
          <div class="result-header">
            <span class="result-chain" :style="{ color: chain.color }">{{ chain.chainName }}</span>
            <span class="result-symbol">{{ chain.symbol }}</span>
          </div>
          <div class="result-fee">{{ chain.estimatedFee.toLocaleString() }} gas</div>
          <div class="result-usd">~${{ chain.estimatedFeeUSD.toFixed(2) }}</div>
        </div>
        <div class="recommendation-badge" v-if="comparisonResult.recommendations.cheapest">
          <span class="badge-label">🏆 Cheapest</span>
          <span class="badge-value">{{ comparisonResult.recommendations.cheapest.chainName }}</span>
        </div>
      </div>
    </div>

    <!-- Alert Section -->
    <div class="section">
      <h3>🔔 Fee Alert</h3>
      <div class="alert-form">
        <input
          v-model.number="alertThreshold"
          type="number"
          placeholder="Threshold (gwei)"
          class="alert-input"
        />
        <button class="alert-btn" @click="checkAlert">Check Alert</button>
      </div>
      <div class="alert-result" v-if="alertResult" :class="{ success: alertResult.isBelowThreshold, warning: !alertResult.isBelowThreshold }">
        {{ alertResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { http } from '@/utils/http';

const chains = ref([
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', color: '#FF0420' },
  { id: 'bsc', name: 'BNB Chain', color: '#F3BA2F' },
  { id: 'base', name: 'Base', color: '#0052FF' },
  { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
]);

const txTypes = ref([
  { id: 'eth_transfer', name: 'ETH Transfer', baseGasLimit: 21000 },
  { id: 'erc20_transfer', name: 'ERC20 Transfer', baseGasLimit: 65000 },
  { id: 'swap', name: 'DEX Swap', baseGasLimit: 150000 },
  { id: 'nft_transfer', name: 'NFT Transfer', baseGasLimit: 85000 },
  { id: 'contract_deploy', name: 'Contract Deploy', baseGasLimit: 2000000 },
  { id: 'staking', name: 'Staking', baseGasLimit: 100000 },
  { id: 'bridge', name: 'Bridge', baseGasLimit: 200000 },
]);

const timeRanges = ['1h', '4h', '12h', '24h', '7d'];

const selectedChain = ref('ethereum');
const selectedTxType = ref('swap');
const selectedTimeRange = ref('24h');
const selectedComparisonChains = ref(['ethereum', 'polygon']);
const alertThreshold = ref(30);

const prediction = ref(null);
const recommendations = ref(null);
const historicalData = ref({});
const comparisonResult = ref(null);
const alertResult = ref(null);

const comparisonChains = computed(() => chains.value);

const maxGasPrice = computed(() => {
  if (!historicalData.value.data) return 100;
  const prices = historicalData.value.data.map(d => d.gasPrice);
  return Math.max(...prices, 100);
});

const selectChain = async (chainId) => {
  selectedChain.value = chainId;
  await Promise.all([fetchPrediction(), fetchRecommendations(), fetchHistorical()]);
};

const selectTxType = async (typeId) => {
  selectedTxType.value = typeId;
  await fetchPrediction();
};

const selectTimeRange = async (range) => {
  selectedTimeRange.value = range;
  await fetchHistorical();
};

const toggleComparisonChain = (chainId) => {
  const index = selectedComparisonChains.value.indexOf(chainId);
  if (index > -1) {
    if (selectedComparisonChains.value.length > 1) {
      selectedComparisonChains.value.splice(index, 1);
    }
  } else {
    selectedComparisonChains.value.push(chainId);
  }
};

const fetchPrediction = async () => {
  try {
    const response = await http.post('/api/fee-predictor/predict', {
      chain: selectedChain.value,
      transactionType: selectedTxType.value,
    });
    prediction.value = response.data;
  } catch (error) {
    console.error('Failed to fetch prediction:', error);
  }
};

const fetchRecommendations = async () => {
  try {
    const response = await http.get('/api/fee-predictor/recommendations', {
      params: { chain: selectedChain.value },
    });
    recommendations.value = response.data.recommendations;
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
  }
};

const fetchHistorical = async () => {
  try {
    const response = await http.get('/api/fee-predictor/historical', {
      params: {
        chain: selectedChain.value,
        timeRange: selectedTimeRange.value,
      },
    });
    historicalData.value = response.data;
  } catch (error) {
    console.error('Failed to fetch historical:', error);
  }
};

const compareFees = async () => {
  try {
    const response = await http.post('/api/fee-predictor/compare', {
      chains: selectedComparisonChains.value,
      transactionType: selectedTxType.value,
    });
    comparisonResult.value = response.data;
  } catch (error) {
    console.error('Failed to compare fees:', error);
  }
};

const checkAlert = async () => {
  try {
    const response = await http.post('/api/fee-predictor/alert', {
      chain: selectedChain.value,
      thresholdGwei: alertThreshold.value,
    });
    alertResult.value = response.data;
  } catch (error) {
    console.error('Failed to check alert:', error);
  }
};

onMounted(async () => {
  await Promise.all([fetchPrediction(), fetchRecommendations(), fetchHistorical()]);
});
</script>

<style scoped>
.tx-fee-predictor {
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

.section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.section h4 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

/* Chain Grid */
.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.chain-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
}

.chain-card:hover {
  background: #e9ecef;
}

.chain-card.active {
  background: #e7f5ff;
}

.chain-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.chain-name {
  font-size: 14px;
  font-weight: 500;
}

/* Transaction Type */
.tx-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.tx-type-card {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
  text-align: center;
}

.tx-type-card:hover {
  background: #e9ecef;
}

.tx-type-card.active {
  background: #e7f5ff;
  border: 2px solid #3498db;
}

.tx-type-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.tx-type-gas {
  font-size: 12px;
  color: #666;
}

/* Prediction */
.prediction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.prediction-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.prediction-card.current {
  background: #e7f5ff;
}

.prediction-card.optimal {
  background: #d4edda;
}

.card-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
}

.card-value .unit {
  font-size: 14px;
  color: #666;
}

.predicted-fees {
  margin-top: 20px;
}

.predicted-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.predicted-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.time-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.predicted-value {
  font-size: 16px;
  font-weight: 500;
}

/* Savings */
.savings-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #d4edda;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
}

.savings-icon {
  font-size: 32px;
}

.savings-title {
  font-size: 14px;
  color: #155724;
}

.savings-value {
  font-size: 18px;
  font-weight: 600;
  color: #155724;
}

.savings-note {
  font-size: 12px;
  color: #666;
}

/* Recommendations */
.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.recommendation-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.recommendation-card.slow {
  background: #e8f5e9;
}

.recommendation-card.normal {
  background: #e3f2fd;
}

.recommendation-card.fast {
  background: #fff3e0;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.rec-speed {
  font-weight: 500;
}

.rec-time {
  font-size: 12px;
  color: #666;
}

.rec-gas {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.rec-savings {
  font-size: 12px;
  color: #666;
}

/* Historical Chart */
.time-range-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.range-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

.range-btn.active {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}

.chart-container {
  height: 200px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 150px;
  gap: 2px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #3498db, #5dade2);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.chart-bar:hover {
  opacity: 0.7;
}

.chart-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.stat-value.min {
  color: #27ae60;
}

.stat-value.max {
  color: #e74c3c;
}

/* Comparison */
.comparison-chains {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.comparison-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 13px;
}

.comparison-checkbox.active {
  background: #e7f5ff;
}

.chain-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.compare-btn {
  padding: 10px 24px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.compare-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comparison-results {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 20px;
}

.result-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  min-width: 150px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-chain {
  font-weight: 600;
}

.result-symbol {
  font-size: 12px;
  color: #666;
}

.result-fee {
  font-size: 18px;
  font-weight: 600;
}

.result-usd {
  font-size: 14px;
  color: #666;
}

.recommendation-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #d4edda;
  padding: 16px;
  border-radius: 8px;
}

.badge-label {
  font-size: 12px;
  color: #155724;
}

.badge-value {
  font-size: 18px;
  font-weight: 600;
  color: #155724;
}

/* Alert */
.alert-form {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.alert-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.alert-btn {
  padding: 10px 24px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.alert-result {
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.alert-result.success {
  background: #d4edda;
  color: #155724;
}

.alert-result.warning {
  background: #fff3cd;
  color: #856404;
}

.trend.rising {
  color: #e74c3c;
}

.trend.falling {
  color: #27ae60;
}

.trend.stable {
  color: #3498db;
}
</style>
