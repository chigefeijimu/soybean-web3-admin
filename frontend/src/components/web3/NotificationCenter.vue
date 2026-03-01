<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { createPriceAlert, fetchPriceAlerts, deletePriceAlert, type PriceAlert } from '@/service/api/web3'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'success',
    title: 'Transaction Confirmed',
    message: 'Your swap of 1.5 ETH to 3750 USDC is confirmed',
    timestamp: new Date(Date.now() - 300000),
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Price Alert',
    message: 'ETH reached $2,600 - above your target of $2,500',
    timestamp: new Date(Date.now() - 3600000),
    read: false
  },
  {
    id: '3',
    type: 'info',
    title: 'New NFT Received',
    message: 'You received BAYC #1234 from 0x7Fc6...',
    timestamp: new Date(Date.now() - 86400000),
    read: true
  }
])

const showPanel = ref(false)
const selectedFilter = ref<'all' | 'unread'>('all')
const activeTab = ref<'notifications' | 'alerts'>('notifications')
const showAlertForm = ref(false)

// Price alert form
const alertForm = ref({
  token: 'ETH',
  symbol: 'ETH',
  targetPrice: '',
  condition: 'above' as 'above' | 'below'
})

const priceAlerts = ref<PriceAlert[]>([])
const loadingAlerts = ref(false)

// Available tokens for alerts
const availableTokens = [
  { symbol: 'ETH', name: 'Ethereum', price: 2850 },
  { symbol: 'BTC', name: 'Bitcoin', price: 67500 },
  { symbol: 'BNB', name: 'BNB', price: 580 },
  { symbol: 'SOL', name: 'Solana', price: 145 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.85 },
  { symbol: 'AVAX', name: 'Avalanche', price: 35 },
  { symbol: 'LINK', name: 'Chainlink', price: 14.5 },
  { symbol: 'DOT', name: 'Polkadot', price: 7.2 }
]

const filteredNotifications = () => {
  if (selectedFilter.value === 'unread') {
    return notifications.value.filter(n => !n.read)
  }
  return notifications.value
}

const unreadCount = () => notifications.value.filter(n => !n.read).length
const activeAlertsCount = () => priceAlerts.value.filter(a => !a.triggered).length

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const deleteNotification = (id: string) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

// Load price alerts
const loadPriceAlerts = async () => {
  loadingAlerts.value = true
  try {
    const result = await fetchPriceAlerts()
    priceAlerts.value = result.data || []
  } catch (error) {
    console.error('Failed to load price alerts:', error)
  } finally {
    loadingAlerts.value = false
  }
}

// Create price alert
const submitAlert = async () => {
  if (!alertForm.value.targetPrice) return
  
  try {
    const result = await createPriceAlert({
      token: alertForm.value.token,
      symbol: alertForm.value.symbol,
      targetPrice: parseFloat(alertForm.value.targetPrice),
      condition: alertForm.value.condition
    })
    
    if (result.data) {
      priceAlerts.value.unshift(result.data)
      
      // Add notification
      notifications.value.unshift({
        id: `alert-${Date.now()}`,
        type: 'success',
        title: 'Price Alert Created',
        message: `Alert set: ${alertForm.value.symbol} ${alertForm.value.condition === 'above' ? 'above' : 'below'} $${alertForm.value.targetPrice}`,
        timestamp: new Date(),
        read: false
      })
    }
    
    showAlertForm.value = false
    alertForm.value = {
      token: 'ETH',
      symbol: 'ETH',
      targetPrice: '',
      condition: 'above'
    }
  } catch (error) {
    console.error('Failed to create price alert:', error)
  }
}

// Delete price alert
const removeAlert = async (id: string) => {
  try {
    await deletePriceAlert(id)
    priceAlerts.value = priceAlerts.value.filter(a => a.id !== id)
  } catch (error) {
    console.error('Failed to delete price alert:', error)
  }
}

// Token selection handler
const onTokenChange = () => {
  const token = availableTokens.find(t => t.symbol === alertForm.value.token)
  if (token) {
    alertForm.value.symbol = token.symbol
  }
}

const formatTime = (date: Date) => {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const formatAlertTime = (dateStr: string) => {
  return formatTime(new Date(dateStr))
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'success': return 'border-green-500/50 bg-green-500/10'
    case 'warning': return 'border-yellow-500/50 bg-yellow-500/10'
    case 'error': return 'border-red-500/50 bg-red-500/10'
    default: return 'border-blue-500/50 bg-blue-500/10'
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return '✓'
    case 'warning': return '⚠'
    case 'error': return '✕'
    default: return 'ℹ'
  }
}

// Load alerts on mount
onMounted(() => {
  loadPriceAlerts()
})
</script>

