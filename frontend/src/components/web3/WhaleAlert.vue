<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  getWhaleAlertsConfig, 
  createWhaleAlert, 
  updateWhaleAlert, 
  deleteWhaleAlert,
  getKnownWhales,
  getWhaleAlertTransactions,
  getWhaleAlertNotifications,
  markAlertNotificationRead,
  getWhaleAlertStats,
  checkWhaleMovements,
  type WhaleAlertConfig,
  type WhaleAlertTransaction,
  type WhaleAlertNotification,
  type WhaleAlertStats
} from '@/service/api/web3'

// State
const activeTab = ref<'alerts' | 'transactions' | 'whales' | 'stats'>('alerts')
const alerts = ref<WhaleAlertConfig[]>([])
const knownWhales = ref<Array<{ address: string; label: string; category: string }>>([])
const transactions = ref<WhaleAlertTransaction[]>([])
const notifications = ref<WhaleAlertNotification[]>([])
const stats = ref<WhaleAlertStats | null>(null)
const loading = ref(true)
const error = ref('')

// Modal state
const showAlertModal = ref(false)
const editingAlert = ref<WhaleAlertConfig | null>(null)
const formData = ref({
  address: '',
  label: '',
  chain: 'ethereum',
  threshold: 10,
  alertType: 'any' as 'above' | 'below' | 'any',
  notifyEmail: true,
  notifyTelegram: false,
  isActive: true
})

// Chains
const chains = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  { id: 'base', name: 'Base', symbol: 'ETH' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' }
]

// Alert types
const alertTypes = [
  { value: 'any', label: 'Any Movement' },
  { value: 'above', label: 'Above Threshold' },
  { value: 'below', label: 'Below Threshold' }
]

// Category colors
const categoryColors: Record<string, string> = {
  founder: '#F59E0B',
  cex: '#3B82F6',
  'market-maker': '#8B5CF6',
  defi: '#10B981',
  dao: '#EC4899',
  custom: '#6B7280'
}

// Fetch all data
const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [alertsData, whalesData, txsData, notifsData, statsData] = await Promise.all([
      getWhaleAlertsConfig(),
      getKnownWhales(),
      getWhaleAlertTransactions('ethereum', 10000, 50),
      getWhaleAlertNotifications(),
      getWhaleAlertStats()
    ])
    alerts.value = alertsData
    knownWhales.value = whalesData
    transactions.value = txsData
    notifications.value = notifsData
    stats.value = statsData
  } catch (e: any) {
    console.error('Failed to fetch whale alert data:', e)
    error.value = e.message || 'Failed to fetch data'
    // Use mock data as fallback
    loadMockData()
  } finally {
    loading.value = false
  }
}

