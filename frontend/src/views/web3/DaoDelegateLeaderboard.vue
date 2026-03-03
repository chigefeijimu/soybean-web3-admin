<template>
  <div class="dao-delegate-leaderboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <h2>DAO Delegate Leaderboard</h2>
      </el-col>
    </el-row>

    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalDelegates }}</div>
            <div class="stat-label">Total Delegates</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.activeDaos }}</div>
            <div class="stat-label">Active DAOs</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(stats.totalVotingPower) }}</div>
            <div class="stat-label">Total Voting Power</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.avgParticipation }}%</div>
            <div class="stat-label">Avg Participation</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- Leaderboard Tab -->
      <el-tab-pane label="Leaderboard" name="leaderboard">
        <el-card>
          <div class="toolbar">
            <el-select v-model="selectedDao" placeholder="Select DAO" clearable style="width: 200px">
              <el-option v-for="dao in daos" :key="dao.name" :label="dao.name" :value="dao.name" />
            </el-select>
            <el-select v-model="sortBy" placeholder="Sort by" style="width: 180px; margin-left: 10px">
              <el-option label="Voting Power" value="votingPower" />
              <el-option label="Delegators" value="delegators" />
              <el-option label="Participation" value="participation" />
              <el-option label="Reputation" value="reputation" />
            </el-select>
            <el-button type="primary" @click="loadLeaderboard" style="margin-left: 10px">
              <el-icon><Refresh /></el-icon> Refresh
            </el-button>
            <el-input
              v-model="searchQuery"
              placeholder="Search delegates..."
              style="width: 300px; margin-left: auto"
              clearable
              @input="filterDelegates"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="filteredDelegates" style="width: 100%; margin-top: 20px" stripe>
            <el-table-column label="#" width="60">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.offset || 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="walletAddress" label="Delegate Address" min-width="200">
              <template #default="{ row }">
                <el-tooltip :content="row.walletAddress">
                  <span class="address clickable" @click="viewDelegateDetails(row)">
                    {{ shortenAddress(row.walletAddress) }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="daoName" label="DAO" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.daoName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="votingPower" label="Voting Power" width="150" sortable>
              <template #default="{ row }">
                {{ formatNumber(row.votingPower) }}
              </template>
            </el-table-column>
            <el-table-column prop="delegatorsCount" label="Delegators" width="120" sortable>
              <template #default="{ row }">
                {{ row.delegatorsCount }}
              </template>
            </el-table-column>
            <el-table-column prop="participationRate" label="Participation" width="130" sortable>
              <template #default="{ row }">
                <el-progress :percentage="parseFloat(row.participationRate)" :color="getProgressColor(row.participationRate)" />
              </template>
            </el-table-column>
            <el-table-column prop="proposalSupportRate" label="Support Rate" width="130" sortable>
              <template #default="{ row }">
                {{ row.proposalSupportRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="reputationScore" label="Reputation" width="120" sortable>
              <template #default="{ row }">
                <el-tag :type="getReputationType(row.reputationLevel)">
                  {{ row.reputationScore.toFixed(1) }} ({{ row.reputationLevel }})
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewDelegateDetails(row)">Details</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pagination.limit"
            :total="pagination.total"
            layout="total, prev, pager, next"
            style="margin-top: 20px; justify-content: center"
            @current-change="handlePageChange"
          />
        </el-card>
      </el-tab-pane>

      <!-- Top Delegates Tab -->
      <el-tab-pane label="Top Delegates" name="top">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>Top Delegates by DAO</span>
                </div>
              </template>
              <el-row :gutter="20">
                <el-col v-for="(delegates, daoName) in topDelegates" :key="daoName" :span="8">
                  <el-card shadow="hover" class="dao-card">
                    <template #header>
                      <div class="dao-header">
                        <el-tag type="primary">{{ daoName }}</el-tag>
                      </div>
                    </template>
                    <div v-if="delegates && delegates.length > 0">
                      <div v-for="(delegate, idx) in delegates" :key="delegate.walletAddress" class="delegate-row">
                        <span class="rank">#{{ idx + 1 }}</span>
                        <span class="address">{{ shortenAddress(delegate.walletAddress) }}</span>
                        <span class="power">{{ formatNumber(delegate.votingPower) }}</span>
                      </div>
                    </div>
                    <el-empty v-else description="No data" :image-size="60" />
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Search Tab -->
      <el-tab-pane label="Search" name="search">
        <el-card>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input
                v-model="searchAddress"
                placeholder="Enter wallet address to search"
                clearable
                @keyup.enter="searchDelegate"
              >
                <template #append>
                  <el-button :icon="Search" @click="searchDelegate" />
                </template>
              </el-input>
            </el-col>
            <el-col :span="12">
              <el-select v-model="searchDaoName" placeholder="Filter by DAO (optional)" clearable style="width: 100%">
                <el-option v-for="dao in daos" :key="dao.name" :label="dao.name" :value="dao.name" />
              </el-select>
            </el-col>
          </el-row>

          <div v-if="searchResult" style="margin-top: 20px">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>Search Result</span>
                  <el-tag :type="getReputationType(searchResult.reputationLevel)">
                    {{ searchResult.reputationLevel }}
                  </el-tag>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="Address">
                  <span class="address">{{ searchResult.walletAddress }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="DAO">
                  <el-tag>{{ searchResult.daoName }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Voting Power">
                  {{ formatNumber(searchResult.votingPower) }}
                </el-descriptions-item>
                <el-descriptions-item label="Delegators">
                  {{ searchResult.delegatorsCount }}
                </el-descriptions-item>
                <el-descriptions-item label="Participation Rate">
                  {{ searchResult.participationRate }}%
                </el-descriptions-item>
                <el-descriptions-item label="Proposal Support Rate">
                  {{ searchResult.proposalSupportRate }}%
                </el-descriptions-item>
                <el-descriptions-item label="Reputation Score">
                  {{ searchResult.reputationScore.toFixed(1) }}
                </el-descriptions-item>
                <el-descriptions-item label="Votes Cast">
                  {{ searchResult.votesCast }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Compare Tab -->
      <el-tab-pane label="Compare" name="compare">
        <el-card>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-select v-model="compareDao" placeholder="Select DAO" style="width: 100%">
                <el-option v-for="dao in daos" :key="dao.name" :label="dao.name" :value="dao.name" />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select
                v-model="compareAddresses"
                multiple
                filterable
                placeholder="Select delegates to compare"
                style="width: 100%"
              >
                <el-option
                  v-for="delegate in allDelegates"
                  :key="delegate.walletAddress"
                  :label="shortenAddress(delegate.walletAddress)"
                  :value="delegate.walletAddress"
                />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="compareDelegates" :disabled="compareAddresses.length < 2">
                Compare
              </el-button>
            </el-col>
          </el-row>

          <div v-if="compareResults.length > 0" style="margin-top: 20px">
            <el-table :data="compareResults" style="width: 100%" stripe>
              <el-table-column prop="walletAddress" label="Delegate" min-width="180">
                <template #default="{ row }">
                  <span class="address">{{ shortenAddress(row.walletAddress) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="votingPower" label="Voting Power" sortable>
                <template #default="{ row }">
                  {{ formatNumber(row.votingPower) }}
                </template>
              </el-table-column>
              <el-table-column prop="delegatorsCount" label="Delegators" sortable />
              <el-table-column prop="participationRate" label="Participation" sortable>
                <template #default="{ row }">
                  {{ row.participationRate }}%
                </template>
              </el-table-column>
              <el-table-column prop="reputationScore" label="Reputation" sortable>
                <template #default="{ row }">
                  <el-tag :type="getReputationType(row.reputationLevel)">
                    {{ row.reputationScore.toFixed(1) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Alerts Tab -->
      <el-tab-pane label="Alerts" name="alerts">
        <el-card>
          <div class="toolbar">
            <el-button type="primary" @click="showAlertDialog = true">
              <el-icon><Plus /></el-icon> Create Alert
            </el-button>
          </div>

          <el-table :data="alerts" style="width: 100%; margin-top: 20px" stripe>
            <el-table-column prop="walletAddress" label="Delegate" min-width="180">
              <template #default="{ row }">
                <span class="address">{{ shortenAddress(row.walletAddress) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="daoName" label="DAO" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.daoName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alertType" label="Alert Type" width="180">
              <template #default="{ row }">
                <el-tag :type="getAlertType(row.alertType)">{{ formatAlertType(row.alertType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="Threshold" width="120">
              <template #default="{ row }">
                {{ row.threshold || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="Status" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'danger'">
                  {{ row.enabled ? 'Active' : 'Disabled' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="toggleAlert(row)">
                  {{ row.enabled ? 'Disable' : 'Enable' }}
                </el-button>
                <el-button size="small" type="danger" @click="deleteAlert(row)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Delegate Details Dialog -->
    <el-dialog v-model="showDetailsDialog" title="Delegate Details" width="700px">
      <div v-if="selectedDelegate">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Address" :span="2">
            <span class="address">{{ selectedDelegate.walletAddress }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="DAO">
            <el-tag>{{ selectedDelegate.daoName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Chain">
            <el-tag type="info">{{ selectedDelegate.chain }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Voting Power">
            {{ formatNumber(selectedDelegate.votingPower) }}
          </el-descriptions-item>
          <el-descriptions-item label="Delegators">
            {{ selectedDelegate.delegatorsCount }}
          </el-descriptions-item>
          <el-descriptions-item label="Participation Rate">
            {{ selectedDelegate.participationRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="Proposal Support Rate">
            {{ selectedDelegate.proposalSupportRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="Proposals Voted">
            {{ selectedDelegate.proposalsVoted }}
          </el-descriptions-item>
          <el-descriptions-item label="Votes Cast">
            {{ selectedDelegate.votesCast }}
          </el-descriptions-item>
          <el-descriptions-item label="Reputation Score">
            <el-tag :type="getReputationType(selectedDelegate.reputationLevel)">
              {{ selectedDelegate.reputationScore.toFixed(1) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Reputation Level" :span="2">
            <el-tag :type="getReputationType(selectedDelegate.reputationLevel)" size="large">
              {{ selectedDelegate.reputationLevel }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedDelegate.recentVotes && selectedDelegate.recentVotes.length > 0" style="margin-top: 20px">
          <h4>Recent Votes</h4>
          <el-table :data="selectedDelegate.recentVotes" size="small" stripe>
            <el-table-column prop="proposalId" label="Proposal" />
            <el-table-column prop="vote" label="Vote">
              <template #default="{ row }">
                <el-tag :type="row.vote === 'FOR' ? 'success' : 'danger'">{{ row.vote }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- Create Alert Dialog -->
    <el-dialog v-model="showAlertDialog" title="Create Alert" width="500px">
      <el-form :model="alertForm" label-width="120px">
        <el-form-item label="Delegate Address">
          <el-input v-model="alertForm.walletAddress" placeholder="Enter delegate address" />
        </el-form-item>
        <el-form-item label="DAO">
          <el-select v-model="alertForm.daoName" placeholder="Select DAO" style="width: 100%">
            <el-option v-for="dao in daos" :key="dao.name" :label="dao.name" :value="dao.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="Alert Type">
          <el-select v-model="alertForm.alertType" placeholder="Select alert type" style="width: 100%">
            <el-option label="Voting Power Change" value="voting_power_change" />
            <el-option label="New Delegation" value="new_delegation" />
            <el-option label="Delegation Removed" value="delegation_removed" />
            <el-option label="Vote Missed" value="vote_missed" />
          </el-select>
        </el-form-item>
        <el-form-item label="Threshold">
          <el-input-number v-model="alertForm.threshold" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAlertDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createAlert">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'

const API_BASE = '/api/dao-delegate-leaderboard'

// State
const activeTab = ref('leaderboard')
const delegates = ref([])
const filteredDelegates = ref([])
const topDelegates = ref({})
const daos = ref([])
const alerts = ref([])
const searchQuery = ref('')
const selectedDao = ref('')
const sortBy = ref('votingPower')
const currentPage = ref(1)
const pagination = ref({ total: 0, limit: 50, offset: 0 })

// Search
const searchAddress = ref('')
const searchDaoName = ref('')
const searchResult = ref(null)

// Compare
const compareDao = ref('')
const compareAddresses = ref([])
const compareResults = ref([])
const allDelegates = ref([])

// Details
const showDetailsDialog = ref(false)
const selectedDelegate = ref(null)

// Alert dialog
const showAlertDialog = ref(false)
const alertForm = ref({
  walletAddress: '',
  daoName: '',
  alertType: 'voting_power_change',
  threshold: 0
})

// Stats
const stats = ref({
  totalDelegates: 0,
  activeDaos: 0,
  totalVotingPower: 0,
  avgParticipation: 0
})

// Methods
const formatNumber = (num) => {
  if (!num) return '0'
  const n = parseFloat(num)
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K'
  return n.toFixed(2)
}

const shortenAddress = (addr) => {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const getProgressColor = (value) => {
  const v = parseFloat(value)
  if (v >= 80) return '#67c23a'
  if (v >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getReputationType = (level) => {
  const types = {
    legend: 'danger',
    veteran: 'warning',
    expert: 'success',
    trusted: 'primary',
    new: 'info'
  }
  return types[level] || 'info'
}

const getChainType = (chain) => {
  const types = {
    ethereum: 'primary',
    arbitrum: 'blue',
    optimism: 'red',
    polygon: 'purple',
    avalanche: 'danger'
  }
  return types[chain] || 'info'
}

const getAlertType = (type) => {
  const types = {
    voting_power_change: 'warning',
    new_delegation: 'success',
    delegation_removed: 'danger',
    vote_missed: 'info'
  }
  return types[type] || 'info'
}

const formatAlertType = (type) => {
  const labels = {
    voting_power_change: 'Voting Power Change',
    new_delegation: 'New Delegation',
    delegation_removed: 'Delegation Removed',
    vote_missed: 'Vote Missed'
  }
  return labels[type] || type
}

const filterDelegates = () => {
  if (!searchQuery.value) {
    filteredDelegates.value = delegates.value
    return
  }
  const q = searchQuery.value.toLowerCase()
  filteredDelegates.value = delegates.value.filter(d => 
    d.walletAddress.toLowerCase().includes(q) ||
    d.daoName.toLowerCase().includes(q)
  )
}

const loadLeaderboard = async () => {
  try {
    const params = new URLSearchParams()
    if (selectedDao.value) params.append('daoName', selectedDao.value)
    params.append('sortBy', sortBy.value)
    params.append('limit', pagination.value.limit)
    params.append('offset', (currentPage.value - 1) * pagination.value.limit)

    const res = await fetch(`${API_BASE}?${params}`)
    const data = await res.json()
    
    if (data.success) {
      delegates.value = data.data
      filteredDelegates.value = data.data
      pagination.value = data.pagination
      topDelegates.value = data.topDelegates || {}
      
      // Update stats
      stats.value.totalDelegates = data.pagination.total
      stats.value.activeDaos = Object.keys(data.topDelegates || {}).length
    }
  } catch (error) {
    ElMessage.error('Failed to load leaderboard')
    console.error(error)
  }
}

const loadDaos = async () => {
  try {
    const res = await fetch(`${API_BASE}/daos/list`)
    const data = await res.json()
    if (data.success) {
      daos.value = data.data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadAlerts = async () => {
  try {
    const res = await fetch(`${API_BASE}/alerts`)
    const data = await res.json()
    if (Array.isArray(data)) {
      alerts.value = data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadAllDelegates = async () => {
  try {
    const params = new URLSearchParams()
    params.append('limit', '100')
    const res = await fetch(`${API_BASE}?${params}`)
    const data = await res.json()
    if (data.success) {
      allDelegates.value = data.data
    }
  } catch (error) {
    console.error(error)
  }
}

const viewDelegateDetails = async (row) => {
  try {
    const res = await fetch(`${API_BASE}/delegate/${row.walletAddress}?daoName=${row.daoName}`)
    const data = await res.json()
    if (data.success) {
      selectedDelegate.value = data.data
      showDetailsDialog.value = true
    }
  } catch (error) {
    ElMessage.error('Failed to load delegate details')
    console.error(error)
  }
}

const searchDelegate = async () => {
  if (!searchAddress.value) return
  try {
    const res = await fetch(`${API_BASE}/delegate/${searchAddress.value}${searchDaoName.value ? `?daoName=${searchDaoName.value}` : ''}`)
    const data = await res.json()
    if (data.success) {
      searchResult.value = data.data
      ElMessage.success('Delegate found')
    } else {
      searchResult.value = null
      ElMessage.warning('Delegate not found')
    }
  } catch (error) {
    ElMessage.error('Search failed')
    console.error(error)
  }
}

const compareDelegates = async () => {
  if (compareAddresses.value.length < 2 || !compareDao.value) return
  try {
    const res = await fetch(`${API_BASE}/compare/${compareDao.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: compareAddresses.value })
    })
    const data = await res.json()
    if (data.success) {
      compareResults.value = data.data
    }
  } catch (error) {
    ElMessage.error('Compare failed')
    console.error(error)
  }
}

const createAlert = async () => {
  try {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertForm.value)
    })
    const data = await res.json()
    if (data.id) {
      ElMessage.success('Alert created')
      showAlertDialog.value = false
      loadAlerts()
      alertForm.value = { walletAddress: '', daoName: '', alertType: 'voting_power_change', threshold: 0 }
    }
  } catch (error) {
    ElMessage.error('Failed to create alert')
    console.error(error)
  }
}

const toggleAlert = async (alert) => {
  try {
    await fetch(`${API_BASE}/alerts/${alert.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !alert.enabled })
    })
    loadAlerts()
  } catch (error) {
    ElMessage.error('Failed to update alert')
  }
}

const deleteAlert = async (alert) => {
  try {
    await fetch(`${API_BASE}/alerts/${alert.id}`, { method: 'DELETE' })
    loadAlerts()
    ElMessage.success('Alert deleted')
  } catch (error) {
    ElMessage.error('Failed to delete alert')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadLeaderboard()
}

onMounted(() => {
  loadDaos()
  loadLeaderboard()
  loadAlerts()
  loadAllDelegates()
})
</script>

<style scoped>
.dao-delegated-leaderboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
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

.main-tabs {
  margin-top: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
}

.address {
  font-family: monospace;
}

.address.clickable {
  cursor: pointer;
  color: #409eff;
}

.address.clickable:hover {
  text-decoration: underline;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delegate-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.delegate-row .rank {
  font-weight: bold;
  width: 40px;
  color: #909399;
}

.delegate-row .address {
  flex: 1;
  font-size: 13px;
}

.delegate-row .power {
  font-weight: bold;
  color: #409eff;
}

.dao-card {
  margin-bottom: 20px;
}
</style>
