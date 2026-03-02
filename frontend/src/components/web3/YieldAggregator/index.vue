<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { yieldAggregatorApi } from '@/service/yieldAggregator';

interface YieldOpportunity {
  id: string;
  protocol: string;
  chain: string;
  chainId: number;
  tokenPair: string;
  token0: string;
  token1: string;
  tvl: number;
  apy: number;
  apy7d: number;
  rewardToken: string;
  rewardApy: number;
  riskLevel: 'low' | 'medium' | 'high';
  poolAddress: string;
  url: string;
}

interface AggregatedYield {
  chain: string;
  chainId: number;
  bestApy: number;
  opportunities: YieldOpportunity[];
  totalTvl: number;
}

const loading = ref(false);
const error = ref('');
const activeView = ref<'chains' | 'opportunities' | 'compare'>('chains');
const selectedChain = ref<number | null>(null);
const crossChainData = ref<AggregatedYield[]>([]);
const topOpportunities = ref<YieldOpportunity[]>([]);
const compareToken = ref('ETH');
const compareResult = ref<any>(null);

// Calculator
const calcPrincipal = ref(10000);
const calcApy = ref(10);
const calcDays = ref(30);
const calcFrequency = ref<'daily' | 'weekly' | 'monthly'>('daily');
const calcResult = ref<any>(null);

const chainIcons: Record<string, string> = {
  Ethereum: '🔷',
  Polygon: '🟣',
  Arbitrum: '🔵',
  Optimism: '🟠',
  BSC: '🟡',
  Base: '⚫',
  Avalanche: '🔴',
};

const riskColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const formatTvl = (value: number) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
};

const formatApy = (value: number) => `${value.toFixed(2)}%`;

const fetchCrossChainData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await yieldAggregatorApi.getCrossChainYield();
    crossChainData.value = res.data;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch yield data';
  } finally {
    loading.value = false;
  }
};

const fetchTopOpportunities = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await yieldAggregatorApi.getTopOpportunities(20);
    topOpportunities.value = res.data;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch opportunities';
  } finally {
    loading.value = false;
  }
};

const fetchComparison = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await yieldAggregatorApi.getYieldComparison(compareToken.value);
    compareResult.value = res.data;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch comparison';
  } finally {
    loading.value = false;
  }
};

const calculateReturns = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await yieldAggregatorApi.calculateReturns({
      principal: calcPrincipal.value,
      apy: calcApy.value,
      durationDays: calcDays.value,
      compoundFrequency: calcFrequency.value,
    });
    calcResult.value = res.data;
  } catch (e: any) {
    error.value = e.message || 'Calculation failed';
  } finally {
    loading.value = false;
  }
};

const selectChain = (chainId: number | null) => {
  selectedChain.value = chainId;
};

const selectedChainData = computed(() => {
  if (selectedChain.value === null) return null;
  return crossChainData.value.find(c => c.chainId === selectedChain.value);
});

