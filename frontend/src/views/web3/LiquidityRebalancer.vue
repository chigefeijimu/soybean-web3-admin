<template>
  <div class="liquidity-rebalancer">
    <div class="header">
      <h2>⚖️ Cross-chain Liquidity Rebalancer - 跨链流动性再平衡器</h2>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="">全部链</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="avalanche">Avalanche</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
        </select>
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="overview-cards" v-if="chainStats">
      <div class="overview-card">
        <div class="card-title">📊 Total TVL</div>
        <div class="card-value">${{ formatNumber(getTotalTvl()) }}</div>
        <div class="card-subtitle">跨链总锁仓量</div>
      </div>
      <div class="overview-card">
        <div class="card-title">📈 Avg APR</div>
        <div class="card-value">{{ getAvgApr() }}%</div>
        <div class="card-subtitle">平均收益率</div>
      </div>
      <div class="overview-card">
        <div class="card-title">🏊 Pool Count</div>
        <div class="card-value">{{ positions.length }}</div>
        <div class="card-subtitle">流动性池数量</div>
      </div>
      <div class="overview-card">
        <div class="card-title">⛓️ Active Chains</div>
        <div class="card-value">{{ getActiveChains() }}</div>
        <div class="card-subtitle">活跃链数量</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Pools Tab -->
    <div v-if="activeTab === 'pools'" class="tab-content">
      <h3>🏊 Liquidity Pools - 流动性池</h3>
      <div class="pools-grid">
        <div 
          v-for="pool in filteredPositions" 
          :key="pool.id" 
          class="pool-card"
          @click="selectPool(pool)"
        >
          <div class="pool-header">
            <span class="pool-protocol">{{ getProtocolIcon(pool.protocol) }} {{ pool.protocol }}</span>
            <span class="pool-chain">{{ getChainIcon(pool.chain) }}</span>
          </div>
          <div class="pool-name">{{ pool.token0 }}/{{ pool.token1 }}</div>
          <div class="pool-stats">
            <div class="pool-stat">
              <span class="stat-label">APR</span>
              <span class="stat-value apr">{{ pool.apr.toFixed(2) }}%</span>
            </div>
            <div class="pool-stat">
              <span class="stat-label">TVL</span>
              <span class="stat-value">${{ formatNumber(pool.tvl) }}</span>
            </div>
            <div class="pool-stat">
              <span class="stat-label">Volume 24h</span>
              <span class="stat-value">${{ formatNumber(pool.volume24h) }}</span>
            </div>
          </div>
          <div class="pool-concentration">
            <span class="concentration-label">集中度</span>
            <div class="concentration-bar">
              <div class="concentration-fill" :style="{ width: (pool.concentration * 100) + '%' }"></div>
            </div>
            <span class="concentration-value">{{ (pool.concentration * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chains Tab -->
    <div v-if="activeTab === 'chains'" class="tab-content">
      <h3>⛓️ Chain Statistics - 各链统计</h3>
      <div class="chains-table">
        <table>
          <thead>
            <tr>
              <th>Chain</th>
              <th>Pool Count</th>
              <th>Total TVL</th>
              <th>Avg APR</th>
              <th>24h Volume</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in chainStats" :key="stat.chain">
              <td>{{ getChainIcon(stat.chain) }} {{ stat.chain }}</td>
              <td>{{ stat.poolCount }}</td>
              <td>${{ formatNumber(stat.totalTvl) }}</td>
              <td class="apr">{{ stat.avgApr.toFixed(2) }}%</td>
              <td>${{ formatNumber(stat.totalVolume24h) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Protocols Tab -->
    <div v-if="activeTab === 'protocols'" class="tab-content">
      <h3>🔐 Protocol Statistics - 协议统计</h3>
      <div class="protocols-grid">
        <div v-for="stat in protocolStats" :key="stat.protocol" class="protocol-card">
          <div class="protocol-header">
            <span class="protocol-name">{{ getProtocolIcon(stat.protocol) }} {{ stat.protocol }}</span>
            <span class="protocol-chains">{{ stat.chains.length }} chains</span>
          </div>
          <div class="protocol-stats">
            <div class="protocol-stat">
              <span class="stat-label">Pools</span>
              <span class="stat-value">{{ stat.poolCount }}</span>
            </div>
            <div class="protocol-stat">
              <span class="stat-label">TVL</span>
              <span class="stat-value">${{ formatNumber(stat.totalTvl) }}</span>
            </div>
            <div class="protocol-stat">
              <span class="stat-label">Avg APR</span>
              <span class="stat-value apr">{{ stat.avgApr.toFixed(2) }}%</span>
            </div>
          </div>
          <div class="protocol-chains-list">
            <span v-for="chain in stat.chains" :key="chain" class="chain-badge">
              {{ getChainIcon(chain) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rebalance Tab -->
    <div v-if="activeTab === 'rebalance'" class="tab-content">
      <h3>⚖️ Rebalance Analyzer - 再平衡分析</h3>
      
      <div class="rebalance-form">
        <div class="form-section">
          <h4>📊 Current Positions - 当前持仓</h4>
          <div class="positions-input">
            <div v-for="(pos, idx) in inputPositions" :key="idx" class="position-row">
              <select v-model="pos.protocol">
                <option value="">Protocol</option>
                <option v-for="p in availableProtocols" :key="p" :value="p">{{ p }}</option>
              </select>
              <select v-model="pos.chain">
                <option value="">Chain</option>
                <option v-for="c in availableChains" :key="c" :value="c">{{ c }}</option>
              </select>
              <input v-model="pos.pool" placeholder="Pool (e.g. USDC/ETH)" />
              <input v-model.number="pos.value" type="number" placeholder="Value ($)" />
              <button @click="removePosition(idx)" class="btn-remove">✕</button>
            </div>
            <button @click="addPosition" class="btn-add">+ Add Position</button>
          </div>
        </div>

        <div class="form-section">
          <h4>🎯 Preferences - 偏好设置</h4>
          <div class="preferences">
            <div class="pref-group">
              <label>Max Gas Cost ($)</label>
              <input v-model.number="maxGasCost" type="number" placeholder="100" />
            </div>
            <div class="pref-group">
              <label>Preferred Chains</label>
              <div class="checkbox-group">
                <label v-for="c in availableChains" :key="c">
                  <input type="checkbox" :value="c" v-model="preferChains" />
                  {{ c }}
                </label>
              </div>
            </div>
            <div class="pref-group">
              <label>Preferred Protocols</label>
              <div class="checkbox-group">
                <label v-for="p in availableProtocols" :key="p">
                  <input type="checkbox" :value="p" v-model="preferProtocols" />
                  {{ p }}
                </label>
              </div>
            </div>
          </div>
        </div>

        <button @click="analyzeRebalance" :disabled="analyzing" class="btn-analyze">
          {{ analyzing ? '⏳ Analyzing...' : '🔍 Analyze Rebalance' }}
        </button>
      </div>

      <!-- Rebalance Results -->
      <div v-if="rebalancePlan" class="rebalance-results">
        <div class="results-header">
          <h4>📋 Rebalance Plan - 再平衡方案</h4>
          <div class="expected-improvement" :class="{ positive: rebalancePlan.expectedImprovement > 0 }">
            Expected Improvement: {{ rebalancePlan.expectedImprovement.toFixed(2) }}%
          </div>
        </div>

        <!-- Allocation Comparison -->
        <div class="allocation-comparison">
          <div class="allocation-section">
            <h5>Current Allocation</h5>
            <div class="allocation-bars">
              <div v-for="alloc in rebalancePlan.currentAllocation" :key="alloc.pool" class="allocation-bar">
                <div class="bar-label">
                  <span>{{ alloc.protocol }} - {{ alloc.chain }}</span>
                  <span>{{ alloc.percentage.toFixed(1) }}%</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill current" :style="{ width: alloc.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="allocation-section">
            <h5>Recommended Allocation</h5>
            <div class="allocation-bars">
              <div v-for="alloc in rebalancePlan.recommendedAllocation" :key="alloc.pool" class="allocation-bar">
                <div class="bar-label">
                  <span>{{ alloc.protocol }} - {{ alloc.chain }}</span>
                  <span>{{ alloc.percentage.toFixed(1) }}%</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill recommended" :style="{ width: alloc.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <h5>📝 Recommended Actions</h5>
          <div class="actions-list">
            <div v-for="(action, idx) in rebalancePlan.actions" :key="idx" class="action-card" :class="action.type">
              <div class="action-type">
                <span class="action-icon">{{ action.type === 'add' ? '➕' : '➖' }}</span>
                {{ action.type.toUpperCase() }}
              </div>
              <div class="action-details">
                <div v-if="action.type === 'add'">
                  Add {{ formatNumber(action.amount) }} to {{ action.toProtocol }} on {{ action.toChain }}
                </div>
                <div v-else>
                  Remove {{ formatNumber(action.amount) }} from {{ action.fromProtocol }} on {{ action.fromChain }}
                </div>
                <div class="action-meta">
                  <span>Gas: ~${{ action.estimatedGas }}</span>
                  <span>Time: ~{{ action.estimatedTime }}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Assessment -->
        <div class="risk-section">
          <h5>⚠️ Risk Assessment</h5>
          <div class="risk-card" :class="rebalancePlan.riskAssessment.overallRisk">
            <div class="risk-header">
              <span class="risk-level">{{ rebalancePlan.riskAssessment.overallRisk.toUpperCase() }}</span>
              <span class="risk-score">Risk Level</span>
            </div>
            <div class="risk-factors">
              <div v-for="factor in rebalancePlan.riskAssessment.factors" :key="factor" class="risk-factor">
                {{ factor }}
              </div>
            </div>
            <div class="risk-stats">
              <div class="risk-stat">
                <span>Impermanent Loss</span>
                <span>{{ rebalancePlan.riskAssessment.impermanentLoss.toFixed(1) }}%</span>
              </div>
              <div class="risk-stat">
                <span>Gas Cost</span>
                <span>${{ rebalancePlan.riskAssessment.gasCost.toFixed(2) }}</span>
              </div>
              <div class="risk-stat">
                <span>Slippage</span>
                <span>{{ rebalancePlan.riskAssessment.slippage.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { liquidityRebalancer } from '@/service/liquidityRebalancer';

const loading = ref(false);
const analyzing = ref(false);
const activeTab = ref('pools');
const selectedChain = ref('');

const positions = ref<any[]>([]);
const chainStats = ref<any[]>([]);
const protocolStats = ref<any[]>([]);
const rebalancePlan = ref<any>(null);

const inputPositions = ref([
  { protocol: 'Uniswap V3', chain: 'ethereum', pool: 'USDC/ETH', value: 10000 },
  { protocol: 'SushiSwap', chain: 'polygon', pool: 'USDC/MATIC', value: 5000 },
]);

const maxGasCost = ref(100);
const preferChains = ref<string[]>([]);
const preferProtocols = ref<string[]>([]);

const availableChains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'base', 'bsc'];
const availableProtocols = ['Uniswap V3', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap', 'QuickSwap', 'GMX', 'Aerodrome', 'Velodrome', 'Trader Joe'];

const tabs = [
  { id: 'pools', name: 'Pools', icon: '🏊' },
  { id: 'chains', name: 'Chains', icon: '⛓️' },
  { id: 'protocols', name: 'Protocols', icon: '🔐' },
  { id: 'rebalance', name: 'Rebalance', icon: '⚖️' },
];

const filteredPositions = computed(() => {
  if (!selectedChain.value) return positions.value;
  return positions.value.filter(p => p.chain === selectedChain.value);
});

const getTotalTvl = () => {
  return positions.value.reduce((sum, p) => sum + p.tvl, 0);
};

const getAvgApr = () => {
  if (positions.value.length === 0) return 0;
  return (positions.value.reduce((sum, p) => sum + p.apr, 0) / positions.value.length).toFixed(2);
};

const getActiveChains = () => {
  return new Set(positions.value.map(p => p.chain)).size;
};

const getChainIcon = (chain: string) => {
  const icons: Record<string, string> = {
    ethereum: '🔷',
    arbitrum: '🔵',
    optimism: '🔴',
    polygon: '🟣',
    avalanche: '🔺',
    base: '🔵',
    bsc: '🟡',
  };
  return icons[chain] || '⬡';
};

const getProtocolIcon = (protocol: string) => {
  const icons: Record<string, string> = {
    'Uniswap V3': '🦄',
    'SushiSwap': '🍣',
    'Curve': '📈',
    'Balancer': '⚖️',
    'PancakeSwap': '🥞',
    'QuickSwap': '⚡',
    'GMX': '🦍',
    'Aerodrome': '🛸',
    'Velodrome': '🚂',
    'Trader Joe': '🧉',
  };
  return icons[protocol] || '💱';
};

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

const selectPool = (pool: any) => {
  console.log('Selected pool:', pool);
};

const addPosition = () => {
  inputPositions.value.push({ protocol: '', chain: '', pool: '', value: 0 });
};

const removePosition = (idx: number) => {
  inputPositions.value.splice(idx, 1);
};

const refreshData = async () => {
  loading.value = true;
  try {
    const [posRes, chainRes, protocolRes] = await Promise.all([
      liquidityRebalancer.getPositions(),
      liquidityRebalancer.getChainStats(),
      liquidityRebalancer.getProtocolStats(),
    ]);
    positions.value = posRes.data;
    chainStats.value = chainRes.data;
    protocolStats.value = protocolRes.data;
  } catch (error) {
    console.error('Error loading data:', error);
  }
  loading.value = false;
};

const analyzeRebalance = async () => {
  analyzing.value = true;
  try {
    const response = await liquidityRebalancer.analyzeRebalance({
      walletAddress: '0x0000000000000000000000000000000000000000',
      positions: inputPositions.value.filter(p => p.protocol && p.chain && p.value > 0),
      targetAllocation: [],
      maxGasCost: maxGasCost.value,
      preferChains: preferChains.value,
      preferProtocols: preferProtocols.value,
    });
    rebalancePlan.value = response.data;
  } catch (error) {
    console.error('Error analyzing rebalance:', error);
  }
  analyzing.value = false;
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.liquidity-rebalancer {
  padding: 20px;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.chain-select, .btn-refresh {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.btn-refresh {
  background: #4CAF50;
  color: white;
  border: none;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.overview-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.overview-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.overview-card:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-title {
  font-size: 14px;
  opacity: 0.9;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  margin: 8px 0;
}

.card-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab.active {
  border-bottom-color: #667eea;
  color: #667eea;
  font-weight: bold;
}

.pools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.pool-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.pool-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.pool-protocol {
  font-weight: bold;
}

.pool-name {
  font-size: 18px;
  margin-bottom: 12px;
  color: #333;
}

.pool-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.pool-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: #888;
}

.stat-value {
  font-weight: bold;
}

.stat-value.apr {
  color: #4CAF50;
}

.pool-concentration {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.concentration-bar {
  flex: 1;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.concentration-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.chains-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.chains-table th, .chains-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.chains-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.protocols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.protocol-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
}

.protocol-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.protocol-name {
  font-weight: bold;
  font-size: 16px;
}

.protocol-chains {
  font-size: 12px;
  color: #888;
}

.protocol-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.protocol-stat {
  display: flex;
  flex-direction: column;
}

.protocol-chains-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chain-badge {
  font-size: 12px;
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
}

.rebalance-form {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.form-section h4 {
  margin-bottom: 12px;
}

.positions-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.position-row {
  display: flex;
  gap: 8px;
}

.position-row select, .position-row input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  flex: 1;
}

.btn-remove {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-add {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
}

.preferences {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pref-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pref-group label {
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: normal;
}

.btn-analyze {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 28px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}

.btn-analyze:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rebalance-results {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.expected-improvement {
  padding: 8px 16px;
  border-radius: 20px;
  background: #ff4444;
  color: white;
  font-weight: bold;
}

.expected-improvement.positive {
  background: #4CAF50;
}

.allocation-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.allocation-section h5 {
  margin-bottom: 12px;
}

.allocation-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.allocation-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.bar-track {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
}

.bar-fill.current {
  background: #ff6b6b;
}

.bar-fill.recommended {
  background: #4ecdc4;
}

.actions-section {
  margin-bottom: 20px;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-card {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
}

.action-card.add {
  border-left: 4px solid #4CAF50;
}

.action-card.remove {
  border-left: 4px solid #ff4444;
}

.action-type {
  font-weight: bold;
  min-width: 80px;
}

.action-icon {
  margin-right: 8px;
}

.action-details {
  flex: 1;
}

.action-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.risk-card {
  padding: 16px;
  border-radius: 8px;
}

.risk-card.low {
  background: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.risk-card.medium {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.risk-card.high {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.risk-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.risk-level {
  font-weight: bold;
  font-size: 18px;
}

.risk-factors {
  margin-bottom: 12px;
}

.risk-factor {
  font-size: 14px;
  padding: 4px 0;
}

.risk-stats {
  display: flex;
  gap: 24px;
}

.risk-stat {
  display: flex;
  flex-direction: column;
}
</style>
