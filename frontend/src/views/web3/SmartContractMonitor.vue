<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface MonitoredContract {
  id: string
  address: string
  chain: string
  name?: string
  description?: string
  events: string[]
  alertEnabled: boolean
  notifyEmail?: boolean
  notifyWebhook?: boolean
  isActive: boolean
  createdAt: string
  lastEventAt?: string
  eventCount: number
}

interface ContractEvent {
  id: string
  contractId: string
  contractAddress: string
  chain: string
  eventName: string
  blockNumber: number
  transactionHash: string
  timestamp: string
  from: string
  data: Record<string, unknown>
}

interface ContractAlert {
  id: string
  contractId: string
  contractAddress: string
  chain: string
  eventType: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  triggeredAt: string
  acknowledged: boolean
}

interface Stats {
  totalContracts: number
  activeContracts: number
  totalEvents: number
  eventsLast24h: number
  eventsLast7d: number
  alertsTriggered: number
  chains: string[]
}

const activeTab = ref('contracts')
const loading = ref(false)
const contracts = ref<MonitoredContract[]>([])
const events = ref<ContractEvent[]>([])
const alerts = ref<ContractAlert[]>([])
const stats = ref<Stats | null>(null)

// Form state
const newContract = ref({
  address: '',
  chain: 'ethereum',
  name: '',
  description: '',
  events: [] as string[],
  alertEnabled: true,
  notifyEmail: true,
  notifyWebhook: false,
  webhookUrl: '',
})

const commonEvents = ref<string[]>([])
const supportedChains = ref<string[]>([])
const selectedContract = ref<MonitoredContract | null>(null)
const contractEvents = ref<ContractEvent[]>([])
const searchQuery = ref('')
const filterChain = ref('')

const chainColors: Record<string, string> = {
  ethereum: '#627EEA',
  polygon: '#8247E5',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  bsc: '#F3BA2F',
  avalanche: '#E84142',
  base: '#0052FF',
  solana: '#9945FF',
}

const severityColors: Record<string, string> = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
}

const filteredContracts = computed(() => {
  let result = contracts.value
  if (filterChain.value) {
    result = result.filter(c => c.chain === filterChain.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => 
      c.address.toLowerCase().includes(query) ||
      c.name?.toLowerCase().includes(query)
    )
  }
  return result
})

const fetchStats = async () => {
  try {
    const res = await fetch('/api/web3-smart-contract-monitor/stats')
    const data = await res.json()
    stats.value = data
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const fetchContracts = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/web3-smart-contract-monitor/contracts')
    const data = await res.json()
    contracts.value = data
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
  } finally {
    loading.value = false
  }
}

const fetchEvents = async () => {
  try {
    const res = await fetch('/api/web3-smart-contract-monitor/events?limit=50')
    const data = await res.json()
    events.value = data
  } catch (error) {
    console.error('Failed to fetch events:', error)
  }
}

const fetchAlerts = async () => {
  try {
    const res = await fetch('/api/web3-smart-contract-monitor/alerts?limit=50')
    const data = await res.json()
    alerts.value = data
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  }
}

const fetchConfig = async () => {
  try {
    const [chainsRes, eventsRes] = await Promise.all([
      fetch('/api/web3-smart-contract-monitor/config/chains'),
      fetch('/api/web3-smart-contract-monitor/config/events'),
    ])
    supportedChains.value = await chainsRes.json()
    commonEvents.value = await eventsRes.json()
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const addContract = async () => {
  if (!newContract.value.address) return
  
  loading.value = true
  try {
    const res = await fetch('/api/web3-smart-contract-monitor/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContract.value),
    })
    const data = await res.json()
    contracts.value.push(data)
    newContract.value = {
      address: '',
      chain: 'ethereum',
      name: '',
      description: '',
      events: [],
      alertEnabled: true,
      notifyEmail: true,
      notifyWebhook: false,
      webhookUrl: '',
    }
    await fetchStats()
  } catch (error) {
    console.error('Failed to add contract:', error)
  } finally {
    loading.value = false
  }
}

const deleteContract = async (id: string) => {
  if (!confirm('Are you sure you want to delete this contract?')) return
  
  try {
    await fetch(`/api/web3-smart-contract-monitor/contracts/${id}`, {
      method: 'DELETE',
    })
    contracts.value = contracts.value.filter(c => c.id !== id)
    await fetchStats()
  } catch (error) {
    console.error('Failed to delete contract:', error)
  }
}

const toggleContract = async (id: string) => {
  try {
    const res = await fetch(`/api/web3-smart-contract-monitor/contracts/${id}/toggle`, {
      method: 'POST',
    })
    const updated = await res.json()
    const index = contracts.value.findIndex(c => c.id === id)
    if (index !== -1) {
      contracts.value[index] = updated
    }
    await fetchStats()
  } catch (error) {
    console.error('Failed to toggle contract:', error)
  }
}

const viewContractEvents = async (contract: MonitoredContract) => {
  selectedContract.value = contract
  try {
    const res = await fetch(`/api/web3-smart-contract-monitor/contracts/${contract.id}/events?limit=20`)
    contractEvents.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch contract events:', error)
  }
}

const acknowledgeAlert = async (id: string) => {
  try {
    await fetch(`/api/web3-smart-contract-monitor/alerts/${id}/acknowledge`, {
      method: 'POST',
    })
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      alerts.value[index].acknowledged = true
    }
  } catch (error) {
    console.error('Failed to acknowledge alert:', error)
  }
}

