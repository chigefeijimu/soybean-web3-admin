<template>
  <div class="governance-impact-analyzer">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="header-card">
          <div class="header-content">
            <div class="title-section">
              <h1>📊 Governance Impact Analyzer</h1>
              <p class="subtitle">AI-powered proposal impact analysis and price prediction</p>
            </div>
            <div class="header-actions">
              <el-select v-model="selectedDao" placeholder="Filter by DAO" clearable class="dao-filter">
                <el-option label="All DAOs" value="" />
                <el-option label="Uniswap" value="uniswap" />
                <el-option label="Aave" value="aave" />
                <el-option label="MakerDAO" value="makerdao" />
                <el-option label="Optimism" value="optimism" />
                <el-option label="Arbitrum" value="arbitrum" />
                <el-option label="Lido" value="lido" />
                <el-option label="ENS" value="ens" />
              </el-select>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Stats Overview -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total-icon">📋</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.totalAnalyzed || 0 }}</div>
              <div class="stat-label">Total Analyzed</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bullish-icon">🐂</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.bullishCount || 0 }}</div>
              <div class="stat-label">Bullish</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon bearish-icon">🐻</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.bearishCount || 0 }}</div>
              <div class="stat-label">Bearish</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon neutral-icon">⚖️</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.neutralCount || 0 }}</div>
              <div class="stat-label">Neutral</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon risk-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.highRiskCount || 0 }}</div>
              <div class="stat-label">High Risk</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon sentiment-icon">{{ sentimentEmoji }}</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.marketSentiment || 50 }}</div>
              <div class="stat-label">Sentiment</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- Upcoming Votes -->
      <el-col :span="12">
        <el-card class="proposals-card">
          <template #header>
            <div class="card-header">
              <span>🔥 Upcoming Votes</span>
              <el-tag type="danger">High Impact</el-tag>
            </div>
          </template>
          <div class="proposals-list">
            <div 
              v-for="proposal in stats?.upcomingVotes || []" 
              :key="proposal.proposalId"
              class="proposal-item"
              @click="selectProposal(proposal)"
            >
              <div class="proposal-header">
                <el-tag size="small">{{ proposal.daoName }}</el-tag>
                <el-tag :type="getImpactType(proposal.impactLevel)" size="small">
                  {{ proposal.impactLevel }}
                </el-tag>
              </div>
              <div class="proposal-title">{{ proposal.title }}</div>
              <div class="proposal-meta">
                <span>Impact: <strong :class="proposal.impactLevel">{{ proposal.impactScore }}%</strong></span>
                <span>Type: {{ proposal.type }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Recently Passed -->
      <el-col :span="12">
        <el-card class="proposals-card">
          <template #header>
            <div class="card-header">
              <span>✅ Recently Passed</span>
              <el-tag type="success">Analyzed</el-tag>
            </div>
          </template>
          <div class="proposals-list">
            <div 
              v-for="proposal in stats?.recentlyPassed || []" 
              :key="proposal.proposalId"
              class="proposal-item passed"
              @click="selectProposal(proposal)"
            >
              <div class="proposal-header">
                <el-tag size="small">{{ proposal.daoName }}</el-tag>
                <el-tag type="success" size="small">passed</el-tag>
              </div>
              <div class="proposal-title">{{ proposal.title }}</div>
              <div class="proposal-meta">
                <span>Impact: <strong :class="proposal.impactLevel">{{ proposal.impactScore }}%</strong></span>
                <span>Type: {{ proposal.type }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Proposal Details -->
    <el-row :gutter="20" v-if="selectedProposal">
      <el-col :span="24">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>📋 {{ selectedProposal.title }}</span>
              <el-button @click="selectedProposal = null" text>Close</el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <!-- Impact Score -->
            <el-col :span="6">
              <div class="impact-score-card">
                <div class="score-circle" :class="selectedProposal.impactLevel">
                  <span class="score-value">{{ selectedProposal.impactScore }}</span>
                  <span class="score-label">Impact</span>
                </div>
                <el-tag :type="getImpactType(selectedProposal.impactLevel)" size="large">
                  {{ selectedProposal.impactLevel.toUpperCase() }}
                </el-tag>
              </div>
            </el-col>

            <!-- Price Impact -->
            <el-col :span="18">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="Price Impact" name="price">
                  <el-table :data="priceImpactData" style="width: 100%">
                    <el-table-column prop="period" label="Period" width="120" />
                    <el-table-column label="Min %">
                      <template #default="{ row }">
                        <span :class="row.min >= 0 ? 'positive' : 'negative'">
                          {{ row.min >= 0 ? '+' : '' }}{{ row.min }}%
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column label="Max %">
                      <template #default="{ row }">
                        <span :class="row.max >= 0 ? 'positive' : 'negative'">
                          {{ row.max >= 0 ? '+' : '' }}{{ row.max }}%
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="confidence" label="Confidence">
                      <template #default="{ row }">
                        <el-progress :percentage="row.confidence" :color="getProgressColor(row.confidence)" />
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>

                <el-tab-pane label="Risk Assessment" name="risk">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <div class="risk-overview">
                        <div class="risk-score" :class="selectedProposal.riskAssessment.level">
                          {{ selectedProposal.riskAssessment.overall }}
                        </div>
                        <div class="risk-label">Risk Score</div>
                        <el-tag :type="getRiskType(selectedProposal.riskAssessment.level)">
                          {{ selectedProposal.riskAssessment.level.toUpperCase() }}
                        </el-tag>
                      </div>
                    </el-col>
                    <el-col :span="16">
                      <div class="risk-factors">
                        <div v-for="factor in selectedProposal.riskAssessment.factors" :key="factor.category" class="risk-factor">
                          <div class="factor-header">
                            <span>{{ factor.category }}</span>
                            <span>{{ factor.score }}</span>
                          </div>
                          <el-progress :percentage="factor.score" :color="getRiskColor(factor.score)" />
                          <div class="factor-desc">{{ factor.description }}</div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </el-tab-pane>

                <el-tab-pane label="Portfolio Implications" name="portfolio">
                  <el-table :data="selectedProposal.portfolioImplications" style="width: 100%">
                    <el-table-column prop="position" label="Position" width="180" />
                    <el-table-column prop="action" label="Action" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getActionType(row.action)">{{ row.action }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="reasoning" label="Reasoning" />
                    <el-table-column prop="confidence" label="Confidence" width="150">
                      <template #default="{ row }">
                        <el-progress :percentage="row.confidence" :color="getProgressColor(row.confidence)" />
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>

                <el-tab-pane label="Impact Factors" name="factors">
                  <el-table :data="selectedProposal.factors" style="width: 100%">
                    <el-table-column prop="factor" label="Factor" width="180" />
                    <el-table-column prop="impact" label="Impact" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getFactorType(row.impact)">{{ row.impact }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="weight" label="Weight" width="100">
                      <template #default="{ row }">
                        {{ (row.weight * 100).toFixed(0) }}%
                      </template>
                    </el-table-column>
                    <el-table-column prop="description" label="Description" />
                  </el-table>
                </el-tab-pane>

                <el-tab-pane label="Comparable Proposals" name="comparable">
                  <el-table :data="selectedProposal.comparableProposals" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="100" />
                    <el-table-column prop="daoName" label="DAO" width="120" />
                    <el-table-column prop="title" label="Title" />
                    <el-table-column prop="outcome" label="Outcome" width="100">
                      <template #default="{ row }">
                        <el-tag :type="row.outcome === 'passed' ? 'success' : 'danger'">
                          {{ row.outcome }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="priceChange7d" label="7d Change" width="100">
                      <template #default="{ row }">
                        <span :class="row.priceChange7d >= 0 ? 'positive' : 'negative'">
                          {{ row.priceChange7d >= 0 ? '+' : '' }}{{ row.priceChange7d }}%
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="similarity" label="Similarity" width="120">
                      <template #default="{ row }">
                        <el-progress :percentage="row.similarity * 100" :color="'#67c23a'" />
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>

                <el-tab-pane label="Scenario Simulation" name="scenario">
                  <div class="scenario-buttons">
                    <el-button 
                      v-for="scenario in ['optimistic', 'realistic', 'pessimistic']" 
                      :key="scenario"
                      :type="selectedScenario === scenario ? 'primary' : 'default'"
                      @click="loadScenario(scenario)"
                    >
                      {{ scenario.charAt(0).toUpperCase() + scenario.slice(1) }}
                    </el-button>
                  </div>
                  <div v-if="scenarioResult" class="scenario-result">
                    <el-row :gutter="20">
                      <el-col :span="6">
                        <div class="scenario-score" :class="scenarioResult.impactLevel">
                          {{ scenarioResult.impactScore }}
                        </div>
                        <div class="scenario-label">Impact Score</div>
                      </el-col>
                      <el-col :span="18">
                        <el-descriptions :column="2" border>
                          <el-descriptions-item label="Short Term">
                            <span :class="scenarioResult.priceImpact.shortTerm.min >= 0 ? 'positive' : 'negative'">
                              {{ scenarioResult.priceImpact.shortTerm.min >= 0 ? '+' : '' }}{{ scenarioResult.priceImpact.shortTerm.min }}% ~ {{ scenarioResult.priceImpact.shortTerm.max }}%
                            </span>
                          </el-descriptions-item>
                          <el-descriptions-item label="Medium Term">
                            <span :class="scenarioResult.priceImpact.mediumTerm.min >= 0 ? 'positive' : 'negative'">
                              {{ scenarioResult.priceImpact.mediumTerm.min >= 0 ? '+' : '' }}{{ scenarioResult.priceImpact.mediumTerm.min }}% ~ {{ scenarioResult.priceImpact.mediumTerm.max }}%
                            </span>
                          </el-descriptions-item>
                          <el-descriptions-item label="Long Term">
                            <span :class="scenarioResult.priceImpact.longTerm.min >= 0 ? 'positive' : 'negative'">
                              {{ scenarioResult.priceImpact.longTerm.min >= 0 ? '+' : '' }}{{ scenarioResult.priceImpact.longTerm.min }}% ~ {{ scenarioResult.priceImpact.longTerm.max }}%
                            </span>
                          </el-descriptions-item>
                          <el-descriptions-item label="Risk Level">
                            <el-tag :type="getRiskType(scenarioResult.riskAssessment.level)">
                              {{ scenarioResult.riskAssessment.level }}
                            </el-tag>
                          </el-descriptions-item>
                        </el-descriptions>
                      </el-col>
                    </el-row>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

const selectedDao = ref('')
const selectedProposal = ref<any>(null)
const activeTab = ref('price')
const selectedScenario = ref('realistic')
const scenarioResult = ref<any>(null)
const stats = ref<any>(null)
const proposals = ref<any[]>([])

const sentimentEmoji = computed(() => {
  const sentiment = stats.value?.marketSentiment || 50
  if (sentiment >= 70) return '😄'
  if (sentiment >= 55) return '🙂'
  if (sentiment >= 45) return '😐'
  if (sentiment >= 30) return '😕'
  return '😰'
})

const priceImpactData = computed(() => {
  if (!selectedProposal.value) return []
  const { priceImpact } = selectedProposal.value
  return [
    { period: 'Short Term (24h)', min: priceImpact.shortTerm.min, max: priceImpact.shortTerm.max, confidence: priceImpact.shortTerm.confidence },
    { period: 'Medium Term (7d)', min: priceImpact.mediumTerm.min, max: priceImpact.mediumTerm.max, confidence: priceImpact.mediumTerm.confidence },
    { period: 'Long Term (30d)', min: priceImpact.longTerm.min, max: priceImpact.longTerm.max, confidence: priceImpact.longTerm.confidence },
  ]
})

const getImpactType = (level: string) => {
  const types: Record<string, string> = {
    bullish: 'success',
    neutral: 'warning',
    bearish: 'danger',
  }
  return types[level] || 'info'
}

const getRiskType = (level: string) => {
  const types: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  }
  return types[level] || 'info'
}

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    increase: 'success',
    decrease: 'danger',
    hold: 'warning',
    monitor: 'info',
  }
  return types[action] || 'info'
}

