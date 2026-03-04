<template>
  <div class="token-safety-checker">
    <div class="page-header">
      <h1>🔍 Token Safety Checker</h1>
      <p class="subtitle">检测假代币和仿冒代币，保护您的资产安全</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-form">
        <div class="input-group">
          <input
            v-model="searchAddress"
            type="text"
            placeholder="输入代币合约地址..."
            class="search-input"
            @keyup.enter="analyzeToken"
          />
          <select v-model="selectedChain" class="chain-select">
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BNB Chain</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="avalanche">Avalanche</option>
            <option value="base">Base</option>
          </select>
          <button @click="analyzeToken" class="analyze-btn" :disabled="loading">
            {{ loading ? '分析中...' : '开始分析' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="results-section">
      <!-- Risk Score Card -->
      <div class="risk-card" :class="result.riskLevel">
        <div class="risk-score">
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle class="bg" cx="50" cy="50" r="45" />
              <circle 
                class="progress" 
                cx="50" 
                cy="50" 
                r="45" 
                :stroke-dasharray="`${result.riskScore * 2.83} 283`"
              />
            </svg>
            <div class="score-value">
              <span class="number">{{ result.riskScore }}</span>
              <span class="label">风险评分</span>
            </div>
          </div>
        </div>
        <div class="risk-info">
          <h2>{{ result.name }}</h2>
          <p class="symbol">{{ result.symbol }}</p>
          <p class="address">{{ result.address }}</p>
          <div class="risk-badge" :class="result.riskLevel">
            {{ getRiskLabel(result.riskLevel) }}
          </div>
        </div>
      </div>

      <!-- Recommendation -->
      <div class="recommendation-card">
        <h3>💡 安全建议</h3>
        <p>{{ result.recommendation }}</p>
      </div>

      <!-- Risk Factors -->
      <div class="factors-section">
        <h3>⚠️ 风险因素分析</h3>
        <div class="factors-list">
          <div 
            v-for="(factor, index) in result.factors" 
            :key="index"
            class="factor-item"
            :class="factor.severity"
          >
            <div class="factor-icon">
              <span v-if="factor.severity === 'critical'">🔴</span>
              <span v-else-if="factor.severity === 'danger'">🟠</span>
              <span v-else-if="factor.severity === 'warning'">🟡</span>
              <span v-else>🔵</span>
            </div>
            <div class="factor-content">
              <h4>{{ getFactorTitle(factor.type) }}</h4>
              <p>{{ factor.description }}</p>
            </div>
            <div class="factor-score">+{{ factor.score }}</div>
          </div>
        </div>
      </div>

      <!-- Analysis Cards -->
      <div class="analysis-grid">
        <!-- Holder Analysis -->
        <div class="analysis-card">
          <h3>👥 持有者分析</h3>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">{{ result.holderAnalysis.totalHolders.toLocaleString() }}</span>
              <span class="stat-label">总持有者</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ result.holderAnalysis.top10Percentage }}%</span>
              <span class="stat-label">Top 10 占比</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ result.holderAnalysis.top25Percentage }}%</span>
              <span class="stat-label">Top 25 占比</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ result.holderAnalysis.averageHolding }}</span>
              <span class="stat-label">平均持仓</span>
            </div>
          </div>
          <div class="concentration-bar">
            <div class="bar-label">集中度风险</div>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :class="result.holderAnalysis.concentrationRisk"
                :style="{width: Math.min(result.holderAnalysis.top10Percentage * 1.2, 100) + '%'}"
              ></div>
            </div>
            <span class="bar-value">{{ result.holderAnalysis.concentrationRisk.toUpperCase() }}</span>
          </div>
        </div>

        <!-- Contract Analysis -->
        <div class="analysis-card">
          <h3>📜 合约分析</h3>
          <div class="contract-flags">
            <div class="flag" :class="{ active: result.contractAnalysis.isVerified }">
              <span class="icon">{{ result.contractAnalysis.isVerified ? '✅' : '❌' }}</span>
              <span>合约已验证</span>
            </div>
            <div class="flag" :class="{ active: result.contractAnalysis.isMintable, warning: result.contractAnalysis.isMintable }">
              <span class="icon">{{ result.contractAnalysis.isMintable ? '⚠️' : '✅' }}</span>
              <span>可铸造</span>
            </div>
            <div class="flag" :class="{ active: result.contractAnalysis.isPausable, warning: result.contractAnalysis.isPausable }">
              <span class="icon">{{ result.contractAnalysis.isPausable ? '⚠️' : '✅' }}</span>
              <span>可暂停</span>
            </div>
            <div class="flag" :class="{ active: result.contractAnalysis.hasBlacklist, warning: result.contractAnalysis.hasBlacklist }">
              <span class="icon">{{ result.contractAnalysis.hasBlacklist ? '⚠️' : '✅' }}</span>
              <span>黑名单</span>
            </div>
            <div class="flag" :class="{ active: result.contractAnalysis.isProxy }">
              <span class="icon">{{ result.contractAnalysis.isProxy ? 'ℹ️' : '✅' }}</span>
              <span>代理合约</span>
            </div>
          </div>
          <div v-if="result.contractAnalysis.tradingRestrictions.length" class="restrictions">
            <h4>交易限制:</h4>
            <ul>
              <li v-for="(r, i) in result.contractAnalysis.tradingRestrictions" :key="i">{{ r }}</li>
            </ul>
          </div>
        </div>

        <!-- Liquidity Analysis -->
        <div class="analysis-card">
          <h3>💧 流动性分析</h3>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">{{ result.liquidityAnalysis.liquidityLocked ? '🔒 已锁定' : '🔓 未锁定' }}</span>
              <span class="stat-label">流动性状态</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ result.liquidityAnalysis.liquidityAmount }}</span>
              <span class="stat-label">锁定金额</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ result.liquidityAnalysis.liquidityLockDuration }}</span>
              <span class="stat-label">锁定时间</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ result.liquidityAnalysis.liquidityProviderCount }}</span>
              <span class="stat-label">流动性提供者</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Honeypot Indicators -->
      <div v-if="result.contractAnalysis.honeypotIndicators.length" class="honeypot-section">
        <h3>🐝 蜜罐指标警告</h3>
        <div class="honeypot-list">
          <div v-for="(indicator, i) in result.contractAnalysis.honeypotIndicators" :key="i" class="honeypot-item">
            ⚠️ {{ indicator }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tips Section -->
    <div class="tips-section">
      <h3>🛡️ 代币安全提示</h3>
      <ul class="tips-list">
        <li v-for="(tip, i) in safetyTips" :key="i">{{ tip }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const searchAddress = ref('');
const selectedChain = ref('ethereum');
const loading = ref(false);
const result = ref<any>(null);
const safetyTips = ref<string[]>([]);

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/token-safety/safety-tips');
    const data = await res.json();
    safetyTips.value = data;
  } catch (e) {
    safetyTips.value = [
      'Always verify the contract address on the official project website',
      'Check if the contract is verified on Etherscan',
      'Verify liquidity is locked for legitimate projects',
      'Be wary of tokens with minting capabilities',
      'Check holder distribution - beware of high concentration',
    ];
  }
});

