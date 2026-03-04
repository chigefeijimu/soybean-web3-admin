<template>
  <div class="social-identity-graph">
    <div class="header">
      <h1>🔗 Cross-chain Social Identity Graph</h1>
      <p>Analyze social connections and identity across multiple chains</p>
    </div>

    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalAddresses?.toLocaleString() || '1,250,000' }}</div>
          <div class="stat-label">Total Addresses</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalIdentities?.toLocaleString() || '890,000' }}</div>
          <div class="stat-label">Linked Identities</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.crossChainIdentities?.toLocaleString() || '156,000' }}</div>
          <div class="stat-label">Cross-chain IDs</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.avgConnections || 12.4 }}</div>
          <div class="stat-label">Avg Connections</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Main Content -->
    <el-row :gutter="20">
      <!-- Left Panel -->
      <el-col :span="12">
        <el-card class="main-card">
          <template #header>
            <div class="card-header">
              <span>Address Analysis</span>
            </div>
          </template>
          
          <el-input
            v-model="address"
            placeholder="Enter wallet address (0x...)"
            class="address-input"
            @keyup.enter="analyzeAddress"
          >
            <template #prepend>
              <el-select v-model="selectedChain" placeholder="Chain" style="width: 120px">
                <el-option label="All Chains" value="" />
                <el-option label="Ethereum" value="ethereum" />
                <el-option label="Polygon" value="polygon" />
                <el-option label="Arbitrum" value="arbitrum" />
                <el-option label="Optimism" value="optimism" />
                <el-option label="BSC" value="bsc" />
                <el-option label="Base" value="base" />
                <el-option label="Avalanche" value="avalanche" />
                <el-option label="Solana" value="solana" />
              </el-select>
            </template>
            <template #append>
              <el-button :icon="Search" @click="analyzeAddress" :loading="loading" />
            </template>
          </el-input>

          <!-- Analysis Results -->
          <div v-if="analysis" class="analysis-results">
            <el-divider content-position="left">Identity Profiles</el-divider>
            <div class="identity-cards">
              <el-tag v-for="profile in analysis.profiles" :key="profile.address" class="identity-tag">
                <span v-if="profile.ens">🌐 {{ profile.ens }}</span>
                <span v-if="profile.solanaAddress">☀️ {{ profile.solanaAddress?.slice(0, 8) }}...</span>
                <span v-if="profile.lens">📸 lens/{{ profile.lens }}</span>
                <span v-if="profile.farcaster">👤 @{{ profile.farcaster }}</span>
              </el-tag>
              <el-tag v-if="!analysis.profiles?.length" type="info">No linked identities found</el-tag>
            </div>

            <el-divider content-position="left">Reputation Score</el-divider>
            <div class="reputation-section">
              <el-progress 
                :percentage="analysis.reputation?.score || 0" 
                :color="getReputationColor(analysis.reputation?.grade)"
                :stroke-width="20"
              />
              <div class="reputation-grade">
                Grade: <strong :style="{ color: getReputationColor(analysis.reputation?.grade) }">{{ analysis.reputation?.grade || 'N/A' }}</strong>
              </div>
              <div class="reputation-factors">
                <el-tag v-for="(value, key) in analysis.reputation?.factors" :key="key" type="info" class="factor-tag">
                  {{ key }}: {{ value }}
                </el-tag>
              </div>
            </div>

            <el-divider content-position="left">Network Preview</el-divider>
            <div class="network-preview">
              <el-tag v-for="node in analysis.network?.nodes?.slice(0, 10)" :key="node.id" class="network-node">
                {{ node.label }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- Search Identity -->
        <el-card class="main-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>🔍 Identity Search</span>
            </div>
          </template>
          
          <el-input
            v-model="searchQuery"
            placeholder="Search by ENS, Lens handle, address, or domain"
            @keyup.enter="searchIdentity"
          >
            <template #append>
              <el-button :icon="Search" @click="searchIdentity" :loading="searching" />
            </template>
          </el-input>

          <div v-if="searchResults.length" class="search-results">
            <el-result
              v-for="(result, idx) in searchResults"
              :key="idx"
              :icon="result.type === 'address' ? 'SuccessFilled' : 'InfoFilled'"
              :title="result.type.toUpperCase()"
            >
              <template #sub-title>
                <div v-if="result.resolved?.address">
                  <el-link type="primary">{{ result.resolved.address }}</el-link>
                </div>
                <div v-if="result.profile">
                  <el-tag>{{ result.profile.identities?.length || 0 }} identities</el-tag>
                </div>
              </template>
            </el-result>
          </div>
        </el-card>
      </el-col>

      <!-- Right Panel -->
      <el-col :span="12">
        <!-- Tabs -->
        <el-tabs v-model="activeTab" class="main-tabs">
          <el-tab-pane label="Connections" name="connections">
            <el-card class="tab-card">
              <el-input
                v-model="connectionAddress"
                placeholder="Enter address to view connections"
                @keyup.enter="fetchConnections"
              >
                <template #append>
                  <el-button @click="fetchConnections" :loading="loadingConnections">Fetch</el-button>
                </template>
              </el-input>

              <div v-if="connections.length" class="connections-list">
                <el-table :data="connections" style="width: 100%" max-height="400">
                  <el-table-column prop="address" label="Address" width="180">
                    <template #default="{ row }">
                      <el-link type="primary">{{ row.address.slice(0, 10) }}...</el-link>
                    </template>
                  </el-table-column>
                  <el-table-column prop="relationship" label="Relationship" width="120" />
                  <el-table-column prop="strength" label="Strength" width="100">
                    <template #default="{ row }">
                      <el-progress :percentage="Math.round(row.strength * 100)" :stroke-width="10" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="lastInteraction" label="Last Seen">
                    <template #default="{ row }">
                      {{ formatDate(row.lastInteraction) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="Social Network" name="network">
            <el-card class="tab-card">
              <div class="network-stats">
                <el-statistic title="Total Nodes" :value="networkStats.totalConnections" />
                <el-statistic title="Centrality" :value="networkStats.centrality" />
                <el-statistic title="Density" :value="networkStats.density" />
              </div>

              <div class="network-visualization">
                <div class="network-placeholder">
                  <el-icon :size="60" color="#409EFF"><Connection /></el-icon>
                  <p>Network visualization would appear here</p>
                  <p class="network-hint">Connecting to {{ networkStats.totalConnections || 0 }} addresses</p>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="Reputation" name="reputation">
            <el-card class="tab-card">
              <el-input
                v-model="reputationAddress"
                placeholder="Enter address to check reputation"
                @keyup.enter="fetchReputation"
              >
                <template #append>
                  <el-button @click="fetchReputation" :loading="loadingReputation">Check</el-button>
                </template>
              </el-input>

              <div v-if="reputationData" class="reputation-details">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-statistic title="Reputation Score" :value="reputationData.score" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="Grade" :value="reputationData.grade" />
                  </el-col>
                </el-row>

                <el-divider>Badges</el-divider>
                <div class="badges">
                  <el-tag v-for="badge in reputationData.badges" :key="badge" size="large">
                    {{ badge }}
                  </el-tag>
                </div>

                <el-divider>History</el-divider>
                <el-table :data="reputationData.history" size="small">
                  <el-table-column prop="date" label="Date" />
                  <el-table-column prop="score" label="Score" />
                </el-table>
              </div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="Discover" name="discover">
            <el-card class="tab-card">
              <div class="discover-header">
                <el-select v-model="discoverChain" placeholder="Filter by chain" clearable>
                  <el-option label="All Chains" value="" />
                  <el-option label="Ethereum" value="ethereum" />
                  <el-option label="Polygon" value="polygon" />
                  <el-option label="Arbitrum" value="arbitrum" />
                  <el-option label="Solana" value="solana" />
                </el-select>
                <el-button @click="discoverInfluencers" :loading="loadingDiscover">Refresh</el-button>
              </div>

              <div class="influencers-list">
                <el-card 
                  v-for="influencer in influencers" 
                  :key="influencer.address" 
                  class="influencer-card"
                  shadow="hover"
                >
                  <div class="influencer-header">
                    <el-avatar :size="40" :style="{ backgroundColor: getRandomColor() }">
                      {{ influencer.name?.[0] }}
                    </el-avatar>
                    <div class="influencer-info">
                      <div class="influencer-name">{{ influencer.name }}</div>
                      <div class="influencer-address">{{ influencer.address.slice(0, 8) }}...</div>
                    </div>
                    <el-tag :type="influencer.influenceScore > 80 ? 'success' : 'warning'">
                      {{ influencer.influenceScore }}
                    </el-tag>
                  </div>
                  <div class="influencer-stats">
                    <el-tag>{{ influencer.primaryChain }}</el-tag>
                    <span>👥 {{ influencer.followers?.toLocaleString() }}</span>
                    <span class="badges">{{ influencer.badges?.join(' ') }}</span>
                  </div>
                </el-card>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Connection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { get } from '@/utils'

const address = ref('')
const selectedChain = ref('')
const loading = ref(false)
const analysis = ref<any>(null)

const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref<any[]>([])

const activeTab = ref('connections')
const connectionAddress = ref('')
const loadingConnections = ref(false)
const connections = ref<any[]>([])

const networkStats = ref({ totalConnections: 0, centrality: 0, density: 0 })

const reputationAddress = ref('')
const loadingReputation = ref(false)
const reputationData = ref<any>(null)

const discoverChain = ref('')
const loadingDiscover = ref(false)
const influencers = ref<any[]>([])

const stats = ref<any>({})

onMounted(async () => {
  try {
    const res = await get('/web3/social-identity-graph/stats')
    stats.value = res
  } catch (e) {
    console.error('Failed to load stats', e)
  }
})

async function analyzeAddress() {
  if (!address.value) {
    ElMessage.warning('Please enter an address')
    return
  }
  loading.value = true
  try {
    const res = await post('/web3/social-identity-graph/analyze', {
      address: address.value,
      chains: selectedChain.value ? [selectedChain.value] : undefined
    })
    analysis.value = res
    ElMessage.success('Analysis complete')
  } catch (e) {
    ElMessage.error('Analysis failed')
  } finally {
    loading.value = false
  }
}

async function searchIdentity() {
  if (!searchQuery.value) {
    ElMessage.warning('Please enter a search query')
    return
  }
  searching.value = true
  try {
    const res = await post('/web3/social-identity-graph/search', {
      query: searchQuery.value,
      chain: selectedChain.value || undefined
    })
    searchResults.value = res.results || []
  } catch (e) {
    ElMessage.error('Search failed')
  } finally {
    searching.value = false
  }
}

async function fetchConnections() {
  if (!connectionAddress.value) {
    ElMessage.warning('Please enter an address')
    return
  }
  loadingConnections.value = true
  try {
    const res = await get(`/web3/social-identity-graph/connections?address=${connectionAddress.value}&chain=${selectedChain.value || 'ethereum'}&depth=2`)
    connections.value = res.connections || []
    networkStats.value = res.statistics || {}
  } catch (e) {
    ElMessage.error('Failed to fetch connections')
  } finally {
    loadingConnections.value = false
  }
}

async function fetchReputation() {
  if (!reputationAddress.value) {
    ElMessage.warning('Please enter an address')
    return
  }
  loadingReputation.value = true
  try {
    const res = await get(`/web3/social-identity-graph/reputation/${reputationAddress.value}`)
    reputationData.value = res
  } catch (e) {
    ElMessage.error('Failed to fetch reputation')
  } finally {
    loadingReputation.value = false
  }
}

async function discoverInfluencers() {
  loadingDiscover.value = true
  try {
    const chain = discoverChain.value || undefined
    const res = await get(`/web3/social-identity-graph/discover${chain ? `?chain=${chain}` : ''}`)
    influencers.value = res.influencers || []
  } catch (e) {
    ElMessage.error('Failed to discover influencers')
  } finally {
    loadingDiscover.value = false
  }
}

function getReputationColor(grade: string) {
  const colors: Record<string, string> = {
    S: '#FFD700',
    A: '#67C23A',
    B: '#409EFF',
    C: '#E6A23C',
    D: '#F56C6C',
    F: '#909399'
  }
  return colors[grade] || '#909399'
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString()
}

function getRandomColor() {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#C0C4CC']
  return colors[Math.floor(Math.random() * colors.length)]
}

function post(url: string, data: any) {
  return fetch(`/api${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())
}
</script>

<style scoped>
.social-identity-graph {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.header p {
  color: #909399;
  margin: 5px 0 0;
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
  color: #409EFF;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.address-input {
  margin-bottom: 20px;
}

.analysis-results {
  margin-top: 20px;
}

.identity-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.identity-tag {
  margin: 5px;
}

.reputation-section {
  text-align: center;
}

.reputation-grade {
  margin: 10px 0;
  font-size: 18px;
}

.reputation-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

.factor-tag {
  font-size: 12px;
}

.network-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.network-node {
  cursor: pointer;
}

.main-tabs {
  background: white;
  border-radius: 8px;
}

.tab-card {
  min-height: 500px;
}

.network-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.network-visualization {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.network-placeholder {
  text-align: center;
  color: #909399;
}

.network-hint {
  font-size: 12px;
}

.reputation-details {
  margin-top: 20px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.discover-header {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.influencers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.influencer-card {
  cursor: pointer;
}

.influencer-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.influencer-info {
  flex: 1;
}

.influencer-name {
  font-weight: bold;
}

.influencer-address {
  font-size: 12px;
  color: #909399;
}

.influencer-stats {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-results {
  margin-top: 20px;
}
</style>
