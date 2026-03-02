<template>
  <div class="fund-flow-analyzer">
    <div class="header">
      <h2>🔄 Fund Flow Analyzer</h2>
      <div class="network-select">
        <select v-model="selectedChain" @change="loadData">
          <option v-for="network in networks" :key="network.id" :value="network.id">
            {{ network.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="search-box">
      <input 
        v-model="searchAddress" 
        placeholder="Enter wallet address (0x...)" 
        @keyup.enter="loadData"
      />
      <button @click="loadData" :disabled="loading">
        {{ loading ? 'Loading...' : 'Analyze' }}
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="data" class="results">
      <!-- Flow Stats -->
      <div class="stats-grid">
        <div class="stat-card inflow">
          <div class="stat-label">Total Inflow</div>
          <div class="stat-value">{{ data.stats?.totalIn || '0' }} ETH</div>
        </div>
        <div class="stat-card outflow">
          <div class="stat-label">Total Outflow</div>
          <div class="stat-value">{{ data.stats?.totalOut || '0' }} ETH</div>
        </div>
        <div class="stat-card net">
          <div class="stat-label">Net Flow</div>
          <div class="stat-value" :class="Number(data.stats?.netFlow) >= 0 ? 'positive' : 'negative'">
            {{ data.stats?.netFlow || '0' }} ETH
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Transactions</div>
          <div class="stat-value">{{ data.stats?.txCount || 0 }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Counterparties -->
      <div v-if="activeTab === 'counterparties'" class="counterparties">
        <h3>Top Counterparties</h3>
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>In</th>
              <th>Out</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="party in data.counterparties" :key="party.address">
              <td class="address">{{ shortenAddress(party.address) }}</td>
              <td class="in">{{ party.totalIn }} ETH</td>
              <td class="out">{{ party.totalOut }} ETH</td>
              <td :class="Number(party.netFlow) >= 0 ? 'positive' : 'negative'">{{ party.netFlow }} ETH</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Large Transactions -->
      <div v-if="activeTab === 'large-txs'" class="large-txs">
        <h3>Large Transactions (>1 ETH)</h3>
        <table>
          <thead>
            <tr>
              <th>Hash</th>
              <th>Direction</th>
              <th>Value</th>
              <th>Counterparty</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in data.recentLargeTxs" :key="tx.hash">
              <td class="hash">{{ shortenAddress(tx.hash) }}</td>
              <td :class="tx.direction">{{ tx.direction }}</td>
              <td>{{ tx.value }} ETH</td>
              <td class="address">{{ shortenAddress(tx.counterparty) }}</td>
              <td>{{ formatTime(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Alerts -->
      <div v-if="activeTab === 'alerts'" class="alerts-panel">
        <h3>Set Alert</h3>
        <div class="alert-form">
          <input v-model="alertThreshold" type="number" placeholder="Threshold (ETH)" />
          <select v-model="alertDirection">
            <option value="in">Incoming</option>
            <option value="out">Outgoing</option>
            <option value="both">Both</option>
          </select>
          <button @click="setAlert" :disabled="!searchAddress">Set Alert</button>
        </div>
        <div v-if="alertMessage" class="alert-message">{{ alertMessage }}</div>
        
        <h4>Your Alerts</h4>
        <div v-if="alerts.length === 0" class="no-data">No alerts set</div>
        <ul v-else class="alert-list">
          <li v-for="alert in alerts" :key="alert.id">
            {{ alert.direction }} - {{ alert.threshold }} ETH 
            <span class="created">{{ formatTime(alert.createdAt) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Top Lists -->
    <div class="top-lists">
      <div class="top-section">
        <h3>🐋 Top Receivers</h3>
        <button @click="loadTopReceivers" :disabled="loadingTop">Refresh</button>
        <table v-if="topReceivers.length">
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th>Total</th>
              <th>Tx Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in topReceivers" :key="item.address">
              <td>{{ item.rank }}</td>
              <td class="address" @click="searchAddress = item.address; loadData()">
                {{ shortenAddress(item.address) }}
              </td>
              <td>{{ item.totalFlow }} ETH</td>
              <td>{{ item.txCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="top-section">
        <h3>📤 Top Senders</h3>
        <button @click="loadTopSenders" :disabled="loadingTop">Refresh</button>
        <table v-if="topSenders.length">
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th>Total</th>
              <th>Tx Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in topSenders" :key="item.address">
              <td>{{ item.rank }}</td>
              <td class="address" @click="searchAddress = item.address; loadData()">
                {{ shortenAddress(item.address) }}
              </td>
              <td>{{ item.totalFlow }} ETH</td>
              <td>{{ item.txCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Anomaly Detection -->
    <div v-if="data" class="anomaly-section">
      <h3>⚠️ Anomaly Detection</h3>
      <button @click="detectAnomalies" :disabled="loadingAnomaly">
        {{ loadingAnomaly ? 'Analyzing...' : 'Run Analysis' }}
      </button>
      <div v-if="anomalyData" class="anomaly-results">
        <div class="risk-score" :class="getRiskClass(anomalyData.riskScore)">
          Risk Score: {{ anomalyData.riskScore }}/100
        </div>
        <p class="recommendation">{{ anomalyData.recommendation }}</p>
        <div v-if="anomalyData.anomalies?.length" class="anomalies-list">
          <h4>Detected Anomalies:</h4>
          <ul>
            <li v-for="(anomaly, idx) in anomalyData.anomalies" :key="idx">
              <span class="anomaly-type">{{ anomaly.type }}</span>
              <span v-if="anomaly.value">{{ anomaly.value }} ETH</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Flow Pattern -->
    <div v-if="data" class="pattern-section">
      <h3>📊 Flow Pattern Analysis</h3>
      <button @click="analyzePattern" :disabled="loadingPattern">
        {{ loadingPattern ? 'Analyzing...' : 'Analyze Pattern' }}
      </button>
      <div v-if="patternData" class="pattern-results">
        <div class="classification">
          <span class="type">{{ patternData.classification?.type }}</span>
          <span class="confidence">({{ patternData.classification?.confidence }}% confidence)</span>
        </div>
        <p>{{ patternData.classification?.description }}</p>
        
        <div class="patterns-grid">
          <div class="pattern-card">
            <h4>Transaction Sizes</h4>
            <div class="size-dist">
              <span class="small">Small: {{ patternData.sizePatterns?.small }}</span>
              <span class="medium">Medium: {{ patternData.sizePatterns?.medium }}</span>
              <span class="large">Large: {{ patternData.sizePatterns?.large }}</span>
              <span class="whale">Whale: {{ patternData.sizePatterns?.whale }}</span>
            </div>
          </div>
          <div class="pattern-card">
            <h4>Counterparties</h4>
            <p>Unique: {{ patternData.counterpartyPatterns?.uniqueCounterparties }}</p>
            <p>Concentration: {{ patternData.counterpartyPatterns?.concentration }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { request } from '@/service/request';

const searchAddress = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const loadingTop = ref(false);
const loadingAnomaly = ref(false);
const loadingPattern = ref(false);
const error = ref('');
const data = ref<any>(null);
const topReceivers = ref<any[]>([]);
const topSenders = ref<any[]>([]);
const anomalyData = ref<any>(null);
const patternData = ref<any>(null);
const alerts = ref<any[]>([]);

const alertThreshold = ref(1);
const alertDirection = ref('both');
const alertMessage = ref('');

const activeTab = ref('counterparties');

const tabs = [
  { id: 'counterparties', label: 'Counterparties' },
  { id: 'large-txs', label: 'Large Txs' },
  { id: 'alerts', label: 'Alerts' },
];

const networks = [
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 56, name: 'BSC' },
];

onMounted(() => {
  loadTopReceivers();
  loadTopSenders();
});

async function loadData() {
  if (!searchAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await request({
      url: '/web3/fund-flow/track-address',
      method: 'get',
      params: { 
        address: searchAddress.value, 
        chainId: selectedChain.value 
      }
    });
    data.value = response;
    
    // Load alerts for this address
    await loadAlerts();
  } catch (e: any) {
    error.value = e.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

async function loadTopReceivers() {
  loadingTop.value = true;
  try {
    const response = await request({
      url: '/web3/fund-flow/top-receivers',
      method: 'get',
      params: { chainId: selectedChain.value, limit: 10 }
    });
    topReceivers.value = response.receivers || [];
  } catch (e) {
    console.error('Failed to load top receivers:', e);
  } finally {
    loadingTop.value = false;
  }
}

async function loadTopSenders() {
  loadingTop.value = true;
  try {
    const response = await request({
      url: '/web3/fund-flow/top-senders',
      method: 'get',
      params: { chainId: selectedChain.value, limit: 10 }
    });
    topSenders.value = response.senders || [];
  } catch (e) {
    console.error('Failed to load top senders:', e);
  } finally {
    loadingTop.value = false;
  }
}

async function setAlert() {
  if (!searchAddress.value) return;
  
  try {
    const response = await request({
      url: '/web3/fund-flow/set-alert',
      method: 'post',
      data: {
        address: searchAddress.value,
        chainId: selectedChain.value,
        threshold: alertThreshold.value,
        direction: alertDirection.value,
      }
    });
    alertMessage.value = response.message;
    await loadAlerts();
    setTimeout(() => alertMessage.value = '', 3000);
  } catch (e: any) {
    alertMessage.value = e.message || 'Failed to set alert';
  }
}

async function loadAlerts() {
  try {
    const response = await request({
      url: '/web3/fund-flow/alerts',
      method: 'get',
      params: { address: searchAddress.value }
    });
    alerts.value = response.alerts || [];
  } catch (e) {
    console.error('Failed to load alerts:', e);
  }
}

async function detectAnomalies() {
  if (!searchAddress.value) return;
  
  loadingAnomaly.value = true;
  try {
    const response = await request({
      url: '/web3/fund-flow/anomaly-detection',
      method: 'get',
      params: { address: searchAddress.value, chainId: selectedChain.value }
    });
    anomalyData.value = response;
  } catch (e: any) {
    error.value = e.message || 'Failed to detect anomalies';
  } finally {
    loadingAnomaly.value = false;
  }
}

async function analyzePattern() {
  if (!searchAddress.value) return;
  
  loadingPattern.value = true;
  try {
    const response = await request({
      url: '/web3/fund-flow/flow-pattern',
      method: 'get',
      params: { address: searchAddress.value, chainId: selectedChain.value }
    });
    patternData.value = response;
  } catch (e: any) {
    error.value = e.message || 'Failed to analyze pattern';
  } finally {
    loadingPattern.value = false;
  }
}

function shortenAddress(addr: string): string {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
}

function getRiskClass(score: number): string {
  if (score < 20) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}
</script>

<style scoped>
.fund-flow-analyzer {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.network-select select {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-box input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-box button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.search-box button:disabled {
  background: #999;
}

.error-message {
  padding: 12px;
  background: #fee;
  color: #c00;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.inflow {
  border-left: 4px solid #10b981;
}

.stat-card.outflow {
  border-left: 4px solid #ef4444;
}

.stat-card.net {
  border-left: 4px solid #4f46e5;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
}

.tabs button.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

table {
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f9fafb;
  font-weight: 600;
  color: #666;
}

.address {
  font-family: monospace;
  color: #4f46e5;
  cursor: pointer;
}

.hash {
  font-family: monospace;
  font-size: 12px;
}

.in {
  color: #10b981;
}

.out {
  color: #ef4444;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.top-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 30px;
}

.top-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.top-section h3 {
  margin: 0 0 12px 0;
}

.top-section button {
  padding: 6px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 12px;
}

.top-section button:disabled {
  opacity: 0.5;
}

.alerts-panel, .anomaly-section, .pattern-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-top: 20px;
}

.alert-form {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.alert-form input, .alert-form select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.alert-form button {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.alert-message {
  padding: 8px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-list {
  list-style: none;
  padding: 0;
}

.alert-list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.alert-list .created {
  font-size: 12px;
  color: #999;
}

.anomaly-section button, .pattern-section button {
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 16px;
}

.risk-score {
  font-size: 24px;
  font-weight: bold;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.risk-score.low {
  background: #d1fae5;
  color: #065f46;
}

.risk-score.medium {
  background: #fef3c7;
  color: #92400e;
}

.risk-score.high {
  background: #fee2e2;
  color: #991b1b;
}

.risk-score.critical {
  background: #991b1b;
  color: white;
}

.recommendation {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin: 16px 0;
}

.anomalies-list h4 {
  margin-bottom: 8px;
}

.anomalies-list ul {
  list-style: none;
  padding: 0;
}

.anomalies-list li {
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 8px;
}

.anomaly-type {
  font-weight: 600;
  margin-right: 8px;
}

.classification {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.classification .type {
  font-size: 24px;
  font-weight: bold;
  color: #4f46e5;
}

.classification .confidence {
  color: #666;
}

.patterns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.pattern-card {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.pattern-card h4 {
  margin: 0 0 12px 0;
}

.size-dist {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-dist .small { color: #10b981; }
.size-dist .medium { color: #3b82f6; }
.size-dist .large { color: #f59e0b; }
.size-dist .whale { color: #8b5cf6; }

.no-data {
  color: #999;
  font-style: italic;
}
</style>
