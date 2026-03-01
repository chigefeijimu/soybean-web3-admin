<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const { account, chainId, isConnected, switchChain, CHAIN_INFO } = useWeb3();

// State
const selectedNetwork = ref('5');
const faucetAddress = ref('');
const requestAmount = ref('0.5');
const isLoading = ref(false);
const txHash = ref('');
const message = ref('');
const networks = ref<any[]>([]);
const history = ref<any[]>([]);
const gasPrices = ref({ slow: '20', standard: '35', fast: '50', unit: 'gwei' });

// Tab
const activeTab = ref('faucet');

// Fetch supported networks
async function fetchNetworks() {
  try {
    const res = await fetch('/api/web3/gas-faucet/networks');
    networks.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch networks:', e);
    // Fallback data
    networks.value = [
      { chainId: '5', name: 'Ethereum Goerli', symbol: 'ETH', faucet: true },
      { chainId: '11155111', name: 'Ethereum Sepolia', symbol: 'ETH', faucet: true },
      { chainId: '421613', name: 'Arbitrum Goerli', symbol: 'ETH', faucet: true },
      { chainId: '1', name: 'Ethereum Mainnet', symbol: 'ETH', faucet: false },
      { chainId: '137', name: 'Polygon', symbol: 'MATIC', faucet: false },
      { chainId: '8453', name: 'Base', symbol: 'ETH', faucet: false },
    ];
  }
}

// Fetch faucet address
async function fetchFaucetAddress(network: string) {
  try {
    const res = await fetch(`/api/web3/gas-faucet/address/${network}`);
    const data = await res.json();
    faucetAddress.value = data.address;
  } catch (e) {
    console.error('Failed to fetch faucet address:', e);
    faucetAddress.value = '0x0000000000000000000000000000000000000000';
  }
}

