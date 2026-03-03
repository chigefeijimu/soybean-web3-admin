<template>
  <div class="dao-proposal-scanner">
    <div class="header">
      <h1>🗳️ DAO Proposal Scanner</h1>
      <p>Discover and track governance proposals across multiple DAOs</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Proposals</div>
      </div>
      <div class="stat-card active">
        <div class="stat-value">{{ stats.active }}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-value">{{ stats.passed }}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-value">{{ stats.failed }}</div>
        <div class="stat-label">Failed</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="Search proposals..."
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <select v-model="filterDao" class="filter-select">
        <option value="">All DAOs</option>
        <option v-for="dao in supportedDaos" :key="dao.name" :value="dao.name">
          {{ dao.name }}
        </option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="passed">Passed</option>
        <option value="failed">Failed</option>
        <option value="executing">Executing</option>
        <option value="canceled">Canceled</option>
      </select>
      <button class="btn-primary" @click="loadProposals">🔍 Search</button>
    </div>

    <!-- Supported DAOs -->
    <div class="section">
      <h2>📋 Supported DAOs</h2>
      <div class="dao-tags">
        <span v-for="dao in supportedDaos" :key="dao.name" class="dao-tag">
          {{ dao.name }}
        </span>
      </div>
    </div>

    <!-- Trending DAOs -->
    <div class="section" v-if="trendingDaos.length">
      <h2>🔥 Trending DAOs</h2>
      <div class="trending-list">
        <div v-for="item in trendingDaos" :key="item.dao" class="trending-item">
          <span class="dao-name">{{ item.dao }}</span>
          <span class="proposal-count">{{ item.activeProposals }} active</span>
        </div>
      </div>
    </div>

    <!-- Proposals List -->
    <div class="section">
      <h2>📜 Proposals</h2>
      <div class="proposals-grid">
        <div v-for="proposal in proposals" :key="proposal.id" class="proposal-card" :class="proposal.status">
          <div class="proposal-header">
            <span class="dao-badge">{{ proposal.dao }}</span>
            <span class="status-badge" :class="proposal.status">{{ proposal.status }}</span>
          </div>
          <h3 class="proposal-title">{{ proposal.title }}</h3>
          <p class="proposal-desc">{{ truncate(proposal.description, 150) }}</p>
          
          <div class="proposal-meta">
            <span class="category">🏷️ {{ proposal.category }}</span>
            <span class="chain">⛓️ {{ proposal.chain }}</span>
          </div>
          
          <!-- Voting Progress -->
          <div class="voting-section" v-if="proposal.status === 'active' || proposal.status === 'passed' || proposal.status === 'failed'">
            <div class="vote-bar">
              <div class="vote-for" :style="{ width: getForPercentage(proposal) + '%' }"></div>
            </div>
            <div class="vote-stats">
              <span class="for">✅ {{ formatVotes(proposal.forVotes) }}</span>
              <span class="against">❌ {{ formatVotes(proposal.againstVotes) }}</span>
              <span class="abstain">➖ {{ formatVotes(proposal.abstainVotes) }}</span>
            </div>
          </div>
          
          <div class="proposal-footer">
            <a :href="proposal.proposalUrl" target="_blank" class="proposal-link">View Proposal →</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Section -->
    <div class="section alert-section">
      <h2>🔔 Create Alert</h2>
      <div class="alert-form">
        <input v-model="alertForm.userAddress" type="text" placeholder="Your wallet address" class="form-input" />
        <input v-model="alertForm.daoFilter" type="text" placeholder="DAO filter (e.g., Uniswap)" class="form-input" />
        <input v-model="alertForm.categoryFilter" type="text" placeholder="Category filter (e.g., Grants)" class="form-input" />
        <select v-model="alertForm.statusFilter" class="form-input">
          <option value="">Any Status</option>
          <option value="active">Active</option>
          <option value="passed">Passed</option>
        </select>
        <input v-model="alertForm.webhookUrl" type="text" placeholder="Webhook URL (optional)" class="form-input" />
        <button class="btn-primary" @click="handleCreateAlert">Create Alert</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  getSupportedDaos, 
  scanProposals, 
  searchProposals,
  getProposalStats, 
  getTrendingDaos,
  createAlert,
  type Dao, 
  type DaoProposal, 
  type ProposalStats,
  type TrendingDao,
  type Alert
} from '../../service/daoProposalScanner';

