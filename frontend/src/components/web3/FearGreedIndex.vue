<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getCurrentFearGreedIndex, getFearGreedHistory, type FearGreedIndex, type FearGreedHistoryItem } from '@/service/api/web3';

// State
const currentIndex = ref<FearGreedIndex | null>(null);
const history = ref<FearGreedHistoryItem[]>([]);
const loading = ref(false);
const error = ref('');
const historyLimit = ref(30);

// Get sentiment color based on value
const sentimentColor = computed(() => {
  if (!currentIndex.value) return '#6b7280';
  const value = parseInt(currentIndex.value.value);
  if (value <= 25) return '#ef4444'; // Extreme Fear - Red
  if (value <= 45) return '#f97316'; // Fear - Orange
  if (value <= 55) return '#eab308'; // Neutral - Yellow
  if (value <= 75) return '#22c55e'; // Greed - Light Green
  return '#15803d'; // Extreme Greed - Green
});

const sentimentLabel = computed(() => {
  if (!currentIndex.value) return 'Unknown';
  return currentIndex.value.value_classification;
});

// Format timestamp
const formatDate = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Fetch current index
const fetchCurrentIndex = async () => {
  loading.value = true;
  error.value = '';
  try {
    currentIndex.value = await getCurrentFearGreedIndex();
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch data';
  } finally {
    loading.value = false;
  }
};

// Fetch history
const fetchHistory = async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await getFearGreedHistory(historyLimit.value);
    history.value = result.data || [];
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch history';
  } finally {
    loading.value = false;
  }
};

// Calculate average for the period
const averageValue = computed(() => {
  if (history.value.length === 0) return 0;
  const sum = history.value.reduce((acc, item) => acc + parseInt(item.value), 0);
  return Math.round(sum / history.value.length);
});

// Get chart data points
const chartData = computed(() => {
  return history.value.slice(0, 30).reverse().map(item => ({
    value: parseInt(item.value),
    label: formatDate(item.timestamp)
  }));
});

