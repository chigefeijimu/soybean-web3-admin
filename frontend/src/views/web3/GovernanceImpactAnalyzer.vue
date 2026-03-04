<template>
  <div class="governance-impact-analyzer">
    <div class="header-section">
      <h1>🗳️ Governance Impact Analyzer</h1>
      <p class="subtitle">AI-driven DAO proposal impact analysis</p>
    </div>

    <!-- DAO Selector -->
    <div class="dao-selector">
      <a-select
        v-model:value="selectedDao"
        style="width: 200px"
        :options="daoOptions"
        placeholder="Select DAO"
        @change="loadProposals"
      />
      <a-button type="primary" @click="analyzeNewProposal">
        <template #icon><SearchOutlined /></template>
        Analyze New Proposal
      </a-button>
    </div>

    <!-- Summary Dashboard -->
    <a-row :gutter="[16, 16]" class="summary-row">
      <a-col :span="6">
        <a-statistic
          title="Total Proposals"
          :value="summary.totalProposals"
          :value-style="{ color: '#1890ff' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="Active"
          :value="summary.activeProposals"
          :value-style="{ color: '#52c41a' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="Bullish Signals"
          :value="summary.bullishCount"
          :value-style="{ color: '#73d13d' }"
        />
      </a-col>
      <a-col :span="6">
        <a-statistic
          title="High Risk"
          :value="summary.highRiskProposals"
          :value-style="{ color: '#ff4d4f' }"
        />
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]">
      <!-- Proposal List -->
      <a-col :span="12">
        <a-card title="📋 Proposal Impact List" :bordered="false">
          <template #extra>
            <a-button type="link" @click="loadProposals">Refresh</a-button>
          </template>
          <a-list
            :data-source="proposals"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
          >
            <template #renderItem="{ item }">
              <a-list-item 
                :class="{ 'selected': selectedProposal?.proposalId === item.proposalId }"
                @click="selectProposal(item)"
              >
                <a-list-item-meta>
                  <template #title>
                    <span class="proposal-title">{{ item.title }}</span>
                  </template>
                  <template #description>
                    <a-tag :color="getStatusColor(item.status)">{{ item.status }}</a-tag>
                    <span class="dao-name">{{ item.dao }}</span>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-progress 
                    type="circle" 
                    :percent="item.impactScore.overall" 
                    :width="40"
                    :stroke-color="getImpactColor(item.impactScore.overall)"
                  />
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- Impact Details -->
      <a-col :span="12">
        <a-card v-if="selectedProposal" title="📊 Impact Analysis" :bordered="false">
          <!-- Impact Score -->
          <div class="impact-section">
            <h3>Impact Score</h3>
            <div class="score-display">
              <a-progress 
                :percent="selectedProposal.impactScore.overall"
                :stroke-color="getImpactColor(selectedProposal.impactScore.overall)"
                :format="percent => `${percent}`"
              />
              <div class="score-details">
                <span class="bullish">Bullish: {{ selectedProposal.impactScore.bullish }}%</span>
                <span class="neutral">Neutral: {{ selectedProposal.impactScore.neutral }}%</span>
                <span class="bearish">Bearish: {{ selectedProposal.impactScore.bearish }}%</span>
              </div>
              <div class="confidence">
                Confidence: {{ selectedProposal.impactScore.confidence }}%
              </div>
            </div>
          </div>

          <!-- Risk Assessment -->
          <div class="risk-section">
            <h3>Risk Assessment</h3>
            <a-tag :color="getRiskColor(selectedProposal.riskAssessment.level)" class="risk-tag">
              {{ selectedProposal.riskAssessment.level.toUpperCase() }}
            </a-tag>
            <a-progress 
              :percent="selectedProposal.riskAssessment.score"
              :stroke-color="getRiskColor(selectedProposal.riskAssessment.level)"
              :show-info="false"
            />
            <ul class="risk-factors">
              <li v-for="(factor, idx) in selectedProposal.riskAssessment.factors" :key="idx">
                {{ factor }}
              </li>
            </ul>
          </div>

          <!-- Market Prediction -->
          <div class="prediction-section">
            <h3>Market Prediction</h3>
            <div class="prediction-grid">
              <div class="prediction-item">
                <span class="label">Pass Probability</span>
                <a-progress 
                  :percent="selectedProposal.marketPrediction.passProbability"
                  status="active"
                  :stroke-color="#52c41a"
                />
              </div>
              <div class="prediction-item">
                <span class="label">Fail Probability</span>
                <a-progress 
                  :percent="selectedProposal.marketPrediction.failProbability"
                  status="exception"
                  :stroke-color="#ff4d4f"
                />
              </div>
            </div>
            
            <div class="price-impact">
              <h4>Price Impact</h4>
              <a-row :gutter="8">
                <a-col :span="8">
                  <div class="impact-card">
                    <div class="impact-label">Short Term</div>
                    <div :class="['impact-value', selectedProposal.marketPrediction.priceImpact.shortTerm.direction]">
                      {{ selectedProposal.marketPrediction.priceImpact.shortTerm.direction === 'bullish' ? '↑' : '↓' }}
                      {{ selectedProposal.marketPrediction.priceImpact.shortTerm.percentage }}%
                    </div>
                  </div>
                </a-col>
                <a-col :span="8">
                  <div class="impact-card">
                    <div class="impact-label">Medium Term</div>
                    <div :class="['impact-value', selectedProposal.marketPrediction.priceImpact.mediumTerm.direction]">
                      {{ selectedProposal.marketPrediction.priceImpact.mediumTerm.direction === 'bullish' ? '↑' : '↓' }}
                      {{ selectedProposal.marketPrediction.priceImpact.mediumTerm.percentage }}%
                    </div>
                  </div>
                </a-col>
                <a-col :span="8">
                  <div class="impact-card">
                    <div class="impact-label">Long Term</div>
                    <div :class="['impact-value', selectedProposal.marketPrediction.priceImpact.longTerm.direction]">
                      {{ selectedProposal.marketPrediction.priceImpact.longTerm.direction === 'bullish' ? '↑' : '↓' }}
                      {{ selectedProposal.marketPrediction.priceImpact.longTerm.percentage }}%
                    </div>
                  </div>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- Affected Tokens -->
          <div class="tokens-section">
            <h3>Affected Tokens</h3>
            <a-tag 
              v-for="token in selectedProposal.marketPrediction.affectedTokens" 
              :key="token.token"
              :color="token.impact === 'positive' ? 'green' : 'default'"
            >
              {{ token.token }} ({{ token.confidence }}%)
            </a-tag>
          </div>

          <!-- Sentiment -->
          <div class="sentiment-section">
            <h3>Sentiment Analysis</h3>
            <a-row :gutter="16">
              <a-col :span="12">
                <div class="sentiment-item">
                  <span>Community</span>
                  <a-progress :percent="selectedProposal.sentiment.community" :show-info="false" />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="sentiment-item">
                  <span>Whales</span>
                  <a-progress :percent="selectedProposal.sentiment.whale" :show-info="false" />
                </div>
              </a-col>
            </a-row>
          </div>

          <!-- Recommendation -->
          <div class="recommendation-section">
            <h3>💡 Recommendation</h3>
            <a-alert
              :message="selectedProposal.recommendation"
              :type="selectedProposal.impactScore.overall > 60 ? 'success' : 'warning'"
              show-icon
            />
          </div>

          <!-- Affected Protocols -->
          <div class="protocols-section">
            <h3>Affected Protocols</h3>
            <a-tag v-for="protocol in selectedProposal.affectedProtocols" :key="protocol">
              {{ protocol }}
            </a-tag>
          </div>
        </a-card>
        <a-empty v-else description="Select a proposal to view impact analysis" />
      </a-col>
    </a-row>

    <!-- Analyze Modal -->
    <a-modal
      v-model:open="analyzeModalVisible"
      title="Analyze New Proposal"
      @ok="submitAnalysis"
      :confirm-loading="analyzing"
    >
      <a-form :model="analyzeForm" layout="vertical">
        <a-form-item label="DAO">
          <a-select v-model:value="analyzeForm.dao" :options="daoOptions" />
        </a-form-item>
        <a-form-item label="Proposal ID">
          <a-input v-model:value="analyzeForm.proposalId" placeholder="e.g., 123" />
        </a-form-item>
        <a-form-item label="Proposal Title">
          <a-input v-model:value="analyzeForm.title" placeholder="Enter proposal title" />
        </a-form-item>
        <a-form-item label="Description">
          <a-textarea v-model:value="analyzeForm.description" :rows="3" placeholder="Proposal description" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import axios from 'axios';

