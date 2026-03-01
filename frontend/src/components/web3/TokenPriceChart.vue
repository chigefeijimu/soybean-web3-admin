<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface PriceData {
  symbol: string;
  name: string;
  prices: PricePoint[];
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
}

// State
const searchQuery = ref('');
const selectedCoin = ref<any>(null);
const priceData = ref<PriceData | null>(null);
const isLoading = ref(false);
const error = ref('');
const selectedTimeframe = ref('7');
const searchResults = ref<any[]>([]);

// Popular coins for quick selection
const popularCoins = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', logo: '🟡' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', logo: '🔷' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', logo: '🟣' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', logo: '🟡' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', logo: '⚪' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', logo: '🔵' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', logo: '🐕' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', logo: '🟠' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', logo: '🔴' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', logo: '🔗' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', logo: '🟣' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', logo: '⚳' }
];

// Timeframe options
const timeframes = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
  { value: 'max', label: 'All' }
];

// Chart data
const chartData = computed(() => {
  if (!priceData.value?.prices) return [];
  return priceData.value.prices.map(p => ({
    x: p.timestamp,
    y: p.price
  }));
});

// Current price
const currentPrice = computed(() => {
  if (!priceData.value?.prices?.length) return 0;
  return priceData.value.prices[priceData.value.prices.length - 1]?.price || 0;
});

// Price change
const priceChange = computed(() => {
  if (!priceData.value) return { amount: 0, percent: 0 };
  return {
    amount: priceData.value.priceChange24h,
    percent: priceData.value.priceChangePercent24h
  };
});

// Chart dimensions
const chartWidth = ref(600);
const chartHeight = ref(300);

// Generate SVG path for the chart
const chartPath = computed(() => {
  if (!chartData.value.length) return '';
  
  const prices = chartData.value;
  const minPrice = Math.min(...prices.map(p => p.y));
  const maxPrice = Math.max(...prices.map(p => p.y));
  const priceRange = maxPrice - minPrice || 1;
  
  const width = chartWidth.value - 40;
  const height = chartHeight.value - 40;
  
  const points = prices.map((p, i) => {
    const x = 20 + (i / (prices.length - 1)) * width;
    const y = height - ((p.y - minPrice) / priceRange) * height + 20;
    return `${x},${y}`;
  });
  
  return `M ${points.join(' L ')}`;
});

// Area path for gradient fill
const areaPath = computed(() => {
  if (!chartData.value.length) return '';
  
  const prices = chartData.value;
  const minPrice = Math.min(...prices.map(p => p.y));
  const maxPrice = Math.max(...prices.map(p => p.y));
  const priceRange = maxPrice - minPrice || 1;
  
  const width = chartWidth.value - 40;
  const height = chartHeight.value - 40;
  
  const points = prices.map((p, i) => {
    const x = 20 + (i / (prices.length - 1)) * width;
    const y = height - ((p.y - minPrice) / priceRange) * height + 20;
    return `${x},${y}`;
  });
  
  return `M 20,${chartHeight.value - 20} L ${points.join(' L ')} L ${chartWidth.value - 20},${chartHeight.value - 20} Z`;
});

// Y-axis labels
const yAxisLabels = computed(() => {
  if (!chartData.value.length) return [];
  
  const prices = chartData.value.map(p => p.y);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const height = chartHeight.value - 40;
  const labels = [];
  for (let i = 0; i <= 4; i++) {
    const price = minPrice + ((maxPrice - minPrice) * (4 - i) / 4);
    const y = 20 + (i / 4) * height;
    labels.push({ price, y });
  }
  return labels;
});

// X-axis labels
const xAxisLabels = computed(() => {
  if (!priceData.value?.prices?.length) return [];
  
  const prices = priceData.value.prices;
  const width = chartWidth.value - 40;
  const labels = [];
  
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor((i / (labelCount - 1)) * (prices.length - 1));
    const point = prices[idx];
    if (point) {
      const x = 20 + (i / (labelCount - 1)) * width;
      const date = new Date(point.x);
      labels.push({
        label: formatDate(date),
        x
      });
    }
  }
  return labels;
});

// Format helpers
const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
};

const formatVolume = (vol: number): string => {
  if (vol >= 1e12) return `$${(vol / 1e12).toFixed(2)}T`;
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  return `$${vol.toLocaleString()}`;
};

