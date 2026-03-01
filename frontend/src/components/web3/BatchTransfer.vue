<template>
  <div class="batch-transfer">
    <div class="header">
      <h3>📤 Batch Transfer</h3>
      <p class="subtitle">批量向多个地址转账代币</p>
    </div>

    <!-- Network Selection -->
    <div class="form-group">
      <label>🌐 Network</label>
      <select v-model="chainId" class="form-select">
        <option v-for="network in networks" :key="network.id" :value="network.id">
          {{ network.logo }} {{ network.name }}
        </option>
      </select>
    </div>

    <!-- Private Key Input -->
    <div class="form-group">
      <label>🔑 Private Key</label>
      <input 
        type="password" 
        v-model="privateKey" 
        placeholder="Enter private key (0x...)"
        class="form-input"
      />
      <small class="hint">⚠️ Private key is only used locally and never sent to server</small>
    </div>

    <!-- Token Selection -->
    <div class="form-group">
      <label>🪙 Token</label>
      <div class="token-selector">
        <label class="radio-label">
          <input type="radio" v-model="tokenType" value="native" /> Native ETH
        </label>
        <label class="radio-label">
          <input type="radio" v-model="tokenType" value="erc20" /> ERC20 Token
        </label>
      </div>
      <input 
        v-if="tokenType === 'erc20'"
        type="text" 
        v-model="tokenAddress" 
        placeholder="Token Contract Address (0x...)"
        class="form-input"
      />
    </div>

    <!-- Transfer List -->
    <div class="form-group">
      <label>📋 Transfer List</label>
      <div class="transfer-tabs">
        <button 
          :class="['tab-btn', { active: inputMode === 'manual' }]"
          @click="inputMode = 'manual'"
        >
          Manual Input
        </button>
        <button 
          :class="['tab-btn', { active: inputMode === 'csv' }]"
          @click="inputMode = 'csv'"
        >
          CSV Import
        </button>
      </div>

      <!-- Manual Input Mode -->
      <div v-if="inputMode === 'manual'" class="manual-input">
        <div class="transfer-header">
          <span>To Address</span>
          <span>Amount</span>
          <span></span>
        </div>
        <div v-for="(item, index) in transfers" :key="index" class="transfer-row">
          <input 
            type="text" 
            v-model="item.to" 
            placeholder="0x..."
            :class="['form-input', { error: !isValidAddress(item.to) && item.to }]"
          />
          <input 
            type="number" 
            v-model="item.amount" 
            placeholder="0.0"
            step="0.0001"
            class="form-input"
          />
          <button @click="removeTransfer(index)" class="btn-remove">✕</button>
        </div>
        <button @click="addTransfer" class="btn-add">+ Add Recipient</button>
      </div>

      <!-- CSV Import Mode -->
      <div v-else class="csv-input">
        <textarea 
          v-model="csvContent" 
          placeholder="# Format: address,amount&#10;0x742d35Cc6634C0532925a3b844Bc9e7595f0aB,0.1&#10;0x1234567890123456789012345678901234567890,1.5"
          class="form-textarea"
          rows="8"
        ></textarea>
        <button @click="parseCSV" class="btn-secondary">Parse CSV</button>
      </div>
    </div>

    <!-- Gas Settings -->
    <div class="form-group">
      <label>⏳ Gas Settings</label>
      <div class="gas-options">
        <label class="radio-label">
          <input type="radio" v-model="gasMode" value="auto" /> Auto
        </label>
        <label class="radio-label">
          <input type="radio" v-model="gasMode" value="custom" /> Custom
        </label>
      </div>
      <input 
        v-if="gasMode === 'custom'"
        type="number" 
        v-model="customGasPrice" 
        placeholder="Gas Price (gwei)"
        class="form-input"
      />
    </div>

    <!-- Estimate Button -->
    <button @click="estimateFee" class="btn-estimate" :disabled="!canEstimate">
      📊 Estimate Fee
    </button>

    <!-- Estimate Result -->
    <div v-if="estimate" class="estimate-result">
      <h4>💰 Fee Estimate</h4>
      <div class="estimate-row">
        <span>Total Transfers:</span>
        <span>{{ estimate.totalCount }}</span>
      </div>
      <div class="estimate-row">
        <span>Estimated Gas:</span>
        <span>{{ formatGas(estimate.estimatedGas) }}</span>
      </div>
      <div class="estimate-row">
        <span>Estimated Fee:</span>
        <span>{{ formatEth(estimate.estimatedFee) }}</span>
      </div>
    </div>

    <!-- Execute Button -->
    <button 
      @click="executeBatchTransfer" 
      class="btn-execute" 
      :disabled="!canExecute || executing"
    >
      {{ executing ? '⏳ Executing...' : '🚀 Execute Batch Transfer' }}
    </button>

    <!-- Results -->
    <div v-if="results.length > 0" class="results">
      <h4>📝 Results</h4>
      <div class="results-summary">
        <span class="success">✅ Success: {{ successCount }}</span>
        <span class="failed">❌ Failed: {{ failedCount }}</span>
      </div>
      <div class="results-list">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          :class="['result-item', result.status]"
        >
          <span class="address">{{ truncateAddress(result.to) }}</span>
          <span class="amount">{{ result.amount }}</span>
          <span v-if="result.txHash" class="tx-hash">
            <a :href="getExplorerUrl(result.txHash)" target="_blank">
              {{ truncateTx(result.txHash) }}
            </a>
          </span>
          <span v-if="result.error" class="error-msg">{{ result.error }}</span>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface TransferItem {
  to: string;
  amount: string;
}

interface EstimateResult {
  totalCount: number;
  estimatedGas: string;
  estimatedFee: string;
}

