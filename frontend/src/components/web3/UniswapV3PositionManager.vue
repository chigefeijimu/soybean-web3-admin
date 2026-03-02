<template>
  <div class="uniswap-v3-manager">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          🔄 Uniswap V3 Position Manager
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your Uniswap V3 liquidity positions
        </p>
      </div>
      <div class="flex gap-2">
        <select
          v-model="selectedChain"
          class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
        >
          <option :value="1">Ethereum</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
          <option :value="137">Polygon</option>
        </select>
        <button
          @click="refreshPositions"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
        <div class="text-sm opacity-80">Total Value Locked</div>
        <div class="text-2xl font-bold mt-1">${{ stats.totalValueUSD }}</div>
        <div class="text-sm mt-2 opacity-80">{{ stats.positionCount }} positions</div>
      </div>
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
        <div class="text-sm opacity-80">24h Fees</div>
        <div class="text-2xl font-bold mt-1">${{ stats.fees24h }}</div>
        <div class="text-sm mt-2 opacity-80">+{{ stats.feesChange }}%</div>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
        <div class="text-sm opacity-80">Average APR</div>
        <div class="text-2xl font-bold mt-1">{{ stats.avgAPR }}%</div>
        <div class="text-sm mt-2 opacity-80">Last 7 days</div>
      </div>
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
        <div class="text-sm opacity-80">Best Pool</div>
        <div class="text-lg font-bold mt-1 truncate">{{ stats.bestPool }}</div>
        <div class="text-sm mt-2 opacity-80">{{ stats.bestPoolAPR }}% APR</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          activeTab === tab.id
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- My Positions Tab -->
    <div v-if="activeTab === 'positions'" class="space-y-4">
      <div v-if="positions.length === 0" class="text-center py-12 text-gray-500">
        <div class="text-4xl mb-4">📊</div>
        <p>No positions found. Create your first position!</p>
      </div>
      
      <div v-else class="grid gap-4">
        <div
          v-for="position in positions"
          :key="position.id"
          class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="flex -space-x-2">
                <img :src="getTokenLogo(position.token0)" class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" />
                <img :src="getTokenLogo(position.token1)" class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" />
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ getTokenSymbol(position.token0) }}/{{ getTokenSymbol(position.token1) }}
                </div>
                <div class="text-sm text-gray-500">
                  Fee: <span class="text-blue-600">{{ position.fee / 10000 }}%</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                ${{ position.valueUSD }}
              </div>
              <div class="text-sm text-green-600">
                +${{ position.fees24h }} (24h)
              </div>
            </div>
          </div>

          <!-- Range Indicator -->
          <div class="mt-4">
            <div class="flex justify-between text-sm text-gray-500 mb-1">
              <span>{{ position.priceLower }}</span>
              <span>Price Range</span>
              <span>{{ position.priceUpper }}</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 rounded-full"
                :style="{ width: position.rangeWidth + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-sm mt-1">
              <span class="text-gray-500">Current: ${{ position.currentPrice }}</span>
              <span :class="position.inRange ? 'text-green-600' : 'text-red-600'">
                {{ position.inRange ? '✅ In Range' : '❌ Out of Range' }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-4">
            <button
              @click="viewPosition(position)"
              class="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg"
            >
              View Details
            </button>
            <button
              @click="increaseLiquidity(position)"
              class="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg"
            >
              Add Liquidity
            </button>
            <button
              @click="decreaseLiquidity(position)"
              class="px-3 py-1.5 text-sm bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-lg"
            >
              Remove
            </button>
            <button
              @click="collectFees(position)"
              class="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg"
            >
              Collect Fees
            </button>
          </div>
        </div>
      </div>

      <!-- Create Position Button -->
      <button
        @click="showCreateModal = true"
        class="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        + Create New Position
      </button>
    </div>

    <!-- Popular Pools Tab -->
    <div v-if="activeTab === 'pools'" class="space-y-4">
      <div class="grid gap-4">
        <div
          v-for="pool in popularPools"
          :key="pool.address"
          class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex -space-x-2">
                <img :src="getTokenLogo(pool.token0)" class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" />
                <img :src="getTokenLogo(pool.token1)" class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800" />
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ getTokenSymbol(pool.token0) }}/{{ getTokenSymbol(pool.token1) }}
                </div>
                <div class="text-sm text-gray-500">
                  Fee: {{ pool.fee / 10000 }}% • TVL: ${{ formatNumber(pool.tvl) }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-green-600">
                {{ pool.apr }}% APR
              </div>
              <div class="text-sm text-gray-500">
                Vol: ${{ formatNumber(pool.volume24h) }}
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button
              @click="createPositionFromPool(pool)"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Create Position
            </button>
            <button
              @click="viewPoolDetails(pool)"
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Tab -->
    <div v-if="activeTab === 'analytics'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Fee History</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          [Fee History Chart]
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">💰 APR Trends</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          [APR Trends Chart]
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Position Distribution</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          [Position Distribution Chart]
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏆 Top Performers</h3>
        <div class="space-y-3">
          <div v-for="(pos, idx) in topPerformers" :key="idx" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ idx + 1 }}.</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ pos.name }}</span>
            </div>
            <span class="text-green-600 font-medium">+{{ pos.apr }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Position Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Create New Position</h3>
          <button @click="showCreateModal = false" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Pair</label>
            <div class="flex items-center gap-2">
              <select v-model="newPosition.token0" class="flex-1 p-2 border rounded-lg">
                <option value="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2">WETH</option>
                <option value="0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599">WBTC</option>
              </select>
              <span class="text-gray-500">/</span>
              <select v-model="newPosition.token1" class="flex-1 p-2 border rounded-lg">
                <option value="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48">USDC</option>
                <option value="0x6B175474E89094C44Da98b954EesadCDEF9ce6CC">DAI</option>
                <option value="0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9">AAVE</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Tier</label>
            <div class="flex gap-2">
              <button
                v-for="fee in feeTiers"
                :key="fee.value"
                @click="newPosition.fee = fee.value"
                :class="[
                  'flex-1 py-2 rounded-lg text-sm font-medium',
                  newPosition.fee === fee.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                ]"
              >
                {{ fee.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount {{ getTokenSymbol(newPosition.token0) }}</label>
            <input
              v-model.number="newPosition.amount0"
              type="number"
              class="w-full p-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount {{ getTokenSymbol(newPosition.token1) }}</label>
            <input
              v-model.number="newPosition.amount1"
              type="number"
              class="w-full p-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="newPosition.priceLower"
                type="number"
                class="p-2 border rounded-lg"
                placeholder="Lower price"
              />
              <input
                v-model="newPosition.priceUpper"
                type="number"
                class="p-2 border rounded-lg"
                placeholder="Upper price"
              />
            </div>
            <button
              @click="calculateOptimalRange"
              class="mt-2 text-sm text-blue-600 hover:underline"
            >
              🎯 Calculate optimal range
            </button>
          </div>

          <div v-if="newPosition.priceLower && newPosition.priceUpper" class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <div>Range: ${{ newPosition.priceLower }} - ${{ newPosition.priceUpper }}</div>
              <div class="mt-1">Estimated APR: {{ estimatedAPR }}%</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showCreateModal = false"
            class="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="createPosition"
            class="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Position
          </button>
        </div>
      </div>
    </div>

    <!-- Position Details Modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Position Details</h3>
          <button @click="showDetailsModal = false" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div v-if="selectedPosition" class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="flex -space-x-2">
              <img :src="getTokenLogo(selectedPosition.token0)" class="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800" />
              <img :src="getTokenLogo(selectedPosition.token1)" class="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
            <div>
              <div class="text-xl font-bold text-gray-900 dark:text-white">
                {{ getTokenSymbol(selectedPosition.token0) }}/{{ getTokenSymbol(selectedPosition.token1) }}
              </div>
              <div class="text-gray-500">Fee: {{ selectedPosition.fee / 10000 }}%</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-gray-500">Value</div>
              <div class="text-xl font-bold text-gray-900 dark:text-white">${{ selectedPosition.valueUSD }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-gray-500">24h Fees</div>
              <div class="text-xl font-bold text-green-600">+${{ selectedPosition.fees24h }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-gray-500">Total Fees</div>
              <div class="text-xl font-bold text-purple-600">${{ selectedPosition.totalFees }}</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-gray-500">APR</div>
              <div class="text-xl font-bold text-blue-600">{{ selectedPosition.apr }}%</div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Price Range</h4>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">${{ selectedPosition.priceLower }}</span>
              <span class="text-gray-500">${{ selectedPosition.priceUpper }}</span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 rounded-full"
                :style="{ width: '60%' }"
              ></div>
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span>Current: ${{ selectedPosition.currentPrice }}</span>
              <span :class="selectedPosition.inRange ? 'text-green-600' : 'text-red-600'">
                {{ selectedPosition.inRange ? '✅ In Range' : '❌ Out of Range' }}
              </span>
            </div>
          </div>

          <div class="flex gap-3">
            <button @click="increaseLiquidity(selectedPosition)" class="flex-1 py-2 bg-green-600 text-white rounded-lg">
              Add Liquidity
            </button>
            <button @click="decreaseLiquidity(selectedPosition)" class="flex-1 py-2 bg-orange-600 text-white rounded-lg">
              Remove Liquidity
            </button>
            <button @click="collectFees(selectedPosition)" class="flex-1 py-2 bg-purple-600 text-white rounded-lg">
              Collect Fees
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const API_BASE = '/api/web3/uniswap-v3'

// State
const selectedChain = ref(1)
const activeTab = ref('positions')
const positions = ref<any[]>([])
const popularPools = ref<any[]>([])
const showCreateModal = ref(false)
const showDetailsModal = ref(false)
const selectedPosition = ref<any>(null)
const loading = ref(false)

// Stats
const stats = ref({
  totalValueUSD: '45,872.34',
  fees24h: '127.56',
  feesChange: 12.5,
  positionCount: 3,
  avgAPR: 22.5,
  bestPool: 'WETH/USDC',
  bestPoolAPR: 24.5
})

// Tabs
const tabs = [
  { id: 'positions', name: 'My Positions', icon: '📊' },
  { id: 'pools', name: 'Popular Pools', icon: '🔥' },
  { id: 'analytics', name: 'Analytics', icon: '📈' }
]

// Fee tiers
const feeTiers = [
  { value: 500, label: '0.05% (Stable)' },
  { value: 3000, label: '0.3% (Medium)' },
  { value: 10000, label: '1% (Exotic)' }
]

// New position form
const newPosition = ref({
  token0: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  token1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  fee: 3000,
  amount0: null as number | null,
  amount1: null as number | null,
  priceLower: '',
  priceUpper: ''
})

// Top performers
const topPerformers = ref([
  { name: 'WETH/USDC 0.3%', apr: 24.5 },
  { name: 'WBTC/WETH 0.3%', apr: 18.2 },
  { name: 'WETH/AAVE 0.3%', apr: 15.8 }
])

// Token info
const tokenInfo: Record<string, { symbol: string; logo: string }> = {
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': { symbol: 'WETH', logo: 'https://assets.coingecko.com/coins/images/2518/small/weth.png' },
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { symbol: 'USDC', logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': { symbol: 'WBTC', logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
  '0x6B175474E89094C44Da98b954EesadCDEF9ce6CC': { symbol: 'DAI', logo: 'https://assets.coingecko.com/coins/images/9956/small/4943.png' },
  '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': { symbol: 'AAVE', logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' }
}

const estimatedAPR = computed(() => {
  if (!newPosition.value.priceLower || !newPosition.value.priceUpper) return 0
  const range = (parseFloat(newPosition.value.priceUpper) - parseFloat(newPosition.value.priceLower)) / parseFloat(newPosition.value.priceLower)
  return (0.3 / range * 52).toFixed(1)
})

// Methods
function getTokenSymbol(address: string): string {
  return tokenInfo[address]?.symbol || address.slice(0, 6) + '...'
}

function getTokenLogo(address: string): string {
  return tokenInfo[address]?.logo || 'https://via.placeholder.com/40'
}

function formatNumber(num: string): string {
  return parseFloat(num).toLocaleString()
}

async function refreshPositions() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/positions/0x1234567890abcdef1234567890abcdef12345678?chainId=${selectedChain.value}`)
    const data = await res.json()
    positions.value = data.positions.map((p: any, idx: number) => ({
      ...p,
      valueUSD: ['45,872.34', '23,456.78', '12,345.67'][idx],
      fees24h: ['127.56', '89.23', '45.67'][idx],
      totalFees: ['4,567.89', '2,345.67', '1,234.56'][idx],
      priceLower: ['1,950', '24,500', '175,000'][idx],
      priceUpper: ['2,100', '30,000', '185,000'][idx],
      currentPrice: ['2,000', '28,000', '180,000'][idx],
      rangeWidth: [60, 70, 55][idx],
      inRange: [true, true, false][idx],
      apr: [24.5, 18.2, 15.8][idx]
    }))
    stats.value.totalValueUSD = data.totalValueUSD
    stats.value.fees24h = data.totalFees24h
  } catch (e) {
    console.error('Failed to fetch positions:', e)
  }
  loading.value = false
}

async function loadPopularPools() {
  try {
    const res = await fetch(`${API_BASE}/pools/popular?chainId=${selectedChain.value}`)
    const data = await res.json()
    popularPools.value = data.map((p: any, idx: number) => ({
      ...p,
      apr: [24.5, 18.2, 15.8][idx]
    }))
  } catch (e) {
    console.error('Failed to fetch pools:', e)
  }
}

function viewPosition(position: any) {
  selectedPosition.value = position
  showDetailsModal.value = true
}

function increaseLiquidity(position: any) {
  showDetailsModal.value = false
  newPosition.value.token0 = position.token0
  newPosition.value.token1 = position.token1
  newPosition.value.fee = position.fee
  showCreateModal.value = true
}

function decreaseLiquidity(position: any) {
  alert(`Remove liquidity from ${getTokenSymbol(position.token0)}/${getTokenSymbol(position.token1)}`)
}

function collectFees(position: any) {
  alert(`Collect fees from position`)
}

function createPositionFromPool(pool: any) {
  newPosition.value.token0 = pool.token0
  newPosition.value.token1 = pool.token1
  newPosition.value.fee = pool.fee
  showCreateModal.value = true
}

function viewPoolDetails(pool: any) {
  alert(`View pool details: ${pool.address}`)
}

async function calculateOptimalRange() {
  try {
    const res = await fetch(
      `${API_BASE}/price/range?token0=${newPosition.value.token0}&token1=${newPosition.value.token1}&fee=${newPosition.value.fee}&volatility=medium`
    )
    const data = await res.json()
    newPosition.value.priceLower = data.recommendedRange.lower
    newPosition.value.priceUpper = data.recommendedRange.upper
  } catch (e) {
    console.error('Failed to calculate range:', e)
  }
}

async function createPosition() {
  try {
    const res = await fetch(`${API_BASE}/position/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newPosition.value,
        chainId: selectedChain.value
      })
    })
    const data = await res.json()
    if (data.success) {
      alert('Position created successfully!')
      showCreateModal.value = false
      refreshPositions()
    }
  } catch (e) {
    console.error('Failed to create position:', e)
  }
}

onMounted(() => {
  refreshPositions()
  loadPopularPools()
})
</script>

<style scoped>
.uniswap-v3-manager {
  @apply p-6;
}
</style>
