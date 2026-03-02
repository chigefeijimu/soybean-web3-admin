<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  estimateDefiGas, 
  getSupportedDefiOperations, 
  getSupportedDefiChains,
  compareDefiGasChains,
  type DefiGasEstimate,
  type SupportedOperation,
  type SupportedChain 
} from '@/service/api/web3';

const isLoading = ref(false);
const error = ref('');
const estimateResult = ref<DefiGasEstimate | null>(null);
const compareResults = ref<DefiGasEstimate[]>([]);
const showCompare = ref(false);

// Form data
const selectedOperation = ref('swap');
const selectedProtocol = ref('uniswap-v3');
const selectedChain = ref(1);
const selectedSpeed = ref<'slow' | 'normal' | 'fast'>('normal');

const operations = ref<SupportedOperation[]>([]);
const chains = ref<SupportedChain[]>([]);

const protocols = [
  { value: 'uniswap-v3', label: 'Uniswap V3' },
  { value: 'uniswap-v2', label: 'Uniswap V2' },
  { value: 'sushiswap', label: 'SushiSwap' },
  { value: 'curve', label: 'Curve' },
  { value: 'aave', label: 'Aave' },
  { value: 'compound', label: 'Compound' },
  { value: 'lido', label: 'Lido' },
  { value: 'rocketpool', label: 'Rocket Pool' },
  { value: 'erc20', label: 'ERC20' },
  { value: 'governance', label: 'Governance' },
];

const speeds = [
  { value: 'slow', label: 'Slow 🐢', desc: 'Lower cost, longer wait' },
  { value: 'normal', label: 'Normal 🚶', desc: 'Balanced cost and speed' },
  { value: 'fast', label: 'Fast 🚀', desc: 'Higher cost, faster confirmation' },
];

const compareChains = ref<number[]>([1, 137, 42161]);

// Get protocols based on selected operation
const availableProtocols = computed(() => {
  const op = operations.value.find(o => o.type === selectedOperation.value);
  if (!op) return protocols;
  return protocols.filter(p => op.protocols.includes(p.value));
});

// Load supported operations and chains
onMounted(async () => {
  try {
    const [ops, chs] = await Promise.all([
      getSupportedDefiOperations(),
      getSupportedDefiChains()
    ]);
    operations.value = ops;
    chains.value = chs;
  } catch (e: any) {
    // Use defaults if API fails
    operations.value = [
      { type: 'swap', description: 'Token swap', protocols: ['uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve'] },
      { type: 'add_liquidity', description: 'Add liquidity', protocols: ['uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve'] },
      { type: 'borrow', description: 'Borrow assets', protocols: ['aave', 'compound'] },
      { type: 'stake', description: 'Stake assets', protocols: ['lido', 'rocketpool'] },
      { type: 'transfer', description: 'Transfer tokens', protocols: ['erc20'] },
      { type: 'approve', description: 'Approve token', protocols: ['erc20'] },
    ];
    chains.value = [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
      { id: 56, name: 'BNB Chain', symbol: 'BNB' },
      { id: 8453, name: 'Base', symbol: 'ETH' },
      { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    ];
  }
});

const estimate = async () => {
  isLoading.value = true;
  error.value = '';
  estimateResult.value = null;
  showCompare.value = false;

  try {
    estimateResult.value = await estimateDefiGas(
      selectedOperation.value,
      selectedProtocol.value,
      selectedChain.value,
      selectedSpeed.value
    );
  } catch (e: any) {
    error.value = e.message || 'Failed to estimate gas';
  } finally {
    isLoading.value = false;
  }
};

const compareAcrossChains = async () => {
  isLoading.value = true;
  error.value = '';
  compareResults.value = [];
  showCompare.value = true;

  try {
    compareResults.value = await compareDefiGasChains(
      compareChains.value,
      selectedOperation.value,
      selectedProtocol.value,
      selectedSpeed.value
    );
  } catch (e: any) {
    error.value = e.message || 'Failed to compare chains';
  } finally {
    isLoading.value = false;
  }
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getConfidenceLabel = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'High confidence';
    case 'medium': return 'Medium confidence';
    case 'low': return 'Low confidence';
    default: return 'Unknown';
  }
};

