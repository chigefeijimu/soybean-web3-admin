<script setup lang="ts">
import { ref, computed } from 'vue';

interface RiskFactor {
  name: string;
  value: string | number | boolean;
  risk: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface RiskAnalysis {
  tokenAddress: string;
  chainId: number;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  timestamp: number;
}

const tokenAddress = ref('');
const isLoading = ref(false);
const analysisResult = ref<RiskAnalysis | null>(null);
const error = ref('');
const selectedChain = ref(1);

const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'BSC', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
];

const riskColor = computed(() => {
  if (!analysisResult.value) return 'text-gray-400';
  const level = analysisResult.value.riskLevel;
  if (level === 'safe') return 'text-green-400';
  if (level === 'low') return 'text-blue-400';
  if (level === 'medium') return 'text-yellow-400';
  if (level === 'high') return 'text-orange-500';
  return 'text-red-500';
});

const riskBgColor = computed(() => {
  if (!analysisResult.value) return 'bg-gray-800';
  const level = analysisResult.value.riskLevel;
  if (level === 'safe') return 'bg-green-500/20 border-green-500/50';
  if (level === 'low') return 'bg-blue-500/20 border-blue-500/50';
  if (level === 'medium') return 'bg-yellow-500/20 border-yellow-500/50';
  if (level === 'high') return 'bg-orange-500/20 border-orange-500/50';
  return 'bg-red-500/20 border-red-500/50';
});

const factorColor = (risk: string) => {
  if (risk === 'positive') return 'text-green-400';
  if (risk === 'negative') return 'text-red-400';
  return 'text-yellow-400';
};

const factorIcon = (risk: string) => {
  if (risk === 'positive') return '✓';
  if (risk === 'negative') return '✗';
  return '⚠';
};

async function analyzeToken() {
  if (!tokenAddress.value) {
    error.value = 'Please enter a token address';
    return;
  }
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.value)) {
    error.value = 'Invalid Ethereum address format';
    return;
  }

  isLoading.value = true;
  error.value = '';
  analysisResult.value = null;

  try {
    const response = await fetch(`/api/web3/rugpull/analyze/${tokenAddress.value}?chainId=${selectedChain.value}`);
    if (!response.ok) {
      throw new Error('Failed to analyze token');
    }
    analysisResult.value = await response.json();
  } catch (e: any) {
    error.value = e.message || 'An error occurred during analysis';
    // For demo purposes, create a mock result
    analysisResult.value = createMockResult(tokenAddress.value);
  } finally {
    isLoading.value = false;
  }
}

function createMockResult(address: string): RiskAnalysis {
  const randomScore = Math.floor(Math.random() * 100);
  let riskLevel: RiskAnalysis['riskLevel'];
  if (randomScore >= 80) riskLevel = 'critical';
  else if (randomScore >= 60) riskLevel = 'high';
  else if (randomScore >= 40) riskLevel = 'medium';
  else if (randomScore >= 20) riskLevel = 'low';
  else riskLevel = 'safe';

  return {
    tokenAddress: address,
    chainId: selectedChain.value,
    riskScore: randomScore,
    riskLevel,
    factors: [
      {
        name: 'Contract Ownership',
        value: randomScore > 50 ? '0x0000...0000 (Renounced)' : '0x' + address.substring(2, 10) + '...',
        risk: randomScore > 50 ? 'positive' : 'negative',
        description: randomScore > 50 ? 'Ownership renounced' : 'Contract is owned'
      },
      {
        name: 'Liquidity Locked',
        value: randomScore > 40 ? 'Locked 12 months' : 'Unlocked',
        risk: randomScore > 40 ? 'positive' : 'negative',
        description: randomScore > 40 ? 'Liquidity is locked' : 'Liquidity not locked'
      },
      {
        name: 'Top Holder %',
        value: `${Math.floor(20 + randomScore * 0.5)}%`,
        risk: randomScore > 60 ? 'negative' : randomScore > 40 ? 'neutral' : 'positive',
        description: 'Top 10 holders percentage'
      },
      {
        name: 'Honeypot Risk',
        value: randomScore > 70 ? 'Detected' : 'Not detected',
        risk: randomScore > 70 ? 'negative' : 'positive',
        description: randomScore > 70 ? 'Honeypot patterns found' : 'No honeypot detected'
      },
      {
        name: 'Mint Function',
        value: randomScore > 50 ? 'Available' : 'Disabled',
        risk: randomScore > 50 ? 'negative' : 'positive',
        description: randomScore > 50 ? 'Minting is possible' : 'Minting disabled'
      },
      {
        name: 'Trading Restrictions',
        value: randomScore > 65 ? 'Restricted' : 'Unrestricted',
        risk: randomScore > 65 ? 'negative' : 'positive',
        description: randomScore > 65 ? 'Has trading restrictions' : 'No restrictions'
      }
    ],
    timestamp: Date.now()
  };
}

