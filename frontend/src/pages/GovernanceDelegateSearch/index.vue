<template>
  <div class="governance-delegate-search">
    <div class="page-header">
      <h1 class="page-title">🗳️ Governance Delegate Search</h1>
      <p class="page-description">
        Search and analyze DAO delegates across multiple chains. Find expert delegates, compare voting patterns, and discover similar delegates.
      </p>
    </div>

    <!-- Stats Dashboard -->
    <div class="stats-dashboard" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalDelegates }}</div>
        <div class="stat-label">Total Delegates</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalDAOs }}</div>
        <div class="stat-label">Supported DAOs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(stats.averageVotingPower) }}</div>
        <div class="stat-label">Avg Voting Power</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.averageDelegators }}</div>
        <div class="stat-label">Avg Delegators</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchParams.query" 
          placeholder="Search by name, address, or ENS..."
          class="search-input"
          @keyup.enter="searchDelegates"
        />
        <button class="btn btn-primary" @click="searchDelegates">Search</button>
      </div>
      
      <div class="filter-row">
        <select v-model="searchParams.dao" @change="searchDelegates" class="filter-select">
          <option value="">All DAOs</option>
          <option v-for="dao in daos" :key="dao.id" :value="dao.id">{{ dao.name }}</option>
        </select>
        
        <select v-model="searchParams.chain" @change="searchDelegates" class="filter-select">
          <option value="">All Chains</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Optimism">Optimism</option>
          <option value="Arbitrum">Arbitrum</option>
          <option value="Polygon">Polygon</option>
        </select>
        
        <select v-model="searchParams.reputation" @change="searchDelegates" class="filter-select">
          <option value="">All Reputations</option>
          <option value="legend">Legend</option>
          <option value="veteran">Veteran</option>
          <option value="expert">Expert</option>
          <option value="trusted">Trusted</option>
          <option value="new">New</option>
        </select>
        
        <select v-model="searchParams.sortBy" @change="searchDelegates" class="filter-select">
          <option value="votingPower">Sort by Voting Power</option>
          <option value="delegators">Sort by Delegators</option>
          <option value="reputation">Sort by Reputation</option>
          <option value="participation">Sort by Participation</option>
          <option value="lastActive">Sort by Last Active</option>
        </select>
      </div>
    </div>

    <!-- Results -->
    <div class="results-section">
      <div class="results-header">
        <span class="results-count">{{ searchResult?.total || 0 }} delegates found</span>
        <div class="compare-box" v-if="selectedDelegates.length >= 2">
          <span>{{ selectedDelegates.length }} selected</span>
          <button class="btn btn-secondary" @click="compareSelected">Compare</button>
        </div>
      </div>

      <div class="delegates-grid">
        <div 
          v-for="delegate in searchResult?.data" 
          :key="delegate.id" 
          class="delegate-card"
          :class="{ selected: selectedDelegates.includes(delegate.address) }"
          @click="toggleSelect(delegate.address)"
        >
          <div class="delegate-header">
            <img :src="delegate.avatar" :alt="delegate.name" class="delegate-avatar" />
            <div class="delegate-info">
              <h3 class="delegate-name">{{ delegate.name }}</h3>
              <span class="delegate-address">{{ shortAddress(delegate.address) }}</span>
              <span class="delegate-ens" v-if="delegate.ens">{{ delegate.ens }}</span>
            </div>
            <span class="reputation-badge" :class="delegate.reputation">
              {{ delegate.reputation.toUpperCase() }}
            </span>
          </div>
          
          <div class="delegate-stats">
            <div class="stat">
              <span class="stat-label">Voting Power</span>
              <span class="stat-value">{{ formatNumber(delegate.votingPower) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Delegators</span>
              <span class="stat-value">{{ delegate.delegators }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Participation</span>
              <span class="stat-value">{{ delegate.participation }}%</span>
            </div>
          </div>

          <div class="delegate-dao">
            <span class="dao-tag">{{ delegate.dao }}</span>
            <span class="chain-tag">{{ delegate.chain }}</span>
          </div>

          <div class="expertise-tags">
            <span 
              v-for="exp in delegate.expertise.slice(0, 3)" 
              :key="exp" 
              class="expertise-tag"
            >
              {{ exp }}
            </span>
          </div>

          <div class="performance-bars">
            <div class="performance-item">
              <span>Accuracy</span>
              <div class="progress-bar">
                <div class="progress" :style="{ width: delegate.performance.accuracy + '%' }"></div>
              </div>
              <span>{{ delegate.performance.accuracy }}%</span>
            </div>
            <div class="performance-item">
              <span>Consistency</span>
              <div class="progress-bar">
                <div class="progress" :style="{ width: delegate.performance.consistency + '%' }"></div>
              </div>
              <span>{{ delegate.performance.consistency }}%</span>
            </div>
          </div>

          <div class="delegate-actions">
            <button class="btn btn-small" @click.stop="viewDetails(delegate)">Details</button>
            <button class="btn btn-small" @click.stop="findSimilar(delegate.address)">Similar</button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="searchResult && searchResult.totalPages > 1">
        <button 
          class="btn btn-small" 
          :disabled="searchResult.page <= 1"
          @click="changePage(searchResult.page - 1)"
        >
          Previous
        </button>
        <span class="page-info">Page {{ searchResult.page }} of {{ searchResult.totalPages }}</span>
        <button 
          class="btn btn-small" 
          :disabled="searchResult.page >= searchResult.totalPages"
          @click="changePage(searchResult.page + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Delegate Details Modal -->
    <div class="modal" v-if="selectedDelegate" @click.self="selectedDelegate = null">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedDelegate.name }}</h2>
          <button class="close-btn" @click="selectedDelegate = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>Basic Info</h3>
            <div class="detail-row">
              <span>Address:</span>
              <span class="address">{{ selectedDelegate.address }}</span>
            </div>
            <div class="detail-row" v-if="selectedDelegate.ens">
              <span>ENS:</span>
              <span>{{ selectedDelegate.ens }}</span>
            </div>
            <div class="detail-row">
              <span>DAO:</span>
              <span>{{ selectedDelegate.dao }}</span>
            </div>
            <div class="detail-row">
              <span>Chain:</span>
              <span>{{ selectedDelegate.chain }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Voting Power</h3>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="label">Voting Power</span>
                <span class="value">{{ formatNumber(selectedDelegate.votingPower) }}</span>
              </div>
              <div class="detail-stat">
                <span class="label">Delegators</span>
                <span class="value">{{ selectedDelegate.delegators }}</span>
              </div>
              <div class="detail-stat">
                <span class="label">Votes Received</span>
                <span class="value">{{ formatNumber(selectedDelegate.votesReceived) }}</span>
              </div>
              <div class="detail-stat">
                <span class="label">Proposals Voted</span>
                <span class="value">{{ selectedDelegate.proposalsVoted }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Voting Record</h3>
            <div class="voting-breakdown">
              <div class="vote-item for">
                <span>For</span>
                <span>{{ selectedDelegate.forVotes }}</span>
              </div>
              <div class="vote-item against">
                <span>Against</span>
                <span>{{ selectedDelegate.againstVotes }}</span>
              </div>
              <div class="vote-item abstain">
                <span>Abstain</span>
                <span>{{ selectedDelegate.abstainVotes }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedDelegate.socialLinks">
            <h3>Social Links</h3>
            <div class="social-links">
              <a v-if="selectedDelegate.socialLinks.twitter" :href="`https://${selectedDelegate.socialLinks.twitter}`" target="_blank">
                Twitter
              </a>
              <a v-if="selectedDelegate.socialLinks.discord" :href="`https://${selectedDelegate.socialLinks.discord}`" target="_blank">
                Discord
              </a>
              <a v-if="selectedDelegate.socialLinks.github" :href="`https://${selectedDelegate.socialLinks.github}`" target="_blank">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Modal -->
    <div class="modal" v-if="showComparison" @click.self="showComparison = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>Delegate Comparison</h2>
          <button class="close-btn" @click="showComparison = false">×</button>
        </div>
        <div class="modal-body" v-if="comparisonResult">
          <div class="comparison-summary">
            <div class="comparison-stat">
              <span>Total Voting Power</span>
              <span>{{ formatNumber(comparisonResult.comparison.totalVotingPower) }}</span>
            </div>
            <div class="comparison-stat">
              <span>Total Delegators</span>
              <span>{{ comparisonResult.comparison.totalDelegators }}</span>
            </div>
            <div class="comparison-stat">
              <span>Avg Participation</span>
              <span>{{ comparisonResult.comparison.averageParticipation }}%</span>
            </div>
            <div class="comparison-stat">
              <span>Avg Reputation</span>
              <span>{{ comparisonResult.comparison.averageReputation }}</span>
            </div>
          </div>

          <div class="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th v-for="d in comparisonResult.delegates" :key="d.id">{{ d.name }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Voting Power</td>
                  <td v-for="d in comparisonResult.delegates" :key="d.id">{{ formatNumber(d.votingPower) }}</td>
                </tr>
                <tr>
                  <td>Delegators</td>
                  <td v-for="d in comparisonResult.delegates" :key="d.id">{{ d.delegators }}</td>
                </tr>
                <tr>
                  <td>Participation</td>
                  <td v-for="d in comparisonResult.delegates" :key="d.id">{{ d.participation }}%</td>
                </tr>
                <tr>
                  <td>Reputation</td>
                  <td v-for="d in comparisonResult.delegates" :key="d.id">{{ d.reputation }}</td>
                </tr>
                <tr>
                  <td>For/Against/Abstain</td>
                  <td v-for="d in comparisonResult.delegates" :key="d.id">
                    {{ d.forVotes }}/{{ d.againstVotes }}/{{ d.abstainVotes }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Similar Delegates Modal -->
    <div class="modal" v-if="similarDelegates.length > 0" @click.self="similarDelegates = []">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Similar Delegates</h2>
          <button class="close-btn" @click="similarDelegates = []">×</button>
        </div>
        <div class="modal-body">
          <div class="similar-list">
            <div v-for="d in similarDelegates" :key="d.id" class="similar-item">
              <img :src="d.avatar" :alt="d.name" class="similar-avatar" />
              <div class="similar-info">
                <h4>{{ d.name }}</h4>
                <span>{{ shortAddress(d.address) }}</span>
              </div>
              <div class="similar-stats">
                <span>Voting Power: {{ formatNumber(d.votingPower) }}</span>
                <span>Delegators: {{ d.delegators }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { governanceDelegateSearchApi, type Delegate, type DelegateSearchParams, type DAO, type DelegateStats, type SearchResult } from '../service/governanceDelegateSearch';

const searchParams = ref<DelegateSearchParams>({
  query: '',
  dao: '',
  chain: '',
  minVotingPower: undefined,
  minDelegators: undefined,
  reputation: '',
  expertise: '',
  sortBy: 'votingPower',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20,
});

const searchResult = ref<SearchResult | null>(null);
const daos = ref<DAO[]>([]);
const stats = ref<DelegateStats | null>(null);
const selectedDelegates = ref<string[]>([]);
const selectedDelegate = ref<Delegate | null>(null);
const showComparison = ref(false);
const comparisonResult = ref<any>(null);
const similarDelegates = ref<Delegate[]>([]);

onMounted(async () => {
  await Promise.all([
    loadDAOs(),
    loadStats(),
    searchDelegates(),
  ]);
});

async function loadDAOs() {
  try {
    const res = await governanceDelegateSearchApi.getDAOs();
    daos.value = res.data;
  } catch (e) {
    console.error('Failed to load DAOs:', e);
  }
}

async function loadStats() {
  try {
    const res = await governanceDelegateSearchApi.getStats();
    stats.value = res.data;
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

async function searchDelegates() {
  try {
    const res = await governanceDelegateSearchApi.searchDelegates(searchParams.value);
    searchResult.value = res.data;
  } catch (e) {
    console.error('Failed to search delegates:', e);
  }
}

function changePage(page: number) {
  searchParams.value.page = page;
  searchDelegates();
}

function toggleSelect(address: string) {
  const index = selectedDelegates.value.indexOf(address);
  if (index > -1) {
    selectedDelegates.value.splice(index, 1);
  } else if (selectedDelegates.value.length < 5) {
    selectedDelegates.value.push(address);
  }
}

async function compareSelected() {
  try {
    const res = await governanceDelegateSearchApi.compareDelegates(selectedDelegates.value);
    comparisonResult.value = res.data;
    showComparison.value = true;
  } catch (e) {
    console.error('Failed to compare delegates:', e);
  }
}

async function viewDetails(delegate: Delegate) {
  selectedDelegate.value = delegate;
}

async function findSimilar(address: string) {
  try {
    const res = await governanceDelegateSearchApi.findSimilarDelegates(address);
    similarDelegates.value = res.data;
  } catch (e) {
    console.error('Failed to find similar delegates:', e);
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toString();
}

function shortAddress(address: string): string {
  return address.slice(0, 6) + '...' + address.slice(-4);
}
</script>

<style scoped>
.governance-delegate-search {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-description {
  color: #666;
  font-size: 14px;
}

.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

.filters-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  background: #e9ecef;
  color: #333;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-count {
  font-weight: 600;
  color: #333;
}

.compare-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delegates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.delegate-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.delegate-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.delegate-card.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.delegate-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.delegate-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.delegate-info {
  flex: 1;
}

.delegate-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.delegate-address {
  font-size: 12px;
  color: #666;
  display: block;
}

.delegate-ens {
  font-size: 11px;
  color: #667eea;
}

.reputation-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.reputation-badge.legend { background: #ffd700; color: #000; }
.reputation-badge.veteran { background: #c0c0c0; color: #000; }
.reputation-badge.expert { background: #cd7f32; color: #fff; }
.reputation-badge.trusted { background: #667eea; color: #fff; }
.reputation-badge.new { background: #6c757d; color: #fff; }

.delegate-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.delegate-stats .stat {
  text-align: center;
}

.delegate-stats .stat-label {
  font-size: 10px;
  color: #666;
  display: block;
}

.delegate-stats .stat-value {
  font-size: 14px;
  font-weight: 600;
}

.delegate-dao {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dao-tag, .chain-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.dao-tag {
  background: #e9ecef;
  color: #333;
}

.chain-tag {
  background: #667eea;
  color: white;
}

.expertise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.expertise-tag {
  padding: 2px 8px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 12px;
  font-size: 10px;
}

.performance-bars {
  margin-bottom: 12px;
}

.performance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  margin-bottom: 4px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.delegate-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-row .address {
  font-family: monospace;
  font-size: 12px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-stat {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.detail-stat .label {
  font-size: 12px;
  color: #666;
  display: block;
}

.detail-stat .value {
  font-size: 18px;
  font-weight: 600;
  display: block;
  margin-top: 4px;
}

.voting-breakdown {
  display: flex;
  gap: 12px;
}

.vote-item {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.vote-item.for { background: #d4edda; }
.vote-item.against { background: #f8d7da; }
.vote-item.abstain { background: #fff3cd; }

.social-links {
  display: flex;
  gap: 12px;
}

.social-links a {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
}

.comparison-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.comparison-stat {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.comparison-stat span {
  display: block;
  font-size: 12px;
  color: #666;
}

.comparison-stat span:last-child {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-top: 4px;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.comparison-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.similar-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.similar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.similar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.similar-info {
  flex: 1;
}

.similar-info h4 {
  margin: 0;
  font-size: 14px;
}

.similar-info span {
  font-size: 12px;
  color: #666;
}

.similar-stats {
  text-align: right;
  font-size: 12px;
  color: #666;
}
</style>
