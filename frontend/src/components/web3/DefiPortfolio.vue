<script setup lang="ts">
import { ref } from 'vue';

// Types
interface Portfolio {
  totalValue: number;
  totalApy: number;
  positions: Position[];
}

interface Position {
  protocol: string;
  pool: string;
  value: number;
  apy: number;
  tokens: { symbol: string; amount: number; value: number }[];
}

// State
const portfolio = ref<Portfolio>({
  totalValue: 28400,
  totalApy: 7.2,
  positions: [
    {
      protocol: 'Uniswap V3',
      pool: 'ETH/USDC',
      value: 15000,
      apy: 12.5,
      tokens: [
        { symbol: 'ETH', amount: 4.0, value: 10000 },
        { symbol: 'USDC', amount: 5000, value: 5000 }
      ]
    },
    {
      protocol: 'Aave',
      pool: 'ETH',
      value: 8000,
      apy: 4.2,
      tokens: [{ symbol: 'aETH', amount: 3.2, value: 8000 }]
    },
    {
      protocol: 'Compound',
      pool: 'USDC',
      value: 5400,
      apy: 3.8,
      tokens: [{ symbol: 'cUSDC', amount: 5400, value: 5400 }]
    }
  ]
});

const protocols = [
  { name: 'Uniswap V3', logo: '🦄', tvl: '$4.2B', category: 'DEX' },
  { name: 'Aave', logo: '👻', tvl: '$12B', category: 'Lending' },
  { name: 'Compound', logo: '🔷', tvl: '$2.1B', category: 'Lending' },
  { name: 'Curve', logo: '💚', tvl: '$3.8B', category: 'Stablecoin' },
  { name: 'Lido', logo: '🌟', tvl: '$15B', category: 'Staking' }
];

const formatValue = (value: number) => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getProtocolColor = (protocol: string) => {
  const colors: Record<string, string> = {
    'Uniswap V3': 'from-purple-500 to-pink-500',
    Aave: 'from-blue-500 to-cyan-500',
    Compound: 'from-yellow-500 to-orange-500',
    Curve: 'from-green-500 to-emerald-500',
    Lido: 'from-indigo-500 to-purple-500'
  };
  return colors[protocol] || 'from-gray-500 to-gray-600';
};
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold">DeFi Portfolio</h2>
      <span class="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
        {{ portfolio.positions.length }} Positions
      </span>
    </div>

    <!-- Total Value -->
    <div class="mb-6 border border-purple-500/30 rounded-xl from-purple-500/20 to-blue-500/20 bg-gradient-to-r p-4">
      <p class="text-sm text-slate-400">Total Value</p>
      <p class="mt-1 text-3xl font-bold">{{ formatValue(portfolio.totalValue) }}</p>
      <div class="mt-2 flex items-center gap-4">
        <span class="text-sm text-green-400">Avg APY: {{ portfolio.totalApy.toFixed(1) }}%</span>
        <span class="text-sm text-slate-400">|</span>
        <span class="text-sm text-slate-400">
          Daily: {{ formatValue((portfolio.totalValue * portfolio.totalApy) / 36500) }}
        </span>
      </div>
    </div>

    <!-- Positions -->
    <div class="space-y-4">
      <div
        v-for="position in portfolio.positions"
        :key="position.pool"
        class="rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50"
      >
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold"
              :class="[getProtocolColor(position.protocol)]"
            >
              {{ position.protocol.charAt(0) }}
            </div>
            <div>
              <p class="font-semibold">{{ position.pool }}</p>
              <p class="text-sm text-slate-400">{{ position.protocol }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold">{{ formatValue(position.value) }}</p>
            <p class="text-sm text-green-400">{{ position.apy }}% APY</p>
          </div>
        </div>

        <!-- Tokens -->
        <div class="flex flex-wrap gap-2">
          <span
            v-for="token in position.tokens"
            :key="token.symbol"
            class="rounded-lg bg-slate-700/50 px-2 py-1 text-xs"
          >
            {{ token.amount }} {{ token.symbol }}
          </span>
        </div>
      </div>
    </div>

    <!-- Protocols Overview -->
    <div class="mt-6 border-t border-slate-700 pt-6">
      <h3 class="mb-3 text-sm text-slate-400 font-medium">Top Protocols</h3>
      <div class="grid grid-cols-2 gap-2">
        <div v-for="protocol in protocols" :key="protocol.name" class="rounded-xl bg-slate-900/50 p-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ protocol.logo }}</span>
            <div>
              <p class="text-sm font-medium">{{ protocol.name }}</p>
              <p class="text-xs text-slate-400">{{ protocol.tvl }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