async function analyzeToken() {
  if (!searchAddress.value) return;
  
  loading.value = true;
  result.value = null;
  
  try {
    const res = await fetch(
      `/api/v1/token-safety/analyze?address=${searchAddress.value}&chain=${selectedChain.value}`
    );
    const data = await res.json();
    result.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function getRiskLabel(level: string) {
  const labels: Record<string, string> = {
    safe: '✅ 安全',
    low: '🟢 低风险',
    medium: '🟡 中等风险',
    high: '🟠 高风险',
    critical: '🔴 极高风险',
  };
  return labels[level] || level;
}

function getFactorTitle(type: string) {
  const titles: Record<string, string> = {
    holder_concentration: '持有者集中度',
    contract_verification: '合约验证',
    mintable_token: '可铸造代币',
    pausable_token: '可暂停代币',
    blacklist: '黑名单功能',
    proxy_contract: '代理合约',
    liquidity_lock: '流动性锁定',
    suspicious_pattern: '可疑模式',
  };
  return titles[type] || type;
}
</script>

<style scoped>
.token-safety-checker {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 16px;
}

.search-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.search-form {
  max-width: 800px;
  margin: 0 auto;
}

.input-group {
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.chain-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  min-width: 140px;
}

.analyze-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #2563eb;
}

.analyze-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Risk Card */
.risk-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 24px;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.risk-card.safe { border-left: 4px solid #22c55e; }
.risk-card.low { border-left: 4px solid #84cc16; }
.risk-card.medium { border-left: 4px solid #eab308; }
.risk-card.high { border-left: 4px solid #f97316; }
.risk-card.critical { border-left: 4px solid #ef4444; }

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-circle svg {
  transform: rotate(-90deg);
}

.score-circle circle {
  fill: none;
  stroke-width: 8;
}

.score-circle .bg {
  stroke: #e5e7eb;
}

.score-circle .progress {
  stroke: currentColor;
}

.safe .progress { stroke: #22c55e; }
.low .progress { stroke: #84cc16; }
.medium .progress { stroke: #eab308; }
.high .progress { stroke: #f97316; }
.critical .progress { stroke: #ef4444; }

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value .number {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.score-value .label {
  font-size: 12px;
  color: #666;
}

.risk-info h2 {
  font-size: 24px;
  margin-bottom: 4px;
}

.risk-info .symbol {
  font-size: 18px;
  color: #666;
  margin-bottom: 8px;
}

.risk-info .address {
  font-size: 12px;
  color: #999;
  font-family: monospace;
  margin-bottom: 12px;
}

.risk-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.risk-badge.safe { background: #dcfce7; color: #166534; }
.risk-badge.low { background: #f0fdf4; color: #15803d; }
.risk-badge.medium { background: #fefce8; color: #a16207; }
.risk-badge.high { background: #fff7ed; color: #c2410c; }
.risk-badge.critical { background: #fef2f2; color: #dc2626; }

/* Recommendation */
.recommendation-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.recommendation-card h3 {
  margin-bottom: 12px;
  font-size: 18px;
}

/* Factors Section */
.factors-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.factors-section h3 {
  margin-bottom: 16px;
}

.factors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.factor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.factor-item.critical { background: #fef2f2; }
.factor-item.danger { background: #fff7ed; }
.factor-item.warning { background: #fefce8; }

.factor-icon {
  font-size: 24px;
}

.factor-content h4 {
  font-size: 14px;
  margin-bottom: 4px;
}

.factor-content p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.factor-score {
  font-weight: bold;
  color: #ef4444;
  margin-left: auto;
}

/* Analysis Grid */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.analysis-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.analysis-card h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.concentration-bar {
  margin-top: 16px;
}

.bar-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.bar-container {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-fill.low { background: #22c55e; }
.bar-fill.medium { background: #eab308; }
.bar-fill.high { background: #f97316; }
.bar-fill.critical { background: #ef4444; }

.bar-value {
  display: block;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

/* Contract Flags */
.contract-flags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  background: #f9fafb;
}

.flag.active.warning {
  background: #fef3c7;
}

.flag .icon {
  font-size: 16px;
}

.restrictions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.restrictions h4 {
  font-size: 14px;
  margin-bottom: 8px;
}

.restrictions ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #666;
}

/* Honeypot */
.honeypot-section {
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
}

.honeypot-section h3 {
  color: #dc2626;
  margin-bottom: 12px;
}

.honeypot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.honeypot-item {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  color: #dc2626;
  font-weight: 500;
}

/* Tips Section */
.tips-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tips-section h3 {
  margin-bottom: 16px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 8px;
  color: #374151;
}
</style>
