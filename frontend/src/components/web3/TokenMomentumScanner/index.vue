<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface TokenMomentum {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  rsi: number;
  rsiSignal: string;
  macd: string;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  ema200: number;
  sma20: number;
  sma50: number;
  signal: string;
  strength: number;
  momentumScore: number;
  trend: string;
  volatility: string;
  logo: string;
  lastUpdated: string;
}

// State
const loading = ref(false);
const tokens = ref<TokenMomentum[]>([]);
const selectedToken = ref<TokenMomentum | null>(null);
const timeRange = ref('7d');
const filterSignal = ref('all');
const sortBy = ref('momentumScore');
const searchAddress = ref('');
const lookupResult = ref<TokenMomentum | null>(null);

// Time range options
const timeRanges = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

// Signal filters
const signalFilters = [
  { value: 'all', label: 'All', emoji: '📊' },
  { value: 'strong_buy', label: 'Strong Buy', emoji: '🚀' },
  { value: 'buy', label: 'Buy', emoji: '🟢' },
  { value: 'neutral', label: 'Neutral', emoji: '⚪' },
  { value: 'sell', label: 'Sell', emoji: '🔴' },
  { value: 'strong_sell', label: 'Strong Sell', emoji: '💥' },
];

// Sort options
const sortOptions = [
  { value: 'momentumScore', label: 'Momentum Score' },
  { value: 'rsi', label: 'RSI' },
  { value: 'priceChange', label: 'Price Change' },
  { value: 'volume', label: 'Volume' },
];

// Signal color
const getSignalColor = (signal: string) => {
  const colors: Record<string, string> = {
    strong_buy: 'text-green-400 bg-green-400/20',
    buy: 'text-green-300 bg-green-300/20',
    neutral: 'text-gray-300 bg-gray-300/20',
    sell: 'text-red-300 bg-red-300/20',
    strong_sell: 'text-red-400 bg-red-400/20',
  };
  return colors[signal] || 'text-gray-300 bg-gray-300/20';
};

// Trend color
const getTrendColor = (trend: string) => {
  const colors: Record<string, string> = {
    uptrend: 'text-green-400',
    downtrend: 'text-red-400',
    sideways: 'text-yellow-400',
  };
  return colors[trend] || 'text-gray-400';
};

// Volatility color
const getVolatilityColor = (volatility: string) => {
  const colors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  };
  return colors[volatility] || 'text-gray-400';
};

// RSI signal color
const getRsiColor = (rsi: number) => {
  if (rsi < 30) return 'text-green-400';
  if (rsi > 70) return 'text-red-400';
  return 'text-yellow-400';
};

// MACD color
const getMacdColor = (macd: string) => {
  const colors: Record<string, string> = {
    bullish: 'text-green-400',
    bearish: 'text-red-400',
    neutral: 'text-gray-400',
  };
  return colors[macd] || 'text-gray-400';
};

// Format number
const formatNumber = (num: number) => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

// Format price
const formatPrice = (price: number) => {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

// Fetch tokens
const fetchTokens = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      timeRange: timeRange.value,
      sortBy: sortBy.value,
      limit: '50',
    });
    
    if (filterSignal.value !== 'all') {
      params.append('momentumType', filterSignal.value);
    }
    
    const response = await fetch(`/api/web3/token-momentum/momentum?${params}`);
    const data = await response.json();
    tokens.value = data;
  } catch (error) {
    console.error('Error fetching momentum:', error);
  } finally {
    loading.value = false;
  }
};

// Lookup token by address
const lookupToken = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  try {
    const response = await fetch(`/api/web3/token-momentum/momentum/address/${searchAddress.value}?chain=ethereum`);
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
      lookupResult.value = null;
    } else {
      lookupResult.value = data;
      selectedToken.value = data;
    }
  } catch (error) {
    console.error('Error looking up token:', error);
  } finally {
    loading.value = false;
  }
};

// Filtered tokens
const filteredTokens = computed(() => {
  if (filterSignal.value === 'all') return tokens.value;
  return tokens.value.filter(t => t.signal === filterSignal.value);
});

// Stats
const stats = computed(() => {
  const strongBuy = tokens.value.filter(t => t.signal === 'strong_buy').length;
  const buy = tokens.value.filter(t => t.signal === 'buy').length;
  const sell = tokens.value.filter(t => t.signal === 'sell').length;
  const strongSell = tokens.value.filter(t => t.signal === 'strong_sell').length;
  
  return { strongBuy, buy, sell, strongSell };
});

