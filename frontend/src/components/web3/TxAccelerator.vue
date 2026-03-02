<template>
  <div class="tx-accelerator">
    <div class="header">
      <h2>🚀 Transaction Accelerator</h2>
      <p class="subtitle">Speed up or cancel pending transactions</p>
    </div>

    <!-- Network Selection -->
    <div class="section">
      <label>Network</label>
      <select v-model="selectedChain" class="chain-select">
        <option :value="1">Ethereum</option>
        <option :value="5">Goerli</option>
        <option :value="11155111">Sepolia</option>
        <option :value="56">BSC</option>
        <option :value="137">Polygon</option>
        <option :value="42161">Arbitrum</option>
        <option :value="10">Optimism</option>
        <option :value="8453">Base</option>
      </select>
    </div>

    <!-- Wallet Connection -->
    <div class="section wallet-section">
      <div v-if="!walletAddress">
        <input 
          v-model="inputAddress" 
          placeholder="Enter wallet address (0x...)"
          class="address-input"
        />
        <button @click="loadPendingTransactions" class="btn-primary">
          Load Transactions
        </button>
      </div>
      <div v-else class="wallet-info">
        <span class="address">{{ truncateAddress(walletAddress) }}</span>
        <button @click="loadPendingTransactions" class="btn-secondary">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Gas Recommendation -->
    <div class="section gas-recommendation" v-if="gasData">
      <h3>⛽ Gas Recommendation</h3>
      <div class="gas-options">
        <div 
          class="gas-option" 
          :class="{ active: selectedGas === 'slow', recommended: gasData.recommendation === 'slow' }"
          @click="selectedGas = 'slow'"
        >
          <span class="label">🐢 Slow</span>
          <span class="price">{{ gasData.slow?.gwei || '10' }} Gwei</span>
        </div>
        <div 
          class="gas-option" 
          :class="{ active: selectedGas === 'normal', recommended: gasData.recommendation === 'normal' }"
          @click="selectedGas = 'normal'"
        >
          <span class="label">🚗 Normal</span>
          <span class="price">{{ gasData.normal?.gwei || '20' }} Gwei</span>
        </div>
        <div 
          class="gas-option" 
          :class="{ active: selectedGas === 'fast', recommended: gasData.recommendation === 'fast' }"
          @click="selectedGas = 'fast'"
        >
          <span class="label">🚀 Fast</span>
          <span class="price">{{ gasData.fast?.gwei || '50' }} Gwei</span>
        </div>
      </div>
    </div>

    <!-- Pending Transactions -->
    <div class="section" v-if="pendingTxData?.pendingTransactions?.length > 0">
      <h3>📋 Pending Transactions</h3>
      <div class="tx-list">
        <div 
          v-for="tx in pendingTxData.pendingTransactions" 
          :key="tx.hash"
          class="tx-item"
          :class="{ selected: selectedTx?.hash === tx.hash }"
          @click="selectedTx = tx"
        >
          <div class="tx-header">
            <span class="nonce">Nonce: {{ tx.nonce }}</span>
            <span class="status" :class="tx.status">{{ tx.status }}</span>
          </div>
          <div class="tx-details">
            <div class="tx-row">
              <span class="label">To:</span>
              <span class="value">{{ truncateAddress(tx.to) }}</span>
            </div>
            <div class="tx-row">
              <span class="label">Value:</span>
              <span class="value">{{ formatEther(tx.value) }} ETH</span>
            </div>
            <div class="tx-row">
              <span class="label">Gas:</span>
              <span class="value">{{ formatGwei(tx.gasPrice || tx.maxFeePerGas) }} Gwei</span>
            </div>
            <div class="tx-row" v-if="tx.timestamp">
              <span class="label">Time:</span>
              <span class="value">{{ formatTime(tx.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Pending Transactions -->
    <div class="section empty-state" v-else-if="loaded && !pendingTxData?.pendingTransactions?.length">
      <p>✅ No pending transactions found</p>
    </div>

    <!-- Action Panel -->
    <div class="section action-panel" v-if="selectedTx">
      <h3>⚡ Actions</h3>
      
      <div class="action-buttons">
        <button 
          @click="speedUpTx" 
          class="btn-action btn-speedup"
          :disabled="actionLoading"
        >
          🚀 Speed Up
        </button>
        <button 
          @click="cancelTx" 
          class="btn-action btn-cancel"
          :disabled="actionLoading"
        >
          ❌ Cancel
        </button>
      </div>

      <!-- Private Key Input -->
      <div class="private-key-section" v-if="showPrivateKeyInput">
        <p class="warning">⚠️ Your private key is needed to sign the replacement transaction.</p>
        <input 
          v-model="privateKey" 
          type="password"
          placeholder="Enter private key (0x...)"
          class="pk-input"
        />
        <div class="action-buttons">
          <button 
            @click="confirmSpeedUp" 
            class="btn-primary"
            :disabled="actionLoading || !privateKey"
          >
            {{ actionLoading ? '⏳ Processing...' : '🚀 Confirm Speed Up' }}
          </button>
          <button 
            @click="confirmCancel" 
            class="btn-danger"
            :disabled="actionLoading || !privateKey"
          >
            {{ actionLoading ? '⏳ Processing...' : '❌ Confirm Cancel' }}
          </button>
          <button @click="showPrivateKeyInput = false" class="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div class="section result" v-if="result">
      <div :class="['result-box', result.success ? 'success' : 'error']">
        <h4>{{ result.success ? '✅ Success' : '❌ Error' }}</h4>
        <p>{{ result.message || result.error }}</p>
        <a v-if="result.newTransactionHash" :href="getExplorerUrl(result.newTransactionHash)" target="_blank">
          View Transaction →
        </a>
      </div>
    </div>

    <!-- Nonce Info -->
    <div class="section nonce-info" v-if="pendingTxData">
      <h3>📊 Nonce Information</h3>
      <div class="nonce-stats">
        <div class="stat">
          <span class="label">Latest Nonce:</span>
          <span class="value">{{ pendingTxData.latestNonce }}</span>
        </div>
        <div class="stat">
          <span class="label">Pending Nonce:</span>
          <span class="value">{{ pendingTxData.currentNonce }}</span>
        </div>
        <div class="stat">
          <span class="label">Pending Count:</span>
          <span class="value">{{ pendingTxData.pendingCount }}</span>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="section instructions">
      <h3>📖 How It Works</h3>
      <ul>
        <li><strong>Speed Up:</strong> Send a new transaction with the same nonce but higher gas price</li>
        <li><strong>Cancel:</strong> Send a 0 ETH transaction to yourself with the same nonce to cancel the original</li>
        <li><strong>Note:</strong> Only one transaction per nonce can be confirmed</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const API_BASE = 'http://localhost:3008';

// State
const selectedChain = ref(1);
const inputAddress = ref('');
const walletAddress = ref('');
const loaded = ref(false);
const selectedTx = ref<any>(null);
const selectedGas = ref('normal');
const showPrivateKeyInput = ref(false);
const privateKey = ref('');
const actionLoading = ref(false);
const result = ref<any>(null);
const pendingTxData = ref<any>(null);
const gasData = ref<any>(null);
const actionType = ref<'speedup' | 'cancel'>('speedup');

// Load gas recommendation on mount
onMounted(async () => {
  await loadGasRecommendation();
});

// Watch chain change
watch(selectedChain, async () => {
  await loadGasRecommendation();
  if (walletAddress.value || inputAddress.value) {
    await loadPendingTransactions();
  }
});

const loadGasRecommendation = async () => {
  try {
    const res = await axios.get(`${API_BASE}/tx-accelerator/gas-recommendation`, {
      params: { chainId: selectedChain.value }
    });
    gasData.value = res.data;
  } catch (e) {
    console.error('Failed to load gas:', e);
  }
};

const loadPendingTransactions = async () => {
  const address = walletAddress.value || inputAddress.value;
  if (!address) return;
  
  loaded.value = false;
  try {
    const res = await axios.get(`${API_BASE}/tx-accelerator/pending/${address}`, {
      params: { chainId: selectedChain.value }
    });
    pendingTxData.value = res.data;
    loaded.value = true;
  } catch (e) {
    console.error('Failed to load pending:', e);
    loaded.value = true;
  }
};

const speedUpTx = () => {
  actionType.value = 'speedup';
  showPrivateKeyInput.value = true;
};

const cancelTx = () => {
  actionType.value = 'cancel';
  showPrivateKeyInput.value = true;
};

const confirmSpeedUp = async () => {
  if (!privateKey.value || !selectedTx.value) return;
  
  actionLoading.value = true;
  result.value = null;
  
  try {
    const gasMultipliers = { slow: 1.2, normal: 1.5, fast: 2.0 };
    const res = await axios.post(`${API_BASE}/tx-accelerator/speed-up`, {
      address: walletAddress.value || inputAddress.value,
      nonce: selectedTx.value.nonce,
      privateKey: privateKey.value,
      chainId: selectedChain.value,
      gasMultiplier: gasMultipliers[selectedGas.value as keyof typeof gasMultipliers],
    });
    result.value = res.data;
    
    if (res.data.success) {
      selectedTx.value = null;
      await loadPendingTransactions();
    }
  } catch (e: any) {
    result.value = { success: false, error: e.message };
  }
  
  actionLoading.value = false;
};

const confirmCancel = async () => {
  if (!privateKey.value || !selectedTx.value) return;
  
  actionLoading.value = true;
  result.value = null;
  
  try {
    const res = await axios.post(`${API_BASE}/tx-accelerator/cancel`, {
      address: walletAddress.value || inputAddress.value,
      nonce: selectedTx.value.nonce,
      privateKey: privateKey.value,
      chainId: selectedChain.value,
    });
    result.value = res.data;
    
    if (res.data.success) {
      selectedTx.value = null;
      await loadPendingTransactions();
    }
  } catch (e: any) {
    result.value = { success: false, error: e.message };
  }
  
  actionLoading.value = false;
};

const truncateAddress = (addr: string) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

const formatEther = (wei: string) => {
  try {
    return (Number(wei) / 1e18).toFixed(6);
  } catch {
    return '0';
  }
};

const formatGwei = (wei: string) => {
  try {
    return (Number(wei) / 1e9).toFixed(2);
  } catch {
    return '0';
  }
};

const formatTime = (timestamp: string) => {
  try {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  } catch {
    return timestamp;
  }
};

const getExplorerUrl = (hash: string) => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    11155111: 'https://sepolia.etherscan.io/tx/',
    56: 'https://bscscan.com/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
  };
  return (explorers[selectedChain.value] || explorers[1]) + hash;
};
</script>

<style scoped>
.tx-accelerator {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  color: #6366f1;
}

.subtitle {
  color: #666;
  margin-top: 5px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section h3 {
  margin-top: 0;
  color: #333;
}

.chain-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.wallet-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.wallet-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.address {
  font-family: monospace;
  font-size: 14px;
}

.btn-primary {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.gas-options {
  display: flex;
  gap: 10px;
}

.gas-option {
  flex: 1;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.gas-option:hover {
  border-color: #6366f1;
}

.gas-option.active {
  border-color: #6366f1;
  background: #eef2ff;
}

.gas-option.recommended {
  border-color: #10b981;
}

.gas-option .label {
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
}

.gas-option .price {
  display: block;
  font-size: 18px;
  color: #333;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tx-item {
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tx-item:hover {
  border-color: #6366f1;
}

.tx-item.selected {
  border-color: #6366f1;
  background: #eef2ff;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.nonce {
  font-weight: 600;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.tx-details .tx-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.tx-row .label {
  color: #666;
}

.tx-row .value {
  font-family: monospace;
}

.action-panel {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-action {
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-speedup {
  background: #10b981;
  color: white;
}

.btn-cancel {
  background: #ef4444;
  color: white;
}

.private-key-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.warning {
  color: #92400e;
  background: #fef3c7;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.pk-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  margin-bottom: 15px;
}

.result-box {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.result-box.success {
  background: #d1fae5;
  color: #065f46;
}

.result-box.error {
  background: #fee2e2;
  color: #991b1b;
}

.result-box a {
  display: inline-block;
  margin-top: 10px;
  color: inherit;
  font-weight: 600;
}

.nonce-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 12px;
  color: #666;
}

.stat .value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.empty-state {
  text-align: center;
  color: #10b981;
}

.instructions ul {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
  color: #555;
}
</style>