// On mount
onMounted(async () => {
  await Promise.all([fetchCurrentIndex(), fetchHistory()]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">😱 Fear & Greed Index</h2>
        <p class="text-slate-400">Crypto Market Sentiment Indicator</p>
      </div>
      <button
        class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700"
        @click="() => { fetchCurrentIndex(); fetchHistory(); }"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="border border-red-500/50 rounded-lg bg-red-500/20 p-4 text-red-300">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="grid gap-6 lg:grid-cols-2">
      <!-- Current Index Card -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">📊 Current Index</h3>
        
        <div v-if="currentIndex" class="space-y-4">
          <!-- Big Index Display -->
          <div class="flex items-center justify-center">
            <div
              class="flex h-40 w-40 items-center justify-center rounded-full text-5xl font-bold"
              :style="{ 
                backgroundColor: `${sentimentColor}20`,
                color: sentimentColor,
                border: `4px solid ${sentimentColor}`
              }"
            >
              {{ currentIndex.value }}
            </div>
          </div>
          
          <!-- Sentiment Label -->
          <div class="text-center">
            <span
              class="inline-block rounded-full px-4 py-1 text-lg font-semibold"
              :style="{ 
                backgroundColor: `${sentimentColor}20`,
                color: sentimentColor
              }"
            >
              {{ sentimentLabel }}
            </span>
          </div>
          
          <!-- Update Time -->
          <div class="text-center text-sm text-slate-400">
            <p>Last updated: {{ formatTime(currentIndex.timestamp) }}</p>
            <p>Next update in: {{ currentIndex.time_until_update }}</p>
          </div>
          
          <!-- Interpretation -->
          <div class="mt-4 rounded-lg bg-slate-900/50 p-4">
            <p class="text-sm text-slate-300">
              <span v-if="parseInt(currentIndex.value) <= 25">😰 Extreme Fear: Investors are very worried. This could be a buying opportunity.</span>
              <span v-else-if="parseInt(currentIndex.value) <= 45">😟 Fear: Market is bearish. Caution advised.</span>
              <span v-else-if="parseInt(currentIndex.value) <= 55">😐 Neutral: Market is balanced.</span>
              <span v-else-if="parseInt(currentIndex.value) <= 75">😊 Greed: Market is bullish. Be careful of FOMO.</span>
              <span v-else>🤑 Extreme Greed: Market may be overheated. Consider taking profits.</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Statistics Card -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">📈 Statistics</h3>
        
        <div class="space-y-4">
          <!-- Average -->
          <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
            <span class="text-slate-400">30-Day Average</span>
            <span class="text-xl font-bold" :style="{ color: sentimentColor }">{{ averageValue }}</span>
          </div>
          
          <!-- Highest -->
          <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
            <span class="text-slate-400">Highest (30d)</span>
            <span class="text-xl font-bold text-green-400">
              {{ history.length > 0 ? Math.max(...history.map(h => parseInt(h.value))) : '-' }}
            </span>
          </div>
          
          <!-- Lowest -->
          <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
            <span class="text-slate-400">Lowest (30d)</span>
            <span class="text-xl font-bold text-red-400">
              {{ history.length > 0 ? Math.min(...history.map(h => parseInt(h.value))) : '-' }}
            </span>
          </div>
          
          <!-- Data Points -->
          <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
            <span class="text-slate-400">Data Points</span>
            <span class="text-xl font-bold">{{ history.length }}</span>
          </div>
        </div>
      </div>

      <!-- Chart Card -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">📉 30-Day Trend</h3>
          <select
            v-model="historyLimit"
            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm"
            @change="fetchHistory"
          >
            <option :value="7">7 Days</option>
            <option :value="14">14 Days</option>
            <option :value="30">30 Days</option>
            <option :value="60">60 Days</option>
            <option :value="90">90 Days</option>
          </select>
        </div>
        
        <!-- Simple Bar Chart -->
        <div class="flex h-48 items-end justify-between gap-1">
          <div
            v-for="(point, index) in chartData"
            :key="index"
            class="flex-1 rounded-t transition-all hover:opacity-80"
            :style="{
              height: `${(point.value / 100) * 100}%`,
              backgroundColor: point.value <= 25 ? '#ef4444' : 
                               point.value <= 45 ? '#f97316' : 
                               point.value <= 55 ? '#eab308' : 
                               point.value <= 75 ? '#22c55e' : '#15803d'
            }"
            :title="`${point.label}: ${point.value}`"
          ></div>
        </div>
        
        <!-- Legend -->
        <div class="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-red-500"></div>
            <span class="text-slate-400">0-25 Extreme Fear</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-orange-500"></div>
            <span class="text-slate-400">26-45 Fear</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-yellow-500"></div>
            <span class="text-slate-400">46-55 Neutral</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-green-500"></div>
            <span class="text-slate-400">56-75 Greed</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded bg-green-700"></div>
            <span class="text-slate-400">76-100 Extreme Greed</span>
          </div>
        </div>
      </div>

      <!-- Historical Data Table -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl lg:col-span-2">
        <h3 class="mb-4 text-lg font-semibold">📜 Recent History</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-700 text-slate-400">
                <th class="pb-3 text-left">Date</th>
                <th class="pb-3 text-center">Index</th>
                <th class="pb-3 text-center">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in history.slice(0, 14)"
                :key="item.timestamp"
                class="border-b border-slate-700/50"
              >
                <td class="py-3 text-slate-300">{{ formatDate(item.timestamp) }}</td>
                <td class="py-3 text-center">
                  <span
                    class="inline-block rounded-full px-3 py-1 font-semibold"
                    :style="{
                      backgroundColor: `${item.value_classification === 'Extreme Fear' ? '#ef4444' : 
                                        item.value_classification === 'Fear' ? '#f97316' : 
                                        item.value_classification === 'Neutral' ? '#eab308' : 
                                        item.value_classification === 'Greed' ? '#22c55e' : '#15803d'}20`,
                      color: item.value_classification === 'Extreme Fear' ? '#ef4444' : 
                             item.value_classification === 'Fear' ? '#f97316' : 
                             item.value_classification === 'Neutral' ? '#eab308' : 
                             item.value_classification === 'Greed' ? '#22c55e' : '#15803d'
                    }"
                  >
                    {{ item.value }}
                  </span>
                </td>
                <td class="py-3 text-center text-slate-400">{{ item.value_classification }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
