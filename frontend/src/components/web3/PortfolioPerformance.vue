<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface Token {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
}

interface Performance {
  totalValue: number;
  totalChange24h: number;
  totalChange7d: number;
  totalChange30d: number;
  changePercent24h: number;
  changePercent7d: number;
  changePercent30d: number;
  bestPerformer: { symbol: string; change: number } | null;
  worstPerformer: { symbol: string; change: number } | null;
}

interface HistoryPoint {
  timestamp: number;
  totalValue: number;
}

const { account, isConnected } = useWeb3();

const walletAddress = ref('');
const loading = ref(false);
const error = ref('');
const tokens = ref<Token[]>([]);
const performance = ref<Performance | null>(null);
const history = ref<HistoryPoint[]>([]);
const timeRange = ref('30d');

const timeRanges = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

const filteredHistory = computed(() => {
  const days = timeRange.value === '7d' ? 7 : timeRange.value === '30d' ? 30 : 90;
  return history.value.slice(-days);
});

const chartPath = computed(() => {
  if (filteredHistory.value.length === 0) return '';
  
  const width = 600;
  const height = 200;
  const data = filteredHistory.value;
  const min = Math.min(...data.map(d => d.totalValue));
  const max = Math.max(...data.map(d => d.totalValue));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.totalValue - min) / range) * height;
    return `${x},${y}`;
  });
  
  return `M ${points.join(' L ')}`;
});

const chartArea = computed(() => {
  if (filteredHistory.value.length === 0) return '';
  
  const width = 600;
  const height = 200;
  const data = filteredHistory.value;
  const min = Math.min(...data.map(d => d.totalValue));
  const max = Math.max(...data.map(d => d.totalValue));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.totalValue - min) / range) * height;
    return `${x},${y}`;
  });
  
  return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const fetchPortfolio = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`/api/web3/portfolio-performance/portfolio?address=${walletAddress.value}`);
    const data = await response.json();
    
    if (data.error) {
      error.value = data.error;
      return;
    }
    
    tokens.value = data.tokens || [];
    performance.value = data.performance;
    history.value = data.history || [];
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch portfolio';
  } finally {
    loading.value = false;
  }
};

