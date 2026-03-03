<template>
  <div class="staking-rewards-tracker">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <span class="title">⛓️ Cross-chain Staking Rewards Tracker</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="24">
          <el-input
            v-model="address"
            placeholder="Enter wallet address to track staking rewards"
            class="address-input"
            @keyup.enter="fetchData"
          >
            <template #prepend>
              <el-select v-model="selectedChain" placeholder="All Chains" style="width: 140px">
                <el-option label="All Chains" value="" />
                <el-option v-for="chain in chains" :key="chain" :label="chain" :value="chain" />
              </el-select>
            </template>
            <template #append>
              <el-button :icon="Search" @click="fetchData">Search</el-button>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- Overview Stats -->
    <el-row :gutter="20" class="stats-row" v-if="overview">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">${{ formatNumber(overview.totalValueUsd) }}</div>
          <div class="stat-label">Total Staked Value</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">${{ formatNumber(overview.totalRewardsUsd) }}</div>
          <div class="stat-label">Total Rewards</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ overview.averageApy.toFixed(2) }}%</div>
          <div class="stat-label">Average APY</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ overview.positionCount }}</div>
          <div class="stat-label">Active Positions</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Distribution Charts -->
    <el-row :gutter="20" v-if="overview">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>📊 Distribution by Chain</span>
          </template>
          <div v-for="(data, chain) in overview.byChain" :key="chain" class="distribution-item">
            <span class="chain-name">{{ chain }}</span>
            <span class="chain-value">${{ formatNumber(data.valueUsd) }}</span>
            <el-progress :percentage="(data.valueUsd / overview.totalValueUsd * 100)" :stroke-width="8" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>🏦 Distribution by Protocol</span>
          </template>
          <div v-for="(data, protocol) in overview.byProtocol" :key="protocol" class="distribution-item">
            <span class="protocol-name">{{ protocol }}</span>
            <span class="protocol-value">${{ formatNumber(data.valueUsd) }}</span>
            <el-progress :percentage="(data.valueUsd / overview.totalValueUsd * 100)" :stroke-width="8" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>📈 Distribution by Category</span>
          </template>
          <div v-for="(data, category) in overview.byCategory" :key="category" class="distribution-item">
            <span class="category-name">{{ category }}</span>
            <span class="category-value">${{ formatNumber(data.valueUsd) }}</span>
            <el-progress :percentage="(data.valueUsd / overview.totalValueUsd * 100)" :stroke-width="8" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Staking Positions -->
    <el-card shadow="hover" v-if="positions.length > 0">
      <template #header>
        <div class="card-header">
          <span>💰 Your Staking Positions</span>
          <el-button type="primary" size="small" @click="showCalculator = true">Calculator</el-button>
        </div>
      </template>
      
      <el-table :data="positions" stripe>
        <el-table-column prop="protocol" label="Protocol" width="150" />
        <el-table-column prop="chain" label="Chain" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.chain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="token" label="Token" width="100" />
        <el-table-column prop="stakedAmount" label="Staked" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.stakedAmount) }} {{ row.token }}
          </template>
        </el-table-column>
        <el-table-column prop="valueUsd" label="Value (USD)" width="130">
          <template #default="{ row }">
            ${{ formatNumber(row.valueUsd) }}
          </template>
        </el-table-column>
        <el-table-column prop="rewardsUsd" label="Rewards" width="130">
          <template #default="{ row }">
            <span style="color: #67c23a">+${{ formatNumber(row.rewardsUsd) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="apy" label="APY" width="100">
          <template #default="{ row }">
            <el-tag :type="row.apy > 8 ? 'success' : row.apy > 4 ? 'warning' : 'info'">
              {{ row.apy.toFixed(2) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Top Staking Pools -->
    <el-card shadow="hover" class="pools-card">
      <template #header>
        <div class="card-header">
          <span>🔥 Top Staking Pools</span>
          <el-select v-model="poolChain" placeholder="All Chains" size="small" style="width: 120px" @change="fetchTopPools">
            <el-option label="All Chains" value="" />
            <el-option v-for="chain in chains" :key="chain" :label="chain" :value="chain" />
          </el-select>
        </div>
      </template>
      
      <el-table :data="topPools" stripe>
        <el-table-column prop="protocol" label="Protocol" width="150" />
        <el-table-column prop="chain" label="Chain" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.chain }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="token" label="Token" width="100" />
        <el-table-column prop="category" label="Category" width="130" />
        <el-table-column prop="tvl" label="TVL" width="140">
          <template #default="{ row }">
            ${{ formatNumber(row.tvl) }}
          </template>
        </el-table-column>
        <el-table-column prop="apy" label="APY" width="100">
          <template #default="{ row }">
            <el-tag :type="row.apy > 10 ? 'success' : row.apy > 6 ? 'warning' : 'info'">
              {{ row.apy.toFixed(2) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="minStake" label="Min Stake" width="100">
          <template #default="{ row }">
            {{ row.minStake }}
          </template>
        </el-table-column>
        <el-table-column prop="risk" label="Risk" width="100">
          <template #default="{ row }">
            <el-tag :type="row.risk === 'low' ? 'success' : row.risk === 'medium' ? 'warning' : 'danger'">
              {{ row.risk }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Rewards History Chart -->
    <el-card shadow="hover" v-if="rewardsHistory.length > 0">
      <template #header>
        <span>📈 Rewards History (Last 30 Days)</span>
      </template>
      <div class="chart-container">
        <div v-for="(day, index) in groupedHistory" :key="index" class="history-day">
          <span class="date">{{ day.date }}</span>
          <span class="total">${{ formatNumber(day.total) }}</span>
        </div>
      </div>
    </el-card>

    <!-- Calculator Dialog -->
    <el-dialog v-model="showCalculator" title="Staking Rewards Calculator" width="500px">
      <el-form :model="calculatorForm" label-width="100px">
        <el-form-item label="Protocol">
          <el-select v-model="calculatorForm.protocol" placeholder="Select Protocol">
            <el-option v-for="p in protocols" :key="p.name" :label="p.name" :value="p.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="Chain">
          <el-select v-model="calculatorForm.chain" placeholder="Select Chain">
            <el-option v-for="chain in chains" :key="chain" :label="chain" :value="chain" />
          </el-select>
        </el-form-item>
        <el-form-item label="Amount">
          <el-input-number v-model="calculatorForm.amount" :min="0" :step="100" />
        </el-form-item>
        <el-form-item label="Duration (days)">
          <el-input-number v-model="calculatorForm.duration" :min="1" :max="365" :step="30" />
        </el-form-item>
        <el-button type="primary" @click="calculateRewards">Calculate</el-button>
      </el-form>
      
      <div v-if="calculatorResult" class="calculator-result">
        <el-divider />
        <h4>Results:</h4>
        <p>APY: {{ calculatorResult.apy.toFixed(2) }}%</p>
        <p>Simple Rewards: {{ calculatorResult.simpleRewards.toFixed(4) }}</p>
        <p>Compound Rewards: {{ calculatorResult.compoundRewards.toFixed(4) }}</p>
        <p>Effective APY: {{ calculatorResult.effectiveApy.toFixed(2) }}%</p>
        <p>Est. Value: ${{ formatNumber(calculatorResult.estimatedValueUsd) }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { get, post } from '@/utils/request'

const address = ref('')
const selectedChain = ref('')
const poolChain = ref('')
const chains = ref<string[]>([])
const protocols = ref<any[]>([])
const overview = ref<any>(null)
const positions = ref<any[]>([])
const topPools = ref<any[]>([])
const rewardsHistory = ref<any[]>([])
const showCalculator = ref(false)

const calculatorForm = ref({
  protocol: '',
  chain: '',
  amount: 1000,
  duration: 30
})

const calculatorResult = ref<any>(null)

const groupedHistory = computed(() => {
  const grouped: Record<string, number> = {}
  for (const h of rewardsHistory.value) {
    if (!grouped[h.date]) grouped[h.date] = 0
    grouped[h.date] += h.valueUsd
  }
  return Object.entries(grouped)
    .map(([date, total]) => ({ date, total }))
    .slice(0, 30)
})

onMounted(async () => {
  await fetchChains()
  await fetchProtocols()
  await fetchTopPools()
})

async function fetchChains() {
  try {
    const data = await get('/web3/staking-rewards-tracker/chains')
    chains.value = data
  } catch (e) {
    console.error(e)
  }
}

async function fetchProtocols() {
  try {
    const data = await get('/web3/staking-rewards-tracker/protocols')
    protocols.value = data.protocols
  } catch (e) {
    console.error(e)
  }
}

async function fetchTopPools() {
  try {
    const data = await get(`/web3/staking-rewards-tracker/top-pools?chain=${poolChain.value}&limit=15`)
    topPools.value = data
  } catch (e) {
    console.error(e)
  }
}

async function fetchData() {
  if (!address.value) {
    ElMessage.warning('Please enter a wallet address')
    return
  }
  
  try {
    const [overviewData, positionsData, historyData] = await Promise.all([
      get(`/web3/staking-rewards-tracker/overview?address=${address.value}`),
      get(`/web3/staking-rewards-tracker/positions?address=${address.value}&chain=${selectedChain.value}`),
      get(`/web3/staking-rewards-tracker/history?address=${address.value}&chain=${selectedChain.value}&days=30`)
    ])
    
    overview.value = overviewData
    positions.value = positionsData
    rewardsHistory.value = historyData
    
    ElMessage.success('Data loaded successfully')
  } catch (e) {
    ElMessage.error('Failed to fetch data')
  }
}

async function calculateRewards() {
  if (!calculatorForm.value.protocol || !calculatorForm.value.chain) {
    ElMessage.warning('Please select protocol and chain')
    return
  }
  
  try {
    const data = await post('/web3/staking-rewards-tracker/calculate', calculatorForm.value)
    calculatorResult.value = data
  } catch (e) {
    ElMessage.error('Calculation failed')
  }
}

function formatNumber(num: number): string {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(2)
}
</script>

<style scoped>
.staking-rewards-tracker {
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

.title {
  font-size: 18px;
  font-weight: 600;
}

.address-input {
  max-width: 600px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.distribution-item {
  margin-bottom: 16px;
}

.chain-name,
.protocol-name,
.category-name {
  display: inline-block;
  width: 120px;
  font-weight: 500;
}

.chain-value,
.protocol-value,
.category-value {
  display: inline-block;
  width: 100px;
  text-align: right;
  margin-right: 10px;
}

.pools-card {
  margin-top: 20px;
}

.chart-container {
  max-height: 300px;
  overflow-y: auto;
}

.history-day {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.date {
  color: #606266;
}

.total {
  font-weight: 600;
  color: #67c23a;
}

.calculator-result {
  margin-top: 20px;
}

.calculator-result p {
  margin: 8px 0;
}
</style>