// Request tokens
async function requestTokens() {
  if (!account.value) {
    message.value = 'Please connect your wallet first';
    return;
  }

  isLoading.value = true;
  message.value = '';

  try {
    const res = await fetch('/api/web3/gas-faucet/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: account.value,
        network: selectedNetwork.value,
        amount: requestAmount.value,
      }),
    });
    const data = await res.json();
    
    if (data.success) {
      txHash.value = data.txHash;
      message.value = data.message;
      // Refresh history
      fetchHistory();
    } else {
      message.value = data.message;
    }
  } catch (e) {
    message.value = 'Failed to request tokens. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// Fetch transaction history
async function fetchHistory() {
  if (!account.value) return;
  
  try {
    const res = await fetch(`/api/web3/gas-faucet/history/${account.value}`);
    history.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch history:', e);
    history.value = [];
  }
}

// Fetch gas recommendations
async function fetchGasPrices() {
  try {
    const res = await fetch('/api/web3/gas-faucet/gas-recommendations');
    gasPrices.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch gas prices:', e);
  }
}

// Copy address to clipboard
function copyAddress() {
  if (faucetAddress.value) {
    navigator.clipboard.writeText(faucetAddress.value);
    message.value = 'Address copied to clipboard!';
  }
}

// Switch network
async function handleNetworkChange() {
  await switchChain(Number(selectedNetwork.value));
  fetchFaucetAddress(selectedNetwork.value);
}

// Format timestamp
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'text-green-400';
    case 'pending': return 'text-yellow-400';
    case 'failed': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

// Current network info
const currentNetworkInfo = computed(() => {
  return CHAIN_INFO[Number(chainId.value)];
});

onMounted(() => {
  fetchNetworks();
  fetchFaucetAddress(selectedNetwork.value);
  fetchGasPrices();
  if (account.value) {
    fetchHistory();
  }
});
</script>

<template>
  <div class="gas-faucet">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">⛽ Gas Faucet</h2>
      <p class="text-slate-400">Get testnet ETH for development & testing</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
      <button
        v-for="tab in ['faucet', 'history', 'gas']"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-all',
          activeTab === tab 
            ? 'bg-purple-600 text-white' 
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        ]"
      >
        {{ tab === 'faucet' ? '🚰 Faucet' : tab === 'history' ? '📜 History' : '⛽ Gas Prices' }}
      </button>
    </div>

    <!-- Faucet Tab -->
    <div v-if="activeTab === 'faucet'" class="space-y-6">
      <!-- Network Selection -->
      <div class="bg-slate-800/50 rounded-xl p-4">
        <label class="block text-sm text-slate-400 mb-2">Select Network</label>
        <select
          v-model="selectedNetwork"
          @change="handleNetworkChange"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        >
          <option v-for="net in networks" :key="net.chainId" :value="net.chainId">
            {{ net.name }} ({{ net.symbol }}) {{ net.faucet ? '✓' : '' }}
          </option>
        </select>
      </div>

      <!-- Faucet Address -->
      <div v-if="networks.find(n => n.chainId === selectedNetwork)?.faucet" class="bg-slate-800/50 rounded-xl p-4">
        <label class="block text-sm text-slate-400 mb-2">Faucet Address</label>
        <div class="flex gap-2">
          <input
            :value="faucetAddress"
            readonly
            class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
          />
          <button
            @click="copyAddress"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📋
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-2">
          Send ETH to this address from your wallet or external source
        </p>
      </div>

      <!-- Request Amount -->
      <div v-if="networks.find(n => n.chainId === selectedNetwork)?.faucet" class="bg-slate-800/50 rounded-xl p-4">
        <label class="block text-sm text-slate-400 mb-2">Request Amount (ETH)</label>
        <input
          v-model="requestAmount"
          type="number"
          step="0.1"
          min="0.01"
          max="1"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        />
        <p class="text-xs text-slate-500 mt-2">Max 1 ETH per request</p>
      </div>

      <!-- Request Button -->
      <button
        v-if="networks.find(n => n.chainId === selectedNetwork)?.faucet"
        @click="requestTokens"
        :disabled="isLoading || !isConnected"
        class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all"
      >
        <span v-if="isLoading">⏳ Processing...</span>
        <span v-else>🚰 Request Testnet ETH</span>
      </button>

      <!-- Not Supported Message -->
      <div v-else class="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
        <p class="text-yellow-400">
          ⚠️ Faucet not available for {{ networks.find(n => n.chainId === selectedNetwork)?.name }}.
          <br />Please switch to a testnet (Goerli, Sepolia, or Arbitrum Goerli).
        </p>
      </div>

      <!-- Message/Result -->
      <div v-if="message" class="bg-slate-800/50 rounded-xl p-4">
        <p class="text-white">{{ message }}</p>
        <a
          v-if="txHash"
          :href="`https://${selectedNetwork === '5' ? 'goerli.' : selectedNetwork === '11155111' ? 'sepolia.' : ''}etherscan.io/tx/${txHash}`"
          target="_blank"
          class="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
        >
          View Transaction →
        </a>
      </div>

      <!-- Wallet Connection -->
      <div v-if="!isConnected" class="bg-slate-800/50 rounded-xl p-4 text-center">
        <p class="text-slate-400 mb-3">Connect your wallet to request testnet ETH</p>
        <p class="text-xs text-slate-500">Use the Wallet button in the header to connect</p>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'" class="space-y-4">
      <div v-if="history.length === 0" class="text-center py-8 text-slate-400">
        <p>No transaction history yet</p>
      </div>
      
      <div
        v-for="tx in history"
        :key="tx.txHash"
        class="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between"
      >
        <div>
          <p class="text-white font-mono text-sm truncate max-w-[200px]">
            {{ tx.txHash.slice(0, 10) }}...{{ tx.txHash.slice(-8) }}
          </p>
          <p class="text-slate-400 text-sm">
            {{ tx.amount }} ETH • {{ formatTime(tx.timestamp) }}
          </p>
        </div>
        <span :class="['font-medium', getStatusColor(tx.status)]">
          {{ tx.status === 'pending' ? '⏳ Pending' : tx.status === 'confirmed' ? '✓ Confirmed' : '✗ Failed' }}
        </span>
      </div>
    </div>

    <!-- Gas Prices Tab -->
    <div v-if="activeTab === 'gas'" class="space-y-4">
      <div class="grid grid-cols-3 gap-4">
        <!-- Slow -->
        <div class="bg-slate-800/50 rounded-xl p-4 text-center">
          <p class="text-slate-400 text-sm mb-1">🐢 Slow</p>
          <p class="text-xl font-bold text-white">{{ gasPrices.slow }}</p>
          <p class="text-xs text-slate-500">{{ gasPrices.unit }}</p>
        </div>
        
        <!-- Standard -->
        <div class="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-500/30">
          <p class="text-purple-400 text-sm mb-1">🚀 Standard</p>
          <p class="text-xl font-bold text-white">{{ gasPrices.standard }}</p>
          <p class="text-xs text-slate-500">{{ gasPrices.unit }}</p>
        </div>
        
        <!-- Fast -->
        <div class="bg-slate-800/50 rounded-xl p-4 text-center">
          <p class="text-slate-400 text-sm mb-1">⚡ Fast</p>
          <p class="text-xl font-bold text-white">{{ gasPrices.fast }}</p>
          <p class="text-xs text-slate-500">{{ gasPrices.unit }}</p>
        </div>
      </div>

      <!-- Tips -->
      <div class="bg-slate-800/50 rounded-xl p-4">
        <h3 class="text-white font-semibold mb-3">💡 Gas Saving Tips</h3>
        <ul class="text-slate-400 text-sm space-y-2">
          <li>• <span class="text-white">Off-peak hours:</span> Gas is cheaper on weekends and late night (UTC)</li>
          <li>• <span class="text-white">Batch transactions:</span> Group multiple operations together</li>
          <li>• <span class="text-white">Layer 2:</span> Use Arbitrum, Base, or Optimism for ~10x cheaper fees</li>
          <li>• <span class="text-white">Set gas limit:</span> Avoid overpaying by setting appropriate gas limits</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gas-faucet {
  @apply p-4;
}
</style>
