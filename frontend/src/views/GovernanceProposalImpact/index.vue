<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface ProposalImpact {
  proposalId: string
  dao: string
  chain: string
  title: string
  status: string
  impactScore: number
  impactLevel: string
  priceImpact: {
    shortTerm: { min: number; max: number; confidence: number }
    mediumTerm: { min: number; max: number; confidence: number }
    longTerm: { min: number; max: number; confidence: number }
  }
  riskAssessment: { level: string; factors: string[] }
  affectedTokens: Array<{ symbol: string; impact: number; direction: string }>
  sentimentAnalysis: { community: number; whale: number; overall: number }
  votingPattern: { for: number; against: number; abstain: number }
  quorumRequired: number
  quorumReached: number
  confidence: number
  recommendations: string[]
}

const loading = ref(false)
const proposals = ref<ProposalImpact[]>([])
const selectedProposal = ref<ProposalImpact | null>(null)
const daos = ref<Array<{ name: string; chain: string; proposals: number; tvl: number }>>([])
const selectedDao = ref('')
const showDetail = ref(false)

// Mock data loading
const loadData = async () => {
  loading.value = true
  try {
    // Simulated API call - in production, use actual API
    daos.value = [
      { name: 'Uniswap', chain: 'ethereum', proposals: 45, tvl: 4500000000 },
      { name: 'Aave', chain: 'ethereum', proposals: 32, tvl: 12000000000 },
      { name: 'Compound', chain: 'ethereum', proposals: 28, tvl: 2500000000 },
      { name: 'MakerDAO', chain: 'ethereum', proposals: 56, tvl: 8000000000 },
      { name: 'Curve', chain: 'ethereum', proposals: 38, tvl: 3200000000 }
    ]
    
    proposals.value = generateMockProposals(20)
  } finally {
    loading.value = false
  }
}

const generateMockProposals = (count: number): ProposalImpact[] => {
  const statuses = ['pending', 'active', 'passed', 'failed', 'executed']
  const daos = ['Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve', 'Lido', 'ENS']
  
  return Array.from({ length: count }, (_, i) => ({
    proposalId: `prop-${i + 1}`,
    dao: daos[Math.floor(Math.random() * daos.length)],
    chain: 'ethereum',
    title: `Proposal ${i + 1}: Protocol Parameter Adjustment`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    impactScore: Math.floor(Math.random() * 100),
    impactLevel: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.4 ? 'neutral' : 'bearish',
    priceImpact: {
      shortTerm: { min: -5, max: 15, confidence: 70 },
      mediumTerm: { min: -10, max: 25, confidence: 60 },
      longTerm: { min: -15, max: 40, confidence: 50 }
    },
    riskAssessment: {
      level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      factors: ['Smart contract risk', 'Liquidity risk', 'Oracle manipulation']
    },
    affectedTokens: [
      { symbol: 'UNI', impact: Math.floor(Math.random() * 20), direction: 'positive' },
      { symbol: 'ETH', impact: Math.floor(Math.random() * 10), direction: 'neutral' }
    ],
    sentimentAnalysis: {
      community: Math.floor(Math.random() * 40) + 30,
      whale: Math.floor(Math.random() * 40) + 30,
      overall: Math.floor(Math.random() * 40) + 30
    },
    votingPattern: {
      for: Math.floor(Math.random() * 60) + 20,
      against: Math.floor(Math.random() * 30) + 5,
      abstain: Math.floor(Math.random() * 20) + 1
    },
    quorumRequired: 4000000,
    quorumReached: 3800000,
    confidence: Math.floor(Math.random() * 30) + 60,
    recommendations: ['Monitor governance discussions', 'Assess risk factors']
  }))
}

const viewDetails = (proposal: ProposalImpact) => {
  selectedProposal.value = proposal
  showDetail.value = true
}

const getImpactColor = (level: string) => {
  const colors: Record<string, string> = {
    bullish: '#10B981',
    neutral: '#F59E0B',
    bearish: '#EF4444'
  }
  return colors[level] || '#6B7280'
}

const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626'
  }
  return colors[level] || '#6B7280'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: '#6B7280',
    active: '#3B82F6',
    passed: '#10B981',
    failed: '#EF4444',
    executed: '#8B5CF6'
  }
  return colors[status] || '#6B7280'
}