<template>
  <div class="relative">
    <!-- Bell Icon with Badge -->
    <button 
      @click="showPanel = !showPanel"
      class="relative p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
    >
      <span class="text-xl">🔔</span>
      <span 
        v-if="unreadCount() > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
      >
        {{ unreadCount() }}
      </span>
    </button>

    <!-- Notification Panel -->
    <div 
      v-if="showPanel"
      class="absolute top-full right-0 mt-2 w-[480px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      <!-- Header with Tabs -->
      <div class="p-4 border-b border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-lg">Notifications</h3>
          <button @click="showPanel = false" class="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <!-- Tabs -->
        <div class="flex border-b border-slate-700">
          <button
            @click="activeTab = 'notifications'"
            :class="[
              'flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'notifications' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'
            ]"
          >
            <span>🔔</span>
            <span>Notifications</span>
            <span v-if="unreadCount() > 0" class="bg-red-500 text-white text-xs px-1.5 rounded-full">{{ unreadCount() }}</span>
          </button>
          <button
            @click="activeTab = 'alerts'"
            :class="[
              'flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'alerts' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'
            ]"
          >
            <span>⚡</span>
            <span>Price Alerts</span>
            <span v-if="activeAlertsCount() > 0" class="bg-yellow-500 text-white text-xs px-1.5 rounded-full">{{ activeAlertsCount() }}</span>
          </button>
        </div>
      </div>

      <!-- Notifications Tab -->
      <div v-if="activeTab === 'notifications'">
        <!-- Filters -->
        <div class="flex px-4 py-2 border-b border-slate-700/50">
          <button
            @click="selectedFilter = 'all'"
            :class="[
              'py-1 px-3 text-xs font-medium rounded-full transition-colors',
              selectedFilter === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            ]"
          >
            All
          </button>
          <button
            @click="selectedFilter = 'unread'"
            :class="[
              'py-1 px-3 text-xs font-medium rounded-full transition-colors ml-2',
              selectedFilter === 'unread' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            ]"
          >
            Unread
          </button>
          
          <button 
            v-if="unreadCount() > 0"
            @click="markAllAsRead"
            class="ml-auto text-xs text-purple-400 hover:text-purple-300"
          >
            Mark all read
          </button>
        </div>

        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto">
          <div 
            v-for="notification in filteredNotifications()"
            :key="notification.id"
            :class="[
              'p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer',
              getTypeColor(notification.type),
              !notification.read ? 'border-l-4' : ''
            ]"
            @click="markAsRead(notification.id)"
          >
            <div class="flex items-start gap-3">
              <span :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                notification.type === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              ]">
                {{ getIcon(notification.type) }}
              </span>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm">{{ notification.title }}</span>
                  <span class="text-xs text-slate-500">{{ formatTime(notification.timestamp) }}</span>
                </div>
                <p class="text-sm text-slate-400 truncate">{{ notification.message }}</p>
              </div>
              
              <button 
                @click.stop="deleteNotification(notification.id)"
                class="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredNotifications().length === 0" class="p-8 text-center text-slate-500">
            <span class="text-4xl mb-2 block">🔔</span>
            <p>No notifications</p>
          </div>
        </div>
      </div>

      <!-- Price Alerts Tab -->
      <div v-else>
        <!-- Add Alert Button -->
        <div class="p-4 border-b border-slate-700">
          <button 
            v-if="!showAlertForm"
            @click="showAlertForm = true"
            class="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>Create Price Alert</span>
          </button>
          
          <!-- Alert Form -->
          <div v-else class="bg-slate-700/50 rounded-lg p-4">
            <h4 class="font-medium mb-3">Create New Alert</h4>
            
            <div class="space-y-3">
              <div>
                <label class="text-xs text-slate-400 block mb-1">Token</label>
                <select 
                  v-model="alertForm.token"
                  @change="onTokenChange"
                  class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                >
                  <option v-for="token in availableTokens" :key="token.symbol" :value="token.symbol">
                    {{ token.name }} ({{ token.symbol }}) - ${{ token.price }}
                  </option>
                </select>
              </div>
              
              <div class="flex gap-2">
                <div class="flex-1">
                  <label class="text-xs text-slate-400 block mb-1">Condition</label>
                  <select 
                    v-model="alertForm.condition"
                    class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="above">Price Above</option>
                    <option value="below">Price Below</option>
                  </select>
                </div>
                <div class="flex-1">
                  <label class="text-xs text-slate-400 block mb-1">Target Price ($)</label>
                  <input 
                    v-model="alertForm.targetPrice"
                    type="number"
                    placeholder="e.g. 3000"
                    class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              <div class="flex gap-2 mt-4">
                <button 
                  @click="submitAlert"
                  class="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                >
                  Create Alert
                </button>
                <button 
                  @click="showAlertForm = false"
                  class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts List -->
        <div class="max-h-96 overflow-y-auto">
          <div 
            v-for="alert in priceAlerts"
            :key="alert.id"
            class="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                  alert.triggered ? 'bg-green-500/20' : 'bg-yellow-500/20'
                ]">
                  {{ alert.triggered ? '✓' : '🔔' }}
                </div>
                <div>
                  <div class="font-medium">{{ alert.symbol }}</div>
                  <div class="text-sm text-slate-400">
                    {{ alert.condition === 'above' ? '↑ Above' : '↓ Below' }} 
                    <span class="text-white font-medium">${{ alert.targetPrice }}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <span v-if="alert.triggered" class="text-xs text-green-400">
                  Triggered {{ formatAlertTime(alert.triggeredAt || '') }}
                </span>
                <span v-else class="text-xs text-yellow-400">
                  Active
                </span>
                <button 
                  @click="removeAlert(alert.id)"
                  class="text-slate-500 hover:text-red-400 text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="priceAlerts.length === 0" class="p-8 text-center text-slate-500">
            <span class="text-4xl mb-2 block">⚡</span>
            <p>No price alerts</p>
            <p class="text-xs mt-1">Create an alert to get notified when prices hit your target</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
