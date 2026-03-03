<template>
  <div class="pool-deep-analytics">
    <div class="header">
      <h2>🔬 Liquidity Pool Deep Analytics</h2>
      <p>Advanced pool analysis with depth, IL calculations, and efficiency metrics</p>
    </div>

    <!-- Pool Selection -->
    <div class="pool-selection card">
      <h3>📊 Pool Analysis</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Token Pair</label>
          <select v-model="selectedPair" @change="loadPoolData">
            <option value="USDC-WETH">USDC/WETH</option>
            <option value="WBTC-WETH">WBTC/WETH</option>
            <option value="DAI-WETH">DAI/WETH</option>
            <option value="USDT-WETH">USDT/WETH</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fee Tier</label>
          <select v-model="feeTier">
            <option :value="100">0.01% (Stable)</option>
            <option :value="500">0.05% (Stable)</option>
            <option :value="3000">0.3% (Volatile)</option>
            <option :value="10000">1% (Exotic)</option>
          </select>
        </div>
        <button class="btn-primary" @click="loadPoolData" :disabled="loading">
          {{ loading ? 'Loading...' : 'Analyze Pool' }}
        </button>
      </div>
    </div>

    <!-- Dashboard Overview -->
    <div class="dashboard-grid" v-if="dashboardData">
      <div class="stat-card">
        <div class="stat-label">Total TVL</div>
        <div class="stat-value">{{ dashboardData.marketStats.totalTVL }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">24h Volume</div>
        <div class="stat-value">{{ dashboardData.marketStats.totalVolume24h }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average APR</div>
        <div class="stat-value">{{ dashboardData.marketStats.avgAPR }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pool Count</div>
        <div class="stat-value">{{ dashboardData.marketStats.poolCount.toLocaleString() }}</div>
      </div>
    </div>

    <!-- Analysis Tabs -->
    <div class="analysis-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Pool Depth Analysis -->
    <div v-if="activeTab === 'depth'" class="analysis-content card">
      <h3>📈 Pool Depth Analysis</h3>
      <div v-if="poolDepth" class="depth-analysis">
        <div class="depth-stats">
          <div class="stat-item">
            <span class="label">Current Price:</span>
            <span class="value">${{ poolDepth.currentPrice }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Depth Score:</span>
            <span :class="['value', getScoreClass(poolDepth.depthScore)]">
              {{ poolDepth.depthScore }}/100
            </span>
          </div>
          <div class="stat-item">
            <span class="label">Spread:</span>
            <span class="value">{{ poolDepth.spread }}%</span>
          </div>
        </div>
        
        <!-- Depth Chart -->
        <div class="depth-chart">
          <div class="chart-title">Liquidity Distribution</div>
          <div class="chart-container">
            <div 
              v-for="(point, index) in poolDepth.depthPoints" 
              :key="index"
              class="depth-bar"
              :style="{ height: getBarHeight(point.liquidity) + '%' }"
              :title="`Price: $${point.price}, Liquidity: ${formatNumber(point.liquidity)}`"
            >
              <span class="bar-price">${{ parseFloat(point.price).toFixed(0) }}</span>
            </div>
          </div>
        </div>

        <div class="liquidity-summary">
          <div class="summary-item">
            <span class="label">Token0 Liquidity:</span>
            <span class="value">{{ formatNumber(poolDepth.totalToken0Liquidity) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Token1 Liquidity:</span>
            <span class="value">{{ formatNumber(poolDepth.totalToken1Liquidity) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Impermanent Loss Calculator -->
    <div v-if="activeTab === 'il'" class="analysis-content card">
      <h3>⚠️ Impermanent Loss Calculator</h3>
      <div class="il-calculator">
        <div class="form-row">
          <div class="form-group">
            <label>Token0 Amount</label>
            <input type="number" v-model="ilInput.token0Amount" placeholder="e.g., 10000" />
          </div>
          <div class="form-group">
            <label>Token1 Amount</label>
            <input type="number" v-model="ilInput.token1Amount" placeholder="e.g., 5" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Initial Price ($)</label>
            <input type="number" v-model="ilInput.initialPrice" placeholder="e.g., 2000" />
          </div>
          <div class="form-group">
            <label>Current Price ($)</label>
            <input type="number" v-model="ilInput.currentPrice" placeholder="e.g., 2500" />
          </div>
          <button class="btn-primary" @click="calculateIL">Calculate IL</button>
        </div>

        <div v-if="ilResult" class="il-result" :class="ilResult.severity">
          <div class="il-header">
            <h4>Impermanent Loss Result</h4>
            <span class="severity-badge">{{ ilResult.severity.toUpperCase() }}</span>
          </div>
          <div class="il-details">
            <div class="detail-item">
              <span class="label">Price Change:</span>
              <span :class="['value', ilResult.priceChange >= 0 ? 'positive' : 'negative']">
                {{ ilResult.priceChange >= 0 ? '+' : '' }}{{ ilResult.priceChange }}%
              </span>
            </div>
            <div class="detail-item">
              <span class="label">IL Amount:</span>
              <span class="value">${{ ilResult.ilAmount }}</span>
            </div>
            <div class="detail-item">
              <span class="label">IL Percentage:</span>
              <span class="value">{{ ilResult.ilPercentage }}%</span>
            </div>
          </div>
          <div class="il-explanation">
            <p v-if="ilResult.severity === 'none'">No impermanent loss. Price is unchanged.</p>
            <p v-else-if="ilResult.severity === 'low'">Low impermanent loss. Acceptable for most strategies.</p>
            <p v-else-if="ilResult.severity === 'medium'">Medium impermanent loss. Consider wider price range.</p>
            <p v-else-if="ilResult.severity === 'high'">High impermanent loss. Significant deviation from initial price.</p>
            <p v-else>Extreme impermanent loss. Consider exiting position.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Range Order Recommendation -->
    <div v-if="activeTab === 'range'" class="analysis-content card">
      <h3>🎯 Range Order Recommendations</h3>
      <div class="range-calculator">
        <div class="form-row">
          <div class="form-group">
            <label>Current Price ($)</label>
            <input type="number" v-model="rangeInput.currentPrice" placeholder="e.g., 2500" />
          </div>
          <div class="form-group">
            <label>Volatility</label>
            <select v-model="rangeInput.volatility">
              <option value="low">Low (Stable pairs)</option>
              <option value="medium">Medium (Normal)</option>
              <option value="high">High (Volatile)</option>
            </select>
          </div>
          <button class="btn-primary" @click="getRangeRecommendation">Get Recommendation</button>
        </div>

        <div v-if="rangeRecommendation" class="range-result">
          <div class="range-header">
            <span :class="['type-badge', rangeRecommendation.type]">
              {{ rangeRecommendation.type.toUpperCase() }}
            </span>
            <span :class="['risk-badge', rangeRecommendation.risk]">
              {{ rangeRecommendation.risk.toUpperCase() }} RISK
            </span>
          </div>
          <div class="range-details">
            <div class="detail-item">
              <span class="label">Lower Price:</span>
              <span class="value">${{ rangeRecommendation.lowerPrice }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Upper Price:</span>
              <span class="value">${{ rangeRecommendation.upperPrice }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Expected Return:</span>
              <span class="value positive">{{ rangeRecommendation.expectedReturn }}</span>
            </div>
          </div>
          <div class="reasoning">
            <strong>Analysis:</strong> {{ rangeRecommendation.reasoning }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pool Efficiency -->
    <div v-if="activeTab === 'efficiency'" class="analysis-content card">
      <h3>⚡ Pool Efficiency Metrics</h3>
      <div v-if="efficiencyData" class="efficiency-dashboard">
        <div class="efficiency-score" :class="efficiencyData.rating">
          <div class="score-circle">
            <span class="score">{{ efficiencyData.overallScore }}</span>
            <span class="label">/ 100</span>
          </div>
          <div class="rating">{{ efficiencyData.rating.toUpperCase() }}</div>
        </div>
        
        <div class="efficiency-factors">
          <div class="factor-item">
            <span class="label">TVL/Volume Ratio</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: (efficiencyData.tvlToVolumeRatio * 100) + '%' }"></div>
            </div>
            <span class="value">{{ efficiencyData.tvlToVolumeRatio }}</span>
          </div>
          <div class="factor-item">
            <span class="label">Utilization Rate</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: (efficiencyData.utilizationRate * 100) + '%' }"></div>
            </div>
            <span class="value">{{ (efficiencyData.utilizationRate * 100).toFixed(0) }}%</span>
          </div>
          <div class="factor-item">
            <span class="label">Fee Efficiency</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: (efficiencyData.feeEfficiency * 100) + '%' }"></div>
            </div>
            <span class="value">{{ (efficiencyData.feeEfficiency * 100).toFixed(0) }}%</span>
          </div>
          <div class="factor-item">
            <span class="label">Concentration Score</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: (efficiencyData.concentrationScore * 100) + '%' }"></div>
            </div>
            <span class="value">{{ (efficiencyData.concentrationScore * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Price Impact -->
    <div v-if="activeTab === 'impact'" class="analysis-content card">
      <h3>💰 Price Impact Calculator</h3>
      <div class="impact-calculator">
        <div class="form-row">
          <div class="form-group">
            <label>Token In</label>
            <select v-model="impactInput.tokenIn">
              <option value="token0">Token0</option>
              <option value="token1">Token1</option>
            </select>
          </div>
          <div class="form-group">
            <label>Amount In</label>
            <input type="number" v-model="impactInput.amountIn" placeholder="e.g., 10000" />
          </div>
          <button class="btn-primary" @click="calculateImpact">Calculate Impact</button>
        </div>

        <div v-if="priceImpact" class="impact-result">
          <div class="impact-grid">
            <div class="impact-item">
              <span class="label">Input Amount</span>
              <span class="value">{{ priceImpact.inputAmount }}</span>
            </div>
            <div class="impact-item">
              <span class="label">Output Amount</span>
              <span class="value">{{ priceImpact.outputAmount }}</span>
            </div>
            <div class="impact-item">
              <span class="label">Price Impact</span>
              <span :class="['value', priceImpact.priceImpactPercentage > 1 ? 'negative' : 'positive']">
                {{ priceImpact.priceImpactPercentage }}%
              </span>
            </div>
            <div class="impact-item">
              <span class="label">Slippage</span>
              <span class="value">{{ (priceImpact.slippage * 100).toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historical IL -->
    <div v-if="activeTab === 'history'" class="analysis-content card">
      <h3>📜 Historical Impermanent Loss</h3>
      <div class="history-controls">
        <div class="form-group">
          <label>Time Period</label>
          <select v-model="historyDays" @change="loadHistoricalIL">
            <option :value="7">7 Days</option>
            <option :value="30">30 Days</option>
            <option :value="90">90 Days</option>
          </select>
        </div>
        <button class="btn-primary" @click="loadHistoricalIL">Load Data</button>
      </div>
      
      <div v-if="historicalIL.length > 0" class="history-chart">
        <div class="chart-container">
          <div 
            v-for="(point, index) in historicalIL" 
            :key="index"
            class="history-point"
            :class="{ negative: point.il < 0 }"
            :style="{ height: Math.abs(point.il) * 3 + 'px' }"
            :title="`IL: ${point.il}%`"
          ></div>
        </div>
      </div>
    </div>

    <!-- Pool Comparison -->
    <div v-if="activeTab === 'compare'" class="analysis-content card">
      <h3>⚖️ Pool Comparison</h3>
      <div class="compare-section">
        <div class="form-group">
          <label>Pool Addresses (comma separated)</label>
          <input 
            type="text" 
            v-model="compareAddresses" 
            placeholder="0x..., 0x..., 0x..."
          />
        </div>
        <button class="btn-primary" @click="comparePools">Compare Pools</button>
      </div>

      <div v-if="compareResult" class="compare-result">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Pool</th>
              <th>TVL</th>
              <th>24h Volume</th>
              <th>APR</th>
              <th>Efficiency</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pool in compareResult.pools" :key="pool.address">
              <td>{{ shortenAddress(pool.address) }}</td>
              <td>{{ pool.tvl }}</td>
              <td>{{ pool.volume24h }}</td>
              <td>{{ pool.apr }}</td>
              <td>{{ pool.efficiencyScore }}</td>
              <td>{{ pool.healthScore }}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="compare-winners">
          <h4>🏆 Winners</h4>
          <div class="winner-item">
            <span class="label">Highest TVL:</span>
            <span class="value">{{ shortenAddress(compareResult.comparison.tvlWinner) }}</span>
          </div>
          <div class="winner-item">
            <span class="label">Highest Volume:</span>
            <span class="value">{{ shortenAddress(compareResult.comparison.volumeWinner) }}</span>
          </div>
          <div class="winner-item">
            <span class="label">Best APR:</span>
            <span class="value">{{ shortenAddress(compareResult.comparison.aprWinner) }}</span>
          </div>
          <div class="winner-item">
            <span class="label">Most Efficient:</span>
            <span class="value">{{ shortenAddress(compareResult.comparison.efficiencyWinner) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pool Health -->
    <div v-if="activeTab === 'health'" class="analysis-content card">
      <h3>🏥 Pool Health Score</h3>
      <div v-if="healthData" class="health-dashboard">
        <div class="health-score" :class="healthData.rating">
          <div class="score-circle large">
            <span class="score">{{ healthData.score }}</span>
            <span class="label">/ 100</span>
          </div>
          <div class="rating">{{ healthData.rating.toUpperCase() }}</div>
        </div>

        <div class="health-factors">
          <div class="factor-row">
            <span class="label">Liquidity</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: healthData.factors.liquidity + '%' }"></div>
            </div>
            <span class="value">{{ healthData.factors.liquidity }}</span>
          </div>
          <div class="factor-row">
            <span class="label">Volume</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: healthData.factors.volume + '%' }"></div>
            </div>
            <span class="value">{{ healthData.factors.volume }}</span>
          </div>
          <div class="factor-row">
            <span class="label">Concentration</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: healthData.factors.concentration + '%' }"></div>
            </div>
            <span class="value">{{ healthData.factors.concentration }}</span>
          </div>
          <div class="factor-row">
            <span class="label">Fees</span>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: healthData.factors.fees + '%' }"></div>
            </div>
            <span class="value">{{ healthData.factors.fees }}</span>
          </div>
        </div>

        <div class="recommendations">
          <h4>💡 Recommendations</h4>
          <ul>
            <li v-for="(rec, index) in healthData.recommendations" :key="index">
              {{ rec }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { PoolDeepAnalytics } from './service/api';

const loading = ref(false);
const activeTab = ref('depth');
const dashboardData = ref(null);
const poolDepth = ref(null);
const efficiencyData = ref(null);
const ilResult = ref(null);
const rangeRecommendation = ref(null);
const priceImpact = ref(null);
const historicalIL = ref([]);
const compareResult = ref(null);
const healthData = ref(null);

const selectedPair = ref('USDC-WETH');
const feeTier = ref(3000);
const historyDays = ref(30);
const compareAddresses = ref('');

const ilInput = reactive({
  token0Amount: 10000,
  token1Amount: 5,
  initialPrice: 2000,
  currentPrice: 2500,
});

const rangeInput = reactive({
  currentPrice: 2500,
  volatility: 'medium',
});

const impactInput = reactive({
  tokenIn: 'token0',
  amountIn: 10000,
});

const tabs = [
  { id: 'depth', name: 'Pool Depth', icon: '📊' },
  { id: 'il', name: 'IL Calculator', icon: '⚠️' },
  { id: 'range', name: 'Range Order', icon: '🎯' },
  { id: 'efficiency', name: 'Efficiency', icon: '⚡' },
  { id: 'impact', name: 'Price Impact', icon: '💰' },
  { id: 'history', name: 'Historical IL', icon: '📜' },
  { id: 'compare', name: 'Compare', icon: '⚖️' },
  { id: 'health', name: 'Health', icon: '🏥' },
];

// Token mappings
const tokenPairs = {
  'USDC-WETH': {
    token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'WBTC-WETH': {
    token0: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'DAI-WETH': {
    token0: '0x6b175474e89094c44da98b954eedeac495271d0f',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'USDT-WETH': {
    token0: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
};

const loadDashboard = async () => {
  try {
    const response = await PoolDeepAnalytics.getDashboard();
    dashboardData.value = response;
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
};

const loadPoolData = async () => {
  loading.value = true;
  try {
    const pair = tokenPairs[selectedPair.value];
    
    // Load depth
    const depthResponse = await PoolDeepAnalytics.getPoolDepth(
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      pair.token0,
      pair.token1,
      10
    );
    poolDepth.value = depthResponse;
    
    // Load efficiency
    const effResponse = await PoolDeepAnalytics.getPoolEfficiency(
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
    );
    efficiencyData.value = effResponse;
    
    // Load health
    const healthResponse = await PoolDeepAnalytics.getPoolHealthScore(
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
    );
    healthData.value = healthResponse;
    
    // Load historical IL
    await loadHistoricalIL();
    
  } catch (error) {
    console.error('Failed to load pool data:', error);
  } finally {
    loading.value = false;
  }
};

const calculateIL = async () => {
  try {
    const response = await PoolDeepAnalytics.calculateImpermanentLoss(
      ilInput.token0Amount,
      ilInput.token1Amount,
      ilInput.initialPrice,
      ilInput.currentPrice
    );
    ilResult.value = response;
  } catch (error) {
    console.error('Failed to calculate IL:', error);
  }
};

const getRangeRecommendation = async () => {
  try {
    const pair = tokenPairs[selectedPair.value];
    const response = await PoolDeepAnalytics.getRangeOrderRecommendation(
      pair.token0,
      pair.token1,
      rangeInput.currentPrice,
      rangeInput.volatility
    );
    rangeRecommendation.value = response;
  } catch (error) {
    console.error('Failed to get recommendation:', error);
  }
};

const calculateImpact = async () => {
  try {
    const response = await PoolDeepAnalytics.calculatePriceImpact(
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      impactInput.tokenIn,
      impactInput.amountIn
    );
    priceImpact.value = response;
  } catch (error) {
    console.error('Failed to calculate impact:', error);
  }
};

const loadHistoricalIL = async () => {
  try {
    const pair = tokenPairs[selectedPair.value];
    const response = await PoolDeepAnalytics.getHistoricalIL(
      pair.token0,
      pair.token1,
      historyDays.value
    );
    historicalIL.value = response;
  } catch (error) {
    console.error('Failed to load historical IL:', error);
  }
};

const comparePools = async () => {
  try {
    const addresses = compareAddresses.value.split(',').map(a => a.trim()).filter(a => a);
    if (addresses.length < 2) {
      alert('Please enter at least 2 pool addresses');
      return;
    }
    const response = await PoolDeepAnalytics.comparePools(addresses);
    compareResult.value = response;
  } catch (error) {
    console.error('Failed to compare pools:', error);
  }
};

// Utility functions
const formatNumber = (num) => {
  if (!num) return '0';
  const n = parseFloat(num);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
};

const getBarHeight = (liquidity) => {
  if (!poolDepth.value) return 0;
  const maxLiquidity = Math.max(...poolDepth.value.depthPoints.map(p => parseFloat(p.liquidity)));
  return (parseFloat(liquidity) / maxLiquidity) * 100;
};

const getScoreClass = (score) => {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'fair';
  return 'poor';
};

const shortenAddress = (addr) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

// Initialize
loadDashboard();
loadPoolData();
</script>

<style scoped>
.pool-deep-analytics {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #1a1a2e;
}

.header p {
  margin: 0;
  color: #666;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-group input,
.form-group select {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 160px;
}

.btn-primary {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.analysis-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #4f46e5;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #e5e7eb;
}

.depth-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .label {
  font-size: 13px;
  color: #666;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 600;
}

.stat-item .value.excellent { color: #10b981; }
.stat-item .value.good { color: #3b82f6; }
.stat-item .value.fair { color: #f59e0b; }
.stat-item .value.poor { color: #ef4444; }

.depth-chart {
  margin: 20px 0;
}

.chart-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 4px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
}

.depth-bar {
  flex: 1;
  background: linear-gradient(to top, #6366f1, #8b5cf6);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  position: relative;
  transition: height 0.3s;
}

.bar-price {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.liquidity-summary {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  gap: 8px;
}

.summary-item .label {
  color: #666;
}

.summary-item .value {
  font-weight: 600;
}

.il-calculator,
.range-calculator,
.impact-calculator {
  margin-top: 16px;
}

.il-result {
  margin-top: 20px;
  padding: 20px;
  border-radius: 12px;
  background: #f9fafb;
}

.il-result.none { border-left: 4px solid #10b981; }
.il-result.low { border-left: 4px solid #3b82f6; }
.il-result.medium { border-left: 4px solid #f59e0b; }
.il-result.high { border-left: 4px solid #f97316; }
.il-result.extreme { border-left: 4px solid #ef4444; }

.il-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.severity-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.il-result.none .severity-badge { background: #d1fae5; color: #065f46; }
.il-result.low .severity-badge { background: #dbeafe; color: #1e40af; }
.il-result.medium .severity-badge { background: #fef3c7; color: #92400e; }
.il-result.high .severity-badge { background: #ffedd5; color: #c2410c; }
.il-result.extreme .severity-badge { background: #fee2e2; color: #991b1b; }

.il-details {
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
  font-size: 13px;
  color: #666;
}

.detail-item .value {
  font-size: 18px;
  font-weight: 600;
}

.detail-item .value.positive { color: #10b981; }
.detail-item .value.negative { color: #ef4444; }

.il-explanation {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.il-explanation p {
  margin: 0;
  color: #374151;
}

.range-result,
.impact-result {
  margin-top: 20px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.range-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.type-badge,
.risk-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge.buy { background: #d1fae5; color: #065f46; }
.type-badge.sell { background: #fee2e2; color: #991b1b; }
.type-badge.neutral { background: #dbeafe; color: #1e40af; }

.risk-badge.low { background: #d1fae5; color: #065f46; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fee2e2; color: #991b1b; }

.range-details,
.impact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.reasoning {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.efficiency-dashboard {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
}

.efficiency-score {
  text-align: center;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  background: #f3f4f6;
}

.score-circle.large {
  width: 160px;
  height: 160px;
}

.efficiency-score.excellent .score-circle { background: #d1fae5; }
.efficiency-score.good .score-circle { background: #dbeafe; }
.efficiency-score.fair .score-circle { background: #fef3c7; }
.efficiency-score.poor .score-circle { background: #fee2e2; }

.score-circle .score {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
}

.score-circle.large .score {
  font-size: 48px;
}

.score-circle .label {
  font-size: 14px;
  color: #666;
}

.efficiency-score .rating {
  font-size: 18px;
  font-weight: 600;
}

.efficiency-score.excellent .rating { color: #10b981; }
.efficiency-score.good .rating { color: #3b82f6; }
.efficiency-score.fair .rating { color: #f59e0b; }
.efficiency-score.poor .rating { color: #ef4444; }

.efficiency-factors {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.factor-item,
.factor-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.factor-item .label,
.factor-row .label {
  min-width: 140px;
  font-size: 14px;
  color: #374151;
}

.factor-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.factor-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s;
}

.factor-item .value,
.factor-row .value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
}

.history-controls {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.history-chart {
  height: 150px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.history-chart .chart-container {
  height: 100%;
  align-items: flex-end;
}

.history-point {
  flex: 1;
  background: #10b981;
  border-radius: 2px;
  min-height: 2px;
}

.history-point.negative {
  background: #ef4444;
}

.compare-section {
  margin-bottom: 20px;
}

.compare-section .form-group {
  width: 100%;
  margin-bottom: 12px;
}

.compare-section input {
  width: 100%;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
}

.compare-table th,
.compare-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.compare-table th {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.compare-winners {
  margin-top: 20px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.compare-winners h4 {
  margin: 0 0 12px 0;
}

.winner-item {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}

.winner-item .label {
  color: #666;
}

.winner-item .value {
  font-weight: 600;
}

.health-dashboard {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
}

.health-score {
  text-align: center;
}

.health-factors {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-factors .factor-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.health-factors .factor-bar {
  flex: 1;
}

.recommendations {
  grid-column: 1 / -1;
  margin-top: 20px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.recommendations h4 {
  margin: 0 0 12px 0;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  margin: 8px 0;
  color: #374151;
}

@media (max-width: 768px) {
  .efficiency-dashboard,
  .health-dashboard {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    min-width: auto;
  }
}
</style>