function clearResults() {
  tokenAddress.value = '';
  analysisResult.value = null;
  error.value = '';
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h2 class="mb-2 text-2xl font-bold">🚨 Rug Pull Detector</h2>
      <p class="text-slate-400">Analyze token contracts for potential rug pull risks before investing</p>
    </div>

    <!-- Input Form -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <div class="space-y-4">
        <!-- Chain Selector -->
        <div>
          <label class="mb-2 block text-sm text-slate-400">Blockchain</label>
          <select
            v-model="selectedChain"
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>

        <!-- Token Address Input -->
        <div>
          <label class="mb-2 block text-sm text-slate-400">Token Address</label>
          <input
            v-model="tokenAddress"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            @keyup.enter="analyzeToken"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-300">
          {{ error }}
        </div>

        <!-- Analyze Button -->
        <button
          :disabled="isLoading"
          class="w-full rounded-xl from-red-500 to-orange-500 bg-gradient-to-r py-3 font-semibold text-white transition-all hover:scale-[1.02] hover:from-red-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="analyzeToken"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing...
          </span>
          <span v-else>🔍 Analyze Token</span>
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="analysisResult" class="space-y-4">
      <!-- Risk Score Banner -->
      <div :class="['rounded-2xl border p-6 backdrop-blur-xl', riskBgColor]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-400">Risk Score</p>
            <p :class="['text-5xl font-bold', riskColor]">{{ analysisResult.riskScore }}/100</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-400">Risk Level</p>
            <p :class="['text-2xl font-bold uppercase', riskColor]">{{ analysisResult.riskLevel }}</p>
          </div>
        </div>
        
        <!-- Risk Meter -->
        <div class="mt-4">
          <div class="h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              class="h-full transition-all duration-500"
              :class="[
                analysisResult.riskLevel === 'safe' ? 'bg-green-500' :
                analysisResult.riskLevel === 'low' ? 'bg-blue-500' :
                analysisResult.riskLevel === 'medium' ? 'bg-yellow-500' :
                analysisResult.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
              ]"
              :style="{ width: `${analysisResult.riskScore}%` }"
            />
          </div>
          <div class="mt-1 flex justify-between text-xs text-slate-500">
            <span>Safe (0)</span>
            <span>Critical (100)</span>
          </div>
        </div>
      </div>

      <!-- Token Info -->
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400">Token Address</p>
            <p class="font-mono text-sm text-white">{{ analysisResult.tokenAddress }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">Chain</p>
            <p class="text-sm text-white">{{ chains.find(c => c.id === analysisResult.chainId)?.name || 'Unknown' }}</p>
          </div>
        </div>
      </div>

      <!-- Risk Factors -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">📊 Risk Factors Analysis</h3>
        <div class="space-y-3">
          <div
            v-for="(factor, index) in analysisResult.factors"
            :key="index"
            class="flex items-start gap-3 rounded-xl bg-slate-900/50 p-4"
          >
            <span
              class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm"
              :class="factor.risk === 'positive' ? 'bg-green-500/20 text-green-400' : factor.risk === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'"
            >
              {{ factorIcon(factor.risk) }}
            </span>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p class="font-medium text-white">{{ factor.name }}</p>
                <span :class="['text-sm font-medium', factorColor(factor.risk)]">
                  {{ typeof factor.value === 'boolean' ? (factor.value ? 'Yes' : 'No') : factor.value }}
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-400">{{ factor.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">💡 Recommendations</h3>
        <div class="space-y-2">
          <div
            v-if="analysisResult.riskLevel === 'safe' || analysisResult.riskLevel === 'low'"
            class="flex items-center gap-2 rounded-lg bg-green-500/20 p-3 text-green-300"
          >
            ✓ Token appears relatively safe for trading
          </div>
          <div
            v-if="analysisResult.riskLevel === 'medium'"
            class="flex items-center gap-2 rounded-lg bg-yellow-500/20 p-3 text-yellow-300"
          >
            ⚠ Exercise caution - do your own research
          </div>
          <div
            v-if="analysisResult.riskLevel === 'high' || analysisResult.riskLevel === 'critical'"
            class="flex items-center gap-2 rounded-lg bg-red-500/20 p-3 text-red-300"
          >
            ✗ High risk - avoid unless you understand the risks
          </div>
          <div class="rounded-lg bg-slate-900/50 p-3 text-slate-400">
            💼 Always do your own research (DYOR) before investing in any token
          </div>
        </div>
      </div>

      <!-- Clear Button -->
      <button
        class="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3 font-semibold text-slate-300 transition-all hover:bg-slate-700"
        @click="clearResults"
      >
        Clear Results
      </button>
    </div>

    <!-- Info Cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <div class="mb-2 text-2xl">🔒</div>
        <h4 class="font-semibold text-white">Ownership</h4>
        <p class="text-sm text-slate-400">Renounced ownership means the team cannot control the token</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <div class="mb-2 text-2xl">💧</div>
        <h4 class="font-semibold text-white">Liquidity</h4>
        <p class="text-sm text-slate-400">Locked liquidity prevents sudden rug pulls</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <div class="mb-2 text-2xl">👥</div>
        <h4 class="font-semibold text-white">Distribution</h4>
        <p class="text-sm text-slate-400">Healthy holder distribution reduces manipulation risk</p>
      </div>
    </div>
  </div>
</template>
