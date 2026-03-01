<script setup lang="ts">
import { ref, onMounted, computed, markRaw } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'

// Import all components
import WalletConnect from '@/components/web3/WalletConnect.vue'
import ContractCall from '@/components/web3/ContractCall.vue'
import TransactionHistory from '@/components/web3/TransactionHistory.vue'
import PortfolioDashboard from '@/components/web3/PortfolioDashboard.vue'
import TokenSwap from '@/components/web3/TokenSwap.vue'
import NFTGallery from '@/components/web3/NFTGallery.vue'
import AddTokenModal from '@/components/web3/AddTokenModal.vue'
import BlockExplorer from '@/components/web3/BlockExplorer.vue'

const {
  isConnected,
  account,
  chainId,
  balance,
  chainInfo,
  connectWallet,
  disconnectWallet,
  switchChain,
  CHAIN_INFO,
} = useWeb3()

// Tab management
const activeTab = ref('dashboard')
const error = ref('')
const showAddToken = ref(false)

// Stats
const stats = computed(() => ({
  totalBalance: balance.value || '0',
  walletAddress: account.value || '',
  network: chainInfo.value?.name || 'Unknown',
}))

// Tab configuration with icons
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'wallet', label: 'Wallet', icon: '💳' },
  { id: 'swap', label: 'Swap', icon: '⇄' },
  { id: 'tokens', label: 'Tokens', icon: '🪙' },
  { id: 'nfts', label: 'NFTs', icon: '🖼️' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'contracts', label: 'Contracts', icon: '📝' },
  { id: 'explorer', label: 'Explorer', icon: '🔍' },
]

// Supported networks with logos
const networks = Object.entries(CHAIN_INFO).map(([id, info]) => ({
  id: parseInt(id),
  name: info.name,
  symbol: info.symbol,
  logo: getNetworkLogo(parseInt(id)),
}))

function getNetworkLogo(chainId: number): string {
  const logos: Record<number, string> = {
    1: '🔷',
    5: '🔷',
    11155111: '🔷',
    137: '🟣',
    80001: '🟣',
    42161: '🔵',
    421613: '🔵',
    56: '🟡',
    97: '🟡',
    10: '🟠',
    69: '🟠',
    8453: '⚫',
    84531: '⚫',
  }
  return logos[chainId] || '⚪'
}

// Network switching
const handleSwitchNetwork = async (chainId: number) => {
  error.value = ''
  try {
    await switchChain(chainId)
  } catch (e: any) {
    error.value = e.message || 'Failed to switch network'
  }
}

// Quick actions
const quickActions = [
  { id: 'send', label: 'Send', icon: '↑', color: 'blue', action: () => activeTab.value = 'wallet' },
  { id: 'receive', label: 'Receive', icon: '↓', color: 'green', action: () => activeTab.value = 'wallet' },
  { id: 'swap', label: 'Swap', icon: '⇄', color: 'purple', action: () => activeTab.value = 'swap' },
  { id: 'buy', label: 'Buy', icon: '💳', color: 'orange', action: () => {} },
]

// DeFi protocols
const defiProtocols = [
  { name: 'Uniswap', logo: '🦄', tvl: '$4.2B', apy: '3-15%' },
  { name: 'Aave', logo: '👻', tvl: '$12B', apy: '2-8%' },
  { name: 'Compound', logo: '🔷', tvl: '$2.1B', apy: '2-5%' },
  { name: 'Curve', logo: '💚', tvl: '$3.8B', apy: '2-10%' },
]

// Trending tokens
const trendingTokens = [
  { symbol: 'ETH', name: 'Ethereum', price: 2500, change: '+2.5%', logo: '🔷' },
  { symbol: 'BTC', name: 'Bitcoin', price: 62500, change: '+1.8%', logo: '🟡' },
  { symbol: 'SOL', name: 'Solana', price: 120, change: '+5.2%', logo: '🟣' },
  { symbol: 'ARB', name: 'Arbitrum', price: 1.8, change: '+3.1%', logo: '🔵' },
]