interface ImpactScore {
  overall: number;
  bullish: number;
  neutral: number;
  bearish: number;
  confidence: number;
}

interface RiskAssessment {
  level: string;
  factors: string[];
  score: number;
}

interface MarketPrediction {
  passProbability: number;
  failProbability: number;
  priceImpact: {
    shortTerm: { direction: string; percentage: number };
    mediumTerm: { direction: string; percentage: number };
    longTerm: { direction: string; percentage: number };
  };
  affectedTokens: Array<{
    token: string;
    impact: string;
    confidence: number;
  }>;
}

interface Proposal {
  dao: string;
  proposalId: string;
  title: string;
  description: string;
  status: string;
  impactScore: ImpactScore;
  riskAssessment: RiskAssessment;
  marketPrediction: MarketPrediction;
  sentiment: {
    overall: string;
    community: number;
    whale: number;
  };
  affectedProtocols: string[];
  recommendation: string;
}

const loading = ref(false);
const analyzing = ref(false);
const selectedDao = ref('all');
const proposals = ref<Proposal[]>([]);
const selectedProposal = ref<Proposal | null>(null);
const analyzeModalVisible = ref(false);
const analyzeForm = ref({
  dao: 'Uniswap',
  proposalId: '',
  title: '',
  description: '',
});

