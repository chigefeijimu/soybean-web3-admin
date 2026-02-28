<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWeb3, ERC20_ABI, COMMON_TOKENS } from '@/composables/web3/useWeb3'

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
  updateBalance,
} = useWeb3()

const activeTab = ref('dashboard')
const error = ref('')
const tokenBalance = ref('0')
const selectedToken = ref('')

// Connect wallet
const handleConnect = async () => {
  error.value = ''
  try {
    await connectWallet()
  } catch (e: any) {
    error.value = e.message || 'Failed to connect wallet'
  }
}

// Switch network
const handleSwitchChain = async (targetChainId: number) => {
  error.value = ''
  try {
    await switchChain(targetChainId)
  } catch (e: any) {
    error.value = e.message || 'Failed to switch network'
  }
}

// Get token balance
const getTokenBalance = async (tokenAddress: string) => {
  if (!account.value || !(window.ethereum as any)) return
  
  try {
    const response = await (window.ethereum as any).request({
      method: 'eth_call',
      params: [{
        to: tokenAddress,
        data: '0x70a08231' + account.value.slice(2).padStart(64, '0') // balanceOf(address)
      }, 'latest']
    })
    
    const balance = parseInt(response, 16) / 1e18
    tokenBalance.value = balance.toFixed(4)
    selectedToken.value = tokenAddress
  } catch (e) {
    console.error('Failed to get token balance:', e)
    tokenBalance.value = '0'
  }
}

// Send transaction (simplified)
const sendTransaction = async () => {
  error.value = ''
  if (!account.value) {
    error.value = 'Please connect wallet first'
    return
  }
  
  // For demo purposes, just show a message
  error.value = 'Transaction simulation: This feature requires a recipient address'
}

const supportedChains = Object.entries(CHAIN_INFO).map(([id, info]) => ({
  id: parseInt(id),
  ...info,
}))

