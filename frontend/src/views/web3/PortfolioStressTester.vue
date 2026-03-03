<template>
  <div class="portfolio-stress-tester">
    <div class="header">
      <h1>🎯 Portfolio Stress Tester</h1>
      <p class="subtitle">Analyze portfolio resilience under various market crash scenarios</p>
    </div>

    <!-- Address Input -->
    <div class="input-section">
      <el-input
        v-model="walletAddress"
        placeholder="Enter wallet address (0x...)"
        size="large"
        clearable
        @keyup.enter="runAnalysis"
      >
        <template #prepend>
          <el-select v-model="selectedChain" placeholder="Chain" style="width: 140px">
            <el-option label="All Chains" value="all" />
            <el-option label="Ethereum" value="ethereum" />
            <el-option label="Polygon" value="polygon" />
            <el-option label="Arbitrum" value="arbitrum" />
            <el-option label="Optimism" value="optimism" />
            <el-option label="BSC" value="bsc" />
            <el-option label="Base" value="base" />
            <el-option label="Avalanche" value="avalanche" />
          </el-select>
        </template>
        <template #append>
          <el-button type="primary" @click="runAnalysis" :loading="loading">
            <el-icon><TrendCharts /></el-icon>
            Run Stress Test
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- Quick Summary -->
    <div v-if="summary" class="summary-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="summary-card" shadow="hover">
            <div class="metric">
              <div class="metric-label">Portfolio Value</div>
              <div class="metric-value">${{ formatNumber(summary.portfolioValue) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card" shadow="hover">
            <div class="metric">
              <div class="metric-label">Stress Score</div>
              <div class="metric-value" :class="getScoreClass(summary.overallScore)">
                {{ summary.overallScore }}/100
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card" shadow="hover">
            <div class="metric">
              <div class="metric-label">Risk Level</div>
              <div class="metric-value" :class="getRiskClass(summary.riskLevel)">
                {{ summary.riskLevel.toUpperCase() }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card" shadow="hover">
            <div class="metric">
              <div class="metric-label">Top Risks</div>
              <div class="metric-value risk-count">{{ summary.topRisks.length }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Scenario Results -->
    <div v-if="summary" class="scenarios-section">
      <el-card class="scenario-card">
        <template #header>
          <div class="card-header">
            <span>📊 Stress Scenario Analysis</span>
            <el-tag type="warning">10 Scenarios Tested</el-tag>
          </div>
        </template>
        
        <el-table :data="summary.quickResults" stripe style="width: 100%">
          <el-table-column prop="scenario.name" label="Scenario" min-width="180" />
          <el-table-column prop="scenario.type" label="Type" width="150" />
          <el-table-column prop="scenario.severity" label="Severity" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityType(row.scenario.severity)">
                {{ row.scenario.severity }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="scenario.probability" label="Probability" width="120">
            <template #default="{ row }">
              {{ (row.scenario.probability * 100).toFixed(0) }}%
            </template>
          </el-table-column>
          <el-table-column label="Portfolio Impact" min-width="200">
            <template #default="{ row }">
              <div class="impact-bar">
                <div 
                  class="impact-fill" 
                  :style="{ width: Math.min(100, Math.abs(row.impact.impactPercentage)) + '%' }"
                  :class="getImpactClass(row.impact.impactPercentage)"
                ></div>
                <span class="impact-text">
                  -${{ formatNumber(Math.abs(row.impact.totalImpact)) }}
                  ({{ row.impact.impactPercentage.toFixed(1) }}%)
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="impact.affectedAssets" label="Affected" width="100" />
        </el-table>
      </el-card>
    </div>

    <!-- Recommendations -->
    <div v-if="recommendations.length > 0" class="recommendations-section">
      <el-card class="recommendations-card">
        <template #header>
          <div class="card-header">
            <span>💡 Recommendations</span>
          </div>
        </template>
        <div class="recommendations-list">
          <div v-for="(rec, index) in recommendations" :key="index" class="recommendation-item">
            {{ rec }}
          </div>
        </div>
      </el-card>
    </div>

    <!-- Historical Crashes -->
    <div class="historical-section">
      <el-card class="historical-card">
        <template #header>
          <div class="card-header">
            <span>📜 Historical Market Crashes</span>
            <el-button type="primary" size="small" @click="loadHistoricalCrashes">
              Refresh
            </el-button>
          </div>
        </template>
        
        <el-table :data="historicalCrashes" stripe style="width: 100%">
          <el-table-column prop="name" label="Event" min-width="150" />
          <el-table-column prop="date" label="Date" width="120" />
          <el-table-column prop="severity" label="Severity" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityTagType(row.severity)">
                {{ row.severity }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="btcDrop" label="BTC Drop" width="100">
            <template #default="{ row }">
              <span class="negative">{{ row.btcDrop }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="ethDrop" label="ETH Drop" width="100">
            <template #default="{ row }">
              <span class="negative">{{ row.ethDrop }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="Duration" width="100" />
          <el-table-column prop="recoveryTime" label="Recovery" width="100" />
          <el-table-column prop="description" label="Description" min-width="200" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>

    <!-- Custom Scenario Builder -->
    <div class="custom-scenario-section">
      <el-card class="custom-card">
        <template #header>
          <div class="card-header">
            <span>⚙️ Custom Stress Scenario</span>
          </div>
        </template>
        
        <el-form :model="customScenario" label-width="150px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Scenario Name">
                <el-input v-model="customScenario.name" placeholder="My Custom Scenario" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Scenario Type">
                <el-select v-model="customScenario.type" placeholder="Select type" style="width: 100%">
                  <el-option label="Market Crash" value="market_crash" />
                  <el-option label="Stablecoin Depeg" value="stablecoin_depeg" />
                  <el-option label="Single Asset Crash" value="single_asset_crash" />
                  <el-option label="DeFi Collapse" value="defi_collapse" />
                  <el-option label="Liquidity Crisis" value="liquidity_crisis" />
                  <el-option label="Correlation Breakdown" value="correlation_breakdown" />
                  <el-option label="Regulatory Crackdown" value="regulatory" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Severity (%)">
                <el-slider v-model="customScenario.severity" :min="10" :max="90" show-input />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Probability">
                <el-slider v-model="customScenario.probability" :min="1" :max="50" :format-tooltip="(val: number) => val + '%'" show-input />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" @click="runCustomScenario" :loading="loadingCustom">
              Run Custom Scenario
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- Comparison -->
    <div class="compare-section">
      <el-card class="compare-card">
        <template #header>
          <div class="card-header">
            <span>⚖️ Portfolio Comparison</span>
          </div>
        </template>
        
        <el-form :inline="true" @submit.prevent="comparePortfolios">
          <el-form-item label="Addresses">
            <el-select
              v-model="compareAddresses"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="Add wallet addresses"
              style="width: 400px"
            >
              <el-option
                v-for="addr in compareAddresses"
                :key="addr"
                :label="addr.slice(0, 6) + '...' + addr.slice(-4)"
                :value="addr"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="comparePortfolios" :loading="loadingCompare">
              Compare
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="comparisonResults" class="comparison-results">
          <el-table :data="comparisonResults.comparison" stripe>
            <el-table-column prop="address" label="Address" width="200">
              <template #default="{ row }">
                {{ row.address.slice(0, 6) }}...{{ row.address.slice(-4) }}
              </template>
            </el-table-column>
            <el-table-column prop="portfolioValue" label="Value" width="150">
              <template #default="{ row }">
                ${{ formatNumber(row.portfolioValue) }}
              </template>
            </el-table-column>
            <el-table-column prop="overallScore" label="Score" width="120">
              <template #default="{ row }">
                <el-tag :type="getScoreTagType(row.overallScore)">
                  {{ row.overallScore }}/100
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="Risk" width="120">
              <template #default="{ row }">
                <el-tag :type="getRiskTagType(row.riskLevel)">
                  {{ row.riskLevel }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'
import { 
  getPortfolioStressSummary, 
  getHistoricalCrashes,
  runStressTest,
  comparePortfolios as apiComparePortfolios 
} from '@/service/web3/portfolio-stress-tester'

const walletAddress = ref('')
const selectedChain = ref('all')
const loading = ref(false)
const loadingCustom = ref(false)
const loadingCompare = ref(false)
const summary = ref<any>(null)
const recommendations = ref<string[]>([])
const historicalCrashes = ref<any[]>([])
const comparisonResults = ref<any>(null)
const compareAddresses = ref<string[]>([])

const customScenario = reactive({
  name: '',
  type: 'market_crash',
  severity: 30,
  probability: 10
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

const getScoreClass = (score: number): string => {
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-medium'
  return 'score-bad'
}

const getScoreTagType = (score: number): string => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getRiskClass = (risk: string): string => {
  if (risk === 'low') return 'risk-low'
  if (risk === 'medium') return 'risk-medium'
  if (risk === 'high') return 'risk-high'
  return 'risk-critical'
}

const getRiskTagType = (risk: string): string => {
  if (risk === 'low') return 'success'
  if (risk === 'medium') return 'warning'
  return 'danger'
}

const getSeverityType = (severity: number): string => {
  if (severity <= 20) return 'success'
  if (severity <= 40) return 'warning'
  return 'danger'
}

const getSeverityTagType = (severity: string): string => {
  if (severity === 'low') return 'success'
  if (severity === 'medium') return 'warning'
  if (severity === 'high') return 'danger'
  return 'danger'
}

const getImpactClass = (impact: number): string => {
  if (impact >= -10) return 'impact-low'
  if (impact >= -25) return 'impact-medium'
  return 'impact-high'
}

const runAnalysis = async () => {
  if (!walletAddress.value) {
    ElMessage.warning('Please enter a wallet address')
    return
  }
  
  loading.value = true
  try {
    const chains = selectedChain.value === 'all' 
      ? undefined 
      : [selectedChain.value]
    
    const result = await getPortfolioStressSummary(walletAddress.value, chains)
    summary.value = result
    
    // Extract recommendations from results
    if (result.quickResults && result.quickResults.length > 0) {
      const worst = result.quickResults.reduce((worst: any, current: any) => 
        Math.abs(current.impact.impactPercentage) > Math.abs(worst.impact.impactPercentage) ? current : worst
      )
      recommendations.value = [
        `📉 Worst case: ${worst.scenario.name} would result in ${Math.abs(worst.impact.impactPercentage).toFixed(1)}% loss`,
        `💰 Potential loss: $${formatNumber(Math.abs(worst.impact.totalImpact))}`,
        ...(worst.impact.highlyAffected?.length > 0 
          ? [`⚠️ Highly affected assets: ${worst.impact.highlyAffected.join(', ')}`] 
          : [])
      ]
    }
    
    ElMessage.success('Stress test completed!')
  } catch (error) {
    ElMessage.error('Failed to run stress test')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const runCustomScenario = async () => {
  if (!walletAddress.value) {
    ElMessage.warning('Please enter a wallet address first')
    return
  }
  
  if (!customScenario.name) {
    ElMessage.warning('Please enter a scenario name')
    return
  }
  
  loadingCustom.value = true
  try {
    await runStressTest({
      address: walletAddress.value,
      chains: selectedChain.value === 'all' ? undefined : [selectedChain.value],
      scenarios: ['custom']
    })
    ElMessage.success('Custom scenario completed!')
  } catch (error) {
    ElMessage.error('Failed to run custom scenario')
    console.error(error)
  } finally {
    loadingCustom.value = false
  }
}

const loadHistoricalCrashes = async () => {
  try {
    historicalCrashes.value = await getHistoricalCrashes(10)
  } catch (error) {
    console.error('Failed to load historical crashes:', error)
  }
}

const comparePortfolios = async () => {
  if (compareAddresses.value.length < 2) {
    ElMessage.warning('Please add at least 2 addresses to compare')
    return
  }
  
  loadingCompare.value = true
  try {
    comparisonResults.value = await apiComparePortfolios(compareAddresses.value)
    ElMessage.success('Comparison completed!')
  } catch (error) {
    ElMessage.error('Failed to compare portfolios')
    console.error(error)
  } finally {
    loadingCompare.value = false
  }
}

onMounted(() => {
  loadHistoricalCrashes()
})
</script>

<style scoped>
.portfolio-stress-tester {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #303133;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.input-section {
  margin-bottom: 24px;
}

.summary-section {
  margin-bottom: 24px;
}

.summary-card {
  text-align: center;
}

.metric {
  padding: 10px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.metric-value.score-good {
  color: #67c23a;
}

.metric-value.score-medium {
  color: #e6a23c;
}

.metric-value.score-bad {
  color: #f56c6c;
}

.metric-value.risk-low {
  color: #67c23a;
}

.metric-value.risk-medium {
  color: #e6a23c;
}

.metric-value.risk-high,
.metric-value.risk-critical {
  color: #f56c6c;
}

.metric-value.risk-count {
  color: #303133;
}

.scenarios-section,
.recommendations-section,
.historical-section,
.custom-scenario-section,
.compare-section {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.impact-bar {
  position: relative;
  height: 24px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.impact-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.impact-fill.impact-low {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.impact-fill.impact-medium {
  background: linear-gradient(90deg, #e6a23c, #ebb563);
}

.impact-fill.impact-high {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.impact-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  height: 100%;
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

.recommendations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.recommendation-item {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.negative {
  color: #f56c6c;
}
</style>