const getFactorType = (impact: string) => {
  const types: Record<string, string> = {
    positive: 'success',
    negative: 'danger',
    neutral: 'info',
  }
  return types[impact] || 'info'
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 70) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getRiskColor = (score: number) => {
  if (score < 25) return '#67c23a'
  if (score < 45) return '#e6a23c'
  return '#f56c6c'
}

const selectProposal = (proposal: any) => {
  selectedProposal.value = proposal
  selectedScenario.value = 'realistic'
  scenarioResult.value = null
}

const loadStats = async () => {
  try {
    const response = await fetch('/api/governance-impact-analyzer/stats')
    stats.value = await response.json()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadProposals = async () => {
  try {
    const url = selectedDao.value 
      ? `/api/governance-impact-analyzer/proposals?dao=${selectedDao.value}`
      : '/api/governance-impact-analyzer/proposals'
    const response = await fetch(url)
    proposals.value = await response.json()
  } catch (error) {
    console.error('Failed to load proposals:', error)
  }
}

const loadScenario = async (scenario: string) => {
  if (!selectedProposal.value) return
  selectedScenario.value = scenario
  try {
    const response = await fetch(`/api/governance-impact-analyzer/simulate/${selectedProposal.value.proposalId}?scenario=${scenario}`)
    scenarioResult.value = await response.json()
  } catch (error) {
    console.error('Failed to load scenario:', error)
  }
}

watch(selectedDao, () => {
  loadProposals()
})

onMounted(() => {
  loadStats()
  loadProposals()
})
</script>

<style scoped>
.governance-impact-analyzer {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h1 {
  margin: 0;
  font-size: 28px;
}

.subtitle {
  margin: 5px 0 0;
  opacity: 0.9;
}

.dao-filter {
  width: 200px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.proposals-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.proposals-list {
  max-height: 400px;
  overflow-y: auto;
}

.proposal-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.proposal-item:hover {
  background: #f5f7fa;
}

.proposal-item.passed {
  opacity: 0.8;
}

.proposal-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.proposal-title {
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 14px;
}

.proposal-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.proposal-meta .bullish {
  color: #67c23a;
}

.proposal-meta .bearish {
  color: #f56c6c;
}

.proposal-meta .neutral {
  color: #e6a23c;
}

.detail-card {
  margin-bottom: 20px;
}

.impact-score-card {
  text-align: center;
  padding: 20px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  border: 4px solid;
}

.score-circle.bullish {
  border-color: #67c23a;
  background: #f0f9eb;
}

.score-circle.bearish {
  border-color: #f56c6c;
  background: #fef0f0;
}

.score-circle.neutral {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
}

.score-label {
  font-size: 12px;
  color: #666;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.risk-overview {
  text-align: center;
  padding: 20px;
}

.risk-score {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 10px;
}

.risk-score.low {
  color: #67c23a;
}

.risk-score.medium {
  color: #e6a23c;
}

.risk-score.high,
.risk-score.critical {
  color: #f56c6c;
}

.risk-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.risk-factors {
  padding: 10px;
}

.risk-factor {
  margin-bottom: 15px;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.factor-desc {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.scenario-buttons {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.scenario-result {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.scenario-score {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
}

.scenario-score.bullish {
  color: #67c23a;
}

.scenario-score.bearish {
  color: #f56c6c;
}

.scenario-score.neutral {
  color: #e6a23c;
}

.scenario-label {
  text-align: center;
  color: #666;
  margin-bottom: 15px;
}
</style>
