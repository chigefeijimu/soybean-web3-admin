<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  getYieldComparison, 
  getTopYields, 
  calculateEarnings,
  getSupportedYieldChains,
  getSupportedProtocols,
  type YieldComparison as YieldComparisonType,
  type ProtocolYield,
  type EarningsResult 
} from '@/service/api/web3';

// State
const yieldData = ref<YieldComparisonType[]>([]);
const topYields = ref<ProtocolYield[]>([]);
const supportedChains = ref<string[]>([]);
const supportedProtocols = ref<string[]>([]);
const loading = ref(false);
const error = ref('');

// Filter state
const selectedChain = ref('all');
const selectedToken = ref('all');
const sortBy = ref('apy');

// Calculator state
const calculatorPrincipal = ref(10000);
const calculatorToken = ref('USDC');
const calculatorDays = ref(30);
const calculatorResult = ref<EarningsResult | null>(null);
const calculating = ref(false);

// Format TVL
function formatTvl(tvl: number): string {
  if (tvl >= 1000000000) {
    return `$${(tvl / 1000000000).toFixed(2)}B`;
  } else if (tvl >= 1000000) {
    return `$${(tvl / 1000000).toFixed(2)}M`;
  }
  return `$${tvl.toLocaleString()}`;
}

// Format APY
function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

// Get APY color
function getApyColor(apy: number): string {
  if (apy >= 5.5) return 'text-green-400';
  if (apy >= 4.5) return 'text-blue-400';
  if (apy >= 3.5) return 'text-yellow-400';
  return 'text-slate-400';
}

// Filter yields
const filteredYields = computed(() => {
  let data = [...yieldData.value];
  
  if (selectedToken.value !== 'all') {
    data = data.filter(y => y.stablecoin.symbol === selectedToken.value);
  }
  
  return data;
});

// Get unique tokens
const uniqueTokens = computed(() => {
  return yieldData.value.map(y => y.stablecoin.symbol);
});

// Sort yields
const sortedYields = computed(() => {
  const data = [...filteredYields.value];
  
  if (sortBy.value === 'apy') {
    data.sort((a, b) => b.averageApy - a.averageApy);
  } else if (sortBy.value === 'tvl') {
    data.sort((a, b) => {
      const aTvl = a.yields.reduce((sum, y) => sum + y.tvl, 0);
      const bTvl = b.yields.reduce((sum, y) => sum + y.tvl, 0);
      return bTvl - aTvl;
    });
  } else if (sortBy.value === 'tvl') {
    data.sort((a, b) => b.stablecoin.change24h - a.stablecoin.change24h);
  }
  
  return data;
});

// Load data
async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    const [comparison, top, chains, protocols] = await Promise.all([
      getYieldComparison(),
      getTopYields(15),
      getSupportedYieldChains(),
      getSupportedProtocols()
    ]);
    
    yieldData.value = comparison;
    topYields.value = top;
    supportedChains.value = chains;
    supportedProtocols.value = protocols;
  } catch (e: any) {
    error.value = e.message || 'Failed to load yield data';
    console.error('Load error:', e);
  } finally {
    loading.value = false;
  }
}

// Calculate earnings
async function calcEarnings() {
  calculating.value = true;
  
  try {
    calculatorResult.value = await calculateEarnings(
      calculatorPrincipal.value,
      calculatorToken.value,
      calculatorDays.value
    );
  } catch (e: any) {
    console.error('Calculation error:', e);
  } finally {
    calculating.value = false;
  }
}

