<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface PoolPosition {
  id: string;
  token0: { address: string; symbol: string; name: string; decimals: number };
  token1: { address: string; symbol: string; name: string; decimals: number };
  fee: number;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  depositedToken0: string;
  depositedToken1: string;
  collectedFees: { token0: string; token1: string };
  pool: {
    address: string;
    fee: number;
    tick: number;
    token0Price: string;
    token1Price: string;
    volume24h: string;
    tvl: string;
  };
}

interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  fee: number;
  tvl: string;
  volume24h: string;
  apr: string;
  tick: number;
  token0Price: string;
  token1Price: string;
}

interface WalletPositions {
  address: string;
  positions: PoolPosition[];
  totalValueUSD: string;
  totalFeesEarnedUSD: string;
}

// State
const walletAddress = ref('');
const loading = ref(false);
const activeView = ref<'wallet' | 'pools' | 'create'>('wallet');
const walletPositions = ref<WalletPositions | null>(null);
const topPools = ref<PoolInfo[]>([]);
const selectedPool = ref<PoolInfo | null>(null);

// Form for creating position
const token0Address = ref('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const token1Address = ref('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
const feeTier = ref(3000);
const suggestedFee = ref<number | null>(null);

// Common tokens
const commonTokens = [
  { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin' },
  { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'Wrapped Ether' },
  { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'Wrapped Bitcoin' },
  { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'Dai Stablecoin' },
  { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether USD' },
];

// Fetch wallet positions
const fetchWalletPositions = async () => {
  if (!walletAddress.value) return;
  loading.value = true;
  try {
    const response = await fetch(`/api/web3/liquidity-pool/wallet/${walletAddress.value}`);
    const data = await response.json();
    walletPositions.value = data;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
  } finally {
    loading.value = false;
  }
};

// Fetch top pools
const fetchTopPools = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/web3/liquidity-pool/top-pools?limit=10');
    const data = await response.json();
    topPools.value = data;
  } catch (error) {
    console.error('Failed to fetch pools:', error);
  } finally {
    loading.value = false;
  }
};

// Get pool info
const getPoolInfo = async () => {
  if (!token0Address.value || !token1Address.value) return;
  loading.value = true;
  try {
    const response = await fetch(
      `/api/web3/liquidity-pool/pool-info?token0=${token0Address.value}&token1=${token1Address.value}&fee=${feeTier.value}`
    );
    const data = await response.json();
    selectedPool.value = data;
  } catch (error) {
    console.error('Failed to fetch pool info:', error);
  } finally {
    loading.value = false;
  }
};

// Get fee recommendation
const getFeeRecommendation = async () => {
  if (!token0Address.value || !token1Address.value) return;
  try {
    const token0 = commonTokens.find(t => t.address === token0Address.value);
    const token1 = commonTokens.find(t => t.address === token1Address.value);
    if (token0 && token1) {
      const response = await fetch(
        `/api/web3/liquidity-pool/fee-recommendation?token0=${token0.symbol}&token1=${token1.symbol}`
      );
      const data = await response.json();
      suggestedFee.value = data.recommendedFee;
      feeTier.value = data.recommendedFee;
    }
  } catch (error) {
    console.error('Failed to get fee recommendation:', error);
  }
};

// Format numbers
const formatNumber = (num: string | number) => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

// Get fee tier label
const getFeeLabel = (fee: number) => {
  const labels: Record<number, string> = {
    100: '0.01%',
    500: '0.05%',
    3000: '0.3%',
    10000: '1%',
  };
  return labels[fee] || `${fee / 10000}%`;
};

// Initialize
onMounted(() => {
  fetchTopPools();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">🦄 Liquidity Pool Monitor</h2>
        <p class="text-slate-400">Manage Uniswap V3 positions & track pools</p>
      </div>
      
      <!-- View Tabs -->
      <div class="flex gap-2">
        <button
          v-for="view in [
            { id: 'wallet', label: 'My Positions', icon: '💼' },
            { id: 'pools', label: 'Top Pools', icon: '📊' },
            { id: 'create', label: 'Create Position', icon: '➕' }
          ]"
          :key="view.id"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="[
            activeView === view.id
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
          ]"
          @click="activeView = view.id as any; if (view.id === 'pools') fetchTopPools()"
        >
          <span class="mr-2">{{ view.icon }}</span>
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Wallet Positions View -->
    <div v-show="activeView === 'wallet'" class="space-y-4">
      <!-- Search -->
      <div class="flex gap-3">
        <input
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address..."
          class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          @keyup.enter="fetchWalletPositions"
        />
        <button
          class="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700"
          :disabled="loading || !walletAddress"
          @click="fetchWalletPositions"
        >
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
      </div>

      <!-- Positions List -->
      <div v-if="walletPositions" class="space-y-4">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
            <p class="text-xs text-slate-400">Total Value</p>
            <p class="text-xl font-bold text-green-400">${{ formatNumber(walletPositions.totalValueUSD) }}</p>
          </div>
          <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
            <p class="text-xs text-slate-400">Fees Earned</p>
            <p class="text-xl font-bold text-purple-400">${{ formatNumber(walletPositions.totalFeesEarnedUSD) }}</p>
          </div>
          <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
            <p class="text-xs text-slate-400">Active Positions</p>
            <p class="text-xl font-bold text-blue-400">{{ walletPositions.positions.length }}</p>
          </div>
          <div class="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
            <p class="text-xs text-slate-400">Best Pool APR</p>
            <p class="text-xl font-bold text-yellow-400">24.5%</p>
          </div>
        </div>

        <!-- Position Cards -->
        <div v-for="position in walletPositions.positions" :key="position.id" class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">🔷</span>
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-xs font-bold">🟣</span>
              </div>
              <div>
                <p class="font-semibold text-white">{{ position.token0.symbol }}/{{ position.token1.symbol }}</p>
                <p class="text-xs text-slate-400">Fee: {{ getFeeLabel(position.fee) }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-white">${{ formatNumber(position.depositedToken0) }}</p>
              <p class="text-xs text-slate-400">+ ${{ formatNumber(parseFloat(position.depositedToken1) * 2498) }}</p>
            </div>
          </div>
          
          <!-- Range Info -->
          <div class="mt-3 flex items-center justify-between rounded-lg bg-slate-900/50 p-2 text-sm">
            <span class="text-slate-400">Price Range:</span>
            <span class="font-mono text-yellow-400">
              {{ (position.tickLower / 1000).toFixed(2) }}k - {{ (position.tickUpper / 1000).toFixed(2) }}k
            </span>
          </div>

          <!-- Fees Collected -->
          <div class="mt-2 flex items-center justify-between text-sm">
            <span class="text-slate-400">Collected Fees:</span>
            <div class="flex gap-3">
              <span class="text-green-400">{{ position.collectedFees.token0 }} {{ position.token0.symbol }}</span>
              <span class="text-green-400">{{ position.collectedFees.token1 }} {{ position.token1.symbol }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="py-12 text-center">
        <p class="text-slate-400">Enter a wallet address to view their Uniswap V3 positions</p>
      </div>
    </div>

    <!-- Top Pools View -->
    <div v-show="activeView === 'pools'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">🔥 Top Pools by TVL</h3>
        <button
          class="rounded-lg bg-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-600"
          @click="fetchTopPools"
        >
          🔄 Refresh
        </button>
      </div>

      <!-- Pools Table -->
      <div class="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/50">
        <table class="w-full">
          <thead class="border-b border-slate-700 bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Pool</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Fee</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">TVL</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">24h Volume</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">APR</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr v-for="pool in topPools" :key="pool.address" class="hover:bg-slate-700/30">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">🔷</span>
                  <div>
                    <p class="font-medium text-white">
                      {{ pool.token0 === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' ? 'USDC' : pool.token0.slice(0, 6) }}/
                      {{ pool.token1 === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' ? 'WETH' : pool.token1.slice(0, 6) }}
                    </p>
                    <p class="text-xs text-slate-500">{{ pool.address.slice(0, 10) }}...</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300">{{ getFeeLabel(pool.fee) }}</span>
              </td>
              <td class="px-4 py-3 text-right text-white">{{ pool.tvl }}</td>
              <td class="px-4 py-3 text-right text-white">{{ pool.volume24h }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-green-400 font-medium">{{ pool.apr }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button class="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700">
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Position View -->
    <div v-show="activeView === 'create'" class="space-y-6">
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h3 class="mb-4 text-lg font-semibold text-white">Create New Position</h3>
        
        <div class="grid gap-4 lg:grid-cols-2">
          <!-- Token 0 -->
          <div>
            <label class="mb-2 block text-sm text-slate-400">Token 0</label>
            <select
              v-model="token0Address"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              @change="getFeeRecommendation"
            >
              <option v-for="token in commonTokens" :key="token.address" :value="token.address">
                {{ token.symbol }} - {{ token.name }}
              </option>
            </select>
          </div>

          <!-- Token 1 -->
          <div>
            <label class="mb-2 block text-sm text-slate-400">Token 1</label>
            <select
              v-model="token1Address"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              @change="getFeeRecommendation"
            >
              <option v-for="token in commonTokens" :key="token.address" :value="token.address">
                {{ token.symbol }} - {{ token.name }}
              </option>
            </select>
          </div>

          <!-- Fee Tier -->
          <div>
            <label class="mb-2 block text-sm text-slate-400">Fee Tier</label>
            <select
              v-model="feeTier"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option :value="100">0.01% - Stable/Stable</option>
              <option :value="500">0.05% - Stable/Stable</option>
              <option :value="3000">0.3% - Standard</option>
              <option :value="10000">1% - Exotic/Volatile</option>
            </select>
            <p v-if="suggestedFee" class="mt-1 text-xs text-purple-400">
              💡 Suggested: {{ getFeeLabel(suggestedFee) }}
            </p>
          </div>

          <!-- Pool Info -->
          <div>
            <label class="mb-2 block text-sm text-slate-400">Pool Stats</label>
            <button
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-left text-slate-300 hover:border-purple-500"
              @click="getPoolInfo"
            >
              {{ selectedPool ? `TVL: ${selectedPool.tvl} | APR: ${selectedPool.apr}` : 'Click to load pool info' }}
            </button>
          </div>
        </div>

        <!-- Selected Pool Details -->
        <div v-if="selectedPool" class="mt-4 rounded-lg bg-slate-900/50 p-4">
          <h4 class="mb-2 font-semibold text-white">Pool Details</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-slate-400">Pool Address:</span>
              <p class="font-mono text-xs text-purple-400">{{ selectedPool.address }}</p>
            </div>
            <div>
              <span class="text-slate-400">24h Volume:</span>
              <p class="text-white">{{ selectedPool.volume24h }}</p>
            </div>
            <div>
              <span class="text-slate-400">Current Tick:</span>
              <p class="text-white">{{ selectedPool.tick }}</p>
            </div>
            <div>
              <span class="text-slate-400">Token0 Price:</span>
              <p class="text-white">{{ selectedPool.token0Price }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700"
            :disabled="!selectedPool"
          >
            ➕ Create Position
          </button>
          <button
            class="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-300 hover:bg-slate-700"
            @click="activeView = 'pools'"
          >
            📊 View Analytics
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
