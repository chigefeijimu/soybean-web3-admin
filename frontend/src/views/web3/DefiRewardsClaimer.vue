<template>
  <div class="defi-rewards-claimer">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span>🎯 DeFi Rewards Claimer</span>
          <el-button type="primary" @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon>
            Refresh
          </el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Total Pending Value</div>
            <div class="stat-value success">${{ formatNumber(summary?.totalValue || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Total Rewards</div>
            <div class="stat-value">{{ formatNumber(summary?.totalPending || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Chains</div>
            <div class="stat-value">{{ summary?.chainCount || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Weighted APR</div>
            <div class="stat-value warning">{{ summary?.weightedApr || 0 }}%</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" class="mt-4">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>💰 Pending Rewards</span>
          </template>
          <el-input
            v-model="walletAddress"
            placeholder="Enter wallet address"
            class="mb-4"
            @keyup.enter="loadRewards"
          >
            <template #append>
              <el-button @click="loadRewards">Search</el-button>
            </template>
          </el-input>
          
          <el-table :data="rewards" style="width: 100%" v-if="rewards.length">
            <el-table-column prop="protocol" label="Protocol" width="120">
              <template #default="{ row }">
                <el-tag :type="getProtocolType(row.protocol)">{{ row.protocol }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="chain" label="Chain" width="100" />
            <el-table-column prop="rewardToken" label="Token" width="80" />
            <el-table-column prop="pendingRewards" label="Amount" width="120">
              <template #default="{ row }">
                {{ formatNumber(row.pendingRewards) }}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="Value" width="100">
              <template #default="{ row }">
                ${{ formatNumber(row.value) }}
              </template>
            </el-table-column>
            <el-table-column prop="apr" label="APR" width="80">
              <template #default="{ row }">
                <span :class="getAprClass(row.apr)">{{ row.apr }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="lastClaimed" label="Last Claimed">
              <template #default="{ row }">
                {{ formatDate(row.lastClaimed) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="Enter a wallet address to view pending rewards" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-4">
          <template #header>
            <span>⛽ Claim Recommendation</span>
          </template>
          <div v-if="summary?.recommendation" class="recommendation">
            <el-icon color="#67C23A"><InfoFilled /></el-icon>
            <p>{{ summary.recommendation }}</p>
          </div>
          <div class="gas-estimate" v-if="summary?.gasEstimate">
            <div>Estimated Gas: <strong>{{ formatNumber(summary.gasEstimate) }}</strong></div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <span>📊 Chain Distribution</span>
          </template>
          <div v-if="summary?.chains?.length">
            <div v-for="chain in summary.chains" :key="chain.chain" class="chain-item">
              <span class="chain-name">{{ chain.chain }}</span>
              <span class="chain-value">${{ formatNumber(chain.totalValue) }}</span>
              <el-progress :percentage="Math.round((chain.totalValue / (summary?.totalValue || 1)) * 100)" />
            </div>
          </div>
          <el-empty v-else description="No data available" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-4">
      <template #header>
        <div class="card-header">
          <span>🚀 Best Claim Opportunities</span>
          <el-select v-model="filterChain" placeholder="Filter by chain" clearable size="small">
            <el-option label="All Chains" value="" />
            <el-option label="Ethereum" value="ethereum" />
            <el-option label="Polygon" value="polygon" />
            <el-option label="Arbitrum" value="arbitrum" />
            <el-option label="Optimism" value="optimism" />
          </el-select>
        </div>
      </template>
      <el-table :data="filteredOpportunities" style="width: 100%">
        <el-table-column prop="protocol" label="Protocol" width="120">
          <template #default="{ row }">
            <el-tag :type="getProtocolType(row.protocol)">{{ row.protocol }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chain" label="Chain" width="100" />
        <el-table-column prop="rewardToken" label="Token" width="80" />
        <el-table-column prop="pendingRewards" label="Amount" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.pendingRewards) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="Value" width="100">
          <template #default="{ row }">
            ${{ formatNumber(row.value) }}
          </template>
        </el-table-column>
        <el-table-column prop="netValue" label="Net Value" width="100">
          <template #default="{ row }">
            <span :class="row.netValue > 0 ? 'text-success' : 'text-danger'">
              ${{ formatNumber(row.netValue) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="roi" label="ROI" width="100">
          <template #default="{ row }">
            <span :class="row.roi > 100 ? 'text-success' : ''">{{ row.roi }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="mt-4">
      <template #header>
        <span>📜 Claim History</span>
      </template>
      <el-table :data="claimHistory" style="width: 100%" v-if="claimHistory.length">
        <el-table-column prop="date" label="Date" width="180">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="Protocol" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.protocol }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chain" label="Chain" width="100" />
        <el-table-column prop="token" label="Token" width="80" />
        <el-table-column prop="amount" label="Amount" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="Value" width="100">
          <template #default="{ row }">
            ${{ formatNumber(row.value) }}
          </template>
        </el-table-column>
        <el-table-column prop="gasPaid" label="Gas Paid" width="100">
          <template #default="{ row }">
            {{ row.gasPaid }} ETH
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="No claim history available" />
    </el-card>

    <el-card class="mt-4">
      <template #header>
        <span>🌍 Global DeFi Rewards Statistics</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Total Pending Value</div>
            <div class="stat-value">${{ formatNumber(globalStats?.totalPendingValue || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Active Claimers</div>
            <div class="stat-value">{{ formatNumber(globalStats?.activeClaimers || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Total Claimed (24h)</div>
            <div class="stat-value success">${{ formatNumber(globalStats?.totalClaimed24h || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">Average APR</div>
            <div class="stat-value">{{ globalStats?.averageApr || 0 }}%</div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-4">
        <el-col :span="12">
          <h4>Top Protocols</h4>
          <el-table :data="globalStats?.topProtocols || []" style="width: 100%">
            <el-table-column prop="protocol" label="Protocol" />
            <el-table-column prop="pendingValue" label="Pending Value">
              <template #default="{ row }">
                ${{ formatNumber(row.pendingValue) }}
              </template>
            </el-table-column>
            <el-table-column prop="claimers" label="Claimers">
              <template #default="{ row }">
                {{ formatNumber(row.claimers) }}
              </template>
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="12">
          <h4>Top Chains</h4>
          <el-table :data="globalStats?.topChains || []" style="width: 100%">
            <el-table-column prop="chain" label="Chain" />
            <el-table-column prop="pendingValue" label="Pending Value">
              <template #default="{ row }">
                ${{ formatNumber(row.pendingValue) }}
              </template>
            </el-table-column>
            <el-table-column prop="share" label="Share">
              <template #default="{ row }">
                {{ row.share }}%
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, InfoFilled } from '@element-plus/icons-vue'
import { defiRewardsApi } from '@/service/api'

const loading = ref(false)
const walletAddress = ref('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9')
const rewards = ref<any[]>([])
const summary = ref<any>(null)
const opportunities = ref<any[]>([])
const claimHistory = ref<any[]>([])
const globalStats = ref<any>(null)
const filterChain = ref('')

const filteredOpportunities = computed(() => {
  if (!filterChain.value) return opportunities.value
  return opportunities.value.filter(o => o.chain === filterChain.value)
})

const formatNumber = (num: number) => {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getProtocolType = (protocol: string) => {
  const types: Record<string, string> = {
    'Aave': 'success',
    'Compound': 'warning',
    'Yearn': 'danger',
    'Uniswap': 'primary',
    'Curve': 'info',
    'Lido': 'success',
    'QuickSwap': 'warning',
    'GMX': 'danger'
  }
  return types[protocol] || ''
}

const getAprClass = (apr: number) => {
  if (apr >= 10) return 'text-success'
  if (apr >= 5) return 'text-warning'
  return ''
}

const loadRewards = async () => {
  if (!walletAddress.value) {
    ElMessage.warning('Please enter a wallet address')
    return
  }
  loading.value = true
  try {
    const [rewardsRes, summaryRes, historyRes] = await Promise.all([
      defiRewardsApi.getPendingRewards(walletAddress.value),
      defiRewardsApi.getRewardsSummary(walletAddress.value),
      defiRewardsApi.getClaimHistory(walletAddress.value)
    ])
    rewards.value = rewardsRes.rewards || []
    summary.value = summaryRes
    claimHistory.value = historyRes.history || []
  } catch (error) {
    console.error('Failed to load rewards:', error)
    ElMessage.error('Failed to load rewards data')
  } finally {
    loading.value = false
  }
}

const loadOpportunities = async () => {
  try {
    const res = await defiRewardsApi.getYieldOpportunities({ minValue: '10' })
    opportunities.value = res.opportunities || []
  } catch (error) {
    console.error('Failed to load opportunities:', error)
  }
}

const loadGlobalStats = async () => {
  try {
    const res = await defiRewardsApi.getGlobalStats()
    globalStats.value = res
  } catch (error) {
    console.error('Failed to load global stats:', error)
  }
}

const refreshData = async () => {
  await Promise.all([loadRewards(), loadOpportunities(), loadGlobalStats()])
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.defi-rewards-claimer {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
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

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.recommendation {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: 15px;
}

.recommendation p {
  margin: 0;
  color: #67c23a;
}

.gas-estimate {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.chain-item {
  margin-bottom: 15px;
}

.chain-name {
  display: inline-block;
  width: 100px;
  font-weight: 500;
}

.chain-value {
  display: inline-block;
  width: 100px;
  text-align: right;
  margin-right: 10px;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

h4 {
  margin: 0 0 15px 0;
  color: #303133;
}
</style>