// Select token
const selectToken = (token: TokenMomentum) => {
  selectedToken.value = token;
};

// On mount
onMounted(() => {
  fetchTokens();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          📈 Token Momentum Scanner
        </h2>
        <p class="text-sm text-slate-400">Track price momentum & technical indicators</p>
      </div>
      
      <!-- Time Range -->
      <div class="flex gap-2">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm transition-all',
            timeRange === range.value 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          ]"
          @click="timeRange = range.value; fetchTokens()"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div class="flex items-center gap-2 text-green-400">
          <span class="text-lg">🚀</span>
          <span class="font-bold text-xl">{{ stats.strongBuy }}</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">Strong Buy</p>
      </div>
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div class="flex items-center gap-2 text-green-300">
          <span class="text-lg">🟢</span>
          <span class="font-bold text-xl">{{ stats.buy }}</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">Buy</p>
      </div>
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div class="flex items-center gap-2 text-red-300">
          <span class="text-lg">🔴</span>
          <span class="font-bold text-xl">{{ stats.sell }}</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">Sell</p>
      </div>
      <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div class="flex items-center gap-2 text-red-400">
          <span class="text-lg">💥</span>
          <span class="font-bold text-xl">{{ stats.strongSell }}</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">Strong Sell</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
      <!-- Signal Filter -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="filter in signalFilters"
          :key="filter.value"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm transition-all',
            filterSignal === filter.value 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          ]"
          @click="filterSignal = filter.value"
        >
          {{ filter.emoji }} {{ filter.label }}
        </button>
      </div>
      
      <!-- Sort -->
      <select
        v-model="sortBy"
        class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white"
        @change="fetchTokens"
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      
      <button
        class="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white transition-all"
        @click="fetchTokens"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Token Lookup -->
    <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-white mb-3">🔍 Token Address Lookup</h3>
      <div class="flex gap-2">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter token address (e.g., bitcoin)"
          class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400"
          @keyup.enter="lookupToken"
        />
        <button
          class="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white transition-all"
          @click="lookupToken"
        >
          Search
        </button>
      </div>
      
      <!-- Lookup Result -->
      <div v-if="lookupResult" class="mt-4 p-4 bg-slate-700/50 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img v-if="lookupResult.logo" :src="lookupResult.logo" class="w-8 h-8 rounded-full" />
            <div>
              <p class="font-semibold text-white">{{ lookupResult.symbol }}</p>
              <p class="text-xs text-slate-400">{{ lookupResult.name }}</p>
            </div>
          </div>
          <span :class="['px-3 py-1 rounded-full text-xs font-medium', getSignalColor(lookupResult.signal)]">
            {{ lookupResult.signal.replace('_', ' ').toUpperCase() }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>

    <!-- Token List -->
    <div v-else class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="token in filteredTokens"
        :key="token.address"
        :class="[
          'bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800',
          selectedToken?.address === token.address ? 'border-purple-500' : 'border-slate-700/50'
        ]"
        @click="selectToken(token)"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <img v-if="token.logo" :src="token.logo" class="w-10 h-10 rounded-full" />
            <div>
              <p class="font-bold text-white">{{ token.symbol }}</p>
              <p class="text-xs text-slate-400">{{ token.name }}</p>
            </div>
          </div>
          <span :class="['px-2 py-1 rounded-full text-xs font-medium', getSignalColor(token.signal)]">
            {{ token.signal.replace('_', ' ') }}
          </span>
        </div>
        
        <!-- Price -->
        <div class="mb-3">
          <p class="text-xl font-bold text-white">{{ formatPrice(token.price) }}</p>
          <p :class="token.priceChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ token.priceChangePercent24h >= 0 ? '+' : '' }}{{ token.priceChangePercent24h.toFixed(2) }}%
          </p>
        </div>
        
        <!-- Indicators -->
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p class="text-slate-400">RSI</p>
            <p :class="getRsiColor(token.rsi)">{{ token.rsi.toFixed(1) }}</p>
          </div>
          <div>
            <p class="text-slate-400">MACD</p>
            <p :class="getMacdColor(token.macd)">{{ token.macd }}</p>
          </div>
          <div>
            <p class="text-slate-400">Trend</p>
            <p :class="getTrendColor(token.trend)">{{ token.trend }}</p>
          </div>
        </div>
        
        <!-- Score -->
        <div class="mt-3 pt-3 border-t border-slate-700/50">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400">Momentum Score</span>
            <span class="text-sm font-bold text-white">{{ token.momentumScore }}</span>
          </div>
          <div class="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all"
              :class="token.momentumScore >= 60 ? 'bg-green-400' : token.momentumScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'"
              :style="{ width: `${token.momentumScore}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Token Detail -->
    <div v-if="selectedToken" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click.self="selectedToken = null">
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <img v-if="selectedToken.logo" :src="selectedToken.logo" class="w-16 h-16 rounded-full" />
            <div>
              <h3 class="text-2xl font-bold text-white">{{ selectedToken.symbol }}</h3>
              <p class="text-slate-400">{{ selectedToken.name }}</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-white text-xl" @click="selectedToken = null">✕</button>
        </div>
        
        <!-- Price & Signal -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-700/50 rounded-xl p-4">
            <p class="text-sm text-slate-400">Price</p>
            <p class="text-2xl font-bold text-white">{{ formatPrice(selectedToken.price) }}</p>
            <p :class="selectedToken.priceChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ selectedToken.priceChangePercent24h >= 0 ? '+' : '' }}{{ selectedToken.priceChangePercent24h.toFixed(2) }}% (24h)
            </p>
          </div>
          <div class="bg-slate-700/50 rounded-xl p-4">
            <p class="text-sm text-slate-400">Signal</p>
            <p :class="['text-2xl font-bold', getSignalColor(selectedToken.signal).split(' ')[0]]">
              {{ selectedToken.signal.replace('_', ' ').toUpperCase() }}
            </p>
            <p class="text-sm text-slate-400">Strength: {{ selectedToken.strength }}/100</p>
          </div>
        </div>
        
        <!-- Technical Indicators -->
        <h4 class="text-lg font-semibold text-white mb-4">📊 Technical Indicators</h4>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">RSI (14)</p>
            <p :class="['text-lg font-bold', getRsiColor(selectedToken.rsi)]">{{ selectedToken.rsi.toFixed(1) }}</p>
            <p class="text-xs text-slate-500">{{ selectedToken.rsiSignal }}</p>
          </div>
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">MACD</p>
            <p :class="['text-lg font-bold', getMacdColor(selectedToken.macd)]">{{ selectedToken.macd.toUpperCase() }}</p>
            <p class="text-xs text-slate-500">Histogram: {{ selectedToken.macdHistogram.toFixed(4) }}</p>
          </div>
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">EMA 20</p>
            <p class="text-lg font-bold text-white">{{ formatPrice(selectedToken.ema20) }}</p>
          </div>
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">EMA 50</p>
            <p class="text-lg font-bold text-white">{{ formatPrice(selectedToken.ema50) }}</p>
          </div>
        </div>
        
        <!-- Trend & Volatility -->
        <h4 class="text-lg font-semibold text-white mb-4">📈 Trend Analysis</h4>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">Trend</p>
            <p :class="['text-lg font-bold', getTrendColor(selectedToken.trend)]">
              {{ selectedToken.trend.toUpperCase() }}
            </p>
          </div>
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">Volatility</p>
            <p :class="['text-lg font-bold', getVolatilityColor(selectedToken.volatility)]">
              {{ selectedToken.volatility.toUpperCase() }}
            </p>
          </div>
        </div>
        
        <!-- Market Data -->
        <h4 class="text-lg font-semibold text-white mb-4">💰 Market Data</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">Market Cap</p>
            <p class="text-lg font-bold text-white">{{ formatNumber(selectedToken.marketCap) }}</p>
          </div>
          <div class="bg-slate-700/50 rounded-xl p-3">
            <p class="text-xs text-slate-400">24h Volume</p>
            <p class="text-lg font-bold text-white">{{ formatNumber(selectedToken.volume24h) }}</p>
          </div>
        </div>
        
        <!-- Momentum Score -->
        <div class="mt-6 pt-4 border-t border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-400">Momentum Score</span>
            <span class="text-xl font-bold text-white">{{ selectedToken.momentumScore }}/100</span>
          </div>
          <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all"
              :class="selectedToken.momentumScore >= 60 ? 'bg-green-400' : selectedToken.momentumScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'"
              :style="{ width: `${selectedToken.momentumScore}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
