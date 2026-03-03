<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { request } from '@/service/request';

const BASE_URL = import.meta.env.VITE_BASE_URL || '';

// State
const address = ref('');
const selectedChains = ref('1,137,42161');
const timeframe = ref('30d');
const loading = ref(false);
const activeTab = ref('overview');

// Data
const netWorth = ref<any>(null);
const history = ref<any>(null);
const roi = ref<any>(null);
const breakdown = ref<any>(null);
const trends = ref<any>(null);
const alerts = ref<any>(null);
const diversification = ref<any>(null);

// Computed
const chainOptions = [
  { value: '1', label: 'Ethereum', icon: '🔷' },
  { value: '137', label: 'Polygon', icon: '🟣' },
  { value: '42161', label: 'Arbitrum', icon: '🔵' },
  { value: '10', label: 'Optimism', icon: '🟠' },
  { value: '56', label: 'BSC', icon: '🟡' },
  { value: '8453', label: 'Base', icon: '⚫' },
  { value: '43114', label: 'Avalanche', icon: '🔺' },
];

const timeframeOptions = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

// Methods
const fetchData = async () => {
  if (!address.value) return;
  
  loading.value = true;
  try {
    const chains = selectedChains.value;
    
    // Fetch all data in parallel
    const [nw, hist, roiData, bd, tr, div] = await Promise.all([
      request({ url: `/api/net-worth/current?address=${address.value}&chains=${chains}`, method: 'get' }),
      request({ url: `/api/net-worth/history?address=${address.value}&chains=${chains}&days=${parseInt(timeframe.value)}`, method: 'get' }),
      request({ url: `/api/net-worth/roi?address=${address.value}&chains=${chains}&timeframe=${timeframe.value}`, method: 'get' }),
      request({ url: `/api/net-worth/breakdown?address=${address.value}&chains=${chains}`, method: 'get' }),
      request({ url: `/api/net-worth/trends?address=${address.value}&chains=${chains}`, method: 'get' }),
      request({ url: `/api/net-worth/diversification?address=${address.value}&chains=${chains}`, method: 'get' }),
    ]);
    
    netWorth.value = nw?.data || nw;
    history.value = hist?.data || hist;
    roi.value = roiData?.data || roiData;
    breakdown.value = bd?.data || bd;
    trends.value = tr?.data || tr;
    diversification.value = div?.data || div;
  } catch (error) {
    console.error('Failed to fetch net worth data:', error);
  } finally {
    loading.value = false;
  }
};

const createSnapshot = async () => {
  if (!address.value) return;
  
  try {
    await request({ 
      url: `/api/net-worth/snapshot`, 
      method: 'post',
      data: {
        address: address.value,
        chains: selectedChains.value.split(',').map(Number),
      }
    });
    alert('Snapshot created successfully!');
  } catch (error) {
    console.error('Failed to create snapshot:', error);
  }
};

const fetchAlerts = async () => {
  if (!address.value) return;
  
  try {
    const res = await request({ url: `/api/net-worth/alerts?address=${address.value}`, method: 'get' });
    alerts.value = res?.data || res;
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
  }
};

const createAlert = async (direction: 'above' | 'below') => {
  if (!address.value || !netWorth.value) return;
  
  const threshold = direction === 'above' 
    ? netWorth.value.totalValue * 1.1 
    : netWorth.value.totalValue * 0.9;
  
  try {
    await request({ 
      url: `/api/net-worth/alerts`, 
      method: 'post',
      data: {
        address: address.value,
        threshold: Math.round(threshold),
        direction,
      }
    });
    alert(`Alert set: Notify when ${direction} $${threshold.toFixed(2)}`);
    fetchAlerts();
  } catch (error) {
    console.error('Failed to create alert:', error);
  }
};

