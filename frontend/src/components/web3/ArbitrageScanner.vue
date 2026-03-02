<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { scanArbitrageOpportunities, getArbitrageOverview, type ArbitrageOpportunity } from '@/service/api/web3';

interface MarketOverview {
  totalOpportunities: number;
  avgProfit: number;
  topTokens: { token: string; opportunities: number }[];
  byRisk: { low: number; medium: number; high: number };
}

const loading = ref(false);

const opportunities = ref<ArbitrageOpportunity[]>([]);
const marketOverview = ref<MarketOverview | null>(null);
const minProfit = ref(0.5);
const volumeThreshold = ref(10000);
const selectedToken = ref('all');
const sortBy = ref<'profit' | 'volume' | 'diff'>('profit');

const tokens = ['all', 'ETH', 'USDC', 'USDT', 'WBTC', 'DAI'];

const filteredOpportunities = computed(() => {
  let result = opportunities.value;
  
  if (selectedToken.value !== 'all') {
    result = result.filter(op => op.token === selectedToken.value);
  }
  
  switch (sortBy.value) {
    case 'profit':
      return result.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
    case 'volume':
      return result.sort((a, b) => b.volume - a.volume);
    case 'diff':
      return result.sort((a, b) => b.priceDiffPercent - a.priceDiffPercent);
    default:
      return result;
  }
});

const riskColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatPrice = (num: number) => {
  if (num >= 1000) return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + num.toFixed(4);
};

const scanOpportunities = async () => {
  loading.value = true;
  try {
    const res = await scanArbitrageOpportunities({
      minProfit: minProfit.value,
      volume: volumeThreshold.value,
    });
    opportunities.value = res.data || [];
  } catch (error) {
    console.error('Failed to scan opportunities:', error);
  } finally {
    loading.value = false;
  }
};

const fetchOverview = async () => {
  try {
    const res = await getArbitrageOverview();
    marketOverview.value = res.data || null;
  } catch (error) {
    console.error('Failed to fetch overview:', error);
  }
};

const getRiskLabel = (risk: string) => {
  switch (risk) {
    case 'low': return '🟢 Low';
    case 'medium': return '🟡 Medium';
    case 'high': return '🔴 High';
    default: return risk;
  }
};

onMounted(async () => {
  await Promise.all([scanOpportunities(), fetchOverview()]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">🔍 Arbitrage Scanner</h2>
        <p class="text-slate-400">Find price differences across DEXs</p>
      </div>
      <button
        class="rounded-xl bg-purple-500/20 px-6 py-2 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 transition-all"
        @click="scanOpportunities"
        :disabled="loading"
      >
        {{ loading ? 'Scanning...' : '🔄 Rescan' }}
      </button>
    </div>

    <!-- Stats Overview -->
    <div v-if="marketOverview" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Total Opportunities</p>
        <p class="text-2xl font-bold text-white">{{ marketOverview.totalOpportunities }}</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Avg Profit</p>
        <p class="text-2xl font-bold text-green-400">${{ formatNumber(marketOverview.avgProfit) }}</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Low Risk</p>
        <p class="text-2xl font-bold text-green-400">{{ marketOverview.byRisk.low }}</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">High Risk</p>
        <p class="text-2xl font-bold text-red-400">{{ marketOverview.byRisk.high }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs text-slate-400 mb-2">Min Profit %</label>
          <input
            v-model.number="minProfit"
            type="number"
            step="0.1"
            min="0"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs text-slate-400 mb-2">Volume Threshold ($)</label>
          <input
            v-model.number="volumeThreshold"
            type="number"
            step="1000"
            min="0"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div class="flex-1 min-w-[150px]">
          <label class="block text-xs text-slate-400 mb-2">Token</label>
          <select
            v-model="selectedToken"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option v-for="token in tokens" :key="token" :value="token">
              {{ token === 'all' ? 'All Tokens' : token }}
            </option>
          </select>
        </div>
        <div class="flex-1 min-w-[150px]">
          <label class="block text-xs text-slate-400 mb-2">Sort By</label>
          <select
            v-model="sortBy"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="profit">Est. Profit</option>
            <option value="volume">Volume</option>
            <option value="diff">Price Diff %</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Opportunities Table -->
    <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 backdrop-blur-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Token</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Buy DEX</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sell DEX</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Buy Price</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Sell Price</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Diff %</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Volume</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Est. Profit</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Risk</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr
              v-for="opp in filteredOpportunities"
              :key="opp.id"
              class="hover:bg-slate-700/30 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="font-semibold text-white">{{ opp.token }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-blue-400">{{ opp.buyExchange }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-green-400">{{ opp.sellExchange }}</span>
              </td>
              <td class="px-4 py-3 text-right text-slate-300">
                {{ formatPrice(opp.buyPrice) }}
              </td>
              <td class="px-4 py-3 text-right text-slate-300">
                {{ formatPrice(opp.sellPrice) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="opp.priceDiffPercent > 1 ? 'text-green-400' : 'text-yellow-400'">
                  +{{ opp.priceDiffPercent.toFixed(2) }}%
                </span>
              </td>
              <td class="px-4 py-3 text-right text-slate-300">
                ${{ formatNumber(opp.volume) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-green-400 font-semibold">${{ formatNumber(opp.estimatedProfit) }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="riskColor(opp.risk)" class="text-xs font-medium">
                  {{ getRiskLabel(opp.risk) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredOpportunities.length === 0 && !loading" class="p-8 text-center">
        <div class="text-4xl mb-4">📊</div>
        <p class="text-slate-400">No arbitrage opportunities found</p>
        <p class="text-sm text-slate-500">Try adjusting your filters</p>
      </div>
    </div>

    <!-- Top Tokens -->
    <div v-if="marketOverview" class="grid gap-6 lg:grid-cols-2">
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold mb-4">🔥 Top Tokens</h3>
        <div class="space-y-3">
          <div
            v-for="(item, idx) in marketOverview.topTokens"
            :key="item.token"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-slate-500">{{ idx + 1 }}</span>
              <span class="font-semibold text-white">{{ item.token }}</span>
            </div>
            <span class="text-purple-400">{{ item.opportunities }} opportunities</span>
          </div>
        </div>
      </div>

      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="text-lg font-semibold mb-4">⚠️ Risk Distribution</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-green-400">Low Risk</span>
              <span class="text-white">{{ marketOverview.byRisk.low }}</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 rounded-full"
                :style="{ width: marketOverview.totalOpportunities ? (marketOverview.byRisk.low / marketOverview.totalOpportunities * 100) + '%' : '0%' }"
              ></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-yellow-400">Medium Risk</span>
              <span class="text-white">{{ marketOverview.byRisk.medium }}</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-yellow-500 rounded-full"
                :style="{ width: marketOverview.totalOpportunities ? (marketOverview.byRisk.medium / marketOverview.totalOpportunities * 100) + '%' : '0%' }"
              ></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-red-400">High Risk</span>
              <span class="text-white">{{ marketOverview.byRisk.high }}</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-red-500 rounded-full"
                :style="{ width: marketOverview.totalOpportunities ? (marketOverview.byRisk.high / marketOverview.totalOpportunities * 100) + '%' : '0%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
