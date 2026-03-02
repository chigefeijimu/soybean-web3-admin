<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  getPriceComparison, 
  getMultiPriceComparison, 
  getOracleStatus, 
  getSupportedOracleTokens,
  type PriceComparison,
  type OracleStatus,
  type SupportedToken
} from '@/service/api/web3';

// State
const selectedSymbol = ref('BTC');
const comparisons = ref<PriceComparison[]>([]);
const oracleStatus = ref<OracleStatus[]>([]);
const supportedTokens = ref<SupportedToken[]>([]);
const loading = ref(false);
const error = ref('');
const selectedSymbols = ref<string[]>(['BTC', 'ETH', 'SOL']);

// Fetch functions
const fetchOracleStatus = async () => {
  try {
    const res = await getOracleStatus();
    if (res.success) {
      oracleStatus.value = res.data;
    }
  } catch (e) {
    console.error('Failed to fetch oracle status:', e);
  }
};

const fetchSupportedTokens = async () => {
  try {
    const res = await getSupportedOracleTokens();
    if (res.success) {
      supportedTokens.value = res.data;
    }
  } catch (e) {
    console.error('Failed to fetch supported tokens:', e);
  }
};

const fetchComparison = async (symbol: string) => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getPriceComparison(symbol);
    if (res.success) {
      const existing = comparisons.value.findIndex(c => c.symbol === symbol);
      if (existing >= 0) {
        comparisons.value[existing] = res.data;
      } else {
        comparisons.value.push(res.data);
      }
    } else {
      error.value = res.msg || 'Failed to fetch price comparison';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch price comparison';
  } finally {
    loading.value = false;
  }
};

const fetchMultipleComparisons = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getMultiPriceComparison(selectedSymbols.value);
    if (res.success) {
      comparisons.value = res.data;
    } else {
      error.value = res.msg || 'Failed to fetch price comparisons';
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch price comparisons';
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatPrice = (price: number) => {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toFixed(4);
  } else {
    return price.toFixed(6);
  }
};

const formatPercent = (percent: number) => {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString();
};

const getSourceIcon = (source: string) => {
  const icons: Record<string, string> = {
    'CoinGecko': '📊',
    'Binance': '💹',
    'Chainlink': '⛓️',
    'Uniswap': '🦄',
  };
  return icons[source] || '💰';
};

const getStatusColor = (status: string) => {
  return status === 'online' ? 'text-green-400' : 'text-red-400';
};

const getConfidenceColor = (confidence: number | null) => {
  if (!confidence) return 'text-gray-400';
  if (confidence >= 0.95) return 'text-green-400';
  if (confidence >= 0.85) return 'text-yellow-400';
  return 'text-red-400';
};

// Toggle symbol selection
const toggleSymbol = (symbol: string) => {
  const index = selectedSymbols.value.indexOf(symbol);
  if (index >= 0) {
    selectedSymbols.value.splice(index, 1);
  } else {
    selectedSymbols.value.push(symbol);
  }
};

// Computed
const hasArbitrage = computed(() => {
  return comparisons.value.some(c => c.arbitrageOpportunity);
});

