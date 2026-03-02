<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useWebSocketPrice, type TokenPrice } from '../../composables/web3-price/useWebSocketPrice';

const {
  prices,
  isConnected,
  error,
  marketOverview,
  connect,
  fetchPrices,
  fetchMarketOverview,
  fetchTrending
} = useWebSocketPrice();

const apiUrl = 'http://localhost:3022';
const trending = ref<{ gainers: TokenPrice[]; losers: TokenPrice[] } | null>(null);
const selectedTimeframe = ref('24h');
const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');

const filteredPrices = computed(() => {
  if (!searchQuery.value) return prices.value;
  const query = searchQuery.value.toLowerCase();
  return prices.value.filter(
    p => p.symbol.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
  );
});

const formatPrice = (price: number) => {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
};

const formatPercent = (percent: number) => {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

const formatVolume = (volume: number) => {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
};

const formatMarketCap = (cap: number) => {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toFixed(2)}`;
};

const getChangeClass = (percent: number) => {
  if (percent > 0) return 'text-green-500';
  if (percent < 0) return 'text-red-500';
  return 'text-gray-500';
};

onMounted(async () => {
  // Try WebSocket first, fallback to REST
  connect('ws://localhost:3022');
  
  // Also fetch via REST as backup
  await fetchPrices(apiUrl);
  await fetchMarketOverview(apiUrl);
  trending.value = await fetchTrending(apiUrl);
});
</script>

<template>
  <div class="p-6 bg-gray-900 min-h-screen text-white">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold flex items-center gap-3">
            <span class="text-4xl">📡</span>
            Real-time Price Feed
            <span v-if="isConnected" class="px-2 py-1 text-xs bg-green-600 rounded-full">LIVE</span>
          </h1>
          <p class="text-gray-400 mt-2">WebSocket-powered real-time cryptocurrency prices</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <div class="text-sm text-gray-400">Total Market Cap</div>
            <div class="text-xl font-bold">{{ formatMarketCap(marketOverview?.totalMarketCap || 0) }}</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-400">24h Volume</div>
            <div class="text-xl font-bold">{{ formatVolume(marketOverview?.totalVolume24h || 0) }}</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-400">BTC Dominance</div>
            <div class="text-xl font-bold">{{ (marketOverview?.btcDominance || 0).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
      {{ error }}
    </div>

    <!-- Trending Section -->
    <div v-if="trending" class="grid grid-cols-2 gap-6 mb-6">
      <!-- Top Gainers -->
      <div class="bg-gray-800 rounded-xl p-4">
        <h3 class="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>🚀</span> Top Gainers (24h)
        </h3>
        <div class="space-y-2">
          <div 
            v-for="token in trending.gainers" 
            :key="token.id"
            class="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg"
          >
            <div>
              <span class="font-bold">{{ token.symbol }}</span>
              <span class="text-gray-400 text-sm ml-2">{{ token.name }}</span>
            </div>
            <div class="text-right">
              <div class="font-mono">${{ formatPrice(token.price) }}</div>
              <div class="text-green-400 text-sm">{{ formatPercent(token.priceChangePercent24h) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Losers -->
      <div class="bg-gray-800 rounded-xl p-4">
        <h3 class="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <span>📉</span> Top Losers (24h)
        </h3>
        <div class="space-y-2">
          <div 
            v-for="token in trending.losers" 
            :key="token.id"
            class="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg"
          >
            <div>
              <span class="font-bold">{{ token.symbol }}</span>
              <span class="text-gray-400 text-sm ml-2">{{ token.name }}</span>
            </div>
            <div class="text-right">
              <div class="font-mono">${{ formatPrice(token.price) }}</div>
              <div class="text-red-400 text-sm">{{ formatPercent(token.priceChangePercent24h) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tokens..."
          class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="viewMode = 'grid'"
          :class="['px-4 py-2 rounded-lg', viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-800']"
        >
          Grid
        </button>
        <button
          @click="viewMode = 'list'"
          :class="['px-4 py-2 rounded-lg', viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-800']"
        >
          List
        </button>
      </div>
    </div>

    <!-- Price Grid -->
    <div 
      v-if="viewMode === 'grid'"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <div
        v-for="token in filteredPrices"
        :key="token.id"
        class="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors cursor-pointer"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">
              {{ token.symbol === 'BTC' ? '₿' : token.symbol === 'ETH' ? 'Ξ' : '●' }}
            </span>
            <div>
              <div class="font-bold">{{ token.symbol }}</div>
              <div class="text-xs text-gray-400">{{ token.name }}</div>
            </div>
          </div>
          <div 
            :class="['text-sm font-medium px-2 py-1 rounded', getChangeClass(token.priceChangePercent24h)]"
          >
            {{ formatPercent(token.priceChangePercent24h) }}
          </div>
        </div>
        <div class="text-2xl font-mono font-bold mb-2">${{ formatPrice(token.price) }}</div>
        <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>
            <span class="text-gray-500">High:</span>
            ${{ formatPrice(token.high24h) }}
          </div>
          <div>
            <span class="text-gray-500">Low:</span>
            ${{ formatPrice(token.low24h) }}
          </div>
          <div class="col-span-2">
            <span class="text-gray-500">Volume:</span> {{ formatVolume(token.volume24h) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Price List -->
    <div v-else class="bg-gray-800 rounded-xl overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Token</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Price</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-300">24h Change</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-300">24h High</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-300">24h Low</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Volume</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Market Cap</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
          <tr 
            v-for="token in filteredPrices" 
            :key="token.id"
            class="hover:bg-gray-700/50"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">
                  {{ token.symbol === 'BTC' ? '₿' : token.symbol === 'ETH' ? 'Ξ' : '●' }}
                </span>
                <div>
                  <div class="font-bold">{{ token.symbol }}</div>
                  <div class="text-xs text-gray-400">{{ token.name }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-right font-mono">${{ formatPrice(token.price) }}</td>
            <td :class="['px-4 py-3 text-right font-medium', getChangeClass(token.priceChangePercent24h)]">
              {{ formatPercent(token.priceChangePercent24h) }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-gray-400">${{ formatPrice(token.high24h) }}</td>
            <td class="px-4 py-3 text-right font-mono text-gray-400">${{ formatPrice(token.low24h) }}</td>
            <td class="px-4 py-3 text-right text-gray-400">{{ formatVolume(token.volume24h) }}</td>
            <td class="px-4 py-3 text-right text-gray-400">{{ formatMarketCap(token.marketCap) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Connection Status -->
    <div class="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
      <span 
        :class="['w-2 h-2 rounded-full', isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500']"
      ></span>
      <span class="text-sm text-gray-300">
        {{ isConnected ? 'WebSocket Connected' : 'Disconnected' }}
      </span>
    </div>
  </div>
</template>
