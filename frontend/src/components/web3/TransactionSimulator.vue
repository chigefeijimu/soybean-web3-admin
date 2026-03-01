<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { isConnected, account, chainId } = useWeb3();

// Form state
const fromAddress = ref('');
const toAddress = ref('');
const amount = ref('');
const selectedChain = ref(1);
const isLoading = ref(false);
const error = ref('');

// Simulation result
const simulationResult = ref<any>(null);
const mevProtection = ref<any>(null);

// Chains
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
];

// Set from connected wallet
const setFromWallet = () => {
  if (account.value) {
    fromAddress.value = account.value;
  }
};

// Simulate transaction
const simulateTransaction = async () => {
  if (!fromAddress.value || !toAddress.value) {
    error.value = 'Please enter from and to addresses';
    return;
  }

  error.value = '';
  isLoading.value = true;

  try {
    const valueWei = amount.value 
      ? (Number(amount.value) * 1e18).toString() 
      : '0';

    const response = await fetch('/api/web3/simulator/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress.value,
        to: toAddress.value,
        value: valueWei,
        chainId: selectedChain.value,
        data: '0x',
      }),
    });

    if (!response.ok) throw new Error('Simulation failed');
    
    const data = await response.json();
    simulationResult.value = data.simulation;

    // Get MEV protection info
    const mevResponse = await fetch(`/api/web3/simulator/mev-protection?chainId=${selectedChain.value}`);
    const mevData = await mevResponse.json();
    mevProtection.value = mevData;
  } catch (e: any) {
    error.value = e.message || 'Failed to simulate transaction';
    // Use mock data for demo
    simulationResult.value = {
      gasLimit: 21000,
      gasUsed: 21000,
      gasPrice: 25,
      totalCost: '0.000525 ETH',
      ethValue: amount.value || '0',
      chainId: selectedChain.value,
      average: 25,
      fast: 40,
      slow: 15,
      variance: 50,
      unit: 'Gwei',
      status: 'success',
      executed: false,
      warnings: ['This is a demo simulation'],
      mevExposure: {
        risk: 'low',
        reason: 'Standard transfer has minimal MEV exposure',
        suggestions: [],
      },
    };
  } finally {
    isLoading.value = false;
  }
};

// Clear results
const clearResults = () => {
  simulationResult.value = null;
  mevProtection.value = null;
  error.value = '';
};

// Format address
const formatAddress = (addr: string) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

