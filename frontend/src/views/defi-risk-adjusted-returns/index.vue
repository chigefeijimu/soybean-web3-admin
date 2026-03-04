<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { defiRiskAdjustedReturns, type RiskAdjustedResult, type Protocol, type Chain, type CalculateRiskAdjustedParams } from '@/service/modules/defi-risk-adjusted-returns';

const loading = ref(false);
const results = ref<RiskAdjustedResult[]>([]);
const protocols = ref<Protocol[]>([]);
const chains = ref<Chain[]>([]);
const activeTab = ref<'single' | 'compare'>('single');

const form = reactive<CalculateRiskAdjustedParams>({
  protocol: 'uniswap_v3',
  chain: 'ethereum',
  token0: 'ETH',
  token1: 'USDC',
  amount: 10000,
  duration: 30,
});

const compareForms = reactive<CalculateRiskAdjustedParams[]>([
  { protocol: 'uniswap_v3', chain: 'ethereum', token0: 'ETH', token1: 'USDC', amount: 10000, duration: 30 },
  { protocol: 'sushiswap', chain: 'polygon', token0: 'MATIC', token1: 'USDC', amount: 10000, duration: 30 },
]);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
};

const getRankColor = (rank: string) => {
  const colors: Record<string, string> = {
    S: '#FFD700',
    'A+': '#00C853',
    A: '#00C853',
    'B+': '#2196F3',
    B: '#2196F3',
    C: '#FF9800',
    D: '#F44336',
  };
  return colors[rank] || '#9E9E9E';
};

const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    VERY_LOW: '#4CAF50',
    LOW: '#8BC34A',
    MEDIUM: '#FF9800',
    HIGH: '#F44336',
  };
  return colors[level] || '#9E9E9E';
};

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    MINIMAL: '#4CAF50',
    LOW: '#8BC34A',
    MEDIUM: '#FF9800',
    HIGH: '#F44336',
  };
  return colors[severity] || '#9E9E9E';
};

const calculateSingle = async () => {
  loading.value = true;
  try {
    const response = await defiRiskAdjustedReturns.calculate(form);
    results.value = [response.data];
  } catch (error) {
    console.error('Error calculating:', error);
  } finally {
    loading.value = false;
  }
};

const calculateCompare = async () => {
  loading.value = true;
  try {
    const response = await defiRiskAdjustedReturns.compare(compareForms);
    results.value = response.data;
  } catch (error) {
    console.error('Error comparing:', error);
  } finally {
    loading.value = false;
  }
};

const addCompareForm = () => {
  if (compareForms.length < 5) {
    compareForms.push({ protocol: 'uniswap_v3', chain: 'ethereum', token0: 'ETH', token1: 'USDC', amount: 10000, duration: 30 });
  }
};

const removeCompareForm = (index: number) => {
  if (compareForms.length > 2) {
    compareForms.splice(index, 1);
  }
};

onMounted(async () => {
  try {
    const [protocolsRes, chainsRes] = await Promise.all([
      defiRiskAdjustedReturns.getProtocols(),
      defiRiskAdjustedReturns.getChains(),
    ]);
    protocols.value = protocolsRes.data;
    chains.value = chainsRes.data;
  } catch (error) {
    console.error('Error loading data:', error);
  }
});
</script>

