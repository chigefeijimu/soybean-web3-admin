<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface DAO {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  chain: string;
  treasuryUsd: number;
  treasuryChange24h: number;
  tokenHolders: number;
  proposalsCount: number;
  category: string;
}

interface TreasuryAsset {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  amount: number;
  valueUsd: number;
  percentage: number;
  priceChange24h: number;
  type: 'native' | 'erc20' | 'nft';
  logo?: string;
}

interface TreasuryTransaction {
  id: string;
  daoId: string;
  daoName: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  amountUsd: number;
  tokenSymbol: string;
  from: string;
  to: string;
  description: string;
  txHash: string;
  timestamp: string;
  status: string;
}

const daos = ref<DAO[]>([]);
const selectedDao = ref<string>('uniswap');
const daoTreasury = ref<{ dao: DAO; assets: TreasuryAsset[] } | null>(null);
const transactions = ref<TreasuryTransaction[]>([]);
const flowAnalysis = ref<any>(null);
const treasuryStats = ref<any>(null);
const treasuryTrends = ref<any[]>([]);
const loading = ref(false);
const activeView = ref<'overview' | 'assets' | 'transactions' | 'flow' | 'proposals'>('overview');
const categoryFilter = ref('all');
const sortBy = ref('treasury');

const categories = ['all', 'DEX', 'Lending', 'Stablecoin', 'Staking', 'Layer2', 'Infrastructure'];

const filteredDaos = computed(() => {
  let result = [...daos.value];
  if (categoryFilter.value !== 'all') {
    result = result.filter(d => d.category === categoryFilter.value);
  }
  if (sortBy.value === 'treasury') {
    result.sort((a, b) => b.treasuryUsd - a.treasuryUsd);
  } else if (sortBy.value === 'change') {
    result.sort((a, b) => b.treasuryChange24h - a.treasuryChange24h);
  } else if (sortBy.value === 'holders') {
    result.sort((a, b) => b.tokenHolders - a.tokenHolders);
  }
  return result;
});

const totalTreasury = computed(() => {
  return daos.value.reduce((sum, d) => sum + d.treasuryUsd, 0);
});

const formatUsd = (value: number) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
};

const formatAmount = (value: number) => {
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
};

const fetchDaos = async () => {
  loading.value = true;
  try {
    const res = await fetch('http://localhost:3020/dao-treasury/daos?limit=50');
    const data = await res.json();
    daos.value = data.daos || [];
  } catch (e) {
    console.error('Failed to fetch DAOs:', e);
  }
  loading.value = false;
};

const fetchTreasury = async (daoId: string) => {
  loading.value = true;
  try {
    const [treasuryRes, txsRes, flowRes, statsRes, trendsRes] = await Promise.all([
      fetch(`http://localhost:3020/dao-treasury/dao/${daoId}`),
      fetch(`http://localhost:3020/dao-treasury/transactions?dao=${daoId}&limit=50`),
      fetch(`http://localhost:3020/dao-treasury/flow?dao=${daoId}&period=30d`),
      fetch(`http://localhost:3020/dao-treasury/stats?dao=${daoId}`),
      fetch(`http://localhost:3020/dao-treasury/trends?dao=${daoId}&period=30d`),
    ]);
    
    daoTreasury.value = await treasuryRes.json();
    transactions.value = await txsRes.json();
    flowAnalysis.value = await flowRes.json();
    treasuryStats.value = await statsRes.json();
    treasuryTrends.value = await trendsRes.json();
  } catch (e) {
    console.error('Failed to fetch treasury data:', e);
  }
  loading.value = false;
};

const selectDao = (daoId: string) => {
  selectedDao.value = daoId;
  fetchTreasury(daoId);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-400';
    case 'pending': return 'text-yellow-400';
    case 'cancelled': return 'text-red-400';
    default: return 'text-slate-400';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'income': return '📥';
    case 'expense': return '📤';
    case 'grant': return '🎁';
    case 'investment': return '💰';
    case 'operational': return '⚙️';
    case 'buyback': return '🔄';
    case 'airdrop': return '🎈';
    case 'team': return '👥';
    case 'development': return '🛠️';
    default: return '📦';
  }
};

