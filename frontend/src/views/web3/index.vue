<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';
// Import all components
import WalletConnect from '@/components/web3/WalletConnect.vue';
import ContractCall from '@/components/web3/ContractCall.vue';
import TransactionHistory from '@/components/web3/TransactionHistory.vue';
import PortfolioDashboard from '@/components/web3/PortfolioDashboard.vue';
import TokenSwap from '@/components/web3/TokenSwap.vue';
import NFTGallery from '@/components/web3/NFTGallery.vue';
import BlockExplorer from '@/components/web3/BlockExplorer.vue';
import TradingChart from '@/components/web3/TradingChart.vue';
import TradingPanel from '@/components/web3/TradingPanel.vue';
import MarketOverview from '@/components/web3/MarketOverview.vue';
import PriceTicker from '@/components/web3/PriceTicker.vue';
import OrderBook from '@/components/web3/OrderBook.vue';
import TokenSearch from '@/components/web3/TokenSearch.vue';
import WhaleTracker from '@/components/web3/WhaleTracker.vue';
import NotificationCenter from '@/components/web3/NotificationCenter.vue';
import GasTracker from '@/components/web3/GasTracker.vue';
import BridgePanel from '@/components/web3/BridgePanel.vue';
import PortfolioAnalytics from '@/components/web3/PortfolioAnalytics.vue';
import TokenAnalyzer from '@/components/web3/TokenAnalyzer.vue';
import GasPrediction from '@/components/web3/GasPrediction.vue';
import MevProtection from '@/components/web3/MevProtection.vue';
import TokenSafetyChecker from '@/components/web3/TokenSafetyChecker.vue';
import GasSaver from '@/components/web3/GasSaver.vue';
import EnsLookup from '@/components/web3/EnsLookup.vue';
import TokenGrapher from '@/components/web3/TokenGrapher.vue';
import WalletLookup from '@/components/web3/WalletLookup.vue';
import DaoGovernance from '@/components/web3/DaoGovernance.vue';
import SignatureVerifier from '@/components/web3/SignatureVerifier.vue';
import TokenApprovalManager from '@/components/web3/TokenApprovalManager.vue';
import WalletHealthAnalyzer from '@/components/web3/WalletHealthAnalyzer.vue';
import YieldTracker from '@/components/web3/YieldTracker.vue';
import NftRarityAnalyzer from '@/components/web3/NftRarityAnalyzer.vue';
import OnChainAnalytics from '@/components/web3/OnChainAnalytics.vue';
import TokenWatchlist from '@/components/web3/TokenWatchlist.vue';
import TransactionSimulator from '@/components/web3/TransactionSimulator.vue';
import CrossChainDashboard from '@/components/web3/CrossChainDashboard.vue';
import ContractDeployer from '@/components/web3/ContractDeployer.vue';
import EventExplorer from '@/components/web3/EventExplorer.vue';
import GasOptimizer from '@/components/web3/GasOptimizer.vue';
import BatchTransfer from '@/components/web3/BatchTransfer.vue';
import TxDecoder from '@/components/web3/TxDecoder.vue';
import DefiExplorer from '@/components/web3/DefiExplorer.vue';
import AddressBook from '@/components/web3/AddressBook.vue';
import DefiPositions from '@/components/web3/DefiPositions.vue';
import Web3News from '@/components/web3/Web3News.vue';
import AirdropTracker from '@/components/web3/AirdropTracker.vue';
import LiquidityPoolScanner from '@/components/web3/LiquidityPoolScanner.vue';
import NftFloorTracker from '@/components/web3/NftFloorTracker.vue';
import TokenPriceChart from '@/components/web3/TokenPriceChart.vue';
import BlockchainHeatmap from '@/components/web3/BlockchainHeatmap.vue';
import GasFaucet from '@/components/web3/GasFaucet.vue';

const { isConnected, account, chainId, balance, chainInfo, connectWallet, switchChain, CHAIN_INFO } = useWeb3();

// Tab management
const activeTab = ref('dashboard');
const error = ref('');

