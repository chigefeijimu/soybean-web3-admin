<script setup lang="ts">
import { ref } from 'vue';

interface ApprovalRisk {
  token: string;
  spender: string;
  allowance: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskReason: string;
}

interface DefiPosition {
  protocol: string;
  type: string;
  tvl: number;
  risk: string;
}

interface TokenHolding {
  symbol: string;
  balance: number;
  value: number;
  isScamRisk: boolean;
}

interface HealthScore {
  overall: number;
  breakdown: {
    approvals: number;
    scamExposure: number;
    defiRisk: number;
    activity: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface WalletHealth {
  address: string;
  chainId: number;
  timestamp: string;
  healthScore: HealthScore;
  approvalRisks: ApprovalRisk[];
  defiExposure: DefiPosition[];
  tokenHoldings: TokenHolding[];
  recommendations: string[];
}

// State
const address = ref('');
const isLoading = ref(false);
const healthData = ref<WalletHealth | null>(null);
const chainId = ref(1);

// Chain options
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ARB' },
  { id: 10, name: 'Optimism', symbol: 'OP' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB' },
];

// Risk color mapping
const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };
  return colors[level] || 'text-gray-400';
};

const getRiskBg = (level: string) => {
  const colors: Record<string, string> = {
    low: 'bg-green-400/20',
    medium: 'bg-yellow-400/20',
    high: 'bg-orange-400/20',
    critical: 'bg-red-400/20',
  };
  return colors[level] || 'bg-gray-400/20';
};

// Grade color
const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-yellow-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  };
  return colors[grade] || 'text-gray-400';
};

// Score progress color
const getScoreColor = (score: number) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

// Format address
const formatAddress = (addr: string) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// Analyze wallet
const analyzeWallet = async () => {
  if (!address.value) {
    alert('Please enter a wallet address');
    return;
  }

  // Basic address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address.value)) {
    alert('Invalid Ethereum address format');
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch(
      `/api/web3/health/analyze?address=${address.value}&chainId=${chainId.value}`
    );
    if (!response.ok) throw new Error('Failed to fetch');
    healthData.value = await response.json();
    alert('Wallet health analysis complete!');
  } catch (error) {
    console.error(error);
    alert('Failed to analyze wallet');
  } finally {
    isLoading.value = false;
  }
};

