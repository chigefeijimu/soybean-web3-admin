<script setup lang="ts">
import { ref } from 'vue'

interface News {
  id: string
  title: string
  source: string
  time: string
  category: string
  url: string
}

const news = ref<News[]>([
  { id: '1', title: 'Ethereum Shanghai Upgrade Complete', source: 'Coindesk', time: '2h ago', category: 'Protocol', url: '#' },
  { id: '2', title: 'Uniswap V4 Launch Date Announced', source: 'The Block', time: '4h ago', category: 'DeFi', url: '#' },
  { id: '3', title: 'Bitcoin ETF Inflows Hit $500M', source: 'Bloomberg', time: '6h ago', category: 'Finance', url: '#' },
  { id: '4', title: 'New DeFi Protocol Exploit on Arbitrum', source: 'Rekt', time: '8h ago', category: 'Security', url: '#' },
  { id: '5', title: 'SEC Approves Crypto ETFs', source: 'Reuters', time: '12h ago', category: 'Regulation', url: '#' },
])

const selectedCategory = ref('all')
const categories = ['all', 'DeFi', 'Protocol', 'Finance', 'Security', 'Regulation']

const filteredNews = () => {
  if (selectedCategory.value === 'all') return news.value
  return news.value.filter(n => n.category === selectedCategory.value)
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">📰 Web3 News</h2>
      <p class="text-sm text-slate-400 mt-1">Latest crypto news aggregated</p>
    </div>

    <div class="p-4 border-b border-slate-700/50 flex gap-2 overflow-x-auto">
      <button v-for="cat in categories" :key="cat"
        @click="selectedCategory = cat"
        :class="['px-3 py-1 rounded-full text-sm whitespace-nowrap',
          selectedCategory === cat ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600']">
        {{ cat === 'all' ? 'All' : cat }}
      </button>
    </div>

    <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
      <div v-for="item in filteredNews()" :key="item.id"
        class="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span :class="['text-xs px-2 py-0.5 rounded-full', 
              item.category === 'Security' ? 'bg-red-500/20 text-red-400' :
              item.category === 'DeFi' ? 'bg-purple-500/20 text-purple-400' :
              'bg-blue-500/20 text-blue-400']">
              {{ item.category }}
            </span>
            <h3 class="font-medium mt-2">{{ item.title }}</h3>
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
