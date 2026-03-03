<template>
  <div class="smart-account-tracker">
    <div class="header">
      <h1>🔐 Smart Account Tracker</h1>
      <p class="subtitle">Track ERC-4337 Smart Accounts, UserOperations, Bundlers & Paymasters</p>
    </div>

    <!-- Chain Status -->
    <div class="chain-status-section">
      <h2>Network Status</h2>
      <div class="chain-grid">
        <div
          v-for="chain in chainStatus"
          :key="chain.chainId"
          class="chain-card"
          :class="{ active: selectedChain === chain.chainId }"
          @click="selectChain(chain.chainId)"
        >
          <div class="chain-name">{{ chain.chainName }}</div>
          <div class="chain-id">Chain {{ chain.chainId }}</div>
          <div class="chain-stats">
            <div class="stat">
              <span class="label">UserOps Today</span>
              <span class="value">{{ formatNumber(chain.userOpsToday) }}</span>
            </div>
            <div class="stat">
              <span class="label">Avg Gas</span>
              <span class="value">{{ chain.avgGasPrice }} ETH</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">📱</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.totalSmartAccounts) }}</div>
          <div class="stat-label">Total Smart Accounts</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.totalUserOperations) }}</div>
          <div class="stat-label">Total UserOperations</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeBundlers }}</div>
          <div class="stat-label">Active Bundlers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activePaymasters }}</div>
          <div class="stat-label">Active Paymasters</div>
        </div>
      </div>
    </div>

    <!-- Search & Analysis -->
    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter smart account address (0x...)"
          @keyup.enter="searchAccount"
        />
        <select v-model="searchChain">
          <option :value="1">Ethereum</option>
          <option :value="8453">Base</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
          <option :value="137">Polygon</option>
        </select>
        <button @click="searchAccount" :disabled="!searchAddress">Search</button>
      </div>
    </div>

    <!-- Account Info -->
    <div v-if="accountInfo" class="account-section">
      <h2>Account Details</h2>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Address</div>
          <div class="info-value address">{{ accountInfo.address }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Factory</div>
          <div class="info-value address">{{ accountInfo.factory }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Owner</div>
          <div class="info-value address">{{ accountInfo.owner }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Implementation</div>
          <div class="info-value address">{{ accountInfo.implementation }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Nonce</div>
          <div class="info-value">{{ accountInfo.nonce }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Created</div>
          <div class="info-value">{{ formatDate(accountInfo.createdAt) }}</div>
        </div>
      </div>
    </div>

    <!-- Usage Analysis -->
    <div v-if="accountAnalysis" class="analysis-section">
      <h2>Account Usage Analysis</h2>
      <div class="analysis-grid">
        <div class="analysis-card">
          <div class="analysis-label">Total Operations</div>
          <div class="analysis-value">{{ accountAnalysis.totalOps }}</div>
        </div>
        <div class="analysis-card">
          <div class="analysis-label">First Seen</div>
          <div class="analysis-value">{{ formatDate(accountAnalysis.firstSeen) }}</div>
        </div>
        <div class="analysis-card">
          <div class="analysis-label">Last Seen</div>
          <div class="analysis-value">{{ formatDate(accountAnalysis.lastSeen) }}</div>
        </div>
        <div class="analysis-card">
          <div class="analysis-label">Total Gas Spent</div>
          <div class="analysis-value">{{ accountAnalysis.totalGasSpent }} ETH</div>
        </div>
        <div class="analysis-card">
          <div class="analysis-label">Avg Confirmation</div>
          <div class="analysis-value">{{ accountAnalysis.avgConfirmationTime }}s</div>
        </div>
        <div class="analysis-card">
          <div class="analysis-label">Most Used Bundler</div>
          <div class="analysis-value address small">{{ accountAnalysis.mostUsedBundler }}</div>
        </div>
      </div>

      <h3>Operations by Type</h3>
      <div class="ops-breakdown">
        <div
          v-for="(count, type) in accountAnalysis.operationsByType"
          :key="type"
          class="op-type"
        >
          <span class="op-name">{{ formatOpType(type) }}</span>
          <div class="op-bar">
            <div
              class="op-fill"
              :style="{ width: (count / maxOpCount * 100) + '%' }"
            ></div>
          </div>
          <span class="op-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- User Operations -->
    <div v-if="userOperations.length > 0" class="operations-section">
      <h2>UserOperations History</h2>
      <div class="ops-table">
        <div class="table-header">
          <span>Tx Hash</span>
          <span>Nonce</span>
          <span>Gas Limit</span>
          <span>Max Fee</span>
          <span>Status</span>
          <span>Time</span>
        </div>
        <div
          v-for="op in userOperations"
          :key="op.transactionHash"
          class="table-row"
        >
          <span class="hash">{{ truncateHash(op.transactionHash) }}</span>
          <span>{{ op.nonce }}</span>
          <span>{{ formatNumber(parseInt(op.callGasLimit)) }}</span>
          <span>{{ (parseInt(op.maxFeePerGas) / 1e9).toFixed(2) }} Gwei</span>
          <span :class="'status-' + op.status">{{ op.status }}</span>
          <span>{{ formatTimeAgo(op.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Bundlers & Paymasters -->
    <div class="service-providers">
      <div class="providers-section">
        <h2>Top Bundlers</h2>
        <div class="providers-list">
          <div
            v-for="bundler in bundlers"
            :key="bundler.address"
            class="provider-card"
          >
            <div class="provider-header">
              <span class="provider-name">{{ bundler.name }}</span>
              <span class="provider-address">{{ truncateHash(bundler.address) }}</span>
            </div>
            <div class="provider-stats">
              <div class="p-stat">
                <span class="p-label">Total UserOps</span>
                <span class="p-value">{{ formatNumber(bundler.totalUserOps) }}</span>
              </div>
              <div class="p-stat">
                <span class="p-label">Success Rate</span>
                <span class="p-value">{{ (bundler.successRate * 100).toFixed(2) }}%</span>
              </div>
              <div class="p-stat">
                <span class="p-label">Stake</span>
                <span class="p-value">{{ bundler.stake }} ETH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="providers-section">
        <h2>Top Paymasters</h2>
        <div class="providers-list">
          <div
            v-for="pm in paymasters"
            :key="pm.address"
            class="provider-card"
          >
            <div class="provider-header">
              <span class="provider-name">{{ pm.name }}</span>
              <span :class="'pm-type type-' + pm.type">{{ pm.type }}</span>
            </div>
            <div class="provider-stats">
              <div class="p-stat">
                <span class="p-label">Total Sponsored</span>
                <span class="p-value">{{ formatNumber(pm.totalSponsored) }}</span>
              </div>
              <div class="p-stat">
                <span class="p-label">Avg Gas Covered</span>
                <span class="p-value">{{ formatNumber(pm.avgGasCovered) }}</span>
              </div>
              <div class="p-stat">
                <span class="p-label">Stake</span>
                <span class="p-value">{{ pm.stake }} ETH</span>
              </div>
            </div>
            <div class="supported-tokens">
              <span v-for="token in pm.supportedTokens" :key="token" class="token-tag">
                {{ token }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface ChainStatus {
  chainId: number;
  chainName: string;
  entryPoint: string;
  userOpsToday: number;
  avgGasPrice: string;
}

interface Stats {
  totalSmartAccounts: number;
  totalUserOperations: number;
  activeBundlers: number;
  activePaymasters: number;
}

interface AccountInfo {
  address: string;
  factory: string;
  owner: string;
  implementation?: string;
  nonce: number;
  createdAt: number;
}

interface AccountAnalysis {
  totalOps: number;
  firstSeen: number;
  lastSeen: number;
  mostUsedBundler: string;
  mostUsedPaymaster: string | null;
  totalGasSpent: string;
  operationsByType: Record<string, number>;
  avgConfirmationTime: number;
}

interface UserOperation {
  sender: string;
  nonce: string;
  callGasLimit: string;
  maxFeePerGas: string;
  transactionHash: string;
  status: string;
  timestamp: number;
}

interface Bundler {
  name: string;
  address: string;
  totalUserOps: number;
  successRate: number;
  stake: string;
}

interface Paymaster {
  name: string;
  address: string;
  type: string;
  totalSponsored: number;
  avgGasCovered: number;
  stake: string;
  supportedTokens: string[];
}

const chainStatus = ref<ChainStatus[]>([]);
const stats = ref<Stats>({
  totalSmartAccounts: 0,
  totalUserOperations: 0,
  activeBundlers: 0,
  activePaymasters: 0,
});
const selectedChain = ref(1);
const searchAddress = ref('');
const searchChain = ref(1);
const accountInfo = ref<AccountInfo | null>(null);
const accountAnalysis = ref<AccountAnalysis | null>(null);
const userOperations = ref<UserOperation[]>([]);
const bundlers = ref<Bundler[]>([]);
const paymasters = ref<Paymaster[]>([]);

const maxOpCount = computed(() => {
  if (!accountAnalysis.value) return 1;
  const counts = Object.values(accountAnalysis.value.operationsByType);
  return Math.max(...counts);
});

async function loadChainStatus() {
  try {
    const res = await fetch('/api/web3/smart-account/chain-status');
    chainStatus.value = await res.json();
  } catch (e) {
    console.error('Failed to load chain status', e);
  }
}

async function loadStats() {
  try {
    const res = await fetch(`/api/web3/smart-account/stats?chainId=${selectedChain.value}`);
    stats.value = await res.json();
  } catch (e) {
    console.error('Failed to load stats', e);
  }
}

async function loadBundlers() {
  try {
    const res = await fetch(`/api/web3/smart-account/bundlers?chainId=${selectedChain.value}&limit=5`);
    bundlers.value = await res.json();
  } catch (e) {
    console.error('Failed to load bundlers', e);
  }
}

async function loadPaymasters() {
  try {
    const res = await fetch(`/api/web3/smart-account/paymasters?chainId=${selectedChain.value}&limit=5`);
    paymasters.value = await res.json();
  } catch (e) {
    console.error('Failed to load paymasters', e);
  }
}

async function searchAccount() {
  if (!searchAddress.value) return;
  
  try {
    const [infoRes, opsRes, analysisRes] = await Promise.all([
      fetch(`/api/web3/smart-account/account/${searchAddress.value}?chainId=${searchChain.value}`),
      fetch(`/api/web3/smart-account/account/${searchAddress.value}/operations?chainId=${searchChain.value}&limit=10`),
      fetch(`/api/web3/smart-account/account/${searchAddress.value}/analysis?chainId=${searchChain.value}`),
    ]);
    
    const info = await infoRes.json();
    const ops = await opsRes.json();
    const analysis = await analysisRes.json();
    
    accountInfo.value = info;
    userOperations.value = ops.data || [];
    accountAnalysis.value = analysis;
  } catch (e) {
    console.error('Failed to search account', e);
  }
}

function selectChain(chainId: number) {
  selectedChain.value = chainId;
  searchChain.value = chainId;
  loadStats();
  loadBundlers();
  loadPaymasters();
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return hash.slice(0, 6) + '...' + hash.slice(-4);
}

function formatOpType(type: string): string {
  const types: Record<string, string> = {
    'token_transfer': 'Token Transfer',
    'swap': 'Swap',
    'nft_transfer': 'NFT Transfer',
    'approve': 'Approve',
    'generic': 'Generic Call',
  };
  return types[type] || type;
}

onMounted(() => {
  loadChainStatus();
  loadStats();
  loadBundlers();
  loadPaymasters();
});
</script>

<style scoped>
.smart-account-tracker {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

/* Chain Status */
.chain-status-section {
  margin-bottom: 30px;
}

.chain-status-section h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.chain-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.chain-card:hover {
  border-color: #4f46e5;
}

.chain-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
}

.chain-name {
  font-weight: 600;
  color: #1a1a2e;
}

.chain-id {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 10px;
}

.chain-stats .stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-top: 5px;
}

.chain-stats .label {
  color: #666;
}

.chain-stats .value {
  font-weight: 600;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

/* Search Section */
.search-section {
  margin-bottom: 30px;
}

.search-box {
  display: flex;
  gap: 10px;
  max-width: 800px;
  margin: 0 auto;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box select {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.search-box button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.search-box button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Account Section */
.account-section, .analysis-section, .operations-section {
  margin-bottom: 30px;
}

.account-section h2, .analysis-section h2, .operations-section h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.info-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 5px;
}

.info-value {
  font-weight: 600;
  color: #1a1a2e;
}

.info-value.address {
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
}

.info-value.small {
  font-size: 0.75rem;
}

/* Analysis Section */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.analysis-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.analysis-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 5px;
}

.analysis-value {
  font-weight: 600;
  color: #1a1a2e;
}

.ops-breakdown {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.op-type {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}

.op-name {
  width: 120px;
  font-size: 0.9rem;
}

.op-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.op-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 10px;
  transition: width 0.3s;
}

.op-count {
  width: 50px;
  text-align: right;
  font-weight: 600;
}

/* Operations Table */
.ops-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.table-header, .table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 12px 15px;
  gap: 10px;
  align-items: center;
}

.table-header {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.85rem;
  color: #666;
}

.table-row {
  border-top: 1px solid #eee;
  font-size: 0.9rem;
}

.table-row .hash {
  font-family: monospace;
  color: #4f46e5;
}

.status-pending {
  color: #f59e0b;
}

.status-included {
  color: #10b981;
}

.status-failed {
  color: #ef4444;
}

/* Service Providers */
.service-providers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.providers-section h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.provider-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.provider-name {
  font-weight: 600;
  color: #1a1a2e;
}

.provider-address {
  font-family: monospace;
  font-size: 0.8rem;
  color: #666;
}

.provider-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.p-stat {
  display: flex;
  flex-direction: column;
}

.p-label {
  font-size: 0.75rem;
  color: #666;
}

.p-value {
  font-weight: 600;
  color: #1a1a2e;
}

.supported-tokens {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.token-tag {
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.pm-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-verifying {
  background: #dbeafe;
  color: #2563eb;
}

.type-static {
  background: #d1fae5;
  color: #059669;
}

.type-conditional {
  background: #fef3c7;
  color: #d97706;
}
</style>