// Sample addresses for testing
const sampleAddresses = [
  { label: 'Vitalik', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' },
  { label: 'Aave', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
];

const loadSample = (addr: string) => {
  address.value = addr;
};
</script>

<template>
  <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl">
        🛡️
      </div>
      <div>
        <h2 class="text-xl font-semibold">Wallet Health Analyzer</h2>
        <p class="text-sm text-slate-400">Check your wallet for risks and security issues</p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row">
      <input
        v-model="address"
        type="text"
        placeholder="Enter wallet address (0x...)"
        class="flex-1 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        @keyup.enter="analyzeWallet"
      />
      <select
        v-model="chainId"
        class="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
      >
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.name }}
        </option>
      </select>
      <button
        :disabled="isLoading"
        class="rounded-xl from-green-500 to-emerald-600 bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
        @click="analyzeWallet"
      >
        {{ isLoading ? 'Analyzing...' : 'Analyze' }}
      </button>
    </div>

    <!-- Sample Addresses -->
    <div class="mb-6 flex flex-wrap gap-2">
      <span class="text-sm text-slate-400">Try:</span>
      <button
        v-for="sample in sampleAddresses"
        :key="sample.address"
        class="rounded-lg bg-slate-700/50 px-3 py-1 text-sm text-slate-300 transition-colors hover:bg-slate-700"
        @click="loadSample(sample.address)"
      >
        {{ sample.label }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="healthData" class="space-y-6">
      <!-- Overall Score -->
      <div class="flex items-center justify-between rounded-xl bg-slate-900/50 p-6">
        <div>
          <p class="text-sm text-slate-400">Overall Health Score</p>
          <div class="mt-2 flex items-baseline gap-3">
            <span class="text-5xl font-bold" :class="getGradeColor(healthData.healthScore.grade)">
              {{ healthData.healthScore.grade }}
            </span>
            <span class="text-2xl text-slate-500">/ A</span>
          </div>
        </div>
        <div class="text-right">
          <p class="text-4xl font-bold" :class="getGradeColor(healthData.healthScore.grade)">
            {{ healthData.healthScore.overall }}
          </p>
          <p class="text-sm text-slate-400">/ 100</p>
        </div>
      </div>

      <!-- Score Breakdown -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="mb-2 text-sm text-slate-400">Approvals</p>
          <div class="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${healthData.healthScore.breakdown.approvals}%`,
                backgroundColor: getScoreColor(healthData.healthScore.breakdown.approvals)
              }"
            />
          </div>
          <p class="mt-2 text-right text-sm" :class="getGradeColor(healthData.healthScore.breakdown.approvals >= 80 ? 'A' : healthData.healthScore.breakdown.approvals >= 60 ? 'C' : 'F')">
            {{ healthData.healthScore.breakdown.approvals }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="mb-2 text-sm text-slate-400">Scam Exposure</p>
          <div class="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${healthData.healthScore.breakdown.scamExposure}%`,
                backgroundColor: getScoreColor(healthData.healthScore.breakdown.scamExposure)
              }"
            />
          </div>
          <p class="mt-2 text-right text-sm" :class="getGradeColor(healthData.healthScore.breakdown.scamExposure >= 80 ? 'A' : healthData.healthScore.breakdown.scamExposure >= 60 ? 'C' : 'F')">
            {{ healthData.healthScore.breakdown.scamExposure }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="mb-2 text-sm text-slate-400">DeFi Risk</p>
          <div class="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${healthData.healthScore.breakdown.defiRisk}%`,
                backgroundColor: getScoreColor(healthData.healthScore.breakdown.defiRisk)
              }"
            />
          </div>
          <p class="mt-2 text-right text-sm" :class="getGradeColor(healthData.healthScore.breakdown.defiRisk >= 80 ? 'A' : healthData.healthScore.breakdown.defiRisk >= 60 ? 'C' : 'F')">
            {{ healthData.healthScore.breakdown.defiRisk }}
          </p>
        </div>
        <div class="rounded-xl bg-slate-900/50 p-4">
          <p class="mb-2 text-sm text-slate-400">Activity</p>
          <div class="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${healthData.healthScore.breakdown.activity}%`,
                backgroundColor: getScoreColor(healthData.healthScore.breakdown.activity)
              }"
            />
          </div>
          <p class="mt-2 text-right text-sm" :class="getGradeColor(healthData.healthScore.breakdown.activity >= 80 ? 'A' : healthData.healthScore.breakdown.activity >= 60 ? 'C' : 'F')">
            {{ healthData.healthScore.breakdown.activity }}
          </p>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="rounded-xl bg-slate-900/50 p-6">
        <h3 class="mb-4 text-lg font-semibold">💡 Recommendations</h3>
        <ul class="space-y-2">
          <li v-for="(rec, index) in healthData.recommendations" :key="index" class="flex items-start gap-2">
            <span class="mt-1 text-green-400">•</span>
            <span class="text-slate-300">{{ rec }}</span>
          </li>
        </ul>
      </div>

      <!-- Approval Risks -->
      <div class="rounded-xl bg-slate-900/50 p-6">
        <h3 class="mb-4 text-lg font-semibold">🔐 Token Approval Risks</h3>
        <div class="space-y-3">
          <div
            v-for="(approval, index) in healthData.approvalRisks"
            :key="index"
            class="flex items-center justify-between rounded-lg p-4"
            :class="getRiskBg(approval.riskLevel)"
          >
            <div>
              <p class="font-semibold">{{ approval.token }}</p>
              <p class="text-xs text-slate-400">Spender: {{ formatAddress(approval.spender) }}</p>
              <p class="mt-1 text-sm text-slate-400">{{ approval.riskReason }}</p>
            </div>
            <div class="text-right">
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold uppercase"
                :class="[getRiskColor(approval.riskLevel), getRiskBg(approval.riskLevel)]"
              >
                {{ approval.riskLevel }}
              </span>
              <p class="mt-1 text-xs text-slate-500">{{ approval.allowance }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- DeFi Exposure -->
      <div class="rounded-xl bg-slate-900/50 p-6">
        <h3 class="mb-4 text-lg font-semibold">🌊 DeFi Protocol Exposure</h3>
        <div class="grid gap-3 lg:grid-cols-3">
          <div
            v-for="(position, index) in healthData.defiExposure"
            :key="index"
            class="rounded-lg bg-slate-800/50 p-4"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-semibold">{{ position.protocol }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="position.risk === 'low' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'"
              >
                {{ position.risk }}
              </span>
            </div>
            <p class="text-sm text-slate-400">{{ position.type }}</p>
            <p class="mt-2 text-lg font-semibold text-green-400">${{ position.tvl.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- Token Holdings with Scam Check -->
      <div class="rounded-xl bg-slate-900/50 p-6">
        <h3 class="mb-4 text-lg font-semibold">🪙 Token Holdings</h3>
        <div class="space-y-2">
          <div
            v-for="(token, index) in healthData.tokenHoldings"
            :key="index"
            class="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
          >
            <div class="flex items-center gap-3">
              <span v-if="token.isScamRisk" class="text-red-400">⚠️</span>
              <span class="font-semibold">{{ token.symbol }}</span>
            </div>
            <div class="text-right">
              <p class="font-semibold">${{ token.value.toLocaleString() }}</p>
              <p class="text-xs text-slate-400">{{ token.balance }} tokens</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center">
      <div class="mb-4 text-6xl">🛡️</div>
      <p class="text-slate-400">Enter a wallet address to analyze its health</p>
    </div>
  </div>
</template>
