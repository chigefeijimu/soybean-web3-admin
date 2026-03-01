<script setup lang="ts">
import { ref, computed } from 'vue'

// Types
interface Order {
  type: 'limit' | 'market'
  side: 'buy' | 'sell'
  price: number
  amount: number
  total: number
  percentage: number
}

// State
const orderSide = ref<'buy' | 'sell'>('buy')
const orderType = ref<'limit' | 'market'>('limit')
const price = ref(2500.0)
const amount = ref(0.0)
const slippage = ref(0.5)

const buyOrders = ref([
  { price: 2502.0, amount: 2.5, total: 6255.0 },
  { price: 2501.5, amount: 1.8, total: 4502.7 },
  { price: 2501.0, amount: 3.2, total: 8003.2 },
  { price: 2500.5, amount: 1.5, total: 3750.75 },
  { price: 2500.0, amount: 2.0, total: 5000.0 },
])

const sellOrders = ref([
  { price: 2500.0, amount: 1.5, total: 3750.0 },
  { price: 2499.5, amount: 2.0, total: 4999.0 },
  { price: 2499.0, amount: 1.8, total: 4498.2 },
  { price: 2498.5, amount: 3.0, total: 7495.5 },
  { price: 2498.0, amount: 2.2, total: 5495.6 },
])

const isSubmitting = ref(false)
const showConfirm = ref(false)

// Computed
const total = computed(() => {
  return price.value * amount.value
})

const totalWithSlippage = computed(() => {
  return total.value * (1 + slippage.value / 100)
})

const maxAmount = computed(() => {
  // Mock: max available to trade
  return 10.0
})

const orderPercentage = (percent: number) => {
  amount.value = maxAmount.value * (percent / 100)
}

// Methods
const setOrderSide = (side: 'buy' | 'sell') => {
  orderSide.value = side
}

const placeOrder = async () => {
  isSubmitting.value = true
  
  // Simulate transaction
  await new Promise(r => setTimeout(r, 1500))
  
  isSubmitting.value = false
  showConfirm.value = false
  amount.value = 0
  
  // Show success (in real app, would show notification)
  alert('Order placed successfully!')
}