const exportData = async (format: 'csv' | 'json') => {
  if (!address.value) return;
  
  try {
    const res = await request({ url: `/api/net-worth/export?address=${address.value}&format=${format}&days=${parseInt(timeframe.value)}`, method: 'get' });
    
    // Download file
    const data = res?.data?.data || res?.data || res;
    const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `networth_${address.value.slice(0, 8)}_${timeframe.value}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getTrendColor = (value: number) => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
};

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    'A': 'text-green-400',
    'B': 'text-blue-400',
    'C': 'text-yellow-400',
    'D': 'text-orange-400',
    'F': 'text-red-400',
  };
  return colors[grade] || 'text-slate-400';
};

// Sample addresses for demo
const sampleAddresses = [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
  '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D53', // Justin Sun
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // BEYO
];
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">💰 Net Worth Tracker</h2>
        <p class="text-slate-400">Track your wallet value over time</p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
      <div class="flex flex-col gap-4 lg:flex-row">
        <div class="flex-1">
          <label class="mb-2 block text-sm text-slate-400">Wallet Address</label>
          <input
            v-model="address"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div class="w-full lg:w-48">
          <label class="mb-2 block text-sm text-slate-400">Chains</label>
          <select
            v-model="selectedChains"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="1">Ethereum</option>
            <option value="1,137">ETH + Polygon</option>
            <option value="1,137,42161">ETH + Polygon + Arbitrum</option>
            <option value="1,137,42161,10,56">Multi-chain (All)</option>
          </select>
        </div>
        <div class="w-full lg:w-32">
          <label class="mb-2 block text-sm text-slate-400">Timeframe</label>
          <select
            v-model="timeframe"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          >
            <option v-for="opt in timeframeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            :disabled="loading || !address"
            class="rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            @click="fetchData"
          >
            {{ loading ? 'Loading...' : 'Analyze' }}
          </button>
        </div>
      </div>

      <!-- Sample Addresses -->
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="text-sm text-slate-500">Try:</span>
        <button
          v-for="addr in sampleAddresses"
          :key="addr"
          class="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
          @click="address = addr; fetchData()"
        >
          {{ addr.slice(0, 6) }}...{{ addr.slice(-4) }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Results -->
    <div v-else-if="netWorth" class="space-y-6">
      <!-- Main Stats -->
      <div class="grid gap-4 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Total Net Worth</p>
          <p class="mt-2 text-3xl font-bold text-white">{{ formatCurrency(netWorth.totalValue) }}</p>
          <p class="mt-1 text-sm text-slate-500">across {{ netWorth.chains.length }} chains</p>
        </div>
        
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">ROI ({{ timeframe }})</p>
          <p v-if="roi" class="mt-2 text-3xl font-bold" :class="getTrendColor(roi.roiPercent)">
            {{ formatPercent(roi.roiPercent) }}
          </p>
          <p v-else class="mt-2 text-3xl font-bold text-slate-500">--</p>
        </div>
        
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Trend</p>
          <p v-if="trends" class="mt-2 text-3xl font-bold" :class="getTrendColor(trends.trend === 'bullish' ? 5 : -5)">
            {{ trends.trend === 'bullish' ? '📈' : trends.trend === 'bearish' ? '📉' : '➡️' }}
            {{ trends.trend.charAt(0).toUpperCase() + trends.trend.slice(1) }}
          </p>
          <p v-else class="mt-2 text-3xl font-bold text-slate-500">--</p>
        </div>
        
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p class="text-sm text-slate-400">Diversification</p>
          <p v-if="diversification" class="mt-2 text-3xl font-bold" :class="getGradeColor(diversification.grade)">
            {{ diversification.grade }}
          </p>
          <p v-else class="mt-2 text-3xl font-bold text-slate-500">--</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 overflow-x-auto border-b border-slate-700 pb-2">
        <button
          v-for="tab in ['overview', 'history', 'breakdown', 'trends', 'alerts']"
          :key="tab"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="activeTab === tab ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <!-- Overview Tab -->
        <div v-show="activeTab === 'overview'" class="space-y-6">
          <div>
            <h3 class="mb-4 text-lg font-semibold text-white">Chain Distribution</h3>
            <div class="space-y-3">
              <div v-for="chain in netWorth.chains" :key="chain.chainId" class="flex items-center gap-4">
                <div class="w-32 text-slate-400">{{ chain.chainName }}</div>
                <div class="flex-1">
                  <div class="h-3 overflow-hidden rounded-full bg-slate-700">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      :style="{ width: `${chain.percentage}%` }"
                    ></div>
                  </div>
                </div>
                <div class="w-24 text-right">
                  <span class="text-white">{{ formatCurrency(chain.value) }}</span>
                  <span class="ml-2 text-slate-500">({{ chain.percentage.toFixed(1) }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap gap-3 pt-4">
            <button
              class="rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/30"
              @click="createSnapshot"
            >
              📸 Create Snapshot
            </button>
            <button
              class="rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30"
              @click="createAlert('above')"
            >
              🔔 Alert Above
            </button>
            <button
              class="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30"
              @click="createAlert('below')"
            >
              🔔 Alert Below
            </button>
            <button
              class="rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-400 hover:bg-slate-700"
              @click="exportData('csv')"
            >
              📥 Export CSV
            </button>
            <button
              class="rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-slate-400 hover:bg-slate-700"
              @click="exportData('json')"
            >
              📥 Export JSON
            </button>
          </div>
        </div>

        <!-- History Tab -->
        <div v-show="activeTab === 'history'" class="space-y-6">
          <div v-if="history">
            <h3 class="mb-4 text-lg font-semibold text-white">Net Worth History</h3>
            
            <!-- Stats -->
            <div class="mb-6 grid gap-4 lg:grid-cols-4">
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-xs text-slate-500">Start Value</p>
                <p class="text-lg font-semibold text-white">{{ formatCurrency(history.statistics.startValue) }}</p>
              </div>
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-xs text-slate-500">End Value</p>
                <p class="text-lg font-semibold text-white">{{ formatCurrency(history.statistics.endValue) }}</p>
              </div>
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-xs text-slate-500">High</p>
                <p class="text-lg font-semibold text-green-400">{{ formatCurrency(history.statistics.highValue) }}</p>
              </div>
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-xs text-slate-500">Low</p>
                <p class="text-lg font-semibold text-red-400">{{ formatCurrency(history.statistics.lowValue) }}</p>
              </div>
            </div>

            <!-- Chart Placeholder -->
            <div class="h-64 rounded-lg bg-slate-900/50 p-4">
              <div class="flex h-full items-end justify-between gap-2">
                <div
                  v-for="(point, i) in history.history.filter((_, idx) => idx % Math.ceil(history.history.length / 20) === 0)"
                  :key="i"
                  class="flex-1 rounded-t bg-gradient-to-t from-purple-500 to-blue-500 opacity-80 hover:opacity-100"
                  :style="{ height: `${(point.value / history.statistics.highValue) * 100}%` }"
                  :title="`${point.date}: ${formatCurrency(point.value)}`"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Breakdown Tab -->
        <div v-show="activeTab === 'breakdown'" class="space-y-6">
          <div v-if="breakdown">
            <h3 class="mb-4 text-lg font-semibold text-white">Asset Breakdown</h3>
            
            <!-- By Category -->
            <div class="mb-6">
              <h4 class="mb-3 text-sm font-medium text-slate-400">By Category</h4>
              <div class="grid gap-3 lg:grid-cols-3">
                <div v-for="cat in breakdown.byCategory" :key="cat.category" class="rounded-lg bg-slate-900/50 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">{{ cat.category }}</span>
                    <span class="text-white font-semibold">{{ cat.percentage.toFixed(1) }}%</span>
                  </div>
                  <p class="mt-2 text-xl text-white">{{ formatCurrency(cat.value) }}</p>
                  <p class="text-xs text-slate-500">{{ cat.count }} tokens</p>
                </div>
              </div>
            </div>

            <!-- Top Assets -->
            <div>
              <h4 class="mb-3 text-sm font-medium text-slate-400">Top Assets</h4>
              <div class="space-y-2">
                <div
                  v-for="asset in breakdown.topAssets"
                  :key="asset.symbol"
                  class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
                >
                  <div class="flex items-center gap-3">
                    <span class="font-semibold text-white">{{ asset.symbol }}</span>
                    <span class="text-xs text-slate-500">Chain {{ asset.chainId }}</span>
                  </div>
                  <div class="text-right">
                    <p class="text-white">{{ formatCurrency(asset.value) }}</p>
                    <p class="text-xs text-slate-500">{{ asset.percentage.toFixed(1) }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trends Tab -->
        <div v-show="activeTab === 'trends'" class="space-y-6">
          <div v-if="trends">
            <h3 class="mb-4 text-lg font-semibold text-white">Value Trends & Predictions</h3>
            
            <div class="grid gap-4 lg:grid-cols-2">
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-sm text-slate-400">Current Trend</p>
                <p class="mt-2 text-2xl font-bold" :class="trends.trend === 'bullish' ? 'text-green-400' : trends.trend === 'bearish' ? 'text-red-400' : 'text-slate-400'">
                  {{ trends.trend === 'bullish' ? '📈' : trends.trend === 'bearish' ? '📉' : '➡️' }}
                  {{ trends.trend.charAt(0).toUpperCase() + trends.trend.slice(1) }}
                </p>
                <p class="text-xs text-slate-500 mt-1">Strength: {{ trends.trendStrength.toFixed(1) }}%</p>
              </div>
              
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-sm text-slate-400">Momentum</p>
                <p class="mt-2 text-2xl font-bold" :class="trends.momentum.label.includes('buy') ? 'text-green-400' : trends.momentum.label.includes('sell') ? 'text-red-400' : 'text-slate-400'">
                  {{ trends.momentum.label.replace('_', ' ').toUpperCase() }}
                </p>
                <p class="text-xs text-slate-500 mt-1">Score: {{ trends.momentum.score }}</p>
              </div>
            </div>

            <!-- Predictions -->
            <div class="mt-6">
              <h4 class="mb-3 text-sm font-medium text-slate-400">AI Predictions</h4>
              <div class="grid gap-4 lg:grid-cols-2">
                <div class="rounded-lg bg-slate-900/50 p-4">
                  <p class="text-sm text-slate-400">7-Day Prediction</p>
                  <p class="mt-2 text-2xl font-bold text-white">{{ formatCurrency(trends.prediction.next7d) }}</p>
                  <p class="text-xs text-slate-500">Confidence: {{ trends.prediction.confidence.toFixed(0) }}%</p>
                </div>
                <div class="rounded-lg bg-slate-900/50 p-4">
                  <p class="text-sm text-slate-400">30-Day Prediction</p>
                  <p class="mt-2 text-2xl font-bold text-white">{{ formatCurrency(trends.prediction.next30d) }}</p>
                  <p class="text-xs text-slate-500">Confidence: {{ Math.max(0, trends.prediction.confidence - 10).toFixed(0) }}%</p>
                </div>
              </div>
            </div>

            <!-- Support/Resistance -->
            <div class="mt-6 grid gap-4 lg:grid-cols-2">
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-sm text-slate-400">Support Level</p>
                <p class="mt-2 text-xl font-bold text-green-400">{{ formatCurrency(trends.support) }}</p>
              </div>
              <div class="rounded-lg bg-slate-900/50 p-4">
                <p class="text-sm text-slate-400">Resistance Level</p>
                <p class="mt-2 text-xl font-bold text-red-400">{{ formatCurrency(trends.resistance) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div v-show="activeTab === 'alerts'" class="space-y-6">
          <div>
            <h3 class="mb-4 text-lg font-semibold text-white">Value Alerts</h3>
            
            <div v-if="!alerts || alerts.alerts?.length === 0" class="py-8 text-center text-slate-500">
              <p>No alerts set yet.</p>
              <p class="mt-2 text-sm">Use the buttons above to create alerts.</p>
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="alert in alerts.alerts"
                :key="alert.id"
                class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4"
              >
                <div>
                  <p class="text-white">
                    Alert when {{ alert.direction === 'above' ? 'above' : 'below' }}
                  </p>
                  <p class="text-2xl font-bold text-purple-400">{{ formatCurrency(alert.threshold) }}</p>
                </div>
                <div class="text-right">
                  <span
                    class="rounded-full px-3 py-1 text-xs"
                    :class="alert.triggered ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'"
                  >
                    {{ alert.triggered ? 'Triggered' : 'Active' }}
                  </span>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ new Date(alert.createdAt).toLocaleDateString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
      <div class="mb-4 text-6xl">💰</div>
      <p class="text-lg text-slate-400">Enter a wallet address to track net worth</p>
      <p class="mt-2 text-sm text-slate-500">Supports multi-chain aggregation</p>
    </div>
  </div>
</template>
