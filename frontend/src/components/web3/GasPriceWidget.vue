<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';

interface GasData {
  slow: string;
  normal: string;
  fast: string;
  unit: string;
  lastUpdate: string;
}

const gasData = ref<GasData>({
  slow: '12',
  normal: '15',
  fast: '18',
  unit: 'Gwei',
  lastUpdate: ''
});

const isLoading = ref(true);
const selectedChain = ref('ethereum');
const error = ref('');

const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟐' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '◆' },
  { id: 'optimism', name: 'Optimism', icon: '▲' },
  { id: 'polygon', name: 'Polygon', icon: '⬡' },
  { id: 'bsc', name: 'BSC', icon: '⬡' }
];

// Mock real-time gas data (in production, fetch from API)
const fetchGasData = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate realistic-looking gas prices based on chain
    const basePrices: Record<string, { slow: number; normal: number; fast: number }> = {
      ethereum: { slow: 12 + Math.floor(Math.random() * 5), normal: 15 + Math.floor(Math.random() * 8), fast: 25 + Math.floor(Math.random() * 15) },
      arbitrum: { slow: 0.1 + Math.random() * 0.05, normal: 0.15 + Math.random() * 0.08, fast: 0.3 + Math.random() * 0.15 },
      optimism: { slow: 0.001 + Math.random() * 0.001, normal: 0.002 + Math.random() * 0.002, fast: 0.005 + Math.random() * 0.003 },
      polygon: { slow: 35 + Math.floor(Math.random() * 15), normal: 45 + Math.floor(Math.random() * 20), fast: 80 + Math.floor(Math.random() * 30) },
      bsc: { slow: 3 + Math.floor(Math.random() * 2), normal: 4 + Math.floor(Math.random() * 3), fast: 6 + Math.floor(Math.random() * 4) }
    };

    const prices = basePrices[selectedChain.value];
    const unit = ['arbitrum', 'optimism'].includes(selectedChain.value) ? 'ETH' : 'Gwei';

    gasData.value = {
      slow: prices.slow.toFixed(unit === 'ETH' ? 4 : 0),
      normal: prices.normal.toFixed(unit === 'ETH' ? 4 : 0),
      fast: prices.fast.toFixed(unit === 'ETH' ? 4 : 0),
      unit,
      lastUpdate: new Date().toLocaleTimeString()
    };
  } catch (e: any) {
    error.value = 'Failed to fetch gas data';
  } finally {
    isLoading.value = false;
  }
};

const getSpeedColor = (speed: string) => {
  const value = parseFloat(speed);
  const baseNormal = parseFloat(gasData.value.normal);

  if (speed === 'slow') return 'text-yellow-400';
  if (speed === 'normal') return 'text-green-400';
  return 'text-orange-400';
};

const getAdvice = () => {
  const normal = parseFloat(gasData.value.normal);
  const fast = parseFloat(gasData.value.fast);

  if (normal < 20) return { text: 'Low gas - Good time to transact!', color: 'text-green-400' };
  if (normal < 50) return { text: 'Normal gas prices', color: 'text-blue-400' };
  return { text: 'High gas - Consider waiting', color: 'text-red-400' };
};

let interval: number;
onMounted(() => {
  fetchGasData();
  interval = window.setInterval(fetchGasData, 30000); // Update every 30 seconds
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const advice = computed(() => getAdvice());
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-4 backdrop-blur-xl">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <span class="text-xl">⛽</span>
        Gas Tracker
      </h3>
      <span v-if="gasData.lastUpdate" class="text-xs text-slate-500">
        Updated: {{ gasData.lastUpdate }}
      </span>
    </div>

    <!-- Chain Selector -->
    <div class="mb-4">
      <select
        v-model="selectedChain"
        class="w-full border border-slate-700 rounded-xl bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        @change="fetchGasData"
      >
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.icon }} {{ chain.name }}
        </option>
      </select>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300"
    >
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Gas Prices -->
    <div v-else class="space-y-3">
      <!-- Slow -->
      <div class="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-yellow-400"></span>
          <span class="text-sm text-slate-400">Slow</span>
        </div>
        <span class="font-mono font-semibold text-yellow-400">
          {{ gasData.slow }} {{ gasData.unit }}
        </span>
      </div>

      <!-- Normal (Recommended) -->
      <div class="flex items-center justify-between rounded-xl bg-slate-900/50 p-3 ring-1 ring-green-500/30">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          <span class="text-sm text-slate-400">Normal</span>
          <span class="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-400">Recommended</span>
        </div>
        <span class="font-mono font-semibold text-green-400">
          {{ gasData.normal }} {{ gasData.unit }}
        </span>
      </div>

      <!-- Fast -->
      <div class="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-orange-400"></span>
          <span class="text-sm text-slate-400">Fast</span>
        </div>
        <span class="font-mono font-semibold text-orange-400">
          {{ gasData.fast }} {{ gasData.unit }}
        </span>
      </div>

      <!-- Advice -->
      <div class="mt-4 rounded-xl bg-slate-900/50 p-3">
        <div class="flex items-center gap-2">
          <span class="text-sm">💡</span>
          <span :class="advice.color" class="text-sm font-medium">
            {{ advice.text }}
          </span>
        </div>
      </div>

      <!-- Gas History Chart (Mini) -->
      <div class="mt-4">
        <h4 class="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          24h Gas Trend
        </h4>
        <div class="flex h-16 items-end justify-between gap-1">
          <div
            v-for="i in 12"
            :key="i"
            class="flex-1 rounded-t"
            :class="[
              i <= 4 ? 'bg-green-500/30' : i <= 8 ? 'bg-yellow-500/30' : 'bg-red-500/30'
            ]"
            :style="{ height: `${30 + Math.random() * 70}%` }"
          ></div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-slate-500">
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </div>
    </div>

    <!-- Refresh Button -->
    <button
      class="mt-4 w-full rounded-xl bg-slate-700/50 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
      @click="fetchGasData"
    >
      🔄 Refresh
    </button>
  </div>
</template>
