<script setup lang="ts">
import { ref, computed } from 'vue'
import { getBlock, getLatestBlock, getTransactionReceipt, scanBlocks } from '@/service/api/web3'

// State
const activeTab = ref<'block' | 'receipt' | 'scan'>('block')
const blockNumber = ref<number>(0)
const latestBlockNumber = ref<number | null>(null)
const txHash = ref<string>('')
const scanFrom = ref<number>(0)
const scanTo = ref<number>(0)

// Data
const blockInfo = ref<any>(null)
const txReceipt = ref<any>(null)
const scanResults = ref<any[]>([])
const loading = ref(false)
const error = ref<string>('')

// Fetch latest block number
const fetchLatestBlock = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getLatestBlock()
    latestBlockNumber.value = res.data?.blockNumber || res.blockNumber
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch latest block'
  } finally {
    loading.value = false
  }
}

// Get block by number
const fetchBlock = async () => {
  if (!blockNumber.value) {
    error.value = 'Please enter a block number'
    return
  }
  loading.value = true
  error.value = ''
  blockInfo.value = null
  try {
    const res = await getBlock(blockNumber.value)
    blockInfo.value = res.data || res
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch block'
  } finally {
    loading.value = false
  }
}

// Get transaction receipt
const fetchReceipt = async () => {
  if (!txHash.value) {
    error.value = 'Please enter a transaction hash'
    return
  }
  loading.value = true
  error.value = ''
  txReceipt.value = null
  try {
    const res = await getTransactionReceipt(txHash.value)
    txReceipt.value = res.data || res
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch receipt'
  } finally {
    loading.value = false
  }
}

// Scan block range
const fetchScanResults = async () => {
  if (!scanFrom.value || !scanTo.value) {
    error.value = 'Please enter block range'
    return
  }
  if (scanTo.value - scanFrom.value > 100) {
    error.value = 'Maximum range is 100 blocks'
    return
  }
  loading.value = true
  error.value = ''
  scanResults.value = []
  try {
    const res = await scanBlocks(scanFrom.value, scanTo.value)
    scanResults.value = res.data || res.results || res || []
  } catch (e: any) {
    error.value = e.message || 'Failed to scan blocks'
  } finally {
    loading.value = false
  }
}

