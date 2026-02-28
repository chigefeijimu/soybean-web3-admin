<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'

interface Token {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  value: number
  logo?: string
}

const { account, chainId } = useWeb3()

const tokens = ref<Token[]>([])
const isLoading = ref(false)
const totalValue = ref(0)
const sortBy = ref<'value' | 'balance' | 'name'>('value')

// Mock portfolio data
const mockTokens: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    balance: '2.5',
    value: 6250,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    balance: '5000',
    value: 5000,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg',
  },
  {
    address: '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    balance: '2500',
    value: 2500,
    logo: 'https://cryptologos.cc/logos/dai-dai-logo.svg',
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    balance: '0.1',
    value: 6250,
    logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg',
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    name: 'Aave',
    symbol: 'AAVE',
    decimals: 18,
    balance: '25',
    value: 3750,
    logo: 'https://cryptologos.cc/logos/aave-aave-logo.svg',
  },
]

const sortedTokens = computed(() => {
  return [...tokens.value].sort((a, b) => {
    if (sortBy.value === 'value') return b.value - a.value
    if (sortBy.value === 'balance') return parseFloat(b.balance) - parseFloat(a.balance)
    return a.name.localeCompare(b.name)
  })
})

const formatBalance = (balance: string, decimals: number): string => {
  const num = parseFloat(balance)
  if (num >= 1000) return num.toLocaleString()
  if (num >= 1) return num.toFixed(2)
  return num.toFixed(6)
}

const formatValue = (value: number): string => {
  return '$' + value.toLocaleString()
}

const getTokenUrl = (address: string): string => {
  if (address === '0x0000000000000000000000000000000000000000') return ''
  return `https://etherscan.io/token/${address}`
}

const loadPortfolio = async () => {
  if (!account.value) return
  
  isLoading.value = true
  try {
    // In production, fetch from multiple sources:
    // 1. Native ETH balance
    // 2. ERC20 token balances via contract calls
    // 3. NFT holdings
    // 4. DeFi positions
    
    await new Promise(resolve => setTimeout(resolve, 500))
    tokens.value = mockTokens
    totalValue.value = tokens.value.reduce((sum, t) => sum + t.value, 0)
  } catch (e) {
    console.error('Failed to load portfolio:', e)
  } finally {
    isLoading.value = false
  }
}

const getPercentage = (value: number): string => {
  if (totalValue.value === 0) return '0%'
  return ((value / totalValue.value) * 100).toFixed(1) + '%'
}

const getTokenColor = (index: number): string => {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ]
  return colors[index % colors.length]
}

onMounted(() => {
  if (account.value) {
    loadPortfolio()
  }
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Portfolio</h2>
      <select 
        v-model="sortBy"
        class="px-3 py-2 bg-slate-700 rounded-lg text-sm focus:outline-none"
      >
        <option value="value">Sort by Value</option>
        <option value="balance">Sort by Balance</option>
        <option value="name">Sort by Name</option>
      </select>
    </div>

    <!-- Total Value -->
    <div class="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
      <p class="text-slate-400 text-sm">Total Portfolio Value</p>
      <p class="text-3xl font-bold mt-1">{{ formatValue(totalValue) }}</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-slate-400 mt-2">Loading portfolio...</p>
    </div>

    <!-- Token List -->
    <div v-else class="space-y-3">
      <div 
        v-for="(token, index) in sortedTokens" 
        :key="token.address"
        class="p-4 bg-slate-900/50 rounded-xl hover:bg-slate-800/50 transition-colors"
      >
        <div class="flex items-center justify-between">
          <!-- Token Info -->
          <div class="flex items-center gap-3">
            <!-- Token Icon -->
            <div 
              :class="[
                'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-xl font-bold',
                getTokenColor(index)
              ]"
            >
              {{ token.symbol.charAt(0) }}
            </div>
            
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ token.name }}</span>
                <span class="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                  {{ token.symbol }}
                </span>
              </div>
              <p class="text-sm text-slate-400 mt-0.5">
                {{ formatBalance(token.balance, token.decimals) }} {{ token.symbol }}
              </p>
            </div>
          </div>

          <!-- Value -->
          <div class="text-right">
            <p class="font-semibold">{{ formatValue(token.value) }}</p>
            <div class="w-24 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div 
                :class="['h-full bg-gradient-to-r', getTokenColor(index)]"
                :style="{ width: getPercentage(token.value) }"
              ></div>
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ getPercentage(token.value) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && tokens.length === 0" class="text-center py-8 text-slate-400">
      <div class="text-4xl mb-3">💰</div>
      <p>No assets found</p>
      <p class="text-sm mt-1">Connect wallet to view portfolio</p>
    </div>

    <!-- Actions -->
    <div class="mt-6 pt-6 border-t border-slate-700 flex gap-3">
      <button class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors">
        + Add Token
      </button>
      <button class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors">
        📊 Analytics
      </button>
    </div>
  </div>
</template>
