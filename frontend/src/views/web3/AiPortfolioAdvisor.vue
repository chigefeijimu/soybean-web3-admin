<template>
  <div class="ai-portfolio-advisor">
    <div class="header">
      <h2>🤖 AI Portfolio Advisor</h2>
      <p class="subtitle">AI-powered personalized portfolio analysis and recommendations</p>
    </div>

    <!-- Input Section -->
    <el-card class="input-card">
      <el-form :inline="true" :model="formData">
        <el-form-item label="Wallet Address">
          <el-input
            v-model="formData.address"
            placeholder="0x..."
            style="width: 400px"
            clearable
          />
        </el-form-item>
        <el-form-item label="Chain">
          <el-select v-model="formData.chain" placeholder="Select chain" style="width: 150px">
            <el-option label="Ethereum" value="ethereum" />
            <el-option label="Polygon" value="polygon" />
            <el-option label="Arbitrum" value="arbitrum" />
            <el-option label="Optimism" value="optimism" />
            <el-option label="BSC" value="bsc" />
            <el-option label="Base" value="base" />
            <el-option label="Avalanche" value="avalanche" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="analyzePortfolio" :loading="loading.analyze">
            Analyze Portfolio
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Overview Tab -->
      <el-tab-pane label="📊 Overview" name="overview" v-if="analysisData">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-label">Total Value</div>
              <div class="stat-value">${{ formatNumber(analysisData.overview.totalValue) }}</div>
              <div :class="['stat-change', analysisData.overview.changePercent24h >= 0 ? 'positive' : 'negative']">
                {{ analysisData.overview.changePercent24h >= 0 ? '↑' : '↓' }}
                {{ Math.abs(analysisData.overview.changePercent24h).toFixed(2) }}% (24h)
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-label">Risk Score</div>
              <div class="stat-value" :class="getRiskClass(analysisData.riskScore)">
                {{ analysisData.riskScore }}/100
              </div>
              <div class="stat-sub">{{ analysisData.riskLevel }} Risk</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-label">Diversification</div>
              <div class="stat-value">{{ analysisData.diversification.score }}/100</div>
              <div class="stat-sub">{{ analysisData.diversification.rating }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">Asset Allocation</div>
              </template>
              <div class="allocation-list">
                <div v-for="item in analysisData.allocation" :key="item.category" class="allocation-item">
                  <div class="allocation-info">
                    <span class="category">{{ item.category }}</span>
                    <span class="percentage">{{ item.percentage }}%</span>
                  </div>
                  <el-progress :percentage="item.percentage" :color="getCategoryColor(item.category)" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">Top Holdings</div>
              </template>
              <el-table :data="analysisData.holdings.slice(0, 10)" style="width: 100%">
                <el-table-column prop="symbol" label="Token" width="100" />
                <el-table-column prop="chain" label="Chain" width="100" />
                <el-table-column label="Value">
                  <template #default="{ row }">
                    ${{ formatNumber(row.value) }}
                  </template>
                </el-table-column>
                <el-table-column prop="category" label="Category" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">Performance</div>
          </template>
          <el-row :gutter="40">
            <el-col :span="6">
              <div class="perf-item">
                <div class="perf-label">1D Return</div>
                <div :class="['perf-value', analysisData.performance.return1d >= 0 ? 'positive' : 'negative']">
                  {{ analysisData.performance.return1d >= 0 ? '+' : '' }}{{ analysisData.performance.return1d.toFixed(2) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="perf-item">
                <div class="perf-label">7D Return</div>
                <div :class="['perf-value', analysisData.performance.return7d >= 0 ? 'positive' : 'negative']">
                  {{ analysisData.performance.return7d >= 0 ? '+' : '' }}{{ analysisData.performance.return7d.toFixed(2) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="perf-item">
                <div class="perf-label">30D Return</div>
                <div :class="['perf-value', analysisData.performance.return30d >= 0 ? 'positive' : 'negative']">
                  {{ analysisData.performance.return30d >= 0 ? '+' : '' }}{{ analysisData.performance.return30d.toFixed(2) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="perf-item">
                <div class="perf-label">Volatility</div>
                <div class="perf-value">{{ analysisData.performance.volatility }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">AI Recommendations</div>
          </template>
          <el-space direction="vertical" :size="12" style="width: 100%">
            <el-alert
              v-for="(rec, index) in analysisData.recommendations"
              :key="index"
              :title="rec"
              type="info"
              :closable="false"
            />
          </el-space>
        </el-card>
      </el-tab-pane>

      <!-- Recommendations Tab -->
      <el-tab-pane label="💡 Recommendations" name="recommendations">
        <el-card>
          <el-form :inline="true" :model="recForm">
            <el-form-item label="Risk Tolerance">
              <el-select v-model="recForm.riskTolerance" style="width: 150px">
                <el-option label="Conservative" value="conservative" />
                <el-option label="Moderate" value="moderate" />
                <el-option label="Aggressive" value="aggressive" />
              </el-select>
            </el-form-item>
            <el-form-item label="Goal">
              <el-select v-model="recForm.goal" style="width: 150px">
                <el-option label="Income" value="income" />
                <el-option label="Growth" value="growth" />
                <el-option label="Safety" value="safety" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="getRecommendations" :loading="loading.recommend">
                Get Recommendations
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <div v-if="recommendationData" style="margin-top: 20px">
          <el-alert :title="recommendationData.summary" type="success" :closable="false" style="margin-bottom: 20px" />

          <el-row :gutter="20">
            <el-col :span="24">
              <el-card v-for="(rec, index) in recommendationData.recommendations" :key="index" class="rec-card">
                <div class="rec-header">
                  <el-tag :type="getPriorityType(rec.priority)" size="small">{{ rec.priority }}</el-tag>
                  <span class="rec-title">{{ rec.title }}</span>
                </div>
                <p class="rec-desc">{{ rec.description }}</p>
                <div class="rec-meta">
                  <span>📈 Impact: {{ rec.impact }}</span>
                  <span>⚡ Effort: {{ rec.effort }}</span>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card style="margin-top: 20px">
            <template #header>Next Steps</template>
            <el-steps :active="recommendationData.nextSteps.length" simple>
              <el-step v-for="(step, i) in recommendationData.nextSteps" :key="i" :title="step" />
            </el-steps>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Risk Assessment Tab -->
      <el-tab-pane label="⚠️ Risk Assessment" name="risk">
        <el-button v-if="!riskData" type="warning" @click="loadRiskAssessment">
          Load Risk Assessment
        </el-button>

        <div v-if="riskData">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="risk-summary">
                <div class="risk-score" :class="getRiskClass(riskData.overallScore)">
                  {{ riskData.overallScore }}/100
                </div>
                <div class="risk-level">{{ riskData.level }} Risk</div>
              </el-card>
            </el-col>
            <el-col :span="16">
              <el-card>
                <template #header>Risk Factors</template>
                <el-table :data="riskData.factors" style="width: 100%">
                  <el-table-column prop="name" label="Factor" />
                  <el-table-column label="Score">
                    <template #default="{ row }">
                      <el-progress :percentage="row.score" :color="getRiskColor(row.score)" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="Description" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>

          <el-card style="margin-top: 20px">
            <template #header>Risk Mitigation</template>
            <el-table :data="riskData.mitigation" style="width: 100%">
              <el-table-column prop="risk" label="Risk" />
              <el-table-column prop="action" label="Recommended Action" />
              <el-table-column label="Priority">
                <template #default="{ row }">
                  <el-tag :type="row.priority === 'high' ? 'danger' : 'warning'" size="small">
                    {{ row.priority }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Insights Tab -->
      <el-tab-pane label="💭 Insights" name="insights">
        <el-button v-if="!insightsData" type="info" @click="loadInsights">
          Load AI Insights
        </el-button>

        <div v-if="insightsData">
          <el-alert
            :title="insightsData.summary"
            type="success"
            :closable="false"
            style="margin-bottom: 20px"
          />

          <el-space direction="vertical" :size="12" style="width: 100%">
            <el-card v-for="(insight, index) in insightsData.insights" :key="index">
              <div class="insight-header">
                <el-tag :type="getInsightType(insight.type)" size="small">{{ insight.type }}</el-tag>
                <el-tag
                  v-if="insight.severity"
                  :type="insight.severity === 'high' ? 'danger' : insight.severity === 'medium' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ insight.severity }}
                </el-tag>
                <span class="insight-title">{{ insight.title }}</span>
              </div>
              <p>{{ insight.description }}</p>
            </el-card>
          </el-space>
        </div>
      </el-tab-pane>

      <!-- Opportunities Tab -->
      <el-tab-pane label="🎯 Opportunities" name="opportunities">
        <el-button v-if="!opportunitiesData" @click="loadOpportunities">
          Discover Opportunities
        </el-button>

        <div v-if="opportunitiesData">
          <el-row :gutter="20">
            <el-col :span="12" v-for="(opp, index) in opportunitiesData.opportunities" :key="index">
              <el-card class="opp-card">
                <div class="opp-header">
                  <el-tag type="success">{{ opp.type }}</el-tag>
                  <h3>{{ opp.name }}</h3>
                </div>
                <p>{{ opp.description }}</p>
                <div class="opp-metrics">
                  <span>💰 Potential: {{ opp.potential }}</span>
                  <span>⚠️ Risk: {{ opp.risk }}</span>
                </div>
                <el-collapse>
                  <el-collapse-item title="Steps" name="steps">
                    <div v-for="(step, i) in opp.steps" :key="i" class="step-item">{{ step }}</div>
                  </el-collapse-item>
                </el-collapse>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- Optimize Tab -->
      <el-tab-pane label="⚖️ Optimize" name="optimize">
        <el-button v-if="!optimizeData" type="primary" @click="loadOptimization">
          Get Optimization Plan
        </el-button>

        <div v-if="optimizeData">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>Current Allocation</template>
                <div v-for="item in optimizeData.current" :key="item.category" class="alloc-row">
                  <span>{{ item.category }}</span>
                  <span>{{ item.percentage }}%</span>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>Suggested Allocation</template>
                <div v-for="item in optimizeData.suggested" :key="item.category" class="alloc-row">
                  <span>{{ item.category }}</span>
                  <span>{{ item.percentage }}%</span>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card style="margin-top: 20px">
            <template #header>
              <div>Rebalancing Actions</div>
            </template>
            <el-alert
              :title="`Expected Improvement: +${optimizeData.expectedImprovement}%`"
              type="success"
              :closable="false"
              style="margin-bottom: 15px"
            />
            <el-table :data="optimizeData.actions" style="width: 100%">
              <el-table-column prop="type" label="Action" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'Buy' ? 'success' : 'danger'">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="from" label="From" />
              <el-table-column prop="to" label="To" />
              <el-table-column label="Amount">
                <template #default="{ row }">
                  ${{ formatNumber(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="Reason" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Compare Tab -->
      <el-tab-pane label="⚖️ Compare" name="compare">
        <el-card>
          <el-form :inline="true">
            <el-form-item label="Portfolio 1">
              <el-input v-model="compareForm.address1" placeholder="Wallet 1" style="width: 300px" />
            </el-form-item>
            <el-form-item label="Portfolio 2">
              <el-input v-model="compareForm.address2" placeholder="Wallet 2" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="comparePortfolios" :loading="loading.compare">
                Compare
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <div v-if="compareData" style="margin-top: 20px">
          <el-card>
            <el-table :data="compareData.comparison" style="width: 100%">
              <el-table-column prop="metric" label="Metric" />
              <el-table-column prop="value1" label="Portfolio 1">
                <template #default="{ row }">
                  {{ typeof row.value1 === 'number' ? row.value1.toFixed(2) : row.value1 }}
                </template>
              </el-table-column>
              <el-table-column prop="value2" label="Portfolio 2">
                <template #default="{ row }">
                  {{ typeof row.value2 === 'number' ? row.value2.toFixed(2) : row.value2 }}
                </template>
              </el-table-column>
              <el-table-column prop="winner" label="Winner" />
            </el-table>
          </el-card>
          <el-alert :title="compareData.recommendation" type="info" :closable="false" style="margin-top: 20px" />
        </div>
      </el-tab-pane>

      <!-- Market Context Tab -->
      <el-tab-pane label="🌐 Market" name="market">
        <el-button @click="loadMarketContext">Load Market Context</el-button>

        <div v-if="marketData" style="margin-top: 20px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="market-card">
                <div class="market-label">Sentiment</div>
                <div class="market-value">{{ marketData.sentiment }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="market-card">
                <div class="market-label">Volatility</div>
                <div class="market-value">{{ marketData.volatility }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="market-card">
                <div class="market-label">Trend</div>
                <div class="market-value">{{ marketData.trend }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <el-card>
                <template #header>Opportunities</template>
                <el-tag v-for="opp in marketData.opportunities" :key="opp" type="success" style="margin: 5px">
                  {{ opp }}
                </el-tag>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>Risks</template>
                <el-tag v-for="risk in marketData.risks" :key="risk" type="danger" style="margin: 5px">
                  {{ risk }}
                </el-tag>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/service/request'

const activeTab = ref('overview')

const formData = reactive({
  address: '',
  chain: 'ethereum'
})

const recForm = reactive({
  riskTolerance: 'moderate',
  goal: 'growth'
})

// Wrapper functions for API calls
const get = (url: string, options?: any) => request.get(url, options)
const post = (url: string, data?: any) => request.post(url, data)

const compareForm = reactive({
  address1: '',
  address2: ''
})

const loading = reactive({
  analyze: false,
  recommend: false,
  compare: false
})

const analysisData = ref<any>(null)
const recommendationData = ref<any>(null)
const riskData = ref<any>(null)
const insightsData = ref<any>(null)
const opportunitiesData = ref<any>(null)
const optimizeData = ref<any>(null)
const compareData = ref<any>(null)
const marketData = ref<any>(null)

const API_BASE = '/ai-portfolio-advisor'

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num)
}

const getRiskClass = (score: number) => {
  if (score < 30) return 'risk-low'
  if (score < 50) return 'risk-medium'
  if (score < 70) return 'risk-high'
  return 'risk-critical'
}

const getRiskColor = (score: number) => {
  if (score < 30) return '#67c23a'
  if (score < 50) return '#e6a23c'
  if (score < 70) return '#f56c6c'
  return '#dc2626'
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Stablecoins': '#409eff',
    'Layer1': '#67c23a',
    'DeFi': '#e6a23c',
    'NFT': '#909399',
    'Governance': '#c71585'
  }
  return colors[category] || '#409eff'
}

const getPriorityType = (priority: string) => {
  const types: Record<string, string> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return types[priority] || 'info'
}

const getInsightType = (type: string) => {
  const types: Record<string, string> = {
    'opportunity': 'success',
    'risk': 'danger',
    'tip': 'warning',
    'info': 'info'
  }
  return types[type] || 'info'
}

const analyzePortfolio = async () => {
  if (!formData.address) {
    ElMessage.warning('Please enter a wallet address')
    return
  }

  loading.analyze = true
  try {
    const res = await post(`${API_BASE}/analyze`, {
      address: formData.address,
      chain: formData.chain
    })
    analysisData.value = res
    activeTab.value = 'overview'
    ElMessage.success('Portfolio analyzed successfully')
  } catch (error: any) {
    ElMessage.error(error.message || 'Analysis failed')
  } finally {
    loading.analyze = false
  }
}

const getRecommendations = async () => {
  if (!formData.address) {
    ElMessage.warning('Please enter a wallet address first')
    return
  }

  loading.recommend = true
  try {
    const res = await post(`${API_BASE}/recommend`, {
      address: formData.address,
      riskTolerance: recForm.riskTolerance,
      goal: recForm.goal
    })
    recommendationData.value = res
    activeTab.value = 'recommendations'
    ElMessage.success('Recommendations loaded')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to get recommendations')
  } finally {
    loading.recommend = false
  }
}

const loadRiskAssessment = async () => {
  if (!formData.address) {
    ElMessage.warning('Please enter a wallet address first')
    return
  }

  try {
    const res = await get(`${API_BASE}/risk-assessment/${formData.address}`)
    riskData.value = res
    activeTab.value = 'risk'
    ElMessage.success('Risk assessment loaded')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load risk assessment')
  }
}

const loadInsights = async () => {
  if (!formData.address) {
    ElMessage.warning('Please enter a wallet address first')
    return
  }

  try {
    const res = await get(`${API_BASE}/insights/${formData.address}`)
    insightsData.value = res
    activeTab.value = 'insights'
    ElMessage.success('Insights loaded')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load insights')
  }
}

const loadOpportunities = async () => {
  if (!formData.address) {
    ElMessage.warning('Please enter a wallet address first')
    return
  }

  try {
    const res = await get(`${API_BASE}/opportunities/${formData.address}`)
    opportunitiesData.value = res
    activeTab.value = 'opportunities'
    ElMessage.success('Opportunities loaded')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load opportunities')
  }
}

const loadOptimization = async () => {
  if (!formData.address) {
    ElMessage.warning('Please enter a wallet address first')
    return
  }

  try {
    const res = await post(`${API_BASE}/optimize`, {
      address: formData.address
    })
    optimizeData.value = res
    activeTab.value = 'optimize'
    ElMessage.success('Optimization plan loaded')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load optimization')
  }
}

const comparePortfolios = async () => {
  if (!compareForm.address1 || !compareForm.address2) {
    ElMessage.warning('Please enter both wallet addresses')
    return
  }

  loading.compare = true
  try {
    const res = await get(`${API_BASE}/compare/${compareForm.address1}/${compareForm.address2}`)
    compareData.value = res
    activeTab.value = 'compare'
    ElMessage.success('Portfolios compared')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to compare portfolios')
  } finally {
    loading.compare = false
  }
}

const loadMarketContext = async () => {
  try {
    const res = await get(`${API_BASE}/market-context`)
    marketData.value = res
    activeTab.value = 'market'
    ElMessage.success('Market context loaded')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load market context')
  }
}
</script>

<style scoped>
.ai-portfolio-advisor {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 5px 0 0;
  color: #909399;
  font-size: 14px;
}

.input-card {
  margin-bottom: 20px;
}

.main-tabs {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-change {
  font-size: 14px;
  margin-top: 5px;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.allocation-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.allocation-item {
  display: flex;
  flex-direction: column;
}

.allocation-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.allocation-info .category {
  font-weight: 500;
}

.allocation-info .percentage {
  color: #909399;
}

.perf-item {
  text-align: center;
}

.perf-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.perf-value {
  font-size: 20px;
  font-weight: bold;
}

.rec-card {
  margin-bottom: 15px;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.rec-title {
  font-weight: bold;
  font-size: 16px;
}

.rec-desc {
  color: #606266;
  margin: 10px 0;
}

.rec-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.risk-summary {
  text-align: center;
}

.risk-score {
  font-size: 48px;
  font-weight: bold;
}

.risk-level {
  font-size: 18px;
  color: #606266;
}

.risk-low { color: #67c23a; }
.risk-medium { color: #e6a23c; }
.risk-high { color: #f56c6c; }
.risk-critical { color: #dc2626; }

.insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.insight-title {
  font-weight: bold;
}

.opp-card {
  margin-bottom: 20px;
}

.opp-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.opp-header h3 {
  margin: 0;
}

.opp-metrics {
  display: flex;
  gap: 20px;
  margin: 15px 0;
  color: #606266;
  font-size: 14px;
}

.step-item {
  padding: 5px 0;
}

.alloc-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.market-card {
  text-align: center;
}

.market-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.market-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style>
