<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface News {
  id: string
  title: string
  description: string
  source: string
  time: string
  category: string
  url: string
  imageUrl?: string
}

const news = ref<News[]>([])
const loading = ref(false)
const error = ref('')
const selectedCategory = ref('all')
const categories = ['all', 'DeFi', 'Protocol', 'Security', 'Regulation', 'NFT', 'Trading', 'Mining']

// API Base URL - configurable
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const fetchNews = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const categoryParam = selectedCategory.value === 'all' ? '' : `&category=${selectedCategory.value}`
    const response = await fetch(`${API_BASE}/web3/news?limit=30${categoryParam}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch news')
    }
    
    const data = await response.json()
    
    // Transform API response to our format
    if (data.articles && Array.isArray(data.articles)) {
      news.value = data.articles.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        source: item.source,
        time: formatTime(item.publishedAt),
        category: item.category,
        url: item.url,
        imageUrl: item.imageUrl
      }))
    }
  } catch (e) {
    console.error('Error fetching news:', e)
    error.value = 'Failed to load news, showing cached data'
    // Fallback to default data
    news.value = getDefaultNews()
  } finally {
    loading.value = false
  }
}

const formatTime = (dateStr: string): string => {
  if (!dateStr) return 'Recently'
  
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

const getDefaultNews = (): News[] => [
  { id: '1', title: 'Ethereum Shanghai Upgrade Complete', description: 'The Ethereum Shanghai upgrade has been successfully completed', source: 'Coindesk', time: '2h ago', category: 'Protocol', url: '#' },
  { id: '2', title: 'Uniswap V4 Launch Date Announced', description: 'Uniswap has announced the launch date for V4', source: 'The Block', time: '4h ago', category: 'DeFi', url: '#' },
  { id: '3', title: 'Bitcoin ETF Inflows Hit $500M', description: 'Institutional investors continue to pour money into Bitcoin ETFs', source: 'Bloomberg', time: '6h ago', category: 'Finance', url: '#' },
  { id: '4', title: 'New DeFi Protocol Exploit on Arbitrum', description: 'Security researchers have identified an exploit in a DeFi protocol', source: 'Rekt', time: '8h ago', category: 'Security', url: '#' },
  { id: '5', title: 'SEC Approves Crypto ETFs', description: 'The SEC has approved several cryptocurrency ETFs', source: 'Reuters', time: '12h ago', category: 'Regulation', url: '#' },
]

const filteredNews = computed(() => {
  if (selectedCategory.value === 'all') return news.value
  return news.value.filter(n => n.category === selectedCategory.value)
})

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Security: 'bg-red-500/20 text-red-400',
    DeFi: 'bg-purple-500/20 text-purple-400',
    Protocol: 'bg-blue-500/20 text-blue-400',
    Regulation: 'bg-yellow-500/20 text-yellow-400',
    NFT: 'bg-pink-500/20 text-pink-400',
    Trading: 'bg-green-500/20 text-green-400',
    Mining: 'bg-orange-500/20 text-orange-400',
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400'
}

const openNews = (url: string) => {
  if (url && url !== '#') {
    window.open(url, '_blank')
  }
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">📰 Web3 News</h2>
        <p class="text-sm text-slate-400 mt-1">Latest crypto news aggregated</p>
      </div>
      <button 
        @click="fetchNews" 
        :disabled="loading"
        class="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-sm flex items-center gap-2"
      >
        <span v-if="loading" class="animate-spin">⏳</span>
        <span v-else>🔄</span>
        Refresh
      </button>
    </div>

    <div class="p-4 border-b border-slate-700/50 flex gap-2 overflow-x-auto">
      <button v-for="cat in categories" :key="cat"
        @click="selectedCategory = cat; fetchNews()"
        :class="['px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all',
          selectedCategory === cat ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : 'bg-slate-700 text-slate-400 hover:bg-slate-600']">
        {{ cat === 'all' ? 'All' : cat }}
      </button>
    </div>

    <div v-if="error" class="p-3 mx-4 mt-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
      <p class="text-yellow-400 text-sm">{{ error }}</p>
    </div>

    <div class="p-4 space-y-3 max-h-[500px] overflow-y-auto">
      <div v-if="loading && news.length === 0" class="text-center py-8">
        <div class="animate-spin text-3xl">⏳</div>
        <p class="text-slate-400 mt-2">Loading news...</p>
      </div>
      
      <div v-else-if="filteredNews().length === 0" class="text-center py-8">
        <p class="text-slate-400">No news found</p>
      </div>

      <div v-else v-for="item in filteredNews()" :key="item.id"
        @click="openNews(item.url)"
        class="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
        <div class="flex gap-4">
          <div v-if="item.imageUrl" class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-700">
            <img :src="item.imageUrl" :alt="item.title" class="w-full h-full object-cover" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
          </div>
          <div class="flex-1 min-w-0">
            <span :class="['text-xs px-2 py-0.5 rounded-full inline-block mb-2', getCategoryColor(item.category)]">
              {{ item.category }}
            </span>
            <h3 class="font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">{{ item.title }}</h3>
            <p v-if="item.description" class="text-xs text-slate-500 mt-1 line-clamp-2">{{ item.description }}</p>
            <div class="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>{{ item.source }}</span>
              <span>•</span>
              <span>{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
