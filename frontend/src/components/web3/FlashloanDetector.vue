<template>
  <div class="flashloan-detector">
    <div class="header">
      <h2>🔍 Flashloan Attack Detector</h2>
      <p>Analyze token vulnerability to flashloan attacks</p>
    </div>

    <!-- Search Form -->
    <div class="search-box">
      <div class="input-group">
        <select v-model="chainId" class="chain-select">
          <option :value="1">Ethereum</option>
          <option :value="56">BSC</option>
          <option :value="137">Polygon</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
          <option :value="8453">Base</option>
        </select>
        <input 
          v-model="tokenAddress" 
          type="text" 
          placeholder="Enter token address (0x...)" 
          class="address-input"
          @keyup.enter="analyzeToken"
        />
        <button @click="analyzeToken" :disabled="loading" class="analyze-btn">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result" class="results">
      <!-- Risk Score Card -->
      <div class="risk-card" :class="result.vulnerabilityLevel">
        <div class="risk-score">
          <div class="score-circle" :class="result.vulnerabilityLevel">
            <span class="score-value">{{ result.vulnerabilityScore }}</span>
            <span class="score-label">Risk Score</span>
          </div>
        </div>
        <div class="risk-info">
          <h3>{{ result.name }} ({{ result.symbol }})</h3>
          <p class="vulnerability-status">
            <span class="status-badge" :class="result.vulnerabilityLevel">
              {{ result.isVulnerable ? '⚠️ VULNERABLE' : '✅ SAFE' }}
            </span>
            <span class="level">{{ result.vulnerabilityLevel.toUpperCase() }} RISK</span>
          </p>
          <p class="address">{{ result.address }}</p>
        </div>
      </div>

      <!-- Vulnerability Factors -->
      <div class="section vulnerability-factors">
        <h3>📋 Vulnerability Factors</h3>
        <div v-if="result.vulnerabilityFactors.length === 0" class="no-issues">
          ✅ No significant vulnerability factors detected
        </div>
        <div v-else class="factors-list">
          <div 
            v-for="(factor, index) in result.vulnerabilityFactors" 
            :key="index" 
            class="factor-item"
            :class="factor.severity"
          >
            <span class="factor-icon">
              {{ factor.severity === 'critical' ? '🚨' : factor.severity === 'high' ? '⚠️' : factor.severity === 'medium' ? '⚡' : '📝' }}
            </span>
            <div class="factor-content">
              <span class="factor-type">{{ formatType(factor.type) }}</span>
              <span class="factor-desc">{{ factor.description }}</span>
              <span v-if="factor.value" class="factor-value">{{ factor.value }}</span>
            </div>
            <span class="severity-badge" :class="factor.severity">{{ factor.severity }}</span>
          </div>
        </div>
      </div>

      <!-- Flashloan Protection -->
      <div class="section protection-status">
        <h3>🛡️ Flashloan Protection</h3>
        <div class="protection-grid">
          <div class="protection-item" :class="{ active: result.flashloanProtection.hasOracleCheck }">
            <span class="icon">{{ result.flashloanProtection.hasOracleCheck ? '✅' : '❌' }}</span>
            <span>Oracle Check</span>
          </div>
          <div class="protection-item" :class="{ active: result.flashloanProtection.hasTimeLock }">
            <span class="icon">{{ result.flashloanProtection.hasTimeLock ? '✅' : '❌' }}</span>
            <span>Time Lock</span>
          </div>
          <div class="protection-item" :class="{ active: result.flashloanProtection.hasAccessControl }">
            <span class="icon">{{ result.flashloanProtection.hasAccessControl ? '✅' : '❌' }}</span>
            <span>Access Control</span>
          </div>
          <div class="protection-item" :class="{ active: result.flashloanProtection.hasPausable }">
            <span class="icon">{{ result.flashloanProtection.hasPausable ? '✅' : '❌' }}</span>
            <span>Pausable</span>
          </div>
          <div class="protection-item" :class="{ active: result.flashloanProtection.usesChainlinkOracle }">
            <span class="icon">{{ result.flashloanProtection.usesChainlinkOracle ? '✅' : '❌' }}</span>
            <span>Chainlink</span>
          </div>
          <div class="protection-item" :class="{ active: result.flashloanProtection.hasMultipleOracles }">
            <span class="icon">{{ result.flashloanProtection.hasMultipleOracles ? '✅' : '❌' }}</span>
            <span>Multi-Oracle</span>
          </div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="section risk-assessment">
        <h3>📊 Risk Assessment</h3>
        <div class="assessment-grid">
          <div class="assessment-item">
            <span class="label">Overall Risk</span>
            <span class="value" :class="result.riskAssessment.overallRisk">
              {{ result.riskAssessment.overallRisk.toUpperCase() }}
            </span>
          </div>
          <div class="assessment-item">
            <span class="label">Attack Probability</span>
            <span class="value">{{ result.riskAssessment.attackProbability }}%</span>
          </div>
          <div class="assessment-item">
            <span class="label">Potential Loss</span>
            <span class="value">{{ result.riskAssessment.potentialLoss }}</span>
          </div>
          <div class="assessment-item" v-if="result.riskAssessment.affectedProtocols.length">
            <span class="label">Affected Protocols</span>
            <span class="value protocols">
              <span v-for="proto in result.riskAssessment.affectedProtocols" :key="proto" class="protocol-tag">
                {{ proto }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section recommendations">
        <h3>💡 Recommendations</h3>
        <ul>
          <li v-for="(rec, index) in result.recommendations" :key="index" :class="{ warning: rec.includes('⚠️'), safe: rec.includes('✅') }">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Recent Attacks -->
    <div class="section recent-attacks">
      <h3>📰 Recent Flashloan Attacks</h3>
      <div class="attacks-list">
        <div v-for="attack in recentAttacks" :key="attack.token" class="attack-item">
          <div class="attack-info">
            <span class="symbol">{{ attack.symbol }}</span>
            <span class="name">{{ attack.name }}</span>
          </div>
          <div class="attack-details">
            <span class="loss">Loss: {{ attack.loss }}</span>
            <span class="date">{{ attack.attackDate }}</span>
          </div>
          <span class="vuln-type">{{ attack.vulnerability }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const chainId = ref(1);
const tokenAddress = ref('');
const loading = ref(false);
const result = ref<any>(null);
const recentAttacks = ref<any[]>([]);

const analyzeToken = async () => {
  if (!tokenAddress.value) return;
  
  loading.value = true;
  try {
    const response = await axios.get(`/api/web3/flashloan-detector/analyze/${chainId.value}/${tokenAddress.value}`);
    result.value = response.data;
  } catch (error) {
    console.error('Analysis failed:', error);
    alert('Failed to analyze token. Please check the address and try again.');
  } finally {
    loading.value = false;
  }
};

const loadRecentAttacks = async () => {
  try {
    const response = await axios.get('/api/web3/flashloan-detector/recent-attacks?limit=10');
    recentAttacks.value = response.data;
  } catch (error) {
    console.error('Failed to load recent attacks:', error);
  }
};

const formatType = (type: string) => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

onMounted(() => {
  loadRecentAttacks();
});
</script>

<style scoped>
.flashloan-detector {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  font-size: 28px;
  color: #fff;
}

.header p {
  color: #888;
  margin-top: 8px;
}

.search-box {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.chain-select {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #16213e;
  color: #fff;
  font-size: 14px;
  min-width: 140px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #16213e;
  color: #fff;
  font-size: 14px;
}

.analyze-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.risk-card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 24px;
  align-items: center;
  border-left: 4px solid;
}

.risk-card.safe { border-color: #4caf50; }
.risk-card.low { border-color: #8bc34a; }
.risk-card.medium { border-color: #ff9800; }
.risk-card.high { border-color: #f44336; }
.risk-card.critical { border-color: #d32f2f; }

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #16213e;
}

.score-circle.safe { border: 3px solid #4caf50; }
.score-circle.low { border: 3px solid #8bc34a; }
.score-circle.medium { border: 3px solid #ff9800; }
.score-circle.high { border: 3px solid #f44336; }
.score-circle.critical { border: 3px solid #d32f2f; }

.score-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.score-label {
  font-size: 10px;
  color: #888;
}

.risk-info h3 {
  margin: 0 0 8px 0;
  color: #fff;
}

.vulnerability-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.safe { background: #4caf50; }
.status-badge.low { background: #8bc34a; }
.status-badge.medium { background: #ff9800; }
.status-badge.high { background: #f44336; }
.status-badge.critical { background: #d32f2f; }

.level {
  color: #888;
  font-size: 12px;
}

.address {
  color: #666;
  font-size: 12px;
  font-family: monospace;
}

.section {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
}

.section h3 {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 18px;
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
  background: #16213e;
}

.factor-item.critical { border-left: 3px solid #d32f2f; }
.factor-item.high { border-left: 3px solid #f44336; }
.factor-item.medium { border-left: 3px solid #ff9800; }
.factor-item.low { border-left: 3px solid #8bc34a; }

.factor-icon {
  font-size: 24px;
}

.factor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.factor-type {
  color: #fff;
  font-weight: 600;
}

.factor-desc {
  color: #888;
  font-size: 14px;
}

.factor-value {
  color: #667eea;
  font-size: 12px;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.critical { background: #d32f2f; color: #fff; }
.severity-badge.high { background: #f44336; color: #fff; }
.severity-badge.medium { background: #ff9800; color: #fff; }
.severity-badge.low { background: #8bc34a; color: #fff; }

.protection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.protection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #16213e;
  border-radius: 8px;
  color: #666;
}

.protection-item.active {
  color: #4caf50;
}

.assessment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.assessment-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assessment-item .label {
  color: #888;
  font-size: 12px;
}

.assessment-item .value {
  color: #fff;
  font-weight: 600;
}

.assessment-item .value.safe { color: #4caf50; }
.assessment-item .value.low { color: #8bc34a; }
.assessment-item .value.medium { color: #ff9800; }
.assessment-item .value.high { color: #f44336; }
.assessment-item .value.critical { color: #d32f2f; }

.protocols {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.protocol-tag {
  padding: 4px 8px;
  background: #667eea;
  border-radius: 4px;
  font-size: 12px;
}

.recommendations ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations li {
  padding: 12px;
  margin-bottom: 8px;
  background: #16213e;
  border-radius: 8px;
  color: #ccc;
}

.recommendations li.warning {
  border-left: 3px solid #ff9800;
}

.recommendations li.safe {
  border-left: 3px solid #4caf50;
}

.no-issues {
  color: #4caf50;
  padding: 20px;
  text-align: center;
  background: #16213e;
  border-radius: 8px;
}

.attacks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attack-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #16213e;
  border-radius: 8px;
}

.attack-info {
  display: flex;
  flex-direction: column;
}

.attack-info .symbol {
  color: #fff;
  font-weight: 600;
}

.attack-info .name {
  color: #888;
  font-size: 12px;
}

.attack-details {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.attack-details .loss {
  color: #f44336;
  font-weight: 600;
}

.attack-details .date {
  color: #666;
  font-size: 12px;
}

.vuln-type {
  color: #ff9800;
  font-size: 12px;
}
</style>
