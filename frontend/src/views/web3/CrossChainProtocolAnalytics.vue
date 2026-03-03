<template>
  <div class="cross-chain-protocol-analytics">
    <div class="header">
      <h2>🌐 Cross-chain Protocol Analytics</h2>
      <p>Comprehensive DeFi protocol analytics across multiple chains</p>
    </div>

    <!-- Overview Stats -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">Total TVL</div>
          <div class="stat-value">${{ formatNumber(overview.summary?.totalTvl || 0) }}</div>
          <div class="stat-change positive">↑ 2.5%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">24h Volume</div>
          <div class="stat-value">${{ formatNumber(overview.summary?.totalVolume24h || 0) }}</div>
          <div class="stat-change positive">↑ 5.2%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">Active Users</div>
          <div class="stat-value">{{ formatNumber(overview.summary?.totalUsers24h || 0) }}</div>
          <div class="stat-change positive">↑ 3.1%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">Protocols</div>
          <div class="stat-value">{{ overview.summary?.protocolCount || 0 }}</div>
          <div class="stat-change">Across {{ overview.summary?.chainCount || 0 }} chains</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filter Section -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.chain" placeholder="Select Chain" clearable @change="loadProtocols">
            <el-option label="All Chains" value="" />
            <el-option label="Ethereum" value="ethereum" />
            <el-option label="Arbitrum" value="arbitrum" />
            <el-option label="Polygon" value="polygon" />
            <el-option label="Base" value="base" />
            <el-option label="Optimism" value="optimism" />
            <el-option label="Avalanche" value="avalanche" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.category" placeholder="Category" clearable @change="loadProtocols">
            <el-option label="All Categories" value="" />
            <el-option label="DEX" value="dex" />
            <el-option label="Lending" value="lending" />
            <el-option label="Staking" value="staking" />
            <el-option label="Yield" value="yield" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.sortBy" placeholder="Sort By" @change="loadProtocols">
            <el-option label="TVL" value="tvl" />
            <el-option label="Volume" value="volume" />
            <el-option label="Users" value="users" />
            <el-option label="APY" value="apy" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="loadProtocols">
            <el-icon><Refresh /></el-icon> Refresh
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="analytics-tabs">
      <el-tab-pane label="Protocols" name="protocols">
        <!-- Protocol List -->
        <el-table :data="protocols" style="width: 100%" :default-sort="{ prop: 'tvl', order: 'descending' }">
          <el-table-column prop="rank" label="#" width="60" />
          <el-table-column prop="name" label="Protocol" width="180">
            <template #default="{ row }">
              <div class="protocol-name">
                <strong>{{ row.name }}</strong>
                <el-tag size="small" :type="getChainTagType(row.chain)">{{ row.chain }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="Category" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="tvl" label="TVL" width="140" sortable>
            <template #default="{ row }">
              ${{ formatNumber(row.tvl) }}
              <div class="change" :class="row.tvlChange24h >= 0 ? 'positive' : 'negative'">
                {{ row.tvlChange24h >= 0 ? '↑' : '↓' }} {{ row.tvlChange24h.toFixed(2) }}%
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="volume24h" label="Volume 24h" width="140" sortable>
            <template #default="{ row }">
              ${{ formatNumber(row.volume24h) }}
            </template>
          </el-table-column>
          <el-table-column prop="users24h" label="Users 24h" width="120" sortable>
            <template #default="{ row }">
              {{ formatNumber(row.users24h) }}
            </template>
          </el-table-column>
          <el-table-column prop="apy" label="APY" width="100" sortable>
            <template #default="{ row }">
              <span class="apy">{{ row.apy.toFixed(2) }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="healthScore" label="Health" width="100">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.healthScore" 
                :color="getHealthColor(row.healthScore)"
                :stroke-width="8"
                style="width: 60px"
              />
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="Risk" width="100">
            <template #default="{ row }">
              <el-tag :type="getRiskType(row.riskLevel)" size="small">
                {{ row.riskLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetails(row)">Details</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Chains" name="chains">
        <el-row :gutter="20">
          <el-col :span="8" v-for="chain in chains" :key="chain.chain">
            <el-card shadow="hover" class="chain-card">
              <template #header>
                <div class="chain-header">
                  <span class="chain-name">{{ chain.chain }}</span>
                  <el-tag size="small">{{ chain.protocolCount }} protocols</el-tag>
                </div>
              </template>
              <div class="chain-stats">
                <div class="chain-stat">
                  <span class="label">TVL</span>
                  <span class="value">${{ formatNumber(chain.totalTvl) }}</span>
                </div>
                <div class="chain-stat">
                  <span class="label">24h Volume</span>
                  <span class="value">${{ formatNumber(chain.totalVolume24h) }}</span>
                </div>
                <div class="chain-stat">
                  <span class="label">Avg APY</span>
                  <span class="value">{{ chain.avgApy.toFixed(2) }}%</span>
                </div>
                <div class="chain-stat">
                  <span class="label">Top Protocols</span>
                  <span class="value">{{ chain.topProtocols?.join(', ') }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="Categories" name="categories">
        <el-row :gutter="20">
          <el-col :span="6" v-for="cat in categories" :key="cat.category">
            <el-card shadow="hover" class="category-card">
              <div class="category-icon">
                {{ getCategoryIcon(cat.category) }}
              </div>
              <div class="category-name">{{ cat.category }}</div>
              <div class="category-tvl">${{ formatNumber(cat.totalTvl) }}</div>
              <div class="category-stats">
                <div>{{ cat.protocolCount }} protocols</div>
                <div>Avg APY: {{ cat.avgApy.toFixed(2) }}%</div>
                <div>Growth: {{ cat.growth >= 0 ? '+' : '' }}{{ cat.growth.toFixed(2) }}%</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="Trending" name="trending">
        <el-row :gutter="20">
          <el-col :span="8" v-for="protocol in trending" :key="protocol.id">
            <el-card shadow="hover" class="trending-card">
              <div class="trending-header">
                <strong>{{ protocol.name }}</strong>
                <el-tag size="small" :type="getChainTagType(protocol.chain)">{{ protocol.chain }}</el-tag>
              </div>
              <div class="trending-change positive">
                ↑ {{ protocol.change.toFixed(2) }}% (24h)
              </div>
              <div class="trending-tvl">TVL: ${{ formatNumber(protocol.tvl) }}</div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="Risk Analysis" name="risk">
        <el-table :data="riskData" style="width: 100%">
          <el-table-column prop="name" label="Protocol" width="180" />
          <el-table-column prop="chain" label="Chain" width="100" />
          <el-table-column prop="riskLevel" label="Risk Level" width="100">
            <template #default="{ row }">
              <el-tag :type="getRiskType(row.riskLevel)">{{ row.riskLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="healthScore" label="Health Score" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.healthScore" 
                :color="getHealthColor(row.healthScore)"
                :stroke-width="10"
                style="width: 80px"
              />
            </template>
          </el-table-column>
          <el-table-column prop="auditStatus" label="Audit Status" width="120">
            <template #default="{ row }">
              <el-tag :type="row.auditStatus === 'audited' ? 'success' : 'warning'" size="small">
                {{ row.auditStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Risk Factors" min-width="200">
            <template #default="{ row }">
              <div v-for="(value, key) in row.factors" :key="key" class="risk-factor">
                <span class="factor-name">{{ key }}:</span>
                <span :class="value === 'Low' ? 'low-risk' : value === 'Medium' ? 'medium-risk' : 'high-risk'">
                  {{ value }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Recommendations" min-width="200">
            <template #default="{ row }">
              <ul class="recommendations">
                <li v-for="rec in row.recommendations" :key="rec">{{ rec }}</li>
              </ul>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Yield Opportunities" name="yield">
        <el-row :gutter="20">
          <el-col :span="8" v-for="opp in yieldOpportunities" :key="opp.id">
            <el-card shadow="hover" class="yield-card">
              <div class="yield-header">
                <strong>{{ opp.name }}</strong>
                <el-tag size="small" :type="getRiskType(opp.riskLevel)">{{ opp.riskLevel }}</el-tag>
              </div>
              <div class="yield-chain">{{ opp.chain }} • {{ opp.category }}</div>
              <div class="yield-apy">{{ opp.apy.toFixed(2) }}% APY</div>
              <div class="yield-tvl">TVL: ${{ formatNumber(opp.tvl) }}</div>
              <div class="yield-roi">ROI Score: {{ opp.roi.toFixed(2) }}</div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- Protocol Details Dialog -->
    <el-dialog v-model="detailsVisible" :title="selectedProtocol?.name" width="70%">
      <div v-if="selectedProtocol" class="protocol-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Chain">{{ selectedProtocol.chain }}</el-descriptions-item>
          <el-descriptions-item label="Category">{{ selectedProtocol.category }}</el-descriptions-item>
          <el-descriptions-item label="TVL">${{ formatNumber(selectedProtocol.tvl) }}</el-descriptions-item>
          <el-descriptions-item label="TVL Change">{{ selectedProtocol.tvlChange24h.toFixed(2) }}%</el-descriptions-item>
          <el-descriptions-item label="24h Volume">${{ formatNumber(selectedProtocol.volume24h) }}</el-descriptions-item>
          <el-descriptions-item label="24h Users">{{ formatNumber(selectedProtocol.users24h) }}</el-descriptions-item>
          <el-descriptions-item label="APY">{{ selectedProtocol.apy.toFixed(2) }}%</el-descriptions-item>
          <el-descriptions-item label="Revenue 24h">${{ formatNumber(selectedProtocol.revenue24h) }}</el-descriptions-item>
          <el-descriptions-item label="Health Score">{{ selectedProtocol.healthScore }}</el-descriptions-item>
          <el-descriptions-item label="Risk Level">
            <el-tag :type="getRiskType(selectedProtocol.riskLevel)">{{ selectedProtocol.riskLevel }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

interface Protocol {
  id: string
  name: string
  chain: string
  category: string
  tvl: number
  tvlChange24h: number
  volume24h: number
  users24h: number
  apy: number
  revenue24h: number
  healthScore: number
  riskLevel: string
  auditStatus: string
  rank: number
}

const activeTab = ref('protocols')
const overview = ref<any>({})
const protocols = ref<Protocol[]>([])
const chains = ref<any[]>([])
const categories = ref<any[]>([])
const trending = ref<any[]>([])
const riskData = ref<any[]>([])
const yieldOpportunities = ref<any[]>([])

const filters = ref({
  chain: '',
  category: '',
  sortBy: 'tvl'
})

const detailsVisible = ref(false)
const selectedProtocol = ref<Protocol | null>(null)

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const getChainTagType = (chain: string): string => {
  const types: Record<string, string> = {
    ethereum: '',
    arbitrum: 'success',
    polygon: 'warning',
    base: 'info',
    optimism: 'success',
    avalanche: 'danger'
  }
  return types[chain] || ''
}

const getRiskType = (risk: string): string => {
  const types: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  }
  return types[risk] || ''
}

const getHealthColor = (score: number): string => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#409eff'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    dex: '🔄',
    lending: '💰',
    staking: '🔒',
    yield: '🌾'
  }
  return icons[category] || '📊'
}

const loadOverview = async () => {
  try {
    const res = await axios.get('/api/analytics/protocols/overview')
    overview.value = res.data
  } catch (e) {
    console.error('Failed to load overview:', e)
  }
}

const loadProtocols = async () => {
  try {
    const params = new URLSearchParams()
    if (filters.value.chain) params.append('chain', filters.value.chain)
    if (filters.value.category) params.append('category', filters.value.category)
    if (filters.value.sortBy) params.append('sortBy', filters.value.sortBy)
    
    const res = await axios.get(`/api/analytics/protocols/list?${params}`)
    protocols.value = res.data.data
  } catch (e) {
    console.error('Failed to load protocols:', e)
    ElMessage.error('Failed to load protocols')
  }
}

const loadChains = async () => {
  try {
    const res = await axios.get('/api/analytics/protocols/chains/analysis')
    chains.value = res.data
  } catch (e) {
    console.error('Failed to load chains:', e)
  }
}

const loadCategories = async () => {
  try {
    const res = await axios.get('/api/analytics/protocols/categories/summary')
    categories.value = res.data
  } catch (e) {
    console.error('Failed to load categories:', e)
  }
}

const loadTrending = async () => {
  try {
    const res = await axios.get('/api/analytics/protocols/trending/protocols')
    trending.value = res.data
  } catch (e) {
    console.error('Failed to load trending:', e)
  }
}

const loadRiskData = async () => {
  try {
    const res = await axios.get('/api/analytics/protocols/risk/assessment')
    riskData.value = res.data
  } catch (e) {
    console.error('Failed to load risk data:', e)
  }
}

const loadYieldOpportunities = async () => {
  try {
    const res = await axios.get('/api/analytics/protocols/opportunities/yield')
    yieldOpportunities.value = res.data.opportunities
  } catch (e) {
    console.error('Failed to load yield opportunities:', e)
  }
}

const viewDetails = (protocol: Protocol) => {
  selectedProtocol.value = protocol
  detailsVisible.value = true
}

onMounted(() => {
  loadOverview()
  loadProtocols()
  loadChains()
  loadCategories()
  loadTrending()
  loadRiskData()
  loadYieldOpportunities()
})
</script>

<style scoped>
.cross-chain-protocol-analytics {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header p {
  margin: 0;
  color: #909399;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-change {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.filter-card {
  margin-bottom: 20px;
}

.analytics-tabs {
  margin-top: 20px;
}

.protocol-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change {
  font-size: 12px;
}

.change.positive {
  color: #67c23a;
}

.change.negative {
  color: #f56c6c;
}

.apy {
  font-weight: bold;
  color: #409eff;
}

.chain-card {
  margin-bottom: 20px;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chain-name {
  text-transform: capitalize;
  font-weight: bold;
}

.chain-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-stat {
  display: flex;
  justify-content: space-between;
}

.chain-stat .label {
  color: #909399;
}

.chain-stat .value {
  font-weight: 500;
}

.category-card {
  text-align: center;
  margin-bottom: 20px;
}

.category-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 18px;
  font-weight: bold;
  text-transform: capitalize;
  margin-bottom: 4px;
}

.category-tvl {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.category-stats {
  font-size: 12px;
  color: #909399;
}

.trending-card {
  margin-bottom: 20px;
}

.trending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trending-change {
  font-size: 18px;
  font-weight: bold;
}

.trending-change.positive {
  color: #67c23a;
}

.trending-tvl {
  font-size: 14px;
  color: #909399;
}

.risk-factor {
  font-size: 12px;
  margin-bottom: 2px;
}

.factor-name {
  color: #909399;
}

.low-risk {
  color: #67c23a;
}

.medium-risk {
  color: #e6a23c;
}

.high-risk {
  color: #f56c6c;
}

.recommendations {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
}

.yield-card {
  margin-bottom: 20px;
}

.yield-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.yield-chain {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.yield-apy {
  font-size: 24px;
  font-weight: bold;
  color: #67c23a;
  margin-bottom: 4px;
}

.yield-tvl, .yield-roi {
  font-size: 12px;
  color: #909399;
}

.protocol-details {
  padding: 10px;
}
</style>
