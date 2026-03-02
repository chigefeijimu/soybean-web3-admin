<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  getTokenInsiderData, 
  getTopInsiderTokens,
  searchInsiders,
  type TokenInsiderData,
  type InsiderWallet,
  type InsiderTransaction,
  type TopInsiderToken
} from '@/service/api/web3';

const loading = ref(false);
const tokenAddress = ref('');
const chainId = ref(1);
const insiderData = ref<TokenInsiderData | null>(null);
const topTokens = ref<TopInsiderToken[]>([]);
const searchResults = ref<InsiderWallet[]>([]);
const searchQuery = ref('');
const activeTab = ref('analyze');

// Sample popular tokens for quick selection
const popularTokens = [
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', name: 'Uniswap', symbol: 'UNI' },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', name: 'Aave', symbol: 'AAVE' },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', name: 'Chainlink', symbol: 'LINK' },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped Bitcoin', symbol: 'WBTC' },
  { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', name: 'Polygon', symbol: 'MATIC' },
  { address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', name: 'Basic Attention Token', symbol: 'BAT' },
];

const chains = [
  { id: 1, name: 'Ethereum' },
  { id: 56, name: 'BSC' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 8453, name: 'Base' },
];

const riskColors = computed(() => {
  if (!insiderData.value) return {};
  const { riskLevel, dumpRiskScore } = insiderData.value;
  const colors: Record<string, string> = {
    critical: 'text-red-500',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };
  return {
    color: colors[riskLevel] || 'text-gray-500',
    bg: riskLevel === 'critical' ? 'bg-red-500/20' : 
        riskLevel === 'high' ? 'bg-orange-500/20' :
        riskLevel === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20',
    bar: riskLevel === 'critical' ? 'bg-red-500' : 
        riskLevel === 'high' ? 'bg-orange-500' :
        riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500',
  };
});

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toLocaleString('en-US');
};

const formatPercent = (num: number) => {
  return num.toFixed(2) + '%';
};

const formatAddress = (addr: string) => {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const analyzeToken = async () => {
  if (!tokenAddress.value) return;
  
  loading.value = true;
  try {
    const res = await getTokenInsiderData({
      tokenAddress: tokenAddress.value,
      chainId: chainId.value,
    });
    insiderData.value = res.data;
  } catch (error) {
    console.error('Failed to analyze token:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTopTokens = async () => {
  try {
    const res = await getTopInsiderTokens(chainId.value);
    topTokens.value = res.data || [];
  } catch (error) {
    console.error('Failed to fetch top tokens:', error);
  }
};

const doSearch = async () => {
  if (!searchQuery.value) return;
  try {
    const res = await searchInsiders({
      query: searchQuery.value,
      chainId: chainId.value,
    });
    searchResults.value = res.data || [];
  } catch (error) {
    console.error('Failed to search:', error);
  }
};

const selectToken = (token: typeof popularTokens[0]) => {
  tokenAddress.value = token.address;
  analyzeToken();
};

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    founder: '👨‍💻',
    team: '👥',
    investor: '💰',
    advisor: '🎓',
    exchange: '🏦',
  };
  return icons[type] || '👤';
};

const getRiskBadge = (risk: string) => {
  const badges: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-500/30', text: '🔴 Critical' },
    high: { bg: 'bg-orange-500/30', text: '🟠 High' },
    medium: { bg: 'bg-yellow-500/30', text: '🟡 Medium' },
    low: { bg: 'bg-green-500/30', text: '🟢 Low' },
  };
  return badges[risk] || badges.low;
};