const formatUsd = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-slate-700/50 pb-4">
      <h2 class="text-2xl font-bold text-white flex items-center gap-3">
        <span class="text-3xl">⛽</span>
        DeFi Gas Estimator
      </h2>
      <p class="text-slate-400 mt-1">Estimate gas costs for DeFi operations across multiple chains</p>
    </div>

    <!-- Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Operation -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Operation</label>
        <select 
          v-model="selectedOperation"
          class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="op in operations" :key="op.type" :value="op.type">
            {{ op.description }}
          </option>
        </select>
      </div>

      <!-- Protocol -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Protocol</label>
        <select 
          v-model="selectedProtocol"
          class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="p in availableProtocols" :key="p.value" :value="p.value">
            {{ p.label }}
          </option>
        </select>
      </div>

      <!-- Chain -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Chain</label>
        <select 
          v-model="selectedChain"
          class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }} ({{ chain.symbol }})
          </option>
        </select>
      </div>

      <!-- Speed -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Speed</label>
        <select 
          v-model="selectedSpeed"
          class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="s in speeds" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-4">
      <button 
        @click="estimate"
        :disabled="isLoading"
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        <span v-if="isLoading" class="animate-spin">⟳</span>
        <span>{{ isLoading ? 'Estimating...' : 'Estimate Gas' }}</span>
      </button>

      <button 
        @click="compareAcrossChains"
        :disabled="isLoading"
        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        <span>🔄</span>
        <span>Compare Chains</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-400">
      {{ error }}
    </div>

    <!-- Result -->
    <div v-if="estimateResult && !showCompare" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-white">
            {{ estimateResult.operation.charAt(0).toUpperCase() + estimateResult.operation.slice(1).replace('_', ' ') }}
            on {{ estimateResult.protocol }}
          </h3>
          <p class="text-slate-400">{{ estimateResult.chain }} (Chain ID: {{ estimateResult.chainId }})</p>
        </div>
        <div :class="getConfidenceColor(estimateResult.confidence)" class="text-sm font-medium px-3 py-1 bg-slate-700/50 rounded-full">
          {{ getConfidenceLabel(estimateResult.confidence) }}
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-slate-700/30 rounded-lg p-4">
          <div class="text-slate-400 text-sm mb-1">Gas Limit</div>
          <div class="text-2xl font-bold text-white">{{ estimateResult.gasLimit.toLocaleString() }}</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-4">
          <div class="text-slate-400 text-sm mb-1">Gas Price</div>
          <div class="text-2xl font-bold text-white">{{ estimateResult.gasPrice }}</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-4">
          <div class="text-slate-400 text-sm mb-1">Estimated Fee</div>
          <div class="text-2xl font-bold text-green-400">{{ estimateResult.estimatedGasFee }}</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-4">
          <div class="text-slate-400 text-sm mb-1">USD Value</div>
          <div class="text-2xl font-bold text-green-400">{{ formatUsd(estimateResult.estimatedGasFeeUsd) }}</div>
        </div>
      </div>

      <!-- Tips -->
      <div class="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <h4 class="font-medium text-blue-400 mb-2">💡 Optimization Tips</h4>
        <ul class="space-y-1">
          <li v-for="tip in estimateResult.tips" :key="tip" class="text-slate-300 text-sm flex items-start gap-2">
            <span class="text-blue-400">•</span>
            {{ tip }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Compare Results -->
    <div v-if="showCompare && compareResults.length > 0" class="space-y-4">
      <h3 class="text-xl font-bold text-white">Cross-Chain Comparison</h3>
      <div class="grid gap-4">
        <div 
          v-for="(result, index) in compareResults" 
          :key="result.chainId"
          class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl"
          :class="{ 'border-green-500/50': index === 0 }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div v-if="index === 0" class="text-2xl">🏆</div>
              <div>
                <h4 class="font-bold text-white">{{ result.chain }}</h4>
                <p class="text-slate-400 text-sm">{{ result.protocol }} - {{ result.operation }}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-green-400">{{ formatUsd(result.estimatedGasFeeUsd) }}</div>
              <div class="text-slate-400 text-sm">{{ result.estimatedGasFee }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Reference -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/30 p-6">
      <h3 class="text-lg font-bold text-white mb-4">📊 Common Operations Quick Reference</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">ETH Transfer</div>
          <div class="text-white font-medium">~21,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">ERC20 Transfer</div>
          <div class="text-white font-medium">~35,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">Token Swap</div>
          <div class="text-white font-medium">~110,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">Add Liquidity</div>
          <div class="text-white font-medium">~220,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">Borrow (Aave)</div>
          <div class="text-white font-medium">~220,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">Stake (Lido)</div>
          <div class="text-white font-medium">~110,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">NFT Mint</div>
          <div class="text-white font-medium">~90,000 gas</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-3">
          <div class="text-slate-400">Governance Vote</div>
          <div class="text-white font-medium">~140,000 gas</div>
        </div>
      </div>
    </div>
  </div>
</template>
