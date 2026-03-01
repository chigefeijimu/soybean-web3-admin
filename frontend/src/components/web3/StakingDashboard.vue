<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { request } from '@/service/request';

// State
const activeTab = ref('overview');
const loading = ref(false);
const address = ref('');
const stakingData = ref<any>(null);
const rewardsData = ref<any>(null);
const validators = ref<any[]>([]);
const pools = ref<any[]>([]);
const aprHistory = ref<any[]>([]);

// Computed
const totalStaked = computed(() => stakingData.value?.totalStaked || '0 ETH');
const currentApr = computed(() => stakingData.value?.apr || 0);
const totalValidators = computed(() => stakingData.value?.validators?.toLocaleString() || '0');

// Tabs
const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'pools', label: 'Staking Pools', icon: '🏊' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
  { id: 'validators', label: 'Validators', icon: '✅' }
];

// Fetch data
const fetchStakingStats = async () => {
  loading.value = true;
  try {
    const response = await request({ url: '/api/web3/staking/stats', method: 'get' });
    if (response?.data?.success) {
      stakingData.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch staking stats:', error);
  } finally {
    loading.value = false;
  }
};

const fetchRewards = async () => {
  loading.value = true;
  try {
    const url = address.value ? `/api/web3/staking/rewards?address=${address.value}` : '/api/web3/staking/rewards';
    const response = await request({ url, method: 'get' });
    if (response?.data?.success) {
      rewardsData.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch rewards:', error);
  } finally {
    loading.value = false;
  }
};

const fetchValidators = async () => {
  try {
    const response = await request({ url: '/api/web3/staking/validators', method: 'get' });
    if (response?.data?.success) {
      validators.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch validators:', error);
  }
};

const fetchPools = async () => {
  try {
    const response = await request({ url: '/api/web3/staking/pools', method: 'get' });
    if (response?.data?.success) {
      pools.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch pools:', error);
  }
};

const fetchAprHistory = async () => {
  try {
    const response = await request({ url: '/api/web3/staking/apr-history?days=30', method: 'get' });
    if (response?.data?.success) {
      aprHistory.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to fetch APR history:', error);
  }
};

const checkAddressRewards = async () => {
  if (address.value && address.value.length === 42) {
    await fetchRewards();
  }
};

// Format
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

// Risk color
const getRiskColor = (risk: string) => {
  const colors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400'
  };
  return colors[risk] || 'text-gray-400';
};

// On mount
onMounted(async () => {
  await fetchStakingStats();
  await fetchPools();
  await fetchValidators();
  await fetchAprHistory();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Staking Dashboard</h2>
        <p class="text-slate-400">Track your ETH staking positions and rewards</p>
      </div>
      <button
        class="rounded-lg bg-purple-500/20 px-4 py-2 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30"
        @click="fetchStakingStats"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-5 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Total Staked</p>
        <p class="mt-1 text-2xl font-bold text-white">{{ totalStaked }}</p>
        <p class="mt-1 text-xs text-green-400">+2.4% this week</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-5 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Current APR</p>
        <p class="mt-1 text-2xl font-bold text-yellow-400">{{ currentApr }}%</p>
        <p class="mt-1 text-xs text-slate-400">Beacon Chain</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-5 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Total Validators</p>
        <p class="mt-1 text-2xl font-bold text-blue-400">{{ totalValidators }}</p>
        <p class="mt-1 text-xs text-slate-400">Active on network</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-5 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Daily Rewards</p>
        <p class="mt-1 text-2xl font-bold text-green-400">~5,200 ETH</p>
        <p class="mt-1 text-xs text-slate-400">Distributed daily</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="[
          activeTab === tab.id
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-slate-800/50 text-slate-400 hover:text-white'
        ]"
        @click="activeTab = tab.id"
      >
        <span class="mr-2">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="space-y-6">
      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <!-- Address Search -->
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">Check Your Staking Rewards</h3>
          <div class="flex gap-4">
            <input
              v-model="address"
              type="text"
              placeholder="Enter wallet address (0x...)"
              class="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              @keyup.enter="checkAddressRewards"
            />
            <button
              class="rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white hover:bg-purple-600"
              @click="checkAddressRewards"
            >
              Check
            </button>
          </div>

          <!-- Rewards Display -->
          <div v-if="rewardsData?.address" class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div class="rounded-lg bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">Total Staked</p>
              <p class="mt-1 text-xl font-bold text-white">{{ rewardsData.totalStaked }}</p>
            </div>
            <div class="rounded-lg bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">Pending Rewards</p>
              <p class="mt-1 text-xl font-bold text-green-400">{{ rewardsData.pendingRewards }}</p>
            </div>
            <div class="rounded-lg bg-slate-900/50 p-4">
              <p class="text-xs text-slate-400">Total Earned</p>
              <p class="mt-1 text-xl font-bold text-yellow-400">{{ rewardsData.totalRewards }}</p>
            </div>
          </div>
        </div>

        <!-- APR History Chart Placeholder -->
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">APR History (30 Days)</h3>
          <div class="flex h-40 items-end gap-1">
            <div
              v-for="(point, index) in aprHistory.slice(-14)"
              :key="index"
              class="flex-1 rounded-t bg-purple-500/50 transition-all hover:bg-purple-500"
              :style="{ height: `${((parseFloat(point.apr) / 5) * 100)}%` }"
              :title="`${point.date}: ${point.apr}%`"
            ></div>
          </div>
          <div class="mt-2 flex justify-between text-xs text-slate-500">
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      <!-- Pools Tab -->
      <div v-show="activeTab === 'pools'" class="space-y-4">
        <div
          v-for="pool in pools"
          :key="pool.id"
          class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-5 backdrop-blur-xl transition-all hover:border-purple-500/50"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white">{{ pool.name }}</h3>
              <p class="text-sm text-slate-400">{{ pool.symbol }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-green-400">{{ pool.apr }}%</p>
              <p class="text-xs text-slate-400">APR</p>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-slate-500">TVL</p>
              <p class="font-semibold text-white">{{ pool.tvl }}</p>
            </div>
            <div>
              <p class="text-slate-500">Fee</p>
              <p class="font-semibold text-white">{{ pool.fee }}</p>
            </div>
            <div>
              <p class="text-slate-500">Min. Stake</p>
              <p class="font-semibold text-white">{{ pool.minStake }}</p>
            </div>
            <div>
              <p class="text-slate-500">Chains</p>
              <p class="font-semibold text-white">{{ pool.chains.join(', ') }}</p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="feature in pool.features"
              :key="feature"
              class="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300"
            >
              {{ feature }}
            </span>
          </div>

          <button class="mt-4 w-full rounded-lg bg-purple-500 py-2 font-semibold text-white hover:bg-purple-600">
            Stake Now
          </button>
        </div>
      </div>

      <!-- Rewards Tab -->
      <div v-show="activeTab === 'rewards'" class="space-y-4">
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">Global Staking Rewards</h3>
          <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <div class="text-center">
              <p class="text-3xl font-bold text-white">{{ stakingData?.totalStaked || '0' }}</p>
              <p class="mt-1 text-sm text-slate-400">Total Staked</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-green-400">{{ stakingData?.apr || 0 }}%</p>
              <p class="mt-1 text-sm text-slate-400">Average APR</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-yellow-400">~5,200</p>
              <p class="mt-1 text-sm text-slate-400">ETH / Day</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-blue-400">285K</p>
              <p class="mt-1 text-sm text-slate-400">Validators</p>
            </div>
          </div>
        </div>

        <!-- Rewards Breakdown -->
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">Estimated Rewards</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
              <span class="text-slate-400">Per Day</span>
              <span class="font-semibold text-green-400">~5,200 ETH</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
              <span class="text-slate-400">Per Week</span>
              <span class="font-semibold text-green-400">~36,400 ETH</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
              <span class="text-slate-400">Per Month</span>
              <span class="font-semibold text-green-400">~156,000 ETH</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-4">
              <span class="text-slate-400">Per Year</span>
              <span class="font-semibold text-green-400">~1.9M ETH</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Validators Tab -->
      <div v-show="activeTab === 'validators'" class="space-y-4">
        <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h3 class="mb-4 text-lg font-semibold">Validator Comparison</h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-sm text-slate-400">
                  <th class="pb-3">Protocol</th>
                  <th class="pb-3">APR</th>
                  <th class="pb-3">TVL</th>
                  <th class="pb-3">Fee</th>
                  <th class="pb-3">Risk</th>
                  <th class="pb-3">Users</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="validator in validators"
                  :key="validator.name"
                  class="border-t border-slate-700/50"
                >
                  <td class="py-3 font-semibold text-white">{{ validator.name }}</td>
                  <td class="py-3 text-green-400">{{ validator.apr }}%</td>
                  <td class="py-3 text-slate-300">{{ validator.tvl }}</td>
                  <td class="py-3 text-slate-300">{{ validator.fee }}</td>
                  <td class="py-3" :class="getRiskColor(validator.risk)">{{ validator.risk }}</td>
                  <td class="py-3 text-slate-300">{{ formatNumber(validator.users) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
