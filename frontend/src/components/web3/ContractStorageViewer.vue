<script setup lang="ts">
import { ref, computed } from 'vue';

interface StorageSlot {
  slot: number | string;
  slotHex?: string;
  value: string;
  decodedValue?: string;
  type?: string;
  label?: string;
}

interface StorageResult {
  address: string;
  chainId: number;
  slots: StorageSlot[];
  blockNumber: number;
  timestamp: string;
  storage?: StorageSlot[];
}

const address = ref('');
const chainId = ref(1);
const slot = ref('0');
const loading = ref(false);
const error = ref('');
const result = ref<StorageResult | null>(null);
const activeTab = ref<'layout' | 'single' | 'code'>('layout');

// Supported chains
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 5, name: 'Goerli', symbol: 'ETH' },
  { id: 11155111, name: 'Sepolia', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 80001, name: 'Mumbai', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 421613, name: 'Arbitrum Goerli', symbol: 'ETH' },
  { id: 56, name: 'BSC', symbol: 'BNB' },
  { id: 97, name: 'BSC Testnet', symbol: 'BNB' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
  { id: 84531, name: 'Base Sepolia', symbol: 'ETH' },
];

const apiBase = '/api/web3/contract-storage';

async function fetchStorageLayout() {
  if (!address.value) {
    error.value = 'Please enter a contract address';
    return;
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address.value)) {
    error.value = 'Invalid contract address format';
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const response = await fetch(`${apiBase}/layout/${chainId.value}/${address.value}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to fetch storage layout');
    }
    result.value = await response.json();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function fetchSingleSlot() {
  if (!address.value || !slot.value) {
    error.value = 'Please enter address and slot';
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const slotHex = slot.value.startsWith('0x') ? slot.value : `0x${BigInt(slot.value).toString(16)}`;
    const response = await fetch(`${apiBase}/slot/${chainId.value}/${address.value}/${slotHex}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to fetch storage slot');
    }
    result.value = await response.json();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function fetchContractCode() {
  if (!address.value) {
    error.value = 'Please enter a contract address';
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const response = await fetch(`${apiBase}/code/${chainId.value}/${address.value}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to fetch contract code');
    }
    const codeData = await response.json();
    
    // Format code for display
    result.value = {
      address: codeData.address,
      chainId: codeData.chainId,
      slots: [],
      blockNumber: 0,
      timestamp: codeData.timestamp,
      storage: [],
    } as any;
    
    result.value.storage = [{
      slot: 'code',
      value: codeData.code.substring(0, 200) + (codeData.code.length > 200 ? '...' : ''),
      decodedValue: `Is Contract: ${codeData.isContract}, Length: ${codeData.codeLength} bytes`,
      type: codeData.isContract ? 'Contract' : 'EOA',
    }] as any;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function handleSubmit() {
  if (activeTab.value === 'layout') {
    fetchStorageLayout();
  } else if (activeTab.value === 'single') {
    fetchSingleSlot();
  } else if (activeTab.value === 'code') {
    fetchContractCode();
  }
}

function formatValue(value: string | undefined): string {
  if (!value) return '-';
  if (value.startsWith('0x') && value.length === 42) {
    return value; // Address
  }
  try {
    const bigInt = BigInt(value);
    if (bigInt < 10n ** 18n) {
      return bigInt.toString();
    }
    // Format large numbers with commas
    return bigInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch {
    return value;
  }
}

function truncateHex(hex: string, start = 6, end = 4): string {
  if (!hex || hex.length <= start + end) return hex;
  return `${hex.slice(0, start)}...${hex.slice(-end)}`;
}
</script>

<template>
  <div class="contract-storage-viewer">
    <div class="header">
      <h3>🔍 Contract Storage Viewer</h3>
      <p class="subtitle">View smart contract storage slots and code</p>
    </div>

    <!-- Input Form -->
    <div class="form">
      <div class="form-row">
        <div class="form-group">
          <label>Network</label>
          <select v-model="chainId">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        
        <div class="form-group flex-grow">
          <label>Contract Address</label>
          <input 
            v-model="address" 
            type="text" 
            placeholder="0x..."
            @keyup.enter="handleSubmit"
          />
        </div>
      </div>

      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'layout' }]"
          @click="activeTab = 'layout'"
        >
          📊 Storage Layout
        </button>
        <button 
          :class="['tab', { active: activeTab === 'single' }]"
          @click="activeTab = 'single'"
        >
          🎯 Single Slot
        </button>
        <button 
          :class="['tab', { active: activeTab === 'code' }]"
          @click="activeTab = 'code'"
        >
          📝 Contract Code
        </button>
      </div>

      <div v-if="activeTab === 'single'" class="form-row">
        <div class="form-group">
          <label>Slot Number</label>
          <input 
            v-model="slot" 
            type="text" 
            placeholder="0, 1, 2... or 0x..."
          />
        </div>
      </div>

      <button class="submit-btn" @click="handleSubmit" :disabled="loading">
        {{ loading ? '⏳ Loading...' : '🔍 Fetch Storage' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <!-- Results -->
    <div v-if="result" class="results">
      <div class="result-header">
        <div class="info-item">
          <span class="label">Contract:</span>
          <span class="value address">{{ truncateHex(result.address) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Chain:</span>
          <span class="value">{{ chains.find(c => c.id === result.chainId)?.name || result.chainId }}</span>
        </div>
        <div class="info-item">
          <span class="label">Block:</span>
          <span class="value">#{{ result.blockNumber?.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Storage Layout Table -->
      <div v-if="activeTab === 'layout' && result.storage" class="storage-table">
        <table>
          <thead>
            <tr>
              <th>Slot</th>
              <th>Hex</th>
              <th>Value</th>
              <th>Decoded</th>
              <th>Suggested Label</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in result.storage" :key="idx">
              <td>{{ item.slot }}</td>
              <td class="hex">{{ item.slotHex ? truncateHex(item.slotHex, 10, 8) : '-' }}</td>
              <td class="hex">{{ truncateHex(item.value, 8, 6) }}</td>
              <td class="decoded">{{ formatValue(item.decodedValue) }}</td>
              <td class="label-col">{{ item.label || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Single Slot Result -->
      <div v-if="activeTab === 'single' && result.slots?.length" class="single-slot">
        <div v-for="slotItem in result.slots" :key="slotItem.slot" class="slot-detail">
          <div class="slot-header">
            <span class="slot-num">Slot: {{ slotItem.slot }}</span>
            <span class="slot-type">{{ slotItem.type }}</span>
          </div>
          <div class="slot-value">
            <div class="value-row">
              <span class="label">Raw Value:</span>
              <code>{{ slotItem.value }}</code>
            </div>
            <div class="value-row">
              <span class="label">Decoded:</span>
              <span class="decoded-value">{{ slotItem.decodedValue }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contract Code -->
      <div v-if="activeTab === 'code' && result.storage?.length" class="code-view">
        <pre><code>{{ result.storage[0].value }}</code></pre>
        <div class="code-info">
          {{ result.storage[0].decodedValue }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!result && !error && !loading" class="empty-state">
      <div class="empty-icon">📦</div>
      <p>Enter a contract address to view its storage</p>
      <div class="tips">
        <h4>💡 Tips:</h4>
        <ul>
          <li>Storage Layout shows first 20 slots with suggested labels</li>
          <li>Use Single Slot to query any specific storage position</li>
          <li>Contract Code shows if an address is a contract or EOA</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contract-storage-viewer {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  color: #e0e0e0;
}

.header {
  margin-bottom: 20px;
}

.header h3 {
  margin: 0 0 5px 0;
  color: #fff;
}

.subtitle {
  margin: 0;
  color: #888;
  font-size: 0.9em;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.flex-grow {
  flex: 1;
}

.form-group label {
  font-size: 0.85em;
  color: #aaa;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #16213e;
  color: #fff;
  font-size: 0.95em;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4fc3f7;
}

.tabs {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.tab {
  padding: 8px 16px;
  border: 1px solid #333;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  border-color: #4fc3f7;
  color: #fff;
}

.tab.active {
  background: #4fc3f7;
  color: #1a1a2e;
  border-color: #4fc3f7;
}

.submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4fc3f7 0%, #2196f3 100%);
  color: #fff;
  font-size: 1em;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 15px;
  padding: 12px;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
  border-radius: 8px;
  color: #f44336;
}

.results {
  margin-top: 20px;
}

.result-header {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #16213e;
  border-radius: 8px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item .label {
  color: #888;
}

.info-item .value {
  color: #fff;
}

.info-item .value.address {
  font-family: monospace;
  color: #4fc3f7;
}

.storage-table {
  overflow-x: auto;
}

.storage-table table {
  width: 100%;
  border-collapse: collapse;
}

.storage-table th,
.storage-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}

.storage-table th {
  background: #16213e;
  color: #aaa;
  font-weight: 500;
}

.storage-table td {
  font-size: 0.9em;
}

.storage-table td.hex {
  font-family: monospace;
  color: #4fc3f7;
}

.storage-table td.decoded {
  font-family: monospace;
  color: #81c784;
}

.storage-table td.label-col {
  color: #ffb74d;
  font-size: 0.85em;
}

.single-slot {
  background: #16213e;
  border-radius: 8px;
  padding: 15px;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.slot-num {
  font-weight: bold;
  color: #4fc3f7;
}

.slot-type {
  color: #aaa;
  font-size: 0.9em;
}

.slot-value {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.value-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.value-row .label {
  color: #888;
  min-width: 80px;
}

.value-row code {
  font-family: monospace;
  color: #81c784;
  word-break: break-all;
}

.decoded-value {
  color: #fff;
}

.code-view {
  background: #16213e;
  border-radius: 8px;
  padding: 15px;
  max-height: 400px;
  overflow: auto;
}

.code-view pre {
  margin: 0;
}

.code-view code {
  font-family: monospace;
  font-size: 0.85em;
  color: #81c784;
  word-break: break-all;
}

.code-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #333;
  color: #aaa;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.tips {
  margin-top: 20px;
  text-align: left;
  padding: 15px;
  background: #16213e;
  border-radius: 8px;
}

.tips h4 {
  margin: 0 0 10px 0;
  color: #fff;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  margin: 5px 0;
  font-size: 0.9em;
}
</style>