// Initialize
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            💰 Stablecoin Yield Comparator
          </h2>
          <p class="mt-1 text-sm text-slate-400">Compare yields across DeFi protocols</p>
        </div>
        
        <!-- Filters -->
        <div class="flex gap-3">
          <select
            v-model="selectedToken"
            class="border border-slate-700 rounded-lg bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Tokens</option>
            <option v-for="token in uniqueTokens" :key="token" :value="token">
              {{ token }}
            </option>
          </select>
          
          <select
            v-model="sortBy"
            class="border border-slate-700 rounded-lg bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="apy">Sort by APY</option>
            <option value="tvl">Sort by TVL</option>
            <option value="change">Sort by Change</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="border border-red-500/50 rounded-xl bg-red-500/20 p-4"
    >
      <p class="text-red-300">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin text-4xl">⏳</div>
    </div>

    <!-- Main Content -->
    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- Yield Comparison Table -->
      <div class="lg:col-span-2 space-y-4">
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">📊 Yield Comparison by Token</h3>
          
          <div class="space-y-3">
            <div
              v-for="item in sortedYields"
              :key="item.stablecoin.symbol"
              class="rounded-xl bg-slate-900/50 p-4"
            >
              <!-- Token Header -->
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                    <span class="text-lg">💵</span>
                  </div>
                  <div>
                    <p class="font-semibold">{{ item.stablecoin.symbol }}</p>
                    <p class="text-xs text-slate-400">{{ item.stablecoin.name }}</p>
                  </div>
                </div>
                
                <div class="text-right">
                  <p class="text-sm text-slate-400">Avg APY</p>
                  <p class="text-xl font-bold" :class="getApyColor(item.averageApy)">
                    {{ formatApy(item.averageApy) }}
                  </p>
                </div>
              </div>
              
              <!-- Yields List -->
              <div class="space-y-2">
                <div
                  v-for="yieldItem in item.yields.slice(0, 5)"
                  :key="`${yieldItem.protocol}-${yieldItem.chain}`"
                  class="flex items-center justify-between rounded-lg bg-slate-800/50 p-2"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ yieldItem.logo }}</span>
                    <div>
                      <p class="text-sm font-medium">{{ yieldItem.protocol }}</p>
                      <p class="text-xs text-slate-400">{{ yieldItem.chain }}</p>
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <p class="font-semibold" :class="getApyColor(yieldItem.apy)">
                      {{ formatApy(yieldItem.apy) }}
                    </p>
                    <p class="text-xs text-slate-400">{{ formatTvl(yieldItem.tvl) }} TVL</p>
                  </div>
                </div>
              </div>
              
              <!-- Best Yield Badge -->
              <div
                v-if="item.bestYield"
                class="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 p-2 border border-green-500/30"
              >
                <span class="text-lg">🏆</span>
                <span class="text-sm text-green-400">
                  Best: <strong>{{ item.bestYield.protocol }}</strong> on {{ item.bestYield.chain }} @ 
                  <strong>{{ formatApy(item.bestYield.apy) }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Yields -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">🔥 Top 15 Highest Yields</h3>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-sm text-slate-400">
                  <th class="pb-3">#</th>
                  <th class="pb-3">Protocol</th>
                  <th class="pb-3">Token</th>
                  <th class="pb-3">Chain</th>
                  <th class="pb-3 text-right">APY</th>
                  <th class="pb-3 text-right">TVL</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(yieldItem, index) in topYields"
                  :key="index"
                  class="border-t border-slate-700/50"
                >
                  <td class="py-3 text-slate-400">{{ index + 1 }}</td>
                  <td class="py-3">
                    <div class="flex items-center gap-2">
                      <span>{{ yieldItem.logo }}</span>
                      <span class="font-medium">{{ yieldItem.protocol }}</span>
                    </div>
                  </td>
                  <td class="py-3 text-slate-300">{{ yieldItem.token }}</td>
                  <td class="py-3">
                    <span class="rounded-full bg-slate-700 px-2 py-1 text-xs">
                      {{ yieldItem.chain }}
                    </span>
                  </td>
                  <td class="py-3 text-right font-semibold" :class="getApyColor(yieldItem.apy)">
                    {{ formatApy(yieldItem.apy) }}
                  </td>
                  <td class="py-3 text-right text-slate-400">{{ formatTvl(yieldItem.tvl) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sidebar: Calculator -->
      <div class="space-y-6">
        <!-- Earnings Calculator -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">🧮 Earnings Calculator</h3>
          
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm text-slate-400">Principal Amount ($)</label>
              <input
                v-model.number="calculatorPrincipal"
                type="number"
                min="100"
                step="100"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label class="mb-1 block text-sm text-slate-400">Token</label>
              <select
                v-model="calculatorToken"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option v-for="token in uniqueTokens" :key="token" :value="token">
                  {{ token }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="mb-1 block text-sm text-slate-400">Duration (days)</label>
              <select
                v-model.number="calculatorDays"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option :value="7">7 days</option>
                <option :value="30">30 days</option>
                <option :value="90">90 days</option>
                <option :value="180">180 days</option>
                <option :value="365">1 year</option>
              </select>
            </div>
            
            <button
              @click="calcEarnings"
              :disabled="calculating"
              class="w-full rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-4 py-2 font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            >
              {{ calculating ? 'Calculating...' : 'Calculate' }}
            </button>
            
            <!-- Result -->
            <div
              v-if="calculatorResult"
              class="mt-4 rounded-xl bg-slate-900/80 p-4"
            >
              <div class="text-center">
                <p class="text-sm text-slate-400">Estimated Earnings</p>
                <p class="text-3xl font-bold text-green-400">
                  ${{ calculatorResult.earnings.toLocaleString() }}
                </p>
                <p class="mt-2 text-sm text-slate-400">
                  Final Amount: <span class="text-white">${{ calculatorResult.finalAmount.toLocaleString() }}</span>
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  Based on {{ calculatorResult.apy.toFixed(2) }}% APY
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">📈 Quick Stats</h3>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Supported Protocols</span>
              <span class="font-semibold">{{ supportedProtocols.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Supported Chains</span>
              <span class="font-semibold">{{ supportedChains.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Stablecoins</span>
              <span class="font-semibold">{{ uniqueTokens.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Best APY</span>
              <span class="font-semibold text-green-400">
                {{ topYields.length > 0 ? formatApy(topYields[0].apy) : 'N/A' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Top Protocol</span>
              <span class="font-semibold">
                {{ topYields.length > 0 ? topYields[0].protocol : 'N/A' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Supported Chains -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">⛓️ Supported Chains</h3>
          
          <div class="flex flex-wrap gap-2">
            <span
              v-for="chain in supportedChains"
              :key="chain"
              class="rounded-full bg-slate-700 px-3 py-1 text-sm"
            >
              {{ chain }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
