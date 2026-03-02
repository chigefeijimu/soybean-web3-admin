<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface TokenEconomics {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply: number | null;
  marketCap: number;
  fullyDilutedValuation: number;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  inflationRate: number;
  tokenAllocation: TokenAllocation[];
  vestingSchedule: VestingSchedule[];
  burnHistory: BurnRecord[];
  holdersCount: number;
  transferCount: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
}

interface TokenAllocation {
  category: string;
  percentage: number;
  amount: number;
  lockStatus: 'locked' | 'unlocked' | 'vesting';
  unlockDate?: string;
  description: string;
}

interface VestingSchedule {
  name: string;
  totalAmount: number;
  releasedAmount: number;
  lockedAmount: number;
  startDate: string;
  endDate: string;
  cliff: number;
  duration: number;
  tgePercent: number;
}

interface BurnRecord {
  date: string;
  amount: number;
  usdValue: number;
  txHash: string;
  type: 'manual' | 'auto' | 'fee-burn';
}

interface PopularToken {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  category: string;
}

const { chainId } = useWeb3();

const tokenAddress = ref('');
const chain = ref('ethereum');
const loading = ref(false);
const error = ref('');
const tokenData = ref<TokenEconomics | null>(null);
const popularTokens = ref<PopularToken[]>([]);

const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
  { id: 'polygon', name: 'Polygon', icon: '🟣' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', icon: '🟠' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡' },
];

const riskColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const riskBgColors = {
  low: 'bg-green-400/20',
  medium: 'bg-yellow-400/20',
  high: 'bg-orange-400/20',
  critical: 'bg-red-400/20',
};

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatPercent = (num: number): string => {
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
};

const fetchPopularTokens = async () => {
  try {
    const response = await fetch('http://localhost:3020/token-economics/popular');
    popularTokens.value = await response.json();
  } catch (e) {
    console.error('Failed to fetch popular tokens:', e);
    // Mock data fallback
    popularTokens.value = [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'ethereum', category: 'L1' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'AAVE', name: 'Aave', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'LINK', name: 'Chainlink', address: '0x514910771af9ca656af840dff83e8264ecf986ca', chain: 'ethereum', category: 'Oracle' },
      { symbol: 'CRV', name: 'Curve DAO', address: '0xd533a949740bb3306d119cc777fa900ba034cd52', chain: 'ethereum', category: 'DeFi' },
    ];
  }
};

const analyzeToken = async () => {
  if (!tokenAddress.value) {
    error.value = 'Please enter a token address';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`http://localhost:3020/token-economics/analyze/${tokenAddress.value}?chain=${chain.value}`);
    if (!response.ok) {
      throw new Error('Failed to fetch token data');
    }
    tokenData.value = await response.json();
  } catch (e) {
    error.value = 'Failed to analyze token. Please check the address and try again.';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const selectToken = (token: PopularToken) => {
  tokenAddress.value = token.address;
  chain.value = token.chain;
  analyzeToken();
};

const getAllocationColor = (index: number): string => {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  return colors[index % colors.length];
};

const getVestingProgress = (schedule: VestingSchedule): number => {
  return Math.round((schedule.releasedAmount / schedule.totalAmount) * 100);
};

const getBurnTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    manual: 'bg-blue-400',
    auto: 'bg-purple-400',
    'fee-burn': 'bg-orange-400',
  };
  return colors[type] || 'bg-gray-400';
};

onMounted(() => {
  fetchPopularTokens();
});

