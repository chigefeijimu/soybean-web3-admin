<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// Types
interface MarketCapData {
  total_market_cap: number;
  total_volume: number;
  btc_dominance: number;
  eth_dominance: number;
  stablecoin_market_cap: number;
  defi_market_cap: number;
  change_24h: number;
  change_7d: number;
  change_30d: number;
  updated_at: string;
}

interface DominanceData {
  name: string;
  symbol: string;
  dominance: number;
  market_cap: number;
  color: string;
}

interface HistoryPoint {
  timestamp: number;
  total_market_cap: number;
  btc_dominance: number;
  eth_dominance: number;
}

// State
const marketData = ref<MarketCapData | null>(null);
const dominanceList = ref<DominanceData[]>([]);
const historyData = ref<HistoryPoint[]>([]);
const loading = ref(false);
const error = ref('');
const selectedPeriod = ref<'24h' | '7d' | '30d' | '90d'>('7d');

// Mock data generator for demo
const generateMockData = () => {
  const now = Date.now();
  const baseMarketCap = 2.45e12; // $2.45T
  
  // Generate history data
  const history: HistoryPoint[] = [];
  const points = selectedPeriod.value === '24h' ? 24 : selectedPeriod.value === '7d' ? 7 * 24 : selectedPeriod.value === '30d' ? 30 : 90;
  const interval = selectedPeriod.value === '24h' ? 3600000 : 86400000;
  
  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * interval;
    const variation = 1 + (Math.random() - 0.5) * 0.05;
    const trend = 1 + (points - i) * 0.001;
    
    history.push({
      timestamp,
      total_market_cap: baseMarketCap * variation * trend,
      btc_dominance: 52 + Math.random() * 2,
      eth_dominance: 16 + Math.random() * 1.5,
    });
  }
  
  // Current data
  marketData.value = {
    total_market_cap: history[history.length - 1].total_market_cap,
    total_volume: history[history.length - 1].total_market_cap * 0.08,
    btc_dominance: history[history.length - 1].btc_dominance,
    eth_dominance: history[history.length - 1].eth_dominance,
    stablecoin_market_cap: 165e9,
    defi_market_cap: 85e9,
    change_24h: (history[history.length - 1].total_market_cap - history[history.length - 2].total_market_cap) / history[history.length - 2].total_market_cap * 100,
    change_7d: 3.2,
    change_30d: 8.7,
    updated_at: new Date().toISOString(),
  };
  
  // Dominance list
  dominanceList.value = [
    { name: 'Bitcoin', symbol: 'BTC', dominance: marketData.value.btc_dominance, market_cap: marketData.value.total_market_cap * marketData.value.btc_dominance / 100, color: '#F7931A' },
    { name: 'Ethereum', symbol: 'ETH', dominance: marketData.value.eth_dominance, market_cap: marketData.value.total_market_cap * marketData.value.eth_dominance / 100, color: '#627EEA' },
    { name: 'Tether', symbol: 'USDT', dominance: 6.8, market_cap: marketData.value.total_market_cap * 0.068, color: '#26A17B' },
    { name: 'USDC', symbol: 'USDC', dominance: 3.2, market_cap: marketData.value.total_market_cap * 0.032, color: '#2775CA' },
    { name: 'BNB', symbol: 'BNB', dominance: 2.9, market_cap: marketData.value.total_market_cap * 0.029, color: '#F3BA2F' },
    { name: 'Solana', symbol: 'SOL', dominance: 2.1, market_cap: marketData.value.total_market_cap * 0.021, color: '#00FFA3' },
    { name: 'XRP', symbol: 'XRP', dominance: 1.8, market_cap: marketData.value.total_market_cap * 0.018, color: '#23292F' },
    { name: 'Others', symbol: 'OTHER', dominance: 100 - marketData.value.btc_dominance - marketData.value.eth_dominance - 6.8 - 3.2 - 2.9 - 2.1 - 1.8, market_cap: marketData.value.total_market_cap * 0.142, color: '#6B7280' },
  ];
  
  historyData.value = history;
};