const formatMarketCap = (mc: number): string => {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  return `$${mc.toLocaleString()}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Fetch price data
const fetchPriceData = async (coinId: string) => {
  if (!coinId) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`/api/web3/token-price/history/${coinId}?days=${selectedTimeframe.value}`);
    if (!response.ok) throw new Error('Failed to fetch price data');
    
    const data = await response.json();
    priceData.value = data;
    selectedCoin.value = popularCoins.find(c => c.id === coinId);
  } catch (e: any) {
    error.value = e.message || 'Failed to load price data';
    console.error('Error fetching price data:', e);
  } finally {
    isLoading.value = false;
  }
};

// Search for coins
const searchCoins = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  
  try {
    const response = await fetch(`/api/web3/token-price/search?q=${encodeURIComponent(searchQuery.value)}`);
    const data = await response.json();
    searchResults.value = data.slice(0, 8);
  } catch (e) {
    console.error('Search error:', e);
  }
};

// Select coin
const selectCoin = (coin: any) => {
  searchQuery.value = '';
  searchResults.value = [];
  fetchPriceData(coin.id);
};

// Watch timeframe changes
watch(selectedTimeframe, () => {
  if (selectedCoin.value) {
    fetchPriceData(selectedCoin.value.id);
  }
});

// Update chart dimensions on resize
const updateChartDimensions = () => {
  const container = document.querySelector('.chart-container');
  if (container) {
    chartWidth.value = Math.min(container.clientWidth - 20, 800);
  }
};

onMounted(() => {
  updateChartDimensions();
  window.addEventListener('resize', updateChartDimensions);
  
  // Load default coin
  fetchPriceData('bitcoin');
});
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
      <div>
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          📈 Token Price History
        </h3>
        <p class="text-sm text-slate-400 mt-1">Historical price charts for cryptocurrencies</p>
      </div>
      
      <!-- Search -->
      <div class="relative">
        <input
          v-model="searchQuery"
          @input="searchCoins"
          type="text"
          placeholder="Search coins..."
          class="w-full lg:w-64 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        
        <!-- Search Results -->
        <div
          v-if="searchResults.length > 0"
          class="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg overflow-hidden z-10"
        >
          <button
            v-for="coin in searchResults"
            :key="coin.id"
            @click="selectCoin(coin)"
            class="w-full px-4 py-2 text-left hover:bg-slate-600/50 flex items-center gap-3 text-white"
          >
            <img v-if="coin.thumb" :src="coin.thumb" class="w-6 h-6 rounded-full" />
            <span v-else class="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center text-xs">?</span>
            <span class="font-medium">{{ coin.symbol?.toUpperCase() }}</span>
            <span class="text-slate-400 text-sm">{{ coin.name }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Quick Select -->
    <div class="flex flex-wrap gap-2 mb-5">
      <button
        v-for="coin in popularCoins"
        :key="coin.id"
        @click="fetchPriceData(coin.id)"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          selectedCoin?.id === coin.id
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            : 'bg-slate-700/30 text-slate-300 border border-slate-600/50 hover:bg-slate-700/50'
        ]"
      >
        {{ coin.logo }} {{ coin.symbol }}
      </button>
    </div>
    
    <!-- Timeframe Selector -->
    <div class="flex gap-2 mb-5">
      <button
        v-for="tf in timeframes"
        :key="tf.value"
        @click="selectedTimeframe = tf.value"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          selectedTimeframe === tf.value
            ? 'bg-blue-500 text-white'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
        ]"
      >
        {{ tf.label }}
      </button>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
      <p class="text-red-400">{{ error }}</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
    
    <!-- Price Data -->
    <div v-else-if="priceData">
      <!-- Price Header -->
      <div class="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
        <div>
          <div class="flex items-baseline gap-3">
            <span class="text-3xl font-bold text-white">
              {{ formatPrice(currentPrice) }}
            </span>
            <span
              :class="[
                'text-lg font-medium',
                priceChange.percent >= 0 ? 'text-green-400' : 'text-red-400'
              ]"
            >
              {{ priceChange.percent >= 0 ? '+' : '' }}{{ priceChange.percent.toFixed(2) }}%
            </span>
          </div>
          <p class="text-slate-400 text-sm mt-1">
            {{ selectedCoin?.name || priceData.name }} ({{ selectedCoin?.symbol || priceData.symbol }})
          </p>
        </div>
        
        <!-- Stats -->
        <div class="flex flex-wrap gap-4 lg:ml-auto">
          <div class="bg-slate-700/30 rounded-lg px-3 py-2">
            <p class="text-xs text-slate-400">24h High</p>
            <p class="text-white font-medium">{{ formatPrice(priceData.high24h) }}</p>
          </div>
          <div class="bg-slate-700/30 rounded-lg px-3 py-2">
            <p class="text-xs text-slate-400">24h Low</p>
            <p class="text-white font-medium">{{ formatPrice(priceData.low24h) }}</p>
          </div>
          <div class="bg-slate-700/30 rounded-lg px-3 py-2">
            <p class="text-xs text-slate-400">Volume 24h</p>
            <p class="text-white font-medium">{{ formatVolume(priceData.volume24h) }}</p>
          </div>
          <div class="bg-slate-700/30 rounded-lg px-3 py-2">
            <p class="text-xs text-slate-400">Market Cap</p>
            <p class="text-white font-medium">{{ formatMarketCap(priceData.marketCap) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Chart -->
      <div class="chart-container relative">
        <svg
          :width="chartWidth"
          :height="chartHeight"
          class="w-full"
        >
          <!-- Grid lines -->
          <g class="grid">
            <line
              v-for="label in yAxisLabels"
              :key="label.y"
              x1="20"
              :y1="label.y"
              :x2="chartWidth - 20"
              :y2="label.y"
              stroke="#334155"
              stroke-width="1"
              stroke-dasharray="4,4"
            />
          </g>
          
          <!-- Y-axis labels -->
          <g class="y-axis">
            <text
              v-for="label in yAxisLabels"
              :key="label.y"
              x="15"
              :y="label.y + 4"
              fill="#94a3b8"
              font-size="10"
              text-anchor="end"
            >
              {{ formatPrice(label.price) }}
            </text>
          </g>
          
          <!-- X-axis labels -->
          <g class="x-axis">
            <text
              v-for="label in xAxisLabels"
              :key="label.x"
              :x="label.x"
              :y="chartHeight - 5"
              fill="#94a3b8"
              font-size="10"
              text-anchor="middle"
            >
              {{ label.label }}
            </text>
          </g>
          
          <!-- Area fill -->
          <path
            :d="areaPath"
            :fill="priceChange.percent >= 0 ? 'url(#gradientGreen)' : 'url(#gradientRed)'"
            opacity="0.3"
          />
          
          <!-- Line -->
          <path
            :d="chartPath"
            fill="none"
            :stroke="priceChange.percent >= 0 ? '#4ade80' : '#f87171'"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <!-- Gradient definitions -->
          <defs>
            <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#4ade80" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#4ade80" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="gradientRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#f87171" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#f87171" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-12 text-slate-400">
      <p>Select a coin to view price history</p>
    </div>
  </div>
</template>
