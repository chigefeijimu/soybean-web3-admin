<template>
  <div class="tx-pattern-analyzer">
    <div class="header">
      <h2>📊 Transaction Pattern Analyzer - 交易模式分析器</h2>
      <div class="header-actions">
        <button @click="toggleView" class="btn-toggle">
          {{ isCrossChain ? '🔗 跨链分析' : '📱 单链分析' }}
        </button>
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <input 
        v-model="searchAddress" 
        placeholder="输入钱包地址查询交易模式..." 
        class="search-input"
        @keyup.enter="searchPattern"
      />
      <select v-model="selectedChain" class="chain-select" :disabled="isCrossChain">
        <option value="ethereum">Ethereum</option>
        <option value="polygon">Polygon</option>
        <option value="arbitrum">Arbitrum</option>
        <option value="optimism">Optimism</option>
        <option value="bsc">BSC</option>
        <option value="base">Base</option>
        <option value="avalanche">Avalanche</option>
        <option value="solana">Solana</option>
      </select>
      <button @click="searchPattern" :disabled="loading || !searchAddress" class="btn-search">
        🔍 分析
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在分析交易模式...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
    </div>

    <!-- Results -->
    <div v-else-if="patternData" class="results-container">
      
      <!-- Single Chain Pattern -->
      <template v-if="!isCrossChain">
        <div class="pattern-header">
          <div class="pattern-info">
            <h3>📍 {{ getChainName(patternData.chain) }}</h3>
            <div class="address-display">{{ formatAddress(patternData.address) }}</div>
          </div>
          <div class="pattern-stats">
            <div class="stat-box">
              <div class="stat-value">{{ formatNumber(patternData.totalTransactions) }}</div>
              <div class="stat-label">总交易数</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ formatNumber(patternData.uniqueContracts) }}</div>
              <div class="stat-label">交互合约</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${{ formatNumber(patternData.totalVolume) }}</div>
              <div class="stat-label">总交易量</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" :class="getActivityClass(patternData.activityScore)">
                {{ patternData.activityScore }}
              </div>
              <div class="stat-label">活跃度评分</div>
            </div>
          </div>
        </div>

        <!-- Behavior Profile -->
        <div class="profile-section">
          <div class="profile-card">
            <h4>👤 行为画像</h4>
            <div class="profile-content">
              <span class="profile-badge primary">{{ patternData.behaviorProfile }}</span>
              <span class="risk-badge" :class="patternData.riskLevel">
                风险: {{ patternData.riskLevel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Transaction Types -->
        <div class="chart-section">
          <h4>📈 交易类型分布</h4>
          <div class="type-list">
            <div v-for="type in patternData.transactionTypes" :key="type.type" class="type-item">
              <div class="type-info">
                <span class="type-name">{{ type.type }}</span>
                <span class="type-count">{{ type.count }} ({{ type.percentage.toFixed(1) }}%)</span>
              </div>
              <div class="type-bar">
                <div class="type-fill" :style="{ width: type.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time Distribution -->
        <div class="chart-section">
          <h4>⏰ 时间分布 (小时)</h4>
          <div class="time-chart">
            <div v-for="hour in patternData.timeDistribution" :key="hour.hour" 
                 class="time-bar" 
                 :style="{ height: (hour.percentage * 2) + 'px' }"
                 :title="`${hour.hour}:00 - ${hour.count} 笔交易`">
            </div>
          </div>
          <div class="time-labels">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>

        <!-- Day Distribution -->
        <div class="chart-section">
          <h4>📅 每周活动分布</h4>
          <div class="day-list">
            <div v-for="day in patternData.dayDistribution" :key="day.day" class="day-item">
              <div class="day-info">
                <span class="day-name">{{ day.day }}</span>
                <span class="day-count">{{ day.count }} 笔</span>
              </div>
              <div class="day-bar">
                <div class="day-fill" :style="{ width: day.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Contracts -->
        <div class="chart-section">
          <h4>🏢 常用合约 TOP 5</h4>
          <div class="contract-list">
            <div v-for="(contract, idx) in patternData.mostUsedContracts" :key="contract.contract" 
                 class="contract-item">
              <div class="contract-rank">{{ idx + 1 }}</div>
              <div class="contract-address">{{ formatAddress(contract.contract) }}</div>
              <div class="contract-count">{{ contract.count }} 次</div>
            </div>
          </div>
        </div>

        <!-- Patterns -->
        <div v-if="patternData.patterns.length" class="patterns-section">
          <h4>🔍 识别的行为模式</h4>
          <div class="patterns-list">
            <div v-for="pattern in patternData.patterns" :key="pattern" class="pattern-tag">
              {{ pattern }}
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendations-section">
          <h4>💡 优化建议</h4>
          <ul class="recommendations-list">
            <li v-for="rec in patternData.recommendations" :key="rec">{{ rec }}</li>
          </ul>
        </div>
      </template>

      <!-- Cross Chain Pattern -->
      <template v-else>
        <div class="cross-chain-header">
          <h3>🌐 跨链交易模式分析</h3>
          <div class="address-display">{{ formatAddress(crossChainData.address) }}</div>
        </div>

        <div class="cross-chain-summary">
          <div class="summary-card">
            <div class="summary-title">统一画像</div>
            <div class="summary-value">{{ crossChainData.unifiedProfile }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">主导链</div>
            <div class="summary-value">{{ getChainName(crossChainData.dominantChain) }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">活跃链数</div>
            <div class="summary-value">{{ crossChainData.chains.length }} / 8</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">跨链复杂度</div>
            <div class="summary-value">{{ crossChainData.complexity }}%</div>
          </div>
        </div>

        <div class="cross-chain-stats">
          <div class="stat-box large">
            <div class="stat-value">{{ formatNumber(crossChainData.totalTransactions) }}</div>
            <div class="stat-label">总交易数</div>
          </div>
          <div class="stat-box large">
            <div class="stat-value">${{ formatNumber(crossChainData.totalVolume) }}</div>
            <div class="stat-label">总交易量</div>
          </div>
        </div>

        <div class="chain-activity-section">
          <h4>⛓️ 各链活动分布</h4>
          <div class="chain-activity-list">
            <div v-for="chain in crossChainData.crossChainActivity" :key="chain.chain" 
                 class="chain-activity-item"
                 :class="{ active: chain.txCount > 0 }">
              <div class="chain-name">{{ getChainName(chain.chain) }}</div>
              <div class="chain-stats">
                <span>🧾 {{ formatNumber(chain.txCount) }} 笔</span>
                <span>💰 ${{ formatNumber(chain.volume) }}</span>
              </div>
              <div class="chain-bar">
                <div class="chain-fill" 
                     :style="{ width: (chain.txCount / Math.max(crossChainData.totalTransactions, 1) * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="chains-used">
          <h4>✅ 活跃链</h4>
          <div class="chain-badges">
            <span v-for="chain in crossChainData.chains" :key="chain" class="chain-badge active">
              {{ getChainName(chain) }}
            </span>
            <span v-if="crossChainData.chains.length === 0" class="no-data">无活动</span>
          </div>
        </div>
      </template>

    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>交易模式分析器</h3>
      <p>输入钱包地址分析其在区块链上的交易模式和行为特征</p>
      <div class="features">
        <div class="feature-item">✅ 支持 8 条主流链</div>
        <div class="feature-item">✅ 智能行为画像</div>
        <div class="feature-item">✅ 风险评估</div>
        <div class="feature-item">✅ 跨链模式分析</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { txPatternAnalyzer } from '@/service/txPatternAnalyzer';

const searchAddress = ref('');
const selectedChain = ref('ethereum');
const loading = ref(false);
const error = ref('');
const isCrossChain = ref(false);
const patternData = ref<any>(null);
const crossChainData = ref<any>(null);

const chainNames: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  bsc: 'BSC',
  base: 'Base',
  avalanche: 'Avalanche',
  solana: 'Solana',
};

const getChainName = (chain: string) => chainNames[chain.toLowerCase()] || chain;

const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getActivityClass = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const searchPattern = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    if (isCrossChain.value) {
      crossChainData.value = await txPatternAnalyzer.analyzeCrossChain(searchAddress.value);
    } else {
      patternData.value = await txPatternAnalyzer.analyzeAddress(searchAddress.value, selectedChain.value);
    }
  } catch (e: any) {
    error.value = e.message || '分析失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const toggleView = () => {
  isCrossChain.value = !isCrossChain.value;
  patternData.value = null;
  crossChainData.value = null;
};

const refreshData = () => {
  if (searchAddress.value) {
    searchPattern();
  }
};
</script>

<style scoped>
.tx-pattern-analyzer {
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
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh, .btn-toggle {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #4a5568;
  color: white;
  transition: all 0.2s;
}

.btn-refresh:hover, .btn-toggle:hover {
  background: #2d3748;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.chain-select {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  min-width: 120px;
}

.btn-search {
  padding: 12px 24px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-search:hover:not(:disabled) {
  background: #2b6cb0;
}

.btn-search:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #e53e3e;
}

.empty-state .empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin-bottom: 10px;
}

.features {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  color: #4a5568;
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pattern-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
}

.pattern-info h3 {
  margin: 0 0 8px 0;
}

.address-display {
  font-family: monospace;
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 12px;
}

.pattern-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-box {
  background: rgba(255,255,255,0.15);
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  flex: 1;
  min-width: 100px;
}

.stat-box.large {
  min-width: 150px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-value.high { color: #68d391; }
.stat-value.medium { color: #f6e05e; }
.stat-value.low { color: #fc8181; }

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.profile-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.profile-card h4 {
  margin: 0 0 12px 0;
}

.profile-content {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.profile-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
}

.profile-badge.primary {
  background: #bee3f8;
  color: #2b6cb0;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.risk-badge.low { background: #c6f6d5; color: #276749; }
.risk-badge.medium { background: #fefcbf; color: #975a16; }
.risk-badge.high { background: #fed7d7; color: #c53030; }

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-section h4 {
  margin: 0 0 16px 0;
}

.type-list, .day-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-item, .day-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-info, .day-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.type-name, .day-name {
  font-weight: 500;
}

.type-count, .day-count {
  color: #718096;
}

.type-bar, .day-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.type-fill, .day-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.time-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100px;
  padding: 10px 0;
}

.time-bar {
  flex: 1;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}

.time-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #718096;
}

.contract-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contract-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f7fafc;
  border-radius: 6px;
}

.contract-rank {
  width: 24px;
  height: 24px;
  background: #4a5568;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.contract-address {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
}

.contract-count {
  color: #718096;
}

.patterns-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.patterns-section h4 {
  margin: 0 0 12px 0;
}

.patterns-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pattern-tag {
  padding: 8px 16px;
  background: #e9d8fd;
  color: #553c9a;
  border-radius: 20px;
  font-size: 14px;
}

.recommendations-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recommendations-section h4 {
  margin: 0 0 12px 0;
}

.recommendations-list {
  margin: 0;
  padding-left: 20px;
}

.recommendations-list li {
  margin-bottom: 8px;
  color: #4a5568;
}

/* Cross Chain Styles */
.cross-chain-header {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
}

.cross-chain-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.summary-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.summary-title {
  font-size: 12px;
  color: #718096;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.cross-chain-stats {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.chain-activity-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.chain-activity-section h4 {
  margin: 0 0 16px 0;
}

.chain-activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-activity-item {
  padding: 12px;
  border-radius: 8px;
  background: #f7fafc;
  opacity: 0.5;
}

.chain-activity-item.active {
  opacity: 1;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chain-name {
  font-weight: 600;
  margin-bottom: 8px;
}

.chain-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #718096;
  margin-bottom: 8px;
}

.chain-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.chain-fill {
  height: 100%;
  background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
  border-radius: 3px;
}

.chains-used {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.chains-used h4 {
  margin: 0 0 12px 0;
}

.chain-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chain-badge {
  padding: 4px 12px;
  border-radius: 12px;
  background: #edf2f7;
  color: #4a5568;
  font-size: 12px;
}

.chain-badge.active {
  background: #c6f6d5;
  color: #276749;
}

.no-data {
  color: #a0aec0;
}
</style>
