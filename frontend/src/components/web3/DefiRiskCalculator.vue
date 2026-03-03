<template>
  <div class="defi-risk-calculator">
    <div class="header">
      <h2>🔒 DeFi Risk Calculator</h2>
      <p>Analyze and calculate DeFi portfolio risk scores</p>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <div class="form-group">
        <label>Wallet Address</label>
        <input 
          v-model="walletAddress" 
          placeholder="0x..."
          class="address-input"
        />
      </div>
      
      <div class="form-group">
        <label>Chains</label>
        <div class="chain-selector">
          <label v-for="chain in availableChains" :key="chain" class="chain-checkbox">
            <input 
              type="checkbox" 
              v-model="selectedChains" 
              :value="chain"
            />
            <span>{{ chain }}</span>
          </label>
        </div>
      </div>
      
      <button @click="analyzeRisk" :disabled="loading || !walletAddress" class="analyze-btn">
        {{ loading ? 'Analyzing...' : 'Analyze Risk' }}
      </button>
    </div>

    <!-- Results Section -->
    <div v-if="riskResult" class="results-section">
      <!-- Overall Score -->
      <div class="score-card" :class="riskResult.riskLevel">
        <div class="score-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" stroke-width="8"/>
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              :stroke="getScoreColor(riskResult.overallScore)" 
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="`${riskResult.overallScore * 2.83} 283`"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="score-value">
            <span class="number">{{ riskResult.overallScore }}</span>
            <span class="label">Score</span>
          </div>
        </div>
        <div class="risk-badge" :class="riskResult.riskLevel">
          {{ riskResult.riskLevel.toUpperCase() }} RISK
        </div>
      </div>

      <!-- Risk Breakdown -->
      <div class="breakdown-grid">
        <div class="breakdown-card">
          <h4>Risk Factor Breakdown</h4>
          <div class="factor-list">
            <div v-for="factor in riskResult.factors" :key="factor.category" class="factor-item">
              <div class="factor-header">
                <span class="factor-name">{{ factor.category }}</span>
                <span class="factor-score">{{ factor.score }}</span>
              </div>
              <div class="factor-bar">
                <div 
                  class="factor-fill" 
                  :style="{ width: `${factor.score}%`, background: getScoreColor(factor.score) }"
                ></div>
              </div>
              <span class="factor-weight">Weight: {{ factor.weight * 100 }}%</span>
            </div>
          </div>
        </div>

        <div class="breakdown-card">
          <h4>Risk Categories</h4>
          <div class="category-list">
            <div class="category-item">
              <span class="category-name">Diversification Score</span>
              <span class="category-value" :class="getScoreClass(riskResult.diversificationScore)">
                {{ riskResult.diversificationScore }}%
              </span>
            </div>
            <div class="category-item">
              <span class="category-name">Concentration Risk</span>
              <span class="category-value" :class="getScoreClass(100 - riskResult.concentrationRisk)">
                {{ riskResult.concentrationRisk }}%
              </span>
            </div>
            <div class="category-item">
              <span class="category-name">Smart Contract Risk</span>
              <span class="category-value" :class="getScoreClass(100 - riskResult.smartContractRisk)">
                {{ riskResult.smartContractRisk }}%
              </span>
            </div>
            <div class="category-item">
              <span class="category-name">Liquidity Risk</span>
              <span class="category-value" :class="getScoreClass(100 - riskResult.liquidityRisk)">
                {{ riskResult.liquidityRisk }}%
              </span>
            </div>
            <div class="category-item">
              <span class="category-name">Impermanent Loss Risk</span>
              <span class="category-value" :class="getScoreClass(100 - riskResult.impermanentLossRisk)">
                {{ riskResult.impermanentLossRisk }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Protocol Breakdown -->
      <div class="protocol-section">
        <h4>Protocol Risk Analysis</h4>
        <div class="protocol-list">
          <div 
            v-for="protocol in riskResult.protocolBreakdown" 
            :key="protocol.protocol" 
            class="protocol-card"
            :class="getScoreClass(protocol.score)"
          >
            <div class="protocol-header">
              <span class="protocol-name">{{ protocol.protocol }}</span>
              <span class="protocol-score">{{ protocol.score }}</span>
            </div>
            <div v-if="protocol.issues.length" class="protocol-issues">
              <span v-for="issue in protocol.issues" :key="issue" class="issue-tag">
                {{ issue }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section">
        <h4>💡 Risk Mitigation Recommendations</h4>
        <ul class="recommendations-list">
          <li v-for="(rec, idx) in riskResult.recommendations" :key="idx">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Historical Chart -->
    <div v-if="historicalData" class="historical-section">
      <h4>Historical Risk Score</h4>
      <div class="chart-container">
        <div class="chart-bars">
          <div 
            v-for="point in historicalData.history.slice(-14)" 
            :key="point.date"
            class="chart-bar"
            :style="{ 
              height: `${point.score}%`,
              background: getScoreColor(point.score)
            }"
            :title="`${point.date}: ${point.score}`"
          ></div>
        </div>
        <div class="chart-labels">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </div>
      <div class="historical-summary">
        <div class="summary-item">
          <span class="summary-label">Average Score</span>
          <span class="summary-value">{{ historicalData.summary.avgScore }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Trend</span>
          <span class="summary-value" :class="historicalData.summary.trend">
            {{ historicalData.summary.trend }}
          </span>
        </div>
      </div>
    </div>

    <!-- Comparison Section -->
    <div v-if="comparisonData" class="comparison-section">
      <h4>📊 Portfolio Comparison</h4>
      <div class="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Score</th>
              <th>Risk Level</th>
              <th>Diversification</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in comparisonData.comparison" :key="item.address">
              <td class="address-cell">{{ shortenAddress(item.address) }}</td>
              <td class="score-cell" :class="getScoreClass(item.overallScore)">{{ item.overallScore }}</td>
              <td><span class="risk-tag" :class="item.riskLevel">{{ item.riskLevel }}</span></td>
              <td>{{ item.diversificationScore }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="comparison-summary">
        <div class="best-worst">
          <span class="best">Best: {{ shortenAddress(comparisonData.best.address) }} ({{ comparisonData.best.overallScore }})</span>
          <span class="worst">Worst: {{ shortenAddress(comparisonData.worst.address) }} ({{ comparisonData.worst.overallScore }})</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button @click="viewHistorical" :disabled="!walletAddress" class="secondary-btn">
        View History
      </button>
      <button @click="comparePortfolios" :disabled="!walletAddress" class="secondary-btn">
        Compare Portfolios
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const walletAddress = ref('');
const selectedChains = ref(['ethereum', 'polygon', 'arbitrum']);
const availableChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
const loading = ref(false);
const riskResult = ref<any>(null);
const historicalData = ref<any>(null);
const comparisonData = ref<any>(null);

const getScoreColor = (score: number) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const getScoreClass = (score: number) => {
  if (score >= 80) return 'good';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
};

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const analyzeRisk = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const response = await axios.get(`/api/web3/defi-risk-calculator/analyze`, {
      params: {
        address: walletAddress.value,
        chains: selectedChains.value.join(','),
      },
    });
    riskResult.value = response.data;
    historicalData.value = null;
    comparisonData.value = null;
  } catch (error) {
    console.error('Failed to analyze risk:', error);
  } finally {
    loading.value = false;
  }
};

const viewHistorical = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const response = await axios.get(`/api/web3/defi-risk-calculator/historical`, {
      params: {
        address: walletAddress.value,
        days: 30,
      },
    });
    historicalData.value = response.data;
  } catch (error) {
    console.error('Failed to get historical data:', error);
  } finally {
    loading.value = false;
  }
};

