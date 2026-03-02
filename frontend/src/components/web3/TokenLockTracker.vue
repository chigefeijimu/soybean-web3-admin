<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface TokenLockInfo {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  totalLocked: number;
  totalLockedUSD: number;
  lockType: 'liquidity' | 'team' | 'investor' | 'treasury';
  lockAddress: string;
  unlockDate: Date;
  daysRemaining: number;
  percentageLocked: number;
  owner: string;
  description: string;
}

interface LockStats {
  totalValueLocked: number;
  totalValueLockedUSD: number;
  activeLocks: number;
  upcomingUnlocks: number;
  expiredLocks: number;
  byType: {
    liquidity: number;
    team: number;
    investor: number;
    treasury: number;
  };
}

const loading = ref(false);
const error = ref('');
const searchAddress = ref('');
const selectedChain = ref('ethereum');
const locks = ref<TokenLockInfo[]>([]);
const stats = ref<LockStats | null>(null);
const topTokens = ref<TokenLockInfo[]>([]);
const activeTab = ref('search');

const chains = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'base', name: 'Base', symbol: 'BASE' },
];

const popularTokens = [
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap' },
  { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave' },
  { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', symbol: 'CRV', name: 'Curve DAO' },
  { address: '0x5a98fcbea516cf06857215709fd98c23c4fea15', symbol: 'LDO', name: 'Lido DAO' },
  { address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', symbol: 'MKR', name: 'Maker' },
];

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatUSD = (num: number): string => {
  return '$' + formatNumber(num);
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getLockTypeColor = (type: string): string => {
  switch (type) {
    case 'liquidity': return '#8b5cf6';
    case 'team': return '#3b82f6';
    case 'investor': return '#10b981';
    case 'treasury': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getLockTypeIcon = (type: string): string => {
  switch (type) {
    case 'liquidity': return '💧';
    case 'team': return '👥';
    case 'investor': return '💰';
    case 'treasury': return '🏦';
    default: return '🔒';
  }
};

const getRiskLevel = (daysRemaining: number): { level: string; color: string } => {
  if (daysRemaining <= 30) return { level: 'High Risk', color: '#ef4444' };
  if (daysRemaining <= 90) return { level: 'Medium', color: '#f59e0b' };
  if (daysRemaining <= 180) return { level: 'Low', color: '#3b82f6' };
  return { level: 'Safe', color: '#10b981' };
};

const searchToken = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    // Simulate API call with mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockLocks: TokenLockInfo[] = [
      {
        tokenAddress: searchAddress.value,
        tokenSymbol: 'TOKEN',
        tokenName: 'Token',
        chain: selectedChain.value,
        totalLocked: 1250000,
        totalLockedUSD: 1250000,
        lockType: 'liquidity',
        lockAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB1E',
        unlockDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        daysRemaining: 180,
        percentageLocked: 25.5,
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Uniswap V3 Liquidity Pool Lock'
      },
      {
        tokenAddress: searchAddress.value,
        tokenSymbol: 'TOKEN',
        tokenName: 'Token',
        chain: selectedChain.value,
        totalLocked: 2500000,
        totalLockedUSD: 2500000,
        lockType: 'team',
        lockAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        unlockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        daysRemaining: 365,
        percentageLocked: 50.0,
        owner: '0xteam1234567890abcdef1234567890abcdef12',
        description: 'Team Vesting - 24 months linear'
      },
      {
        tokenAddress: searchAddress.value,
        tokenSymbol: 'TOKEN',
        tokenName: 'Token',
        chain: selectedChain.value,
        totalLocked: 1000000,
        totalLockedUSD: 1000000,
        lockType: 'investor',
        lockAddress: '0xinvestor1234567890abcdef1234567890abcdef',
        unlockDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        daysRemaining: 90,
        percentageLocked: 20.0,
        owner: '0xinvestor1234567890abcdef1234567890abcdef',
        description: 'Investor Seed Round - 12 months cliff'
      }
    ];
    
    locks.value = mockLocks;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch lock data';
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    stats.value = {
      totalValueLocked: 450000000,
      totalValueLockedUSD: 450000000,
      activeLocks: 342,
      upcomingUnlocks: 45,
      expiredLocks: 128,
      byType: {
        liquidity: 180000000,
        team: 120000000,
        investor: 85000000,
        treasury: 65000000
      }
    };
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const loadTopTokens = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    topTokens.value = [
      {
        tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        tokenSymbol: 'UNI',
        tokenName: 'Uniswap',
        chain: 'ethereum',
        totalLocked: 150000000,
        totalLockedUSD: 1125000000,
        lockType: 'liquidity',
        lockAddress: '0x',
        unlockDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        daysRemaining: 200,
        percentageLocked: 15,
        owner: '0x',
        description: 'Uniswap Protocol'
      },
      {
        tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        tokenSymbol: 'AAVE',
        tokenName: 'Aave',
        chain: 'ethereum',
        totalLocked: 12500000,
        totalLockedUSD: 3500000000,
        lockType: 'team',
        lockAddress: '0x',
        unlockDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
        daysRemaining: 400,
        percentageLocked: 12.5,
        owner: '0x',
        description: 'Aave Team'
      },
      {
        tokenAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52',
        tokenSymbol: 'CRV',
        tokenName: 'Curve DAO',
        chain: 'ethereum',
        totalLocked: 1800000000,
        totalLockedUSD: 990000000,
        lockType: 'liquidity',
        lockAddress: '0x',
        unlockDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        daysRemaining: 30,
        percentageLocked: 45,
        owner: '0x',
        description: 'CRV Liquidity'
      },
      {
        tokenAddress: '0x5a98fcbea516cf06857215709fd98c23c4fea15',
        tokenSymbol: 'LDO',
        tokenName: 'Lido DAO',
        chain: 'ethereum',
        totalLocked: 89000000,
        totalLockedUSD: 249200000,
        lockType: 'treasury',
        lockAddress: '0x',
        unlockDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        daysRemaining: 150,
        percentageLocked: 8.9,
        owner: '0x',
        description: 'Lido Treasury'
      },
      {
        tokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        tokenSymbol: 'MKR',
        tokenName: 'Maker',
        chain: 'ethereum',
        totalLocked: 550000,
        totalLockedUSD: 825000000,
        lockType: 'team',
        lockAddress: '0x',
        unlockDate: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000),
        daysRemaining: 280,
        percentageLocked: 55,
        owner: '0x',
        description: 'MakerDAO Team'
      }
    ];
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const selectPopularToken = (token: { address: string; symbol: string; name: string }) => {
  searchAddress.value = token.address;
  searchToken();
};

onMounted(() => {
  loadStats();
  loadTopTokens();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">🔒 Token Lock Tracker</h2>
        <p class="text-sm text-slate-400">Track token locks, liquidity locks, and vesting schedules</p>
      </div>
      
      <!-- Chain Selector -->
      <select
        v-model="selectedChain"
        class="border border-slate-700 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.name }}
        </option>
      </select>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-slate-700 pb-2">
      <button
        v-for="tab in ['search', 'stats', 'top']"
        :key="tab"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="activeTab === tab ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'"
        @click="activeTab = tab"
      >
        {{ tab === 'search' ? '🔍 Search' : tab === 'stats' ? '📊 Stats' : '🏆 Top Locks' }}
      </button>
    </div>

    <!-- Search Tab -->
    <div v-show="activeTab === 'search'" class="space-y-4">
      <!-- Search Input -->
      <div class="flex gap-2">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter token contract address..."
          class="flex-1 border border-slate-700 rounded-lg bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          @keyup.enter="searchToken"
        />
        <button
          class="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          :disabled="loading"
          @click="searchToken"
        >
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
      </div>

      <!-- Popular Tokens -->
      <div class="flex flex-wrap gap-2">
        <span class="text-sm text-slate-400">Popular:</span>
        <button
          v-for="token in popularTokens"
          :key="token.address"
          class="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700"
          @click="selectPopularToken(token)"
        >
          {{ token.symbol }}
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="rounded-lg bg-red-500/20 p-4 text-red-300">
        {{ error }}
      </div>

      <!-- Results -->
      <div v-if="locks.length > 0" class="space-y-4">
        <div
          v-for="lock in locks"
          :key="lock.lockAddress"
          class="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ getLockTypeIcon(lock.lockType) }}</span>
              <div>
                <p class="font-semibold text-white">{{ lock.tokenName }} ({{ lock.tokenSymbol }})</p>
                <p class="text-sm text-slate-400">{{ lock.description }}</p>
              </div>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-medium"
              :style="{ backgroundColor: getLockTypeColor(lock.lockType) + '20', color: getLockTypeColor(lock.lockType) }"
            >
              {{ lock.lockType.toUpperCase() }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <p class="text-xs text-slate-400">Total Locked</p>
              <p class="font-semibold text-white">{{ formatNumber(lock.totalLocked) }} {{ lock.tokenSymbol }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Value (USD)</p>
              <p class="font-semibold text-green-400">{{ formatUSD(lock.totalLockedUSD) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Unlock Date</p>
              <p class="font-semibold text-white">{{ formatDate(lock.unlockDate) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Days Remaining</p>
              <p class="font-semibold" :style="{ color: getRiskLevel(lock.daysRemaining).color }">
                {{ lock.daysRemaining }} days ({{ getRiskLevel(lock.daysRemaining).level }})
              </p>
            </div>
          </div>

          <div class="mt-4">
            <div class="flex justify-between text-xs text-slate-400">
              <span>Lock Progress</span>
              <span>{{ lock.percentageLocked }}%</span>
            </div>
            <div class="mt-1 h-2 rounded-full bg-slate-700">
              <div
                class="h-2 rounded-full"
                :style="{ width: Math.min(lock.percentageLocked, 100) + '%', backgroundColor: getLockTypeColor(lock.lockType) }"
              ></div>
            </div>
          </div>

          <div class="mt-4 flex gap-4 text-xs">
            <div class="flex-1">
              <p class="text-slate-400">Lock Address</p>
              <p class="font-mono text-slate-300">{{ lock.lockAddress.slice(0, 10) }}...{{ lock.lockAddress.slice(-8) }}</p>
            </div>
            <div class="flex-1">
              <p class="text-slate-400">Owner</p>
              <p class="font-mono text-slate-300">{{ lock.owner.slice(0, 10) }}...{{ lock.owner.slice(-8) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Tab -->
    <div v-show="activeTab === 'stats'" class="space-y-4">
      <div v-if="stats" class="grid gap-4 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Total Value Locked</p>
          <p class="text-2xl font-bold text-white">{{ formatUSD(stats.totalValueLockedUSD) }}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Active Locks</p>
          <p class="text-2xl font-bold text-purple-400">{{ stats.activeLocks }}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Upcoming Unlocks</p>
          <p class="text-2xl font-bold text-yellow-400">{{ stats.upcomingUnlocks }}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p class="text-sm text-slate-400">Expired Locks</p>
          <p class="text-2xl font-bold text-slate-400">{{ stats.expiredLocks }}</p>
        </div>
      </div>

      <div v-if="stats" class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 class="mb-4 text-lg font-semibold text-white">Lock Distribution by Type</h3>
        <div class="space-y-4">
          <div v-for="(value, type) in stats.byType" :key="type" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="capitalize text-slate-300">{{ type }}</span>
              <span class="text-white">{{ formatUSD(value) }}</span>
            </div>
            <div class="h-3 rounded-full bg-slate-700">
              <div
                class="h-3 rounded-full transition-all"
                :style="{
                  width: (value / stats.totalValueLocked * 100) + '%',
                  backgroundColor: getLockTypeColor(type)
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Tokens Tab -->
    <div v-show="activeTab === 'top'" class="space-y-4">
      <h3 class="text-lg font-semibold text-white">🔥 Top Locked Tokens</h3>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-700 text-left text-sm text-slate-400">
              <th class="pb-3 font-medium">Token</th>
              <th class="pb-3 font-medium">Chain</th>
              <th class="pb-3 font-medium">Type</th>
              <th class="pb-3 font-medium text-right">Locked</th>
              <th class="pb-3 font-medium text-right">Value (USD)</th>
              <th class="pb-3 font-medium text-right">Unlock</th>
              <th class="pb-3 font-medium text-right">Risk</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="token in topTokens"
              :key="token.tokenAddress + token.lockType"
              class="border-b border-slate-800 transition-colors hover:bg-slate-800/50"
            >
              <td class="py-4">
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ getLockTypeIcon(token.lockType) }}</span>
                  <div>
                    <p class="font-medium text-white">{{ token.tokenSymbol }}</p>
                    <p class="text-xs text-slate-400">{{ token.tokenName }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 text-slate-300 capitalize">{{ token.chain }}</td>
              <td class="py-4">
                <span
                  class="rounded-full px-2 py-1 text-xs font-medium"
                  :style="{ backgroundColor: getLockTypeColor(token.lockType) + '20', color: getLockTypeColor(token.lockType) }"
                >
                  {{ token.lockType }}
                </span>
              </td>
              <td class="py-4 text-right text-white">{{ formatNumber(token.totalLocked) }}</td>
              <td class="py-4 text-right text-green-400">{{ formatUSD(token.totalLockedUSD) }}</td>
              <td class="py-4 text-right text-slate-300">{{ token.daysRemaining }}d</td>
              <td class="py-4 text-right">
                <span
                  class="font-medium"
                  :style="{ color: getRiskLevel(token.daysRemaining).color }"
                >
                  {{ getRiskLevel(token.daysRemaining).level }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
