<template>
  <div class="governance-aggregator">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>🌐 Cross-chain Governance Aggregator</h2>
      </el-col>
    </el-row>

    <!-- Overview Stats -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ overviewStats.totalProposals }}</div>
            <div class="stat-label">Total Proposals</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ overviewStats.activeProposals }}</div>
            <div class="stat-label">Active Proposals</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ overviewStats.totalDelegates }}</div>
            <div class="stat-label">Total Delegates</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ overviewStats.avgParticipation }}%</div>
            <div class="stat-label">Avg Participation</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Chain Tabs -->
    <el-tabs v-model="activeChain" @tab-change="handleChainChange" class="chain-tabs">
      <el-tab-pane label="All Chains" name="all" />
      <el-tab-pane v-for="chain in chains" :key="chain" :label="chain" :name="chain" />
    </el-tabs>

    <!-- Main Content Tabs -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Proposals Tab -->
      <el-tab-pane label="Proposals" name="proposals">
        <el-card>
          <div class="toolbar">
            <el-select v-model="proposalFilters.dao" placeholder="Select DAO" clearable style="width: 180px">
              <el-option v-for="dao in daos" :key="dao.name" :label="`${dao.logo} ${dao.name}`" :value="dao.name" />
            </el-select>
            <el-select v-model="proposalFilters.status" placeholder="Status" clearable style="width: 150px; margin-left: 10px">
              <el-option label="Active" value="active" />
              <el-option label="Passed" value="passed" />
              <el-option label="Failed" value="failed" />
              <el-option label="Executed" value="executed" />
              <el-option label="Canceled" value="canceled" />
            </el-select>
            <el-select v-model="proposalFilters.category" placeholder="Category" clearable style="width: 180px; margin-left: 10px">
              <el-option label="Treasury" value="Treasury" />
              <el-option label="Protocol Upgrade" value="Protocol Upgrade" />
              <el-option label="Risk Parameters" value="Risk Parameters" />
              <el-option label="Grants" value="Grants" />
              <el-option label="Governance" value="Governance" />
              <el-option label="Rates" value="Rates" />
            </el-select>
            <el-button type="primary" @click="loadProposals" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon> Filter
            </el-button>
            <el-input
              v-model="proposalSearch"
              placeholder="Search proposals..."
              style="width: 300px; margin-left: auto"
              clearable
              @input="handleProposalSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="proposals" style="width: 100%; margin-top: 20px" stripe>
            <el-table-column prop="proposalId" label="#" width="60" />
            <el-table-column label="DAO" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.daoName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="Title" min-width="250">
              <template #default="{ row }">
                <el-link type="primary" @click="showProposalDetails(row)">{{ row.title }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="Category" width="130">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Status" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Votes" width="150">
              <template #default="{ row }">
                <div class="vote-bar">
                  <div class="vote-for" :style="{ width: getForPercent(row) + '%' }"></div>
                </div>
                <span class="vote-text">{{ getForPercent(row).toFixed(1) }}% For</span>
              </template>
            </el-table-column>
            <el-table-column label="Turnout" width="100">
              <template #default="{ row }">
                {{ row.voterTurnout?.toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column label="Ends" width="120">
              <template #default="{ row }">
                {{ formatTime(row.endTime) }}
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="proposalPage"
            :page-size="20"
            :total="proposalTotal"
            layout="total, prev, pager, next"
            style="margin-top: 20px; justify-content: center"
            @current-change="loadProposals"
          />
        </el-card>
      </el-tab-pane>

      <!-- Delegates Tab -->
      <el-tab-pane label="Delegates" name="delegates">
        <el-card>
          <div class="toolbar">
            <el-select v-model="delegateFilters.dao" placeholder="Select DAO" clearable style="width: 180px">
              <el-option v-for="dao in daos" :key="dao.name" :label="`${dao.logo} ${dao.name}`" :value="dao.name" />
            </el-select>
            <el-select v-model="delegateFilters.sortBy" placeholder="Sort by" style="width: 180px; margin-left: 10px">
              <el-option label="Voting Power" value="votingPower" />
              <el-option label="Delegators" value="delegators" />
              <el-option label="Participation" value="participation" />
            </el-select>
            <el-button type="primary" @click="loadDelegates" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon> Filter
            </el-button>
          </div>

          <el-table :data="delegates" style="width: 100%; margin-top: 20px" stripe>
            <el-table-column label="#" width="60">
              <template #default="{ $index }">
                {{ $index + 1 + (delegatePage - 1) * 20 }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="Delegate" width="180">
              <template #default="{ row }">
                <el-link type="primary" @click="showDelegateDetails(row)">
                  {{ formatAddress(row.address) }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column label="DAO" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.daoName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Reputation" width="100">
              <template #default="{ row }">
                <el-tag :type="getReputationType(row.reputation)" size="small">
                  {{ row.reputation }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Voting Power" width="140">
              <template #default="{ row }">
                {{ formatNumber(row.votingPower) }}
              </template>
            </el-table-column>
            <el-table-column label="Delegators" width="100">
              <template #default="{ row }">
                {{ row.delegatorsCount }}
              </template>
            </el-table-column>
            <el-table-column label="Participation" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.participationRate?.toFixed(1)" :color="getProgressColor(row.participationRate)" />
              </template>
            </el-table-column>
            <el-table-column label="Votes" width="100">
              <template #default="{ row }">
                {{ row.proposalsVoted }}/{{ row.proposalsParticipated }}
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="delegatePage"
            :page-size="20"
            :total="delegateTotal"
            layout="total, prev, pager, next"
            style="margin-top: 20px; justify-content: center"
            @current-change="loadDelegates"
          />
        </el-card>
      </el-tab-pane>

      <!-- Trending Tab -->
      <el-tab-pane label="Trending" name="trending">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>🔥 Hot Proposals</span>
                </div>
              </template>
              <div v-for="proposal in trendingProposals" :key="proposal.id" class="proposal-item">
                <el-link type="primary" @click="showProposalDetails(proposal)">
                  {{ proposal.title }}
                </el-link>
                <div class="proposal-meta">
                  <el-tag size="small">{{ proposal.daoName }}</el-tag>
                  <el-tag size="small" type="success">{{ proposal.status }}</el-tag>
                  <span class="voters">{{ proposal.totalVoters }} voters</span>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>📅 Upcoming Proposals</span>
                </div>
              </template>
              <div v-for="proposal in upcomingProposals" :key="proposal.id" class="proposal-item">
                <el-link type="primary" @click="showProposalDetails(proposal)">
                  {{ proposal.title }}
                </el-link>
                <div class="proposal-meta">
                  <el-tag size="small">{{ proposal.daoName }}</el-tag>
                  <span class="voters">Starts: {{ formatTime(proposal.startTime) }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- DAOs Tab -->
      <el-tab-pane label="DAOs" name="daos">
        <el-row :gutter="20">
          <el-col v-for="dao in daos" :key="dao.name" :span="8">
            <el-card shadow="hover" class="dao-card">
              <div class="dao-info">
                <span class="dao-logo">{{ dao.logo }}</span>
                <span class="dao-name">{{ dao.name }}</span>
                <el-tag size="small" type="info">{{ dao.chain }}</el-tag>
              </div>
              <el-button type="primary" size="small" @click="viewDaoProposals(dao.name)">
                View Proposals
              </el-button>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- Proposal Details Dialog -->
    <el-dialog v-model="proposalDialogVisible" title="Proposal Details" width="700px">
      <div v-if="selectedProposal" class="proposal-details">
        <h3>{{ selectedProposal.title }}</h3>
        <div class="proposal-info">
          <p><strong>DAO:</strong> {{ selectedProposal.daoName }}</p>
          <p><strong>Chain:</strong> {{ selectedProposal.chain }}</p>
          <p><strong>Status:</strong> <el-tag :type="getStatusType(selectedProposal.status)">{{ selectedProposal.status }}</el-tag></p>
          <p><strong>Category:</strong> {{ selectedProposal.category }}</p>
          <p><strong>Proposer:</strong> {{ formatAddress(selectedProposal.proposer) }}</p>
          <p><strong>Start:</strong> {{ formatTime(selectedProposal.startTime) }}</p>
          <p><strong>End:</strong> {{ formatTime(selectedProposal.endTime) }}</p>
        </div>
        <el-divider />
        <div class="vote-stats">
          <h4>Vote Statistics</h4>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="vote-stat for">
                <div class="vote-value">{{ formatNumber(selectedProposal.forVotes) }}</div>
                <div class="vote-label">For</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="vote-stat against">
                <div class="vote-value">{{ formatNumber(selectedProposal.againstVotes) }}</div>
                <div class="vote-label">Against</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="vote-stat abstain">
                <div class="vote-value">{{ formatNumber(selectedProposal.abstainVotes) }}</div>
                <div class="vote-label">Abstain</div>
              </div>
            </el-col>
          </el-row>
          <el-progress
            :percentage="getForPercent(selectedProposal)"
            :color="['#67c23a', '#e6a23c', '#909399']"
            style="margin-top: 20px"
          />
        </div>
        <el-divider />
        <div class="proposal-desc">
          <h4>Description</h4>
          <p>{{ selectedProposal.description }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- Delegate Details Dialog -->
    <el-dialog v-model="delegateDialogVisible" title="Delegate Details" width="600px">
      <div v-if="selectedDelegate" class="delegate-details">
        <div class="delegate-address">
          <strong>Address:</strong> {{ selectedDelegate.address }}
        </div>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-statistic title="Voting Power" :value="selectedDelegate.votingPower" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="Delegators" :value="selectedDelegate.delegatorsCount" />
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-statistic title="Proposals Voted" :value="selectedDelegate.proposalsVoted" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="Participation Rate" :value="selectedDelegate.participationRate?.toFixed(1) + '%'" />
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import {
  getGovernanceOverview,
  getProposals,
  getDelegates,
  getSupportedDaos,
  getTrendingProposals,
  getUpcomingProposals,
  generateGovernanceMockData,
} from '~/service/governanceAggregator';

const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base', 'Avalanche'];
const activeChain = ref('all');
const activeTab = ref('proposals');

// Stats
const overviewStats = ref({
  totalProposals: 0,
  activeProposals: 0,
  totalDelegates: 0,
  avgParticipation: 0,
});

// DAOs
const daos = ref<Array<{ name: string; chain: string; logo: string }>>([]);

// Proposals
const proposals = ref<any[]>([]);
const proposalTotal = ref(0);
const proposalPage = ref(1);
const proposalFilters = ref({
  dao: '',
  status: '',
  category: '',
});
const proposalSearch = ref('');

// Delegates
const delegates = ref<any[]>([]);
const delegateTotal = ref(0);
const delegatePage = ref(1);
const delegateFilters = ref({
  dao: '',
  sortBy: 'votingPower',
});

// Trending
const trendingProposals = ref<any[]>([]);
const upcomingProposals = ref<any[]>([]);

// Dialogs
const proposalDialogVisible = ref(false);
const delegateDialogVisible = ref(false);
const selectedProposal = ref<any>(null);
const selectedDelegate = ref<any>(null);

// Format functions
const formatNumber = (num: number) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-US').format(Number(num));
};

const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTime = (time: string) => {
  if (!time) return '';
  return new Date(time).toLocaleDateString();
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    passed: 'success',
    failed: 'danger',
    executed: 'warning',
    canceled: 'info',
  };
  return types[status] || 'info';
};

const getReputationType = (reputation: string) => {
  const types: Record<string, string> = {
    legend: 'danger',
    veteran: 'warning',
    expert: 'success',
    trusted: 'primary',
    new: 'info',
  };
  return types[reputation] || 'info';
};

const getForPercent = (proposal: any) => {
  const total = Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes);
  if (total === 0) return 0;
  return (Number(proposal.forVotes) / total) * 100;
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67c23a';
  if (percentage >= 60) return '#e6a23c';
  return '#f56c6c';
};

// Handlers
const handleChainChange = (chain: string) => {
  loadProposals();
  loadDelegates();
};

const handleProposalSearch = () => {
  loadProposals();
};

const loadOverview = async () => {
  try {
    const data = await getGovernanceOverview();
    const totalProposals = data.reduce((sum: number, item: any) => sum + item.totalProposals, 0);
    const activeProposals = data.reduce((sum: number, item: any) => sum + item.activeProposals, 0);
    const totalDelegates = data.reduce((sum: number, item: any) => sum + item.totalDelegates, 0);
    const avgParticipation = data.reduce((sum: number, item: any) => sum + item.avgParticipation, 0) / data.length;
    
    overviewStats.value = {
      totalProposals,
      activeProposals,
      totalDelegates,
      avgParticipation: avgParticipation.toFixed(1),
    };
  } catch (error) {
    console.error('Failed to load overview:', error);
  }
};

const loadProposals = async () => {
  try {
    const params: any = {
      limit: 20,
      offset: (proposalPage.value - 1) * 20,
    };
    if (proposalFilters.value.dao) params.dao = proposalFilters.value.dao;
    if (proposalFilters.value.status) params.status = proposalFilters.value.status;
    if (proposalFilters.value.category) params.category = proposalFilters.value.category;
    if (activeChain.value !== 'all') params.chain = activeChain.value;
    if (proposalSearch.value) params.q = proposalSearch.value;

    const data = await getProposals(params);
    proposals.value = data.proposals;
    proposalTotal.value = data.total;
  } catch (error) {
    console.error('Failed to load proposals:', error);
  }
};

const loadDelegates = async () => {
  try {
    const params: any = {
      limit: 20,
      offset: (delegatePage.value - 1) * 20,
      sortBy: delegateFilters.value.sortBy,
    };
    if (delegateFilters.value.dao) params.dao = delegateFilters.value.dao;
    if (activeChain.value !== 'all') params.chain = activeChain.value;

    const data = await getDelegates(params);
    delegates.value = data.delegates;
    delegateTotal.value = data.total;
  } catch (error) {
    console.error('Failed to load delegates:', error);
  }
};

const loadDaos = async () => {
  try {
    daos.value = await getSupportedDaos();
  } catch (error) {
    console.error('Failed to load DAOs:', error);
  }
};

const loadTrending = async () => {
  try {
    trendingProposals.value = await getTrendingProposals(5);
    upcomingProposals.value = await getUpcomingProposals(5);
  } catch (error) {
    console.error('Failed to load trending:', error);
  }
};

const showProposalDetails = (proposal: any) => {
  selectedProposal.value = proposal;
  proposalDialogVisible.value = true;
};

const showDelegateDetails = (delegate: any) => {
  selectedDelegate.value = delegate;
  delegateDialogVisible.value = true;
};

const viewDaoProposals = (daoName: string) => {
  proposalFilters.value.dao = daoName;
  activeTab.value = 'proposals';
  loadProposals();
};

const generateData = async () => {
  try {
    await generateGovernanceMockData();
    ElMessage.success('Mock data generated successfully');
    loadOverview();
    loadProposals();
    loadDelegates();
    loadTrending();
  } catch (error) {
    console.error('Failed to generate mock data:', error);
    ElMessage.error('Failed to generate mock data');
  }
};

onMounted(async () => {
  await loadDaos();
  await loadOverview();
  await loadProposals();
  await loadDelegates();
  await loadTrending();
});
</script>

<style scoped>
.governance-aggregator {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.chain-tabs {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.vote-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.vote-for {
  height: 100%;
  background: #67c23a;
  transition: width 0.3s;
}

.vote-text {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  display: block;
}

.proposal-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.proposal-item:last-child {
  border-bottom: none;
}

.proposal-meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}

.voters {
  font-size: 12px;
  color: #909399;
}

.dao-card {
  margin-bottom: 20px;
  text-align: center;
}

.dao-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.dao-logo {
  font-size: 32px;
}

.dao-name {
  font-size: 18px;
  font-weight: bold;
}

.card-header {
  font-weight: bold;
}

.proposal-details h3 {
  margin-bottom: 15px;
}

.proposal-info p {
  margin: 8px 0;
}

.vote-stats h4,
.proposal-desc h4 {
  margin-bottom: 15px;
}

.vote-stat {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
}

.vote-stat.for {
  background: #f0f9eb;
}

.vote-stat.against {
  background: #fef0f0;
}

.vote-stat.abstain {
  background: #f4f4f5;
}

.vote-value {
  font-size: 20px;
  font-weight: bold;
}

.vote-label {
  font-size: 14px;
  color: #909399;
}

.delegate-details .delegate-address {
  word-break: break-all;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