// Format numbers
const formatMarketCap = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

// Get change color
const getChangeColor = (value: number): string => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
};

// Chart data for display
const chartPoints = computed(() => {
  return historyData.value.map(point => ({
    x: point.timestamp,
    y: point.total_market_cap,
  }));
});

// Min/Max for chart
const chartStats = computed(() => {
  if (historyData.value.length === 0) return { min: 0, max: 0, avg: 0 };
  const values = historyData.value.map(p => p.total_market_cap);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  };
});

// Dominance chart data
const dominanceChartData = computed(() => {
  return dominanceList.value.map(item => ({
    name: item.symbol,
    value: item.dominance,
    color: item.color,
  }));
});

// Fetch data
const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    // Simulate API call - in production would call backend
    await new Promise(resolve => setTimeout(resolve, 500));
    generateMockData();
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch market data';
  } finally {
    loading.value = false;
  }
};

// Change period
const changePeriod = (period: '24h' | '7d' | '30d' | '90d') => {
  selectedPeriod.value = period;
  fetchData();
};

// Get bar width for dominance
const getDominanceWidth = (dominance: number): string => {
  return `${Math.min(dominance, 100)}%`;
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="market-cap-dashboard">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white flex items-center gap-2">
        📊 Crypto Market Cap Dashboard
      </h2>
      <p class="text-slate-400 mt-1">Real-time cryptocurrency market capitalization overview</p>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
      <span class="text-red-300">{{ error }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>

    <!-- Main Content -->
    <div v-else-if="marketData" class="space-y-6">
      <!-- Period Selector -->
      <div class="flex gap-2">
        <button
          v-for="period in ['24h', '7d', '30d', '90d'] as const"
          :key="period"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="selectedPeriod === period 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'"
          @click="changePeriod(period)"
        >
          {{ period }}
        </button>
      </div>

      <!-- Main Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Market Cap -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-1">Total Market Cap</p>
          <p class="text-2xl font-bold text-white">{{ formatMarketCap(marketData.total_market_cap) }}</p>
          <p class="text-sm mt-2" :class="getChangeColor(marketData.change_24h)">
            {{ formatPercentage(marketData.change_24h) }} (24h)
          </p>
        </div>

        <!-- 24h Volume -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-1">24h Volume</p>
          <p class="text-2xl font-bold text-white">{{ formatMarketCap(marketData.total_volume) }}</p>
          <p class="text-sm mt-2 text-slate-400">
            {{ ((marketData.total_volume / marketData.total_market_cap) * 100).toFixed(1) }}% of cap
          </p>
        </div>

        <!-- BTC Dominance -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-1">BTC Dominance</p>
          <p class="text-2xl font-bold text-orange-400">{{ marketData.btc_dominance.toFixed(1) }}%</p>
          <p class="text-sm mt-2 text-slate-400">
            {{ formatMarketCap(marketData.total_market_cap * marketData.btc_dominance / 100) }}
          </p>
        </div>

        <!-- ETH Dominance -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-1">ETH Dominance</p>
          <p class="text-2xl font-bold text-blue-400">{{ marketData.eth_dominance.toFixed(1) }}%</p>
          <p class="text-sm mt-2 text-slate-400">
            {{ formatMarketCap(marketData.total_market_cap * marketData.eth_dominance / 100) }}
          </p>
        </div>
      </div>

      <!-- Additional Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Stablecoin Market Cap -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-1">Stablecoin Market Cap</p>
          <p class="text-xl font-bold text-green-400">{{ formatMarketCap(marketData.stablecoin_market_cap) }}</p>
          <div class="mt-3">
            <div class="flex justify-between text-xs text-slate-400 mb-1">
              <span>Share</span>
              <span>{{ ((marketData.stablecoin_market_cap / marketData.total_market_cap) * 100).toFixed(1) }}%</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                class="h-full bg-green-500 rounded-full"
                :style="{ width: `${Math.min((marketData.stablecoin_market_cap / marketData.total_market_cap) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- DeFi Market Cap -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-1">DeFi Market Cap</p>
          <p class="text-xl font-bold text-purple-400">{{ formatMarketCap(marketData.defi_market_cap) }}</p>
          <div class="mt-3">
            <div class="flex justify-between text-xs text-slate-400 mb-1">
              <span>Share</span>
              <span>{{ ((marketData.defi_market_cap / marketData.total_market_cap) * 100).toFixed(1) }}%</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                class="h-full bg-purple-500 rounded-full"
                :style="{ width: `${Math.min((marketData.defi_market_cap / marketData.total_market_cap) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 7d/30d Change -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
          <p class="text-slate-400 text-sm mb-3">Period Changes</p>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">7 Day</span>
              <span class="font-medium" :class="getChangeColor(marketData.change_7d)">
                {{ formatPercentage(marketData.change_7d) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">30 Day</span>
              <span class="font-medium" :class="getChangeColor(marketData.change_30d)">
                {{ formatPercentage(marketData.change_30d) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Dominance -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold text-white mb-4">Market Dominance</h3>
        <div class="space-y-3">
          <div 
            v-for="item in dominanceList" 
            :key="item.symbol"
            class="flex items-center gap-4"
          >
            <div class="w-16 text-sm font-medium" :style="{ color: item.color }">
              {{ item.symbol }}
            </div>
            <div class="flex-1">
              <div class="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ 
                    width: getDominanceWidth(item.dominance),
                    backgroundColor: item.color 
                  }"
                ></div>
              </div>
            </div>
            <div class="w-20 text-right text-sm">
              <span class="text-white font-medium">{{ item.dominance.toFixed(1) }}%</span>
            </div>
            <div class="w-24 text-right text-xs text-slate-400">
              {{ formatMarketCap(item.market_cap) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold text-white mb-4">Market Cap History</h3>
        
        <!-- Simple ASCII-style Chart -->
        <div class="relative h-48 bg-slate-900/50 rounded-lg p-4 overflow-hidden">
          <!-- Y-axis labels -->
          <div class="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-xs text-slate-500">
            <span>{{ formatMarketCap(chartStats.max) }}</span>
            <span>{{ formatMarketCap(chartStats.avg) }}</span>
            <span>{{ formatMarketCap(chartStats.min) }}</span>
          </div>
          
          <!-- Chart area -->
          <div class="ml-12 h-full flex items-end gap-px">
            <template v-for="(point, index) in chartPoints" :key="index">
              <div 
                class="flex-1 bg-purple-500/60 hover:bg-purple-400 rounded-t transition-all"
                :style="{ 
                  height: `${((point.y - chartStats.min) / (chartStats.max - chartStats.min)) * 100}%`,
                  minHeight: '2px'
                }"
                :title="`${formatMarketCap(point.y)}`"
              ></div>
            </template>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex justify-between items-center mt-4 text-sm text-slate-400">
          <span>{{ new Date(chartPoints[0]?.x || 0).toLocaleDateString() }}</span>
          <span>{{ new Date(chartPoints[chartPoints.length - 1]?.x || 0).toLocaleDateString() }}</span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl mb-1">2,500+</p>
          <p class="text-slate-400 text-sm">Cryptocurrencies</p>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl mb-1">450+</p>
          <p class="text-slate-400 text-sm">Exchanges</p>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl mb-1">$85B+</p>
          <p class="text-slate-400 text-sm">DeFi TVL</p>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
          <p class="text-3xl mb-1">$165B</p>
          <p class="text-slate-400 text-sm">Stablecoins</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-cap-dashboard {
  @apply w-full;
}
</style>
