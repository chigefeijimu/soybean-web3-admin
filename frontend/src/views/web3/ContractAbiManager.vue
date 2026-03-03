<template>
  <div class="abi-manager">
    <div class="header">
      <h2>📋 Smart Contract ABI Manager</h2>
      <p>Manage, search, and share smart contract ABIs. Decode transactions and lookup function signatures.</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- ABI Lookup Tab -->
    <div v-if="activeTab === 'lookup'" class="tab-content">
      <div class="form-section">
        <label>Select Chain</label>
        <select v-model="selectedChain">
          <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
            {{ chain.name }}
          </option>
        </select>
      </div>

      <div class="form-section">
        <label>Contract Address</label>
        <input v-model="lookupAddress" placeholder="0x..." />
      </div>

      <button @click="lookupABI" :disabled="loading" class="action-btn">
        {{ loading ? 'Loading...' : 'Lookup ABI' }}
      </button>

      <div v-if="abiResult" class="result-card">
        <div class="abi-header">
          <h3>{{ abiResult.name }}</h3>
          <span class="chain-badge">{{ abiResult.chain }}</span>
          <span v-if="abiResult.verified" class="verified-badge">✓ Verified</span>
        </div>
        
        <div class="abi-stats">
          <div class="stat">
            <span class="stat-value">{{ abiResult.functions.length }}</span>
            <span class="stat-label">Functions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ abiResult.events.length }}</span>
            <span class="stat-label">Events</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ abiResult.tags?.join(', ') || 'None' }}</span>
            <span class="stat-label">Tags</span>
          </div>
        </div>

        <!-- Functions List -->
        <div class="abi-section">
          <h4>Functions ({{ abiResult.functions.length }})</h4>
          <div class="function-list">
            <div v-for="fn in abiResult.functions" :key="fn.selector" class="function-item">
              <span class="fn-name">{{ fn.name }}</span>
              <code class="fn-selector">{{ fn.selector }}</code>
              <span class="fn-mutability">{{ fn.stateMutability }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add ABI Tab -->
    <div v-if="activeTab === 'add'" class="tab-content">
      <div class="form-section">
        <label>Contract Name</label>
        <input v-model="newABI.name" placeholder="My Token" />
      </div>

      <div class="form-row">
        <div class="form-section">
          <label>Chain</label>
          <select v-model="newABI.chain">
            <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
              {{ chain.name }}
            </option>
          </select>
        </div>
        <div class="form-section">
          <label>Contract Address</label>
          <input v-model="newABI.address" placeholder="0x..." />
        </div>
      </div>

      <div class="form-section">
        <label>ABI JSON</label>
        <textarea 
          v-model="newABI.abi" 
          placeholder='[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"}, ...]'
          rows="10"
        ></textarea>
      </div>

      <div class="form-section">
        <label>Tags (comma separated)</label>
        <input v-model="newABI.tagsInput" placeholder="erc20, token, defi" />
      </div>

      <button @click="addABI" :disabled="loading" class="action-btn">
        {{ loading ? 'Adding...' : 'Add ABI' }}
      </button>

      <div v-if="addResult" :class="['result-card', addResult.success ? 'success' : 'error']">
        <span class="icon">{{ addResult.success ? '✓' : '✗' }}</span>
        {{ addResult.message }}
      </div>
    </div>

    <!-- Decode Transaction Tab -->
    <div v-if="activeTab === 'decode'" class="tab-content">
      <div class="form-section">
        <label>Select Chain</label>
        <select v-model="decodeChain">
          <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
            {{ chain.name }}
          </option>
        </select>
      </div>

      <div class="form-section">
        <label>Contract Address</label>
        <input v-model="decodeAddress" placeholder="0x..." />
      </div>

      <div class="form-section">
        <label>Transaction Data</label>
        <input v-model="decodeData" placeholder="0xa9059cbb000000000000000000000000..." />
      </div>

      <button @click="decodeTx" :disabled="loading" class="action-btn">
        {{ loading ? 'Decoding...' : 'Decode Transaction' }}
      </button>

      <div v-if="decodeResult" class="result-card">
        <h4>Decoded Transaction</h4>
        <div class="decode-info">
          <div class="info-row">
            <span class="label">Function:</span>
            <span class="value">{{ decodeResult.functionName }}</span>
          </div>
          <div class="info-row">
            <span class="label">Selector:</span>
            <code class="value">{{ decodeResult.functionSelector }}</code>
          </div>
        </div>

        <div v-if="decodeResult.args && Object.keys(decodeResult.args).length > 0" class="args-section">
          <h5>Arguments</h5>
          <div v-for="(value, key) in decodeResult.args" :key="key" class="arg-item">
            <span class="arg-name">{{ key }}:</span>
            <span class="arg-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Function Signatures Tab -->
    <div v-if="activeTab === 'signatures'" class="tab-content">
      <div class="form-section">
        <label>Search Function Signatures</label>
        <input v-model="signatureSearch" placeholder="Search by name or selector..." />
      </div>

      <div class="signature-list">
        <div v-for="sig in filteredSignatures" :key="sig.selector" class="signature-item">
          <div class="sig-header">
            <span class="sig-name">{{ sig.name }}</span>
            <code class="sig-selector">{{ sig.selector }}</code>
          </div>
          <div class="sig-details">
            <code class="sig-signature">{{ sig.signature }}</code>
            <span class="sig-desc">{{ sig.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search ABI Tab -->
    <div v-if="activeTab === 'search'" class="tab-content">
      <div class="form-section">
        <label>Search ABIs</label>
        <input v-model="searchQuery" placeholder="Search by name, address, or tag..." />
      </div>

      <button @click="searchABIs" :disabled="loading" class="action-btn">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>

      <div v-if="searchResults.length > 0" class="search-results">
        <div v-for="result in searchResults" :key="result.id" class="result-card clickable" @click="viewABI(result)">
          <div class="abi-header">
            <h4>{{ result.name }}</h4>
            <span class="chain-badge">{{ result.chain }}</span>
          </div>
          <div class="abi-address">{{ result.address }}</div>
          <div class="abi-meta">
            <span>{{ result.functions.length }} functions</span>
            <span>{{ result.events.length }} events</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Tab -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div v-if="stats" class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalABIs }}</div>
          <div class="stat-label">Total ABIs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalFunctions }}</div>
          <div class="stat-label">Total Functions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalEvents }}</div>
          <div class="stat-label">Total Events</div>
        </div>
      </div>

      <div v-if="stats?.chains" class="chain-distribution">
        <h4>Chain Distribution</h4>
        <div class="chain-bars">
          <div v-for="(count, chain) in stats.chains" :key="chain" class="chain-bar-item">
            <span class="chain-name">{{ chain }}</span>
            <div class="bar-container">
              <div class="bar" :style="{ width: (count / stats.totalABIs * 100) + '%' }"></div>
            </div>
            <span class="chain-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3023/contract-abi'

