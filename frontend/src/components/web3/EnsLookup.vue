<script setup lang="ts">
import { ref } from 'vue'

interface EnsRecord {
  name: string
  address: string
  avatar: string
  description: string
  twitter: string
  email: string
  expiryDate: string
}

const searchQuery = ref('')
const loading = ref(false)
const result = ref<EnsRecord | null>(null)

const search = async () => {
  if (!searchQuery.value) return
  loading.value = true
  
  await new Promise(r => setTimeout(r, 1500))
  
  result.value = {
    name: searchQuery.value.endsWith('.eth') ? searchQuery.value : searchQuery.value + '.eth',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
    avatar: '',
    description: 'Web3 Developer & NFT Collector',
    twitter: '@web3dev',
    email: 'contact@example.eth',
    expiryDate: '2026-12-31'
  }
  
  loading.value = false
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">🔤 ENS Lookup</h2>
      <p class="text-sm text-slate-400 mt-1">Search ENS domains and records</p>
    </div>

    <div class="p-6">
      <div class="flex gap-2 mb-6">
        <input 
          v-model="searchQuery"
          placeholder="Search ENS domain..."
          class="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          @keyup.enter="search"
        />
        <button 
          @click="search"
          :disabled="!searchQuery || loading"
          class="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-medium"
        >
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <div v-if="result" class="space-y-4">
        <div class="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
          <div class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <p class="text-lg font-semibold">{{ result.name }}</p>
            <p class="text-sm text-slate-400 font-mono">{{ result.address }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Description</p>
            <p class="text-sm mt-1">{{ result.description }}</p>
          </div>
          <div class="p-3 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Twitter</p>
            <p class="text-sm mt-1 text-blue-400">{{ result.twitter }}</p>
          </div>
          <div class="p-3 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Email</p>
            <p class="text-sm mt-1">{{ result.email }}</p>
          </div>
          <div class="p-3 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Expires</p>
            <p class="text-sm mt-1">{{ result.expiryDate }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        <span class="text-4xl mb-4 block">🔤</span>
        <p>Enter an ENS domain to search</p>
      </div>
    </div>
  </div>
</template>
