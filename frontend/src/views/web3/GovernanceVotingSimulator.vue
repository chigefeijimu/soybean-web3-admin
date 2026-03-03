<template>
  <div class="governance-voting-simulator">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="header-card">
          <div class="header-content">
            <div class="title-section">
              <h1>🎯 Governance Voting Simulator</h1>
              <p class="subtitle">Simulate DAO proposal voting outcomes and predict results</p>
            </div>
            <div class="header-actions">
              <el-select v-model="selectedDao" placeholder="Filter by DAO" clearable class="dao-filter">
                <el-option v-for="dao in daos" :key="dao.name" :label="dao.name" :value="dao.name" />
              </el-select>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Stats Overview -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon proposal-icon">📋</div>
            <div class="stat-info">
              <div class="stat-value">{{ proposals.length }}</div>
              <div class="stat-label">Total Proposals</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active-icon">🔥</div>
            <div class="stat-info">
              <div class="stat-value">{{ activeCount }}</div>
              <div class="stat-label">Active</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon passed-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ passedCount }}</div>
              <div class="stat-label">Passed</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon participation-icon">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ avgParticipation }}%</div>
              <div class="stat-label">Avg Participation</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- Proposals List -->
      <el-col :span="16">
        <el-card class="proposals-card">
          <template #header>
            <div class="card-header">
              <span>📋 Proposals</span>
              <el-radio-group v-model="statusFilter" size="small">
                <el-radio-button label="">All</el-radio-button>
                <el-radio-button label="active">Active</el-radio-button>
                <el-radio-button label="pending">Pending</el-radio-button>
                <el-radio-button label="passed">Passed</el-radio-button>
                <el-radio-button label="failed">Failed</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <el-table :data="filteredProposals" style="width: 100%" max-height="400" @row-click="selectProposal">
            <el-table-column prop="id" label="ID" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.id.slice(-3) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dao" label="DAO" width="100">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ row.dao }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="Title" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="Status" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="For" width="90">
              <template #default="{ row }">
                <span class="vote-for">{{ formatNumber(parseFloat(row.forVotes)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Against" width="90">
              <template #default="{ row }">
                <span class="vote-against">{{ formatNumber(parseFloat(row.againstVotes)) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- Simulation Controls -->
      <el-col :span="8">
        <el-card class="simulation-card">
          <template #header>
            <div class="card-header">
              <span>🎮 Simulation Controls</span>
            </div>
          </template>
          
          <div class="simulation-form">
            <el-form label-position="top">
              <el-form-item label="Select Proposal">
                <el-select v-model="selectedProposalId" placeholder="Choose a proposal" class="full-width">
                  <el-option v-for="prop in proposals" :key="prop.id" :label="prop.title.slice(0, 40) + '...'" :value="prop.id" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="Simulation Scenario">
                <el-radio-group v-model="selectedScenario" class="scenario-group">
                  <el-radio value="scenario-optimistic">
                    <div class="scenario-option">
                      <span class="scenario-name">📈 Optimistic</span>
                      <span class="scenario-desc">Max participation & positive sentiment</span>
                    </div>
                  </el-radio>
                  <el-radio value="scenario-realistic">
                    <div class="scenario-option">
                      <span class="scenario-name">🎯 Realistic</span>
                      <span class="scenario-desc">Based on historical patterns</span>
                    </div>
                  </el-radio>
                  <el-radio value="scenario-pessimistic">
                    <div class="scenario-option">
                      <span class="scenario-name">📉 Pessimistic</span>
                      <span class="scenario-desc">Low participation & negative sentiment</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" class="simulate-btn" @click="runSimulation" :loading="simulating">
                  <el-icon><Cpu /></el-icon> Run Simulation
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>

        <!-- Top Delegates -->
        <el-card class="delegates-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>👥 Top Delegates</span>
            </div>
          </template>
          
          <el-table :data="topDelegates" size="small" max-height="250">
            <el-table-column prop="address" label="Delegate" width="120">
              <template #default="{ row }">
                <span class="delegate-address">{{ row.address }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="reputation" label="Rep" width="70">
              <template #default="{ row }">
                <el-tag :type="getReputationType(row.reputation)" size="small">{{ row.reputation }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="votingPower" label="Power" width="80">
              <template #default="{ row }">
                {{ formatNumber(row.votingPower) }}
              </template>
            </el-table-column>
            <el-table-column prop="participationRate" label="Part." width="50">
              <template #default="{ row }">
                {{ row.participationRate }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- Simulation Results -->
    <el-row :gutter="20" v-if="simulationResult" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="results-card">
          <template #header>
            <div class="card-header">
              <span>📊 Simulation Results</span>
              <el-tag :type="getOutcomeType(simulationResult.projectedOutcome)" size="large">
                {{ simulationResult.projectedOutcome.toUpperCase() }}
              </el-tag>
            </div>
          </template>
          
          <el-row :gutter="20">
            <!-- Pass Probability -->
            <el-col :span="6">
              <div class="result-item">
                <div class="result-label">Pass Probability</div>
                <div class="result-value" :class="getProbabilityClass(simulationResult.passProbability)">
                  {{ simulationResult.passProbability }}%
                </div>
                <el-progress 
                  :percentage="simulationResult.passProbability" 
                  :color="getProbabilityColor(simulationResult.passProbability)"
                  :stroke-width="10"
                />
              </div>
            </el-col>
            
            <!-- Quorum Reach -->
            <el-col :span="6">
              <div class="result-item">
                <div class="result-label">Quorum Reach</div>
                <div class="result-value" :class="getProbabilityClass(simulationResult.quorumReachProbability)">
                  {{ simulationResult.quorumReachProbability }}%
                </div>
                <el-progress 
                  :percentage="simulationResult.quorumReachProbability" 
                  :color="getProbabilityColor(simulationResult.quorumReachProbability)"
                  :stroke-width="10"
                />
              </div>
            </el-col>
            
            <!-- Risk Assessment -->
            <el-col :span="6">
              <div class="result-item">
                <div class="result-label">Risk Assessment</div>
                <div class="result-value risk-value" :class="'risk-' + simulationResult.riskAssessment">
                  {{ simulationResult.riskAssessment.toUpperCase() }}
                </div>
                <div class="risk-bar">
                  <div class="risk-fill" :class="'risk-' + simulationResult.riskAssessment" :style="{width: getRiskWidth(simulationResult.riskAssessment)}"></div>
                </div>
              </div>
            </el-col>
            
            <!-- Required Votes -->
            <el-col :span="6">
              <div class="result-item">
                <div class="result-label">Required to Pass</div>
                <div class="result-value">{{ formatNumber(simulationResult.requiredVotesToPass) }}</div>
                <div class="result-sub">votes needed</div>
              </div>
            </el-col>
          </el-row>
          
          <!-- Voting Comparison -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
              <h4>📊 Voting Distribution</h4>
              <div class="vote-comparison">
                <div class="vote-bar">
                  <div class="vote-label">Current</div>
                  <div class="vote-segments">
                    <div class="vote-segment for" :style="{width: getSegmentWidth(simulationResult.currentFor, simulationResult.currentFor + simulationResult.currentAgainst + simulationResult.currentAbstain)}"></div>
                    <div class="vote-segment against" :style="{width: getSegmentWidth(simulationResult.currentAgainst, simulationResult.currentFor + simulationResult.currentAgainst + simulationResult.currentAbstain)}"></div>
                    <div class="vote-segment abstain" :style="{width: getSegmentWidth(simulationResult.currentAbstain, simulationResult.currentFor + simulationResult.currentAgainst + simulationResult.currentAbstain)}"></div>
                  </div>
                  <div class="vote-legend">
                    <span class="legend-item"><span class="dot for"></span>For: {{ formatNumber(simulationResult.currentFor) }}</span>
                    <span class="legend-item"><span class="dot against"></span>Against: {{ formatNumber(simulationResult.currentAgainst) }}</span>
                    <span class="legend-item"><span class="dot abstain"></span>Abstain: {{ formatNumber(simulationResult.currentAbstain) }}</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <h4>🔮 Simulated</h4>
              <div class="vote-comparison">
                <div class="vote-bar">
                  <div class="vote-label">Projected</div>
                  <div class="vote-segments">
                    <div class="vote-segment for" :style="{width: getSegmentWidth(simulationResult.simulationFor, simulationResult.simulationFor + simulationResult.simulationAgainst + simulationResult.simulationAbstain)}"></div>
                    <div class="vote-segment against" :style="{width: getSegmentWidth(simulationResult.simulationAgainst, simulationResult.simulationFor + simulationResult.simulationAgainst + simulationResult.simulationAbstain)}"></div>
                    <div class="vote-segment abstain" :style="{width: getSegmentWidth(simulationResult.simulationAbstain, simulationResult.simulationFor + simulationResult.simulationAgainst + simulationResult.simulationAbstain)}"></div>
                  </div>
                  <div class="vote-legend">
                    <span class="legend-item"><span class="dot for"></span>For: {{ formatNumber(simulationResult.simulationFor) }}</span>
                    <span class="legend-item"><span class="dot against"></span>Against: {{ formatNumber(simulationResult.simulationAgainst) }}</span>
                    <span class="legend-item"><span class="dot abstain"></span>Abstain: {{ formatNumber(simulationResult.simulationAbstain) }}</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <!-- Voting Power Distribution -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="24">
              <h4>🐋 Voting Power Distribution</h4>
              <div class="power-distribution">
                <div class="power-item">
                  <span class="power-label">Large Holders</span>
                  <el-progress :percentage="simulationResult.votingPowerDistribution.largeHolders" :stroke-width="12" color="#67c23a" />
                  <span class="power-value">{{ simulationResult.votingPowerDistribution.largeHolders.toFixed(1) }}%</span>
                </div>
                <div class="power-item">
                  <span class="power-label">Medium Holders</span>
                  <el-progress :percentage="simulationResult.votingPowerDistribution.mediumHolders" :stroke-width="12" color="#409eff" />
                  <span class="power-value">{{ simulationResult.votingPowerDistribution.mediumHolders.toFixed(1) }}%</span>
                </div>
                <div class="power-item">
                  <span class="power-label">Small Holders</span>
                  <el-progress :percentage="simulationResult.votingPowerDistribution.smallHolders" :stroke-width="12" color="#e6a23c" />
                  <span class="power-value">{{ simulationResult.votingPowerDistribution.smallHolders.toFixed(1) }}%</span>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <!-- Recommendations -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="24">
              <h4>💡 Recommendations</h4>
              <div class="recommendations">
                <el-alert
                  v-for="(rec, idx) in simulationResult.recommendations"
                  :key="idx"
                  :title="rec"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- Impact Calculator -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="impact-card">
          <template #header>
            <div class="card-header">
              <span>🧮 Vote Impact Calculator</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="Additional Votes">
                <el-input-number v-model="impactVotes" :min="1000" :step="1000" class="full-width" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Vote Type">
                <el-radio-group v-model="impactVoteType">
                  <el-radio-button value="for">For</el-radio-button>
                  <el-radio-button value="against">Against</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label=" ">
                <el-button type="primary" @click="calculateImpact" :disabled="!selectedProposalId">
                  Calculate Impact
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
          
          <div v-if="impactResult" class="impact-result">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="Before Pass">{{ impactResult.before.passes ? '✅' : '❌' }}</el-descriptions-item>
              <el-descriptions-item label="After Pass">{{ impactResult.after.passes ? '✅' : '❌' }}</el-descriptions-item>
              <el-descriptions-item label="Impact">{{ impactResult.impactPercentage }}%</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Cpu, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const daos = ref<any[]>([])
const proposals = ref<any[]>([])
const topDelegates = ref<any[]>([])
const selectedDao = ref('')
const statusFilter = ref('')
const selectedProposalId = ref('')
const selectedScenario = ref('scenario-realistic')
const simulating = ref(false)
const simulationResult = ref<any>(null)
const impactVotes = ref(10000)
const impactVoteType = ref<'for' | 'against'>('for')
const impactResult = ref<any>(null)

const filteredProposals = computed(() => {
  let filtered = proposals.value
  if (selectedDao.value) {
    filtered = filtered.filter(p => p.dao === selectedDao.value)
  }
  if (statusFilter.value) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }
  return filtered
})

const activeCount = computed(() => proposals.value.filter(p => p.status === 'active').length)
const passedCount = computed(() => proposals.value.filter(p => p.status === 'passed').length)
const avgParticipation = ref('52.3')

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'danger',
    pending: 'warning',
    passed: 'success',
    failed: 'info',
    executed: 'success'
  }
  return types[status] || 'info'
}

const getReputationType = (rep: string) => {
  const types: Record<string, string> = {
    legend: 'danger',
    veteran: 'warning',
    expert: 'primary',
    trusted: 'success',
    new: 'info'
  }
  return types[rep] || 'info'
}

const getProbabilityClass = (prob: number) => {
  if (prob >= 70) return 'high'
  if (prob >= 40) return 'medium'
  return 'low'
}

const getProbabilityColor = (prob: number) => {
  if (prob >= 70) return '#67c23a'
  if (prob >= 40) return '#e6a23c'
  return '#f56c6c'
}

const getOutcomeType = (outcome: string) => {
  const types: Record<string, string> = {
    pass: 'success',
    fail: 'danger',
    tie: 'warning'
  }
  return types[outcome] || 'info'
}

const getRiskWidth = (risk: string) => {
  const widths: Record<string, string> = {
    low: '25%',
    medium: '60%',
    high: '100%'
  }
  return widths[risk] || '50%'
}

const getSegmentWidth = (value: number, total: number) => {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(1) + '%'
}

const selectProposal = (row: any) => {
  selectedProposalId.value = row.id
}

const loadData = async () => {
  try {
    const [daosRes, proposalsRes, delegatesRes, trendsRes] = await Promise.all([
      fetch('/api/governance-voting-simulator/daos').then(r => r.json()),
      fetch('/api/governance-voting-simulator/proposals').then(r => r.json()),
      fetch('/api/governance-voting-simulator/delegates/Uniswap?limit=10').then(r => r.json()),
      fetch('/api/governance-voting-simulator/trends').then(r => r.json())
    ])
    
    daos.value = daosRes
    proposals.value = proposalsRes
    topDelegates.value = delegatesRes
    avgParticipation.value = trendsRes.avgParticipation.replace('%', '')
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

const runSimulation = async () => {
  if (!selectedProposalId.value) {
    ElMessage.warning('Please select a proposal first')
    return
  }
  
  simulating.value = true
  try {
    const response = await fetch(`/api/governance-voting-simulator/simulate/${selectedProposalId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: selectedScenario.value })
    })
    simulationResult.value = await response.json()
    ElMessage.success('Simulation completed!')
  } catch (error) {
    ElMessage.error('Simulation failed')
  } finally {
    simulating.value = false
  }
}

const calculateImpact = async () => {
  if (!selectedProposalId.value) return
  
  try {
    const response = await fetch(`/api/governance-voting-simulator/impact/${selectedProposalId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalVotes: impactVotes.value, voteType: impactVoteType.value })
    })
    impactResult.value = await response.json()
  } catch (error) {
    ElMessage.error('Calculation failed')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.governance-voting-simulator {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h1 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  margin: 5px 0 0;
  color: #909399;
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
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.proposals-card, .simulation-card, .delegates-card, .results-card, .impact-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.full-width {
  width: 100%;
}

.scenario-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scenario-option {
  display: flex;
  flex-direction: column;
}

.scenario-name {
  font-weight: bold;
}

.scenario-desc {
  font-size: 12px;
  color: #909399;
}

.simulate-btn {
  width: 100%;
  margin-top: 10px;
}

.delegate-address {
  font-family: monospace;
  font-size: 12px;
}

.vote-for {
  color: #67c23a;
  font-weight: bold;
}

.vote-against {
  color: #f56c6c;
  font-weight: bold;
}

.result-item {
  text-align: center;
  padding: 15px;
}

.result-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.result-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.result-value.high { color: #67c23a; }
.result-value.medium { color: #e6a23c; }
.result-value.low { color: #f56c6c; }

.result-sub {
  font-size: 12px;
  color: #909399;
}

.risk-value {
  padding: 10px 20px;
  border-radius: 4px;
}

.risk-value.risk-low { background: #f0f9eb; color: #67c23a; }
.risk-value.risk-medium { background: #fdf6ec; color: #e6a23c; }
.risk-value.risk-high { background: #fef0f0; color: #f56c6c; }

.risk-bar {
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 10px;
}

.risk-fill {
  height: 100%;
  border-radius: 4px;
}

.risk-fill.risk-low { background: #67c23a; }
.risk-fill.risk-medium { background: #e6a23c; }
.risk-fill.risk-high { background: #f56c6c; }

.vote-comparison {
  margin-top: 10px;
}

.vote-bar {
  margin-bottom: 15px;
}

.vote-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.vote-segments {
  display: flex;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
}

.vote-segment {
  height: 100%;
  transition: width 0.3s;
}

.vote-segment.for { background: #67c23a; }
.vote-segment.against { background: #f56c6c; }
.vote-segment.abstain { background: #909399; }

.vote-legend {
  display: flex;
  gap: 15px;
  margin-top: 5px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.for { background: #67c23a; }
.dot.against { background: #f56c6c; }
.dot.abstain { background: #909399; }

.power-distribution {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.power-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.power-label {
  width: 120px;
  font-size: 14px;
}

.power-item .el-progress {
  flex: 1;
}

.power-value {
  width: 60px;
  text-align: right;
  font-weight: bold;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.impact-result {
  margin-top: 20px;
}
</style>
