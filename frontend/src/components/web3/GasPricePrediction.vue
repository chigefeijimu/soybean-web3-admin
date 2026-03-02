<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface Prediction {
  timeframe: string;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

interface ChainData {
  chainId: number;
  chainName: string;
  current: {
    slow: number;
    normal: number;
    fast: number;
  };
  predictions: Prediction[];
  analysis: {
    volatility: 'low' | 'medium' | 'high';
    trend: string;
    bestTimeToTransact: string;
    avgPrice: number;
  };
}

const chains = ref<ChainData[]>([]);
const selectedChain = ref<number>(1);
const loading = ref(true);
const error = ref('');

const chainOptions = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', logo: '🔷' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', logo: '🟣' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', logo: '🔵' },
  { id: 10, name: 'Optimism', symbol: 'ETH', logo: '🟠' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB', logo: '🟡' },
  { id: 8453, name: 'Base', symbol: 'ETH', logo: '⚫' },
  { id: 43114, name: 'Avalanche', symbol: 'AVAX', logo: '🔴' },
];

const selectedChainData = computed(() => {
  return chains.value.find(c => c.chainId === selectedChain.value) || chains.value[0];
});

const getVolatilityColor = (volatility: string) => {
  switch (volatility) {
    case 'low': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return 'text-red-400';
    case 'down': return 'text-green-400';
    default: return 'text-gray-400';
  }
};

const fetchPredictions = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetch('/api/gas-price-prediction');
    if (!response.ok) throw new Error('Failed to fetch predictions');
    const data = await response.json();
    chains.value = data;
  } catch (e: any) {
    error.value = e.message;
    // Use mock data on error
    chains.value = generateMockData();
  } finally {
    loading.value = false;
  }
};

const generateMockData = (): ChainData[] => {
  return chainOptions.map(chain => ({
    chainId: chain.id,
    chainName: chain.name,
    current: {
      slow: Math.round((15 + Math.random() * 10) * 100) / 100,
      normal: Math.round((25 + Math.random() * 15) * 100) / 100,
      fast: Math.round((40 + Math.random() * 20) * 100) / 100,
    },
    predictions: [
      { timeframe: '1h', predicted: Math.round((20 + Math.random() * 10) * 100) / 100, confidence: 75, trend: 'stable', recommendation: 'Normal conditions' },
      { timeframe: '4h', predicted: Math.round((18 + Math.random() * 12) * 100) / 100, confidence: 65, trend: 'down', recommendation: 'Consider waiting' },
      { timeframe: '12h', predicted: Math.round((22 + Math.random() * 15) * 100) / 100, confidence: 55, trend: 'up', recommendation: 'Transact soon' },
      { timeframe: '24h', predicted: Math.round((25 + Math.random() * 20) * 100) / 100, confidence: 45, trend: 'up', recommendation: 'Best to transact now' },
    ],
    analysis: {
      volatility: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
      trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)],
      bestTimeToTransact: Math.random() > 0.5 ? 'Off-peak hours' : 'Current time is good',
      avgPrice: Math.round((20 + Math.random() * 10) * 100) / 100,
    },
  }));
};

onMounted(() => {
  fetchPredictions();
});
</script>

<template>
  <div class="gas-prediction">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">🔮 Gas Price Prediction</h2>
      <p class="text-slate-400">AI-powered gas price forecasts to optimize your transaction costs</p>
    </div>

    <!-- Chain Selector -->
    <div class="mb-6">
      <label class="text-sm text-slate-400 mb-2 block">Select Network</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="chain in chainOptions"
          :key="chain.id"
          class="px-4 py-2 rounded-lg transition-all"
          :class="selectedChain === chain.id 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'"
          @click="selectedChain = chain.id"
        >
          {{ chain.logo }} {{ chain.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin text-4xl">⏳</div>
      <p class="text-slate-400 mt-4">Loading predictions...</p>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <div class="text-4xl mb-4">⚠️</div>
      <p class="text-red-400">{{ error }}</p>
    </div>

    <div v-else-if="selectedChainData" class="space-y-6">
      <!-- Current Prices -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold text-white mb-4">📊 Current Gas Prices</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-slate-900/50 rounded-xl p-4 text-center">
            <p class="text-sm text-slate-400 mb-1">🐢 Slow</p>
            <p class="text-xl font-bold text-green-400">{{ selectedChainData.current.slow }} Gwei</p>
          </div>
          <div class="bg-slate-900/50 rounded-xl p-4 text-center">
            <p class="text-sm text-slate-400 mb-1">🚗 Normal</p>
            <p class="text-xl font-bold text-yellow-400">{{ selectedChainData.current.normal }} Gwei</p>
          </div>
          <div class="bg-slate-900/50 rounded-xl p-4 text-center">
            <p class="text-sm text-slate-400 mb-1">🚀 Fast</p>
            <p class="text-xl font-bold text-red-400">{{ selectedChainData.current.fast }} Gwei</p>
          </div>
        </div>
      </div>

      <!-- Analysis -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold text-white mb-4">📈 Market Analysis</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-900/50 rounded-xl p-4">
            <p class="text-sm text-slate-400 mb-1">Volatility</p>
            <p class="text-lg font-semibold" :class="getVolatilityColor(selectedChainData.analysis.volatility)">
              {{ selectedChainData.analysis.volatility.toUpperCase() }}
            </p>
          </div>
          <div class="bg-slate-900/50 rounded-xl p-4">
            <p class="text-sm text-slate-400 mb-1">Trend</p>
            <p class="text-lg font-semibold text-white">{{ selectedChainData.analysis.trend }}</p>
          </div>
          <div class="bg-slate-900/50 rounded-xl p-4">
            <p class="text-sm text-slate-400 mb-1">24h Avg</p>
            <p class="text-lg font-semibold text-white">{{ selectedChainData.analysis.avgPrice }} Gwei</p>
          </div>
          <div class="bg-slate-900/50 rounded-xl p-4">
            <p class="text-sm text-slate-400 mb-1">Best Time</p>
            <p class="text-sm font-semibold text-purple-400">{{ selectedChainData.analysis.bestTimeToTransact }}</p>
          </div>
        </div>
      </div>

      <!-- Predictions -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold text-white mb-4">🔮 Price Predictions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="pred in selectedChainData.predictions"
            :key="pred.timeframe"
            class="bg-slate-900/50 rounded-xl p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-slate-400">{{ pred.timeframe }}</span>
              <span class="text-lg">{{ getTrendIcon(pred.trend) }}</span>
            </div>
            <p class="text-2xl font-bold text-white mb-1">{{ pred.predicted }} Gwei</p>
            <p class="text-xs mb-2" :class="getTrendColor(pred.trend)">
              {{ pred.trend.toUpperCase() }}
            </p>
            <p class="text-xs text-slate-400 mb-2">Confidence: {{ pred.confidence }}%</p>
            <p class="text-xs text-purple-400">{{ pred.recommendation }}</p>
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold text-white mb-4">💡 Pro Tips</h3>
        <ul class="space-y-2 text-slate-300">
          <li class="flex items-start gap-2">
            <span class="text-green-400">✓</span>
            <span>Transact during off-peak hours (22:00-06:00 UTC) for lower fees</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-400">✓</span>
            <span>Use "Slow" speed for non-urgent transactions to save up to 50%</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-400">✓</span>
            <span>Monitor predictions before making batch transactions</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-green-400">✓</span>
            <span>Set up alerts for optimal gas price thresholds</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gas-prediction {
  @apply p-6;
}
</style>
