<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

// Types
interface DefiPosition {
  protocol: string;
  symbol: string;
  tokenAddress: string;
  balance: number;
  valueUsd: number;
  apy: number;
  poolAddress?: string;
  chainId: number;
}

interface DefiPortfolio {
  walletAddress: string;
  totalValueUsd: number;
  totalApy: number;
  change24h: number;
  positions: DefiPosition[];
  protocolBreakdown: Record<string, number>;
}

interface Protocol {
  name: string;
  tvl: string;
  apy: string;
}

const { account, isConnected } = useWeb3();

// State
const walletAddress = ref('');
const loading = ref(false);
const error = ref('');
const portfolio = ref<DefiPortfolio | null>(null);
const protocols = ref<Protocol[]>([]);
const selectedChain = ref(1);

// Supported chains
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
];

// Computed
const formattedTotalValue = computed(() => {
  if (!portfolio.value) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(portfolio.value.totalValueUsd);
});

const dailyEarnings = computed(() => {
  if (!portfolio.value) return '$0.00';
  const daily = (portfolio.value.totalValueUsd * portfolio.value.totalApy) / 36500;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(daily);
});

const protocolDistribution = computed(() => {
  if (!portfolio.value?.protocolBreakdown) return [];
  const total = Object.values(portfolio.value.protocolBreakdown).reduce((a, b) => a + b, 0);
  return Object.entries(portfolio.value.protocolBreakdown).map(([name, value]) => ({
    name,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));
});

// Methods
const fetchPortfolio = async () => {
  if (!walletAddress.value) {
    error.value = 'Please enter a wallet address';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // Try to fetch from backend API
    const response = await fetch(
      `/api/web3/defi-portfolio/portfolio?walletAddress=${walletAddress.value}&chainId=${selectedChain.value}`
    );
    
    if (response.ok) {
      portfolio.value = await response.json();
    } else {
      // Fallback to mock data for demo
      generateMockData();
    }
  } catch (e) {
    // Fallback to mock data
    generateMockData();
  } finally {
    loading.value = false;
  }
};

const fetchProtocols = async () => {
  try {
    const response = await fetch('/api/web3/defi-portfolio/protocols');
    if (response.ok) {
      protocols.value = await response.json();
    }
  } catch (e) {
    // Use default protocols
    protocols.value = [
      { name: 'Uniswap', tvl: '$4.2B', apy: '3-15%' },
      { name: 'Aave', tvl: '$12B', apy: '2-8%' },
      { name: 'Compound', tvl: '$2.1B', apy: '2-5%' },
      { name: 'Curve', tvl: '$3.8B', apy: '2-10%' },
    ];
  }
};

const generateMockData = () => {
  const mockPositions: DefiPosition[] = [
    { protocol: 'aave', symbol: 'ETH', tokenAddress: '', balance: 2.5, valueUsd: 6250, apy: 3.5, chainId: selectedChain.value },
    { protocol: 'aave', symbol: 'USDC', tokenAddress: '', balance: 5000, valueUsd: 5000, apy: 4.8, chainId: selectedChain.value },
    { protocol: 'uniswap', symbol: 'ETH-USDC', tokenAddress: '', balance: 0.8, valueUsd: 4000, apy: 18.5, poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', chainId: selectedChain.value },
    { protocol: 'compound', symbol: 'USDT', tokenAddress: '', balance: 3000, valueUsd: 3000, apy: 3.2, chainId: selectedChain.value },
    { protocol: 'curve', symbol: '3Pool', tokenAddress: '', balance: 2000, valueUsd: 2000, apy: 4.5, chainId: selectedChain.value },
  ];

  const totalValue = mockPositions.reduce((sum, p) => sum + p.valueUsd, 0);
  const weightedApy = mockPositions.reduce((sum, p) => sum + p.apy * p.valueUsd, 0) / totalValue;

  const breakdown: Record<string, number> = {};
  mockPositions.forEach(p => {
    if (!breakdown[p.protocol]) breakdown[p.protocol] = 0;
    breakdown[p.protocol] += p.valueUsd;
  });

  portfolio.value = {
    walletAddress: walletAddress.value,
    totalValueUsd: totalValue,
    totalApy: weightedApy,
    change24h: (Math.random() - 0.5) * 6,
    positions: mockPositions,
    protocolBreakdown: breakdown,
  };
};

const useConnectedWallet = () => {
  if (isConnected.value && account.value) {
    walletAddress.value = account.value;
    fetchPortfolio();
  }
};

const getProtocolLogo = (protocol: string) => {
  const logos: Record<string, string> = {
    aave: '👻',
    uniswap: '🦄',
    compound: '🔷',
    curve: '💚',
    sushiswap: '🍣',
  };
  return logos[protocol.toLowerCase()] || '📊';
};

const getProtocolColor = (protocol: string) => {
  const colors: Record<string, string> = {
    aave: 'from-blue-500 to-cyan-500',
    uniswap: 'from-purple-500 to-pink-500',
    compound: 'from-yellow-500 to-orange-500',
    curve: 'from-green-500 to-emerald-500',
    sushiswap: 'from-red-500 to-orange-500',
  };
  return colors[protocol.toLowerCase()] || 'from-gray-500 to-gray-600';
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Lifecycle
onMounted(() => {
  fetchProtocols();
  if (isConnected.value && account.value) {
    walletAddress.value = account.value;
    fetchPortfolio();
  }
});

watch(() => account.value, (newAccount) => {
  if (newAccount) {
    walletAddress.value = newAccount;
    fetchPortfolio();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Search Header -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h2 class="mb-4 text-xl font-semibold">DeFi Portfolio Tracker</h2>
      
      <div class="flex flex-col gap-4 lg:flex-row">
        <input
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address (0x...)"
          class="flex-1 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          @keyup.enter="fetchPortfolio"
        />
        
        <select
          v-model="selectedChain"
          class="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
        
        <button
          :disabled="loading"
          class="rounded-xl from-purple-500 to-blue-500 bg-gradient-to-r px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
          @click="fetchPortfolio"
        >
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
        
        <button
          v-if="isConnected && account"
          class="rounded-xl bg-green-500/20 px-6 py-3 font-semibold text-green-400 transition-all hover:bg-green-500/30"
          @click="useConnectedWallet"
        >
          Use Connected
        </button>
      </div>
      
      <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
    </div>

    <!-- Portfolio Overview -->
    <div v-if="portfolio" class="grid gap-6 lg:grid-cols-3">
      <!-- Total Value Card -->
      <div class="border border-slate-700/50 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 backdrop-blur-xl lg:col-span-2">
        <p class="text-sm text-slate-400">Total DeFi Value</p>
        <p class="mt-1 text-4xl font-bold">{{ formattedTotalValue }}</p>
        
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
              APY: {{ portfolio.totalApy.toFixed(1) }}%
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="rounded-full px-3 py-1 text-sm"
              :class="portfolio.change24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
            >
              {{ portfolio.change24h >= 0 ? '+' : '' }}{{ portfolio.change24h.toFixed(2) }}% (24h)
            </span>
          </div>
        </div>
        
        <div class="mt-4 border-t border-slate-700/50 pt-4">
          <p class="text-sm text-slate-400">Estimated Daily Earnings</p>
          <p class="text-xl font-semibold text-green-400">{{ dailyEarnings }}</p>
        </div>
      </div>

      <!-- Protocol Distribution -->
      <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
        <h3 class="mb-4 text-lg font-semibold">Protocol Distribution</h3>
        <div class="space-y-3">
          <div v-for="item in protocolDistribution" :key="item.name" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <span>{{ getProtocolLogo(item.name) }}</span>
                <span class="capitalize">{{ item.name }}</span>
              </span>
              <span class="text-slate-400">${{ formatNumber(item.value) }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                class="h-full rounded-full bg-gradient-to-r"
                :class="getProtocolColor(item.name)"
                :style="{ width: `${item.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Positions List -->
    <div v-if="portfolio" class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-4 text-lg font-semibold">DeFi Positions ({{ portfolio.positions.length }})</h3>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-700 text-left text-sm text-slate-400">
              <th class="pb-3 font-medium">Protocol</th>
              <th class="pb-3 font-medium">Asset</th>
              <th class="pb-3 font-medium text-right">Balance</th>
              <th class="pb-3 font-medium text-right">Value</th>
              <th class="pb-3 font-medium text-right">APY</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(position, index) in portfolio.positions"
              :key="index"
              class="border-b border-slate-700/50 transition-colors hover:bg-slate-700/30"
            >
              <td class="py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-lg"
                    :class="getProtocolColor(position.protocol)"
                  >
                    {{ getProtocolLogo(position.protocol) }}
                  </div>
                  <span class="capitalize font-medium">{{ position.protocol }}</span>
                </div>
              </td>
              <td class="py-4">
                <span class="font-medium">{{ position.symbol }}</span>
              </td>
              <td class="py-4 text-right">
                {{ formatNumber(position.balance) }}
              </td>
              <td class="py-4 text-right font-medium">
                ${{ formatNumber(position.valueUsd) }}
              </td>
              <td class="py-4 text-right">
                <span class="rounded-full bg-green-500/20 px-2 py-1 text-sm text-green-400">
                  {{ position.apy.toFixed(1) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Protocols Overview -->
    <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
      <h3 class="mb-4 text-lg font-semibold">🔥 Top DeFi Protocols</h3>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          v-for="protocol in protocols"
          :key="protocol.name"
          class="rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-700/50"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ protocol.name === 'Uniswap' ? '🦄' : protocol.name === 'Aave' ? '👻' : protocol.name === 'Compound' ? '🔷' : '💚' }}</span>
            <div>
              <p class="font-medium">{{ protocol.name }}</p>
              <p class="text-xs text-slate-400">TVL: {{ protocol.tvl }}</p>
            </div>
          </div>
          <p class="mt-2 text-sm text-green-400">APY: {{ protocol.apy }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!portfolio && !loading"
      class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl"
    >
      <div class="mb-4 text-6xl">📊</div>
      <p class="text-slate-400">Enter a wallet address to track their DeFi portfolio</p>
    </div>
  </div>
</template>
