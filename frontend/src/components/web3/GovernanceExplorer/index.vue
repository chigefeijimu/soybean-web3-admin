<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface DAO {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  chain: string;
  treasury: number;
  proposalsCount: number;
  votersCount: number;
  category: string;
}

interface Proposal {
  id: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  status: string;
  type: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
  startTime: string;
  endTime: string;
  proposer: string;
}

interface TreasuryAsset {
  symbol: string;
  amount: number;
  valueUsd: number;
  percentage: number;
  type: string;
}

// State
const daos = ref<DAO[]>([]);
const proposals = ref<Proposal[]>([]);
const selectedDao = ref<string>('all');
const selectedStatus = ref<string>('all');
const loading = ref(false);
const treasury = ref<TreasuryAsset[]>([]);
const voterStats = ref<any>(null);

// API Base URL
const API_BASE = 'http://localhost:3019';

// Fetch DAOs
const fetchDaos = async () => {
  try {
    const res = await fetch(`${API_BASE}/governance-explorer/daos`);
    daos.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch DAOs:', e);
  }
};

// Fetch Proposals
const fetchProposals = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (selectedDao.value !== 'all') params.append('dao', selectedDao.value);
    if (selectedStatus.value !== 'all') params.append('status', selectedStatus.value);
    
    const res = await fetch(`${API_BASE}/governance-explorer/proposals?${params}`);
    proposals.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch proposals:', e);
  } finally {
    loading.value = false;
  }
};

// Fetch Treasury
const fetchTreasury = async (daoId: string) => {
  try {
    const res = await fetch(`${API_BASE}/governance-explorer/treasury?dao=${daoId}`);
    const data = await res.json();
    treasury.value = data.assets || [];
  } catch (e) {
    console.error('Failed to fetch treasury:', e);
  }
};

// Fetch Voter Stats
const fetchVoterStats = async (daoId: string) => {
  try {
    const res = await fetch(`${API_BASE}/governance-explorer/voter-stats?dao=${daoId}`);
    voterStats.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch voter stats:', e);
  }
};

// Filtered proposals
const filteredProposals = computed(() => {
  let result = proposals.value;
  if (selectedDao.value !== 'all') {
    result = result.filter(p => p.daoId === selectedDao.value);
  }
  if (selectedStatus.value !== 'all') {
    result = result.filter(p => p.status === selectedStatus.value);
  }
  return result;
});

// Format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toString();
};

const formatUSD = (num: number): string => {
  if (num >= 1000000000) return '$' + (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return '$' + (num / 100000000).toFixed(2) + 'M';
  if (num >= 1000) return '$' + (num / 1000).toFixed(2) + 'K';
  return '$' + num.toString();
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Status colors
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    passed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    executed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
};

// Proposal types
const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    text: '📝',
    upgrade: '🚀',
    parameter: '⚙️',
    treasury: '💰',
    emergency: '🚨',
  };
  return icons[type] || '📋';
};

// Calculate vote percentages
const getVotePercentages = (proposal: Proposal) => {
  const total = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  if (total === 0) return { for: 0, against: 0, abstain: 0 };
  return {
    for: ((proposal.forVotes / total) * 100).toFixed(1),
    against: ((proposal.againstVotes / total) * 100).toFixed(1),
    abstain: ((proposal.abstainVotes / total) * 100).toFixed(1),
  };
};

// On mount
onMounted(() => {
  fetchDaos();
  fetchProposals();
});