onMounted(() => {
  fetchCrossChainData();
  fetchTopOpportunities();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">🌾 Yield Aggregator</h2>
        <p class="text-slate-400">Cross-chain DeFi yield opportunities</p>
      </div>
      
      <!-- View Tabs -->
      <div class="flex gap-2">
        <button
          v-for="view in [
            { id: 'chains', label: 'Chains', icon: '🔗' },
            { id: 'opportunities', label: 'Top', icon: '🔥' },
            { id: 'compare', label: 'Compare', icon: '⚖️' }
          ]"
          :key="view.id"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="activeView === view.id 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
            : 'bg-slate-800/50 text-slate-400 hover:text-white'"
          @click="activeView = view.id"
        >
          <span class="mr-2">{{ view.icon }}</span>
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-300">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Chains View -->
    <div v-show="activeView === 'chains'" class="space-y-4">
      <!-- Chain Cards -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          v-for="chain in crossChainData"
          :key="chain.chainId"
          class="rounded-xl border p-4 text-left transition-all"
          :class="selectedChain === chain.chainId 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'"
          @click="selectChain(chain.chainId)"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ chainIcons[chain.chain] || '⚪' }}</span>
            <span class="font-semibold text-white">{{ chain.chain }}</span>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Best APY</span>
              <span class="font-semibold text-green-400">{{ formatApy(chain.bestApy) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">TVL</span>
              <span class="text-slate-300">{{ formatTvl(chain.totalTvl) }}</span>
            </div>
          </div>
        </button>
      </div>

      <!-- Selected Chain Details -->
      <div v-if="selectedChainData" class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 class="mb-4 text-lg font-semibold text-white">
          {{ chainIcons[selectedChainData.chain] }} {{ selectedChainData.chain }} Opportunities
        </h3>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm text-slate-400">
                <th class="pb-3 font-medium">Protocol</th>
                <th class="pb-3 font-medium">Pool</th>
                <th class="pb-3 font-medium">TVL</th>
                <th class="pb-3 font-medium">APY</th>
                <th class="pb-3 font-medium">Reward</th>
                <th class="pb-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr
                v-for="opp in selectedChainData.opportunities"
                :key="opp.id"
                class="border-t border-slate-700/50"
              >
                <td class="py-3">
                  <a :href="opp.url" target="_blank" class="text-purple-400 hover:underline">
                    {{ opp.protocol }}
                  </a>
                </td>
                <td class="py-3 text-slate-300">{{ opp.tokenPair }}</td>
                <td class="py-3 text-slate-300">{{ formatTvl(opp.tvl) }}</td>
                <td class="py-3">
                  <span class="font-semibold text-green-400">{{ formatApy(opp.apy) }}</span>
                </td>
                <td class="py-3 text-slate-300">
                  <span v-if="opp.rewardApy > 0" class="text-blue-400">
                    +{{ formatApy(opp.rewardApy) }} {{ opp.rewardToken }}
                  </span>
                  <span v-else class="text-slate-500">-</span>
                </td>
                <td class="py-3">
                  <span :class="riskColors[opp.riskLevel]" class="capitalize">
                    {{ opp.riskLevel }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Top Opportunities View -->
    <div v-show="activeView === 'opportunities'" class="space-y-4">
      <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 class="mb-4 text-lg font-semibold text-white">🔥 Top Yield Opportunities</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm text-slate-400">
                <th class="pb-3 font-medium">#</th>
                <th class="pb-3 font-medium">Chain</th>
                <th class="pb-3 font-medium">Protocol</th>
                <th class="pb-3 font-medium">Pool</th>
                <th class="pb-3 font-medium">TVL</th>
                <th class="pb-3 font-medium">APY</th>
                <th class="pb-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr
                v-for="(opp, idx) in topOpportunities"
                :key="opp.id"
                class="border-t border-slate-700/50"
              >
                <td class="py-3 text-slate-400">{{ idx + 1 }}</td>
                <td class="py-3">
                  <span class="flex items-center gap-1">
                    <span>{{ chainIcons[opp.chain] || '⚪' }}</span>
                    <span class="text-slate-300">{{ opp.chain }}</span>
                  </span>
                </td>
                <td class="py-3">
                  <a :href="opp.url" target="_blank" class="text-purple-400 hover:underline">
                    {{ opp.protocol }}
                  </a>
                </td>
                <td class="py-3 text-slate-300">{{ opp.tokenPair }}</td>
                <td class="py-3 text-slate-300">{{ formatTvl(opp.tvl) }}</td>
                <td class="py-3">
                  <span class="font-semibold text-green-400">{{ formatApy(opp.apy) }}</span>
                </td>
                <td class="py-3">
                  <span :class="riskColors[opp.riskLevel]" class="capitalize">
                    {{ opp.riskLevel }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Compare View -->
    <div v-show="activeView === 'compare'" class="space-y-6">
      <!-- Token Comparison -->
      <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 class="mb-4 text-lg font-semibold text-white">⚖️ Token Yield Comparison</h3>
        
        <div class="flex gap-4 mb-4">
          <input
            v-model="compareToken"
            type="text"
            placeholder="Token (e.g., ETH, BTC)"
            class="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            class="rounded-lg bg-purple-500 px-6 py-2 font-semibold text-white transition-all hover:bg-purple-600"
            @click="fetchComparison"
          >
            Compare
          </button>
        </div>

        <div v-if="compareResult" class="space-y-3">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-lg font-semibold text-white">{{ compareResult.token }}</span>
          </div>
          
          <div v-for="item in compareResult.chains" :key="item.chain" 
               class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
            <div class="flex items-center gap-2">
              <span>{{ chainIcons[item.chain] || '⚪' }}</span>
              <span class="text-slate-300">{{ item.chain }}</span>
            </div>
            <div class="text-right">
              <div class="font-semibold text-green-400">{{ formatApy(item.bestApy) }}</div>
              <div class="text-xs text-slate-500">{{ item.protocols.join(', ') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calculator -->
      <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 class="mb-4 text-lg font-semibold text-white">🧮 Yield Calculator</h3>
        
        <div class="grid gap-4 lg:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm text-slate-400">Principal ($)</label>
            <input
              v-model.number="calcPrincipal"
              type="number"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">APY (%)</label>
            <input
              v-model.number="calcApy"
              type="number"
              step="0.1"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Duration (days)</label>
            <input
              v-model.number="calcDays"
              type="number"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-400">Compound</label>
            <select
              v-model="calcFrequency"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        
        <button
          class="mt-4 rounded-lg bg-purple-500 px-6 py-2 font-semibold text-white transition-all hover:bg-purple-600"
          @click="calculateReturns"
        >
          Calculate
        </button>

        <div v-if="calcResult" class="mt-6 grid gap-4 lg:grid-cols-3">
          <div class="rounded-lg bg-slate-900/50 p-4">
            <div class="text-sm text-slate-400">Simple Return</div>
            <div class="text-xl font-semibold text-green-400">+${{ calcResult.simpleReturn.toFixed(2) }}</div>
          </div>
          <div class="rounded-lg bg-slate-900/50 p-4">
            <div class="text-sm text-slate-400">Compound Return</div>
            <div class="text-xl font-semibold text-green-400">+${{ calcResult.compoundReturn.toFixed(2) }}</div>
          </div>
          <div class="rounded-lg bg-slate-900/50 p-4">
            <div class="text-sm text-slate-400">Effective APY</div>
            <div class="text-xl font-semibold text-purple-400">{{ calcResult.effectiveApy.toFixed(2) }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
