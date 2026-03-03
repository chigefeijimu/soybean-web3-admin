<template>
  <div class="smart-money-alert">
    <div class="header">
      <h2>🐋 Smart Money Alert - 聪明钱警报</h2>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="">全部链</option>
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
          <option value="bsc">BSC</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- Market Overview -->
    <div class="overview-cards" v-if="marketOverview">
      <div class="overview-card">
        <div class="card-title">🐋 Top Whales</div>
        <div class="card-value">{{ marketOverview.topWhales.length }}</div>
        <div class="card-subtitle">监控中</div>
      </div>
      <div class="overview-card">
        <div class="card-title">📊 Categories</div>
        <div class="card-value">{{ marketOverview.categories.length }}</div>
        <div class="card-subtitle">类型分布</div>
      </div>
      <div class="overview-card">
        <div class="card-title">⛓️ Chains</div>
        <div class="card-value">{{ marketOverview.chains.length }}</div>
        <div class="card-subtitle">支持链</div>
      </div>
      <div class="overview-card">
        <div class="card-title">🔔 My Alerts</div>
        <div class="card-value">{{ myAlerts.length }}</div>
        <div class="card-subtitle">已创建</div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <input 
        v-model="searchQuery" 
        placeholder="搜索钱包地址或标签..." 
        class="search-input"
        @input="debouncedSearch"
      />
      <div class="search-filters">
        <select v-model="filterCategory" class="filter-select">
          <option value="">全部类型</option>
          <option value="whale">Whale</option>
          <option value="trader">Trader</option>
          <option value="degen">Degen</option>
          <option value="institution">机构</option>
        </select>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="search-results">
      <h3>🔍 搜索结果</h3>
      <div class="wallet-grid">
        <div 
          v-for="wallet in searchResults" 
          :key="wallet.address" 
          class="wallet-card"
          @click="selectWallet(wallet)"
        >
          <div class="wallet-header">
            <span class="wallet-label">{{ wallet.label }}</span>
            <span class="wallet-category" :class="wallet.category">{{ wallet.category }}</span>
            <span v-if="wallet.verified" class="verified-badge">✓</span>
          </div>
          <div class="wallet-address">{{ formatAddress(wallet.address) }}</div>
          <div class="wallet-stats">
            <span class="stat">Volume: ${{ formatNumber(wallet.totalVolume) }}</span>
            <span class="stat">Followers: {{ formatNumber(wallet.followerCount) }}</span>
          </div>
          <div class="wallet-chains">
            <span v-for="chain in wallet.chains" :key="chain" class="chain-tag">
              {{ chain }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Popular Wallets Tab -->
      <div v-if="activeTab === 'popular'" class="popular-section">
        <h3>🔥 Popular Smart Money</h3>
        <div class="wallet-grid">
          <div 
            v-for="wallet in popularWallets" 
            :key="wallet.address" 
            class="wallet-card"
            @click="selectWallet(wallet)"
          >
            <div class="wallet-header">
              <span class="wallet-label">{{ wallet.label }}</span>
              <span class="wallet-category" :class="wallet.category">{{ wallet.category }}</span>
              <span v-if="wallet.verified" class="verified-badge">✓</span>
            </div>
            <div class="wallet-address">{{ formatAddress(wallet.address) }}</div>
            <div class="wallet-stats">
              <span class="stat">Volume: ${{ formatNumber(wallet.totalVolume) }}</span>
              <span class="stat">Risk: {{ wallet.riskScore }}</span>
            </div>
            <div class="wallet-chains">
              <span v-for="chain in wallet.chains" :key="chain" class="chain-tag">
                {{ chain }}
              </span>
            </div>
            <div class="wallet-actions">
              <button @click.stop="createAlertForWallet(wallet)" class="btn-alert">
                🔔 创建警报
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- My Alerts Tab -->
      <div v-if="activeTab === 'alerts'" class="alerts-section">
        <h3>🔔 我的警报</h3>
        <div v-if="myAlerts.length === 0" class="empty-state">
          <p>还没有创建任何警报</p>
          <p class="hint">从Popular Wallets选择钱包创建警报</p>
        </div>
        <div v-else class="alerts-list">
          <div 
            v-for="alert in myAlerts" 
            :key="alert.id" 
            class="alert-card"
          >
            <div class="alert-header">
              <span class="alert-wallet">{{ alert.walletLabel || formatAddress(alert.walletAddress) }}</span>
              <span class="alert-status" :class="{ enabled: alert.enabled, disabled: !alert.enabled }">
                {{ alert.enabled ? '启用' : '禁用' }}
              </span>
            </div>
            <div class="alert-details">
              <span class="detail">Chain: {{ alert.chain }}</span>
              <span class="detail">Type: {{ alert.alertType }}</span>
              <span class="detail">Triggered: {{ alert.triggeredCount }} times</span>
            </div>
            <div class="alert-actions">
              <button @click="toggleAlert(alert)" class="btn-toggle">
                {{ alert.enabled ? '禁用' : '启用' }}
              </button>
              <button @click="deleteAlert(alert.id)" class="btn-delete">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet Details Tab -->
      <div v-if="activeTab === 'details' && selectedWallet" class="details-section">
        <div class="details-header">
          <h3>📊 {{ selectedWallet.label }}</h3>
          <button @click="selectedWallet = null" class="btn-close">✕</button>
        </div>
        
        <div class="details-grid">
          <div class="detail-card">
            <div class="detail-label">Address</div>
            <div class="detail-value">{{ selectedWallet.address }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Category</div>
            <div class="detail-value">{{ selectedWallet.category }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Total Volume</div>
            <div class="detail-value">${{ formatNumber(selectedWallet.totalVolume) }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Risk Score</div>
            <div class="detail-value" :class="getRiskClass(selectedWallet.riskScore)">
              {{ selectedWallet.riskScore }}
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Followers</div>
            <div class="detail-value">{{ formatNumber(selectedWallet.followerCount) }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Verified</div>
            <div class="detail-value">{{ selectedWallet.verified ? '✓ Yes' : 'No' }}</div>
          </div>
        </div>

        <div class="chains-section">
          <h4>⛓️ Supported Chains</h4>
          <div class="chains-list">
            <span v-for="chain in selectedWallet.chains" :key="chain" class="chain-tag large">
              {{ chain }}
            </span>
          </div>
        </div>

        <div class="activity-section">
          <h4>📈 Recent Activity</h4>
          <div v-if="walletActivity.length === 0" class="empty-state">
            <p>No recent activity</p>
          </div>
          <div v-else class="activity-list">
            <div 
              v-for="activity in walletActivity" 
              :key="activity.id" 
              class="activity-item"
            >
              <span class="activity-type" :class="activity.type">{{ activity.type }}</span>
              <span class="activity-token">{{ activity.token }}</span>
              <span class="activity-amount">${{ formatNumber(activity.usdValue) }}</span>
              <span class="activity-chain">{{ activity.chain }}</span>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
        </div>

        <div class="create-alert-section">
          <h4>🔔 Create Alert for this Wallet</h4>
          <div class="alert-form">
            <select v-model="newAlert.chain" class="form-select">
              <option value="">选择链</option>
              <option v-for="chain in selectedWallet.chains" :key="chain" :value="chain">
                {{ chain }}
              </option>
            </select>
            <select v-model="newAlert.alertType" class="form-select">
              <option value="any_activity">任何活动</option>
              <option value="large_transfer">大额转账</option>
              <option value="defi_interaction">DeFi交互</option>
              <option value="nft_activity">NFT活动</option>
              <option value="token_buy">代币购买</option>
              <option value="token_sell">代币出售</option>
            </select>
            <input 
              v-model="newAlert.threshold" 
              type="number" 
              placeholder="Threshold (optional)"
              class="form-input"
            />
            <input 
              v-model="newAlert.webhookUrl" 
              type="text" 
              placeholder="Webhook URL (optional)"
              class="form-input"
            />
            <button @click="submitAlert" class="btn-submit">
              创建警报
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const API_BASE = 'http://localhost:3018'

const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const filterCategory = ref('')
const selectedChain = ref('')
const activeTab = ref('popular')
const marketOverview = ref(null)
const popularWallets = ref([])
const myAlerts = ref([])
const selectedWallet = ref(null)
const walletActivity = ref([])

const newAlert = ref({
  chain: '',
  alertType: 'any_activity',
  threshold: null,
  webhookUrl: ''
})

const tabs = [
  { id: 'popular', label: '🔥 Popular' },
  { id: 'alerts', label: '🔔 My Alerts' },
  { id: 'details', label: '📊 Details' }
]

let searchTimeout = null

const formatAddress = (addr) => {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

const getRiskClass = (score) => {
  if (score < 20) return 'risk-low'
  if (score < 50) return 'risk-medium'
  return 'risk-high'
}

const fetchMarketOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/web3/smart-money-alert/market-overview`)
    const data = await res.json()
    marketOverview.value = data
  } catch (e) {
    console.error('Failed to fetch market overview:', e)
  }
}

const fetchPopularWallets = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/web3/smart-money-alert/wallets/popular?limit=20`)
    const data = await res.json()
    popularWallets.value = data
  } catch (e) {
    console.error('Failed to fetch popular wallets:', e)
  }
}

const fetchMyAlerts = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/web3/smart-money-alert/alerts/user/user_001`)
    const data = await res.json()
    myAlerts.value = data
  } catch (e) {
    console.error('Failed to fetch alerts:', e)
  }
}

const searchWallets = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  try {
    const res = await fetch(`${API_BASE}/api/web3/smart-money-alert/wallets/search?q=${encodeURIComponent(searchQuery.value)}&limit=10`)
    const data = await res.json()
    searchResults.value = data
  } catch (e) {
    console.error('Failed to search wallets:', e)
  }
}

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchWallets, 300)
}

const refreshData = async () => {
  loading.value = true
  await Promise.all([
    fetchMarketOverview(),
    fetchPopularWallets(),
    fetchMyAlerts()
  ])
  loading.value = false
}

const selectWallet = async (wallet) => {
  selectedWallet.value = wallet
  activeTab.value = 'details'
  newAlert.value.chain = wallet.chains[0] || ''
  
  // Fetch wallet activity
  try {
    const res = await fetch(`${API_BASE}/api/web3/smart-money-alert/wallets/${wallet.address}/activity?limit=10`)
    const data = await res.json()
    walletActivity.value = data.activities
  } catch (e) {
    console.error('Failed to fetch wallet activity:', e)
    walletActivity.value = []
  }
}

const createAlertForWallet = (wallet) => {
  selectWallet(wallet)
}

const submitAlert = async () => {
  if (!selectedWallet.value || !newAlert.value.chain) {
    alert('请选择链')
    return
  }
  
  try {
    await fetch(`${API_BASE}/api/web3/smart-money-alert/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_001',
        walletAddress: selectedWallet.value.address,
        chain: newAlert.value.chain,
        alertType: newAlert.value.alertType,
        threshold: newAlert.value.threshold || undefined,
        webhookUrl: newAlert.value.webhookUrl || undefined
      })
    })
    alert('警报创建成功!')
    await fetchMyAlerts()
    activeTab.value = 'alerts'
  } catch (e) {
    console.error('Failed to create alert:', e)
    alert('创建失败')
  }
}