// Watch filters
const handleFilterChange = () => {
  fetchProposals();
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl">
      <h2 class="mb-2 text-2xl font-bold">🏛️ Governance Explorer</h2>
      <p class="text-slate-400">Track DAO proposals, voting, delegations, and treasury</p>
    </div>

    <!-- DAOs Grid -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
      <button
        v-for="dao in daos"
        :key="dao.id"
        class="flex flex-col items-center rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition-all hover:scale-105 hover:border-purple-500/50"
        :class="{ 'border-purple-500/50 bg-purple-500/10': selectedDao === dao.id }"
        @click="selectedDao = dao.id; fetchTreasury(dao.id); fetchVoterStats(dao.id); handleFilterChange()"
      >
        <span class="mb-2 text-3xl">{{ dao.logo }}</span>
        <span class="text-sm font-medium">{{ dao.name }}</span>
        <span class="text-xs text-slate-500">{{ dao.symbol }}</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-400">DAO:</label>
        <select
          v-model="selectedDao"
          class="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm"
          @change="handleFilterChange"
        >
          <option value="all">All DAOs</option>
          <option v-for="dao in daos" :key="dao.id" :value="dao.id">{{ dao.name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-400">Status:</label>
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm"
          @change="handleFilterChange"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="executed">Executed</option>
        </select>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="voterStats" class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <p class="text-sm text-slate-400">Total Voters</p>
        <p class="text-2xl font-bold">{{ formatNumber(voterStats.totalVoters) }}</p>
      </div>
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <p class="text-sm text-slate-400">Active Voters</p>
        <p class="text-2xl font-bold">{{ formatNumber(voterStats.activeVoters) }}</p>
      </div>
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <p class="text-sm text-slate-400">Participation</p>
        <p class="text-2xl font-bold">{{ voterStats.participationRate }}%</p>
      </div>
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <p class="text-sm text-slate-400">Avg Votes/Proposal</p>
        <p class="text-2xl font-bold">{{ formatNumber(voterStats.avgVotesPerProposal) }}</p>
      </div>
    </div>

    <!-- Proposals List -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">📋 Proposals</h3>
      
      <div v-if="loading" class="flex justify-center py-8">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="proposal in filteredProposals"
          :key="proposal.id"
          class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition-all hover:border-purple-500/30"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-1 flex items-center gap-2">
                <span class="text-lg">{{ getTypeIcon(proposal.type) }}</span>
                <span class="font-semibold">{{ proposal.title }}</span>
              </div>
              <p class="text-sm text-slate-400 line-clamp-2">{{ proposal.description }}</p>
            </div>
            <span
              class="rounded-full border px-3 py-1 text-xs font-medium"
              :class="getStatusColor(proposal.status)"
            >
              {{ proposal.status }}
            </span>
          </div>
          
          <!-- Vote Bar -->
          <div class="mb-3">
            <div class="mb-1 flex h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                class="bg-green-500"
                :style="{ width: getVotePercentages(proposal).for + '%' }"
              ></div>
              <div
                class="bg-red-500"
                :style="{ width: getVotePercentages(proposal).against + '%' }"
              ></div>
              <div
                class="bg-gray-500"
                :style="{ width: getVotePercentages(proposal).abstain + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-400">
              <span>✅ {{ getVotePercentages(proposal).for }}%</span>
              <span>❌ {{ getVotePercentages(proposal).against }}%</span>
              <span>⚪ {{ getVotePercentages(proposal).abstain }}%</span>
            </div>
          </div>
          
          <!-- Meta -->
          <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
            <div class="flex items-center gap-4">
              <span>🏛️ {{ proposal.daoName }}</span>
              <span>📅 {{ formatDate(proposal.endTime) }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span>👍 {{ formatNumber(proposal.forVotes) }}</span>
              <span>👎 {{ formatNumber(proposal.againstVotes) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Treasury & Top Voters -->
    <div v-if="selectedDao !== 'all'" class="grid gap-6 lg:grid-cols-2">
      <!-- Treasury -->
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <h3 class="mb-4 text-lg font-semibold">💰 Treasury</h3>
        <div class="space-y-3">
          <div
            v-for="asset in treasury"
            :key="asset.symbol"
            class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
          >
            <div class="flex items-center gap-3">
              <span class="font-medium">{{ asset.symbol }}</span>
              <span class="text-xs text-slate-500">{{ asset.type }}</span>
            </div>
            <div class="text-right">
              <p class="font-medium">{{ formatUSD(asset.valueUsd) }}</p>
              <p class="text-xs text-slate-500">{{ asset.percentage }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Voters -->
      <div class="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
        <h3 class="mb-4 text-lg font-semibold">🗳️ Top Voters</h3>
        <div v-if="voterStats?.topVoters" class="space-y-3">
          <div
            v-for="voter in voterStats.topVoters"
            :key="voter.address"
            class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
          >
            <div class="flex items-center gap-3">
              <span class="font-mono text-sm text-slate-300">
                {{ voter.address.slice(0, 6) }}...{{ voter.address.slice(-4) }}
              </span>
              <span v-if="voter.isDelegate" class="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">Delegate</span>
            </div>
            <div class="text-right">
              <p class="font-medium">{{ formatNumber(voter.votingPower) }} votes</p>
              <p class="text-xs text-slate-500">{{ voter.percentage }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