// Lifecycle
onMounted(async () => {
  await fetchOracleStatus();
  await fetchSupportedTokens();
  await fetchMultipleComparisons();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">Oracle Price Comparison</h2>
        <p class="text-slate-400 text-sm">Compare prices from multiple oracle sources</p>
      </div>
      
      <!-- Quick Actions -->
      <button
        @click="fetchMultipleComparisons"
        :disabled="loading"
        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
      >
        <span v-if="loading" class="animate-spin">⏳</span>
        <span>{{ loading ? 'Loading...' : '🔄 Refresh All' }}</span>
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="border border-red-500/50 rounded-lg bg-red-500/20 p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <!-- Oracle Status -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
      <h3 class="text-lg font-semibold text-white mb-4">🔌 Oracle Status</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="status in oracleStatus" :key="status.source" 
          class="border border-slate-700/50 rounded-lg p-3 bg-slate-800/30">
          <div class="flex items-center justify-between">
            <span class="text-white font-medium">{{ getSourceIcon(status.source) }} {{ status.source }}</span>
            <span :class="getStatusColor(status.status)" class="text-sm">● {{ status.status }}</span>
          </div>
          <div class="mt-2 text-xs text-slate-400">
            Latency: {{ status.latencyMs }}ms
          </div>
        </div>
      </div>
    </div>

    <!-- Token Selection -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
      <h3 class="text-lg font-semibold text-white mb-4">� Select Tokens to Compare</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="token in supportedTokens"
          :key="token.symbol"
          @click="toggleSymbol(token.symbol)"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            selectedSymbols.includes(token.symbol)
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          ]"
        >
          {{ token.symbol }}
        </button>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <button
          @click="fetchMultipleComparisons"
          :disabled="loading || selectedSymbols.length === 0"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg text-white text-sm font-medium transition-colors"
        >
          Compare Selected ({{ selectedSymbols.length }})
        </button>
      </div>
    </div>

    <!-- Arbitrage Alert -->
    <div v-if="hasArbitrage" class="border border-yellow-500/50 rounded-xl bg-yellow-500/20 p-4">
      <div class="flex items-center gap-3">
        <span class="text-2xl">💰</span>
        <div>
          <h3 class="text-yellow-300 font-semibold">Arbitrage Opportunity Detected!</h3>
          <p class="text-yellow-200/70 text-sm">Price differences between oracles exceed 0.5%</p>
        </div>
      </div>
    </div>

    <!-- Price Comparisons -->
    <div class="space-y-4">
      <div v-for="comparison in comparisons" :key="comparison.symbol" 
        class="border border-slate-700/50 rounded-xl bg-slate-800/50 overflow-hidden">
        <!-- Header -->
        <div class="bg-slate-700/30 px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">₿</span>
            <div>
              <h3 class="text-white font-bold text-lg">{{ comparison.symbol }}</h3>
              <p class="text-slate-400 text-sm">Average: ${{ formatPrice(comparison.averagePrice) }}</p>
            </div>
          </div>
          <div class="text-right">
            <div :class="[
              'text-lg font-bold',
              comparison.priceDiffPercent > 1 ? 'text-red-400' : 
              comparison.priceDiffPercent > 0.5 ? 'text-yellow-400' : 'text-green-400'
            ]">
              ±{{ comparison.priceDiffPercent.toFixed(2) }}%
            </div>
            <p class="text-slate-400 text-xs">Price Difference</p>
          </div>
        </div>

        <!-- Price Cards -->
        <div class="p-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div v-for="price in comparison.prices" :key="price.source"
              :class="[
                'border rounded-lg p-3 transition-all',
                price.source === comparison.highestPrice.source ? 'border-red-500/50 bg-red-500/10' :
                price.source === comparison.lowestPrice.source ? 'border-green-500/50 bg-green-500/10' :
                'border-slate-700/50'
              ]"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-slate-300">{{ getSourceIcon(price.source) }} {{ price.source }}</span>
                <span v-if="price.source === comparison.highestPrice.source" class="text-xs text-red-400">↑ High</span>
                <span v-if="price.source === comparison.lowestPrice.source" class="text-xs text-green-400">↓ Low</span>
              </div>
              <div class="text-xl font-bold text-white">${{ formatPrice(price.price) }}</div>
              <div class="flex items-center justify-between mt-2">
                <span :class="getConfidenceColor(price.confidence)" class="text-xs">
                  {{ price.confidence ? (price.confidence * 100).toFixed(0) : '--' }}% confidence
                </span>
                <span v-if="price.change24h !== null" :class="price.change24h >= 0 ? 'text-green-400' : 'text-red-400'" class="text-xs">
                  {{ formatPercent(price.change24h) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Arbitrage Suggestion -->
        <div v-if="comparison.arbitrageOpportunity" class="px-4 py-3 bg-yellow-500/10 border-t border-yellow-500/30">
          <div class="flex items-center gap-2 text-yellow-300">
            <span>💡</span>
            <span class="text-sm">
              Buy on <strong>{{ comparison.lowestPrice.source }}</strong> at ${{ formatPrice(comparison.lowestPrice.price) }}, 
              sell on <strong>{{ comparison.highestPrice.source }}</strong> at ${{ formatPrice(comparison.highestPrice.price) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="comparisons.length === 0 && !loading" class="text-center py-12">
      <div class="text-4xl mb-4">📊</div>
      <p class="text-slate-400">Select tokens above to compare prices</p>
    </div>
  </div>
</template>
