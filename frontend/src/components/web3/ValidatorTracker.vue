<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface Validator {
  validatorAddress: string;
  chain: string;
  moniker: string;
  status: string;
  uptime: number;
  commission: number;
  delegators: number;
  tokens: string;
  rank?: number;
  Apr?: number;
  slashHistory?: SlashInfo[];
}

interface SlashInfo {
  height: number;
  timestamp: string;
  reason: string;
  amount: string;
}

interface ChainStats {
  chain: string;
  totalValidators: number;
  activeValidators: number;
  totalStaked: string;
  avgUptime: number;
  avgApr: number;
}

interface StakingPool {
  name: string;
  tvl: string;
  Apr: number;
  minStake: string;
  url: string;
}

const API_BASE = 'http://localhost:3017/api/validator';

const isLoading = ref(true);
const error = ref('');
const selectedChain = ref('ethereum');
const validators = ref<Validator[]>([]);
const chainStats = ref<ChainStats | null>(null);
const stakingPools = ref<StakingPool[]>([]);
const activeView = ref('validators'); // validators, stats, pools

const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔷', symbol: 'ETH' },
  { id: 'cosmos', name: 'Cosmos', icon: '🪐', symbol: 'ATOM' },
  { id: 'polygon', name: 'Polygon', icon: '🟣', symbol: 'MATIC' },
  { id: 'solana', name: 'Solana', icon: '🟡', symbol: 'SOL' }
];

const fetchValidators = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${API_BASE}/${selectedChain.value}?status=active`);
    const result = await response.json();
    
    if (result.success) {
      validators.value = result.data;
    } else {
      error.value = result.error || 'Failed to fetch validators';
    }
  } catch (e: any) {
    error.value = 'Failed to connect to API';
  } finally {
    isLoading.value = false;
  }
};

const fetchChainStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/${selectedChain.value}/stats`);
    const result = await response.json();
    
    if (result.success) {
      chainStats.value = result.data;
    }
  } catch (e) {
    console.error('Failed to fetch chain stats:', e);
  }
};

const fetchStakingPools = async () => {
  try {
    const response = await fetch(`${API_BASE}/${selectedChain.value}/pools`);
    const result = await response.json();
    
    if (result.success) {
      stakingPools.value = result.data;
    }
  } catch (e) {
    console.error('Failed to fetch staking pools:', e);
  }
};

const loadData = async () => {
  await fetchValidators();
  await fetchChainStats();
  await fetchStakingPools();
};

const getStatusColor = (status: string) => {
  if (status === 'active') return 'bg-green-500';
  if (status === 'inactive') return 'bg-red-500';
  return 'bg-yellow-500';
};

const getUptimeColor = (uptime: number) => {
  if (uptime >= 99.9) return 'text-green-400';
  if (uptime >= 99) return 'text-yellow-400';
  return 'text-red-400';
};

const getRiskLevel = (uptime: number, commission: number) => {
  const score = uptime - commission * 0.1;
  if (score >= 99) return { text: 'LOW', color: 'text-green-400' };
  if (score >= 98) return { text: 'MEDIUM', color: 'text-yellow-400' };
  return { text: 'HIGH', color: 'text-red-400' };
};

const changeChain = async (chainId: string) => {
  selectedChain.value = chainId;
  await loadData();
};

