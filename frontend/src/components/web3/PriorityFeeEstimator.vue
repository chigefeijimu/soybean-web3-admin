<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

interface PriorityFeeData {
  chain: string;
  baseFee: number;
  priorityFee: {
    slow: number;
    normal: number;
    fast: number;
    instant: number;
  };
  totalFee: {
    slow: number;
    normal: number;
    fast: number;
    instant: number;
  };
  estimatedConfirmationTime: {
    slow: string;
    normal: string;
    fast: string;
    instant: string;
  };
  lastUpdated: string;
}

const priorityFeeData = ref<PriorityFeeData | null>(null);
const historyData = ref<any[]>([]);
const isLoading = ref(true);
const selectedChain = ref('ethereum');
const selectedSpeed = ref('normal');
const error = ref('');

const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟐' },
  { id: 'polygon', name: 'Polygon', icon: '⬡' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '◆' },
  { id: 'optimism', name: 'Optimism', icon: '▲' },
  { id: 'bsc', name: 'BSC', icon: '⬡' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'avalanche', name: 'Avalanche', icon: '🔺' }
];

const speedOptions = [
  { id: 'slow', name: 'Slow', color: 'text-yellow-400', desc: 'Cheapest, longer wait' },
  { id: 'normal', name: 'Normal', color: 'text-green-400', desc: 'Balanced' },
  { id: 'fast', name: 'Fast', color: 'text-orange-400', desc: 'Quick confirmation' },
  { id: 'instant', name: 'Instant', color: 'text-red-400', desc: 'Highest priority' }
];

const fetchPriorityFee = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/web3/priority-fee/estimate?chain=${selectedChain.value}`);
    if (!response.ok) throw new Error('Failed to fetch priority fee');
    priorityFeeData.value = await response.json();
  } catch (e: any) {
    // Fallback to mock data for demo
    const mockData: PriorityFeeData = {
      chain: selectedChain.value,
      baseFee: 0.05,
      priorityFee: { slow: 0.01, normal: 0.05, fast: 0.15, instant: 0.5 },
      totalFee: { slow: 0.06, normal: 0.1, fast: 0.2, instant: 0.55 },
      estimatedConfirmationTime: { 
        slow: '5-15 minutes', 
        normal: '1-3 minutes', 
        fast: '15-60 seconds', 
        instant: 'within 15 seconds' 
      },
      lastUpdated: new Date().toISOString()
    };
    priorityFeeData.value = mockData;
  } finally {
    isLoading.value = false;
  }
};

const fetchHistory = async () => {
  try {
    const response = await fetch(`/api/web3/priority-fee/history?chain=${selectedChain.value}&days=1`);
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    historyData.value = data.data?.slice(-24) || [];
  } catch (e: any) {
    // Generate mock history
    historyData.value = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      slow: 0.01 + Math.random() * 0.02,
      normal: 0.05 + Math.random() * 0.05,
      fast: 0.15 + Math.random() * 0.1,
      instant: 0.5 + Math.random() * 0.3
    }));
  }
};

const selectedFee = computed(() => {
  if (!priorityFeeData.value) return null;
  return {
    priorityFee: priorityFeeData.value.priorityFee[selectedSpeed.value as keyof typeof priorityFeeData.value.priorityFee],
    totalFee: priorityFeeData.value.totalFee[selectedSpeed.value as keyof typeof priorityFeeData.value.totalFee],
    confirmationTime: priorityFeeData.value.estimatedConfirmationTime[selectedSpeed.value as keyof typeof priorityFeeData.value.estimatedConfirmationTime]
  };
});

const formatGwei = (value: number) => {
  return value.toFixed(value < 0.01 ? 6 : 4);
};

let interval: number;
onMounted(() => {
  fetchPriorityFee();
  fetchHistory();
  interval = window.setInterval(() => {
    fetchPriorityFee();
  }, 60000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const chainIcon = computed(() => {
  const chain = chains.find(c => c.id === selectedChain.value);
  return chain?.icon || '⟐';
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <span class="text-2xl">⚡</span>
          Transaction Priority Fee Estimator
        </h3>
        <p class="text-sm text-slate-400 mt-1">Estimate priority fees for different transaction speeds</p>
      </div>
      <div class="flex items-center gap-2">
        <select 
          v-model="selectedChain" 
          @change="fetchPriorityFee(); fetchHistory()"
          class="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.icon }} {{ chain.name }}
          </option>
        </select>
        <button 
          @click="fetchPriorityFee(); fetchHistory()"
          class="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
          title="Refresh"
        >
          🔄
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin text-4xl">⏳</div>
    </div>

    <!-- Main Content -->
    <div v-else-if="priorityFeeData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Speed Selection -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-slate-300">Select Transaction Speed</h4>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="speed in speedOptions"
            :key="speed.id"
            @click="selectedSpeed = speed.id"
            :class="[
              'p-4 rounded-xl border transition-all text-left',
              selectedSpeed === speed.id 
                ? 'bg-blue-500/20 border-blue-500' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
            ]"
          >
            <div :class="['text-lg font-semibold', speed.color]">{{ speed.name }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ speed.desc }}</div>
          </button>
        </div>

        <!-- Selected Fee Details -->
        <div v-if="selectedFee" class="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div class="text-sm text-slate-400 mb-2">Estimated {{ selectedSpeed }} Priority Fee</div>
          <div class="text-3xl font-bold text-white">
            {{ formatGwei(selectedFee.priorityFee) }} <span class="text-lg text-slate-400">Gwei</span>
          </div>
          <div class="mt-2 text-sm text-slate-400">
            Total (Base + Priority): <span class="text-white font-semibold">{{ formatGwei(selectedFee.totalFee) }} Gwei</span>
          </div>
          <div class="mt-2 text-sm text-green-400">
            ⏱️ {{ selectedFee.confirmationTime }}
          </div>
        </div>
      </div>

      <!-- Current Network Status -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-slate-300">Network Status</h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span class="text-slate-400">Chain</span>
            <span class="text-white font-medium">{{ chainIcon }} {{ priorityFeeData.chain }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span class="text-slate-400">Base Fee</span>
            <span class="text-white font-medium">{{ formatGwei(priorityFeeData.baseFee) }} Gwei</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span class="text-slate-400">Last Updated</span>
            <span class="text-white font-medium">{{ new Date(priorityFeeData.lastUpdated).toLocaleTimeString() }}</span>
          </div>
        </div>

        <!-- Tips -->
        <div class="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
          <h5 class="text-sm font-medium text-blue-400 mb-2">💡 Tips</h5>
          <ul class="text-xs text-slate-300 space-y-1">
            <li>• Use <span class="text-yellow-400">Slow</span> for non-urgent transactions (NFT mints,DeFi)</li>
            <li>• Use <span class="text-green-400">Normal</span> for regular transactions</li>
            <li>• Use <span class="text-orange-400">Fast</span> for time-sensitive operations</li>
            <li>• Use <span class="text-red-400">Instant</span> for critical transactions (liquidations, frontrunning)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
      {{ error }}
    </div>
  </div>
</template>
