<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  getDefiProtocols,
  getUniswapPositions,
  getAaveSupply,
  getCompoundPositions,
  getCurvePools,
  getProtocolApr,
  getDefiStats
} from '@/service/api/web3';

// State
const activeProtocol = ref('uniswap');
const walletAddress = ref('');
const isLoading = ref(false);
const selectedChain = ref(1);

// Protocol data
const protocols = ref<any[]>([]);
const positions = ref<any[]>([]);
const pools = ref<any[]>([]);
const aprData = ref<any>({});
const stats = ref<any>(null);

// Chains
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ARB' },
  { id: 8453, name: 'Base', symbol: 'BASE' },
];

// Load protocols
const loadProtocols = async () => {
  try {
    const response = await getDefiProtocols();
    protocols.value = response.data || [];
  } catch (error) {
    console.error('Failed to load protocols:', error);
  }
};

// Load positions for a specific protocol
const loadPositions = async () => {
  if (!walletAddress.value) return;
  
  isLoading.value = true;
  try {
    switch (activeProtocol.value) {
      case 'uniswap': {
        const uniswapRes = await getUniswapPositions(walletAddress.value, selectedChain.value);
        positions.value = uniswapRes.data || [];
        break;
      }
      case 'aave': {
        const aaveRes = await getAaveSupply(walletAddress.value, selectedChain.value);
        positions.value = aaveRes.data || [];
        break;
      }
      case 'compound': {
        const compoundRes = await getCompoundPositions(walletAddress.value, selectedChain.value);
        positions.value = compoundRes.data || [];
        break;
      }
      case 'curve': {
        const curveRes = await getCurvePools(selectedChain.value);
        pools.value = curveRes.data || [];
        break;
      }
    }
  } catch (error) {
    console.error('Failed to load positions:', error);
    positions.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Load APR data
const loadApr = async () => {
  try {
    const response = await getProtocolApr(activeProtocol.value, selectedChain.value);
    aprData.value = response.data || {};
  } catch (error) {
    console.error('Failed to load APR:', error);
  }
};

// Load DeFi stats
const loadStats = async () => {
  try {
    const response = await getDefiStats();
    stats.value = response.data;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

// Get protocol icon
const getProtocolIcon = (protocolId: string) => {
  const icons: Record<string, string> = {
    uniswap: '🦄',
    aave: '👻',
    compound: '🔷',
    curve: '💚',
    sushiswap: '🍣',
  };
  return icons[protocolId] || '📊';
};

// Current protocol info
const currentProtocol = computed(() => {
  return protocols.value.find(p => p.id === activeProtocol.value);
});

// Initialize
onMounted(() => {
  loadProtocols();
  loadStats();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold">🧪 DeFi Protocol Explorer</h2>
        <p class="text-sm text-slate-400">Explore and interact with DeFi protocols</p>
      </div>
      
      <!-- Chain Selector -->
      <select
        v-model="selectedChain"
        class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
        @change="loadPositions(); loadApr()"
      >
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.name }}
        </option>
      </select>
    </div>

    <!-- Protocol Tabs -->
    <div class="mb-6 flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="protocol in protocols"
        :key="protocol.id"
        class="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="[
          activeProtocol === protocol.id
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-slate-800/50 text-slate-400 hover:text-white'
        ]"
        @click="activeProtocol = protocol.id; loadPositions(); loadApr()"
      >
        <span class="text-lg">{{ protocol.logo }}</span>
        {{ protocol.name }}
      </button>
    </div>

    <!-- Current Protocol Info -->
    <div v-if="currentProtocol" class="mb-6 rounded-xl bg-slate-900/50 p-4">
      <div class="flex items-center gap-3">
        <span class="text-2xl">{{ currentProtocol.logo }}</span>
        <div>
          <p class="font-semibold">{{ currentProtocol.name }}</p>
          <p class="text-sm text-slate-400">{{ currentProtocol.description }}</p>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="action in currentProtocol.supportedActions"
          :key="action"
          class="rounded-full bg-slate-800 px-3 py-1 text-xs"
        >
          {{ action }}
        </span>
      </div>
    </div>

    <!-- Wallet Address Input -->
    <div class="mb-6">
      <label class="mb-2 block text-sm font-medium text-slate-400">Wallet Address</label>
      <div class="flex gap-2">
        <input
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address to view positions"
          class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <button
          class="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium transition-all hover:bg-purple-500"
          :disabled="!walletAddress || isLoading"
          @click="loadPositions()"
        >
          {{ isLoading ? 'Loading...' : 'Fetch' }}
        </button>
      </div>
    </div>

    <!-- APR Display -->
    <div v-if="Object.keys(aprData).length > 0" class="mb-6">
      <h3 class="mb-3 text-lg font-semibold">📈 Current APR</h3>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          v-for="(apr, asset) in aprData"
          :key="asset"
          class="rounded-xl bg-slate-900/50 p-3"
        >
          <p class="text-sm text-slate-400">{{ asset }}</p>
          <p class="text-xl font-bold text-green-400">{{ apr }}</p>
        </div>
      </div>
    </div>

    <!-- Uniswap Positions -->
    <div v-if="activeProtocol === 'uniswap' && positions.length > 0" class="mb-6">
      <h3 class="mb-3 text-lg font-semibold">🎯 Your Positions</h3>
      <div class="space-y-3">
        <div
          v-for="(position, idx) in positions"
          :key="idx"
          class="rounded-xl bg-slate-900/50 p-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-lg">🔄</span>
              <div>
                <p class="font-semibold">
                  {{ position.token0?.symbol || 'Token0' }} / {{ position.token1?.symbol || 'Token1' }}
                </p>
                <p class="text-sm text-slate-400">Fee: {{ position.fee }}%</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold">Liquidity: {{ parseInt(position.liquidity || '0').toLocaleString() }}</p>
              <p class="text-sm text-slate-400">ID: #{{ position.id }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aave Positions -->
    <div v-if="activeProtocol === 'aave' && positions.length > 0" class="mb-6">
      <h3 class="mb-3 text-lg font-semibold">👻 Your Aave Positions</h3>
      <div class="space-y-3">
        <div
          v-for="(position, idx) in positions"
          :key="idx"
          class="rounded-xl bg-slate-900/50 p-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold">{{ position.reserve?.symbol || 'Unknown' }}</p>
              <p class="text-sm text-slate-400">{{ position.reserve?.name }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-slate-400">Supplied: {{ position.currentATokenBalance }}</p>
              <p class="text-sm text-yellow-400">Borrowed: {{ position.currentStableDebt }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Curve Pools -->
    <div v-if="activeProtocol === 'curve'" class="mb-6">
      <h3 class="mb-3 text-lg font-semibold">💚 Curve Pools</h3>
      <div class="grid gap-3 lg:grid-cols-2">
        <div
          v-for="pool in pools"
          :key="pool.address"
          class="cursor-pointer rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-800"
        >
          <div class="mb-2 flex items-center justify-between">
            <p class="font-semibold">{{ pool.name }}</p>
            <span class="text-green-400">{{ pool.apr }}</span>
          </div>
          <p class="mb-2 text-sm text-slate-400">TVL: {{ pool.tvl }}</p>
          <div class="flex gap-1">
            <span
              v-for="token in pool.tokens"
              :key="token"
              class="rounded bg-slate-800 px-2 py-1 text-xs"
            >
              {{ token }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="walletAddress && positions.length === 0 && !isLoading && activeProtocol !== 'curve'"
      class="rounded-xl bg-slate-900/50 p-8 text-center"
    >
      <p class="text-slate-400">No positions found for this address</p>
    </div>

    <!-- DeFi Stats -->
    <div v-if="stats" class="mt-6 border-t border-slate-700/50 pt-6">
      <h3 class="mb-4 text-lg font-semibold">🌊 DeFi Market Stats</h3>
      <div class="mb-4">
        <p class="text-sm text-slate-400">Total Value Locked</p>
        <p class="text-2xl font-bold text-green-400">{{ stats.totalTvl }}</p>
      </div>
      <div class="mb-4">
        <p class="mb-2 text-sm text-slate-400">Top Protocols</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="protocol in stats.topProtocols"
            :key="protocol.name"
            class="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1"
          >
            <span>{{ protocol.logo }}</span>
            <span>{{ protocol.name }}</span>
            <span class="text-slate-400">{{ protocol.tvl }}</span>
          </span>
        </div>
      </div>
      <div>
        <p class="mb-2 text-sm text-slate-400">Recent Activity</p>
        <div class="space-y-2">
          <div
            v-for="activity in stats.recentActivity"
            :key="activity.time"
            class="flex items-center justify-between rounded-lg bg-slate-900/50 p-2 text-sm"
          >
            <div class="flex items-center gap-2">
              <span
                class="rounded px-2 py-0.5 text-xs"
                :class="{
                  'bg-green-500/20 text-green-400': activity.type === 'Supply',
                  'bg-blue-500/20 text-blue-400': activity.type === 'Swap',
                  'bg-yellow-500/20 text-yellow-400': activity.type === 'Borrow'
                }"
              >
                {{ activity.type }}
              </span>
              <span>{{ activity.protocol }}</span>
            </div>
            <div class="text-right">
              <span class="text-slate-400">{{ activity.amount }}</span>
              <span class="ml-2 text-slate-500">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