const comparePortfolios = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    // Generate some mock addresses for comparison
    const mockAddresses = [
      walletAddress.value,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEa1',
      '0x8ba1f109551bD432803012645Hc136E7aF428',
    ];
    
    const response = await axios.get(`/api/web3/defi-risk-calculator/comparison`, {
      params: {
        addresses: mockAddresses.join(','),
      },
    });
    comparisonData.value = response.data;
  } catch (error) {
    console.error('Failed to compare portfolios:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.defi-risk-calculator {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.header p {
  margin: 0;
  color: #666;
}

.input-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.address-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.chain-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chain-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.analyze-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
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

.results-section {
  margin-bottom: 24px;
}

.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 24px;
}

.score-circle {
  position: relative;
  width: 180px;
  height: 180px;
}

.score-circle svg {
  width: 100%;
  height: 100%;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value .number {
  display: block;
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
}

.score-value .label {
  font-size: 14px;
  color: #666;
}

.risk-badge {
  margin-top: 16px;
  padding: 8px 24px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
}

.risk-badge.low { background: #dcfce7; color: #166534; }
.risk-badge.medium { background: #fef9c3; color: #854d0e; }
.risk-badge.high { background: #ffedd5; color: #9a3412; }
.risk-badge.critical { background: #fee2e2; color: #991b1b; }

.breakdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.breakdown-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.breakdown-card h4 {
  margin: 0 0 16px 0;
}

.factor-item {
  margin-bottom: 12px;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.factor-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.factor-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.factor-weight {
  font-size: 12px;
  color: #888;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
}

.category-value.good { color: #22c55e; }
.category-value.medium { color: #eab308; }
.category-value.high { color: #f97316; }
.category-value.critical { color: #ef4444; }

.protocol-section {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.protocol-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.protocol-card {
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
}

.protocol-card.good { border-left: 4px solid #22c55e; }
.protocol-card.medium { border-left: 4px solid #eab308; }
.protocol-card.high { border-left: 4px solid #f97316; }
.protocol-card.critical { border-left: 4px solid #ef4444; }

.protocol-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.protocol-name {
  font-weight: 600;
}

.protocol-score {
  font-weight: bold;
}

.protocol-issues {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.issue-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
}

.recommendations-section {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.recommendations-section h4 {
  margin: 0 0 16px 0;
}

.recommendations-list {
  margin: 0;
  padding-left: 20px;
}

.recommendations-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.historical-section,
.comparison-section {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.chart-container {
  margin: 20px 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 120px;
  gap: 4px;
}

.chart-bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  transition: height 0.3s;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-top: 8px;
}

.historical-summary {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 12px;
  color: #888;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
}

.summary-value.improving { color: #22c55e; }
.summary-value.declining { color: #ef4444; }

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.address-cell {
  font-family: monospace;
}

.score-cell.good { color: #22c55e; font-weight: bold; }
.score-cell.medium { color: #eab308; font-weight: bold; }
.score-cell.high { color: #f97316; font-weight: bold; }
.score-cell.critical { color: #ef4444; font-weight: bold; }

.risk-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.risk-tag.low { background: #dcfce7; color: #166534; }
.risk-tag.medium { background: #fef9c3; color: #854d0e; }
.risk-tag.high { background: #ffedd5; color: #9a3412; }
.risk-tag.critical { background: #fee2e2; color: #991b1b; }

.comparison-summary {
  margin-top: 16px;
}

.best-worst {
  display: flex;
  justify-content: space-between;
}

.best { color: #22c55e; }
.worst { color: #ef4444; }

.action-buttons {
  display: flex;
  gap: 12px;
}

.secondary-btn {
  background: #f3f4f6;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.secondary-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