// Stats
const stats = computed(() => ({
  totalBalance: balance.value || '0',
  walletAddress: account.value || '',
  network: chainInfo.value?.name || 'Unknown'
}));

// Tab configuration with icons
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'wallet', label: 'Wallet', icon: '💳' },
  { id: 'lookup', label: 'Lookup', icon: '🔍' },
  { id: 'swap', label: 'Swap', icon: '⇄' },
  { id: 'dao', label: 'DAO', icon: '🏛️' },
  { id: 'market', label: 'Market', icon: '🔥' },
  { id: 'orderbook', label: 'Order Book', icon: '📋' },
  { id: 'whale', label: 'Whale', icon: '🐋' },
  { id: 'bridge', label: 'Bridge', icon: '🌉' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'analyzer', label: 'Analyzer', icon: '🔍' },
  { id: 'gas', label: 'Gas', icon: '⏳' },
  { id: 'gas-optimizer', label: 'Gas Opt', icon: '🎯' },
  { id: 'mev', label: 'MEV', icon: '🛡️' },
  { id: 'safety', label: 'Safety', icon: '✅' },
  { id: 'saver', label: 'Saver', icon: '💰' },
  { id: 'ens', label: 'ENS', icon: '🔤' },
  { id: 'grapher', label: 'Grapher', icon: '🕸️' },
  { id: 'book', label: 'Book', icon: '📒' },
  { id: 'positions', label: 'Positions', icon: '📋' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'airdrop', label: 'Airdrop', icon: '🎁' },
  { id: 'tokens', label: 'Tokens', icon: '🪙' },
  { id: 'nfts', label: 'NFTs', icon: '🖼️' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'contracts', label: 'Contracts', icon: '📝' },
  { id: 'explorer', label: 'Explorer', icon: '🔎' },
  { id: 'trading', label: 'Trading', icon: '📈' },
  { id: 'signature', label: 'Signature', icon: '🔏' },
  { id: 'approvals', label: 'Approvals', icon: '🔐' },
  { id: 'health', label: 'Health', icon: '🛡️' },
  { id: 'yield', label: 'Yield', icon: '🌾' },
  { id: 'rarity', label: 'Rarity', icon: '💎' },
  { id: 'onchain', label: 'On-chain', icon: '🔗' },
  { id: 'watchlist', label: 'Watchlist', icon: '👀' },
  { id: 'simulator', label: 'Simulator', icon: '🔮' },
  { id: 'crosschain', label: 'Cross-Chain', icon: '🌐' },
  { id: 'deployer', label: 'Deployer', icon: '🚀' },
  { id: 'events', label: 'Events', icon: '📡' },
  { id: 'batch', label: 'Batch', icon: '📤' },
  { id: 'decoder', label: 'Decoder', icon: '🔓' },
  { id: 'defi', label: 'DeFi', icon: '🧪' },
  { id: 'addressbook', label: 'Address Book', icon: '📒' },
  { id: 'liquidity', label: 'Liquidity', icon: '💧' },
  { id: 'floor', label: 'Floor', icon: '📉' },
  { id: 'pricechart', label: 'Price', icon: '📈' },
  { id: 'heatmap', label: 'Heatmap', icon: '🔥' },
  { id: 'faucet', label: 'Faucet', icon: '⛽' }
];

// Supported networks with logos
const networks = Object.entries(CHAIN_INFO).map(([id, info]) => ({
  id: Number.parseInt(id, 10),
  name: info.name,
  symbol: info.symbol,
  logo: getNetworkLogo(Number.parseInt(id, 10))
}));

function getNetworkLogo(networkChainId: number): string {
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
    84531: '⚫'
  };
  return logos[networkChainId] || '⚪';
}

// Network switching
const handleSwitchNetwork = async (newChainId: number) => {
  error.value = '';
  try {
    await switchChain(newChainId);
  } catch (e: any) {
    error.value = e.message || 'Failed to switch network';
  }
};

