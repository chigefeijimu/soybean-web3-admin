<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { fetchCoinPrices } from '@/service/api/web3';

interface TickerItem {
  symbol: string;
  name: string;
  id: string;
  price: number;
  change: number;
}

const tickers = ref<TickerItem[]>([
  { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin', price: 0, change: 0 },
  { symbol: 'ETH', name: 'Ethereum', id: 'ethereum', price: 0, change: 0 },
  { symbol: 'SOL', name: 'Solana', id: 'solana', price: 0, change: 0 },
  { symbol: 'BNB', name: 'BNB', id: 'binancecoin', price: 0, change: 0 },
  { symbol: 'XRP', name: 'XRP', id: 'ripple', price: 0, change: 0 },
  { symbol: 'ADA', name: 'Cardano', id: 'cardano', price: 0, change: 0 },
  { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', price: 0, change: 0 },
  { symbol: 'DOT', name: 'Polkadot', id: 'polkadot', price: 0, change: 0 },
]);

const loading = ref(true);

const fetchPrices = async () => {
  try {
    const ids = tickers.value.map(t => t.id);
    const prices = await fetchCoinPrices(ids);
    
    tickers.value.forEach(ticker => {
      if (prices[ticker.id]) {
        ticker.price = prices[ticker.id].usd;
        ticker.change = prices[ticker.id].usd_24h_change;
      }
    });
  } catch (e) {
    console.error('Failed to fetch prices:', e);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price: number) => {
  if (price >= 1000) return '$' + price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toFixed(2);
  return '$' + price.toFixed(4);
};

onMounted(() => {
  fetchPrices();
  const interval = setInterval(fetchPrices, 15000); // Refresh every 15s
  onUnmounted(() => clearInterval(interval));
});
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-2">
    <div v-for="ticker in tickers" :key="ticker.symbol"
      class="flex-shrink-0 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div class="flex items-center gap-2">
        <span class="font-semibold">{{ ticker.symbol }}</span>
        <span :class="['text-xs', ticker.change >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ ticker.change >= 0 ? '↑' : '↓' }}{{ Math.abs(ticker.change).toFixed(1) }}%
        </span>
      </div>
      <div class="text-sm font-medium mt-1">{{ formatPrice(ticker.price) }}</div>
    </div>
  </div>
</template>