// Load mock data for fallback
const loadMockData = () => {
  alerts.value = [
    {
      id: '1',
      address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      label: 'Vitalik Buterin',
      chain: 'ethereum',
      threshold: 10,
      alertType: 'any',
      notifyEmail: true,
      notifyTelegram: false,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: '2',
      address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      label: 'Coinbase Cold',
      chain: 'ethereum',
      threshold: 100,
      alertType: 'above',
      notifyEmail: true,
      notifyTelegram: true,
      isActive: true,
      createdAt: new Date()
    }
  ]
  
  knownWhales.value = [
    { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', label: 'Vitalik Buterin', category: 'founder' },
    { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', label: 'Gavin Wood', category: 'founder' },
    { address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', label: 'Coinbase Cold', category: 'cex' },
    { address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', label: 'Binance Cold', category: 'cex' },
    { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Hot', category: 'cex' },
    { address: '0x0A5046079187B1A06bDCFe4C3e9E2E4E2a7f69b9', label: 'Wintermute', category: 'market-maker' }
  ]
  
  transactions.value = [
    { hash: '0x1234567890abcdef', from: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', to: '0x1234567890abcdef123456', amount: 100, token: 'ETH', chain: 'ethereum', timestamp: new Date(Date.now() - 1800000), valueUSD: 250000 },
    { hash: '0xabcdef1234567890', from: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', to: '0x9876543210fedcba987654', amount: 500, token: 'ETH', chain: 'ethereum', timestamp: new Date(Date.now() - 3600000), valueUSD: 1250000 },
    { hash: '0x9876543210fedcba', from: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', to: '0x111222333444555666777', amount: 250, token: 'ETH', chain: 'ethereum', timestamp: new Date(Date.now() - 7200000), valueUSD: 625000 }
  ]
  
  notifications.value = [
    { id: '1', alertId: '1', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', transaction: transactions.value[0], triggeredAt: new Date(), notified: false }
  ]
  
  stats.value = {
    totalAlerts: 2,
    activeAlerts: 2,
    totalNotifications: 1,
    unreadNotifications: 1,
    knownWhalesCount: 6
  }
}

// Format helpers
const formatAddress = (addr: string) => {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const formatValue = (value: number) => {
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M'
  if (value >= 1000) return '$' + (value / 1000).toFixed(2) + 'K'
  return '$' + value.toFixed(2)
}

const formatTime = (date: Date | string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Open modal for new/edit alert
const openAlertModal = (alert?: WhaleAlertConfig) => {
  if (alert) {
    editingAlert.value = alert
    formData.value = {
      address: alert.address,
      label: alert.label,
      chain: alert.chain,
      threshold: alert.threshold,
      alertType: alert.alertType,
      notifyEmail: alert.notifyEmail,
      notifyTelegram: alert.notifyTelegram,
      isActive: alert.isActive
    }
  } else {
    editingAlert.value = null
    formData.value = {
      address: '',
      label: '',
      chain: 'ethereum',
      threshold: 10,
      alertType: 'any',
      notifyEmail: true,
      notifyTelegram: false,
      isActive: true
    }
  }
  showAlertModal.value = true
}

// Save alert
const saveAlert = async () => {
  try {
    if (editingAlert.value) {
      const updated = await updateWhaleAlert(editingAlert.value.id, formData.value)
      const index = alerts.value.findIndex(a => a.id === editingAlert.value!.id)
      if (index !== -1) {
        alerts.value[index] = updated
      }
    } else {
      const created = await createWhaleAlert(formData.value)
      alerts.value.push(created)
    }
    showAlertModal.value = false
  } catch (e: any) {
    error.value = e.message || 'Failed to save alert'
  }
}

// Delete alert
const removeAlert = async (id: string) => {
  if (!confirm('Are you sure you want to delete this alert?')) return
  try {
    await deleteWhaleAlert(id)
    alerts.value = alerts.value.filter(a => a.id !== id)
  } catch (e: any) {
    error.value = e.message || 'Failed to delete alert'
  }
}

// Toggle alert active status
const toggleAlertActive = async (alert: WhaleAlertConfig) => {
  try {
    const updated = await updateWhaleAlert(alert.id, { isActive: !alert.isActive })
    const index = alerts.value.findIndex(a => a.id === alert.id)
    if (index !== -1) {
      alerts.value[index] = updated
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to update alert'
  }
}

// Mark notification as read
const markAsRead = async (id: string) => {
  try {
    await markAlertNotificationRead(id)
    const notif = notifications.value.find(n => n.id === id)
    if (notif) {
      notif.notified = true
    }
  } catch (e: any) {
    console.error('Failed to mark notification as read:', e)
  }
}

// Manual check for whale movements
const manualCheck = async () => {
  loading.value = true
  try {
    const newNotifs = await checkWhaleMovements()
    notifications.value = [...newNotifs, ...notifications.value]
  } catch (e: any) {
    error.value = e.message || 'Failed to check whale movements'
  } finally {
    loading.value = false
  }
}

// Add known whale to alerts
const addWhaleToAlert = (whale: { address: string; label: string }) => {
  formData.value.address = whale.address
  formData.value.label = whale.label
  showAlertModal.value = true
}

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.notified).length)
const activeAlertsCount = computed(() => alerts.value.filter(a => a.isActive).length)

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="whale-alert-container">
    <!-- Header -->
    <div class="header">
      <div class="header-title">
        <span class="icon">🐋</span>
        <h2>Whale Alert System</h2>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="fetchData" :disabled="loading">
          🔄 Refresh
        </button>
        <button class="btn btn-primary" @click="openAlertModal()">
          + New Alert
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <button @click="error = ''">✕</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalAlerts }}</div>
        <div class="stat-label">Total Alerts</div>
      </div>
      <div class="stat-card active">
        <div class="stat-value">{{ stats.activeAlerts }}</div>
        <div class="stat-label">Active Alerts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalNotifications }}</div>
        <div class="stat-label">Notifications</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.unreadNotifications }}</div>
        <div class="stat-label">Unread</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.knownWhalesCount }}</div>
        <div class="stat-label">Known Whales</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'alerts' }"
        @click="activeTab = 'alerts'"
      >
        📋 Alerts ({{ alerts.length }})
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'transactions' }"
        @click="activeTab = 'transactions'"
      >
        📜 Transactions
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'whales' }"
        @click="activeTab = 'whales'"
      >
        🐋 Known Whales
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        📊 Stats
      </button>
    </div>

    <!-- Alerts Tab -->
    <div v-if="activeTab === 'alerts'" class="tab-content">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="alerts.length === 0" class="empty-state">
        <p>No whale alerts configured</p>
        <button class="btn btn-primary" @click="openAlertModal()">Create First Alert</button>
      </div>
      <div v-else class="alerts-list">
        <div 
          v-for="alert in alerts" 
          :key="alert.id" 
          class="alert-card"
          :class="{ inactive: !alert.isActive }"
        >
          <div class="alert-header">
            <div class="alert-info">
              <span class="alert-label">{{ alert.label || formatAddress(alert.address) }}</span>
              <span class="alert-address">{{ formatAddress(alert.address) }}</span>
            </div>
            <div class="alert-status">
              <span class="status-badge" :class="{ active: alert.isActive }">
                {{ alert.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          <div class="alert-details">
            <div class="detail">
              <span class="label">Chain:</span>
              <span class="value">{{ alert.chain }}</span>
            </div>
            <div class="detail">
              <span class="label">Threshold:</span>
              <span class="value">${{ alert.threshold }}K</span>
            </div>
            <div class="detail">
              <span class="label">Type:</span>
              <span class="value">{{ alert.alertType }}</span>
            </div>
            <div class="detail">
              <span class="label">Notify:</span>
              <span class="value">
                <span v-if="alert.notifyEmail">📧</span>
                <span v-if="alert.notifyTelegram">📱</span>
              </span>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn btn-sm" @click="toggleAlertActive(alert)">
              {{ alert.isActive ? '⏸️ Pause' : '▶️ Activate' }}
            </button>
            <button class="btn btn-sm" @click="openAlertModal(alert)">✏️ Edit</button>
            <button class="btn btn-sm danger" @click="removeAlert(alert.id)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Tab -->
    <div v-if="activeTab === 'transactions'" class="tab-content">
      <div class="transactions-list">
        <div v-for="tx in transactions" :key="tx.hash" class="transaction-card">
          <div class="tx-hash">
            <span class="hash">{{ formatAddress(tx.hash) }}</span>
            <span class="chain-badge">{{ tx.chain }}</span>
          </div>
          <div class="tx-route">
            <span class="from">{{ formatAddress(tx.from) }}</span>
            <span class="arrow">→</span>
            <span class="to">{{ formatAddress(tx.to) }}</span>
          </div>
          <div class="tx-amount">
            <span class="token-amount">{{ tx.amount }} {{ tx.token }}</span>
            <span class="usd-value">{{ formatValue(tx.valueUSD) }}</span>
          </div>
          <div class="tx-time">{{ formatTime(tx.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Known Whales Tab -->
    <div v-if="activeTab === 'whales'" class="tab-content">
      <div class="whales-grid">
        <div 
          v-for="whale in knownWhales" 
          :key="whale.address" 
          class="whale-card"
          :style="{ borderColor: categoryColors[whale.category] || categoryColors.custom }"
        >
          <div class="whale-header">
            <span class="whale-label">{{ whale.label }}</span>
            <span 
              class="whale-category" 
              :style="{ backgroundColor: categoryColors[whale.category] || categoryColors.custom }"
            >
              {{ whale.category }}
            </span>
          </div>
          <div class="whale-address">{{ formatAddress(whale.address) }}</div>
          <div class="whale-actions">
            <button class="btn btn-sm" @click="addWhaleToAlert(whale)">
              🔔 Add Alert
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Tab -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div v-if="notifications.length === 0" class="empty-state">
        <p>No notifications yet</p>
        <button class="btn btn-primary" @click="manualCheck">
          🔍 Check Now
        </button>
      </div>
      <div v-else class="notifications-list">
        <div 
          v-for="notif in notifications" 
          :key="notif.id" 
          class="notification-card"
          :class="{ unread: !notif.notified }"
          @click="markAsRead(notif.id)"
        >
          <div class="notif-header">
            <span class="notif-icon">🐋</span>
            <span class="notif-address">{{ formatAddress(notif.address) }}</span>
            <span class="notif-time">{{ formatTime(notif.triggeredAt) }}</span>
          </div>
          <div class="notif-details">
            <span>{{ notif.transaction.amount }} {{ notif.transaction.token }}</span>
            <span class="usd">({{ formatValue(notif.transaction.valueUSD) }})</span>
          </div>
          <div class="notif-status" :class="{ notified: notif.notified }">
            {{ notif.notified ? '✓ Sent' : '⏳ Pending' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Modal -->
    <div v-if="showAlertModal" class="modal-overlay" @click.self="showAlertModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingAlert ? 'Edit Alert' : 'New Whale Alert' }}</h3>
          <button @click="showAlertModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Wallet Address</label>
            <input v-model="formData.address" type="text" placeholder="0x..." />
          </div>
          <div class="form-group">
            <label>Label</label>
            <input v-model="formData.label" type="text" placeholder="e.g., Vitalik" />
          </div>
          <div class="form-group">
            <label>Chain</label>
            <select v-model="formData.chain">
              <option v-for="chain in chains" :key="chain.id" :value="chain.id">
                {{ chain.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Alert Type</label>
            <select v-model="formData.alertType">
              <option v-for="type in alertTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Threshold ($K)</label>
            <input v-model.number="formData.threshold" type="number" min="1" />
          </div>
          <div class="form-group checkbox">
            <label>
              <input v-model="formData.notifyEmail" type="checkbox" />
              📧 Email Notification
            </label>
          </div>
          <div class="form-group checkbox">
            <label>
              <input v-model="formData.notifyTelegram" type="checkbox" />
              📱 Telegram Notification
            </label>
          </div>
          <div class="form-group checkbox">
            <label>
              <input v-model="formData.isActive" type="checkbox" />
              ✅ Active
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAlertModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveAlert">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.whale-alert-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
}

.header-title .icon {
  font-size: 28px;
}

.badge {
  background: #EF4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
}

.btn-secondary {
  background: #6B7280;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn.danger {
  background: #EF4444;
  color: white;
}

.error-banner {
  background: #FEE2E2;
  color: #DC2626;
  padding: 10px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1F2937;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.active {
  background: #065F46;
}

.stat-card.warning {
  background: #92400E;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: white;
}

.stat-label {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #374151;
  padding-bottom: 8px;
}

.tab {
  background: transparent;
  border: none;
  color: #9CA3AF;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
}

.tab:hover {
  background: #374151;
}

.tab.active {
  background: #3B82F6;
  color: white;
}

.tab-content {
  min-height: 400px;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9CA3AF;
}

.alerts-list {
  display: grid;
  gap: 16px;
}

.alert-card {
  background: #1F2937;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #374151;
}

.alert-card.inactive {
  opacity: 0.6;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.alert-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-label {
  font-weight: bold;
  color: white;
  font-size: 16px;
}

.alert-address {
  color: #9CA3AF;
  font-size: 12px;
  font-family: monospace;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #6B7280;
  color: white;
}

.status-badge.active {
  background: #10B981;
}

.alert-details {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail {
  display: flex;
  gap: 8px;
}

.detail .label {
  color: #9CA3AF;
}

.detail .value {
  color: white;
  font-weight: 500;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.transactions-list {
  display: grid;
  gap: 12px;
}

.transaction-card {
  background: #1F2937;
  padding: 12px 16px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr auto;
  gap: 16px;
  align-items: center;
}

.tx-hash {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hash {
  color: #3B82F6;
  font-family: monospace;
}

.chain-badge {
  background: #374151;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: #9CA3AF;
}

.tx-route {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9CA3AF;
}

.arrow {
  color: #10B981;
}

.tx-amount {
  text-align: right;
}

.token-amount {
  display: block;
  color: white;
  font-weight: 500;
}

.usd-value {
  display: block;
  color: #10B981;
  font-size: 12px;
}

.tx-time {
  color: #9CA3AF;
  font-size: 12px;
}

.whales-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.whale-card {
  background: #1F2937;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid;
}

.whale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.whale-label {
  font-weight: bold;
  color: white;
}

.whale-category {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  color: white;
  text-transform: uppercase;
}

.whale-address {
  color: #9CA3AF;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 12px;
}

.notifications-list {
  display: grid;
  gap: 12px;
}

.notification-card {
  background: #1F2937;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-card:hover {
  background: #374151;
}

.notification-card.unread {
  border-left: 4px solid #F59E0B;
}

.notif-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notif-icon {
  font-size: 20px;
}

.notif-address {
  color: white;
  font-weight: 500;
}

.notif-time {
  color: #9CA3AF;
  font-size: 12px;
  margin-left: auto;
}

.notif-details {
  color: #9CA3AF;
}

.notif-details .usd {
  color: #10B981;
}

.notif-status {
  margin-top: 8px;
  font-size: 12px;
  color: #9CA3AF;
}

.notif-status.notified {
  color: #10B981;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1F2937;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #374151;
}

.modal-header h3 {
  margin: 0;
  color: white;
}

.modal-header button {
  background: transparent;
  border: none;
  color: #9CA3AF;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #9CA3AF;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #111827;
  color: white;
  font-size: 14px;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group.checkbox input {
  width: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #374151;
}
</style>