const chains = [
  { chainId: 'ethereum', name: 'Ethereum' },
  { chainId: 'polygon', name: 'Polygon' },
  { chainId: 'arbitrum', name: 'Arbitrum' },
  { chainId: 'optimism', name: 'Optimism' },
  { chainId: 'bsc', name: 'BSC' },
  { chainId: 'base', name: 'Base' },
  { chainId: 'avalanche', name: 'Avalanche' },
]

const tabs = [
  { id: 'lookup', name: 'ABI Lookup', icon: '🔍' },
  { id: 'add', name: 'Add ABI', icon: '➕' },
  { id: 'decode', name: 'Decode Tx', icon: '📝' },
  { id: 'signatures', name: 'Signatures', icon: '🔐' },
  { id: 'search', name: 'Search', icon: '🎯' },
  { id: 'stats', name: 'Statistics', icon: '📊' },
]

const activeTab = ref('lookup')
const loading = ref(false)
const selectedChain = ref('ethereum')
const lookupAddress = ref('')
const abiResult = ref<any>(null)
const signatures = ref<any[]>([])
const signatureSearch = ref('')
const stats = ref<any>(null)

const newABI = ref({
  name: '',
  address: '',
  chain: 'ethereum',
  abi: '',
  tagsInput: '',
})

const addResult = ref<{ success: boolean; message: string } | null>(null)

const decodeChain = ref('ethereum')
const decodeAddress = ref('')
const decodeData = ref('')
const decodeResult = ref<any>(null)

const searchQuery = ref('')
const searchResults = ref<any[]>([])

