<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { fetchOrderBook, getTradingPairs, type OrderBookData } from '@/service/api/web3';

interface Order {
  price: number;
  amount: number;
  total: number;
}

const selectedPair = ref('ETHUSDT');
const tradingPairs = getTradingPairs();

const sellOrders = ref<Order[]>([]);
const buyOrders = ref<Order[]>([]);
const lastUpdate = ref('');
const loading = ref(false);

const spread = computed(() => {
  const bestSell = sellOrders.value[0]?.price || 0;
  const bestBuy = buyOrders.value[0]?.price || 0;
  return bestSell - bestBuy;
});

const spreadPercent = computed(() => {
  const bestSell = sellOrders.value[0]?.price || 0;
  const bestBuy = buyOrders.value[0]?.price || 0;
  const mid = (bestSell + bestBuy) / 2;
  return mid > 0 ? (spread.value / mid) * 100 : 0;
});

const maxTotal = computed(() => {
  const maxSell = Math.max(...sellOrders.value.map(o => o.total), 0);
  const maxBuy = Math.max(...buyOrders.value.map(o => o.total), 0);
  return Math.max(maxSell, maxBuy, 1);
});

const fetchData = async () => {
  try {
    loading.value = true;
    const data: OrderBookData = await fetchOrderBook(selectedPair.value);
    
    sellOrders.value = data.sellOrders.map(o => ({
      price: parseFloat(o.price),
      amount: parseFloat(o.amount),
      total: parseFloat(o.total)
    }));
    
    buyOrders.value = data.buyOrders.map(o => ({
      price: parseFloat(o.price),
      amount: parseFloat(o.amount),
      total: parseFloat(o.total)
    }));
    
    lastUpdate.value = new Date(data.lastUpdate).toLocaleTimeString();
  } catch (e) {
    console.error('Failed to fetch order book:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
  const interval = setInterval(fetchData, 3000);
  onUnmounted(() => clearInterval(interval));
});

const getDepthWidth = (total: number) => (total / maxTotal.value) * 100;
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-4 border-b border-slate-700/50">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">📊 Order Book</h2>
        <select v-model="selectedPair" @change="fetchData" class="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm">
          <option v-for="pair in tradingPairs" :key="pair.symbol" :value="pair.symbol">{{ pair.base }}/{{ pair.quote }}</option>
        </select>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-400">Spread: <span class="text-white">{{ spread.toFixed(2) }}</span></span>
        <span class="text-slate-400">{{ spreadPercent.toFixed(3) }}%</span>
        <span v-if="lastUpdate" class="text-slate-500 text-xs">Updated: {{ lastUpdate }}</span>
      </div>
    </div>

    <div class="grid grid-cols-3 px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50">
      <span>Price (USDT)</span>
      <span class="text-right">Amount</span>
      <span class="text-right">Total</span>
    </div>

    <div class="max-h-64 overflow-y-auto">
      <div v-for="(order, i) in sellOrders.slice(0, 10)" :key="'sell-'+i" class="grid grid-cols-3 px-4 py-1.5 text-sm relative">
        <div class="absolute right-0 top-0 bottom-0 bg-red-500/20" :style="{ width: getDepthWidth(order.total) + '%' }" />
        <span class="text-red-400 relative z-10">{{ order.price.toFixed(2) }}</span>
        <span class="text-right relative z-10">{{ order.amount.toFixed(4) }}</span>
        <span class="text-right relative z-10">{{ order.total.toFixed(2) }}</span>
      </div>
    </div>

    <div class="px-4 py-3 bg-slate-900/50 border-y border-slate-700/50">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">Last Price</span>
        <span class="text-xl font-bold text-green-400">{{ sellOrders[0]?.price.toFixed(2) || '---' }}</span>
      </div>
    </div>

    <div class="max-h-64 overflow-y-auto">
      <div v-for="(order, i) in buyOrders.slice(0, 10)" :key="'buy-'+i" class="grid grid-cols-3 px-4 py-1.5 text-sm relative">
        <div class="absolute right-0 top-0 bottom-0 bg-green-500/20" :style="{ width: getDepthWidth(order.total) + '%' }" />
        <span class="text-green-400 relative z-10">{{ order.price.toFixed(2) }}</span>
        <span class="text-right relative z-10">{{ order.amount.toFixed(4) }}</span>
        <span class="text-right relative z-10">{{ order.total.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>