const loadDemoData = () => {
  const demoTokens: Token[] = [
    { tokenAddress: '0x000', symbol: 'ETH', name: 'Ethereum', balance: '2.5', price: 2450, value: 6125, change24h: 2.5 },
    { tokenAddress: '0x2260', symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.15', price: 62000, value: 9300, change24h: 1.8 },
    { tokenAddress: '0xa0b8', symbol: 'USDC', name: 'USD Coin', balance: '5000', price: 1, value: 5000, change24h: 0.01 },
    { tokenAddress: '0x7fc6', symbol: 'AAVE', name: 'Aave', balance: '25', price: 95, value: 2375, change24h: -1.2 },
    { tokenAddress: '0x1f98', symbol: 'UNI', name: 'Uniswap', balance: '100', price: 7.5, value: 750, change24h: 3.2 },
    { tokenAddress: '0x5149', symbol: 'LINK', name: 'Chainlink', balance: '50', price: 14, value: 700, change24h: -0.5 },
  ];
  
  const demoPerformance: Performance = {
    totalValue: 24250,
    totalChange24h: 425,
    totalChange7d: 1250,
    totalChange30d: 3500,
    changePercent24h: 1.78,
    changePercent7d: 5.43,
    changePercent30d: 16.87,
    bestPerformer: { symbol: 'UNI', change: 3.2 },
    worstPerformer: { symbol: 'AAVE', change: -1.2 },
  };
  
  const now = Date.now();
  const demoHistory: HistoryPoint[] = [];
  const baseValue = 20750;
  
  for (let i = 30; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const randomChange = 1 + (Math.random() * 0.1 - 0.05);
    const trendFactor = 1 + ((30 - i) * 0.005);
    demoHistory.push({
      timestamp,
      totalValue: baseValue * randomChange * trendFactor,
    });
  }
  
  tokens.value = demoTokens;
  performance.value = demoPerformance;
  history.value = demoHistory;
};

const useConnectedWallet = () => {
  if (isConnected.value && account.value) {
    walletAddress.value = account.value;
    fetchPortfolio();
  }
};

watch(walletAddress, () => {
  if (walletAddress.value.length === 42) {
    fetchPortfolio();
  }
});

onMounted(() => {
  if (isConnected.value && account.value) {
    walletAddress.value = account.value;
    fetchPortfolio();
  } else {
    loadDemoData();
  }
});
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold">📈 Portfolio Performance</h2>
        <p class="text-sm text-slate-400">Track your portfolio value over time</p>
      </div>
      
      <!-- Time Range Selector -->
      <div class="flex gap-2">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          class="rounded-lg px-3 py-1 text-sm font-medium transition-colors"
          :class="[
            timeRange === range.value
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          ]"
          @click="timeRange = range.value"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- Wallet Input -->
    <div class="mb-6 flex gap-3">
      <input
        v-model="walletAddress"
        type="text"
        placeholder="Enter wallet address (0x...)"
        class="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
      />
      <button
        v-if="isConnected && account"
        class="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/30"
        @click="useConnectedWallet"
      >
        Use Connected
      </button>
      <button
        class="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium hover:bg-purple-600"
        :disabled="loading || !walletAddress"
        @click="fetchPortfolio"
      >
        {{ loading ? 'Loading...' : 'Analyze' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">
      {{ error }}
    </div>

    <!-- Performance Summary -->
    <div v-if="performance" class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <!-- Total Value -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">Total Value</p>
        <p class="mt-1 text-2xl font-bold">{{ formatCurrency(performance.totalValue) }}</p>
      </div>
      
      <!-- 24h Change -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">24h Change</p>
        <p class="mt-1 text-xl font-semibold" :class="performance.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'">
          {{ formatPercent(performance.changePercent24h) }}
        </p>
        <p class="text-xs" :class="performance.totalChange24h >= 0 ? 'text-green-400/70' : 'text-red-400/70'">
          {{ performance.totalChange24h >= 0 ? '+' : '' }}{{ formatCurrency(performance.totalChange24h) }}
        </p>
      </div>
      
      <!-- 7d Change -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">7d Change</p>
        <p class="mt-1 text-xl font-semibold" :class="performance.changePercent7d >= 0 ? 'text-green-400' : 'text-red-400'">
          {{ formatPercent(performance.changePercent7d) }}
        </p>
      </div>
      
      <!-- 30d Change -->
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="text-xs text-slate-400">30d Change</p>
        <p class="mt-1 text-xl font-semibold" :class="performance.changePercent30d >= 0 ? 'text-green-400' : 'text-red-400'">
          {{ formatPercent(performance.changePercent30d) }}
        </p>
      </div>
    </div>

    <!-- Performance Chart -->
    <div class="mb-6">
      <h3 class="mb-3 text-lg font-semibold">Performance Chart</h3>
      <div class="relative h-52 overflow-hidden rounded-xl bg-slate-900/50 p-4">
        <svg viewBox="0 0 600 200" class="h-full w-full" preserveAspectRatio="none">
          <!-- Gradient Definition -->
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
            </linearGradient>
          </defs>
          
          <!-- Area Fill -->
          <path
            v-if="chartArea"
            :d="chartArea"
            fill="url(#chartGradient)"
          />
          
          <!-- Line -->
          <path
            v-if="chartPath"
            :d="chartPath"
            fill="none"
            stroke="#8b5cf6"
            stroke-width="2"
            class="drop-shadow-lg"
          />
        </svg>
        
        <!-- Empty State -->
        <div v-if="!chartPath" class="absolute inset-0 flex items-center justify-center text-slate-400">
          No data available
        </div>
      </div>
      
      <!-- Chart Labels -->
      <div v-if="filteredHistory.length > 0" class="mt-2 flex justify-between text-xs text-slate-400">
        <span>{{ formatDate(filteredHistory[0].timestamp) }}</span>
        <span>{{ formatDate(filteredHistory[filteredHistory.length - 1].timestamp) }}</span>
      </div>
    </div>

    <!-- Best/Worst Performers -->
    <div v-if="performance" class="mb-6 grid grid-cols-2 gap-4">
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="mb-2 text-xs text-slate-400">🏆 Best Performer (24h)</p>
        <div v-if="performance.bestPerformer">
          <span class="text-lg font-semibold">{{ performance.bestPerformer.symbol }}</span>
          <span class="ml-2 text-green-400">{{ formatPercent(performance.bestPerformer.change) }}</span>
        </div>
      </div>
      <div class="rounded-xl bg-slate-900/50 p-4">
        <p class="mb-2 text-xs text-slate-400">📉 Worst Performer (24h)</p>
        <div v-if="performance.worstPerformer">
          <span class="text-lg font-semibold">{{ performance.worstPerformer.symbol }}</span>
          <span class="ml-2 text-red-400">{{ formatPercent(performance.worstPerformer.change) }}</span>
        </div>
      </div>
    </div>

    <!-- Token Holdings -->
    <div>
      <h3 class="mb-3 text-lg font-semibold">💰 Token Holdings</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-700 text-left text-xs text-slate-400">
              <th class="pb-2 font-medium">Token</th>
              <th class="pb-2 text-right font-medium">Balance</th>
              <th class="pb-2 text-right font-medium">Price</th>
              <th class="pb-2 text-right font-medium">Value</th>
              <th class="pb-2 text-right font-medium">24h</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="token in tokens"
              :key="token.tokenAddress"
              class="border-b border-slate-700/50"
            >
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ token.symbol === 'ETH' ? '🔷' : token.symbol === 'WBTC' ? '🟡' : token.symbol === 'USDC' ? '💵' : '🪙' }}</span>
                  <div>
                    <p class="font-medium">{{ token.symbol }}</p>
                    <p class="text-xs text-slate-400">{{ token.name }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 text-right text-sm">{{ token.balance }}</td>
              <td class="py-3 text-right text-sm">{{ formatCurrency(token.price) }}</td>
              <td class="py-3 text-right font-medium">{{ formatCurrency(token.value) }}</td>
              <td class="py-3 text-right" :class="token.change24h >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatPercent(token.change24h) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