const currentChain = computed(() => {
  return chains.find(c => c.id === selectedChain.value);
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">Validator Performance Tracker</h2>
        <p class="text-sm text-slate-400">Monitor validator performance across chains</p>
      </div>
      
      <!-- Chain Selector -->
      <div class="flex gap-2">
        <button
          v-for="chain in chains"
          :key="chain.id"
          :class="[
            'rounded-lg px-3 py-2 text-sm font-medium transition-all',
            selectedChain === chain.id
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          ]"
          @click="changeChain(chain.id)"
        >
          {{ chain.icon }} {{ chain.name }}
        </button>
      </div>
    </div>

    <!-- View Tabs -->
    <div class="flex gap-2 border-b border-slate-700 pb-2">
      <button
        :class="[
          'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
          activeView === 'validators'
            ? 'bg-purple-600 text-white'
            : 'text-slate-400 hover:text-white'
        ]"
        @click="activeView = 'validators'"
      >
        📊 Validators
      </button>
      <button
        :class="[
          'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
          activeView === 'stats'
            ? 'bg-purple-600 text-white'
            : 'text-slate-400 hover:text-white'
        ]"
        @click="activeView = 'stats'"
      >
        📈 Chain Stats
      </button>
      <button
        :class="[
          'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
          activeView === 'pools'
            ? 'bg-purple-600 text-white'
            : 'text-slate-400 hover:text-white'
        ]"
        @click="activeView = 'pools'"
      >
        🏦 Staking Pools
      </button>
    </div>

    <!-- Loading/Error States -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-300">
      {{ error }}
    </div>

    <!-- Validators View -->
    <div v-else-if="activeView === 'validators'" class="space-y-4">
      <div v-if="validators.length === 0" class="py-8 text-center text-slate-400">
        No validators found
      </div>
      
      <div v-else class="grid gap-4">
        <div
          v-for="validator in validators"
          :key="validator.validatorAddress"
          class="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/20 text-lg">
                {{ currentChain?.icon }}
              </div>
              <div>
                <h3 class="font-semibold text-white">{{ validator.moniker }}</h3>
                <p class="text-xs text-slate-400">{{ validator.validatorAddress }}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  getStatusColor(validator.status),
                  validator.status === 'active' ? 'text-white' : 'text-white'
                ]"
              >
                {{ validator.status }}
              </span>
              <span v-if="validator.rank" class="text-sm text-slate-400">
                #{{ validator.rank }}
              </span>
            </div>
          </div>
          
          <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p class="text-xs text-slate-400">Uptime</p>
              <p :class="['text-lg font-semibold', getUptimeColor(validator.uptime)]">
                {{ validator.uptime.toFixed(2) }}%
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Commission</p>
              <p class="text-lg font-semibold text-white">{{ validator.commission }}%</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">APR</p>
              <p class="text-lg font-semibold text-green-400">{{ validator.Apr }}%</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Delegators</p>
              <p class="text-lg font-semibold text-white">{{ validator.delegators.toLocaleString() }}</p>
            </div>
          </div>
          
          <div class="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
            <div>
              <p class="text-xs text-slate-400">Total Staked</p>
              <p class="font-semibold text-white">{{ validator.tokens }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">Risk:</span>
              <span :class="['text-sm font-medium', getRiskLevel(validator.uptime, validator.commission).color]">
                {{ getRiskLevel(validator.uptime, validator.commission).text }}
              </span>
            </div>
          </div>
          
          <!-- Slash History Alert -->
          <div
            v-if="validator.slashHistory && validator.slashHistory.length > 0"
            class="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2"
          >
            <p class="text-xs text-red-400">
              ⚠️ {{ validator.slashHistory.length }} slash event(s) detected
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats View -->
    <div v-else-if="activeView === 'stats'" class="space-y-4">
      <div v-if="chainStats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Total Validators</p>
          <p class="mt-1 text-2xl font-bold text-white">{{ chainStats.totalValidators }}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Active Validators</p>
          <p class="mt-1 text-2xl font-bold text-green-400">{{ chainStats.activeValidators }}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Total Staked</p>
          <p class="mt-1 text-2xl font-bold text-purple-400">{{ chainStats.totalStaked }}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Average Uptime</p>
          <p class="mt-1 text-2xl font-bold text-blue-400">{{ chainStats.avgUptime.toFixed(2) }}%</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Average APR</p>
          <p class="mt-1 text-2xl font-bold text-green-400">{{ chainStats.avgApr.toFixed(2) }}%</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Network</p>
          <p class="mt-1 text-2xl font-bold text-white">{{ currentChain?.icon }} {{ currentChain?.name }}</p>
        </div>
      </div>
    </div>

    <!-- Staking Pools View -->
    <div v-else-if="activeView === 'pools'" class="space-y-4">
      <div v-if="stakingPools.length === 0" class="py-8 text-center text-slate-400">
        No staking pools found
      </div>
      
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="pool in stakingPools"
          :key="pool.name"
          class="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-white">{{ pool.name }}</h3>
              <p class="text-xs text-slate-400">Min: {{ pool.minStake }}</p>
            </div>
            <span class="rounded-lg bg-green-500/20 px-2 py-1 text-sm font-bold text-green-400">
              {{ pool.Apr }}% APY
            </span>
          </div>
          
          <div class="mt-4">
            <p class="text-xs text-slate-400">Total Value Locked</p>
            <p class="text-lg font-semibold text-white">{{ pool.tvl }}</p>
          </div>
          
          <a
            :href="pool.url"
            target="_blank"
            class="mt-4 block w-full rounded-lg bg-purple-600 py-2 text-center text-sm font-medium text-white hover:bg-purple-700"
          >
            Stake Now →
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
