<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getPortfolioRebalancerPortfolio, generateRebalancePlan, getRebalanceStrategies, type RebalanceToken, type TargetAllocation, type RebalanceTrade, type RebalancePlan, type PresetStrategy } from '@/service/api/web3';

// State
const address = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1');
const chainId = ref(1);
const loading = ref(false);
const portfolio = ref<RebalanceToken[]>([]);
const totalValue = ref(0);
const rebalancePlan = ref<RebalancePlan | null>(null);
const strategies = ref<PresetStrategy[]>([]);
const customTargets = ref<TargetAllocation[]>([]);
const slippageTolerance = ref(0.5);

// Chain options
const chains = [
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
];

// Colors for charts
const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

// Load portfolio
const loadPortfolio = async () => {
  loading.value = true;
  try {
    const res = await getPortfolioRebalancerPortfolio(address.value, chainId.value);
    portfolio.value = res.data.tokens;
    totalValue.value = res.data.totalValue;
  } catch (error) {
    console.error('Failed to load portfolio:', error);
  } finally {
    loading.value = false;
  }
};

// Load strategies
const loadStrategies = async () => {
  try {
    const res = await getRebalanceStrategies();
    strategies.value = res.data;
  } catch (error) {
    console.error('Failed to load strategies:', error);
  }
};

// Apply strategy
const applyStrategy = (strategy: PresetStrategy) => {
  customTargets.value = [...strategy.allocation];
};

// Generate rebalance plan
const generatePlan = async () => {
  if (customTargets.value.length === 0) return;
  
  loading.value = true;
  try {
    const res = await generateRebalancePlan(address.value, customTargets.value, chainId.value, slippageTolerance.value);
    rebalancePlan.value = res.data;
  } catch (error) {
    console.error('Failed to generate plan:', error);
  } finally {
    loading.value = false;
  }
};

// Add custom target
const addTarget = () => {
  customTargets.value.push({ symbol: '', percentage: 0 });
};

// Remove target
const removeTarget = (index: number) => {
  customTargets.value.splice(index, 1);
};

// Total allocation percentage
const totalAllocation = computed(() => {
  return customTargets.value.reduce((sum, t) => sum + t.percentage, 0);
});

