<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// State
const selectedChain = ref('ethereum');
const timeRange = ref('24h');
const loading = ref(false);
const error = ref('');

// Gas data
const gasData = ref<any>(null);
const hourlyGas = ref<any[]>([]);
const weeklyGas = ref<any[]>([]);
const monthlyGas = ref<any[]>([]);

// Chain options
const chains = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '🔷', color: '#627EEA' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', icon: '🔵', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', icon: '🟠', color: '#FF0420' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: '🟣', color: '#8247E5' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', icon: '🟡', color: '#F3BA2F' },
  { id: 'base', name: 'Base', symbol: 'ETH', icon: '⚫', color: '#0052FF' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', icon: '🔺', color: '#E84142' },
  { id: 'zksync', name: 'zkSync', symbol: 'ETH', icon: '⚡', color: '#8B8BF6' },
];

// Time ranges
const timeRanges = [
  { id: '1h', label: '1H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
];

// Simulated historical data
const generateHistoricalData = (hours: number) => {
  const data = [];
  const now = Date.now();
  const basePrice = selectedChain.value === 'ethereum' ? 20 : 
                   selectedChain.value === 'polygon' ? 0.01 :
                   selectedChain.value === 'bsc' ? 3 : 5;
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = now - i * 3600 * 1000;
    const hour = new Date(timestamp).getHours();
    
    // Simulate time-of-day patterns (lower in early morning, higher during peak)
    let multiplier = 1;
    if (hour >= 9 && hour <= 18) multiplier = 1.5; // Peak hours
    else if (hour >= 0 && hour <= 6) multiplier = 0.6; // Off-peak
    else multiplier = 1.2;
    
    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    const slow = basePrice * multiplier * randomFactor * 0.7;
    const normal = basePrice * multiplier * randomFactor;
    const fast = basePrice * multiplier * randomFactor * 1.4;
    
    data.push({
      timestamp,
      slow: Math.round(slow * 100) / 100,
      normal: Math.round(normal * 100) / 100,
      fast: Math.round(fast * 100) / 100,
      avg: Math.round((slow + normal + fast) / 3 * 100) / 100,
    });
  }
  return data;
};

// Stats
const stats = computed(() => {
  if (!hourlyGas.value.length) return null;
  
  const last24h = hourlyGas.value.slice(-24);
  const last7d = hourlyGas.value.slice(-168) || last24h;
  
  const avg24h = last24h.reduce((a, b) => a + b.avg, 0) / last24h.length;
  const avg7d = last7d.reduce((a, b) => a + b.avg, 0) / last7d.length;
  
  const min24h = Math.min(...last24h.map((g: any) => g.slow));
  const max24h = Math.max(...last24h.map((g: any) => g.fast));
  
  const currentGas = hourlyGas.value[hourlyGas.value.length - 1];
  
  return {
    current: currentGas?.avg || 0,
    avg24h: Math.round(avg24h * 100) / 100,
    avg7d: Math.round(avg7d * 100) / 100,
    min24h: Math.round(min24h * 100) / 100,
    max24h: Math.round(max24h * 100) / 100,
    change24h: avg24h > 0 ? ((avg24h - avg7d) / avg7d * 100).toFixed(1) : 0,
  };
});

// Best times to transact
const bestTimes = computed(() => {
  if (!hourlyGas.value.length) return [];
  
  const last24h = hourlyGas.value.slice(-24);
  const sorted = [...last24h].sort((a, b) => a.avg - b.avg);
  
  return sorted.slice(0, 3).map(g => ({
    hour: new Date(g.timestamp).getHours(),
    gas: g.avg,
    label: formatHour(new Date(g.timestamp).getHours()),
  }));
});

// Worst times
const worstTimes = computed(() => {
  if (!hourlyGas.value.length) return [];
  
  const last24h = hourlyGas.value.slice(-24);
  const sorted = [...last24h].sort((a, b) => b.avg - a.avg);
  
  return sorted.slice(0, 3).map(g => ({
    hour: new Date(g.timestamp).getHours(),
    gas: g.avg,
    label: formatHour(new Date(g.timestamp).getHours()),
  }));
});

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

// Gas price categories
const gasCategories = computed(() => {
  if (!hourlyGas.value.length) return { slow: 0, normal: 0, fast: 0 };
  
  const current = hourlyGas.value[hourlyGas.value.length - 1];
  return {
    slow: current?.slow || 0,
    normal: current?.normal || 0,
    fast: current?.fast || 0,
  };
});

// Chart data for visualization
const chartData = computed(() => {
  if (!hourlyGas.value.length) return [];
  
  const displayData = timeRange.value === '1h' ? hourlyGas.value.slice(-1) :
                      timeRange.value === '24h' ? hourlyGas.value.slice(-24) :
                      timeRange.value === '7d' ? hourlyGas.value.slice(-168) :
                      hourlyGas.value.slice(-720);
  
  return displayData.map(g => ({
    time: new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    slow: g.slow,
    normal: g.normal,
    fast: g.fast,
  }));
});

