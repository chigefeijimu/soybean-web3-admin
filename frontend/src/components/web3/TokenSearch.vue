<script setup lang="ts">
import { ref } from 'vue'
import { searchCoins } from '@/service/api/web3'

interface SearchResult {
  id: string
  name: string
  symbol: string
  thumb: string
  rank: number
}

const searchQuery = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const selectedToken = ref<SearchResult | null>(null)

const search = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) return
  
  loading.value = true
  try {
    const res = await searchCoins(searchQuery.value)
    if (res.data?.data) {
      results.value = res.data.data.slice(0, 20)
    }
  } catch (e) {
    console.error('Search failed:', e)
  } finally {
    loading.value = false
  }
}

const selectToken = (token: SearchResult) => {
  selectedToken.value = token
  searchQuery.value = ''
  results.value = []
}

const formatRank = (rank: number) => {
  if (!rank) return '—'
  return '#' + rank
}
</script>

<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <input 
        v-model="searchQuery"
        @input="search"
        type="text"
        placeholder="Search tokens..."
        class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <span v-if="loading" class="absolute right-4 top-1/2 -translate-y-1/2">
        <div class="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </span>
    </div>

    <!-- Results Dropdown -->
    <div 
      v-if="results.length > 0"
      class="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
    >
      <div 
        v-for="token in results"
        :key="token.id"
        @click="selectToken(token)"
        class="flex items-center gap-3 p-3 hover:bg-slate-700/50 cursor-pointer transition-colors"
      >
        <img 
          v-if="token.thumb" 
          :src="token.thumb" 
          :alt="token.symbol"
          class="w-8 h-8 rounded-full"
        />
        <div v-else class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold">
          {{ token.symbol.charAt(0) }}
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ token.symbol }}</span>
            <span class="text-xs text-slate-500">{{ formatRank(token.rank) }}</span>
          </div>
          <span class="text-sm text-slate-400 truncate">{{ token.name }}</span>
        </div>
      </div>
    </div>

    <!-- Selected Token -->
    <div v-if="selectedToken" class="mt-3 p-3 bg-slate-700/30 rounded-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img 
            v-if="selectedToken.thumb" 
            :src="selectedToken.thumb" 
            :alt="selectedToken.symbol"
            class="w-10 h-10 rounded-full"
          />
          <div>
            <span class="font-semibold">{{ selectedToken.symbol }}</span>
            <span class="text-sm text-slate-400 ml-2">{{ selectedToken.name }}</span>
          </div>
        </div>
        <button 
          @click="selectedToken = null"
          class="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