interface TransferResult {
  to: string;
  amount: string;
  txHash?: string;
  status: 'success' | 'failed';
  error?: string;
}

const chainId = ref(1);
const privateKey = ref('');
const tokenType = ref<'native' | 'erc20'>('native');
const tokenAddress = ref('');
const inputMode = ref<'manual' | 'csv'>('manual');
const transfers = ref<TransferItem[]>([
  { to: '', amount: '' }
]);
const csvContent = ref('');
const gasMode = ref<'auto' | 'custom'>('auto');
const customGasPrice = ref(30);
const estimate = ref<EstimateResult | null>(null);
const results = ref<TransferResult[]>([]);
const executing = ref(false);
const error = ref('');

const networks = [
  { id: 1, name: 'Ethereum', logo: '🔷' },
  { id: 5, name: 'Goerli', logo: '🔷' },
  { id: 137, name: 'Polygon', logo: '🟣' },
  { id: 80001, name: 'Mumbai', logo: '🟣' },
  { id: 56, name: 'BNB Chain', logo: '🟡' },
  { id: 97, name: 'BSC Testnet', logo: '🟡' },
  { id: 42161, name: 'Arbitrum', logo: '🔵' },
  { id: 421613, name: 'Arbitrum Goerli', logo: '🔵' },
  { id: 10, name: 'Optimism', logo: '🟠' },
  { id: 8453, name: 'Base', logo: '⚫' },
];

const canEstimate = computed(() => {
  const validTransfers = transfers.value.filter(t => t.to && t.amount);
  return validTransfers.length > 0;
});

const canExecute = computed(() => {
  return privateKey.value.startsWith('0x') && canEstimate.value && estimate.value;
});

const successCount = computed(() => results.value.filter(r => r.status === 'success').length);
const failedCount = computed(() => results.value.filter(r => r.status === 'failed').length);

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function addTransfer() {
  transfers.value.push({ to: '', amount: '' });
}

function removeTransfer(index: number) {
  transfers.value.splice(index, 1);
}

function parseCSV() {
  const lines = csvContent.value.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  transfers.value = [];
  
  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      transfers.value.push({
        to: parts[0],
        amount: parts[1]
      });
    }
  }
}

async function estimateFee() {
  error.value = '';
  try {
    const validTransfers = transfers.value.filter(t => isValidAddress(t.to) && t.amount);
    if (validTransfers.length === 0) {
      error.value = 'Please enter valid transfer addresses and amounts';
      return;
    }

    // Mock estimate (in real app, call API)
    estimate.value = {
      totalCount: validTransfers.length,
      estimatedGas: (validTransfers.length * 65000).toString(),
      estimatedFee: (validTransfers.length * 65000 * 30000000).toString() // 30 gwei
    };
  } catch (e: any) {
    error.value = e.message;
  }
}

async function executeBatchTransfer() {
  error.value = '';
  executing.value = true;
  results.value = [];

  try {
    const validTransfers = transfers.value.filter(t => isValidAddress(t.to) && t.amount);
    
    // Note: In production, this would call a backend API to execute transactions
    // For demo, we'll simulate the results
    for (const transfer of validTransfers) {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock: random success/failure
      const success = Math.random() > 0.1;
      
      results.value.push({
        to: transfer.to,
        amount: transfer.amount,
        txHash: success ? `0x${Math.random().toString(16).slice(2)}${'0'.repeat(64)}` : undefined,
        status: success ? 'success' : 'failed',
        error: success ? undefined : 'Insufficient funds'
      });
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    executing.value = false;
  }
}

function formatGas(gas: string): string {
  return parseInt(gas).toLocaleString();
}

function formatEth(wei: string): string {
  const eth = parseInt(wei) / 1e18;
  return eth.toFixed(6) + ' ETH';
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function truncateTx(tx: string): string {
  return tx.slice(0, 10) + '...' + tx.slice(-8);
}

function getExplorerUrl(tx: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    56: 'https://bscscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
  };
  return (explorers[chainId.value] || explorers[1]) + tx;
}
</script>

<style scoped>
.batch-transfer {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h3 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin: 4px 0 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #4f46e5;
}

.form-input.error {
  border-color: #ef4444;
}

.form-textarea {
  font-family: monospace;
  resize: vertical;
}

.hint {
  display: block;
  color: #f59e0b;
  font-size: 12px;
  margin-top: 4px;
}

.token-selector, .gas-options {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.transfer-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}

.transfer-header {
  display: grid;
  grid-template-columns: 1fr 120px 40px;
  gap: 8px;
  padding: 8px;
  font-weight: 600;
  font-size: 12px;
  color: #666;
}

.transfer-row {
  display: grid;
  grid-template-columns: 1fr 120px 40px;
  gap: 8px;
  margin-bottom: 8px;
}

.btn-remove {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.btn-add {
  width: 100%;
  padding: 10px;
  background: #f3f4f6;
  border: 1px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #e5e7eb;
}

.btn-estimate, .btn-execute, .btn-secondary {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
}

.btn-estimate {
  background: #f3f4f6;
  color: #333;
}

.btn-estimate:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-execute {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
}

.btn-execute:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.btn-execute:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #333;
  margin-top: 8px;
}

.estimate-result {
  margin-top: 16px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.estimate-result h4 {
  margin: 0 0 12px;
  color: #166534;
}

.estimate-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.results {
  margin-top: 20px;
}

.results h4 {
  margin: 0 0 12px;
}

.results-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.results-summary .success {
  color: #16a34a;
}

.results-summary .failed {
  color: #dc2626;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: grid;
  grid-template-columns: 100px 80px 1fr;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}

.result-item.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.result-item.failed {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.result-item .address {
  font-family: monospace;
}

.result-item .tx-hash a {
  color: #4f46e5;
  text-decoration: none;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}
</style>
