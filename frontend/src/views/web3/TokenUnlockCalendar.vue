<template>
  <div class="token-unlock-calendar">
    <div class="header">
      <h1>📅 Token Unlock Calendar</h1>
      <p>Track upcoming token unlocks across multiple chains and protocols</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.totalUnlocks || 0 }}</div>
          <div class="stat-label">Total Unlocks</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.upcomingUnlocks || 0 }}</div>
          <div class="stat-label">Upcoming</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔗</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.chainDistribution?.length || 0 }}</div>
          <div class="stat-label">Chains</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats?.totalValueUpcoming || 0) }}</div>
          <div class="stat-label">Upcoming Value</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Chain</label>
        <select v-model="filters.chain" @change="fetchUnlocks">
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Category</label>
        <select v-model="filters.category" @change="fetchUnlocks">
          <option value="">All Categories</option>
          <option value="team">Team</option>
          <option value="investor">Investor</option>
          <option value="advisor">Advisor</option>
          <option value="community">Community</option>
          <option value="ecosystem">Ecosystem</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Time Range</label>
        <select v-model="filters.days" @change="fetchUpcoming">
          <option value="7">Next 7 Days</option>
          <option value="30">Next 30 Days</option>
          <option value="90">Next 90 Days</option>
          <option value="365">Next Year</option>
        </select>
      </div>
    </div>

    <!-- Unlocks Table -->
    <div class="table-container">
      <table class="unlocks-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Chain</th>
            <th>Protocol</th>
            <th>Category</th>
            <th>Unlock Date</th>
            <th>Amount</th>
            <th>Percentage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="unlock in unlocks" :key="unlock.id">
            <td>
              <div class="token-info">
                <span class="token-symbol">{{ unlock.tokenSymbol }}</span>
                <span class="token-name">{{ unlock.tokenName }}</span>
              </div>
            </td>
            <td>
              <span class="chain-badge" :class="unlock.chain.toLowerCase()">{{ unlock.chain }}</span>
            </td>
            <td>{{ unlock.protocol }}</td>
            <td>
              <span class="category-badge" :class="unlock.category">{{ unlock.category }}</span>
            </td>
            <td>{{ formatDate(unlock.unlockDate) }}</td>
            <td>{{ formatNumber(unlock.unlockAmount) }}</td>
            <td>{{ unlock.unlockPercentage }}%</td>
            <td>
              <span class="status-badge" :class="unlock.status">{{ unlock.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Distribution Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Chain Distribution</h3>
        <div class="distribution-list">
          <div v-for="item in stats?.chainDistribution" :key="item.chain" class="distribution-item">
            <span class="dist-label">{{ item.chain }}</span>
            <div class="dist-bar">
              <div class="dist-fill" :style="{ width: (item.count / stats.totalUnlocks * 100) + '%' }"></div>
            </div>
            <span class="dist-value">{{ item.count }}</span>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <h3>Category Distribution</h3>
        <div class="distribution-list">
          <div v-for="item in stats?.categoryDistribution" :key="item.category" class="distribution-item">
            <span class="dist-label">{{ item.category }}</span>
            <div class="dist-bar">
              <div class="dist-fill category" :style="{ width: (item.count / stats.totalUnlocks * 100) + '%' }"></div>
            </div>
            <span class="dist-value">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { get } from '~/utils'

interface TokenUnlock {
  id: string
  tokenName: string
  tokenSymbol: string
  chain: string
  protocol: string
  unlockDate: string
  unlockAmount: number
  unlockPercentage: number
  totalSupply: number
  category: string
  status: string
}

interface UnlockStats {
  totalUnlocks: number
  upcomingUnlocks: number
  totalValueUnlocked: number
  totalValueUpcoming: number
  chainDistribution: { chain: string; count: number }[]
  categoryDistribution: { category: string; count: number }[]
}

const unlocks = ref<TokenUnlock[]>([])
const stats = ref<UnlockStats | null>(null)
const chains = ref<string[]>([])
const filters = reactive({
  chain: '',
  category: '',
  days: '30'
})

const fetchUnlocks = async () => {
  const params = new URLSearchParams()
  if (filters.chain) params.append('chain', filters.chain)
  if (filters.category) params.append('category', filters.category)
  
  try {
    const data = await get<TokenUnlock[]>(`/api/token-unlock?${params.toString()}`)
    unlocks.value = data
  } catch (e) {
    console.error('Failed to fetch unlocks:', e)
  }
}

const fetchStats = async () => {
  try {
    const data = await get<UnlockStats>('/api/token-unlock/stats')
    stats.value = data
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  }
}

const fetchChains = async () => {
  try {
    const data = await get<string[]>('/api/token-unlock/chains')
    chains.value = data
  } catch (e) {
    console.error('Failed to fetch chains:', e)
  }
}

const fetchUpcoming = async () => {
  try {
    const data = await get<TokenUnlock[]>(`/api/token-unlock/upcoming?days=${filters.days}`)
    unlocks.value = data
  } catch (e) {
    console.error('Failed to fetch upcoming:', e)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

onMounted(async () => {
  await Promise.all([fetchUnlocks(), fetchStats(), fetchChains()])
})
</script>

<style scoped>
.token-unlock-calendar {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 24px;
}

.unlocks-table {
  width: 100%;
  border-collapse: collapse;
}

.unlocks-table th,
.unlocks-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.unlocks-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-symbol {
  font-weight: 700;
  font-size: 14px;
}

.token-name {
  font-size: 12px;
  color: #666;
}

.chain-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.chain-badge.ethereum { background: #e8f5e9; color: #2e7d32; }
.chain-badge.arbitrum { background: #e3f2fd; color: #1565c0; }
.chain-badge.optimism { background: #fce4ec; color: #c2185b; }
.chain-badge.polygon { background: #f3e5f5; color: #7b1fa2; }
.chain-badge.avalanche { background: #fff3e0; color: #e65100; }
.chain-badge.solana { background: #f1f8e9; color: #558b2f; }
.chain-badge.base { background: #e3f2fd; color: #0d47a1; }
.chain-badge.bsc { background: #fff8e1; color: #f57f17; }

.category-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  text-transform: capitalize;
}

.category-badge.team { background: #e3f2fd; color: #1565c0; }
.category-badge.investor { background: #fce4ec; color: #c2185b; }
.category-badge.advisor { background: #fff3e0; color: #e65100; }
.category-badge.community { background: #e8f5e9; color: #2e7d32; }
.category-badge.ecosystem { background: #f3e5f5; color: #7b1fa2; }

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  text-transform: capitalize;
}

.status-badge.upcoming { background: #e3f2fd; color: #1565c0; }
.status-badge.unlocked { background: #e8f5e9; color: #2e7d32; }
.status-badge.unlocking { background: #fff3e0; color: #e65100; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-label {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
}

.dist-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dist-fill.category {
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.dist-value {
  width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
}
</style>