watch(chainId, (newChainId) => {
  if (newChainId) {
    const chainMap: Record<number, string> = {
      1: 'ethereum',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      56: 'bsc',
    };
    chain.value = chainMap[newChainId] || 'ethereum';
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h2 class="mb-2 text-2xl font-bold">📊 Token Economics Analyzer</h2>
      <p class="text-slate-400">Analyze token economics, allocation, vesting schedules and risk factors</p>
    </div>

    <!-- Search Bar -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="flex flex-col gap-4 lg:flex-row">
        <div class="flex-1">
          <label class="mb-2 block text-sm text-slate-400">Token Address</label>
          <input
            v-model="tokenAddress"
            type="text"
            placeholder="0x..."
            class="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            @keyup.enter="analyzeToken"
          />
        </div>
        <div class="w-full lg:w-48">
          <label class="mb-2 block text-sm text-slate-400">Chain</label>
          <select
            v-model="chain"
            class="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
          >
            <option v-for="c in chains" :key="c.id" :value="c.id">
              {{ c.icon }} {{ c.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            :disabled="loading"
            class="rounded-xl from-blue-500 to-purple-500 bg-gradient-to-r px-8 py-3 font-semibold transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
            @click="analyzeToken"
          >
            {{ loading ? '⏳ Analyzing...' : '🔍 Analyze' }}
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 rounded-xl bg-red-500/20 p-4 text-red-400">
        {{ error }}
      </div>

      <!-- Popular Tokens -->
      <div class="mt-4">
        <p class="mb-2 text-sm text-slate-400">Popular Tokens:</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="token in popularTokens"
            :key="token.address"
            class="rounded-lg bg-slate-700/50 px-3 py-1.5 text-sm transition-colors hover:bg-slate-600/50"
            @click="selectToken(token)"
          >
            {{ token.symbol }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="tokenData" class="space-y-6">
      <!-- Token Overview -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Info -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl lg:col-span-2">
          <div class="mb-4 flex items-center gap-4">
            <div class="text-4xl">🪙</div>
            <div>
              <h3 class="text-2xl font-bold">{{ tokenData.name }} ({{ tokenData.symbol }})</h3>
              <p class="text-slate-400">{{ tokenData.chain }} • {{ tokenData.address.slice(0, 6) }}...{{ tokenData.address.slice(-4) }}</p>
            </div>
          </div>
          
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-sm text-slate-400">Price</p>
              <p class="text-xl font-bold">{{ formatCurrency(tokenData.price) }}</p>
              <p :class="tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatPercent(tokenData.priceChange24h) }} (24h)
              </p>
            </div>
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-sm text-slate-400">Market Cap</p>
              <p class="text-xl font-bold">{{ formatCurrency(tokenData.marketCap) }}</p>
            </div>
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-sm text-slate-400">FDV</p>
              <p class="text-xl font-bold">{{ formatCurrency(tokenData.fullyDilutedValuation) }}</p>
            </div>
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="text-sm text-slate-400">Inflation</p>
              <p class="text-xl font-bold">{{ tokenData.inflationRate }}%</p>
            </div>
          </div>
        </div>

        <!-- Risk Assessment -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">⚠️ Risk Assessment</h3>
          <div class="mb-4 text-center">
            <div class="mb-2 text-5xl font-bold" :class="riskColors[tokenData.riskLevel]">
              {{ tokenData.riskScore }}
            </div>
            <p class="text-slate-400">Risk Score (0-100)</p>
          </div>
          <div class="rounded-xl p-3 text-center" :class="riskBgColors[tokenData.riskLevel]">
            <span class="font-semibold uppercase" :class="riskColors[tokenData.riskLevel]">
              {{ tokenData.riskLevel }} Risk
            </span>
          </div>
          <div class="mt-4 space-y-2">
            <p class="text-sm font-semibold text-slate-400">Risk Factors:</p>
            <ul class="space-y-1 text-sm">
              <li v-for="(factor, idx) in tokenData.riskFactors" :key="idx" class="flex items-start gap-2">
                <span class="text-red-400">•</span>
                <span class="text-slate-300">{{ factor }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Supply Information -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">💰 Supply Information</h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl bg-slate-900/50 p-4">
            <p class="text-sm text-slate-400">Total Supply</p>
            <p class="text-lg font-semibold">{{ formatNumber(tokenData.totalSupply) }} {{ tokenData.symbol }}</p>
          </div>
          <div class="rounded-xl bg-slate-900/50 p-4">
            <p class="text-sm text-slate-400">Circulating Supply</p>
            <p class="text-lg font-semibold">{{ formatNumber(tokenData.circulatingSupply) }} {{ tokenData.symbol }}</p>
          </div>
          <div class="rounded-xl bg-slate-900/50 p-4">
            <p class="text-sm text-slate-400">Max Supply</p>
            <p class="text-lg font-semibold">{{ tokenData.maxSupply ? formatNumber(tokenData.maxSupply) + ' ' + tokenData.symbol : '∞' }}</p>
          </div>
          <div class="rounded-xl bg-slate-900/50 p-4">
            <p class="text-sm text-slate-400">Circulation %</p>
            <p class="text-lg font-semibold">{{ ((tokenData.circulatingSupply / tokenData.totalSupply) * 100).toFixed(1) }}%</p>
          </div>
        </div>
      </div>

      <!-- Token Allocation -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">📈 Token Allocation</h3>
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Chart -->
          <div class="flex items-center justify-center">
            <div class="relative h-48 w-48">
              <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
                <circle
                  v-for="(alloc, idx) in tokenData.tokenAllocation"
                  :key="idx"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  :stroke="getAllocationColor(idx)"
                  stroke-width="20"
                  :stroke-dasharray="`${alloc.percentage * 2.51} 251`"
                  :stroke-dashoffset="`-${tokenData.tokenAllocation.slice(0, idx).reduce((sum, a) => sum + a.percentage, 0) * 2.51}`"
                />
              </svg>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="space-y-3">
            <div
              v-for="(alloc, idx) in tokenData.tokenAllocation"
              :key="idx"
              class="flex items-center justify-between rounded-xl bg-slate-900/50 p-3"
            >
              <div class="flex items-center gap-3">
                <div class="h-3 w-3 rounded-full" :style="{ backgroundColor: getAllocationColor(idx) }"></div>
                <div>
                  <p class="font-semibold">{{ alloc.category }}</p>
                  <p class="text-xs text-slate-400">{{ alloc.description }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold">{{ alloc.percentage }}%</p>
                <p class="text-xs text-slate-400">{{ formatNumber(alloc.amount) }} {{ tokenData.symbol }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vesting Schedule -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">🔐 Vesting Schedule</h3>
        <div class="space-y-4">
          <div
            v-for="(schedule, idx) in tokenData.vestingSchedule"
            :key="idx"
            class="rounded-xl bg-slate-900/50 p-4"
          >
            <div class="mb-2 flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ schedule.name }}</p>
                <p class="text-xs text-slate-400">
                  {{ schedule.startDate }} → {{ schedule.endDate }}
                  (Cliff: {{ schedule.cliff }}d, TGE: {{ schedule.tgePercent }}%)
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold">{{ getVestingProgress(schedule) }}% Released</p>
                <p class="text-xs text-slate-400">
                  {{ formatNumber(schedule.releasedAmount) }} / {{ formatNumber(schedule.totalAmount) }} {{ tokenData.symbol }}
                </p>
              </div>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                class="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                :style="{ width: getVestingProgress(schedule) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Burn History -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">🔥 Burn History</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-slate-400">
                <th class="pb-3">Date</th>
                <th class="pb-3">Type</th>
                <th class="pb-3">Amount</th>
                <th class="pb-3">USD Value</th>
                <th class="pb-3">TX Hash</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(burn, idx) in tokenData.burnHistory"
                :key="idx"
                class="border-t border-slate-700/50"
              >
                <td class="py-3">{{ burn.date }}</td>
                <td class="py-3">
                  <span class="rounded px-2 py-1 text-xs" :class="getBurnTypeColor(burn.type) + ' text-white'">
                    {{ burn.type }}
                  </span>
                </td>
                <td class="py-3 font-semibold">{{ formatNumber(burn.amount) }} {{ tokenData.symbol }}</td>
                <td class="py-3">{{ formatCurrency(burn.usdValue) }}</td>
                <td class="py-3">
                  <a
                    :href="`https://etherscan.io/tx/${burn.txHash}`"
                    target="_blank"
                    class="text-blue-400 hover:underline"
                  >
                    {{ burn.txHash.slice(0, 6) }}...{{ burn.txHash.slice(-4) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <p class="mb-1 text-sm text-slate-400">Total Holders</p>
          <p class="text-2xl font-bold">{{ formatNumber(tokenData.holdersCount) }}</p>
        </div>
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <p class="mb-1 text-sm text-slate-400">Total Transfers</p>
          <p class="text-2xl font-bold">{{ formatNumber(tokenData.transferCount) }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!tokenData && !loading"
      class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl"
    >
      <div class="mb-4 text-6xl">📊</div>
      <p class="text-slate-400">Enter a token address to analyze its economics</p>
    </div>
  </div>
</template>