const supportedDaos = ref<Dao[]>([]);
const proposals = ref<DaoProposal[]>([]);
const stats = ref<ProposalStats | null>(null);
const trendingDaos = ref<TrendingDao[]>([]);

const searchKeyword = ref('');
const filterDao = ref('');
const filterStatus = ref('');

const alertForm = ref({
  userAddress: '',
  daoFilter: '',
  categoryFilter: '',
  statusFilter: '',
  webhookUrl: '',
});

onMounted(async () => {
  await Promise.all([
    loadSupportedDaos(),
    loadProposals(),
    loadStats(),
    loadTrending(),
  ]);
});

async function loadSupportedDaos() {
  try {
    const res = await getSupportedDaos();
    supportedDaos.value = res.data;
  } catch (e) {
    console.error('Failed to load DAOs:', e);
  }
}

async function loadProposals() {
  try {
    if (searchKeyword.value) {
      const res = await searchProposals(searchKeyword.value);
      proposals.value = res.data;
    } else {
      const res = await scanProposals({ 
        dao: filterDao.value || undefined,
        status: filterStatus.value || undefined 
      });
      proposals.value = res.data;
    }
  } catch (e) {
    console.error('Failed to load proposals:', e);
  }
}

async function loadStats() {
  try {
    const res = await getProposalStats();
    stats.value = res.data;
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

async function loadTrending() {
  try {
    const res = await getTrendingDaos(5);
    trendingDaos.value = res.data;
  } catch (e) {
    console.error('Failed to load trending:', e);
  }
}

async function handleSearch() {
  await loadProposals();
}

async function handleCreateAlert() {
  try {
    await createAlert(alertForm.value);
    alert('Alert created successfully!');
    alertForm.value = { userAddress: '', daoFilter: '', categoryFilter: '', statusFilter: '', webhookUrl: '' };
  } catch (e) {
    console.error('Failed to create alert:', e);
  }
}

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatVotes(votes: string) {
  const num = parseFloat(votes);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getForPercentage(proposal: DaoProposal) {
  const forVotes = parseFloat(proposal.forVotes);
  const againstVotes = parseFloat(proposal.againstVotes);
  const total = forVotes + againstVotes;
  if (total === 0) return 0;
  return (forVotes / total) * 100;
}
</script>

<style scoped>
.dao-proposal-scanner {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #4a90d9;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  color: white;
  text-align: center;
}

.stat-card.active {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-card.passed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.failed {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search-input, .filter-select, .form-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 150px;
}

.btn-primary {
  padding: 10px 20px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #357abd;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  margin-bottom: 20px;
  color: #333;
}

.dao-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dao-tag {
  padding: 8px 16px;
  background: #f0f4f8;
  border-radius: 20px;
  font-size: 14px;
  color: #4a5568;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trending-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.dao-name {
  font-weight: 600;
  color: #333;
}

.proposal-count {
  color: #4a90d9;
  font-weight: 500;
}

.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.proposal-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.proposal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.proposal-card.active {
  border-left: 4px solid #38ef7d;
}

.proposal-card.passed {
  border-left: 4px solid #4facfe;
}

.proposal-card.failed {
  border-left: 4px solid #ff6b6b;
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dao-badge {
  background: #4a90d9;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.passed {
  background: #bee3f8;
  color: #2a4365;
}

.status-badge.failed {
  background: #fed7d7;
  color: #822727;
}

.status-badge.executing {
  background: #fefcbf;
  color: #744210;
}

.proposal-title {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #2d3748;
  line-height: 1.4;
}

.proposal-desc {
  color: #718096;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 15px;
}

.proposal-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 13px;
  color: #718096;
}

.voting-section {
  margin-bottom: 15px;
}

.vote-bar {
  height: 8px;
  background: #fed7d7;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.vote-for {
  height: 100%;
  background: #48bb78;
  transition: width 0.3s;
}

.vote-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.vote-stats .for {
  color: #22543d;
}

.vote-stats .against {
  color: #822727;
}

.vote-stats .abstain {
  color: #718096;
}

.proposal-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

.proposal-link {
  color: #4a90d9;
  text-decoration: none;
  font-weight: 500;
}

.proposal-link:hover {
  text-decoration: underline;
}

.alert-section {
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
}

.alert-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.alert-form .form-input {
  flex: 1;
  min-width: 200px;
}

.alert-form .btn-primary {
  flex: 0 0 auto;
}
</style>