// Current allocation data for chart
const currentAllocationData = computed(() => {
  if (!rebalancePlan.value) return [];
  return rebalancePlan.value.currentAllocation.map((item, i) => ({
    ...item,
    color: colors[i % colors.length]
  }));
});

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// On mount
onMounted(() => {
  loadPortfolio();
  loadStrategies();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">📊 Portfolio Rebalancer</h2>
        <p class="text-slate-400">Optimize your DeFi portfolio allocation</p>
      </div>
    </div>

    <!-- Input Section -->
    <div class="grid gap-4 lg:grid-cols-3">
      <div>
        <label class="mb-2 block text-sm text-slate-400">Wallet Address</label>
        <input
          v-model="address"
          type="text"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
          placeholder="0x..."
        />
      </div>
      <div>
        <label class="mb-2 block text-sm text-slate-400">Network</label>
        <select
          v-model="chainId"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="mb-2 block text-sm text-slate-400">Slippage Tolerance (%)</label>
        <input
          v-model="slippageTolerance"
          type="number"
          step="0.1"
          min="0.1"
          max="5"
          class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
        />
      </div>
    </div>

    <button
      class="rounded-lg from-blue-500 to-purple-500 bg-gradient-to-r px-6 py-2 font-semibold text-white transition-all hover:scale-105"
      :disabled="loading"
      @click="loadPortfolio"
    >
      {{ loading ? 'Loading...' : 'Load Portfolio' }}
    </button>

    <!-- Portfolio Summary -->
    <div v-if="portfolio.length > 0" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-4 text-lg font-semibold">💼 Current Portfolio</h3>
      <p class="mb-4 text-3xl font-bold text-green-400">{{ formatCurrency(totalValue) }}</p>
      
      <div class="grid gap-3 lg:grid-cols-2">
        <div
          v-for="token in portfolio.slice(0, 6)"
          :key="token.symbol"
          class="flex items-center justify-between rounded-xl bg-slate-900/50 p-3"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl font-semibold">{{ token.symbol }}</span>
            <span class="text-sm text-slate-400">{{ token.name }}</span>
          </div>
          <div class="text-right">
            <p class="font-semibold">{{ formatCurrency(token.value) }}</p>
            <p class="text-xs" :class="token.change24h >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ token.change24h >= 0 ? '+' : '' }}{{ token.change24h.toFixed(2) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preset Strategies -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-4 text-lg font-semibold">🎯 Preset Strategies</h3>
      <div class="grid gap-3 lg:grid-cols-2">
        <button
          v-for="strategy in strategies"
          :key="strategy.name"
          class="flex flex-col items-start rounded-xl bg-slate-900/50 p-4 text-left transition-all hover:bg-slate-700/50"
          @click="applyStrategy(strategy)"
        >
          <span class="font-semibold text-purple-400">{{ strategy.name }}</span>
          <span class="text-sm text-slate-400">{{ strategy.description }}</span>
          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="alloc in strategy.allocation.slice(0, 4)"
              :key="alloc.symbol"
              class="rounded bg-slate-700 px-2 py-1 text-xs"
            >
              {{ alloc.symbol }} {{ alloc.percentage }}%
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Custom Target Allocation -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">🎨 Custom Target Allocation</h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-400">Total:</span>
          <span
            class="font-semibold"
            :class="totalAllocation === 100 ? 'text-green-400' : 'text-red-400'"
          >
            {{ totalAllocation.toFixed(1) }}%
          </span>
        </div>
      </div>

      <div class="mb-4 space-y-2">
        <div
          v-for="(target, index) in customTargets"
          :key="index"
          class="flex items-center gap-2"
        >
          <input
            v-model="target.symbol"
            type="text"
            placeholder="Symbol"
            class="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
          />
          <input
            v-model="target.percentage"
            type="number"
            placeholder="%"
            min="0"
            max="100"
            class="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
          />
          <span class="text-slate-400">%</span>
          <button
            class="rounded-lg bg-red-500/20 px-3 py-2 text-red-400 hover:bg-red-500/30"
            @click="removeTarget(index)"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          class="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700"
          @click="addTarget"
        >
          + Add Token
        </button>
        <button
          class="rounded-lg from-blue-500 to-purple-500 bg-gradient-to-r px-6 py-2 font-semibold text-white disabled:opacity-50"
          :disabled="loading || totalAllocation !== 100"
          @click="generatePlan"
        >
          {{ loading ? 'Generating...' : 'Generate Rebalance Plan' }}
        </button>
      </div>
    </div>

    <!-- Rebalance Plan Results -->
    <div v-if="rebalancePlan" class="space-y-6">
      <!-- Summary -->
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Total Value</p>
          <p class="text-xl font-bold text-white">{{ formatCurrency(rebalancePlan.totalValue) }}</p>
        </div>
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Est. Gas Cost</p>
          <p class="text-xl font-bold text-yellow-400">{{ formatCurrency(rebalancePlan.estimatedGasCost) }}</p>
        </div>
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Rebalance Ratio</p>
          <p class="text-xl font-bold text-purple-400">{{ rebalancePlan.rebalanceRatio.toFixed(1) }}%</p>
        </div>
      </div>

      <!-- Allocation Comparison -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">📊 Allocation Comparison</h3>
        
        <div class="space-y-4">
          <div
            v-for="(item, index) in currentAllocationData"
            :key="item.symbol"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-white">{{ item.symbol }}</span>
              <span class="text-slate-400">
                {{ item.percentage.toFixed(1) }}% → 
                {{ rebalancePlan.targetAllocation.find(t => t.symbol === item.symbol)?.percentage || 0 }}%
              </span>
            </div>
            <div class="relative h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                class="absolute left-0 top-0 h-full rounded-full"
                :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Suggested Trades -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">🔄 Suggested Trades</h3>
        
        <div v-if="rebalancePlan.trades.length === 0" class="py-8 text-center text-slate-400">
          ✓ Portfolio is already balanced!
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="(trade, index) in rebalancePlan.trades"
            :key="index"
            class="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/50 p-4"
          >
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="rounded bg-red-500/20 px-3 py-1 text-red-400">{{ trade.fromToken }}</span>
                <span class="text-slate-400">→</span>
                <span class="rounded bg-green-500/20 px-3 py-1 text-green-400">{{ trade.toToken }}</span>
              </div>
              <div class="text-sm text-slate-400">
                {{ trade.fromAmount.toFixed(4) }} → {{ trade.toAmount.toFixed(4) }}
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-white">{{ formatCurrency(trade.estimatedValue) }}</p>
              <p class="text-xs text-slate-400">{{ trade.reason }}</p>
            </div>
          </div>
        </div>

        <button
          class="mt-4 w-full rounded-lg from-green-500 to-emerald-500 bg-gradient-to-r py-3 font-semibold text-white transition-all hover:scale-[1.02]"
          @click="() => {}"
        >
          Execute Trades (Coming Soon)
        </button>
      </div>
    </div>
  </div>
</template>
