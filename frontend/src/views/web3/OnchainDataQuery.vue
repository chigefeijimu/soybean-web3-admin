<template>
  <div class="onchain-data-query">
    <div class="header">
      <h2>🔍 On-chain Data Query</h2>
      <p>Query blockchain data using SQL-like syntax</p>
    </div>

    <div class="query-section">
      <div class="chain-selector">
        <label>Chain:</label>
        <select v-model="selectedChain" @change="onChainChange">
          <option v-for="chain in supportedChains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
      </div>

      <div class="chain-stats" v-if="chainStats">
        <div class="stat-item">
          <span class="label">Current Block:</span>
          <span class="value">{{ formatNumber(chainStats.currentBlock) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Gas Price:</span>
          <span class="value">{{ chainStats.gasPrice }} Gwei</span>
        </div>
        <div class="stat-item">
          <span class="label">TPS:</span>
          <span class="value">{{ chainStats.tps }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Total Txs:</span>
          <span class="value">{{ formatNumber(chainStats.totalTransactions) }}</span>
        </div>
      </div>

      <div class="query-editor">
        <label>Query:</label>
        <textarea
          v-model="query"
          placeholder="SELECT * FROM transactions WHERE chain = 'ethereum' AND address = '0x...' LIMIT 100"
          rows="4"
        ></textarea>
      </div>

      <div class="query-templates">
        <span class="label">Quick Templates:</span>
        <div class="template-buttons">
          <button
            v-for="template in queryTemplates"
            :key="template.name"
            @click="applyTemplate(template.query)"
            :title="template.description"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <button class="execute-btn" @click="executeQuery" :disabled="loading">
        {{ loading ? 'Executing...' : '▶ Execute Query' }}
      </button>

      <div class="error-message" v-if="error">
        ❌ {{ error }}
      </div>
    </div>

    <div class="results-section" v-if="queryResult">
      <div class="results-header">
        <h3>Results</h3>
        <div class="results-meta">
          <span v-if="queryResult.executionTime">⏱ {{ queryResult.executionTime }}ms</span>
          <span v-if="queryResult.rowCount">📊 {{ queryResult.rowCount }} rows</span>
        </div>
      </div>

      <div class="results-table" v-if="queryResult.data && queryResult.data.length">
        <table>
          <thead>
            <tr>
              <th v-for="key in getResultKeys()" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in queryResult.data" :key="idx">
              <td v-for="key in getResultKeys()" :key="key">
                {{ formatValue(row[key], key) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="no-results" v-else>
        No results found
      </div>
    </div>

    <div class="tools-section">
      <h3>🛠 Quick Tools</h3>
      <div class="tool-tabs">
        <button
          :class="{ active: activeTab === 'balance' }"
          @click="activeTab = 'balance'"
        >
          💰 Balance History
        </button>
        <button
          :class="{ active: activeTab === 'transfers' }"
          @click="activeTab = 'transfers'"
        >
          🔄 Token Transfers
        </button>
        <button
          :class="{ active: activeTab === 'block' }"
          @click="activeTab = 'block'"
        >
          📦 Block Data
        </button>
      </div>

      <div class="tool-content" v-if="activeTab === 'balance'">
        <div class="input-row">
          <input v-model="toolAddress" placeholder="Wallet Address (0x...)" />
          <button @click="getBalanceHistory">Query</button>
        </div>
        <div class="chart-container" v-if="balanceHistory.length">
          <div class="balance-item" v-for="item in balanceHistory" :key="item.blockNumber">
            <span class="block">Block {{ item.blockNumber }}</span>
            <span class="balance">{{ item.balance }} ETH</span>
            <span class="time">{{ formatTime(item.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div class="tool-content" v-if="activeTab === 'transfers'">
        <div class="input-row">
          <input v-model="toolAddress" placeholder="Wallet Address (0x...)" />
          <input v-model="toolToken" placeholder="Token Address (optional)" />
          <button @click="getTokenTransfersData">Query</button>
        </div>
        <div class="transfers-list" v-if="tokenTransfers.length">
          <div class="transfer-item" v-for="transfer in tokenTransfers" :key="transfer.transactionHash">
            <span class="token">{{ transfer.symbol }}</span>
            <span class="from">{{ shortAddress(transfer.from) }}</span>
            <span class="arrow">→</span>
            <span class="to">{{ shortAddress(transfer.to) }}</span>
            <span class="value">{{ transfer.value }}</span>
          </div>
        </div>
      </div>

      <div class="tool-content" v-if="activeTab === 'block'">
        <div class="input-row">
          <input v-model.number="toolBlockNumber" type="number" placeholder="Block Number" />
          <button @click="getBlockInfo">Query</button>
        </div>
        <div class="block-info" v-if="blockData">
          <div class="info-row">
            <span class="label">Block:</span>
            <span class="value">{{ blockData.blockNumber }}</span>
          </div>
          <div class="info-row">
            <span class="label">Hash:</span>
            <span class="value">{{ shortAddress(blockData.hash) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Transactions:</span>
            <span class="value">{{ blockData.transactions?.length || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">Gas Used:</span>
            <span class="value">{{ formatNumber(blockData.gasUsed) }} / {{ formatNumber(blockData.gasLimit) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Timestamp:</span>
            <span class="value">{{ formatTime(blockData.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  executeQuery,
  getChainStats,
  getSupportedChains,
  getQueryTemplates,
  getNativeBalanceHistory,
  getTokenTransfers as getTokenTransfersApi,
  getBlockData as getBlockDataApi,
} from '@/service/onchain-data-query';

const selectedChain = ref('ethereum');
const query = ref('SELECT * FROM transactions WHERE chain = \'ethereum\' AND address = \'0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1\' LIMIT 10');
const loading = ref(false);
const error = ref('');
const queryResult = ref<any>(null);
const supportedChains = ref<any[]>([]);
const chainStats = ref<any>(null);
const queryTemplates = ref<any[]>([]);

const activeTab = ref('balance');
const toolAddress = ref('');
const toolToken = ref('');
const toolBlockNumber = ref(19000000);
const balanceHistory = ref<any[]>([]);
const tokenTransfers = ref<any[]>([]);
const blockData = ref<any>(null);

onMounted(async () => {
  await loadSupportedChains();
  await loadQueryTemplates();
  await loadChainStats();
});

async function loadSupportedChains() {
  try {
    const res = await getSupportedChains();
    supportedChains.value = res.data || res;
  } catch (e) {
    console.error(e);
  }
}

async function loadQueryTemplates() {
  try {
    const res = await getQueryTemplates();
    queryTemplates.value = res.data || res;
  } catch (e) {
    console.error(e);
  }
}

async function loadChainStats() {
  try {
    const res = await getChainStats(selectedChain.value);
    chainStats.value = res.data || res;
  } catch (e) {
    console.error(e);
  }
}

function onChainChange() {
  loadChainStats();
}

function applyTemplate(template: string) {
  query.value = template;
}

async function executeQuery() {
  if (!query.value.trim()) {
    error.value = 'Please enter a query';
    return;
  }

  loading.value = true;
  error.value = '';
  queryResult.value = null;

  try {
    const res = await executeQuery(query.value, selectedChain.value);
    queryResult.value = res.data || res;
    if (!queryResult.value.success) {
      error.value = queryResult.value.error || 'Query failed';
    }
  } catch (e: any) {
    error.value = e.message || 'Query execution failed';
  } finally {
    loading.value = false;
  }
}

function getResultKeys(): string[] {
  if (!queryResult.value?.data?.length) return [];
  return Object.keys(queryResult.value.data[0]);
}

function formatValue(value: any, key: string): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  if (key.includes('hash') || key.includes('address')) return shortAddress(value);
  if (key.includes('timestamp')) return formatTime(value);
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

function shortAddress(addr: string): string {
  if (!addr) return '-';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatTime(timestamp: string): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString();
}

function formatNumber(num: number): string {
  if (!num && num !== 0) return '-';
  return num.toLocaleString();
}

async function getBalanceHistory() {
  if (!toolAddress.value) return;
  loading.value = true;
  try {
    const res = await getNativeBalanceHistory(
      selectedChain.value,
      toolAddress.value,
      18900000,
      19000000
    );
    balanceHistory.value = res.data || res;
  } catch (e) {
    error.value = 'Failed to get balance history';
  } finally {
    loading.value = false;
  }
}

async function getTokenTransfersData() {
  if (!toolAddress.value) return;
  loading.value = true;
  try {
    const res = await getTokenTransfersApi(
      selectedChain.value,
      toolAddress.value,
      toolToken.value || undefined,
      18900000,
      19000000,
      20
    );
    tokenTransfers.value = res.data || res;
  } catch (e) {
    error.value = 'Failed to get token transfers';
  } finally {
    loading.value = false;
  }
}

async function getBlockInfo() {
  if (!toolBlockNumber.value) return;
  loading.value = true;
  try {
    const res = await getBlockDataApi(selectedChain.value, toolBlockNumber.value);
    blockData.value = res.data || res;
  } catch (e) {
    error.value = 'Failed to get block data';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.onchain-data-query {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #1a1a2e;
}

.header p {
  margin: 0;
  color: #666;
}

.query-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.chain-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.chain-selector label {
  font-weight: 600;
  color: #333;
}

.chain-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.chain-stats {
  display: flex;
  gap: 24px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.stat-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.query-editor {
  margin-bottom: 16px;
}

.query-editor label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.query-editor textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  resize: vertical;
}

.query-templates {
  margin-bottom: 16px;
}

.query-templates .label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-buttons button {
  padding: 6px 12px;
  background: #e8f4ff;
  border: 1px solid #1890ff;
  border-radius: 6px;
  color: #1890ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-buttons button:hover {
  background: #1890ff;
  color: #fff;
}

.execute-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.execute-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.execute-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #ff4d4f;
}

.results-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-header h3 {
  margin: 0;
  color: #1a1a2e;
}

.results-meta {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 14px;
}

.results-table {
  overflow-x: auto;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.results-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.results-table td {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #555;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #999;
}

.tools-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tools-section h3 {
  margin: 0 0 16px 0;
  color: #1a1a2e;
}

.tool-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tool-tabs button {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-tabs button.active {
  background: #1890ff;
  color: #fff;
}

.tool-content {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.input-row button {
  padding: 8px 16px;
  background: #1890ff;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.chart-container {
  max-height: 300px;
  overflow-y: auto;
}

.balance-item,
.transfer-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.balance-item .block,
.transfer-item .token {
  font-weight: 600;
  color: #333;
  min-width: 100px;
}

.balance-item .balance {
  color: #1890ff;
  font-weight: 600;
}

.balance-item .time,
.transfer-item .value {
  color: #666;
  font-size: 13px;
}

.transfer-item .from,
.transfer-item .to {
  font-family: 'Monaco', monospace;
  font-size: 12px;
  color: #555;
}

.transfer-item .arrow {
  color: #999;
}

.block-info {
  display: grid;
  gap: 8px;
}

.info-row {
  display: flex;
  gap: 12px;
}

.info-row .label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.info-row .value {
  color: #555;
  font-family: 'Monaco', monospace;
  font-size: 13px;
}

.transfers-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