const summary = ref({
  totalProposals: 0,
  activeProposals: 0,
  passedProposals: 0,
  pendingProposals: 0,
  averageImpactScore: 0,
  bullishCount: 0,
  bearishCount: 0,
  highRiskProposals: 0,
});

const daoOptions = [
  { value: 'all', label: 'All DAOs' },
  { value: 'Uniswap', label: 'Uniswap' },
  { value: 'Aave', label: 'Aave' },
  { value: 'MakerDAO', label: 'MakerDAO' },
  { value: 'Compound', label: 'Compound' },
  { value: 'Curve', label: 'Curve' },
  { value: 'Lido', label: 'Lido' },
  { value: 'ENS', label: 'ENS' },
  { value: 'Balancer', label: 'Balancer' },
  { value: 'Optimism', label: 'Optimism' },
  { value: 'Arbitrum', label: 'Arbitrum' },
];

const API_BASE = '/api/governance-impact-analyzer';

const loadProposals = async () => {
  loading.value = true;
  try {
    const daoParam = selectedDao.value === 'all' ? undefined : selectedDao.value;
    const [summaryRes, proposalsRes] = await Promise.all([
      axios.get(`${API_BASE}/summary`, { params: { dao: daoParam } }),
      axios.get(`${API_BASE}/trending`, { params: { limit: 20 } }),
    ]);
    summary.value = summaryRes.data;
    proposals.value = proposalsRes.data;
    if (proposals.value.length > 0 && !selectedProposal.value) {
      selectedProposal.value = proposals.value[0];
    }
  } catch (error) {
    console.error('Failed to load proposals:', error);
    message.error('Failed to load proposals');
  } finally {
    loading.value = false;
  }
};

const selectProposal = (proposal: Proposal) => {
  selectedProposal.value = proposal;
};

const analyzeNewProposal = () => {
  analyzeForm.value = {
    dao: 'Uniswap',
    proposalId: String(Date.now()).slice(-4),
    title: '',
    description: '',
  };
  analyzeModalVisible.value = true;
};

const submitAnalysis = async () => {
  analyzing.value = true;
  try {
    const res = await axios.post(`${API_BASE}/analyze`, analyzeForm.value);
    message.success('Proposal analyzed successfully');
    analyzeModalVisible.value = false;
    await loadProposals();
    selectedProposal.value = res.data;
  } catch (error) {
    console.error('Analysis failed:', error);
    message.error('Failed to analyze proposal');
  } finally {
    analyzing.value = false;
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'green',
    passed: 'blue',
    pending: 'orange',
    failed: 'red',
    analyzed: 'purple',
  };
  return colors[status] || 'default';
};

const getImpactColor = (score: number) => {
  if (score >= 70) return '#52c41a';
  if (score >= 50) return '#1890ff';
  if (score >= 30) return '#faad14';
  return '#ff4d4f';
};

const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff4d4f',
    critical: '#d9363e',
  };
  return colors[level] || '#d9d9d9';
};

onMounted(() => {
  loadProposals();
});
</script>

<style scoped>
.governance-impact-analyzer {
  padding: 24px;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h1 {
  margin-bottom: 8px;
  font-size: 28px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.dao-selector {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-row {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.proposal-title {
  font-weight: 500;
}

.dao-name {
  margin-left: 8px;
  color: #666;
}

.selected {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.impact-section,
.risk-section,
.prediction-section,
.tokens-section,
.sentiment-section,
.recommendation-section,
.protocols-section {
  margin-bottom: 24px;
}

.impact-section h3,
.risk-section h3,
.prediction-section h3,
.tokens-section h3,
.sentiment-section h3,
.recommendation-section h3,
.protocols-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.score-details {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.score-details .bullish {
  color: #52c41a;
}

.score-details .neutral {
  color: #1890ff;
}

.score-details .bearish {
  color: #ff4d4f;
}

.confidence {
  margin-top: 8px;
  color: #666;
  font-size: 12px;
}

.risk-tag {
  font-weight: 600;
}

.risk-factors {
  margin-top: 12px;
  padding-left: 20px;
}

.risk-factors li {
  color: #666;
  margin-bottom: 4px;
}

.prediction-grid {
  margin-bottom: 16px;
}

.prediction-item {
  margin-bottom: 12px;
}

.prediction-item .label {
  display: block;
  margin-bottom: 4px;
  color: #666;
  font-size: 12px;
}

.price-impact {
  margin-top: 16px;
}

.price-impact h4 {
  margin-bottom: 12px;
  font-size: 14px;
}

.impact-card {
  text-align: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.impact-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.impact-value {
  font-size: 18px;
  font-weight: 600;
}

.impact-value.bullish {
  color: #52c41a;
}

.impact-value.bearish {
  color: #ff4d4f;
}

.sentiment-item {
  margin-bottom: 8px;
}

.sentiment-item span {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}
</style>
