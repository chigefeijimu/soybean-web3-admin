<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getOptionsOverview, getOpenInterest, getPutCallRatio, type OptionsOverview, type OptionsAsset } from '@/service/api/web3';

interface OpenInterestData {
  asset: string;
  current: { callOi: number; putOi: number; totalOi: number };
  history: Array<{ timestamp: string; callOi: number; putOi: number; totalOi: number }>;
}

interface PutCallData {
  asset: string;
  currentRatio: number;
  sentiment: string;
  history: Array<{ date: string; ratio: number; callVolume: number; putVolume: number }>;
}

const loading = ref(false);
const activeTab = ref<'overview' | 'oi' | 'ratio' | 'iv'>('overview');
const selectedAsset = ref('BTC');
const overview = ref<OptionsOverview | null>(null);
const oiData = ref<OpenInterestData | null>(null);
const ratioData = ref<PutCallData | null>(null);

const assets = ['BTC', 'ETH', 'SOL', 'ARB', 'OP'];

const sentimentEmoji = computed(() => {
  const sentiment = overview.value?.marketSentiment;
  const map: Record<string, string> = {
    very_bullish: '🚀',
    bullish: '🐂',
    neutral: '➖',
    bearish: '🐻',
    very_bearish: '🥺',
  };
  return map[sentiment || 'neutral'];
});

const sentimentText = computed(() => {
  const sentiment = overview.value?.marketSentiment;
  const map: Record<string, string> = {
    very_bullish: 'Very Bullish',
    bullish: 'Bullish',
    neutral: 'Neutral',
    bearish: 'Bearish',
    very_bearish: 'Very Bearish',
  };
  return map[sentiment || 'neutral'];
});

const sentimentColor = computed(() => {
  const sentiment = overview.value?.marketSentiment;
  const map: Record<string, string> = {
    very_bullish: 'text-green-400',
    bullish: 'text-green-300',
    neutral: 'text-yellow-400',
    bearish: 'text-red-300',
    very_bearish: 'text-red-400',
  };
  return map[sentiment || 'neutral'];
});

async function fetchOverview() {
  loading.value = true;
  try {
    overview.value = await getOptionsOverview();
  } catch (e) {
    console.error('Failed to fetch options overview:', e);
  }
  loading.value = false;
}

async function fetchOpenInterest() {
  loading.value = true;
  try {
    oiData.value = await getOpenInterest(selectedAsset.value, '7d');
  } catch (e) {
    console.error('Failed to fetch OI data:', e);
  }
  loading.value = false;
}

