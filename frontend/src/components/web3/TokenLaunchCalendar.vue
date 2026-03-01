<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  fetchUpcomingLaunches, 
  fetchAirdrops, 
  fetchLaunchPlatforms,
  fetchTrendingLaunches,
  type TokenLaunch,
  type Airdrop,
  type LaunchPlatform
} from '@/service/api/web3'

// State
const activeTab = ref<'launches' | 'airdrops' | 'calendar'>('launches')
const launches = ref<TokenLaunch[]>([])
const airdrops = ref<Airdrop[]>([])
const platforms = ref<LaunchPlatform[]>([])
const trending = ref<TokenLaunch[]>([])
const loading = ref(false)
const selectedPlatform = ref<string>('')
const currentPage = ref(1)
const totalItems = ref(0)
const limit = 10

// Format helpers
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getDaysUntil = (dateStr: string) => {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = target.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return '已结束'
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  return `${days}天后`
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'IDO': 'bg-blue-500',
    'IEO': 'bg-purple-500',
    'ICO': 'bg-orange-500',
    'Airdrop': 'bg-green-500',
    'Fair Launch': 'bg-yellow-500'
  }
  return colors[type] || 'bg-gray-500'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'upcoming': 'text-blue-400',
    'active': 'text-green-400',
    'ended': 'text-gray-400',
    'announced': 'text-yellow-400',
    'snapshot': 'text-purple-400',
    'claimable': 'text-green-400'
  }
  return colors[status] || 'text-gray-400'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'upcoming': '即将开始',
    'active': '进行中',
    'ended': '已结束',
    'announced': '已公布',
    'snapshot': '快照中',
    'claimable': '可领取'
  }
  return texts[status] || status
}

// Computed
const paginatedLaunches = computed(() => {
  const start = (currentPage.value - 1) * limit
  return launches.value.slice(start, start + limit)
})

const totalPages = computed(() => Math.ceil(totalItems.value / limit))

// Methods
const loadLaunches = async () => {
  loading.value = true
  try {
    const res = await fetchUpcomingLaunches({
      page: currentPage.value,
      limit: limit,
      platform: selectedPlatform.value || undefined
    })
    launches.value = res.data
    totalItems.value = res.total
  } catch (e) {
    console.error('Failed to fetch launches:', e)
  } finally {
    loading.value = false
  }
}

const loadAirdrops = async () => {
  loading.value = true
  try {
    const res = await fetchAirdrops({ page: 1, limit: 20 })
    airdrops.value = res.data
  } catch (e) {
    console.error('Failed to fetch airdrops:', e)
  } finally {
    loading.value = false
  }
}

const loadPlatforms = async () => {
  try {
    const res = await fetchLaunchPlatforms()
    platforms.value = res
  } catch (e) {
    console.error('Failed to fetch platforms:', e)
  }
}

const loadTrending = async () => {
  try {
    const res = await fetchTrendingLaunches()
    trending.value = res
  } catch (e) {
    console.error('Failed to fetch trending:', e)
  }
}

const handlePlatformChange = () => {
  currentPage.value = 1
  if (activeTab.value === 'launches') {
    loadLaunches()
  }
}

const changeTab = (tab: 'launches' | 'airdrops' | 'calendar') => {
  activeTab.value = tab
  currentPage.value = 1
}

// Lifecycle
onMounted(() => {
  loadPlatforms()
  loadTrending()
  loadLaunches()
})
</script>