const formatAddress = (addr: string) => {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchContracts(),
    fetchEvents(),
    fetchAlerts(),
    fetchConfig(),
  ])
})
</script>

<template>
  <div class="smart-contract-monitor">
    <div class="header">
      <h1>📡 Smart Contract Monitor</h1>
      <p>Cross-chain smart contract event monitoring and alerting</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalContracts }}</div>
        <div class="stat-label">Total Contracts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.activeContracts }}</div>
        <div class="stat-label">Active Contracts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(stats.totalEvents) }}</div>
        <div class="stat-label">Total Events</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(stats.eventsLast24h) }}</div>
        <div class="stat-label">Events (24h)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.alertsTriggered }}</div>
        <div class="stat-label">Alerts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.chains.length }}</div>
        <div class="stat-label">Chains</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'contracts' }]" 
        @click="activeTab = 'contracts'"
      >
        📋 Contracts
      </button>
      <button 
        :class="['tab', { active: activeTab === 'events' }]" 
        @click="activeTab = 'events'"
      >
        ⚡ Events
      </button>
      <button 
        :class="['tab', { active: activeTab === 'alerts' }]" 
        @click="activeTab = 'alerts'"
      >
        🔔 Alerts
      </button>
      <button 
        :class="['tab', { active: activeTab === 'add' }]" 
        @click="activeTab = 'add'"
      >
        ➕ Add Contract
      </button>
    </div>

    <!-- Contracts Tab -->
    <div v-if="activeTab === 'contracts'" class="tab-content">
      <div class="filters">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search contracts..."
          class="search-input"
        />
        <select v-model="filterChain" class="chain-select">
          <option value="">All Chains</option>
          <option v-for="chain in supportedChains" :key="chain" :value="chain">
            {{ chain }}
          </option>
        </select>
      </div>

      <div class="contracts-grid">
        <div v-for="contract in filteredContracts" :key="contract.id" class="contract-card">
          <div class="contract-header">
            <span 
              class="chain-badge" 
              :style="{ backgroundColor: chainColors[contract.chain] || '#666' }"
            >
              {{ contract.chain }}
            </span>
            <span :class="['status', contract.isActive ? 'active' : 'inactive']">
              {{ contract.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="contract-name">{{ contract.name || 'Unnamed' }}</div>
          <div class="contract-address">{{ formatAddress(contract.address) }}</div>
          <div class="contract-events">
            <span v-for="event in contract.events.slice(0, 2)" :key="event" class="event-tag">
              {{ event.slice(0, 20) }}...
            </span>
            <span v-if="contract.events.length > 2" class="more-events">
              +{{ contract.events.length - 2 }} more
            </span>
          </div>
          <div class="contract-stats">
            <span>📊 {{ formatNumber(contract.eventCount) }} events</span>
            <span v-if="contract.lastEventAt">🕐 {{ formatTime(contract.lastEventAt) }}</span>
          </div>
          <div class="contract-actions">
            <button @click="viewContractEvents(contract)" class="btn btn-sm">View Events</button>
            <button @click="toggleContract(contract.id)" class="btn btn-sm btn-secondary">
              {{ contract.isActive ? 'Pause' : 'Activate' }}
            </button>
            <button @click="deleteContract(contract.id)" class="btn btn-sm btn-danger">Delete</button>
          </div>
        </div>
      </div>

      <!-- Contract Events Modal -->
      <div v-if="selectedContract" class="modal-overlay" @click.self="selectedContract = null">
        <div class="modal">
          <div class="modal-header">
            <h3>Events: {{ selectedContract.name }}</h3>
            <button @click="selectedContract = null" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div v-for="event in contractEvents" :key="event.id" class="event-item">
              <div class="event-header">
                <span class="event-name">{{ event.eventName }}</span>
                <span class="event-time">{{ formatTime(event.timestamp) }}</span>
              </div>
              <div class="event-details">
                <span>Block: {{ event.blockNumber }}</span>
                <span>From: {{ formatAddress(event.from) }}</span>
              </div>
              <div class="event-hash">
                <a :href="`https://etherscan.io/tx/${event.transactionHash}`" target="_blank">
                  {{ formatAddress(event.transactionHash) }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Events Tab -->
    <div v-if="activeTab === 'events'" class="tab-content">
      <div class="events-timeline">
        <div v-for="event in events" :key="event.id" class="event-card">
          <div class="event-icon">⚡</div>
          <div class="event-content">
            <div class="event-title">
              <span class="event-name">{{ event.eventName }}</span>
              <span 
                class="chain-badge small" 
                :style="{ backgroundColor: chainColors[event.chain] || '#666' }"
              >
                {{ event.chain }}
              </span>
            </div>
            <div class="event-meta">
              <span>Block: {{ event.blockNumber }}</span>
              <span>Tx: {{ formatAddress(event.transactionHash) }}</span>
            </div>
            <div class="event-time">{{ formatTime(event.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts Tab -->
    <div v-if="activeTab === 'alerts'" class="tab-content">
      <div class="alerts-list">
        <div 
          v-for="alert in alerts" 
          :key="alert.id" 
          :class="['alert-item', { acknowledged: alert.acknowledged }]"
        >
          <div class="alert-severity" :style="{ backgroundColor: severityColors[alert.severity] }"></div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-type">{{ alert.eventType }}</span>
              <span class="alert-severity-text">{{ alert.severity }}</span>
            </div>
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-meta">
              <span>{{ alert.chain }}</span>
              <span>{{ formatTime(alert.triggeredAt) }}</span>
            </div>
          </div>
          <div class="alert-actions">
            <button 
              v-if="!alert.acknowledged" 
              @click="acknowledgeAlert(alert.id)"
              class="btn btn-sm"
            >
              Acknowledge
            </button>
            <span v-else class="acknowledged-badge">✓ Acknowledged</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Contract Tab -->
    <div v-if="activeTab === 'add'" class="tab-content">
      <div class="add-form">
        <h3>Add New Contract to Monitor</h3>
        
        <div class="form-group">
          <label>Contract Address *</label>
          <input v-model="newContract.address" type="text" placeholder="0x..." />
        </div>

        <div class="form-group">
          <label>Chain *</label>
          <select v-model="newContract.chain">
            <option v-for="chain in supportedChains" :key="chain" :value="chain">
              {{ chain }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Name</label>
          <input v-model="newContract.name" type="text" placeholder="Contract name" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="newContract.description" placeholder="Description"></textarea>
        </div>

        <div class="form-group">
          <label>Events to Monitor</label>
          <div class="events-checkbox">
            <label v-for="event in commonEvents.slice(0, 8)" :key="event">
              <input 
                type="checkbox" 
                :value="event" 
                v-model="newContract.events"
              />
              {{ event.slice(0, 25) }}...
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>Alert Settings</label>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" v-model="newContract.alertEnabled" />
              Enable Alerts
            </label>
            <label>
              <input type="checkbox" v-model="newContract.notifyEmail" />
              Email Notification
            </label>
            <label>
              <input type="checkbox" v-model="newContract.notifyWebhook" />
              Webhook Notification
            </label>
          </div>
        </div>

        <div v-if="newContract.notifyWebhook" class="form-group">
          <label>Webhook URL</label>
          <input v-model="newContract.webhookUrl" type="text" placeholder="https://..." />
        </div>

        <button @click="addContract" :disabled="loading || !newContract.address" class="btn btn-primary">
          {{ loading ? 'Adding...' : 'Add Contract' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.smart-contract-monitor {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2563EB;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 15px;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab.active {
  background: #2563EB;
  color: white;
}

.tab:hover:not(.active) {
  background: #f3f4f6;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input, .chain-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.search-input {
  flex: 1;
}

.contracts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.contract-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.contract-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chain-badge {
  padding: 4px 10px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.chain-badge.small {
  padding: 2px 8px;
  font-size: 11px;
}

.status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.status.active {
  background: #dcfce7;
  color: #16a34a;
}

.status.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.contract-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.contract-address {
  font-family: monospace;
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
}

.contract-events {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.event-tag {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
}

.more-events {
  font-size: 12px;
  color: #999;
}

.contract-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.contract-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #2563EB;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.event-icon {
  font-size: 24px;
}

.event-content {
  flex: 1;
}

.event-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.event-name {
  font-weight: 600;
}

.event-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.event-time {
  font-size: 12px;
  color: #999;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.alert-item.acknowledged {
  opacity: 0.6;
}

.alert-severity {
  width: 4px;
  border-radius: 2px;
}

.alert-content {
  flex: 1;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alert-type {
  font-weight: 600;
}

.alert-severity-text {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
}

.alert-message {
  font-size: 14px;
  margin-bottom: 8px;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.acknowledged-badge {
  color: #16a34a;
  font-size: 12px;
}

.add-form {
  max-width: 600px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.add-form h3 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 80px;
}

.events-checkbox {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.events-checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  font-size: 13px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}

.modal-overlay {
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

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.event-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.event-item:last-child {
  margin-bottom: 0;
}

.event-item .event-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-item .event-name {
  font-weight: 600;
}

.event-item .event-time {
  font-size: 12px;
  color: #666;
}

.event-item .event-details {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.event-item .event-hash a {
  font-size: 12px;
  color: #2563EB;
}
</style>