const getChangeColor = (change: number) => {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-slate-400';
};

onMounted(() => {
  fetchDaos();
  fetchTreasury(selectedDao.value);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">🏛️ DAO Treasury Dashboard</h2>
        <p class="text-slate-400">Track DAO treasury assets, flows, and proposals</p>
      </div>
      
      <!-- Category Filter & Sort -->
      <div class="flex gap-3">
        <select
          v-model="categoryFilter"
          class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat === 'all' ? 'All Categories' : cat }}
          </option>
        </select>
        
        <select
          v-model="sortBy"
          class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="treasury">Sort by Treasury</option>
          <option value="change">Sort by Change</option>
          <option value="holders">Sort by Holders</option>
        </select>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Total Treasury</p>
        <p class="text-2xl font-bold text-white">{{ formatUsd(totalTreasury) }}</p>
      </div>
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Tracked DAOs</p>
        <p class="text-2xl font-bold text-white">{{ daos.length }}</p>
      </div>
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Top Category</p>
        <p class="text-2xl font-bold text-purple-400">DEX</p>
      </div>
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
        <p class="text-xs text-slate-400">Avg Change 24h</p>
        <p class="text-2xl font-bold" :class="getChangeColor(1.2)">+1.2%</p>
      </div>
    </div>

    <!-- DAO List -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700">
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-400">DAO</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-400">Category</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">Treasury</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">24h Change</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">Holders</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">Proposals</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="dao in filteredDaos"
            :key="dao.id"
            class="cursor-pointer border-b border-slate-800 transition-colors hover:bg-slate-800/50"
            :class="{ 'bg-purple-500/10': selectedDao === dao.id }"
            @click="selectDao(dao.id)"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ dao.logo }}</span>
                <div>
                  <p class="font-medium text-white">{{ dao.name }}</p>
                  <p class="text-xs text-slate-400">{{ dao.symbol }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-300">{{ dao.category }}</span>
            </td>
            <td class="px-4 py-3 text-right font-medium text-white">{{ formatUsd(dao.treasuryUsd) }}</td>
            <td class="px-4 py-3 text-right" :class="getChangeColor(dao.treasuryChange24h)">
              {{ dao.treasuryChange24h > 0 ? '+' : '' }}{{ dao.treasuryChange24h }}%
            </td>
            <td class="px-4 py-3 text-right text-slate-300">{{ dao.tokenHolders.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right text-slate-300">{{ dao.proposalsCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Selected DAO Details -->
    <div v-if="daoTreasury" class="space-y-6">
      <!-- View Tabs -->
      <div class="flex gap-2 border-b border-slate-700 pb-2">
        <button
          v-for="view in ['overview', 'assets', 'transactions', 'flow', 'proposals']"
          :key="view"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          :class="activeView === view ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'"
          @click="activeView = view as any"
        >
          {{ view.charAt(0).toUpperCase() + view.slice(1) }}
        </button>
      </div>

      <!-- Overview View -->
      <div v-if="activeView === 'overview'" class="grid gap-6 lg:grid-cols-2">
        <!-- Treasury Summary -->
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h3 class="mb-4 text-lg font-semibold text-white">
            {{ daoTreasury.dao.logo }} {{ daoTreasury.dao.name }} Treasury
          </h3>
          
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-slate-400">Total Value</span>
              <span class="font-bold text-white">{{ formatUsd(treasuryStats?.totalValue || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">24h Change</span>
              <span :class="getChangeColor(treasuryStats?.change24h || 0)">
                {{ treasuryStats?.change24h > 0 ? '+' : '' }}{{ treasuryStats?.change24h?.toFixed(2) || 0 }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">7d Change</span>
              <span :class="getChangeColor(treasuryStats?.change7d || 0)">
                {{ treasuryStats?.change7d > 0 ? '+' : '' }}{{ treasuryStats?.change7d?.toFixed(2) || 0 }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Assets Count</span>
              <span class="text-white">{{ treasuryStats?.assetCount || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Largest Holding</span>
              <span class="text-white">{{ treasuryStats?.largestHolding }} ({{ treasuryStats?.largestHoldingPercentage?.toFixed(1) || 0 }}%)</span>
            </div>
          </div>
        </div>

        <!-- Asset Distribution -->
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h3 class="mb-4 text-lg font-semibold text-white">Asset Distribution</h3>
          
          <div class="space-y-3">
            <div v-for="asset in daoTreasury.assets.slice(0, 5)" :key="asset.symbol" class="flex items-center gap-3">
              <span class="text-xl">{{ asset.logo || asset.symbol.charAt(0) }}</span>
              <div class="flex-1">
                <div class="flex justify-between">
                  <span class="text-white">{{ asset.symbol }}</span>
                  <span class="text-slate-400">{{ asset.percentage.toFixed(1) }}%</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-slate-700">
                  <div
                    class="h-full rounded-full bg-purple-500"
                    :style="{ width: `${asset.percentage}%` }"
                  ></div>
                </div>
              </div>
              <span class="text-right text-sm text-white">{{ formatUsd(asset.valueUsd) }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 lg:col-span-2">
          <h3 class="mb-4 text-lg font-semibold text-white">Recent Transactions</h3>
          
          <div class="space-y-2">
            <div
              v-for="tx in transactions.slice(0, 5)"
              :key="tx.id"
              class="flex items-center justify-between rounded-lg bg-slate-700/30 p-3"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ tx.type === 'income' ? '📥' : '📤' }}</span>
                <div>
                  <p class="text-sm text-white">{{ tx.description }}</p>
                  <p class="text-xs text-slate-400">{{ tx.category }} • {{ new Date(tx.timestamp).toLocaleDateString() }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-medium" :class="tx.type === 'income' ? 'text-green-400' : 'text-red-400'">
                  {{ tx.type === 'income' ? '+' : '-' }}{{ formatUsd(tx.amountUsd) }}
                </p>
                <p class="text-xs text-slate-400">{{ tx.tokenSymbol }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assets View -->
      <div v-if="activeView === 'assets'" class="space-y-4">
        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="asset in daoTreasury.assets"
            :key="asset.symbol"
            class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ asset.logo || asset.symbol.charAt(0) }}</span>
                <div>
                  <p class="font-medium text-white">{{ asset.symbol }}</p>
                  <p class="text-xs text-slate-400">{{ asset.name }}</p>
                </div>
              </div>
              <span
                class="rounded-full px-2 py-1 text-xs"
                :class="asset.type === 'native' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'"
              >
                {{ asset.type }}
              </span>
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">Amount</span>
                <span class="text-white">{{ formatAmount(asset.amount) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">Value</span>
                <span class="text-white">{{ formatUsd(asset.valueUsd) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">Share</span>
                <span class="text-purple-400">{{ asset.percentage.toFixed(1) }}%</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">24h</span>
                <span :class="getChangeColor(asset.priceChange24h)">
                  {{ asset.priceChange24h > 0 ? '+' : '' }}{{ asset.priceChange24h }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions View -->
      <div v-if="activeView === 'transactions'" class="space-y-4">
        <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-700 bg-slate-800">
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-400">Description</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">Amount</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">USD</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">Date</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tx in transactions"
                :key="tx.id"
                class="border-b border-slate-800"
              >
                <td class="px-4 py-3">
                  <span class="text-xl">{{ tx.type === 'income' ? '📥' : '📤' }}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="flex items-center gap-1 text-sm text-slate-300">
                    {{ getCategoryIcon(tx.category) }} {{ tx.category }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-white max-w-xs truncate">{{ tx.description }}</td>
                <td class="px-4 py-3 text-right text-sm text-white">{{ formatAmount(tx.amount) }} {{ tx.tokenSymbol }}</td>
                <td class="px-4 py-3 text-right font-medium" :class="tx.type === 'income' ? 'text-green-400' : 'text-red-400'">
                  {{ tx.type === 'income' ? '+' : '-' }}{{ formatUsd(tx.amountUsd) }}
                </td>
                <td class="px-4 py-3 text-right text-sm text-slate-400">{{ new Date(tx.timestamp).toLocaleDateString() }}</td>
                <td class="px-4 py-3 text-right text-sm" :class="getStatusColor(tx.status)">{{ tx.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Flow View -->
      <div v-if="activeView === 'flow' && flowAnalysis" class="space-y-6">
        <!-- Flow Summary -->
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <p class="text-sm text-slate-400">Total Inflow</p>
            <p class="text-2xl font-bold text-green-400">{{ formatUsd(flowAnalysis.totalInflow) }}</p>
          </div>
          <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <p class="text-sm text-slate-400">Total Outflow</p>
            <p class="text-2xl font-bold text-red-400">{{ formatUsd(flowAnalysis.totalOutflow) }}</p>
          </div>
          <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <p class="text-sm text-slate-400">Net Flow</p>
            <p class="text-2xl font-bold" :class="flowAnalysis.netFlow >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ flowAnalysis.netFlow >= 0 ? '+' : '' }}{{ formatUsd(flowAnalysis.netFlow) }}
            </p>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h3 class="mb-4 text-lg font-semibold text-white">Inflow by Category</h3>
            <div class="space-y-3">
              <div v-for="cat in flowAnalysis.inflowByCategory" :key="cat.category" class="flex items-center gap-3">
                <span>{{ getCategoryIcon(cat.category) }}</span>
                <div class="flex-1">
                  <div class="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      class="h-full rounded-full bg-green-500"
                      :style="{ width: `${(cat.category === 'investment' ? 50 : cat.category === 'grant' ? 30 : 20)}%` }"
                    ></div>
                  </div>
                </div>
                <span class="text-sm text-white">{{ formatUsd(cat.amount) }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h3 class="mb-4 text-lg font-semibold text-white">Outflow by Category</h3>
            <div class="space-y-3">
              <div v-for="cat in flowAnalysis.outflowByCategory" :key="cat.category" class="flex items-center gap-3">
                <span>{{ getCategoryIcon(cat.category) }}</span>
                <div class="flex-1">
                  <div class="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      class="h-full rounded-full bg-red-500"
                      :style="{ width: `${(cat.category === 'airdrop' ? 40 : cat.category === 'development' ? 25 : cat.category === 'team' ? 20 : 15)}%` }"
                    ></div>
                  </div>
                </div>
                <span class="text-sm text-white">{{ formatUsd(cat.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Proposals View -->
      <div v-if="activeView === 'proposals'" class="space-y-4">
        <div v-for="proposal in [
          { id: 'prop1', title: 'Allocate 5M USDC for Ecosystem Grants', status: 'passed', type: 'treasury', amount: 5000000, forVotes: 15000000, againstVotes: 2500000 },
          { id: 'prop2', title: 'Treasury Diversification Strategy', status: 'active', type: 'treasury', amount: 750000000, forVotes: 8500000, againstVotes: 4200000 },
          { id: 'prop3', title: 'Buyback and Burn Program', status: 'passed', type: 'treasury', amount: 10000000, forVotes: 22000000, againstVotes: 1800000 },
        ]" :key="proposal.id" class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <div class="mb-3 flex items-start justify-between">
            <div>
              <h4 class="font-medium text-white">{{ proposal.title }}</h4>
              <p class="text-sm text-slate-400">{{ formatUsd(proposal.amount) }} • {{ proposal.type }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-medium"
              :class="{
                'bg-green-500/20 text-green-400': proposal.status === 'passed',
                'bg-yellow-500/20 text-yellow-400': proposal.status === 'active',
                'bg-red-500/20 text-red-400': proposal.status === 'failed',
                'bg-blue-500/20 text-blue-400': proposal.status === 'executed',
              }"
            >
              {{ proposal.status }}
            </span>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm">
                <span class="text-green-400">For: {{ (proposal.forVotes / 1000000).toFixed(1) }}M</span>
                <span class="text-red-400">Against: {{ (proposal.againstVotes / 1000000).toFixed(1) }}M</span>
              </div>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  class="h-full rounded-full bg-green-500"
                  :style="{ width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%` }"
                ></div>
              </div>
            </div>
            <span class="text-sm text-slate-400">
              {{ ((proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>
  </div>
</template>