// Quick actions
const quickActions = [
  { id: 'send', label: 'Send', icon: '↑', color: 'blue', action: () => (activeTab.value = 'wallet') },
  { id: 'receive', label: 'Receive', icon: '↓', color: 'green', action: () => (activeTab.value = 'wallet') },
  { id: 'swap', label: 'Swap', icon: '⇄', color: 'purple', action: () => (activeTab.value = 'swap') },
  { id: 'buy', label: 'Buy', icon: '💳', color: 'orange', action: () => {} }
];

// DeFi protocols
const defiProtocols = [
  { name: 'Uniswap', logo: '🦄', tvl: '$4.2B', apy: '3-15%' },
  { name: 'Aave', logo: '👻', tvl: '$12B', apy: '2-8%' },
  { name: 'Compound', logo: '🔷', tvl: '$2.1B', apy: '2-5%' },
  { name: 'Curve', logo: '💚', tvl: '$3.8B', apy: '2-10%' }
];

// Trending tokens
const trendingTokens = [
  { symbol: 'ETH', name: 'Ethereum', price: 2500, change: '+2.5%', logo: '🔷' },
  { symbol: 'BTC', name: 'Bitcoin', price: 62500, change: '+1.8%', logo: '🟡' },
  { symbol: 'SOL', name: 'Solana', price: 120, change: '+5.2%', logo: '🟣' },
  { symbol: 'ARB', name: 'Arbitrum', price: 1.8, change: '+3.1%', logo: '🔵' }
];

// On mount
onMounted(() => {
  // Auto-connect check
  if (window.ethereum?.selectedAddress) {
    connectWallet();
  }
});
</script>