<template>
  <div class="defi-risk-adjusted-returns">
    <div class="page-header">
      <h1>📊 DeFi Risk-Adjusted Returns Calculator</h1>
      <p class="subtitle">Calculate risk-adjusted returns for DeFi liquidity pool investments</p>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'single' }" @click="activeTab = 'single'">
        Single Pool Analysis
      </button>
      <button :class="{ active: activeTab === 'compare' }" @click="activeTab = 'compare'">
        Compare Pools
      </button>
    </div>

    <!-- Single Pool Form -->
    <div v-if="activeTab === 'single'" class="form-card">
      <div class="form-grid">
        <div class="form-group">
          <label>Protocol</label>
          <select v-model="form.protocol">
            <option v-for="p in protocols" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="form.chain">
            <option v-for="c in chains" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Token 0</label>
          <input v-model="form.token0" type="text" placeholder="e.g. ETH" />
        </div>
        <div class="form-group">
          <label>Token 1</label>
          <input v-model="form.token1" type="text" placeholder="e.g. USDC" />
        </div>
        <div class="form-group">
          <label>Investment Amount (USD)</label>
          <input v-model.number="form.amount" type="number" min="100" />
        </div>
        <div class="form-group">
          <label>Duration (days)</label>
          <input v-model.number="form.duration" type="number" min="1" max="365" />
        </div>
      </div>
      <button class="btn-primary" @click="calculateSingle" :disabled="loading">
        {{ loading ? 'Calculating...' : 'Calculate Risk-Adjusted Returns' }}
      </button>
    </div>

    <!-- Compare Pools Form -->
    <div v-if="activeTab === 'compare'" class="form-card">
      <div v-for="(cf, index) in compareForms" :key="index" class="compare-form">
        <div class="compare-header">
          <h3>Pool {{ index + 1 }}</h3>
          <button v-if="compareForms.length > 2" class="btn-remove" @click="removeCompareForm(index)">×</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Protocol</label>
            <select v-model="cf.protocol">
              <option v-for="p in protocols" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Chain</label>
            <select v-model="cf.chain">
              <option v-for="c in chains" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Token 0</label>
            <input v-model="cf.token0" type="text" />
          </div>
          <div class="form-group">
            <label>Token 1</label>
            <input v-model="cf.token1" type="text" />
          </div>
          <div class="form-group">
            <label>Amount (USD)</label>
            <input v-model.number="cf.amount" type="number" />
          </div>
        </div>
      </div>
      <div class="compare-actions">
        <button class="btn-secondary" @click="addCompareForm" :disabled="compareForms.length >= 5">
          + Add Pool
        </button>
        <button class="btn-primary" @click="calculateCompare" :disabled="loading">
          {{ loading ? 'Comparing...' : 'Compare Pools' }}
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="results.length > 0" class="results">
      <div v-for="(result, index) in results" :key="index" class="result-card">
        <div class="result-header">
          <div class="pool-info">
            <span class="protocol-badge">{{ result.protocol }}</span>
            <span class="chain-badge">{{ result.chain }}</span>
            <span class="pair">{{ result.token0 }}/{{ result.token1 }}</span>
          </div>
          <div class="rank-badge" :style="{ backgroundColor: getRankColor(result.rank) }">
            {{ result.rank }}
          </div>
        </div>

        <div class="score-section">
          <div class="score-circle" :style="{ borderColor: getRankColor(result.rank) }">
            <span class="score-value">{{ result.riskAdjustedScore }}</span>
            <span class="score-label">Score</span>
          </div>
          <div class="score-details">
            <div class="metric">
              <span class="label">Confidence</span>
              <span class="value">{{ result.confidence }}%</span>
            </div>
            <div class="metric">
              <span class="label">Risk Level</span>
              <span class="value" :style="{ color: getRiskColor(result.riskMetrics.riskLevel) }">
                {{ result.riskMetrics.riskLevel }}
              </span>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <h4>Pool Data</h4>
            <div class="metric-row">
              <span>TVL</span>
              <span>{{ formatCurrency(result.poolData.tvl) }}</span>
            </div>
            <div class="metric-row">
              <span>APY</span>
              <span class="positive">{{ formatPercent(result.poolData.apy) }}</span>
            </div>
            <div class="metric-row">
              <span>24h Volume</span>
              <span>{{ formatCurrency(result.poolData.volume24h) }}</span>
            </div>
          </div>

          <div class="metric-card">
            <h4>Returns</h4>
            <div class="metric-row">
              <span>Gross</span>
              <span class="positive">{{ formatCurrency(result.returns.gross) }}</span>
            </div>
            <div class="metric-row">
              <span>Net</span>
              <span :class="result.returns.net >= 0 ? 'positive' : 'negative'">
                {{ formatCurrency(result.returns.net) }}
              </span>
            </div>
            <div class="metric-row">
              <span>Net APY</span>
              <span :class="result.returns.netApy >= 0 ? 'positive' : 'negative'">
                {{ formatPercent(result.returns.netApy) }}
              </span>
            </div>
          </div>

          <div class="metric-card">
            <h4>Risk Metrics</h4>
            <div class="metric-row">
              <span>Volatility</span>
              <span>{{ result.riskMetrics.volatility.toFixed(2) }}%</span>
            </div>
            <div class="metric-row">
              <span>Sharpe Ratio</span>
              <span>{{ result.riskMetrics.sharpeRatio.toFixed(2) }}</span>
            </div>
            <div class="metric-row">
              <span>Sortino Ratio</span>
              <span>{{ result.riskMetrics.sortinoRatio.toFixed(2) }}</span>
            </div>
            <div class="metric-row">
              <span>Max Drawdown</span>
              <span class="negative">{{ formatPercent(result.riskMetrics.maxDrawdown) }}</span>
            </div>
          </div>

          <div class="metric-card">
            <h4>Costs & IL</h4>
            <div class="metric-row">
              <span>Gas Cost</span>
              <span class="negative">-{{ formatCurrency(result.gasCost.value) }}</span>
            </div>
            <div class="metric-row">
              <span>Impermanent Loss</span>
              <span class="negative">-{{ formatCurrency(result.impermanentLoss.value) }}</span>
            </div>
            <div class="metric-row">
              <span>IL Severity</span>
              <span :style="{ color: getSeverityColor(result.impermanentLoss.severity) }">
                {{ result.impermanentLoss.severity }}
              </span>
            </div>
          </div>
        </div>

        <div class="recommendation">
          <h4>💡 Recommendation</h4>
          <p>{{ result.recommendation }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.defi-risk-adjusted-returns {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
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

.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.compare-form {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.compare-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  background: #f44336;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.compare-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pool-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.protocol-badge {
  padding: 4px 10px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.chain-badge {
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.pair {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.rank-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.score-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.score-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.score-details {
  display: flex;
  gap: 32px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric .label {
  font-size: 12px;
  color: #666;
}

.metric .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-card h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid #eee;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-row span:first-child {
  color: #666;
}

.metric-row span:last-child {
  font-weight: 500;
}

.positive {
  color: #4caf50 !important;
}

.negative {
  color: #f44336 !important;
}

.recommendation {
  padding: 16px;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 8px;
}

.recommendation h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #f57c00;
}

.recommendation p {
  margin: 0;
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}
</style>
