<template>
  <div class="identity-verification">
    <div class="header">
      <h1>🔐 Identity Verification</h1>
      <p class="subtitle">Web3 identity verification service with multi-factor authentication</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.totalVerifications || 0 }}</div>
          <div class="stat-label">Total Verifications</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.byStatus?.verified || 0 }}</div>
          <div class="stat-label">Verified</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.byStatus?.pending || 0 }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.averageTrustScore || 0 }}</div>
          <div class="stat-label">Avg Trust Score</div>
        </div>
      </div>
    </div>

    <!-- Level Distribution -->
    <div class="card">
      <h3>Verification Levels Distribution</h3>
      <div class="level-bars">
        <div class="level-bar" v-if="stats?.byLevel">
          <div class="bar-item">
            <span class="bar-label">Basic</span>
            <div class="bar-track">
              <div class="bar-fill basic" :style="{ width: (stats.byLevel.basic / stats.totalVerifications * 100) + '%' }"></div>
            </div>
            <span class="bar-value">{{ stats.byLevel.basic }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Standard</span>
            <div class="bar-track">
              <div class="bar-fill standard" :style="{ width: (stats.byLevel.standard / stats.totalVerifications * 100) + '%' }"></div>
            </div>
            <span class="bar-value">{{ stats.byLevel.standard }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Advanced</span>
            <div class="bar-track">
              <div class="bar-fill advanced" :style="{ width: (stats.byLevel.advanced / stats.totalVerifications * 100) + '%' }"></div>
            </div>
            <span class="bar-value">{{ stats.byLevel.advanced }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Enterprise</span>
            <div class="bar-track">
              <div class="bar-fill enterprise" :style="{ width: (stats.byLevel.enterprise / stats.totalVerifications * 100) + '%' }"></div>
            </div>
            <span class="bar-value">{{ stats.byLevel.enterprise }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Verifications List Tab -->
    <div v-if="activeTab === 'list'" class="card">
      <div class="card-header">
        <h3>Verification Requests</h3>
        <div class="filters">
          <select v-model="filters.status" @change="loadVerifications">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          <select v-model="filters.level" @change="loadVerifications">
            <option value="">All Levels</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <input v-model="filters.address" placeholder="Search address..." @input="loadVerifications" />
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>Chain</th>
              <th>Level</th>
              <th>Status</th>
              <th>Trust Score</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in verifications" :key="v.id">
              <td>#{{ v.id }}</td>
              <td class="address">{{ shortenAddress(v.address) }}</td>
              <td>{{ getChainName(v.chainId) }}</td>
              <td>
                <span :class="['level-badge', v.level]">{{ v.level }}</span>
              </td>
              <td>
                <span :class="['status-badge', v.status]">{{ v.status }}</span>
              </td>
              <td>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: v.trustScore + '%' }" :class="getScoreClass(v.trustScore)"></div>
                  <span class="score-text">{{ v.trustScore }}</span>
                </div>
              </td>
              <td>{{ formatDate(v.createdAt) }}</td>
              <td>
                <button class="btn-small" @click="viewVerification(v)">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button @click="changePage(-1)" :disabled="page <= 1">Prev</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button @click="changePage(1)" :disabled="page >= totalPages">Next</button>
      </div>
    </div>

    <!-- Levels Tab -->
    <div v-if="activeTab === 'levels'" class="card">
      <h3>Verification Levels</h3>
      <div class="levels-grid">
        <div v-for="(level, key) in levels" :key="key" class="level-card">
          <div class="level-header">
            <h4>{{ level.name }}</h4>
            <span class="price">${{ level.price }}</span>
          </div>
          <p class="level-desc">{{ level.description }}</p>
          <div class="level-score">
            <span>Trust Score:</span>
            <strong>{{ level.trustScore }}</strong>
          </div>
          <div class="level-methods">
            <span v-for="m in level.methods" :key="m" class="method-tag">{{ m }}</span>
          </div>
          <ul class="features-list">
            <li v-for="f in level.features" :key="f">✓ {{ f }}</li>
          </ul>
          <button class="btn-primary">Select</button>
        </div>
      </div>
    </div>

    <!-- Create Tab -->
    <div v-if="activeTab === 'create'" class="card">
      <h3>Create New Verification</h3>
      <form @submit.prevent="createVerification" class="form">
        <div class="form-group">
          <label>Wallet Address</label>
          <input v-model="form.address" placeholder="0x..." required />
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="form.chainId" required>
            <option :value="1">Ethereum</option>
            <option :value="137">Polygon</option>
            <option :value="42161">Arbitrum</option>
            <option :value="10">Optimism</option>
            <option :value="56">BSC</option>
            <option :value="8453">Base</option>
            <option :value="43114">Avalanche</option>
          </select>
        </div>
        <div class="form-group">
          <label>Verification Level</label>
          <select v-model="form.verificationLevel" required>
            <option value="basic">Basic - Wallet Only</option>
            <option value="standard">Standard - Wallet + Email</option>
            <option value="advanced">Advanced - + Social</option>
            <option value="enterprise">Enterprise - Full KYC</option>
          </select>
        </div>
        <div class="form-group">
          <label>Verification Methods</label>
          <div class="checkbox-group">
            <label><input type="checkbox" v-model="form.methods" value="wallet" /> Wallet</label>
            <label><input type="checkbox" v-model="form.methods" value="email" /> Email</label>
            <label><input type="checkbox" v-model="form.methods" value="phone" /> Phone</label>
            <label><input type="checkbox" v-model="form.methods" value="social" /> Social</label>
            <label><input type="checkbox" v-model="form.methods" value="kyc" /> KYC</label>
          </div>
        </div>
        <button type="submit" class="btn-primary">Create Request</button>
      </form>
    </div>

    <!-- Verification Detail Modal -->
    <div v-if="selectedVerification" class="modal" @click.self="selectedVerification = null">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Verification #{{ selectedVerification.id }}</h3>
          <button class="close-btn" @click="selectedVerification = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Address:</span>
            <span class="detail-value">{{ selectedVerification.address }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Chain:</span>
            <span class="detail-value">{{ getChainName(selectedVerification.chainId) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Level:</span>
            <span :class="['level-badge', selectedVerification.level]">{{ selectedVerification.level }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span :class="['status-badge', selectedVerification.status]">{{ selectedVerification.status }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Trust Score:</span>
            <span class="detail-value">{{ selectedVerification.trustScore }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Methods:</span>
            <span v-for="m in selectedVerification.methods" :key="m" class="method-tag">{{ m }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created:</span>
            <span class="detail-value">{{ formatDate(selectedVerification.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expires:</span>
            <span class="detail-value">{{ formatDate(selectedVerification.expiresAt) }}</span>
          </div>
          <div v-if="selectedVerification.requiredActions?.length" class="actions-list">
            <h4>Required Actions:</h4>
            <ul>
              <li v-for="(action, i) in selectedVerification.requiredActions" :key="i">{{ action }}</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="selectedVerification.status === 'pending'" class="btn-success" @click="completeVerification(selectedVerification.id)">Complete</button>
          <button v-if="selectedVerification.status === 'pending'" class="btn-danger" @click="rejectVerification(selectedVerification.id)">Reject</button>
          <button class="btn-secondary" @click="selectedVerification = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  getVerifications, 
  getVerificationStats, 
  getVerificationLevels,
  createVerification,
  completeVerification as completeVerif,
  rejectVerification as rejectVerif
} from '@/service/identityVerification';

const tabs = [
  { key: 'list', label: 'Verifications' },
  { key: 'levels', label: 'Levels' },
  { key: 'create', label: 'Create New' },
];

const activeTab = ref('list');
const verifications = ref<any[]>([]);
const stats = ref<any>(null);
const levels = ref<any>({});
const page = ref(1);
const limit = ref(20);
const totalPages = computed(() => Math.ceil((stats.value?.totalVerifications || 0) / limit.value));

const filters = ref({
  status: '',
  level: '',
  address: '',
});

const form = ref({
  address: '',
  chainId: 1,
  verificationLevel: 'basic' as const,
  methods: ['wallet'],
});

const selectedVerification = ref<any>(null);

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BSC',
  8453: 'Base',
  43114: 'Avalanche',
};

const getChainName = (chainId: number) => chainNames[chainId] || `Chain ${chainId}`;

const shortenAddress = (addr: string) => {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
};

const formatDate = (date: Date | string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const getScoreClass = (score: number) => {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

const loadVerifications = async () => {
  try {
    const params: any = { page: page.value, limit: limit.value };
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.level) params.level = filters.value.level;
    if (filters.value.address) params.address = filters.value.address;
    
    const res = await getVerifications(params);
    verifications.value = res.data;
  } catch (e) {
    console.error('Failed to load verifications:', e);
  }
};

const loadStats = async () => {
  try {
    stats.value = await getVerificationStats();
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
};

const loadLevels = async () => {
  try {
    levels.value = await getVerificationLevels();
  } catch (e) {
    console.error('Failed to load levels:', e);
  }
};

const changePage = (delta: number) => {
  page.value += delta;
  loadVerifications();
};

const viewVerification = (v: any) => {
  selectedVerification.value = v;
};

const createVerificationReq = async () => {
  try {
    await createVerification(form.value);
    alert('Verification request created!');
    activeTab.value = 'list';
    loadVerifications();
    loadStats();
  } catch (e) {
    console.error('Failed to create verification:', e);
  }
};

const completeVerification = async (id: number) => {
  try {
    await completeVerif(id);
    selectedVerification.value = null;
    loadVerifications();
    loadStats();
  } catch (e) {
    console.error('Failed to complete verification:', e);
  }
};

const rejectVerification = async (id: number) => {
  const reason = prompt('Rejection reason:');
  if (!reason) return;
  try {
    await rejectVerif(id, reason);
    selectedVerification.value = null;
    loadVerifications();
    loadStats();
  } catch (e) {
    console.error('Failed to reject verification:', e);
  }
};

onMounted(() => {
  loadVerifications();
  loadStats();
  loadLevels();
});
</script>

<style scoped>
.identity-verification {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card h3 {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filters {
  display: flex;
  gap: 12px;
}

.filters select, .filters input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: #4f46e5;
  color: white;
}

.level-bars {
  padding: 16px 0;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-label {
  width: 80px;
  font-size: 14px;
}

.bar-track {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}

.bar-fill.basic { background: #10b981; }
.bar-fill.standard { background: #3b82f6; }
.bar-fill.advanced { background: #f59e0b; }
.bar-fill.enterprise { background: #8b5cf6; }

.bar-value {
  width: 40px;
  text-align: right;
  font-weight: bold;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f9f9f9;
  font-weight: 600;
}

.address {
  font-family: monospace;
  font-size: 12px;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.level-badge.basic { background: #d1fae5; color: #065f46; }
.level-badge.standard { background: #dbeafe; color: #1e40af; }
.level-badge.advanced { background: #fef3c7; color: #92400e; }
.level-badge.enterprise { background: #ede9fe; color: #5b21b6; }

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.verified { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.status-badge.expired { background: #f3f4f6; color: #6b7280; }

.score-bar {
  width: 100px;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 10px;
}

.score-fill.high { background: #10b981; }
.score-fill.medium { background: #f59e0b; }
.score-fill.low { background: #ef4444; }

.score-text {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
}

.btn-small {
  padding: 4px 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.pagination button {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.level-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.level-card:hover {
  border-color: #4f46e5;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.level-header h4 {
  margin: 0;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #4f46e5;
}

.level-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.level-score {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.level-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.method-tag {
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
}

.features-list {
  list-style: none;
  padding: 0;
  margin-bottom: 16px;
  font-size: 13px;
}

.features-list li {
  margin-bottom: 4px;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: normal;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  font-weight: 500;
  color: #666;
}

.actions-list {
  margin-top: 16px;
}

.actions-list h4 {
  margin-bottom: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-success {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-danger {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  padding: 8px 16px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
