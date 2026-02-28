<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'

interface Token {
  address: string
  name: string
  symbol: string
  balance: string
  value: number
}

const { account, chainId } = useWeb3()

const fromToken = ref<Token | null>(null)
const toToken = ref<Token | null>(null)
const fromAmount = ref('')
const toAmount = ref('')
const isLoading = ref(false)
const error = ref('')
const slippage = ref(0.5)

// Available tokens for swap
const availableTokens: Token[] = [
  { address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', symbol: 'ETH', balance: '2.5', value: 6250 },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin', symbol: 'USDC', balance: '5000', value: 5000 },
  { address: '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a', name: 'Dai', symbol: 'DAI', balance: '2500', value: 2500 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped Bitcoin', symbol: 'WBTC', balance: '0.1', value: 6250 },
]

const fromTokenBalance = computed(() => fromToken.value?.balance || '0')
const toTokenBalance = computed(() => toToken.value?.balance || '0')

// Mock exchange rate (in production, fetch from DEX API)
const exchangeRate = computed(() => {
  if (!fromToken.value || !toToken.value) return 0
  
  // Mock rates
  const rates: Record<string, Record<string, number>> = {
    'ETH': { 'USDC': 2500, 'DAI': 2500, 'WBTC': 0.04 },
    'USDC': { 'ETH': 0.0004, 'DAI': 1, 'WBTC': 0.000016 },
    'DAI': { 'ETH': 0.0004, 'USDC': 1, 'WBTC': 0.000016 },
    'WBTC': { 'ETH': 25, 'USDC': 62500, 'DAI': 62500 },
  }
  
  return rates[fromToken.value.symbol]?.[toToken.value.symbol] || 0
})

const minReceive = computed(() => {
  if (!toAmount.value) return '0'
  const amount = parseFloat(toAmount.value)
  const slippageAmount = amount * (slippage.value / 100)
  return (amount - slippageAmount).toFixed(6)
})

const priceImpact = computed(() => {
  const amount = parseFloat(fromAmount.value) || 0
  if (amount > 10000) return '>5%'
  if (amount > 1000) return '2-5%'
  return '<0.5%'
})

const gasEstimate = computed(() => {
  if (!fromToken.value || !toToken.value) return '~0.005 ETH'
  if (fromToken.value.symbol === 'ETH' || toToken.value.symbol === 'ETH') {
    return '~0.005 ETH'
  }
  return '~0.01 ETH'
})

// Calculate output when input changes
watch([fromAmount, fromToken, toToken], () => {
  if (!fromAmount.value || !exchangeRate.value) {
    toAmount.value = ''
    return
  }
  
  const amount = parseFloat(fromAmount.value)
  if (isNaN(amount)) {
    toAmount.value = ''
    return
  }
  
  toAmount.value = (amount * exchangeRate.value).toFixed(6)
})

const handleSwap = async () => {
  if (!account.value) {
    error.value = 'Please connect wallet first'
    return
  }
  
  if (!fromToken.value || !toToken.value || !fromAmount.value) {
    error.value = 'Please select tokens and enter amount'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    // In production, integrate with Uniswap, Sushiswap, etc.
    // This is a simulation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Would initiate the swap transaction here
    alert(`Swap simulation: ${fromAmount.value} ${fromToken.value.symbol} → ${toAmount.value} ${toToken.value.symbol}`)
  } catch (e: any) {
    error.value = e.message || 'Swap failed'
  } finally {
    isLoading.value = false
  }
}

const setMaxAmount = () => {
  fromAmount.value = fromTokenBalance.value
}

const switchTokens = () => {
  const temp = fromToken.value
  fromToken.value = toToken.value
  toToken.value = temp
  
  // Clear amounts when switching
  fromAmount.value = ''
  toAmount.value = ''
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
    <h2 class="text-xl font-semibold mb-6">Swap Tokens</h2>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex justify-between items-center">
      <span class="text-red-300 text-sm">{{ error }}</span>
      <button @click="error = ''" class="text-red-400 hover:text-white">✕</button>
    </div>

    <!-- From Token -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <label class="text-sm text-slate-400">From</label>
        <button 
          @click="setMaxAmount"
          class="text-sm text-purple-400 hover:text-purple-300"
        >
          Balance: {{ fromTokenBalance }}
        </button>
      </div>
      
      <div class="flex gap-3">
        <select 
          v-model="fromToken"
          class="w-32 px-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none"
        >
          <option :value="null">Select</option>
          <option v-for="token in availableTokens" :key="token.address" :value="token">
            {{ token.symbol }}
          </option>
        </select>
        
        <input 
          v-model="fromAmount"
          type="number"
          placeholder="0.0"
          class="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-right text-xl font-semibold"
        />
      </div>
    </div>

    <!-- Swap Button -->
    <div class="flex justify-center -my-2 relative z-10">
      <button 
        @click="switchTokens"
        class="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors border-4 border-slate-800"
      >
        ⇄
      </button>
    </div>

    <!-- To Token -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <label class="text-sm text-slate-400">To</label>
        <span class="text-sm text-slate-500">
          Balance: {{ toTokenBalance }}
        </span>
      </div>
      
      <div class="flex gap-3">
        <select 
          v-model="toToken"
          class="w-32 px-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none"
        >
          <option :value="null">Select</option>
          <option v-for="token in availableTokens" :key="token.address" :value="token">
            {{ token.symbol }}
          </option>
        </select>
        
        <input 
          v-model="toAmount"
          type="text"
          placeholder="0.0"
          readonly
          class="flex-1 px-4 py-3 bg-slate-900/30 border border-slate-700 rounded-xl text-right text-xl font-semibold text-slate-400"
        />
      </div>
    </div>

    <!-- Exchange Rate -->
    <div v-if="fromToken && toToken && exchangeRate" class="mb-6 p-3 bg-slate-900/50 rounded-xl">
      <div class="flex justify-between text-sm">
        <span class="text-slate-400">Rate</span>
        <span>1 {{ fromToken.symbol }} = {{ exchangeRate }} {{ toToken.symbol }}</span>
      </div>
      <div class="flex justify-between text-sm mt-2">
        <span class="text-slate-400">Price Impact</span>
        <span class="text-green-400">{{ priceImpact }}</span>
      </div>
      <div class="flex justify-between text-sm mt-2">
        <span class="text-slate-400">Slippage</span>
        <span>{{ slippage }}%</span>
      </div>
      <div class="flex justify-between text-sm mt-2">
        <span class="text-slate-400">Min. Receive</span>
        <span>{{ minReceive }} {{ toToken?.symbol }}</span>
      </div>
      <div class="flex justify-between text-sm mt-2">
        <span class="text-slate-400">Gas Estimate</span>
        <span>{{ gasEstimate }}</span>
      </div>
    </div>

    <!-- Slippage Settings -->
    <div class="mb-6">
      <label class="text-sm text-slate-400 mb-2 block">Slippage Tolerance</label>
      <div class="flex gap-2">
        <button 
          v-for="s in [0.1, 0.5, 1]"
          :key="s"
          @click="slippage = s"
          :class="[
            'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
            slippage === s 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
              : 'bg-slate-700 text-slate-400 hover:text-white'
          ]"
        >
          {{ s }}%
        </button>
        <input 
          v-model="slippage"
          type="number"
          step="0.1"
          class="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-center text-sm"
        />
      </div>
    </div>

    <!-- Swap Button -->
    <button 
      @click="handleSwap"
      :disabled="isLoading || !fromToken || !toToken || !fromAmount"
      class="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-all hover:scale-[1.02]"
    >
      {{ isLoading ? 'Swapping...' : !account ? 'Connect Wallet' : 'Swap' }}
    </button>

    <!-- Powered By -->
    <div class="mt-4 text-center text-xs text-slate-500">
      Powered by Uniswap V3 • Sushiswap • Curve
    </div>
  </div>
</template>
