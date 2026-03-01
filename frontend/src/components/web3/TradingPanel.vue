<script setup lang="ts">
import { computed, ref } from 'vue';

// Types
interface Order {
  type: 'limit' | 'market';
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  percentage: number;
}

// State
const orderSide = ref<'buy' | 'sell'>('buy');
const orderType = ref<'limit' | 'market'>('limit');
const price = ref(2500.0);
const amount = ref(0.0);
const slippage = ref(0.5);

const buyOrders = ref([
  { price: 2502.0, amount: 2.5, total: 6255.0 },
  { price: 2501.5, amount: 1.8, total: 4502.7 },
  { price: 2501.0, amount: 3.2, total: 8003.2 },
  { price: 2500.5, amount: 1.5, total: 3750.75 },
  { price: 2500.0, amount: 2.0, total: 5000.0 }
]);

const sellOrders = ref([
  { price: 2500.0, amount: 1.5, total: 3750.0 },
  { price: 2499.5, amount: 2.0, total: 4999.0 },
  { price: 2499.0, amount: 1.8, total: 4498.2 },
  { price: 2498.5, amount: 3.0, total: 7495.5 },
  { price: 2498.0, amount: 2.2, total: 5495.6 }
]);

const isSubmitting = ref(false);
const showConfirm = ref(false);

// Computed
const total = computed(() => {
  return price.value * amount.value;
});

const totalWithSlippage = computed(() => {
  return total.value * (1 + slippage.value / 100);
});

const maxAmount = computed(() => {
  // Mock: max available to trade
  return 10.0;
});

const orderPercentage = (percent: number) => {
  amount.value = maxAmount.value * (percent / 100);
};

// Methods
const setOrderSide = (side: 'buy' | 'sell') => {
  orderSide.value = side;
};

const placeOrder = async () => {
  isSubmitting.value = true;

  // Simulate transaction
  await new Promise(r => setTimeout(r, 1500));

  isSubmitting.value = false;
  showConfirm.value = false;
  amount.value = 0;

  // Show success (in real app, would show notification)
  alert('Order placed successfully!');
};