const toggleAlert = async (alert) => {
  try {
    await fetch(`${API_BASE}/api/web3/smart-money-alert/alerts/${alert.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !alert.enabled })
    })
    await fetchMyAlerts()
  } catch (e) {
    console.error('Failed to toggle alert:', e)
  }
}

const deleteAlert = async (alertId) => {
  if (!confirm('确定要删除这个警报吗?')) return
  try {
    await fetch(`${API_BASE}/api/web3/smart-money-alert/alerts/${alertId}`, { method: 'DELETE' })
    await fetchMyAlerts()
  } catch (e) {
    console.error('Failed to delete alert:', e)
  }
}

watch([filterCategory, selectedChain], () => {
  // Apply filters
})

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.smart-money-alert {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.chain-select, .filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.btn-refresh {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-refresh:disabled {
  opacity: 0.5;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.overview-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.overview-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.overview-card:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-title {
  font-size: 14px;
  opacity: 0.9;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
}

.card-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

.search-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-results {
  margin-bottom: 20px;
}

.search-results h3 {
  margin-bottom: 12px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab.active {
  border-bottom-color: #4f46e5;
  color: #4f46e5;
  font-weight: bold;
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.wallet-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.wallet-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
}

.wallet-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.wallet-label {
  font-weight: bold;
  font-size: 16px;
}

.wallet-category {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #e5e7eb;
}

.wallet-category.whale { background: #dbeafe; color: #1d4ed8; }
.wallet-category.trader { background: #dcfce7; color: #16a34a; }
.wallet-category.degen { background: #fef3c7; color: #d97706; }
.wallet-category.institution { background: #f3e8ff; color: #9333ea; }

.verified-badge {
  color: #4f46e5;
  font-weight: bold;
}

.wallet-address {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.wallet-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.wallet-chains {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chain-tag {
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  color: #4b5563;
}

.chain-tag.large {
  padding: 4px 12px;
  font-size: 13px;
}

.wallet-actions {
  margin-top: 12px;
}

.btn-alert {
  width: 100%;
  padding: 8px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alert-wallet {
  font-weight: bold;
  font-size: 16px;
}

.alert-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.alert-status.enabled {
  background: #dcfce7;
  color: #16a34a;
}

.alert-status.disabled {
  background: #f3f4f6;
  color: #6b7280;
}

.alert-details {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.btn-toggle, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-toggle {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.detail-card {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.detail-value.risk-low { color: #16a34a; }
.detail-value.risk-medium { color: #d97706; }
.detail-value.risk-high { color: #dc2626; }

.chains-section, .activity-section, .create-alert-section {
  margin-bottom: 20px;
}

.chains-section h4, .activity-section h4, .create-alert-section h4 {
  margin-bottom: 12px;
}

.chains-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.activity-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: #e5e7eb;
}

.activity-type.transfer { background: #dbeafe; color: #1d4ed8; }
.activity-type.swap { background: #dcfce7; color: #16a34a; }
.activity-type.defi_interaction { background: #f3e8ff; color: #9333ea; }

.activity-token {
  font-weight: 500;
}

.activity-amount {
  color: #16a34a;
}

.activity-chain {
  color: #6b7280;
}

.activity-time {
  margin-left: auto;
  color: #9ca3af;
  font-size: 12px;
}

.alert-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form-select, .form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-input {
  flex: 1;
  min-width: 200px;
}

.btn-submit {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.hint {
  font-size: 13px;
  color: #9ca3af;
}
</style>
