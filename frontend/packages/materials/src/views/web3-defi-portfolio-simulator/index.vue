<template>
  <div class="portfolio-simulator">
    <div class="header">
      <h2>🎯 DeFi Portfolio Simulator</h2>
      <p class="subtitle">Simulate and analyze different DeFi strategies to optimize your portfolio</p>
    </div>

    <!-- Main Input Section -->
    <el-card class="input-card">
      <div class="input-row">
        <el-input
          v-model="walletAddress"
          placeholder="Enter wallet address (optional)"
          class="address-input"
          clearable
        >
          <template #prepend>Address</template>
        </el-input>
        
        <el-select v-model="selectedStrategy" placeholder="Select Strategy" class="strategy-select">
          <el-option
            v-for="strategy in strategies"
            :key="strategy.id"
            :label="strategy.name"
            :value="strategy.id"
          >
            <span>{{ strategy.name }}</span>
            <span class="strategy-risk" :class="strategy.riskLevel">{{ strategy.riskLevel }}</span>
          </el-option>
        </el-select>

        <el-input-number
          v-model="simulationAmount"
          :min="100"
          :max="10000000"
          :step="1000"
          placeholder="Amount (USD)"
          class="amount-input"
        />

        <el-button type="primary" @click="runSimulation" :loading="loading">
          Run Simulation
        </el-button>
      </div>
    </el-card>

    <!-- Tabs for Different Simulation Modes -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Yield Projection Tab -->
      <el-tab-pane label="Yield Projection" name="projection">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>Projected Yield Over Time</span>
                  <el-tag>{{ selectedStrategy }} Strategy</el-tag>
                </div>
              </template>
              <div v-if="projectionData" class="projection-chart">
                <div class="projection-stats">
                  <div class="stat-box">
                    <div class="stat-label">Initial Amount</div>
                    <div class="stat-value">${{ formatNumber(projectionData.initialAmount) }}</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-label">Expected Final Value</div>
                    <div class="stat-value success">${{ formatNumber(projectionData.expected.finalValue) }}</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-label">Expected Profit</div>
                    <div class="stat-value success">+${{ formatNumber(projectionData.expected.profit) }}</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-label">Expected APY</div>
                    <div class="stat-value">{{ projectionData.expected.apy.toFixed(2) }}%</div>
                  </div>
                </div>
                
                <div class="scenario-comparison">
                  <h4>Scenario Comparison</h4>
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <div class="scenario-box best">
                        <div class="scenario-label">Best Case</div>
                        <div class="scenario-value">${{ formatNumber(projectionData.bestCase.finalValue) }}</div>
                        <div class="scenario-apy">+{{ projectionData.bestCase.apy.toFixed(1) }}% APY</div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="scenario-box expected">
                        <div class="scenario-label">Expected</div>
                        <div class="scenario-value">${{ formatNumber(projectionData.expected.finalValue) }}</div>
                        <div class="scenario-apy">+{{ projectionData.expected.apy.toFixed(1) }}% APY</div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="scenario-box worst">
                        <div class="scenario-label">Worst Case</div>
                        <div class="scenario-value">${{ formatNumber(projectionData.worstCase.finalValue) }}</div>
                        <div class="scenario-apy">+{{ projectionData.worstCase.apy.toFixed(1) }}% APY</div>
                      </div>
                    </el-col>
                  </el-row>
                </div>

                <div class="projection-table">
                  <el-table :data="projectionData.projection" style="width: 100%">
                    <el-table-column prop="day" label="Day" width="80" />
                    <el-table-column label="Portfolio Value">
                      <template #default="{ row }">
                        ${{ formatNumber(row.value) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="Profit">
                      <template #default="{ row }">
                        <span class="profit">+${{ formatNumber(row.profit) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="Return %">
                      <template #default="{ row }">
                        <span class="return-pct">+{{ row.returnPercent.toFixed(2) }}%</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
              <div v-else class="empty-state">
                <el-empty description="Run a simulation to see yield projections" />
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="strategy-info-card">
              <template #header>
                <span>Strategy Details</span>
              </template>
              <div v-if="currentStrategy" class="strategy-details">
                <div class="detail-item">
                  <span class="label">Name:</span>
                  <span class="value">{{ currentStrategy.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Risk Level:</span>
                  <el-tag :type="getRiskType(currentStrategy.riskLevel)">
                    {{ currentStrategy.riskLevel.toUpperCase() }}
                  </el-tag>
                </div>
                <div class="detail-item">
                  <span class="label">Description:</span>
                  <span class="value">{{ currentStrategy.description }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Expected APY:</span>
                  <span class="value">{{ currentStrategy.expectedApy.min }}% - {{ currentStrategy.expectedApy.max }}%</span>
                </div>
              </div>
            </el-card>

            <el-card class="duration-card">
              <template #header>
                <span>Simulation Duration</span>
              </template>
              <el-radio-group v-model="simulationDuration" class="duration-group">
                <el-radio-button label="30">30 Days</el-radio-button>
                <el-radio-button label="90">90 Days</el-radio-button>
                <el-radio-button label="180">180 Days</el-radio-button>
                <el-radio-button label="365">1 Year</el-radio-button>
              </el-radio-group>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Historical Backtest Tab -->
      <el-tab-pane label="Historical Backtest" name="backtest">
        <el-card v-if="backtestData" class="backtest-card">
          <template #header>
            <div class="card-header">
              <span>Historical Performance: {{ backtestData.strategy }}</span>
              <el-tag>{{ backtestData.period }}</el-tag>
            </div>
          </template>
          
          <div class="backtest-summary">
            <div class="metric">
              <div class="metric-label">Initial Value</div>
              <div class="metric-value">${{ formatNumber(backtestData.initialValue) }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Final Value</div>
              <div class="metric-value success">${{ formatNumber(backtestData.finalValue) }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Return</div>
              <div class="metric-value" :class="backtestData.totalReturn >= 0 ? 'success' : 'danger'">
                {{ backtestData.totalReturn >= 0 ? '+' : '' }}{{ backtestData.totalReturn.toFixed(2) }}%
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">APY</div>
              <div class="metric-value">{{ backtestData.apy.toFixed(2) }}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Volatility</div>
              <div class="metric-value">{{ backtestData.metrics.volatility.toFixed(2) }}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Max Drawdown</div>
              <div class="metric-value danger">-{{ backtestData.metrics.maxDrawdown.toFixed(2) }}%</div>
            </div>
          </div>

          <div class="backtest-chart">
            <div class="chart-placeholder">
              <div v-for="(point, index) in backtestData.data.slice(0, 30)" :key="index" 
                   class="chart-bar"
                   :style="{ height: `${(point.value / backtestData.finalValue) * 100}%` }"
                   :title="`${point.date}: $${formatNumber(point.value)}`">
              </div>
            </div>
          </div>
        </el-card>
        <el-empty v-else description="Run a backtest to see historical performance" />
      </el-tab-pane>

      <!-- Risk Analysis Tab -->
      <el-tab-pane label="Risk Analysis" name="risk">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card v-if="riskAnalysisData" class="risk-card">
              <template #header>
                <div class="card-header">
                  <span>Portfolio Risk Analysis</span>
                  <el-tag :type="getRiskType(riskAnalysisData.riskLevel)">
                    {{ riskAnalysisData.riskLevel.toUpperCase() }} RISK
                  </el-tag>
                </div>
              </template>
              
              <div class="risk-score-display">
                <div class="score-circle" :class="riskAnalysisData.riskLevel">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" class="bg" />
                    <circle 
                      cx="50" cy="50" r="45" 
                      class="progress"
                      :stroke-dasharray="`${riskAnalysisData.overallRiskScore * 2.83} 283`"
                    />
                  </svg>
                  <div class="score-value">{{ riskAnalysisData.overallRiskScore }}</div>
                </div>
                <div class="score-label">Risk Score</div>
              </div>

              <div class="risk-metrics">
                <div class="risk-metric">
                  <span class="metric-label">Concentration Risk</span>
                  <el-progress 
                    :percentage="riskAnalysisData.metrics.concentrationRisk" 
                    :color="getMetricColor(riskAnalysisData.metrics.concentrationRisk)"
                  />
                </div>
                <div class="risk-metric">
                  <span class="metric-label">Diversity Score</span>
                  <el-progress 
                    :percentage="riskAnalysisData.metrics.diversityScore"
                    :color="getMetricColor(100 - riskAnalysisData.metrics.diversityScore)"
                  />
                </div>
                <div class="risk-metric">
                  <span class="metric-label">Volatility Estimate</span>
                  <el-progress 
                    :percentage="riskAnalysisData.metrics.volatilityEstimate"
                    :color="getMetricColor(riskAnalysisData.metrics.volatilityEstimate)"
                  />
                </div>
                <div class="risk-metric">
                  <span class="metric-label">Chain Diversity</span>
                  <div class="diversity-info">
                    <span>{{ riskAnalysisData.metrics.chainDiversity }} chains</span>
                    <span>{{ riskAnalysisData.metrics.typeDiversity }} types</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card v-if="riskAnalysisData" class="recommendations-card">
              <template #header>
                <span>Risk Recommendations</span>
              </template>
              <div class="recommendations">
                <div v-for="(rec, index) in riskAnalysisData.recommendations" :key="index" 
                     class="recommendation-item">
                  {{ rec }}
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Stress Test Tab -->
      <el-tab-pane label="Stress Test" name="stresstest">
        <el-card class="stress-scenario-card">
          <template #header>
            <div class="card-header">
              <span>Portfolio Stress Test</span>
              <el-select v-model="stressScenario" placeholder="Select Scenario" style="width: 200px">
                <el-option label="Market Crash (40%)" value="market_crash" />
                <el-option label="Liquidity Crisis (25%)" value="liquidity_crisis" />
                <el-option label="Stablecoin Depeg (15%)" value="stablecoin_depeg" />
                <el-option label="Inflation Spike (20%)" value="inflation_spike" />
                <el-option label="Regulatory Crackdown (35%)" value="regulatory_crackdown" />
              </el-select>
            </div>
          </template>
          
          <el-button type="danger" @click="runStressTest" :loading="stressLoading">
            Run Stress Test
          </el-button>

          <div v-if="stressTestData" class="stress-results">
            <el-row :gutter="20" class="stress-summary">
              <el-col :span="6">
                <div class="stress-metric">
                  <div class="metric-label">Original Value</div>
                  <div class="metric-value">${{ formatNumber(stressTestData.originalValue) }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stress-metric">
                  <div class="metric-label">Stressed Value</div>
                  <div class="metric-value danger">${{ formatNumber(stressTestData.stressedValue) }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stress-metric">
                  <div class="metric-label">Potential Loss</div>
                  <div class="metric-value danger">-${{ formatNumber(stressTestData.loss) }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stress-metric">
                  <div class="metric-label">Recovery Time</div>
                  <div class="metric-value">{{ stressTestData.recoveryTime }}</div>
                </div>
              </el-col>
            </el-row>

            <div class="stress-impact">
              <h4>Impact: -{{ stressTestData.lossPercent.toFixed(1) }}%</h4>
              <el-progress 
                :percentage="stressTestData.lossPercent" 
                :stroke-width="20"
                :color="'#f56c6c'"
              />
            </div>

            <div class="stress-recommendations">
              <h4>Recommendations</h4>
              <ul>
                <li v-for="(rec, index) in stressTestData.recommendations" :key="index">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// State
const walletAddress = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0fE1');
const selectedStrategy = ref('balanced');
const simulationAmount = ref(50000);
const simulationDuration = ref('90');
const activeTab = ref('projection');
const loading = ref(false);
const stressLoading = ref(false);
const stressScenario = ref('market_crash');

// Data
const strategies = ref([
  { id: 'conservative', name: 'Conservative', description: 'Focus on stablecoins and low-risk staking', riskLevel: 'low', expectedApy: { min: 3, max: 8 } },
  { id: 'balanced', name: 'Balanced', description: 'Mix of stablecoins and blue-chip DeFi tokens', riskLevel: 'medium', expectedApy: { min: 8, max: 20 } },
  { id: 'aggressive', name: 'Aggressive', description: 'High-yield farming and leverage strategies', riskLevel: 'high', expectedApy: { min: 20, max: 100 } },
  { id: 'lp_farming', name: 'LP Farming', description: 'Concentrated liquidity provision strategies', riskLevel: 'medium-high', expectedApy: { min: 15, max: 50 } },
  { id: 'lending', name: 'Lending', description: 'Supply assets to lending protocols', riskLevel: 'low', expectedApy: { min: 2, max: 12 } },
  { id: 'staking', name: 'Staking', description: 'Proof-of-stake token staking', riskLevel: 'low', expectedApy: { min: 3, max: 15 } },
]);

const projectionData = ref<any>(null);
const backtestData = ref<any>(null);
const riskAnalysisData = ref<any>(null);
const stressTestData = ref<any>(null);

const currentStrategy = computed(() => {
  return strategies.value.find(s => s.id === selectedStrategy.value);
});

// Methods
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
};

const getRiskType = (level: string) => {
  const types: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    'medium-high': 'warning',
    high: 'danger',
  };
  return types[level] || 'info';
};

const getMetricColor = (value: number) => {
  if (value < 30) return '#67c23a';
  if (value < 60) return '#e6a23c';
  return '#f56c6c';
};

const runSimulation = async () => {
  loading.value = true;
  try {
    // Get yield projection
    const projectionResponse = await fetch(
      `/api/defi-portfolio-simulator/yield-projection?amount=${simulationAmount.value}&strategy=${selectedStrategy.value}&duration=${simulationDuration.value}`
    );
    projectionData.value = await projectionResponse.json();

    // Get risk analysis
    const portfolioData = {
      positions: [
        { token: 'ETH', chain: 'ethereum', amount: 2.5, valueUSD: 6250, type: 'token' },
        { token: 'USDC', chain: 'ethereum', amount: 10000, valueUSD: 10000, type: 'token' },
        { token: 'USDT', chain: 'polygon', amount: 5000, valueUSD: 5000, type: 'token' },
        { token: 'stETH', chain: 'ethereum', amount: 3, valueUSD: 7500, type: 'staking' },
        { token: 'USDC LP', chain: 'arbitrum', amount: 15000, valueUSD: 15000, type: 'lp' },
      ],
    };
    
    const riskResponse = await fetch('/api/defi-portfolio-simulator/risk-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolioData),
    });
    riskAnalysisData.value = await riskResponse.json();

    // Get backtest data
    const backtestResponse = await fetch(
      `/api/defi-portfolio-simulator/historical-backtest?address=${walletAddress.value}&strategy=${selectedStrategy.value}&period=${simulationDuration.value}d`
    );
    backtestData.value = await backtestResponse.json();

    ElMessage.success('Simulation completed successfully!');
  } catch (error) {
    console.error('Simulation error:', error);
    // Use mock data for demo
    projectionData.value = generateMockProjection();
    riskAnalysisData.value = generateMockRiskAnalysis();
    backtestData.value = generateMockBacktest();
    ElMessage.info('Showing demo data');
  } finally {
    loading.value = false;
  }
};

const runStressTest = async () => {
  stressLoading.value = true;
  try {
    const response = await fetch(
      `/api/defi-portfolio-simulator/stress-test?address=${walletAddress.value}&scenario=${stressScenario.value}`
    );
    stressTestData.value = await response.json();
    ElMessage.success('Stress test completed!');
  } catch (error) {
    console.error('Stress test error:', error);
    stressTestData.value = generateMockStressTest();
    ElMessage.info('Showing demo data');
  } finally {
    stressLoading.value = false;
  }
};

// Mock data generators for demo
const generateMockProjection = () => ({
  strategy: 'Balanced',
  initialAmount: simulationAmount.value,
  duration: parseInt(simulationDuration.value),
  expected: {
    finalValue: simulationAmount.value * 1.12,
    profit: simulationAmount.value * 0.12,
    apy: 15,
  },
  bestCase: {
    finalValue: simulationAmount.value * 1.25,
    profit: simulationAmount.value * 0.25,
    apy: 25,
  },
  worstCase: {
    finalValue: simulationAmount.value * 1.05,
    profit: simulationAmount.value * 0.05,
    apy: 5,
  },
  projection: Array.from({ length: Math.ceil(parseInt(simulationDuration.value) / 7) }, (_, i) => {
    const day = (i + 1) * 7;
    return {
      day,
      value: simulationAmount.value * (1 + 0.15 * day / 365),
      profit: simulationAmount.value * 0.15 * day / 365,
      returnPercent: 15 * day / 365,
    };
  }),
});

const generateMockRiskAnalysis = () => ({
  overallRiskScore: 45,
  riskLevel: 'medium',
  metrics: {
    concentrationRisk: 35,
    diversityScore: 70,
    volatilityEstimate: 25,
    chainDiversity: 4,
    typeDiversity: 4,
  },
  recommendations: [
    '⚠️ Consider adding more stablecoin positions for stability',
    '🌐 Good chain diversity across 4 chains',
    '📊 Consider adding lending positions for yield optimization',
  ],
});

const generateMockBacktest = () => ({
  strategy: selectedStrategy.value,
  period: `${simulationDuration.value}d`,
  initialValue: simulationAmount.value,
  finalValue: simulationAmount.value * 1.15,
  totalReturn: 15,
  apy: 18,
  data: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
    value: simulationAmount.value * (1 + 0.15 * i / 30),
    change: 0.5 * i,
  })),
  metrics: {
    volatility: 18.5,
    sharpeRatio: 1.2,
    maxDrawdown: 8.5,
  },
});

const generateMockStressTest = () => ({
  scenario: stressScenario.value,
  originalValue: 50000,
  stressedValue: 30000,
  loss: 20000,
  lossPercent: 40,
  recoveryTime: '6-12 months',
  recommendations: [
    'Consider adding more stablecoins as a hedge',
    'Look for buying opportunities in quality assets',
    'Maintain emergency reserves in liquid assets',
  ],
});

onMounted(() => {
  // Run initial simulation
  runSimulation();
});
</script>

<style scoped>
.portfolio-simulator {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: #909399;
  margin: 5px 0 0;
}

.input-card {
  margin-bottom: 20px;
}

.input-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.address-input {
  width: 350px;
}

.strategy-select {
  width: 180px;
}

.amount-input {
  width: 150px;
}

.strategy-risk {
  float: right;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
}

.strategy-risk.low { background: #67c23a20; color: #67c23a; }
.strategy-risk.medium { background: #e6a23c20; color: #e6a23c; }
.strategy-risk.high { background: #f56c6c20; color: #f56c6c; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.projection-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-box {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.stat-value.success {
  color: #67c23a;
}

.scenario-comparison {
  margin: 20px 0;
}

.scenario-comparison h4 {
  margin-bottom: 15px;
}

.scenario-box {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.scenario-box.best { background: #67c23a20; border: 1px solid #67c23a; }
.scenario-box.expected { background: #409eff20; border: 1px solid #409eff; }
.scenario-box.worst { background: #f56c6c20; border: 1px solid #f56c6c; }

.scenario-label {
  font-size: 12px;
  color: #909399;
}

.scenario-value {
  font-size: 20px;
  font-weight: bold;
  margin: 5px 0;
}

.scenario-apy {
  font-size: 14px;
  color: #67c23a;
}

.profit {
  color: #67c23a;
}

.return-pct {
  color: #67c23a;
  font-weight: bold;
}

.strategy-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  color: #909399;
  font-size: 14px;
}

.duration-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.duration-group .el-radio-button {
  width: 100%;
}

.backtest-summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.metric {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
}

.metric-value.success { color: #67c23a; }
.metric-value.danger { color: #f56c6c; }

.backtest-chart {
  height: 200px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #409eff, #67c23a);
  min-height: 20px;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s;
}

.chart-bar:hover {
  background: linear-gradient(to top, #f56c6c, #e6a23c);
}

.risk-score-display {
  text-align: center;
  margin-bottom: 30px;
}

.score-circle {
  width: 150px;
  height: 150px;
  margin: 0 auto;
  position: relative;
}

.score-circle svg {
  transform: rotate(-90deg);
}

.score-circle circle {
  fill: none;
  stroke-width: 8;
}

.score-circle .bg {
  stroke: #f5f7fa;
}

.score-circle .progress {
  stroke: #409eff;
  transition: stroke-dasharray 0.5s;
}

.score-circle.low .progress { stroke: #67c23a; }
.score-circle.medium .progress { stroke: #e6a23c; }
.score-circle.high .progress { stroke: #f56c6c; }

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: bold;
}

.score-label {
  margin-top: 10px;
  color: #909399;
}

.risk-metrics {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.risk-metric {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.diversity-info {
  display: flex;
  gap: 15px;
  color: #909399;
  font-size: 14px;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommendation-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
}

.stress-summary {
  margin: 30px 0;
}

.stress-metric {
  text-align: center;
}

.stress-impact {
  margin: 30px 0;
}

.stress-impact h4 {
  margin-bottom: 10px;
}

.stress-recommendations {
  margin-top: 20px;
}

.stress-recommendations ul {
  list-style: none;
  padding: 0;
}

.stress-recommendations li {
  padding: 10px;
  background: #f5f7fa;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 3px solid #f56c6c;
}

.empty-state {
  padding: 40px;
}

.main-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
}
</style>