// Savings calculator
const savingsAmount = ref(1);
const savingsPercent = computed(() => {
  if (!stats.value) return 0;
  const current = gasCategories.value.normal;
  const optimal = bestTimes.value[0]?.gas || current;
  return ((current - optimal) / current * 100).toFixed(1);
});

// Estimated savings
const estimatedSavings = computed(() => {
  if (!stats.value || !savingsAmount.value) return '0';
  const current = gasCategories.value.normal;
  const optimal = bestTimes.value[0]?.gas || current;
  const saved = (current - optimal) * savingsAmount.value;
  return saved.toFixed(4);
});

// Load data
const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Generate simulated data
    const hours = timeRange.value === '1h' ? 1 : 
                  timeRange.value === '24h' ? 24 : 
                  timeRange.value === '7d' ? 168 : 720;
    
    hourlyGas.value = generateHistoricalData(hours);
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (e: any) {
    error.value = e.message || 'Failed to load gas data';
  } finally {
    loading.value = false;
  }
};

// Auto-refresh
let refreshInterval: number | null = null;

onMounted(() => {
  loadData();
  refreshInterval = window.setInterval(loadData, 30000); // Refresh every 30s
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch chain/time changes
const handleChainChange = () => {
  loadData();
};

const handleTimeRangeChange = () => {
  loadData();
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">⛽ Gas Fee Analytics</h2>
        <p class="text-sm text-slate-400">Track gas prices & find best transaction times</p>
      </div>
      
      <div class="flex gap-3">
        <!-- Chain Selector -->
        <select
          v-model="selectedChain"
          class="border border-slate-700 rounded-lg bg-slate-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          @change="handleChainChange"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.icon }} {{ chain.name }}
          </option>
        </select>
        
        <!-- Time Range -->
        <div class="flex rounded-lg bg-slate-800 p-1">
          <button
            v-for="range in timeRanges"
            :key="range.id"
            class="rounded-md px-3 py-1 text-sm transition-colors"
            :class="timeRange === range.id ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'"
            @click="timeRange = range.id; handleTimeRangeChange()"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="flex items-center justify-between border border-red-500/50 rounded-lg bg-red-500/20 p-4"
    >
      <span class="text-red-300">{{ error }}</span>
      <button class="text-red-400 hover:text-white" @click="error = ''">✕</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Stats Grid -->
    <div v-else-if="stats" class="grid gap-4 lg:grid-cols-4">
      <!-- Current Gas -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Current Gas</p>
        <p class="text-2xl font-bold text-white">{{ stats.current.toFixed(2) }}</p>
        <p class="text-xs text-slate-500">Gwei</p>
      </div>
      
      <!-- 24h Average -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">24h Average</p>
        <p class="text-2xl font-bold text-white">{{ stats.avg24h.toFixed(2) }}</p>
        <p class="text-xs text-slate-500">Gwei</p>
      </div>
      
      <!-- 24h Range -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">24h Range</p>
        <p class="text-lg font-bold text-white">
          {{ stats.min24h.toFixed(2) }} - {{ stats.max24h.toFixed(2) }}
        </p>
        <p class="text-xs text-slate-500">Gwei</p>
      </div>
      
      <!-- Change -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">24h Change</p>
        <p 
          class="text-2xl font-bold"
          :class="Number(stats.change24h) >= 0 ? 'text-red-400' : 'text-green-400'"
        >
          {{ Number(stats.change24h) >= 0 ? '↑' : '↓' }} {{ Math.abs(Number(stats.change24h)) }}%
        </p>
        <p class="text-xs text-slate-500">vs 7d avg</p>
      </div>
    </div>

    <!-- Gas Price Categories -->
    <div v-if="!loading && gasCategories" class="grid gap-4 lg:grid-cols-3">
      <!-- Slow -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-400">🐢 Slow</p>
            <p class="text-3xl font-bold text-blue-400">{{ gasCategories.slow.toFixed(2) }}</p>
            <p class="text-xs text-slate-500">Gwei</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">~15-30 min</p>
            <p class="text-xs text-green-400">Best for non-urgent</p>
          </div>
        </div>
      </div>
      
      <!-- Normal -->
      <div class="border border-purple-500/30 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl ring-1 ring-purple-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-400">⚡ Normal</p>
            <p class="text-3xl font-bold text-purple-400">{{ gasCategories.normal.toFixed(2) }}</p>
            <p class="text-xs text-slate-500">Gwei</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">~3-10 min</p>
            <p class="text-xs text-purple-400">Recommended</p>
          </div>
        </div>
      </div>
      
      <!-- Fast -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-400">🚀 Fast</p>
            <p class="text-3xl font-bold text-orange-400">{{ gasCategories.fast.toFixed(2) }}</p>
            <p class="text-xs text-slate-500">Gwei</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">~< 3 min</p>
            <p class="text-xs text-orange-400">Urgent only</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Chart -->
      <div class="lg:col-span-2 border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">📊 Gas Price Trend</h3>
        
        <!-- Simple Chart Visualization -->
        <div class="relative h-64">
          <div class="absolute inset-0 flex items-end gap-1">
            <div
              v-for="(point, index) in chartData.slice(-24)"
              :key="index"
              class="flex-1 group relative"
            >
              <!-- Bar -->
              <div
                class="mx-auto w-3 rounded-t transition-all hover:opacity-80"
                :style="{
                  height: `${(point.normal / (stats?.max24h || 1)) * 100}%`,
                  background: `linear-gradient(to top, #8b5cf6, #a78bfa)`
                }"
              ></div>
              
              <!-- Tooltip -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 scale-0 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 z-10">
                <p class="font-semibold">{{ point.time }}</p>
                <p class="text-blue-400">Slow: {{ point.slow.toFixed(2) }}</p>
                <p class="text-purple-400">Normal: {{ point.normal.toFixed(2) }}</p>
                <p class="text-orange-400">Fast: {{ point.fast.toFixed(2) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="mt-4 flex justify-center gap-6">
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-blue-400"></div>
            <span class="text-xs text-slate-400">Slow</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-purple-500"></div>
            <span class="text-xs text-slate-400">Normal</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-orange-400"></div>
            <span class="text-xs text-slate-400">Fast</span>
          </div>
        </div>
      </div>

      <!-- Best Times -->
      <div class="space-y-4">
        <!-- Best Times to Transact -->
        <div class="border border-green-500/30 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span class="text-green-400">✅</span> Best Times
          </h3>
          <div class="space-y-3">
            <div
              v-for="(time, index) in bestTimes"
              :key="index"
              class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
            >
              <span class="font-medium text-green-400">{{ time.label }}</span>
              <span class="text-sm text-slate-400">{{ time.gas.toFixed(2) }} Gwei</span>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-500">Save up to {{ savingsPercent }}% on gas fees</p>
        </div>
        
        <!-- Worst Times -->
        <div class="border border-red-500/30 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span class="text-red-400">⚠️</span> Avoid These Times
          </h3>
          <div class="space-y-3">
            <div
              v-for="(time, index) in worstTimes"
              :key="index"
              class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
            >
              <span class="font-medium text-red-400">{{ time.label }}</span>
              <span class="text-sm text-slate-400">{{ time.gas.toFixed(2) }} Gwei</span>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-500">Gas spikes during peak hours</p>
        </div>
      </div>
    </div>

    <!-- Savings Calculator -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-4 text-lg font-semibold">💰 Gas Fee Savings Calculator</h3>
      <div class="grid gap-6 lg:grid-cols-3">
        <div>
          <label class="mb-2 block text-sm text-slate-400">Number of Transactions</label>
          <input
            v-model.number="savingsAmount"
            type="number"
            min="1"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm text-slate-400">Current Gas (Normal)</label>
          <div class="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white">
            {{ gasCategories.normal.toFixed(2) }} Gwei
          </div>
        </div>
        <div>
          <label class="mb-2 block text-sm text-slate-400">Potential Savings</label>
          <div class="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-green-400">
            ~{{ estimatedSavings }} ETH
            <span class="text-xs">({{ savingsPercent }}%)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-4 text-lg font-semibold">💡 Gas Saving Tips</h3>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="flex gap-3 rounded-lg bg-slate-900/50 p-4">
          <span class="text-2xl">🕐</span>
          <div>
            <p class="font-medium text-white">Transact During Off-Peak Hours</p>
            <p class="text-sm text-slate-400">Best times are typically 12 AM - 6 AM UTC</p>
          </div>
        </div>
        <div class="flex gap-3 rounded-lg bg-slate-900/50 p-4">
          <span class="text-2xl">🎯</span>
          <div>
            <p class="font-medium text-white">Use Appropriate Speed</p>
            <p class="text-sm text-slate-400">Slow is fine for non-urgent transactions</p>
          </div>
        </div>
        <div class="flex gap-3 rounded-lg bg-slate-900/50 p-4">
          <span class="text-2xl">📅</span>
          <div>
            <p class="font-medium text-white">Batch Transactions</p>
            <p class="text-sm text-slate-400">Combine multiple operations in one transaction</p>
          </div>
        </div>
        <div class="flex gap-3 rounded-lg bg-slate-900/50 p-4">
          <span class="text-2xl">🔄</span>
          <div>
            <p class="font-medium text-white">Consider Layer 2</p>
            <p class="text-sm text-slate-400">Arbitrum/Optimism have much lower fees</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