// On mount
onMounted(() => {
  // Auto-connect check
  if (window.ethereum?.selectedAddress) {
    connectWallet()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 lg:p-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Web3 Dashboard
        </h1>
        <p class="text-slate-400 text-sm mt-1">Manage your crypto assets & DeFi</p>
      </div>
      
      <!-- Network Selector -->
      <div class="flex items-center gap-3">
        <select 
          :value="chainId" 
          @change="handleSwitchNetwork(Number(($event.target as HTMLSelectElement).value))"
          class="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option v-for="network in networks" :key="network.id" :value="network.id">
            {{ network.logo }} {{ network.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex justify-between items-center">
      <span class="text-red-300">{{ error }}</span>
      <button @click="error = ''" class="text-red-400 hover:text-white">✕</button>
    </div>

    <!-- Quick Stats Banner -->
    <div v-if="isConnected" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
        <p class="text-slate-400 text-xs">Balance</p>
        <p class="text-xl font-bold text-green-400">{{ parseFloat(stats.totalBalance).toFixed(4) }} ETH</p>
      </div>
      <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
        <p class="text-slate-400 text-xs">Network</p>
        <p class="text-lg font-semibold">{{ stats.network }}</p>
      </div>
      <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
        <p class="text-slate-400 text-xs">Gas</p>
        <p class="text-lg font-semibold text-yellow-400">15 Gwei</p>
      </div>
      <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50">
        <p class="text-slate-400 text-xs">Status</p>
        <p class="text-lg font-semibold text-green-400">● Online</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 overflow-x-auto pb-4 mb-6">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
          activeTab === tab.id 
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
        ]"
      >
        <span class="mr-2">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Dashboard Tab -->
        <div v-show="activeTab === 'dashboard'" class="space-y-6">
          <!-- Quick Actions -->
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button 
                v-for="action in quickActions" 
                :key="action.id"
                @click="action.action"
                class="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-2"
              >
                <span class="text-2xl">{{ action.icon }}</span>
                <span class="text-sm">{{ action.label }}</span>
              </button>
            </div>
          </div>

          <!-- Trending Tokens -->
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 class="text-xl font-semibold mb-4">🔥 Trending Tokens</h2>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div 
                v-for="token in trendingTokens" 
                :key="token.symbol"
                class="p-3 bg-slate-900/50 rounded-xl"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xl">{{ token.logo }}</span>
                  <span class="font-semibold">{{ token.symbol }}</span>
                </div>
                <p class="text-sm text-slate-400">{{ token.name }}</p>
                <p class="font-semibold mt-1">${{ token.price.toLocaleString() }}</p>
                <p class="text-xs text-green-400">{{ token.change }}</p>
              </div>
            </div>
          </div>

          <!-- DeFi Protocols -->
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 class="text-xl font-semibold mb-4">🌊 DeFi Protocols</h2>
            <div class="space-y-3">
              <div 
                v-for="protocol in defiProtocols" 
                :key="protocol.name"
                class="p-4 bg-slate-900/50 rounded-xl flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ protocol.logo }}</span>
                  <div>
                    <p class="font-semibold">{{ protocol.name }}</p>
                    <p class="text-xs text-slate-400">TVL: {{ protocol.tvl }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-slate-400">APY</p>
                  <p class="text-green-400 font-semibold">{{ protocol.apy }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Not Connected State -->
          <div v-if="!isConnected" class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
            <div class="text-6xl mb-4">🔗</div>
            <p class="text-slate-400 mb-6">Connect your wallet to access all features</p>
            <button 
              @click="connectWallet"
              class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Connect Wallet
            </button>
          </div>
        </div>

        <!-- Wallet Tab -->
        <div v-show="activeTab === 'wallet'">
          <component :is="markRaw(WalletConnect)" />
        </div>

        <!-- Swap Tab -->
        <div v-show="activeTab === 'swap'">
          <component :is="markRaw(TokenSwap)" />
        </div>

        <!-- Tokens Tab -->
        <div v-show="activeTab === 'tokens'">
          <component :is="markRaw(PortfolioDashboard)" />
        </div>

        <!-- NFTs Tab -->
        <div v-show="activeTab === 'nfts'">
          <component :is="markRaw(NFTGallery)" />
        </div>

        <!-- History Tab -->
        <div v-show="activeTab === 'history'">
          <component :is="markRaw(TransactionHistory)" />
        </div>

        <!-- Contracts Tab -->
        <div v-show="activeTab === 'contracts'">
          <component :is="markRaw(ContractCall)" />
        </div>

        <!-- Explorer Tab -->
        <div v-show="activeTab === 'explorer'">
          <component :is="markRaw(BlockExplorer)" />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Gas Tracker -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold mb-4">⛽ Gas Tracker</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Slow</span>
              <span class="text-green-400">5 Gwei</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Normal</span>
              <span class="text-yellow-400">15 Gwei</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Fast</span>
              <span class="text-red-400">30 Gwei</span>
            </div>
          </div>
        </div>

        <!-- Market Stats -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold mb-4">📈 Market</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">ETH Price</span>
              <span class="font-semibold">$2,500 (+2.5%)</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">BTC Price</span>
              <span class="font-semibold">$62,500 (+1.8%)</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Gas</span>
              <span class="font-semibold">15 Gwei</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">TVL</span>
              <span class="font-semibold">$45.2B</span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold mb-4">🔗 Quick Links</h2>
          <div class="space-y-2">
            <a href="https://uniswap.org" target="_blank" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              🦄 Uniswap
            </a>
            <a href="https://opensea.io" target="_blank" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              🖼️ OpenSea
            </a>
            <a href="https://etherscan.io" target="_blank" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              📄 Etherscan
            </a>
            <a href="https://arbiscan.io" target="_blank" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              🔵 Arbitrum Scan
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
.from-slate-900 { --tw-gradient-from: #0f172a; }
.via-purple-900 { --tw-gradient-via: #581c87; }
.to-slate-900 { --tw-gradient-to: #0f172a; }
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
