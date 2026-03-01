<script setup lang="ts">
import { computed, ref } from 'vue';

interface Order {
  price: number;
  amount: number;
  total: number;
}

const baseToken = ref('ETH');
const quoteToken = ref('USDC');

// Mock order book data
const sellOrders = ref<Order[]>([
  { price: 2505.5, amount: 2.5, total: 6263.75 },
  { price: 2505.0, amount: 1.8, total: 4509.0 },
  { price: 2504.5, amount: 3.2, total: 8014.4 },
  { price: 2504.0, amount: 1.5, total: 3756.0 },
  { price: 2503.5, amount: 2.0, total: 5007.0 },
  { price: 2503.0, amount: 1.2, total: 3003.6 },
  { price: 2502.5, amount: 2.8, total: 7007.0 },
  { price: 2502.0, amount: 1.5, total: 3753.0 },
  { price: 2501.5, amount: 3.0, total: 7504.5 },
  { price: 2501.0, amount: 2.2, total: 5502.2 }
]);

const buyOrders = ref<Order[]>([
  { price: 2500.5, amount: 2.0, total: 5001.0 },
  { price: 2500.0, amount: 3.5, total: 8750.0 },
  { price: 2499.5, amount: 1.8, total: 4499.1 },
  { price: 2499.0, amount: 2.5, total: 6247.5 },
  { price: 2498.5, amount: 1.2, total: 2998.2 },
  { price: 2498.0, amount: 3.0, total: 7494.0 },
  { price: 2497.5, amount: 2.0, total: 4995.0 },
  { price: 2497.0, amount: 1.5, total: 3745.5 },
  { price: 2496.5, amount: 2.8, total: 6990.2 },
  { price: 2496.0, amount: 2.2, total: 5491.2 }
]);

const spread = computed(() => {
  const bestSell = sellOrders.value[0]?.price || 0;
  const bestBuy = buyOrders.value[0]?.price || 0;
  return bestSell - bestBuy;
});

const spreadPercent = computed(() => {
  const mid = (sellOrders.value[0]?.price + buyOrders.value[0]?.price) / 2;
  return (spread.value / mid) * 100;
});

const maxTotal = computed(() => {
  const maxSell = Math.max(...sellOrders.value.map(o => o.total));
  const maxBuy = Math.max(...buyOrders.value.map(o => o.total));
  return Math.max(maxSell, maxBuy);
});

const getDepthWidth = (total: number) => {
  return (total / maxTotal.value) * 100;
};

const formatPrice = (price: number) => price.toFixed(1);
const formatAmount = (amount: number) => amount.toFixed(4);
const formatTotal = (total: number) => total.toFixed(2);
</script>

<template>
  <div class="overflow-hidden border border-slate-700/50 rounded-2xl bg-slate-800/50 backdrop-blur-xl">
    <!-- Header -->
    <div class="border-b border-slate-700/50 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ baseToken }}/{{ quoteToken }}</h2>
        <span class="text-xs text-slate-500">Order Book</span>
      </div>

      <!-- Spread -->
      <div class="mt-2 flex items-center gap-2 text-sm">
        <span class="text-slate-400">Spread:</span>
        <span class="font-medium">${{ spread.toFixed(2) }}</span>
        <span class="text-slate-500">({{ spreadPercent.toFixed(3) }}%)</span>
      </div>
    </div>

    <!-- Column Headers -->
    <div class="grid grid-cols-3 gap-2 border-b border-slate-700/50 px-4 py-2 text-xs text-slate-500">
      <span>Price ({{ quoteToken }})</span>
      <span class="text-right">Amount ({{ baseToken }})</span>
      <span class="text-right">Total</span>
    </div>

    <!-- Sells (Asks) -->
    <div class="divide-y divide-slate-700/30">
      <div
        v-for="(order, i) in sellOrders.slice().reverse()"
        :key="'sell-' + i"
        class="relative grid grid-cols-3 gap-2 px-4 py-1.5 text-sm"
      >
        <div class="absolute inset-y-0 right-0 bg-red-500/10" :style="{ width: getDepthWidth(order.total) + '%' }" />
        <span class="relative z-10 text-red-400">{{ formatPrice(order.price) }}</span>
        <span class="relative z-10 text-right">{{ formatAmount(order.amount) }}</span>
        <span class="relative z-10 text-right text-slate-400">{{ formatTotal(order.total) }}</span>
      </div>
    </div>

    <!-- Mid Price -->
    <div class="border-y border-slate-700/50 bg-slate-700/30 px-4 py-3">
      <div class="text-center">
        <span class="text-xl text-green-400 font-bold">${{ (sellOrders[0].price + buyOrders[0].price) / 2 }}</span>
        <span class="ml-2 text-xs text-slate-500">Mid Price</span>
      </div>
    </div>

    <!-- Buys (Bids) -->
    <div class="divide-y divide-slate-700/30">
      <div
        v-for="(order, i) in buyOrders"
        :key="'buy-' + i"
        class="relative grid grid-cols-3 gap-2 px-4 py-1.5 text-sm"
      >
        <div class="absolute inset-y-0 right-0 bg-green-500/10" :style="{ width: getDepthWidth(order.total) + '%' }" />
        <span class="relative z-10 text-green-400">{{ formatPrice(order.price) }}</span>
        <span class="relative z-10 text-right">{{ formatAmount(order.amount) }}</span>
        <span class="relative z-10 text-right text-slate-400">{{ formatTotal(order.total) }}</span>
      </div>
    </div>

    <!-- Footer Stats -->
    <div class="grid grid-cols-2 gap-2 border-t border-slate-700/50 p-3 text-xs">
      <div class="text-center">
        <span class="text-slate-500">24h Volume</span>
        <p class="font-medium">$12.5M</p>
      </div>
      <div class="text-center">
        <span class="text-slate-500">Depth</span>
        <p class="font-medium">$125K</p>
      </div>
    </div>
  </div>
</template>
