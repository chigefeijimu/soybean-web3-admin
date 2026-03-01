<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { getTopCoins } from '@/service/api/web3';

interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparkline?: number[];
}

const tokens = ref<Token[]>([]);
const loading = ref(true);
const selectedFilter = ref<'all' | 'gainers' | 'losers'>('all');

const fetchPrices = async () => {
  try {
    const res = await getTopCoins(20);
    if (res.data?.data) {
      tokens.value = res.data.data.map((t: any) => ({
        symbol: t.symbol,
        name: t.name,
        price: t.price,
        change24h: t.change_percent_24h,
        volume24h: t.volume_24h,
        marketCap: t.market_cap,
        sparkline: []
      }));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch prices:', e);
  } finally {
    loading.value = false;
  }
};

const filteredTokens = () => {
  if (selectedFilter.value === 'gainers') {
    return tokens.value.filter(t => t.change24h > 0).sort((a, b) => b.change24h - a.change24h);
  }
  if (selectedFilter.value === 'losers') {
    return tokens.value.filter(t => t.change24h < 0).sort((a, b) => a.change24h - b.change24h);
  }
  return tokens.value;
};

const formatPrice = (price: number) => {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
};

const formatVolume = (vol: number) => {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  return vol.toLocaleString();
};

const formatMarketCap = (cap: number) => {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
};

let interval: number;
onMounted(() => {
  fetchPrices();
  interval = window.setInterval(fetchPrices, 30000); // 30s刷新
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <div class="overflow-hidden border border-slate-700/50 rounded-2xl bg-slate-800/50 backdrop-blur-xl">
    <!-- Header -->
    <div class="border-b border-slate-700/50 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">🔥 Trending</h2>

        <!-- Filters -->
        <div class="flex gap-1 rounded-lg bg-slate-900/50 p-1">
          <button
            v-for="filter in ['all', 'gainers', 'losers']"
            :key="filter"
            class="rounded px-3 py-1 text-sm font-medium transition-colors"
            :class="[
              selectedFilter === filter ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            ]"
            @click="selectedFilter = filter as any"
          >
            {{ filter === 'gainers' ? '📈' : filter === 'losers' ? '📉' : '📊' }}
            {{ filter.charAt(0).toUpperCase() + filter.slice(1) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center">
      <div class="mx-auto h-8 w-8 animate-spin border-2 border-purple-500 border-t-transparent rounded-full"></div>
      <p class="mt-2 text-slate-400">Loading market data...</p>
    </div>

    <!-- Token List -->
    <div v-else class="max-h-[600px] overflow-y-auto divide-y divide-slate-700/50">
      <div
        v-for="(token, index) in filteredTokens()"
        :key="token.symbol"
        class="cursor-pointer p-4 transition-colors hover:bg-slate-700/30"
      >
        <div class="flex items-center gap-3">
          <!-- Rank -->
          <span class="w-6 text-sm text-slate-500">{{ index + 1 }}</span>

          <!-- Icon -->
          <div
            class="h-10 w-10 flex items-center justify-center rounded-full from-purple-500 to-blue-500 bg-gradient-to-br font-bold"
          >
            {{ token.symbol.charAt(0) }}
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ token.symbol }}</span>
              <span class="truncate text-sm text-slate-500">{{ token.name }}</span>
            </div>
            <div class="text-xs text-slate-500">
              Vol: {{ formatVolume(token.volume24h) }} • MCap:
              {{ formatMarketCap(token.marketCap) }}
            </div>
          </div>

          <!-- Price -->
          <div class="text-right">
            <p class="font-semibold">${{ formatPrice(token.price) }}</p>
            <p class="text-sm font-medium" :class="[token.change24h >= 0 ? 'text-green-400' : 'text-red-400']">
              {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-slate-700/50 p-3 text-center">
      <span class="text-xs text-slate-500">Data from CoinGecko • Auto-refresh 30s</span>
    </div>
  </div>
</template>