// Convert wei to ETH
const weiToEth = (wei: string) => {
  return (Number(wei) / 1e18).toFixed(6);
};
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <div class="mb-6 flex items-center gap-3">
      <span class="text-2xl">🔮</span>
      <h2 class="text-xl font-semibold">Transaction Simulator</h2>
    </div>

    <!-- Input Form -->
    <div class="space-y-4">
      <!-- From Address -->
      <div>
        <label class="mb-1 block text-sm text-slate-400">From Address</label>
        <div class="flex gap-2">
          <input
            v-model="fromAddress"
            type="text"
            placeholder="0x..."
            class="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <button
            v-if="isConnected"
            class="rounded-lg bg-purple-500/20 px-4 py-2 text-sm text-purple-400 hover:bg-purple-500/30"
            @click="setFromWallet"
          >
            Use Wallet
          </button>
        </div>
      </div>

      <!-- To Address -->
      <div>
        <label class="mb-1 block text-sm text-slate-400">To Address</label>
        <input
          v-model="toAddress"
          type="text"
          placeholder="0x... or ENS name"
          class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>

      <!-- Amount -->
      <div>
        <label class="mb-1 block text-sm text-slate-400">Amount (Optional)</label>
        <input
          v-model="amount"
          type="number"
          placeholder="0.0"
          step="0.001"
          class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>

      <!-- Chain Selection -->
      <div>
        <label class="mb-1 block text-sm text-slate-400">Network</label>
        <select
          v-model="selectedChain"
          class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }} ({{ chain.symbol }})
          </option>
        </select>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="rounded-lg bg-red-500/20 p-3 text-sm text-red-400">
        {{ error }}
      </div>

      <!-- Simulate Button -->
      <button
        class="w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-3 font-semibold transition-all hover:opacity-90"
        :disabled="isLoading"
        @click="simulateTransaction"
      >
        <span v-if="isLoading" class="flex items-center justify-center gap-2">
          <span class="animate-spin">⏳</span> Simulating...
        </span>
        <span v-else>🔮 Simulate Transaction</span>
      </button>
    </div>

    <!-- Simulation Results -->
    <div v-if="simulationResult" class="mt-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Simulation Results</h3>
        <button
          class="text-sm text-slate-400 hover:text-white"
          @click="clearResults"
        >
          Clear
        </button>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-2">
        <span
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="simulationResult.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
        >
          {{ simulationResult.status === 'success' ? '✅ Success' : '❌ Failed' }}
        </span>
        <span class="text-xs text-slate-400">
          {{ simulationResult.executed ? 'Executed' : 'Not Executed (Simulation)' }}
        </span>
      </div>

      <!-- Gas Estimation -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg bg-slate-900/50 p-3">
          <p class="text-xs text-slate-400">Gas Limit</p>
          <p class="font-semibold">{{ simulationResult.gasLimit.toLocaleString() }}</p>
        </div>
        <div class="rounded-lg bg-slate-900/50 p-3">
          <p class="text-xs text-slate-400">Gas Used (Est.)</p>
          <p class="font-semibold">{{ simulationResult.gasUsed?.toLocaleString() || 'N/A' }}</p>
        </div>
        <div class="rounded-lg bg-slate-900/50 p-3">
          <p class="text-xs text-slate-400">Gas Price</p>
          <p class="font-semibold">{{ simulationResult.gasPrice || simulationResult.average }} Gwei</p>
        </div>
        <div class="rounded-lg bg-slate-900/50 p-3">
          <p class="text-xs text-slate-400">Total Cost</p>
          <p class="font-semibold text-yellow-400">{{ simulationResult.totalCost }}</p>
        </div>
      </div>

      <!-- Gas Speeds -->
      <div class="rounded-lg bg-slate-900/50 p-4">
        <p class="mb-2 text-sm text-slate-400">Gas Speed Options</p>
        <div class="flex gap-4">
          <div class="text-center">
            <p class="text-xs text-slate-400">Slow</p>
            <p class="font-semibold text-green-400">{{ simulationResult.slow }} Gwei</p>
            <p class="text-xs text-slate-500">&gt;5min</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-400">Normal</p>
            <p class="font-semibold text-blue-400">{{ simulationResult.average }} Gwei</p>
            <p class="text-xs text-slate-500">&lt;1min</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-400">Fast</p>
            <p class="font-semibold text-red-400">{{ simulationResult.fast }} Gwei</p>
            <p class="text-xs text-slate-500">&lt;15s</p>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="simulationResult.warnings?.length" class="rounded-lg bg-yellow-500/20 p-3">
        <p class="mb-1 text-sm font-semibold text-yellow-400">⚠️ Warnings</p>
        <ul class="list-disc pl-4 text-xs text-yellow-300">
          <li v-for="(warn, i) in simulationResult.warnings" :key="i">{{ warn }}</li>
        </ul>
      </div>

      <!-- MEV Exposure -->
      <div v-if="simulationResult.mevExposure" class="rounded-lg bg-slate-900/50 p-4">
        <p class="mb-2 text-sm text-slate-400">MEV Exposure</p>
        <div class="flex items-center justify-between">
          <div>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-green-500/20 text-green-400': simulationResult.mevExposure.risk === 'low',
                'bg-yellow-500/20 text-yellow-400': simulationResult.mevExposure.risk === 'medium',
                'bg-red-500/20 text-red-400': simulationResult.mevExposure.risk === 'high',
              }"
            >
              {{ simulationResult.mevExposure.risk.toUpperCase() }}
            </span>
          </div>
          <p class="text-xs text-slate-400">{{ simulationResult.mevExposure.reason }}</p>
        </div>
        <div v-if="simulationResult.mevExposure.suggestions?.length" class="mt-2">
          <p class="text-xs text-slate-400">Suggestions:</p>
          <ul class="list-disc pl-4 text-xs text-purple-400">
            <li v-for="(s, i) in simulationResult.mevExposure.suggestions" :key="i">{{ s }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- MEV Protection Recommendations -->
    <div v-if="mevProtection" class="mt-4 rounded-lg bg-purple-500/20 p-4">
      <p class="mb-2 text-sm font-semibold text-purple-400">🛡️ MEV Protection</p>
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-400">Private Transaction:</span>
          <span :class="mevProtection.recommendations?.usePrivateTx === 'recommended' ? 'text-yellow-400' : 'text-green-400'">
            {{ mevProtection.recommendations?.usePrivateTx }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Sandwich Risk:</span>
          <span
            :class="{
              'text-green-400': mevProtection.sandwichRisk === 'low',
              'text-yellow-400': mevProtection.sandwichRisk === 'medium',
              'text-red-400': mevProtection.sandwichRisk === 'high',
            }"
          >
            {{ mevProtection.sandwichRisk }}
          </span>
        </div>
      </div>
    </div>

    <!-- Demo Notice -->
    <div class="mt-4 rounded-lg bg-slate-700/30 p-3 text-xs text-slate-400">
      💡 <strong>Tip:</strong> This simulator estimates transaction costs before execution. Always verify with your wallet before signing.
    </div>
  </div>
</template>
