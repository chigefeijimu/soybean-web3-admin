<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';
import { ethers } from 'ethers';

const { chainId, isConnected, provider } = useWeb3();

// State
const searchQuery = ref('');
const selectedProtocol = ref('uniswap');
const sortBy = ref('tvl');
const loading = ref(false);
const error = ref('');

// Sample pools data (in production, this would come from API)
const samplePools = ref([
  {
    id: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    token0: { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    token1: { symbol: 'ETH', name: 'Ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    fee: 3000,
    tvl: 285000000,
    volume24h: 156000000,
    apr: 24.5,
    poolToken: '0x88e6A0c2dDD26FEeb64f039A2C41296FcB3f5640'
  },
  {
    id: '0x4e68cc9b3e5e5ddb5b7a3b2e7b5d8c1a5e9b3e7',
    token0: { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    token1: { symbol: 'ETH', name: 'Ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    fee: 3000,
    tvl: 198000000,
    volume24h: 89000000,
    apr: 18.2,
    poolToken: '0x4e68Cc9B3E5e5dDb5B7A3b2e7B5D8c1a5E9b3e7'
  },
  {
    id: '0x7d1a7c9c9b3e5d5c1a5e9b3e7d9f1a3c5e7b9d1',
    token0: { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
    token1: { symbol: 'ETH', name: 'Ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    fee: 3000,
    tvl: 156000000,
    volume24h: 67000000,
    apr: 12.8,
    poolToken: '0x7d1A7C9c9B3E5d5c1a5E9b3e7D9f1A3c5E7B9d1'
  },
  {
    token0: { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
    token1: { symbol: 'ETH', name: 'Ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    fee: 3000,
    tvl: 89000000,
    volume24h: 34000000,
    apr: 15.3,
    id: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    poolToken: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
  },
  {
    token0: { symbol: 'LINK', name: 'Chainlink', address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
    token1: { symbol: 'ETH', name: 'Ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    fee: 3000,
    tvl: 67000000,
    volume24h: 28000000,
    apr: 19.7,
    id: '0x514910771af9ca656af840dff83e8264ecf986ca-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    poolToken: '0x514910771af9ca656af840dff83e8264ecf986ca'
  },
  {
    token0: { symbol: 'AAVE', name: 'Aave', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
    token1: { symbol: 'ETH', name: 'Ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
    fee: 3000,
    tvl: 45000000,
    volume24h: 18000000,
    apr: 14.2,
    id: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    poolToken: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'
  },
  {
    token0: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    token1: { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    fee: 100,
    tvl: 234000000,
    volume24h: 189000000,
    apr: 8.5,
    id: '0x6b175474e89094c44da98b954eedeac495271d0f-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    poolToken: '0x6b175474e89094c44da98b954eedeac495271d0f'
  },
  {
    token0: { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    token1: { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    fee: 100,
    tvl: 312000000,
    volume24h: 245000000,
    apr: 6.2,
    id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xdac17f958d2ee523a2206206994597c13d831ec7',
    poolToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  }
]);

// Protocols
const protocols = [
  { id: 'uniswap', name: 'Uniswap V3', logo: '🦄' },
  { id: 'sushiswap', name: 'SushiSwap', logo: '🍣' },
  { id: 'curve', name: 'Curve', logo: '💚' },
  { id: 'balancer', name: 'Balancer', logo: '🔴' }
];

// Sort options
const sortOptions = [
  { value: 'tvl', label: 'TVL (Liquidity)' },
  { value: 'volume', label: '24h Volume' },
  { value: 'apr', label: 'APR' },
  { value: 'newest', label: 'Newest' }
];

// Filter and sort pools
const filteredPools = computed(() => {
  let pools = [...samplePools.value];
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    pools = pools.filter(pool => 
      pool.token0.symbol.toLowerCase().includes(query) ||
      pool.token1.symbol.toLowerCase().includes(query) ||
      pool.token0.name.toLowerCase().includes(query) ||
      pool.token1.name.toLowerCase().includes(query)
    );
  }
  
  // Sort
  switch (sortBy.value) {
    case 'tvl':
      pools.sort((a, b) => b.tvl - a.tvl);
      break;
    case 'volume':
      pools.sort((a, b) => b.volume24h - a.volume24h);
      break;
    case 'apr':
      pools.sort((a, b) => b.apr - a.apr);
      break;
    case 'newest':
      pools.sort((a, b) => b.id.localeCompare(a.id));
      break;
  }
  
  return pools;
});

// Format numbers
function formatNumber(num: number): string {
  if (num >= 1e9) {
    return '$' + (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return '$' + (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return '$' + (num / 1e3).toFixed(2) + 'K';
  }
  return '$' + num.toFixed(2);
}

function formatVolume(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
}

// Get fee tier label
function getFeeTier(fee: number): string {
  switch (fee) {
    case 100:
      return '0.01%';
    case 500:
      return '0.05%';
    case 3000:
      return '0.3%';
    case 10000:
      return '1%';
    default:
      return (fee / 10000) + '%';
  }
}

// Get color for APR
function getAprColor(apr: number): string {
  if (apr >= 20) return 'text-green-400';
  if (apr >= 10) return 'text-yellow-400';
  return 'text-orange-400';
}

// View pool details
const selectedPool = ref<any>(null);
const showPoolModal = ref(false);

function viewPoolDetails(pool: any) {
  selectedPool.value = pool;
  showPoolModal.value = true;
}

function closePoolModal() {
  showPoolModal.value = false;
  selectedPool.value = null;
}

// Add to watchlist
const watchlist = ref<string[]>([]);
function toggleWatchlist(poolId: string) {
  const index = watchlist.value.indexOf(poolId);
  if (index > -1) {
    watchlist.value.splice(index, 1);
  } else {
    watchlist.value.push(poolId);
  }
}

function isInWatchlist(poolId: string): boolean {
  return watchlist.value.includes(poolId);
}

// Calculate impermanent loss (simplified)
function calculateIL(priceChange: number): string {
  const ratio = 1 + priceChange / 100;
  const il = (2 * Math.sqrt(ratio) / (1 + ratio) - 1) * 100;
  return il.toFixed(2) + '%';
}

// Total TVL
const totalTVL = computed(() => {
  return samplePools.value.reduce((sum, pool) => sum + pool.tvl, 0);
});

// Total volume
const totalVolume = computed(() => {
  return samplePools.value.reduce((sum, pool) => sum + pool.volume24h, 0);
});

// Average APR
const averageAPR = computed(() => {
  const total = samplePools.value.reduce((sum, pool) => sum + pool.apr, 0);
  return (total / samplePools.value.length).toFixed(1);
});
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold">🔥 Liquidity Pool Scanner</h2>
        <p class="text-sm text-slate-400">Discover & analyze DeFi liquidity pools</p>
      </div>
      
      <!-- Protocol Selector -->
      <div class="flex gap-2">
        <button
          v-for="protocol in protocols"
          :key="protocol.id"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
          :class="[
            selectedProtocol === protocol.id
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          ]"
          @click="selectedProtocol = protocol.id"
        >
          <span>{{ protocol.logo }}</span>
          <span>{{ protocol.name }}</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">Total TVL</p>
        <p class="text-lg font-semibold text-green-400">{{ formatNumber(totalTVL) }}</p>
      </div>
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">24h Volume</p>
        <p class="text-lg font-semibold text-blue-400">{{ formatNumber(totalVolume) }}</p>
      </div>
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">Avg APR</p>
        <p class="text-lg font-semibold text-yellow-400">{{ averageAPR }}%</p>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tokens (e.g., ETH, USDC, BTC...)"
          class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>
      <select
        v-model="sortBy"
        class="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Pool List -->
    <div class="space-y-3">
      <div
        v-for="pool in filteredPools"
        :key="pool.id"
        class="group cursor-pointer rounded-xl bg-slate-900/50 p-4 transition-all hover:bg-slate-800/50"
        @click="viewPoolDetails(pool)"
      >
        <div class="flex items-center justify-between">
          <!-- Token Pair -->
          <div class="flex items-center gap-3">
            <div class="flex -space-x-2">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-lg">
                {{ pool.token0.symbol.charAt(0) }}
              </div>
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-lg">
                {{ pool.token1.symbol.charAt(0) }}
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ pool.token0.symbol }}</span>
                <span class="text-slate-500">/</span>
                <span class="font-semibold">{{ pool.token1.symbol }}</span>
                <span class="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                  {{ getFeeTier(pool.fee) }}
                </span>
              </div>
              <p class="text-xs text-slate-400">{{ pool.token0.name }} / {{ pool.token1.name }}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-6">
            <div class="text-right">
              <p class="text-xs text-slate-400">TVL</p>
              <p class="font-semibold">{{ formatNumber(pool.tvl) }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-400">24h Vol</p>
              <p class="font-semibold">{{ formatVolume(pool.volume24h) }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-400">APR</p>
              <p class="font-semibold" :class="getAprColor(pool.apr)">{{ pool.apr }}%</p>
            </div>
            
            <!-- Watchlist Button -->
            <button
              class="rounded-lg p-2 opacity-0 transition-opacity group-hover:opacity-100"
              :class="isInWatchlist(pool.id) ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'"
              @click.stop="toggleWatchlist(pool.id)"
            >
              {{ isInWatchlist(pool.id) ? '★' : '☆' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredPools.length === 0"
        class="py-12 text-center text-slate-400"
      >
        <div class="mb-4 text-4xl">🔍</div>
        <p>No pools found matching your search</p>
      </div>
    </div>

    <!-- Pool Details Modal -->
    <Teleport to="body">
      <div
        v-if="showPoolModal && selectedPool"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click="closePoolModal"
      >
        <div
          class="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-6"
          @click.stop
        >
          <!-- Header -->
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-xl">
                  {{ selectedPool.token0.symbol.charAt(0) }}
                </div>
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-xl">
                  {{ selectedPool.token1.symbol.charAt(0) }}
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold">{{ selectedPool.token0.symbol }} / {{ selectedPool.token1.symbol }}</h3>
                <p class="text-sm text-slate-400">{{ selectedPool.token0.name }} / {{ selectedPool.token1.name }}</p>
              </div>
            </div>
            <button
              class="rounded-lg p-2 text-slate-400 hover:bg-slate-700"
              @click="closePoolModal"
            >
              ✕
            </button>
          </div>

          <!-- Stats Grid -->
          <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">TVL</p>
              <p class="text-lg font-semibold text-green-400">{{ formatNumber(selectedPool.tvl) }}</p>
            </div>
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">24h Volume</p>
              <p class="text-lg font-semibold text-blue-400">{{ formatNumber(selectedPool.volume24h) }}</p>
            </div>
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">APR</p>
              <p class="text-lg font-semibold text-yellow-400">{{ selectedPool.apr }}%</p>
            </div>
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">Fee Tier</p>
              <p class="text-lg font-semibold">{{ getFeeTier(selectedPool.fee) }}</p>
            </div>
          </div>

          <!-- Pool Info -->
          <div class="mb-6 space-y-3">
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Pool Address</span>
              <span class="font-mono text-sm">{{ selectedPool.id.slice(0, 10) }}...{{ selectedPool.id.slice(-8) }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">{{ selectedPool.token0.symbol }} Address</span>
              <span class="font-mono text-sm">{{ selectedPool.token0.address.slice(0, 10) }}...</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">{{ selectedPool.token1.symbol }} Address</span>
              <span class="font-mono text-sm">{{ selectedPool.token1.address.slice(0, 10) }}...</span>
            </div>
          </div>

          <!-- Impermanent Loss Calculator -->
          <div class="rounded-xl bg-slate-900/50 p-4">
            <h4 class="mb-3 font-semibold">📉 Impermanent Loss Calculator</h4>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-xs text-slate-400">-50%</p>
                <p class="text-sm font-semibold text-red-400">{{ calculateIL(-50) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">+50%</p>
                <p class="text-sm font-semibold text-red-400">{{ calculateIL(50) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">+100%</p>
                <p class="text-sm font-semibold text-red-400">{{ calculateIL(100) }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex gap-3">
            <button
              class="flex-1 rounded-xl bg-purple-500/20 py-3 font-semibold text-purple-400 transition-all hover:bg-purple-500/30"
              @click="toggleWatchlist(selectedPool.id); closePoolModal()"
            >
              {{ isInWatchlist(selectedPool.id) ? '★ Remove from Watchlist' : '☆ Add to Watchlist' }}
            </button>
            <button
              class="flex-1 rounded-xl bg-blue-500/20 py-3 font-semibold text-blue-400 transition-all hover:bg-blue-500/30"
            >
              Add Liquidity →
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