const filteredSignatures = computed(() => {
  if (!signatureSearch.value) return signatures.value
  const query = signatureSearch.value.toLowerCase()
  return signatures.value.filter(sig => 
    sig.name.toLowerCase().includes(query) ||
    sig.selector.toLowerCase().includes(query) ||
    sig.signature.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await loadSignatures()
  await loadStats()
})

async function loadSignatures() {
  try {
    const res = await axios.get(`${API_BASE}/signatures`)
    signatures.value = res.data
  } catch (e) {
    console.error('Failed to load signatures', e)
  }
}

async function loadStats() {
  try {
    const res = await axios.get(`${API_BASE}/stats`)
    stats.value = res.data
  } catch (e) {
    console.error('Failed to load stats', e)
  }
}

async function lookupABI() {
  if (!lookupAddress.value) return
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/get/${selectedChain.value}/${lookupAddress.value}`)
    abiResult.value = res.data
  } catch (e: any) {
    abiResult.value = null
    if (e.response?.status !== 404) {
      console.error('Failed to lookup ABI', e)
    }
  } finally {
    loading.value = false
  }
}

async function addABI() {
  if (!newABI.value.name || !newABI.value.address || !newABI.value.abi) return
  loading.value = true
  addResult.value = null
  try {
    const tags = newABI.value.tagsInput ? newABI.value.tagsInput.split(',').map(t => t.trim()) : []
    await axios.post(`${API_BASE}/add`, {
      name: newABI.value.name,
      address: newABI.value.address,
      chain: newABI.value.chain,
      abi: newABI.value.abi,
      tags,
    })
    addResult.value = { success: true, message: 'ABI added successfully!' }
    await loadStats()
  } catch (e: any) {
    addResult.value = { success: false, message: e.response?.data?.message || 'Failed to add ABI' }
  } finally {
    loading.value = false
  }
}

async function decodeTx() {
  if (!decodeAddress.value || !decodeData.value) return
  loading.value = true
  decodeResult.value = null
  try {
    const res = await axios.post(`${API_BASE}/decode-tx`, {
      chain: decodeChain.value,
      address: decodeAddress.value,
      data: decodeData.value,
    })
    decodeResult.value = res.data
  } catch (e) {
    console.error('Failed to decode', e)
  } finally {
    loading.value = false
  }
}

async function searchABIs() {
  if (!searchQuery.value) return
  loading.value = true
  searchResults.value = []
  try {
    const res = await axios.post(`${API_BASE}/search`, { query: searchQuery.value })
    searchResults.value = res.data
  } catch (e) {
    console.error('Failed to search', e)
  } finally {
    loading.value = false
  }
}

function viewABI(abi: any) {
  lookupAddress.value = abi.address
  selectedChain.value = abi.chain
  activeTab.value = 'lookup'
  abiResult.value = abi
}
</script>

<style scoped>
.abi-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}

.tab-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 16px;
}

.form-section label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-section input,
.form-section select,
.form-section textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-section textarea {
  font-family: monospace;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.action-btn {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.action-btn:hover:not(:disabled) {
  background: #4338ca;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-card {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background: #f9fafb;
}

.result-card.success {
  background: #d1fae5;
}

.result-card.error {
  background: #fee2e2;
}

.abi-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.abi-header h3 {
  margin: 0;
}

.chain-badge {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.verified-badge {
  background: #d1fae5;
  color: #059669;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.abi-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #4f46e5;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.abi-section {
  margin-top: 16px;
}

.abi-section h4 {
  margin: 0 0 12px 0;
}

.function-list {
  max-height: 300px;
  overflow-y: auto;
}

.function-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.fn-name {
  font-weight: 500;
  color: #333;
}

.fn-selector {
  font-size: 12px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.fn-mutability {
  font-size: 12px;
  color: #666;
}

.signature-list {
  max-height: 500px;
  overflow-y: auto;
}

.signature-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.sig-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.sig-name {
  font-weight: 600;
  color: #333;
}

.sig-selector {
  font-size: 12px;
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 6px;
  border-radius: 4px;
}

.sig-details {
  font-size: 13px;
}

.sig-signature {
  display: block;
  color: #666;
  font-family: monospace;
  margin-bottom: 4px;
}

.sig-desc {
  color: #999;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-card .stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #4f46e5;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.chain-distribution h4 {
  margin: 0 0 16px 0;
}

.chain-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.chain-name {
  width: 80px;
  font-size: 13px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s;
}

.chain-count {
  width: 40px;
  text-align: right;
  font-size: 13px;
  color: #666;
}

.decode-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.info-row .label {
  font-weight: 500;
  color: #666;
}

.args-section h5 {
  margin: 0 0 12px 0;
}

.arg-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.arg-name {
  font-weight: 500;
  color: #4f46e5;
}

.arg-value {
  color: #333;
  font-family: monospace;
}

.search-results {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 20px;
}

.result-card.clickable {
  cursor: pointer;
  transition: transform 0.2s;
}

.result-card.clickable:hover {
  transform: translateY(-2px);
}

.abi-address {
  font-size: 12px;
  color: #666;
  font-family: monospace;
  margin: 8px 0;
}

.abi-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}
</style>
