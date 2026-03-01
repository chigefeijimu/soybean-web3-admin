<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const {
  isConnected,
  account,
  chainId,
  balance,
  isConnecting,
  chainInfo,
  connectWallet,
  disconnectWallet,
  switchChain,
  formatAddress,
  CHAIN_INFO,
  updateBalance
} = useWeb3();

const activeTab = ref('dashboard');
const error = ref('');
const isLoading = ref(false);

// Stats
const stats = computed(() => ({
  totalBalance: balance.value || '0',
  walletAddress: account.value || '',
  network: chainInfo.value?.name || 'Unknown'
}));

// Quick actions
const quickActions = [
  { id: 'send', label: 'Send', icon: '↑', color: 'blue' },
  { id: 'receive', label: 'Receive', icon: '↓', color: 'green' },
  { id: 'swap', label: 'Swap', icon: '⇄', color: 'purple' },
  { id: 'bridge', label: 'Bridge', icon: '🌉', color: 'orange' }
];

// Recent activity (mock data for demo)
const recentActivity = ref([
  { type: 'receive', amount: '0.5 ETH', from: '0x1234...5678', time: '2 hours ago', status: 'confirmed' },
  { type: 'send', amount: '0.1 ETH', to: '0xabcd...efgh', time: '1 day ago', status: 'confirmed' },
  { type: 'swap', amount: '100 USDC → 0.03 ETH', time: '3 days ago', status: 'confirmed' }
]);

const handleConnect = async () => {
  error.value = '';
  isLoading.value = true;
  try {
    await connectWallet();
  } catch (e: any) {
    error.value = e.message || 'Failed to connect';
  } finally {
    isLoading.value = false;
  }
};

const handleDisconnect = async () => {
  await disconnectWallet();
};

const handleSwitchNetwork = async (chainId: number) => {
  error.value = '';
  try {
    await switchChain(chainId);
  } catch (e: any) {
    error.value = e.message;
  }
};

const copyAddress = () => {
  if (account.value) {
    navigator.clipboard.writeText(account.value);
  }
};

onMounted(() => {
  if (window.ethereum?.selectedAddress) {
    connectWallet();
  }
});
</script>

<template>
  <div class="min-h-screen from-slate-900 via-purple-900 to-slate-900 bg-gradient-to-br p-6 text-white">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="from-blue-400 to-purple-400 bg-gradient-to-r bg-clip-text text-3xl text-transparent font-bold">
          Web3 Dashboard
        </h1>
        <p class="mt-1 text-sm text-slate-400">Manage your crypto assets</p>
      </div>

      <!-- Network Selector -->
      <div class="flex items-center gap-3">
        <select
          :value="chainId"
          class="border border-slate-700 rounded-lg bg-slate-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          @change="handleSwitchNetwork(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="chain in Object.entries(CHAIN_INFO)" :key="chain[0]" :value="chain[0]">
            {{ chain[1].name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-6 flex items-center justify-between border border-red-500/50 rounded-lg bg-red-500/20 p-4"
    >
      <span class="text-red-300">{{ error }}</span>
      <button class="text-red-400 hover:text-white" @click="error = ''">✕</button>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Left Column - Wallet Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Wallet Card -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold">Wallet</h2>
            <span
              v-if="isConnected"
              class="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400"
            >
              <span class="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
              Connected
            </span>
          </div>

          <div v-if="isConnected" class="space-y-4">
            <!-- Address -->
            <div class="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
              <div>
                <p class="text-sm text-slate-400">Address</p>
                <p class="text-lg font-mono">{{ formatAddress(account!) }}</p>
              </div>
              <button class="rounded-lg p-2 transition-colors hover:bg-slate-700" title="Copy" @click="copyAddress">
                📋
              </button>
            </div>

            <!-- Balance -->
            <div class="rounded-xl bg-slate-900/50 p-4">
              <p class="mb-1 text-sm text-slate-400">Balance</p>
              <p class="text-3xl text-green-400 font-bold">
                {{ parseFloat(stats.totalBalance).toFixed(4) }}
                <span class="text-lg text-slate-400">{{ chainInfo?.symbol || 'ETH' }}</span>
              </p>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-4 gap-3">
              <button
                v-for="action in quickActions"
                :key="action.id"
                class="flex flex-col items-center gap-2 rounded-xl bg-slate-700/50 p-4 transition-all hover:scale-105 hover:bg-slate-700"
              >
                <span class="text-2xl">{{ action.icon }}</span>
                <span class="text-sm">{{ action.label }}</span>
              </button>
            </div>

            <!-- Disconnect -->
            <button
              class="w-full rounded-xl bg-red-500/20 py-3 text-red-400 transition-colors hover:bg-red-500/30"
              @click="handleDisconnect"
            >
              Disconnect Wallet
            </button>
          </div>

          <!-- Connect Button -->
          <div v-else class="py-8 text-center">
            <div class="mb-4 text-6xl">🔗</div>
            <p class="mb-6 text-slate-400">Connect your wallet to get started</p>
            <button
              :disabled="isLoading"
              class="rounded-xl from-blue-500 to-purple-500 bg-gradient-to-r px-8 py-3 font-semibold transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
              @click="handleConnect"
            >
              {{ isLoading ? 'Connecting...' : 'Connect Wallet' }}
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h2 class="mb-4 text-xl font-semibold">Recent Activity</h2>
          <div class="space-y-3">
            <div
              v-for="(activity, index) in recentActivity"
              :key="index"
              class="flex items-center justify-between rounded-xl bg-slate-900/50 p-4"
            >
              <div class="flex items-center gap-3">
                <span
                  class="h-10 w-10 flex items-center justify-center rounded-full"
                  :class="
                    activity.type === 'receive'
                      ? 'bg-green-500/20 text-green-400'
                      : activity.type === 'send'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                  "
                >
                  {{ activity.type === 'receive' ? '↓' : activity.type === 'send' ? '↑' : '⇄' }}
                </span>
                <div>
                  <p class="font-medium">{{ activity.amount }}</p>
                  <p class="text-sm text-slate-400">{{ activity.time }}</p>
                </div>
              </div>
              <span class="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                {{ activity.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Stats & Info -->
      <div class="space-y-6">
        <!-- Network Info -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h2 class="mb-4 text-xl font-semibold">Network</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Chain</span>
              <span class="font-medium">{{ chainInfo?.name || 'Not Connected' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Chain ID</span>
              <span class="font-mono">{{ chainId || '-' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Explorer</span>
              <span class="font-mono">{{ chainInfo?.explorer || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Gas Tracker -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h2 class="mb-4 text-xl font-semibold">Gas Tracker</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Slow</span>
              <span class="text-green-400">5 Gwei</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Normal</span>
              <span class="text-yellow-400">15 Gwei</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
              <span class="text-slate-400">Fast</span>
              <span class="text-red-400">30 Gwei</span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h2 class="mb-4 text-xl font-semibold">Explore</h2>
          <div class="space-y-2">
            <a href="#" class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700">📈 Uniswap</a>
            <a href="#" class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700">🎨 OpenSea</a>
            <a href="#" class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700">
              🌉 Arbitrum Bridge
            </a>
            <a href="#" class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700">
              📄 Etherscan
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
.from-slate-900 {
  --tw-gradient-from: #0f172a;
}
.via-purple-900 {
  --tw-gradient-via: #581c87;
}
.to-slate-900 {
  --tw-gradient-to: #0f172a;
}
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