onMounted(() => {
  // Auto-connect if previously connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    connectWallet()
  }
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Web3 Dashboard</h1>
    
    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {{ error }}
      <button @click="error = ''" class="ml-2 text-red-500 hover:text-red-700">✕</button>
    </div>
    
    <!-- Network Status Banner -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-gray-400'"></span>
          <span class="font-medium">
            {{ isConnected ? 'Connected' : 'Not Connected' }}
          </span>
        </div>
        <div v-if="isConnected" class="text-sm text-gray-600">
          Chain: {{ chainInfo.name }} ({{ chainId }})
        </div>
      </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-[var(--n-card-color)] rounded-lg p-4 shadow-sm border border-[var(--n-border-color)]">
        <div class="text-[var(--n-text-color-3)] text-sm">Total Balance</div>
        <div class="text-2xl font-bold mt-1">{{ balance }} {{ chainInfo.symbol }}</div>
      </div>
      <div class="bg-[var(--n-card-color)] rounded-lg p-4 shadow-sm border border-[var(--n-border-color)]">
        <div class="text-[var(--n-text-color-3)] text-sm">Connected Wallet</div>
        <div class="text-lg font-mono mt-1">{{ isConnected ? formatAddress(account) : '---' }}</div>
      </div>
      <div class="bg-[var(--n-card-color)] rounded-lg p-4 shadow-sm border border-[var(--n-border-color)]">
        <div class="text-[var(--n-text-color-3)] text-sm">Network</div>
        <div class="text-lg font-medium mt-1">{{ chainInfo.name }}</div>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="mb-6 flex gap-2 border-b border-[var(--n-border-color)]">
      <button 
        v-for="tab in ['dashboard', 'wallet', 'tokens', 'transactions']" 
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 font-medium transition-colors"
        :class="activeTab === tab 
          ? 'text-blue-500 border-b-2 border-blue-500' 
          : 'text-[var(--n-text-color-3)] hover:text-[var(--n-text-color-1)]'"
      >
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </div>
    
    <!-- Dashboard Tab -->
    <div v-if="activeTab === 'dashboard'" class="space-y-4">
      <div class="bg-[var(--n-card-color)] rounded-lg p-6 shadow-sm border border-[var(--n-border-color)]">
        <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
        <div class="flex flex-wrap gap-3">
          <button 
            @click="handleConnect"
            :disabled="isConnecting"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {{ isConnecting ? 'Connecting...' : (isConnected ? 'Reconnect Wallet' : 'Connect Wallet (MetaMask)') }}
          </button>
          
          <button 
            v-if="isConnected"
            @click="disconnectWallet"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Disconnect
          </button>
          
          <button 
            @click="activeTab = 'tokens'"
            :disabled="!isConnected"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            Add Token
          </button>
          
          <button 
            @click="activeTab = 'wallet'"
            class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            View Portfolio
          </button>
          
          <button 
            @click="activeTab = 'transactions'"
            :disabled="!isConnected"
            class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            Transaction History
          </button>
        </div>
      </div>
      
      <div v-if="isConnected" class="bg-[var(--n-card-color)] rounded-lg p-6 shadow-sm border border-[var(--n-border-color)]">
        <h2 class="text-lg font-semibold mb-4">Switch Network</h2>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="chain in supportedChains" 
            :key="chain.id"
            @click="handleSwitchChain(chain.id)"
            :disabled="chainId === chain.id"
            class="px-3 py-1 text-sm rounded border transition-colors"
            :class="chainId === chain.id 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-[var(--n-card-color)] text-[var(--n-text-color-2)] border-[var(--n-border-color)] hover:border-blue-400'"
          >
            {{ chain.name }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Wallet Tab -->
    <div v-if="activeTab === 'wallet'" class="space-y-4">
      <div class="bg-[var(--n-card-color)] rounded-lg p-6 shadow-sm border border-[var(--n-border-color)]">
        <h2 class="text-lg font-semibold mb-4">Wallet Details</h2>
        
        <div v-if="isConnected" class="space-y-3">
          <div class="flex justify-between py-2 border-b border-[var(--n-border-color)]">
            <span class="text-[var(--n-text-color-3)]">Address</span>
            <span class="font-mono text-sm">{{ account }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-[var(--n-border-color)]">
            <span class="text-[var(--n-text-color-3)]">Balance</span>
            <span class="font-medium">{{ balance }} {{ chainInfo.symbol }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-[var(--n-border-color)]">
            <span class="text-[var(--n-text-color-3)]">Chain ID</span>
            <span class="font-medium">{{ chainId }} ({{ chainInfo.name }})</span>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <p class="text-[var(--n-text-color-3)] mb-4">Connect your wallet to see details</p>
          <button 
            @click="handleConnect"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
    
    <!-- Tokens Tab -->
    <div v-if="activeTab === 'tokens'" class="space-y-4">
      <div class="bg-[var(--n-card-color)] rounded-lg p-6 shadow-sm border border-[var(--n-border-color)]">
        <h2 class="text-lg font-semibold mb-4">Token Balances</h2>
        
        <div v-if="isConnected && COMMON_TOKENS[chainId]" class="space-y-3">
          <div 
            v-for="token in COMMON_TOKENS[chainId]" 
            :key="token.address"
            class="flex justify-between items-center py-3 border-b border-[var(--n-border-color)]"
          >
            <div>
              <div class="font-medium">{{ token.symbol }}</div>
              <div class="text-sm text-[var(--n-text-color-3)]">{{ token.name }}</div>
            </div>
            <button 
              @click="getTokenBalance(token.address)"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Balance
            </button>
          </div>
          
          <div v-if="selectedToken" class="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            Token Balance: {{ tokenBalance }}
          </div>
        </div>
        
        <div v-else-if="!isConnected" class="text-center py-8">
          <p class="text-[var(--n-text-color-3)]">Connect wallet to view tokens</p>
        </div>
        
        <div v-else class="text-center py-8">
          <p class="text-[var(--n-text-color-3)]">No tokens found for this network</p>
        </div>
      </div>
    </div>
    
    <!-- Transactions Tab -->
    <div v-if="activeTab === 'transactions'" class="space-y-4">
      <div class="bg-[var(--n-card-color)] rounded-lg p-6 shadow-sm border border-[var(--n-border-color)]">
        <h2 class="text-lg font-semibold mb-4">Transaction History</h2>
        
        <div v-if="isConnected" class="space-y-3">
          <p class="text-[var(--n-text-color-3)] mb-4">
            View your transaction history on 
            <a 
              :href="`${chainInfo.explorer}/address/${account}`" 
              target="_blank"
              class="text-blue-500 hover:underline"
            >
              {{ chainInfo.explorer }}
            </a>
          </p>
          
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm text-[var(--n-text-color-3)]">
              Transaction history requires an external explorer API or indexer. 
              Click the link above to view on block explorer.
            </p>
          </div>
        </div>
        
        <div v-else class="text-center py-8">
          <p class="text-[var(--n-text-color-3)]">Connect wallet to view transactions</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Using CSS variables that naive-ui provides */
</style>
