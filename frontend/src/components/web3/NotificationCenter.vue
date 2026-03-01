<script setup lang="ts">
import { ref } from 'vue'

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

const filteredNotifications = () => {
  if (selectedFilter.value === 'unread') {
    return notifications.value.filter(n => !n.read)
  }
  return notifications.value
}

const unreadCount = () => notifications.value.filter(n => !n.read).length

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
      class="absolute top-full right-0 mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      <!-- Header -->
      <div class="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold">Notifications</h3>
        <button 
          v-if="unreadCount() > 0"
          @click="markAllAsRead"
          class="text-xs text-purple-400 hover:text-purple-300"
        >
          Mark all read
        </button>
      </div>

      <!-- Filters -->
      <div class="flex border-b border-slate-700">
        <button
          @click="selectedFilter = 'all'"
          :class="[
            'flex-1 py-2 text-sm font-medium transition-colors',
            selectedFilter === 'all' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'
          ]"
        >
          All
        </button>
        <button
          @click="selectedFilter = 'unread'"
          :class="[
            'flex-1 py-2 text-sm font-medium transition-colors',
            selectedFilter === 'unread' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'
          ]"
        >
          Unread ({{ unreadCount() }})
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
              class="text-slate-500 hover:text-white"
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
  </div>
</template>