// Format address
const formatAddress = (addr: string) => {
  if (!addr) return '-'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Format timestamp
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

// Initialize
fetchLatestBlock()
</script>

<template>
  <div class="block-explorer">
    <div class="header">
      <h2>🔍 Block Explorer</h2>
      <div class="latest-block" v-if="latestBlockNumber">
        Latest Block: <span class="highlight">{{ latestBlockNumber }}</span>
        <button @click="fetchLatestBlock" class="btn-refresh">↻</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'block' }]" 
        @click="activeTab = 'block'"
      >
        Block Info
      </button>
      <button 
        :class="['tab', { active: activeTab === 'receipt' }]" 
        @click="activeTab = 'receipt'"
      >
        Transaction Receipt
      </button>
      <button 
        :class="['tab', { active: activeTab === 'scan' }]" 
        @click="activeTab = 'scan'"
      >
        Block Scan
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error">{{ error }}</div>

    <!-- Block Info Tab -->
    <div v-if="activeTab === 'block'" class="tab-content">
      <div class="input-group">
        <input 
          v-model.number="blockNumber" 
          type="number" 
          placeholder="Enter block number"
          @keyup.enter="fetchBlock"
        />
        <button @click="fetchBlock" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Get Block' }}
        </button>
      </div>

      <div v-if="blockInfo" class="result-card">
        <h3>Block #{{ blockInfo.number || blockNumber }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Hash</label>
            <span class="mono">{{ blockInfo.hash || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Parent Hash</label>
            <span class="mono">{{ blockInfo.parentHash || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Timestamp</label>
            <span>{{ formatTime(blockInfo.timestamp) }}</span>
          </div>
          <div class="info-item">
            <label>Transactions</label>
            <span>{{ blockInfo.transactionCount || blockInfo.transactions?.length || 0 }}</span>
          </div>
          <div class="info-item">
            <label>Gas Used</label>
            <span>{{ blockInfo.gasUsed || blockInfo.gas_used || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Gas Limit</label>
            <span>{{ blockInfo.gasLimit || blockInfo.gas_limit || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Receipt Tab -->
    <div v-if="activeTab === 'receipt'" class="tab-content">
      <div class="input-group">
        <input 
          v-model="txHash" 
          type="text" 
          placeholder="Enter transaction hash (0x...)"
          @keyup.enter="fetchReceipt"
        />
        <button @click="fetchReceipt" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Get Receipt' }}
        </button>
      </div>

      <div v-if="txReceipt" class="result-card">
        <h3>Transaction Receipt</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Transaction Hash</label>
            <span class="mono">{{ txReceipt.transactionHash || txReceipt.hash || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Block Number</label>
            <span>{{ txReceipt.blockNumber || txReceipt.block_number || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Status</label>
            <span :class="['status', txReceipt.status === '0x1' || txReceipt.status === 1 ? 'success' : 'failed']">
              {{ txReceipt.status === '0x1' || txReceipt.status === 1 ? 'Success' : 'Failed' }}
            </span>
          </div>
          <div class="info-item">
            <label>From</label>
            <span class="mono">{{ formatAddress(txReceipt.from) }}</span>
          </div>
          <div class="info-item">
            <label>To</label>
            <span class="mono">{{ formatAddress(txReceipt.to) }}</span>
          </div>
          <div class="info-item">
            <label>Gas Used</label>
            <span>{{ txReceipt.gasUsed || txReceipt.gas_used || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Contract Address</label>
            <span class="mono">{{ formatAddress(txReceipt.contractAddress || txReceipt.contract_address) }}</span>
          </div>
          <div class="info-item">
            <label>Logs</label>
            <span>{{ txReceipt.logs?.length || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Block Scan Tab -->
    <div v-if="activeTab === 'scan'" class="tab-content">
      <div class="input-group range">
        <input 
          v-model.number="scanFrom" 
          type="number" 
          placeholder="From block"
        />
        <span class="separator">→</span>
        <input 
          v-model.number="scanTo" 
          type="number" 
          placeholder="To block"
        />
        <button @click="fetchScanResults" :disabled="loading" class="btn-primary">
          {{ loading ? 'Scanning...' : 'Scan' }}
        </button>
      </div>

      <div v-if="scanResults.length > 0" class="result-list">
        <div v-for="(block, idx) in scanResults" :key="idx" class="result-item">
          <div class="block-header">
            <span class="block-num">#{{ block.number }}</span>
            <span class="tx-count">{{ block.transactionCount || block.transactions?.length || 0 }} txs</span>
          </div>
          <div class="block-hash mono">{{ block.hash }}</div>
          <div class="block-time">{{ formatTime(block.timestamp) }}</div>
        </div>
      </div>
      <div v-else-if="!loading && !error" class="empty">
        Enter a block range (max 100) and click Scan
      </div>
    </div>
  </div>
</template>

<style scoped>
.block-explorer {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  color: #eee;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.latest-block {
  font-size: 0.9rem;
  color: #888;
}

.highlight {
  color: #4ade80;
  font-weight: bold;
  margin-left: 4px;
}

.btn-refresh {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  margin-left: 8px;
}

.btn-refresh:hover {
  color: #4ade80;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 12px;
}

.tab {
  background: transparent;
  border: 1px solid #444;
  color: #888;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  border-color: #4ade80;
  color: #4ade80;
}

.tab.active {
  background: #4ade80;
  border-color: #4ade80;
  color: #1a1a2e;
}

.error {
  background: #fee;
  color: #c00;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.input-group.range {
  flex-wrap: wrap;
}

.input-group input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  background: #252540;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 0.95rem;
}

.input-group input:focus {
  outline: none;
  border-color: #4ade80;
}

.separator {
  display: flex;
  align-items: center;
  color: #666;
}

.btn-primary {
  padding: 10px 20px;
  background: #4ade80;
  border: none;
  border-radius: 6px;
  color: #1a1a2e;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #22c55e;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-card {
  background: #252540;
  border-radius: 8px;
  padding: 16px;
}

.result-card h3 {
  margin: 0 0 16px 0;
  color: #4ade80;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 0.8rem;
  color: #888;
}

.info-item span {
  font-size: 0.9rem;
  word-break: break-all;
}

.mono {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.85rem;
}

.status.success {
  color: #4ade80;
}

.status.failed {
  color: #f87171;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  background: #252540;
  border-radius: 6px;
  padding: 12px;
}

.block-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.block-num {
  color: #4ade80;
  font-weight: bold;
}

.tx-count {
  color: #888;
  font-size: 0.85rem;
}

.block-hash {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 4px;
}

.block-time {
  font-size: 0.8rem;
  color: #666;
}

.empty {
  text-align: center;
  color: #666;
  padding: 40px;
}
</style>