const filteredProposals = computed(() => {
  if (!selectedDao.value) return proposals.value
  return proposals.value.filter(p => p.dao === selectedDao.value)
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="governance-proposal-impact">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>📊 Governance Proposal Impact Analyzer</h1>
        <p>AI-driven analysis of DAO governance proposals and their potential market impact</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-value">{{ daos.length }}</span>
          <span class="stat-label">Supported DAOs</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">7</span>
          <span class="stat-label">Chains</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ proposals.length }}</span>
          <span class="stat-label">Active Proposals</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="selectedDao" class="dao-select">
        <option value="">All DAOs</option>
        <option v-for="dao in daos" :key="dao.name" :value="dao.name">
          {{ dao.name }}
        </option>
      </select>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        {{ loading ? 'Loading...' : '🔄 Refresh' }}
      </button>
    </div>

    <!-- DAO Cards -->
    <div class="dao-grid">
      <div 
        v-for="dao in daos" 
        :key="dao.name" 
        class="dao-card"
        :class="{ active: selectedDao === dao.name }"
        @click="selectedDao = selectedDao === dao.name ? '' : dao.name"
      >
        <div class="dao-name">{{ dao.name }}</div>
        <div class="dao-chain">{{ dao.chain }}</div>
        <div class="dao-stats">
          <div>
            <span class="label">Proposals</span>
            <span class="value">{{ dao.proposals }}</span>
          </div>
          <div>
            <span class="label">TVL</span>
            <span class="value">${{ (dao.tvl / 1000000000).toFixed(1) }}B</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Proposals Table -->
    <div class="proposals-section">
      <h2>Proposal Impact Analysis</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Proposal</th>
              <th>DAO</th>
              <th>Status</th>
              <th>Impact Score</th>
              <th>Impact Level</th>
              <th>Risk</th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proposal in filteredProposals" :key="proposal.proposalId">
              <td>
                <div class="proposal-info">
                  <span class="proposal-id">{{ proposal.proposalId }}</span>
                  <span class="proposal-title">{{ proposal.title }}</span>
                </div>
              </td>
              <td>{{ proposal.dao }}</td>
              <td>
                <span class="status-badge" :style="{ backgroundColor: getStatusColor(proposal.status) }">
                  {{ proposal.status }}
                </span>
              </td>
              <td>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: proposal.impactScore + '%', backgroundColor: getImpactColor(proposal.impactLevel) }"></div>
                  <span class="score-value">{{ proposal.impactScore }}</span>
                </div>
              </td>
              <td>
                <span class="impact-badge" :style="{ color: getImpactColor(proposal.impactLevel) }">
                  {{ proposal.impactLevel }}
                </span>
              </td>
              <td>
                <span class="risk-badge" :style="{ color: getRiskColor(proposal.riskAssessment.level) }">
                  {{ proposal.riskAssessment.level }}
                </span>
              </td>
              <td>{{ proposal.confidence }}%</td>
              <td>
                <button class="view-btn" @click="viewDetails(proposal)">View Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetail && selectedProposal" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Proposal Impact Analysis</h2>
          <button class="close-btn" @click="showDetail = false">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Basic Info -->
          <div class="detail-section">
            <h3>📋 Proposal Details</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Proposal ID</span>
                <span class="value">{{ selectedProposal.proposalId }}</span>
              </div>
              <div class="detail-item">
                <span class="label">DAO</span>
                <span class="value">{{ selectedProposal.dao }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Chain</span>
                <span class="value">{{ selectedProposal.chain }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Status</span>
                <span class="status-badge" :style="{ backgroundColor: getStatusColor(selectedProposal.status) }">
                  {{ selectedProposal.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Impact Score -->
          <div class="detail-section">
            <h3>📈 Impact Analysis</h3>
            <div class="impact-score-display">
              <div class="score-circle" :style="{ borderColor: getImpactColor(selectedProposal.impactLevel) }">
                <span class="score">{{ selectedProposal.impactScore }}</span>
                <span class="level">{{ selectedProposal.impactLevel }}</span>
              </div>
            </div>
            
            <div class="price-impact-grid">
              <div class="price-impact-card">
                <h4>Short-term (24h)</h4>
                <div class="impact-range">
                  <span class="min">{{ selectedProposal.priceImpact.shortTerm.min }}%</span>
                  <span class="arrow">→</span>
                  <span class="max">{{ selectedProposal.priceImpact.shortTerm.max }}%</span>
                </div>
                <div class="confidence">Confidence: {{ selectedProposal.priceImpact.shortTerm.confidence }}%</div>
              </div>
              <div class="price-impact-card">
                <h4>Medium-term (7d)</h4>
                <div class="impact-range">
                  <span class="min">{{ selectedProposal.priceImpact.mediumTerm.min }}%</span>
                  <span class="arrow">→</span>
                  <span class="max">{{ selectedProposal.priceImpact.mediumTerm.max }}%</span>
                </div>
                <div class="confidence">Confidence: {{ selectedProposal.priceImpact.mediumTerm.confidence }}%</div>
              </div>
              <div class="price-impact-card">
                <h4>Long-term (30d)</h4>
                <div class="impact-range">
                  <span class="min">{{ selectedProposal.priceImpact.longTerm.min }}%</span>
                  <span class="arrow">→</span>
                  <span class="max">{{ selectedProposal.priceImpact.longTerm.max }}%</span>
                </div>
                <div class="confidence">Confidence: {{ selectedProposal.priceImpact.longTerm.confidence }}%</div>
              </div>
            </div>
          </div>

          <!-- Risk Assessment -->
          <div class="detail-section">
            <h3>⚠️ Risk Assessment</h3>
            <div class="risk-display">
              <span class="risk-level" :style="{ color: getRiskColor(selectedProposal.riskAssessment.level) }">
                {{ selectedProposal.riskAssessment.level.toUpperCase() }} RISK
              </span>
            </div>
            <div class="risk-factors">
              <span v-for="factor in selectedProposal.riskAssessment.factors" :key="factor" class="risk-factor">
                {{ factor }}
              </span>
            </div>
          </div>

          <!-- Sentiment Analysis -->
          <div class="detail-section">
            <h3>💭 Sentiment Analysis</h3>
            <div class="sentiment-grid">
              <div class="sentiment-card">
                <span class="sentiment-label">Community</span>
                <div class="sentiment-bar">
                  <div class="sentiment-fill" :style="{ width: selectedProposal.sentimentAnalysis.community + '%' }"></div>
                </div>
                <span class="sentiment-value">{{ selectedProposal.sentimentAnalysis.community }}%</span>
              </div>
              <div class="sentiment-card">
                <span class="sentiment-label">Whale</span>
                <div class="sentiment-bar">
                  <div class="sentiment-fill" :style="{ width: selectedProposal.sentimentAnalysis.whale + '%' }"></div>
                </div>
                <span class="sentiment-value">{{ selectedProposal.sentimentAnalysis.whale }}%</span>
              </div>
              <div class="sentiment-card">
                <span class="sentiment-label">Overall</span>
                <div class="sentiment-bar">
                  <div class="sentiment-fill" :style="{ width: selectedProposal.sentimentAnalysis.overall + '%' }"></div>
                </div>
                <span class="sentiment-value">{{ selectedProposal.sentimentAnalysis.overall }}%</span>
              </div>
            </div>
          </div>

          <!-- Voting Pattern -->
          <div class="detail-section">
            <h3>🗳️ Voting Pattern</h3>
            <div class="voting-stats">
              <div class="voting-bar">
                <div class="voting-for" :style="{ width: selectedProposal.votingPattern.for + '%' }"></div>
                <div class="voting-against" :style="{ width: selectedProposal.votingPattern.against + '%' }"></div>
                <div class="voting-abstain" :style="{ width: selectedProposal.votingPattern.abstain + '%' }"></div>
              </div>
              <div class="voting-labels">
                <span>For: {{ selectedProposal.votingPattern.for }}%</span>
                <span>Against: {{ selectedProposal.votingPattern.against }}%</span>
                <span>Abstain: {{ selectedProposal.votingPattern.abstain }}%</span>
              </div>
            </div>
            <div class="quorum-info">
              <span>Quorum: {{ (selectedProposal.quorumReached / selectedProposal.quorumRequired * 100).toFixed(1) }}% reached</span>
            </div>
          </div>

          <!-- Affected Tokens -->
          <div class="detail-section">
            <h3>🪙 Affected Tokens</h3>
            <div class="tokens-grid">
              <div v-for="token in selectedProposal.affectedTokens" :key="token.symbol" class="token-card">
                <span class="token-symbol">{{ token.symbol }}</span>
                <span class="token-impact" :class="token.direction">
                  {{ token.direction === 'positive' ? '↑' : token.direction === 'negative' ? '↓' : '→' }}
                  {{ token.impact }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="detail-section">
            <h3>💡 Recommendations</h3>
            <ul class="recommendations-list">
              <li v-for="rec in selectedProposal.recommendations" :key="rec">{{ rec }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.governance-proposal-impact {
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.header-content p {
  color: #94a3b8;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: #1e293b;
  padding: 16px 24px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.dao-select {
  padding: 10px 16px;
  border-radius: 8px;
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  min-width: 200px;
}

.refresh-btn {
  padding: 10px 20px;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dao-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.dao-card {
  background: #1e293b;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.dao-card:hover, .dao-card.active {
  border-color: #3b82f6;
}

.dao-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.dao-chain {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.dao-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.dao-stats .label {
  display: block;
  color: #64748b;
}

.dao-stats .value {
  color: #3b82f6;
  font-weight: 600;
}

.proposals-section h2 {
  font-size: 20px;
  margin-bottom: 16px;
}

.table-container {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
}

th {
  background: #334155;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #94a3b8;
}

tr {
  border-bottom: 1px solid #334155;
}

.proposal-info {
  display: flex;
  flex-direction: column;
}

.proposal-id {
  font-size: 12px;
  color: #64748b;
}

.proposal-title {
  font-size: 14px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  text-transform: capitalize;
}

.impact-badge {
  font-weight: 600;
  text-transform: capitalize;
}

.risk-badge {
  font-weight: 600;
  text-transform: capitalize;
}

.score-bar {
  width: 100px;
  height: 24px;
  background: #334155;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  transition: width 0.3s;
}

.score-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
}

.view-btn {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #334155;
}

.modal-header h2 {
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #3b82f6;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.detail-item .value {
  font-weight: 600;
}

.impact-score-display {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.score-circle .score {
  font-size: 36px;
  font-weight: 700;
}

.score-circle .level {
  font-size: 14px;
  text-transform: capitalize;
}

.price-impact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.price-impact-card {
  background: #334155;
  padding: 16px;
  border-radius: 8px;
}

.price-impact-card h4 {
  font-size: 14px;
  margin-bottom: 12px;
}

.impact-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.impact-range .min { color: #ef4444; }
.impact-range .max { color: #10b981; }

.confidence {
  font-size: 12px;
  color: #94a3b8;
}

.risk-display {
  margin-bottom: 12px;
}

.risk-level {
  font-size: 18px;
  font-weight: 700;
}

.risk-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.risk-factor {
  background: #334155;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.sentiment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.sentiment-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sentiment-label {
  font-size: 12px;
  color: #94a3b8;
}

.sentiment-bar {
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.sentiment-fill {
  height: 100%;
  background: #10b981;
}

.sentiment-value {
  font-weight: 600;
}

.voting-stats {
  margin-bottom: 16px;
}

.voting-bar {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.voting-for { background: #10b981; }
.voting-against { background: #ef4444; }
.voting-abstain { background: #64748b; }

.voting-labels {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.quorum-info {
  font-size: 12px;
  color: #94a3b8;
}

.tokens-grid {
  display: flex;
  gap: 12px;
}

.token-card {
  background: #334155;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.token-symbol {
  font-weight: 600;
}

.token-impact {
  font-size: 14px;
}

.token-impact.positive { color: #10b981; }
.token-impact.negative { color: #ef4444; }
.token-impact.neutral { color: #94a3b8; }

.recommendations-list {
  list-style: none;
  padding: 0;
}

.recommendations-list li {
  padding: 8px 0;
  border-bottom: 1px solid #334155;
}

.recommendations-list li::before {
  content: "•";
  color: #3b82f6;
  margin-right: 8px;
}
</style>