const formatNumber = (num: number, decimals = 2) => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <h2 class="mb-4 text-xl font-semibold">Trade</h2>

    <!-- Order Type Tabs -->
    <div class="mb-4 flex gap-2">
      <button
        class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
        :class="[orderType === 'limit' ? 'bg-slate-700 text-white' : 'bg-slate-900/50 text-slate-400 hover:text-white']"
        @click="orderType = 'limit'"
      >
        Limit
      </button>
      <button
        class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
        :class="[
          orderType === 'market' ? 'bg-slate-700 text-white' : 'bg-slate-900/50 text-slate-400 hover:text-white'
        ]"
        @click="orderType = 'market'"
      >
        Market
      </button>
    </div>

    <!-- Buy/Sell Tabs -->
    <div class="mb-4 flex gap-2">
      <button
        class="flex-1 rounded-lg py-3 font-semibold transition-colors"
        :class="[
          orderSide === 'buy'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        ]"
        @click="setOrderSide('buy')"
      >
        Buy
      </button>
      <button
        class="flex-1 rounded-lg py-3 font-semibold transition-colors"
        :class="[
          orderSide === 'sell'
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        ]"
        @click="setOrderSide('sell')"
      >
        Sell
      </button>
    </div>

    <!-- Price Input (Limit only) -->
    <div v-if="orderType === 'limit'" class="mb-4">
      <label class="mb-1 block text-sm text-slate-400">Price (USDC)</label>
      <div class="relative">
        <input
          v-model.number="price"
          type="number"
          step="0.01"
          class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <span class="absolute right-4 top-1/2 text-slate-400 -translate-y-1/2">USDC</span>
      </div>
    </div>

    <!-- Amount Input -->
    <div class="mb-4">
      <label class="mb-1 block text-sm text-slate-400">Amount (ETH)</label>
      <div class="relative">
        <input
          v-model.number="amount"
          type="number"
          step="0.001"
          min="0"
          class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          class="absolute right-2 top-1/2 rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 -translate-y-1/2 hover:bg-slate-600"
          @click="amount = maxAmount"
        >
          MAX
        </button>
      </div>
    </div>

    <!-- Quick Percentages -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="pct in [25, 50, 75, 100]"
        :key="pct"
        class="flex-1 rounded bg-slate-700/50 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
        @click="orderPercentage(pct)"
      >
        {{ pct }}%
      </button>
    </div>

    <!-- Slippage (Sell only) -->
    <div v-if="orderSide === 'sell'" class="mb-4">
      <label class="mb-1 block text-sm text-slate-400">Slippage: {{ slippage }}%</label>
      <input v-model.number="slippage" type="range" min="0.1" max="5" step="0.1" class="w-full" />
    </div>

    <!-- Total -->
    <div class="mb-4 rounded-xl bg-slate-900/50 p-3">
      <div class="flex justify-between text-sm">
        <span class="text-slate-400">Total</span>
        <span class="font-semibold">{{ formatNumber(total) }} USDC</span>
      </div>
      <div v-if="slippage" class="mt-1 flex justify-between text-sm">
        <span class="text-slate-400">Max {{ orderSide === 'buy' ? 'Cost' : 'Receive' }}</span>
        <span class="text-slate-300">{{ formatNumber(totalWithSlippage) }} USDC</span>
      </div>
    </div>

    <!-- Submit Button -->
    <button
      :disabled="!amount || isSubmitting"
      class="w-full rounded-xl py-3 font-semibold transition-all disabled:cursor-not-allowed"
      :class="[
        orderSide === 'buy'
          ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-500/50'
          : 'bg-red-500 hover:bg-red-600 disabled:bg-red-500/50'
      ]"
      @click="showConfirm = true"
    >
      {{ isSubmitting ? 'Processing...' : `${orderSide === 'buy' ? 'Buy' : 'Sell'} ETH` }}
    </button>

    <!-- Order Book Preview -->
    <div class="mt-4 border-t border-slate-700 pt-4">
      <h3 class="mb-2 text-sm text-slate-400 font-medium">Order Book</h3>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <!-- Sell Orders -->
        <div class="space-y-1">
          <div class="flex justify-between text-slate-500">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div v-for="(order, i) in sellOrders.slice(0, 3)" :key="i" class="flex justify-between text-red-400">
            <span>{{ order.price.toFixed(1) }}</span>
            <span>{{ order.amount.toFixed(3) }}</span>
          </div>
        </div>
        <!-- Buy Orders -->
        <div class="space-y-1">
          <div class="flex justify-between text-slate-500">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div v-for="(order, i) in buyOrders.slice(0, 3)" :key="i" class="flex justify-between text-green-400">
            <span>{{ order.price.toFixed(1) }}</span>
            <span>{{ order.amount.toFixed(3) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="mx-4 max-w-sm w-full border border-slate-700 rounded-2xl bg-slate-800 p-6">
        <h3 class="mb-4 text-lg font-semibold">Confirm {{ orderSide === 'buy' ? 'Buy' : 'Sell' }}</h3>
        <div class="mb-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-400">Type</span>
            <span>{{ orderType === 'market' ? 'Market' : 'Limit' }} {{ orderSide.toUpperCase() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Price</span>
            <span>${{ formatNumber(price) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Amount</span>
            <span>{{ formatNumber(amount, 4) }} ETH</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Total</span>
            <span>${{ formatNumber(totalWithSlippage) }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 rounded-xl bg-slate-700 py-2 hover:bg-slate-600" @click="showConfirm = false">
            Cancel
          </button>
          <button
            class="flex-1 rounded-xl py-2 font-semibold"
            :class="[orderSide === 'buy' ? 'bg-green-500' : 'bg-red-500']"
            @click="placeOrder"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