<template>
  <div class="min-h-screen from-slate-900 via-purple-900 to-slate-900 bg-gradient-to-br p-4 text-white lg:p-6">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1
          class="from-blue-400 to-purple-400 bg-gradient-to-r bg-clip-text text-2xl text-transparent font-bold lg:text-3xl"
        >
          Web3 Dashboard
        </h1>
        <p class="mt-1 text-sm text-slate-400">Manage your crypto assets & DeFi</p>
      </div>

      <!-- Notification Center -->
      <NotificationCenter />

      <!-- Network Selector -->
      <div class="flex items-center gap-3">
        <select
          :value="chainId"
          class="border border-slate-700 rounded-lg bg-slate-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          @change="handleSwitchNetwork(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="network in networks" :key="network.id" :value="network.id">
            {{ network.logo }} {{ network.name }}
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

    <!-- Quick Stats Banner -->
    <div v-if="isConnected" class="grid grid-cols-2 mb-6 gap-4 lg:grid-cols-4">
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Balance</p>
        <p class="text-xl text-green-400 font-bold">{{ parseFloat(stats.totalBalance).toFixed(4) }} ETH</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Network</p>
        <p class="text-lg font-semibold">{{ stats.network }}</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Gas</p>
        <p class="text-lg text-yellow-400 font-semibold">15 Gwei</p>
      </div>
      <div class="border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 backdrop-blur-xl">
        <p class="text-xs text-slate-400">Status</p>
        <p class="text-lg text-green-400 font-semibold">● Online</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <TokenSearch />
    </div>

    <!-- Tab Navigation -->
    <div class="mb-6 flex gap-2 overflow-x-auto pb-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="[
          activeTab === tab.id
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
        ]"
        @click="activeTab = tab.id"
      >
        <span class="mr-2">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Dashboard Tab -->
        <div v-show="activeTab === 'dashboard'" class="space-y-6">
          <!-- Quick Actions -->
          <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
            <h2 class="mb-4 text-xl font-semibold">Quick Actions</h2>
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button
                v-for="action in quickActions"
                :key="action.id"
                class="flex flex-col items-center gap-2 rounded-xl bg-slate-700/50 p-4 transition-all hover:scale-105 hover:bg-slate-700"
                @click="action.action"
              >
                <span class="text-2xl">{{ action.icon }}</span>
                <span class="text-sm">{{ action.label }}</span>
              </button>
            </div>
          </div>

          <!-- Trending Tokens -->
          <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
            <h2 class="mb-4 text-xl font-semibold">🔥 Trending Tokens</h2>
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div v-for="token in trendingTokens" :key="token.symbol" class="rounded-xl bg-slate-900/50 p-3">
                <div class="mb-2 flex items-center gap-2">
                  <span class="text-xl">{{ token.logo }}</span>
                  <span class="font-semibold">{{ token.symbol }}</span>
                </div>
                <p class="text-sm text-slate-400">{{ token.name }}</p>
                <p class="mt-1 font-semibold">${{ token.price.toLocaleString() }}</p>
                <p class="text-xs text-green-400">{{ token.change }}</p>
              </div>
            </div>
          </div>

          <!-- DeFi Protocols -->
          <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
            <h2 class="mb-4 text-xl font-semibold">🌊 DeFi Protocols</h2>
            <div class="space-y-3">
              <div
                v-for="protocol in defiProtocols"
                :key="protocol.name"
                class="flex cursor-pointer items-center justify-between rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50"
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
          <div
            v-if="!isConnected"
            class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-xl"
          >
            <div class="mb-4 text-6xl">🔗</div>
            <p class="mb-6 text-slate-400">Connect your wallet to access all features</p>
            <button
              class="rounded-xl from-blue-500 to-purple-500 bg-gradient-to-r px-8 py-3 font-semibold transition-all hover:scale-105 hover:from-blue-600 hover:to-purple-600"
              @click="connectWallet"
            >
              Connect Wallet
            </button>
          </div>
        </div>

        <!-- Wallet Tab -->
        <div v-show="activeTab === 'wallet'">
          <component :is="markRaw(WalletConnect)" />
        </div>

        <!-- Lookup Tab -->
        <div v-show="activeTab === 'lookup'">
          <component :is="markRaw(WalletLookup)" />
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

        <!-- Trading Tab -->
        <div v-show="activeTab === 'trading'" class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <TradingChart />
          </div>
          <div>
            <TradingPanel />
          </div>
        </div>

        <!-- Market Tab -->
        <div v-show="activeTab === 'market'">
          <MarketOverview />
        </div>

        <!-- Order Book Tab -->
        <div v-show="activeTab === 'orderbook'" class="grid gap-6 lg:grid-cols-2">
          <OrderBook />
          <div>
            <PriceTicker />
          </div>
        </div>

        <!-- Whale Tab -->
        <div v-show="activeTab === 'whale'">
          <WhaleTracker />
        </div>

        <!-- Bridge Tab -->
        <div v-show="activeTab === 'bridge'">
          <BridgePanel />
        </div>

        <!-- DAO Tab -->
        <div v-show="activeTab === 'dao'">
          <DaoGovernance />
        </div>

        <!-- Analytics Tab -->
        <div v-show="activeTab === 'analytics'">
          <PortfolioAnalytics />
        </div>

        <!-- Analyzer Tab -->
        <div v-show="activeTab === 'analyzer'">
          <TokenAnalyzer />
        </div>

        <!-- Gas Prediction Tab -->
        <div v-show="activeTab === 'gas'">
          <GasPrediction />
        </div>

        <!-- Gas Optimizer Tab -->
        <div v-show="activeTab === 'gas-optimizer'">
          <GasOptimizer />
        </div>

        <!-- MEV Tab -->
        <div v-show="activeTab === 'mev'">
          <MevProtection />
        </div>

        <!-- Safety Tab -->
        <div v-show="activeTab === 'safety'">
          <TokenSafetyChecker />
        </div>

        <!-- Saver Tab -->
        <div v-show="activeTab === 'saver'">
          <GasSaver />
        </div>

        <!-- ENS Tab -->
        <div v-show="activeTab === 'ens'">
          <EnsLookup />
        </div>

        <!-- Grapher Tab -->
        <div v-show="activeTab === 'grapher'">
          <TokenGrapher />
        </div>

        <!-- Book Tab -->
        <div v-show="activeTab === 'book'">
          <AddressBook />
        </div>

        <!-- Positions Tab -->
        <div v-show="activeTab === 'positions'">
          <DefiPositions />
        </div>

        <!-- News Tab -->
        <div v-show="activeTab === 'news'">
          <Web3News />
        </div>

        <!-- Airdrop Tab -->
        <div v-show="activeTab === 'airdrop'">
          <AirdropTracker />
        </div>

        <!-- Signature Verifier Tab -->
        <div v-show="activeTab === 'signature'">
          <SignatureVerifier />
        </div>

        <!-- Token Approval Manager Tab -->
        <div v-show="activeTab === 'approvals'">
          <TokenApprovalManager />
        </div>

        <!-- Wallet Health Tab -->
        <div v-show="activeTab === 'health'">
          <WalletHealthAnalyzer />
        </div>

        <!-- Yield Tracker Tab -->
        <div v-show="activeTab === 'yield'">
          <YieldTracker />
        </div>

        <!-- NFT Rarity Tab -->
        <div v-show="activeTab === 'rarity'">
          <NftRarityAnalyzer />
        </div>

        <!-- On-chain Analytics Tab -->
        <div v-show="activeTab === 'onchain'">
          <OnChainAnalytics />
        </div>

        <!-- Watchlist Tab -->
        <div v-show="activeTab === 'watchlist'">
          <TokenWatchlist />
        </div>

        <!-- Simulator Tab -->
        <div v-show="activeTab === 'simulator'">
          <TransactionSimulator />
        </div>

        <!-- Cross-Chain Tab -->
        <div v-show="activeTab === 'crosschain'">
          <CrossChainDashboard />
        </div>

        <!-- Deployer Tab -->
        <div v-show="activeTab === 'deployer'">
          <ContractDeployer />
        </div>

        <!-- Events Tab -->
        <div v-show="activeTab === 'events'">
          <EventExplorer />
        </div>

        <!-- Batch Transfer Tab -->
        <div v-show="activeTab === 'batch'">
          <BatchTransfer />
        </div>

        <!-- Decoder Tab -->
        <div v-show="activeTab === 'decoder'">
          <TxDecoder />
        </div>

        <!-- DeFi Tab -->
        <div v-show="activeTab === 'defi'">
          <component :is="markRaw(DefiExplorer)" />
        </div>

        <!-- Address Book Tab -->
        <div v-show="activeTab === 'addressbook'">
          <component :is="markRaw(AddressBook)" />
        </div>

        <!-- Liquidity Pool Tab -->
        <div v-show="activeTab === 'liquidity'">
          <component :is="markRaw(LiquidityPoolScanner)" />
        </div>

        <!-- NFT Floor Tracker Tab -->
        <div v-show="activeTab === 'floor'">
          <component :is="markRaw(NftFloorTracker)" />
        </div>

        <!-- Price Chart Tab -->
        <div v-show="activeTab === 'pricechart'">
          <component :is="markRaw(TokenPriceChart)" />
        </div>

        <!-- Blockchain Heatmap Tab -->
        <div v-show="activeTab === 'heatmap'">
          <component :is="markRaw(BlockchainHeatmap)" />
        </div>

        <!-- Gas Faucet Tab -->
        <div v-show="activeTab === 'faucet'">
          <component :is="markRaw(GasFaucet)" />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Gas Tracker -->
        <GasTracker />

        <!-- Market Stats -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h2 class="mb-4 text-lg font-semibold">📈 Market</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">ETH Price</span>
              <span class="font-semibold">$2,500 (+2.5%)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">BTC Price</span>
              <span class="font-semibold">$62,500 (+1.8%)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Gas</span>
              <span class="font-semibold">15 Gwei</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">TVL</span>
              <span class="font-semibold">$45.2B</span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
          <h2 class="mb-4 text-lg font-semibold">🔗 Quick Links</h2>
          <div class="space-y-2">
            <a
              href="https://uniswap.org"
              target="_blank"
              rel="noopener noreferrer"
              class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700"
            >
              🦄 Uniswap
            </a>
            <a
              href="https://opensea.io"
              target="_blank"
              rel="noopener noreferrer"
              class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700"
            >
              🖼️ OpenSea
            </a>
            <a
              href="https://etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700"
            >
              📄 Etherscan
            </a>
            <a
              href="https://arbiscan.io"
              target="_blank"
              rel="noopener noreferrer"
              class="block rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-700"
            >
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