onMounted(() => {
  fetchTopTokens();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          🎯 Token Insider Tracker
        </h2>
        <p class="text-gray-400 text-sm mt-1">
          Track founder/team wallets, analyze insider holdings, and detect dump risk
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-gray-700 pb-2">
      <button 
        v-for="tab in ['analyze', 'top-tokens', 'search']" 
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-4 py-2 rounded-t-lg transition-colors capitalize',
          activeTab === tab 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        ]"
      >
        {{ tab.replace('-', ' ') }}
      </button>
    </div>

    <!-- Analyze Tab -->
    <div v-if="activeTab === 'analyze'" class="space-y-4">
      <!-- Search Form -->
      <div class="bg-gray-800/50 rounded-xl p-4 space-y-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="text-gray-400 text-sm block mb-1">Token Address</label>
            <input 
              v-model="tokenAddress"
              placeholder="0x..."
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div class="w-40">
            <label class="text-gray-400 text-sm block mb-1">Chain</label>
            <select 
              v-model="chainId"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option v-for="c in chains" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button 
              @click="analyzeToken"
              :disabled="loading || !tokenAddress"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              {{ loading ? 'Analyzing...' : 'Analyze' }}
            </button>
          </div>
        </div>

        <!-- Quick Select -->
        <div class="flex flex-wrap gap-2">
          <span class="text-gray-400 text-sm">Quick:</span>
          <button 
            v-for="token in popularTokens" 
            :key="token.address"
            @click="selectToken(token)"
            class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
          >
            {{ token.symbol }}
          </button>
        </div>
      </div>

      <!-- Results -->
      <div v-if="insiderData" class="space-y-4">
        <!-- Token Info & Risk Score -->
        <div class="bg-gray-800/50 rounded-xl p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-bold text-white">{{ insiderData.tokenName }}</h3>
              <p class="text-gray-400">{{ insiderData.tokenSymbol }} • {{ insiderData.tokenAddress.slice(0, 10) }}...</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold" :class="riskColors.color">
                {{ insiderData.dumpRiskScore }}
              </div>
              <div class="text-gray-400 text-sm">Dump Risk Score</div>
              <div class="mt-2 px-3 py-1 rounded-full text-sm" :class="[riskColors.bg, riskColors.color]">
                {{ insiderData.riskLevel.toUpperCase() }}
              </div>
            </div>
          </div>
          
          <!-- Risk Bar -->
          <div class="mt-4">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-400">Risk Level</span>
              <span :class="riskColors.color">0-100</span>
            </div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                class="h-full transition-all duration-500"
                :class="riskColors.bar"
                :style="{ width: insiderData.dumpRiskScore + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-800/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ formatNumber(insiderData.totalSupply) }}</div>
            <div class="text-gray-400 text-sm">Total Supply</div>
          </div>
          <div class="bg-gray-800/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ formatNumber(insiderData.totalInsiderHoldings) }}</div>
            <div class="text-gray-400 text-sm">Insider Holdings</div>
          </div>
          <div class="bg-gray-800/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold" :class="insiderData.insiderPercentage > 20 ? 'text-red-400' : 'text-green-400'">
              {{ formatPercent(insiderData.insiderPercentage) }}
            </div>
            <div class="text-gray-400 text-sm">Insider %</div>
          </div>
          <div class="bg-gray-800/50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{{ insiderData.insiderWallets.length }}</div>
            <div class="text-gray-400 text-sm">Known Insiders</div>
          </div>
        </div>

        <!-- Insider Wallets Table -->
        <div class="bg-gray-800/50 rounded-xl p-4">
          <h4 class="text-lg font-bold text-white mb-4">🏦 Known Insider Wallets</h4>
          <div v-if="insiderData.insiderWallets.length === 0" class="text-gray-400 text-center py-8">
            No insider wallets found for this token
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-gray-400 text-sm border-b border-gray-700">
                  <th class="text-left py-2 px-2">Type</th>
                  <th class="text-left py-2 px-2">Address</th>
                  <th class="text-left py-2 px-2">Label</th>
                  <th class="text-right py-2 px-2">First Seen</th>
                  <th class="text-right py-2 px-2">Tx Count</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="wallet in insiderData.insiderWallets" :key="wallet.address" 
                    class="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td class="py-2 px-2">
                    <span class="text-lg">{{ getTypeIcon(wallet.type) }}</span>
                  </td>
                  <td class="py-2 px-2 text-blue-400 font-mono text-sm">
                    {{ formatAddress(wallet.address) }}
                  </td>
                  <td class="py-2 px-2 text-white">{{ wallet.label }}</td>
                  <td class="py-2 px-2 text-gray-400 text-right">{{ wallet.firstSeen }}</td>
                  <td class="py-2 px-2 text-gray-400 text-right">{{ formatNumber(wallet.transactionCount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Insider Transactions -->
        <div v-if="insiderData.recentInsiderTransactions.length > 0" class="bg-gray-800/50 rounded-xl p-4">
          <h4 class="text-lg font-bold text-white mb-4">📜 Recent Insider Transactions</h4>
          <div class="space-y-2">
            <div v-for="tx in insiderData.recentInsiderTransactions" :key="tx.hash" 
                 class="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
              <div class="flex items-center gap-3">
                <span :class="tx.type === 'sale' ? 'text-red-400' : 'text-green-400'">
                  {{ tx.type === 'sale' ? '📤' : '📥' }}
                </span>
                <div>
                  <div class="text-white font-mono text-sm">{{ formatAddress(tx.hash) }}</div>
                  <div class="text-gray-400 text-xs">{{ formatTime(tx.timestamp) }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-white font-medium">{{ tx.amount.toFixed(2) }} {{ tx.tokenSymbol }}</div>
                <div class="text-gray-400 text-sm">${{ formatNumber(tx.valueUSD) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-gray-800/30 rounded-xl p-12 text-center">
        <div class="text-4xl mb-4">🎯</div>
        <h3 class="text-xl font-bold text-white mb-2">Analyze Token Insider Risk</h3>
        <p class="text-gray-400">Enter a token address above to analyze insider holdings and dump risk</p>
      </div>
    </div>

    <!-- Top Tokens Tab -->
    <div v-if="activeTab === 'top-tokens'" class="space-y-4">
      <div class="bg-gray-800/50 rounded-xl p-4">
        <h4 class="text-lg font-bold text-white mb-4">🔥 Top Tokens by Insider Activity</h4>
        
        <div class="grid gap-3">
          <div 
            v-for="(token, index) in topTokens" 
            :key="token.token"
            class="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 hover:bg-gray-800/50 cursor-pointer"
            @click="tokenAddress = token.token; analyzeToken()"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl font-bold text-gray-500 w-6">{{ index + 1 }}</span>
              <div>
                <div class="text-white font-medium">{{ token.token.slice(0, 10) }}...</div>
                <div class="text-gray-400 text-sm">{{ token.insiderCount }} insiders tracked</div>
              </div>
            </div>
            <div :class="[
              'px-3 py-1 rounded-full text-sm',
              token.riskLevel === 'critical' ? 'bg-red-500/30 text-red-400' :
              token.riskLevel === 'high' ? 'bg-orange-500/30 text-orange-400' :
              token.riskLevel === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
              'bg-green-500/30 text-green-400'
            ]">
              {{ token.riskLevel }}
            </div>
          </div>
        </div>

        <div v-if="topTokens.length === 0" class="text-center py-8 text-gray-400">
          No data available
        </div>
      </div>
    </div>

    <!-- Search Tab -->
    <div v-if="activeTab === 'search'" class="space-y-4">
      <div class="bg-gray-800/50 rounded-xl p-4 space-y-4">
        <div class="flex gap-4">
          <input 
            v-model="searchQuery"
            @keyup.enter="doSearch"
            placeholder="Search by address, name, or type..."
            class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          />
          <button 
            @click="doSearch"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
          >
            Search
          </button>
        </div>

        <div v-if="searchResults.length > 0" class="space-y-2">
          <div 
            v-for="insider in searchResults" 
            :key="insider.address"
            class="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ getTypeIcon(insider.type) }}</span>
              <div>
                <div class="text-white font-medium">{{ insider.label }}</div>
                <div class="text-gray-400 text-sm font-mono">{{ formatAddress(insider.address) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-gray-400 text-sm capitalize">{{ insider.type }}</div>
              <div class="text-gray-500 text-xs">{{ insider.transactionCount }} txs</div>
            </div>
          </div>
        </div>

        <div v-else-if="searchQuery" class="text-center py-8 text-gray-400">
          No results found
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input:focus, select:focus {
  outline: none;
  border-color: #3b82f6;
}
</style>