const formatNumber = (num: number, decimals = 2) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
    <h2 class="text-xl font-semibold mb-4">Trade</h2>
    
    <!-- Order Type Tabs -->
    <div class="flex gap-2 mb-4">
      <button 
        @click="orderType = 'limit'"
        :class="[
          'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
          orderType === 'limit' 
            ? 'bg-slate-700 text-white' 
            : 'bg-slate-900/50 text-slate-400 hover:text-white'
        ]"
      >
        Limit
      </button>
      <button 
        @click="orderType = 'market'"
        :class="[
          'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
          orderType === 'market' 
            ? 'bg-slate-700 text-white' 
            : 'bg-slate-900/50 text-slate-400 hover:text-white'
        ]"
      >
        Market
      </button>
    </div>
    
    <!-- Buy/Sell Tabs -->
    <div class="flex gap-2 mb-4">
      <button 
        @click="setOrderSide('buy')"
        :class="[
          'flex-1 py-3 rounded-lg font-semibold transition-colors',
          orderSide === 'buy'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        ]"
      >
        Buy
      </button>
      <button 
        @click="setOrderSide('sell')"
        :class="[
          'flex-1 py-3 rounded-lg font-semibold transition-colors',
          orderSide === 'sell'
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        ]"
      >
        Sell
      </button>
    </div>
    
    <!-- Price Input (Limit only) -->
    <div v-if="orderType === 'limit'" class="mb-4">
      <label class="block text-sm text-slate-400 mb-1">Price (USDC)</label>
      <div class="relative">
        <input 
          v-model.number="price"
          type="number"
          step="0.01"
          class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">USDC</span>
      </div>
    </div>
    
    <!-- Amount Input -->
    <div class="mb-4">
      <label class="block text-sm text-slate-400 mb-1">Amount (ETH)</label>
      <div class="relative">
        <input 
          v-model.number="amount"
          type="number"
          step="0.001"
          min="0"
          class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
          @click="amount = maxAmount"
          class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
        >
          MAX
        </button>
      </div>
    </div>
    
    <!-- Quick Percentages -->
    <div class="flex gap-2 mb-4">
      <button 
        v-for="pct in [25, 50, 75, 100]"
        :key="pct"
        @click="orderPercentage(pct)"
        class="flex-1 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300"
      >
        {{ pct }}%
      </button>
    </div>
    
    <!-- Slippage (Sell only) -->
    <div v-if="orderSide === 'sell'" class="mb-4">
      <label class="block text-sm text-slate-400 mb-1">Slippage: {{ slippage }}%</label>
      <input 
        v-model.number="slippage"
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        class="w-full"
      />
    </div>
    
    <!-- Total -->
    <div class="mb-4 p-3 bg-slate-900/50 rounded-xl">
      <div class="flex justify-between text-sm">
        <span class="text-slate-400">Total</span>
        <span class="font-semibold">{{ formatNumber(total) }} USDC</span>
      </div>
      <div v-if="slippage" class="flex justify-between text-sm mt-1">
        <span class="text-slate-400">Max {{ orderSide === 'buy' ? 'Cost' : 'Receive' }}</span>
        <span class="text-slate-300">{{ formatNumber(totalWithSlippage) }} USDC</span>
      </div>
    </div>
    
    <!-- Submit Button -->
    <button 
      @click="showConfirm = true"
      :disabled="!amount || isSubmitting"
      :class="[
        'w-full py-3 rounded-xl font-semibold transition-all',
        orderSide === 'buy'
          ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-500/50'
          : 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/50',
        'disabled:cursor-not-allowed'
      ]"
    >
      {{ isSubmitting ? 'Processing...' : `${orderSide === 'buy' ? 'Buy' : 'Sell'} ETH` }}
    </button>
    
    <!-- Order Book Preview -->
    <div class="mt-4 pt-4 border-t border-slate-700">
      <h3 class="text-sm font-medium text-slate-400 mb-2">Order Book</h3>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <!-- Sell Orders -->
        <div class="space-y-1">
          <div class="flex justify-between text-slate-500">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div 
            v-for="(order, i) in sellOrders.slice(0, 3)" 
            :key="i"
            class="flex justify-between text-red-400"
          >
            <span>{{ order.price.toFixed(1) }}</span>
            <span>{{ order.amount.toFixed(3) }}</span>
          </div>
        </div>
        <!-- Buy Orders -->
        <div class="space-y-1">
          <div class="flex justify-between text-slate-500">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div 
            v-for="(order, i) in buyOrders.slice(0, 3)" 
            :key="i"
            class="flex justify-between text-green-400"
          >
            <span>{{ order.price.toFixed(1) }}</span>
            <span>{{ order.amount.toFixed(3) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <div v-if="showConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-slate-800 p-6 rounded-2xl max-w-sm w-full mx-4 border border-slate-700">
        <h3 class="text-lg font-semibold mb-4">Confirm {{ orderSide === 'buy' ? 'Buy' : 'Sell' }}</h3>
        <div class="space-y-2 mb-4">
          <div class="flex justify-between">
            <span class="text-slate-400">Type</span>
            <span>{{ orderType === 'market' ? 'Market' : 'Limit' }} {{ orderSide.toUpperCase() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Price</span>
            <span>${{ formatNumber(price) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Amount</span>
            <span>{{ formatNumber(amount, 4) }} ETH</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Total</span>
            <span>${{ formatNumber(totalWithSlippage) }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button 
            @click="showConfirm = false"
            class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl"
          >
            Cancel
          </button>
          <button 
            @click="placeOrder"
            :class="[
              'flex-1 py-2 rounded-xl font-semibold',
              orderSide === 'buy' ? 'bg-green-500' : 'bg-red-500'
            ]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