<template>
  <div class="token-launch-calendar p-4">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        🚀 代币发售日历
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        追踪最新的IDOs、IEOs、空投和代币发射
      </p>
    </div>

    <!-- Trending Section -->
    <div v-if="trending.length > 0" class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
        🔥 热门发射
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div 
          v-for="item in trending" 
          :key="item.id"
          class="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-4 text-white"
        >
          <div class="flex items-center gap-2 mb-2">
            <img 
              :src="item.logoUrl" 
              :alt="item.symbol" 
              class="w-8 h-8 rounded-full"
              @error="($event.target as HTMLImageElement).src = 'https://via.placeholder.com/32'"
            />
            <div>
              <div class="font-bold">{{ item.symbol }}</div>
              <div class="text-xs opacity-80">{{ item.name }}</div>
            </div>
          </div>
          <div class="text-xs opacity-80 mb-2">{{ item.platform }}</div>
          <div class="flex justify-between text-sm">
            <span>目标: ${{ formatNumber(item.targetRaise) }}</span>
            <span :class="getStatusColor(item.status)">{{ getStatusText(item.status) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in [
          { key: 'launches', label: '📅 发售日程', icon: '🚀' },
          { key: 'airdrops', label: '🎁 空投追踪', icon: '🎁' },
          { key: 'calendar', label: '📆 日历视图', icon: '📆' }
        ]"
        :key="tab.key"
        @click="changeTab(tab.key as any)"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-all',
          activeTab === tab.key 
            ? 'bg-blue-500 text-white shadow-lg' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-4 items-center">
      <select
        v-model="selectedPlatform"
        @change="handlePlatformChange"
        class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
      >
        <option value="">所有平台</option>
        <option v-for="p in platforms" :key="p.id" :value="p.id">
          {{ p.name }} ({{ p.chain }})
        </option>
      </select>
      <span class="text-gray-500 text-sm">
        共 {{ totalItems }} 个即将发售
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <!-- Launches Tab -->
    <div v-else-if="activeTab === 'launches'" class="space-y-4">
      <div 
        v-for="launch in launches" 
        :key="launch.id"
        class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Logo & Basic Info -->
          <div class="flex items-start gap-4 md:w-64">
            <img 
              :src="launch.logoUrl" 
              :alt="launch.symbol" 
              class="w-16 h-16 rounded-xl"
              @error="($event.target as HTMLImageElement).src = 'https://via.placeholder.com/64'"
            />
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-lg text-gray-800 dark:text-gray-200">
                  {{ launch.name }}
                </h3>
                <span 
                  :class="['px-2 py-0.5 rounded text-xs text-white', getTypeColor(launch.type)]"
                >
                  {{ launch.type }}
                </span>
              </div>
              <div class="text-gray-500">{{ launch.symbol }}</div>
              <div class="text-sm text-gray-400">{{ launch.platform }}</div>
            </div>
          </div>

          <!-- Details -->
          <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div class="text-xs text-gray-500 mb-1">开始时间</div>
              <div class="font-medium text-gray-700 dark:text-gray-300">
                {{ formatDate(launch.startTime) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">距开始</div>
              <div class="font-medium text-blue-500">
                {{ getDaysUntil(launch.startTime) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">目标融资</div>
              <div class="font-medium text-gray-700 dark:text-gray-300">
                ${{ formatNumber(launch.targetRaise) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">状态</div>
              <div :class="['font-medium', getStatusColor(launch.status)]">
                {{ getStatusText(launch.status) }}
              </div>
            </div>
          </div>

          <!-- Chain Badge -->
          <div class="flex items-center">
            <span class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400">
              {{ launch.chain }}
            </span>
          </div>
        </div>

        <!-- Description & Links -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
            {{ launch.description }}
          </p>
          <div class="flex flex-wrap gap-2">
            <a 
              v-if="launch.links.website" 
              :href="launch.links.website" 
              target="_blank"
              class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:opacity-80"
            >
              🌐 官网
            </a>
            <a 
              v-if="launch.links.twitter" 
              :href="launch.links.twitter" 
              target="_blank"
              class="px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 rounded-full text-sm hover:opacity-80"
            >
              🐦 Twitter
            </a>
            <a 
              v-if="launch.links.telegram" 
              :href="launch.links.telegram" 
              target="_blank"
              class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:opacity-80"
            >
              💬 Telegram
            </a>
            <span 
              v-if="launch.tier" 
              class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full text-sm"
            >
              {{ launch.tier }} 额度
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50"
        >
          上一页
        </button>
        <span class="px-4 py-2 text-gray-600 dark:text-gray-400">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- Airdrops Tab -->
    <div v-else-if="activeTab === 'airdrops'" class="space-y-4">
      <div 
        v-for="airdrop in airdrops" 
        :key="airdrop.id"
        class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-start gap-4">
          <img 
            :src="airdrop.logoUrl" 
            :alt="airdrop.symbol" 
            class="w-14 h-14 rounded-xl"
            @error="($event.target as HTMLImageElement).src = 'https://via.placeholder.com/56'"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-lg text-gray-800 dark:text-gray-200">
                {{ airdrop.name }}
              </h3>
              <span :class="['px-2 py-0.5 rounded text-xs text-white', getTypeColor('Airdrop')]">
                空投
              </span>
            </div>
            <div class="text-gray-500 mb-2">{{ airdrop.symbol }} • {{ airdrop.chain }}</div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ airdrop.description }}</p>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div v-if="airdrop.snapshotDate">
                <div class="text-xs text-gray-500">快照日期</div>
                <div class="font-medium text-gray-700 dark:text-gray-300">
                  {{ formatDate(airdrop.snapshotDate) }}
                </div>
              </div>
              <div v-if="airdrop.claimDate">
                <div class="text-xs text-gray-500">领取日期</div>
                <div class="font-medium text-green-500">
                  {{ formatDate(airdrop.claimDate) }}
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-500">分发方式</div>
                <div class="font-medium text-gray-700 dark:text-gray-300">
                  {{ airdrop.distributionMethod }}
                </div>
              </div>
              <div v-if="airdrop.estimatedValue">
                <div class="text-xs text-gray-500">预估价值</div>
                <div class="font-medium text-green-500">${{ airdrop.estimatedValue }}</div>
              </div>
            </div>

            <div class="mb-3">
              <div class="text-xs text-gray-500 mb-1">参与条件</div>
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="(req, idx) in airdrop.requirements" 
                  :key="idx"
                  class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                >
                  {{ req }}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <a 
                v-if="airdrop.links.website" 
                :href="airdrop.links.website" 
                target="_blank"
                class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm"
              >
                🌐 官网
              </a>
              <a 
                v-if="airdrop.links.twitter" 
                :href="airdrop.links.twitter" 
                target="_blank"
                class="px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 rounded-full text-sm"
              >
                🐦 Twitter
              </a>
              <span :class="['px-3 py-1 rounded-full text-sm', getStatusColor(airdrop.status)]">
                {{ getStatusText(airdrop.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Tab Placeholder -->
    <div v-else-if="activeTab === 'calendar'" class="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
      <div class="text-6xl mb-4">📆</div>
      <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        日历视图
      </h3>
      <p class="text-gray-500 mb-4">
        可视化月度代币发售日历，即将推出
      </p>
      <div class="text-sm text-gray-400">
        敬请期待更多功能...
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-launch-calendar {
  min-height: 400px;
}
</style>