async function fetchPutCallRatio() {
  loading.value = true;
  try {
    ratioData.value = await getPutCallRatio(selectedAsset.value);
  } catch (e) {
    console.error('Failed to fetch ratio data:', e);
  }
  loading.value = false;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function handleAssetChange() {
  if (activeTab.value === 'oi') fetchOpenInterest();
  if (activeTab.value === 'ratio') fetchPutCallRatio();
}

function handleTabChange(tab: string) {
  activeTab.value = tab as any;
  if (tab === 'oi') fetchOpenInterest();
  if (tab === 'ratio') fetchPutCallRatio();
}

onMounted(() => {
  fetchOverview();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">📊 Options Tracker</h2>
        <p class="text-sm text-slate-400">Open Interest & Implied Volatility</p>
      </div>
      <select
        v-model="selectedAsset"
        class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        @change="handleAssetChange"
      >
        <option v-for="asset in assets" :key="asset" :value="asset">{{ asset }}</option>
      </select>
    </div>

    <!-- Tabs -->
    <div class="mb-6 flex gap-2">
      <button
        v-for="tab in [
          { id: 'overview', label: 'Overview' },
          { id: 'oi', label: 'Open Interest' },
          { id: 'ratio', label: 'Put/Call' },
          { id: 'iv', label: 'IV Rank' }
        ]"
        :key="tab.id"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="activeTab === tab.id ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'"
        @click="activeTab = tab.id as any; handleAssetChange()"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Overview Tab -->
    <div v-else-if="activeTab === 'overview' && overview">
      <!-- Market Sentiment -->
      <div class="mb-6 rounded-xl bg-slate-900/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-400">Market Sentiment</p>
            <p class="text-2xl font-bold" :class="sentimentColor">
              {{ sentimentEmoji }} {{ sentimentText }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-400">Avg Put/Call Ratio</p>
            <p class="text-xl font-semibold">{{ overview.averagePutCallRatio }}</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Total Open Interest</p>
          <p class="text-lg font-semibold">{{ formatCurrency(overview.totalOpenInterest) }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">24h Volume</p>
          <p class="text-lg font-semibold">{{ formatCurrency(overview.totalVolume24h) }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Average IV</p>
          <p class="text-lg font-semibold">{{ overview.averageIv }}%</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="text-xs text-slate-400">Assets Tracked</p>
          <p class="text-lg font-semibold">{{ overview.assets.length }}</p>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-700 text-left text-sm text-slate-400">
              <th class="pb-3 font-medium">Asset</th>
              <th class="pb-3 font-medium">Open Interest</th>
              <th class="pb-3 font-medium">Call OI</th>
              <th class="pb-3 font-medium">Put OI</th>
              <th class="pb-3 font-medium">P/C Ratio</th>
              <th class="pb-3 font-medium">IV</th>
              <th class="pb-3 font-medium">Volume 24h</th>
              <th class="pb-3 font-medium">Max Pain</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="asset in overview.assets"
              :key="asset.asset"
              class="border-b border-slate-700/50 text-sm"
            >
              <td class="py-3 font-semibold">{{ asset.symbol }}</td>
              <td class="py-3">{{ asset.totalOiFormatted }}</td>
              <td class="py-3 text-green-400">{{ formatCurrency(asset.callOi) }}</td>
              <td class="py-3 text-red-400">{{ formatCurrency(asset.putOi) }}</td>
              <td class="py-3">
                <span
                  class="rounded px-2 py-1 text-xs"
                  :class="asset.putCallRatio < 0.7 ? 'bg-green-500/20 text-green-400' : asset.putCallRatio > 0.9 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'"
                >
                  {{ asset.putCallRatio }}
                </span>
              </td>
              <td class="py-3">
                <span class="text-yellow-400">{{ asset.iv }}%</span>
                <span class="ml-1 text-xs" :class="asset.ivChange >= 0 ? 'text-green-400' : 'text-red-400'">
                  {{ asset.ivChange >= 0 ? '↑' : '↓' }}{{ Math.abs(asset.ivChange) }}%
                </span>
              </td>
              <td class="py-3">{{ asset.volumeFormatted }}</td>
              <td class="py-3">{{ formatCurrency(asset.maxPain) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Open Interest Tab -->
    <div v-else-if="activeTab === 'oi' && oiData">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-semibold">{{ selectedAsset }} Open Interest</h3>
        <div class="flex items-center gap-4 text-sm">
          <span class="flex items-center gap-1">
            <span class="h-3 w-3 rounded-full bg-green-500"></span> Calls
          </span>
          <span class="flex items-center gap-1">
            <span class="h-3 w-3 rounded-full bg-red-500"></span> Puts
          </span>
        </div>
      </div>
      <div class="h-64 rounded-xl bg-slate-900/50 p-4">
        <!-- Simple chart representation -->
        <div class="flex h-full items-end gap-1">
          <div
            v-for="(point, i) in oiData.history.slice(-50)"
            :key="i"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <div
              class="w-full rounded-t-sm bg-green-500/70"
              :style="{ height: `${(point.callOi / oiData.current.callOi) * 100}%` }"
            ></div>
            <div
              class="w-full rounded-t-sm bg-red-500/70"
              :style="{ height: `${(point.putOi / oiData.current.putOi) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-3 gap-4">
        <div class="rounded-xl bg-slate-900/50 p-4 text-center">
          <p class="text-xs text-slate-400">Call OI</p>
          <p class="text-lg font-semibold text-green-400">{{ formatCurrency(oiData.current.callOi) }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4 text-center">
          <p class="text-xs text-slate-400">Put OI</p>
          <p class="text-lg font-semibold text-red-400">{{ formatCurrency(oiData.current.putOi) }}</p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4 text-center">
          <p class="text-xs text-slate-400">Total OI</p>
          <p class="text-lg font-semibold">{{ formatCurrency(oiData.current.totalOi) }}</p>
        </div>
      </div>
    </div>

    <!-- Put/Call Ratio Tab -->
    <div v-else-if="activeTab === 'ratio' && ratioData">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-semibold">{{ selectedAsset }} Put/Call Ratio</h3>
        <span
          class="rounded-lg px-3 py-1 text-sm font-medium"
          :class="ratioData.sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' : ratioData.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'"
        >
          {{ ratioData.sentiment === 'bullish' ? '🐂' : ratioData.sentiment === 'bearish' ? '🐻' : '➖' }}
          {{ ratioData.sentiment.charAt(0).toUpperCase() + ratioData.sentiment.slice(1) }}
        </span>
      </div>
      <div class="h-48 rounded-xl bg-slate-900/50 p-4">
        <div class="flex h-full items-end gap-1">
          <div
            v-for="(point, i) in ratioData.history.slice(-30)"
            :key="i"
            class="flex-1"
          >
            <div
              class="w-full rounded-t-sm transition-all"
              :class="point.ratio < 0.7 ? 'bg-green-500/70' : point.ratio > 0.9 ? 'bg-red-500/70' : 'bg-yellow-500/70'"
              :style="{ height: `${Math.min(100, point.ratio * 80)}%` }"
            ></div>
          </div>
        </div>
      </div>
      <div class="mt-4 text-center">
        <p class="text-sm text-slate-400">Current Ratio</p>
        <p class="text-3xl font-bold">{{ ratioData.currentRatio }}</p>
      </div>
    </div>

    <!-- IV Rank Tab -->
    <div v-else-if="activeTab === 'iv'">
      <div class="rounded-xl bg-slate-900/50 p-6">
        <p class="mb-2 text-sm text-slate-400">{{ selectedAsset }} Implied Volatility</p>
        <div class="mb-4 flex items-center justify-center">
          <div class="relative h-32 w-32">
            <svg class="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" stroke-width="12" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#8b5cf6"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="`${Math.min(100, overview?.averageIv || 50)} 100`"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-bold">{{ overview?.averageIv || 0 }}%</span>
              <span class="text-xs text-slate-400">IV</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="rounded-lg bg-slate-800/50 p-3">
            <p class="text-xs text-slate-400">IV Rank</p>
            <p class="text-xl font-semibold text-purple-400">{{ Math.min(100, Math.max(0, Math.round(50 + ((overview?.averageIv || 60) - 60) * 2))) }}</p>
          </div>
          <div class="rounded-lg bg-slate-800/50 p-3">
            <p class="text-xs text-slate-400">IV Percentile</p>
            <p class="text-xl font-semibold text-purple-400">{{ Math.min(100, Math.max(0, Math.round(45 + ((overview?.averageIv || 60) - 55) * 1.5))) }}</p>
          </div>
        </div>
        <p class="mt-4 text-center text-xs text-slate-500">
          Higher IV = More expensive options premiums
        </p>
      </div>
    </div>
  </div>
</template>
