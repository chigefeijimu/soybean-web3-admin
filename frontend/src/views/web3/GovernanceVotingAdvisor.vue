<template>
  <div class="governance-voting-advisor">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="header-card">
          <div class="header-content">
            <div class="title-section">
              <h1>🗳️ Governance Voting Advisor</h1>
              <p class="subtitle">AI-powered DAO voting recommendations and strategy management</p>
            </div>
            <div class="header-actions">
              <el-input
                v-model="walletAddress"
                placeholder="Enter wallet address (optional)"
                class="wallet-input"
                clearable
              >
                <template #prefix>
                  <el-icon><Wallet /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Dashboard Overview -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon dao-icon">🏛️</div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData?.overview?.totalDAOs || 0 }}</div>
              <div class="stat-label">Supported DAOs</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon proposal-icon">📋</div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData?.overview?.activeProposals || 0 }}</div>
              <div class="stat-label">Active Proposals</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon deadline-icon">⏰</div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData?.overview?.upcomingDeadlines || 0 }}</div>
              <div class="stat-label">Upcoming Deadlines</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon vote-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData?.overview?.yourVotes || 0 }}</div>
              <div class="stat-label">Your Votes</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- Active Proposals -->
      <el-col :span="16">
        <el-card class="proposals-card">
          <template #header>
            <div class="card-header">
              <span>🔥 Active Proposals</span>
              <el-button type="primary" size="small" @click="loadDashboard">
                <el-icon><Refresh /></el-icon> Refresh
              </el-button>
            </div>
          </template>
          
          <el-table :data="dashboardData?.activeProposals || []" style="width: 100%" max-height="400">
            <el-table-column prop="dao" label="DAO" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.dao }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="Proposal" min-width="200" show-overflow-tooltip />
            <el-table-column prop="endsIn" label="Ends In" width="100" />
            <el-table-column label="Votes For" width="100">
              <template #default="{ row }">
                <span class="vote-for">{{ formatNumber(row.votesFor) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Against" width="100">
              <template #default="{ row }">
                <span class="vote-against">{{ formatNumber(row.votesAgainst) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Progress" width="120">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.quorumProgress" 
                  :color="row.quorumProgress > 70 ? '#67C23A' : '#E6A23C'"
                />
              </template>
            </el-table-column>
            <el-table-column label="Action" width="100">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="analyzeProposal(row)">
                  Analyze
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- Top DAOs -->
      <el-col :span="8">
        <el-card class="daos-card">
          <template #header>
            <span>🏆 Top DAOs</span>
          </template>
          
          <div class="dao-list">
            <div 
              v-for="dao in dashboardData?.topDAOs" 
              :key="dao.name" 
              class="dao-item"
              @click="selectDAO(dao)"
            >
              <div class="dao-info">
                <span class="dao-name">{{ dao.name }}</span>
                <el-tag size="small" type="info">{{ dao.chain }}</el-tag>
              </div>
              <div class="dao-stats">
                <span class="active-count">{{ dao.activeProposals }} active</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Proposal Analysis Section -->
    <el-row :gutter="20" v-if="selectedProposal" class="analysis-section">
      <el-col :span="24">
        <el-card class="analysis-card">
          <template #header>
            <div class="card-header">
              <span>📊 Proposal Analysis: {{ selectedProposal.title }}</span>
              <el-button type="text" @click="selectedProposal = null">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="Recommendation" name="recommendation">
              <div class="recommendation-content">
                <div class="recommendation-box" :class="recommendationData?.recommendation">
                  <div class="recommendation-header">
                    <span class="recommendation-label">Recommendation:</span>
                    <span class="recommendation-value">{{ recommendationData?.recommendation?.toUpperCase() }}</span>
                    <el-tag :type="getRecommendationType(recommendationData?.recommendation)">
                      {{ recommendationData?.confidence }}% confidence
                    </el-tag>
                  </div>
                  <p class="reasoning">{{ recommendationData?.reasoning }}</p>
                </div>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <h4>Key Points</h4>
                    <div class="key-points">
                      <div 
                        v-for="(point, idx) in recommendationData?.keyPoints" 
                        :key="idx"
                        class="key-point"
                        :class="point.type"
                      >
                        <span class="point-icon">
                          {{ point.type === 'positive' ? '✅' : point.type === 'negative' ? '❌' : '➖' }}
                        </span>
                        <span>{{ point.point }}</span>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <h4>Risk Factors</h4>
                    <ul class="risk-factors">
                      <li v-for="(risk, idx) in recommendationData?.riskFactors" :key="idx">
                        {{ risk }}
                      </li>
                    </ul>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Details" name="details">
              <el-row :gutter="20">
                <el-col :span="12">
                  <h4>Voting Status</h4>
                  <el-descriptions :column="1" border>
                    <el-descriptions-item label="Status">
                      <el-tag :type="proposalAnalysis?.status === 'active' ? 'success' : 'info'">
                        {{ proposalAnalysis?.status }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="For Votes">{{ formatNumber(proposalAnalysis?.forVotes) }}</el-descriptions-item>
                    <el-descriptions-item label="Against Votes">{{ formatNumber(proposalAnalysis?.againstVotes) }}</el-descriptions-item>
                    <el-descriptions-item label="Abstain Votes">{{ formatNumber(proposalAnalysis?.abstainVotes) }}</el-descriptions-item>
                    <el-descriptions-item label="Quorum Required">{{ formatNumber(proposalAnalysis?.quorumRequired) }}</el-descriptions-item>
                    <el-descriptions-item label="Voting Ends">{{ formatDate(proposalAnalysis?.votingEnds) }}</el-descriptions-item>
                  </el-descriptions>
                </el-col>
                <el-col :span="12">
                  <h4>Impact Analysis</h4>
                  <div class="impact-bars">
                    <div class="impact-item">
                      <span>Financial</span>
                      <el-progress :percentage="proposalAnalysis?.impactAnalysis?.financial" />
                    </div>
                    <div class="impact-item">
                      <span>Governance</span>
                      <el-progress :percentage="proposalAnalysis?.impactAnalysis?.governance" />
                    </div>
                    <div class="impact-item">
                      <span>Technical</span>
                      <el-progress :percentage="proposalAnalysis?.impactAnalysis?.technical" />
                    </div>
                    <div class="impact-item">
                      <span>Community</span>
                      <el-progress :percentage="proposalAnalysis?.impactAnalysis?.community" />
                    </div>
                  </div>
                </el-col>
              </el-row>

              <el-row :gutter="20" class="sentiment-section">
                <el-col :span="24">
                  <h4>Community Sentiment</h4>
                  <el-tag :type="getSentimentType(proposalAnalysis?.sentiment?.overall)" size="large">
                    {{ proposalAnalysis?.sentiment?.overall?.toUpperCase() }}
                  </el-tag>
                  <div class="sentiment-bars">
                    <div class="sentiment-item">
                      <span>For</span>
                      <el-progress :percentage="proposalAnalysis?.sentiment?.for" color="#67C23A" />
                    </div>
                    <div class="sentiment-item">
                      <span>Against</span>
                      <el-progress :percentage="proposalAnalysis?.sentiment?.against" color="#F56C6C" />
                    </div>
                    <div class="sentiment-item">
                      <span>Abstain</span>
                      <el-progress :percentage="proposalAnalysis?.sentiment?.abstain" color="#909399" />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- Voting Strategy Section -->
    <el-row :gutter="20" class="strategy-section">
      <el-col :span="24">
        <el-card class="strategy-card">
          <template #header>
            <div class="card-header">
              <span>📋 Voting Strategies</span>
              <el-button type="success" size="small" @click="showStrategyDialog = true">
                <el-icon><Plus /></el-icon> Create Strategy
              </el-button>
            </div>
          </template>

          <div v-if="strategies.length === 0" class="empty-strategies">
            <el-empty description="No voting strategies yet" />
          </div>
          <div v-else class="strategy-list">
            <el-card v-for="strategy in strategies" :key="strategy.id" class="strategy-item">
              <div class="strategy-header">
                <h4>{{ strategy.name }}</h4>
                <el-tag :type="getRiskTagType(strategy.riskTolerance)">
                  {{ strategy.riskTolerance }}
                </el-tag>
              </div>
              <p>{{ strategy.description }}</p>
              <div class="strategy-meta">
                <span>DAOs: {{ strategy.daoPreferences?.length || 0 }}</span>
                <span>Votes: {{ strategy.performance?.totalVotes || 0 }}</span>
                <span>Success Rate: {{ strategy.performance?.successRate || 0 }}%</span>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Create Strategy Dialog -->
    <el-dialog v-model="showStrategyDialog" title="Create Voting Strategy" width="500px">
      <el-form :model="newStrategy" label-width="120px">
        <el-form-item label="Strategy Name">
          <el-input v-model="newStrategy.name" placeholder="My Voting Strategy" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newStrategy.description" type="textarea" placeholder="Describe your strategy..." />
        </el-form-item>
        <el-form-item label="Risk Tolerance">
          <el-select v-model="newStrategy.riskTolerance">
            <el-option label="Conservative" value="conservative" />
            <el-option label="Moderate" value="moderate" />
            <el-option label="Aggressive" value="aggressive" />
          </el-select>
        </el-form-item>
        <el-form-item label="Voting Factors">
          <el-checkbox-group v-model="newStrategy.votingFactors">
            <el-checkbox label="technical">Technical Merit</el-checkbox>
            <el-checkbox label="financial">Financial Impact</el-checkbox>
            <el-checkbox label="governance">Governance</el-checkbox>
            <el-checkbox label="community">Community Support</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStrategyDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createStrategy">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Wallet, Refresh, Close, Plus } from '@element-plus/icons-vue'
import { 
  getSupportedDAOs, 
  analyzeProposal, 
  getVotingRecommendation, 
  createVotingStrategy,
  getAllVotingStrategies,
  getDashboard 
} from '@/service/governanceVotingAdvisor'

const walletAddress = ref('')
const dashboardData = ref<any>(null)
const selectedProposal = ref<any>(null)
const proposalAnalysis = ref<any>(null)
const recommendationData = ref<any>(null)
const activeTab = ref('recommendation')
const strategies = ref<any[]>([])
const showStrategyDialog = ref(false)
const selectedDAO = ref('')

const newStrategy = ref({
  name: '',
  description: '',
  riskTolerance: 'moderate',
  votingFactors: [] as string[],
})

const loadDashboard = async () => {
  try {
    const res = await getDashboard(walletAddress.value)
    dashboardData.value = res.data
  } catch (error) {
    ElMessage.error('Failed to load dashboard')
  }
}

const selectDAO = (dao: any) => {
  selectedDAO.value = dao.name
}

const analyzeProposal = async (proposal: any) => {
  selectedProposal.value = proposal
  try {
    const [analysisRes, recRes] = await Promise.all([
      analyzeProposal(proposal.dao, proposal.proposalId),
      getVotingRecommendation(proposal.dao, proposal.proposalId, walletAddress.value || '')
    ])
    proposalAnalysis.value = analysisRes.data
    recommendationData.value = recRes.data
    activeTab.value = 'recommendation'
  } catch (error) {
    ElMessage.error('Failed to analyze proposal')
  }
}

const createStrategy = async () => {
  try {
    const res = await createVotingStrategy({
      ...newStrategy.value,
      daoPreferences: [],
    })
    strategies.value.push(res.data)
    showStrategyDialog.value = false
    ElMessage.success('Strategy created successfully')
    newStrategy.value = {
      name: '',
      description: '',
      riskTolerance: 'moderate',
      votingFactors: [],
    }
  } catch (error) {
    ElMessage.error('Failed to create strategy')
  }
}

const formatNumber = (num: number) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const getRecommendationType = (rec: string) => {
  const types: Record<string, string> = {
    for: 'success',
    against: 'danger',
    abstain: 'warning',
    skip: 'info',
  }
  return types[rec] || 'info'
}

const getSentimentType = (sentiment: string) => {
  const types: Record<string, string> = {
    bullish: 'success',
    bearish: 'danger',
    neutral: 'info',
  }
  return types[sentiment] || 'info'
}

const getRiskTagType = (risk: string) => {
  const types: Record<string, string> = {
    conservative: 'success',
    moderate: 'warning',
    aggressive: 'danger',
  }
  return types[risk] || 'info'
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.governance-voting-advisor {
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

.wallet-input {
  width: 300px;
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
  color: #666;
  font-size: 14px;
}

.proposals-card, .daos-card, .analysis-card, .strategy-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dao-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dao-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.dao-item:hover {
  background: #eef1f6;
  transform: translateX(5px);
}

.dao-name {
  font-weight: 600;
}

.active-count {
  color: #409eff;
  font-size: 13px;
}

.analysis-section {
  margin-top: 20px;
}

.recommendation-content {
  padding: 20px;
}

.recommendation-box {
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  background: #f5f7fa;
}

.recommendation-box.for {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid #67c23a;
}

.recommendation-box.against {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-left: 4px solid #f56c6c;
}

.recommendation-box.abstain {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  border-left: 4px solid #909399;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.recommendation-label {
  font-weight: 600;
}

.recommendation-value {
  font-size: 24px;
  font-weight: bold;
}

.key-points {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-point {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
}

.key-point.positive {
  background: #e8f5e9;
}

.key-point.negative {
  background: #ffebee;
}

.key-point.neutral {
  background: #f5f5f5;
}

.risk-factors {
  list-style: none;
  padding: 0;
}

.risk-factors li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.impact-bars, .sentiment-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.impact-item, .sentiment-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.impact-item span, .sentiment-item span {
  width: 80px;
  font-size: 13px;
}

.sentiment-section {
  margin-top: 20px;
}

.strategy-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.strategy-item {
  margin-bottom: 0;
}

.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.strategy-header h4 {
  margin: 0;
}

.strategy-meta {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 13px;
  margin-top: 10px;
}

.empty-strategies {
  padding: 40px 0;
}

.vote-for {
  color: #67c23a;
  font-weight: 600;
}

.vote-against {
  color: #f56c6c;
  font-weight: 600;
}
</style>
