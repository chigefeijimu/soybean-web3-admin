<template>
  <div class="address-clustering">
    <div class="header">
      <h2>🔗 Address Clustering Analyzer</h2>
      <p>Analyze and identify address clusters that may be controlled by the same entity</p>
    </div>

    <!-- Search Controls -->
    <div class="controls">
      <div class="control-group">
        <label>Wallet Address:</label>
        <input 
          v-model="searchAddress" 
          placeholder="0x..." 
          @keyup.enter="analyzeCluster"
        />
      </div>
      <div class="control-group">
        <label>Chain:</label>
        <select v-model="selectedChain">
          <option v-for="chain in chains" :key="chain.value" :value="chain.value">
            {{ chain.label }}
          </option>
        </select>
      </div>
      <div class="control-group">
        <label>Depth:</label>
        <select v-model="depth">
          <option :value="1">1 (Direct contacts)</option>
          <option :value="2">2 (Extended)</option>
          <option :value="3">3 (Full network)</option>
        </select>
      </div>
      <button @click="analyzeCluster" class="analyze-btn" :disabled="loading">
        {{ loading ? 'Analyzing...' : '🔍 Analyze' }}
      </button>
    </div>

    <!-- Relationship Analysis -->
    <div class="relationship-section">
      <h3>🔎 Address Relationship Check</h3>
      <div class="relationship-inputs">
        <input 
          v-model="addr1" 
          placeholder="Address 1 (0x...)" 
        />
        <span class="vs">VS</span>
        <input 
          v-model="addr2" 
          placeholder="Address 2 (0x...)" 
        />
        <button @click="checkRelationship" class="check-btn" :disabled="loadingRelationship">
          {{ loadingRelationship ? 'Checking...' : 'Check' }}
        </button>
      </div>
      
      <div v-if="relationshipResult" class="relationship-result">
        <div class="result-header">
          <span class="result-type">{{ relationshipResult.relationship.type }}</span>
          <span :class="['confidence-badge', getConfidenceClass(relationshipResult.relationship.confidence)]">
            {{ (relationshipResult.relationship.confidence * 100).toFixed(0) }}% confidence
          </span>
        </div>
        <p class="analysis-text">{{ relationshipResult.analysis }}</p>
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-label">Direct Transactions</span>
            <span class="metric-value">{{ relationshipResult.metrics.directTransactions }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Common Partners</span>
            <span class="metric-value">{{ relationshipResult.metrics.commonPartners }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Time Similarity</span>
            <span class="metric-value">{{ (relationshipResult.metrics.timeSimilarity * 100).toFixed(1) }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Amount Similarity</span>
            <span class="metric-value">{{ (relationshipResult.metrics.amountSimilarity * 100).toFixed(1) }}%</span>
          </div>
        </div>
        <div v-if="relationshipResult.relationship.flags.length" class="flags">
          <span v-for="flag in relationshipResult.relationship.flags" :key="flag" class="flag">
            {{ flag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Cluster Results -->
    <div v-if="clusterResult" class="cluster-results">
      <!-- Overview Stats -->
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-label">Cluster Size</div>
          <div class="stat-value">{{ clusterResult.clusterSize }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Cluster Type</div>
          <div class="stat-value cluster-type">{{ formatClusterType(clusterResult.clusterType) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Value</div>
          <div class="stat-value">${{ formatNumber(clusterResult.totalValue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Risk Score</div>
          <div :class="['stat-value', getRiskClass(clusterResult.analysis.riskScore)]">
            {{ clusterResult.analysis.riskScore }}/100
          </div>
        </div>
      </div>

      <!-- Analysis Details -->
      <div class="analysis-section">
        <h3>📊 Cluster Analysis</h3>
        <div class="analysis-grid">
          <div class="analysis-item">
            <span class="analysis-label">Concentration</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (clusterResult.analysis.concentration * 100) + '%' }"></div>
            </div>
            <span class="analysis-value">{{ (clusterResult.analysis.concentration * 100).toFixed(1) }}%</span>
          </div>
          <div class="analysis-item">
            <span class="analysis-label">Avg Transaction Size</span>
            <span class="analysis-value">${{ clusterResult.analysis.avgTransactionSize.toFixed(2) }}</span>
          </div>
          <div class="analysis-item">
            <span class="analysis-label">Time Pattern</span>
            <span class="analysis-value">{{ formatTimePattern(clusterResult.analysis.timePattern) }}</span>
          </div>
          <div class="analysis-item">
            <span class="analysis-label">Behavior Type</span>
            <span class="analysis-value">{{ formatBehaviorType(clusterResult.analysis.behaviorType) }}</span>
          </div>
        </div>
        
        <div v-if="clusterResult.analysis.flags.length" class="flags-section">
          <h4>🚩 Flags</h4>
          <div class="flags-list">
            <span v-for="flag in clusterResult.analysis.flags" :key="flag" class="flag-item">
              {{ flag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cluster Members -->
      <div class="members-section">
        <h3>👥 Cluster Members ({{ clusterResult.cluster.length }})</h3>
        <div class="members-table">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Type</th>
                <th>Confidence</th>
                <th>Relationships</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="node in clusterResult.cluster" :key="node.address" class="member-row">
                <td class="address-cell">
                  <span class="address" :title="node.address">
                    {{ shortenAddress(node.address) }}
                  </span>
                  <span v-if="node.address === clusterResult.seedAddress" class="seed-badge">SEED</span>
                </td>
                <td>
                  <span :class="['type-badge', node.type]">{{ node.type.toUpperCase() }}</span>
                </td>
                <td>
                  <div class="confidence-bar">
                    <div class="confidence-fill" :style="{ width: (node.confidence * 100) + '%' }"></div>
                  </div>
                  <span class="confidence-value">{{ (node.confidence * 100).toFixed(0) }}%</span>
                </td>
                <td>{{ node.relationships.length }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Top Hubs -->
    <div class="hubs-section">
      <h3>🏆 Top Hub Addresses</h3>
      <div class="hubs-grid">
        <div v-for="hub in topHubs" :key="hub.address" class="hub-card" @click="analyzeHub(hub.address)">
          <div class="hub-name">{{ hub.name }}</div>
          <div class="hub-type">{{ hub.type }}</div>
          <div class="hub-address">{{ shortenAddress(hub.address) }}</div>
          <div class="hub-connections">{{ formatNumber(hub.connections) }} connections</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Analyzing address cluster...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { addressClusteringApi, type ClusterResult, type RelationshipResult, type HubAddress } from '@/service/addressClustering';

const searchAddress = ref('');
const selectedChain = ref('ethereum');
const depth = ref(1);
const loading = ref(false);
const clusterResult = ref<ClusterResult | null>(null);

const addr1 = ref('');
const addr2 = ref('');
const loadingRelationship = ref(false);
const relationshipResult = ref<RelationshipResult | null>(null);

const topHubs = ref<HubAddress[]>([]);

const chains = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'bsc', label: 'BSC' },
  { value: 'base', label: 'Base' },
  { value: 'avalanche', label: 'Avalanche' },
];

onMounted(async () => {
  await loadTopHubs();
});

async function loadTopHubs() {
  try {
    const res = await addressClusteringApi.getTopHubs({ limit: 8 });
    topHubs.value = res.hubs || [];
  } catch (e) {
    console.error('Failed to load top hubs:', e);
  }
}

async function analyzeCluster() {
  if (!searchAddress.value) return;
  
  loading.value = true;
  clusterResult.value = null;
  
  try {
    const res = await addressClusteringApi.analyzeCluster({
      address: searchAddress.value,
      chain: selectedChain.value,
      depth: depth.value,
    });
    clusterResult.value = res;
  } catch (e) {
    console.error('Failed to analyze cluster:', e);
  } finally {
    loading.value = false;
  }
}

async function checkRelationship() {
  if (!addr1.value || !addr2.value) return;
  
  loadingRelationship.value = true;
  relationshipResult.value = null;
  
  try {
    const res = await addressClusteringApi.getRelationship({
      address1: addr1.value,
      address2: addr2.value,
      chain: selectedChain.value,
    });
    relationshipResult.value = res;
  } catch (e) {
    console.error('Failed to check relationship:', e);
  } finally {
    loadingRelationship.value = false;
  }
}

function analyzeHub(address: string) {
  searchAddress.value = address;
  analyzeCluster();
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatClusterType(type: string): string {
  const types: Record<string, string> = {
    exchange_aggregator: 'Exchange Aggregator',
    defi_user: 'DeFi User',
    whale: 'Whale',
    retail: 'Retail',
  };
  return types[type] || type;
}

function formatTimePattern(pattern: string): string {
  const patterns: Record<string, string> = {
    very_sporadic: 'Very Sporadic',
    sporadic: 'Sporadic',
    regular: 'Regular',
    highly_active: 'Highly Active',
  };
  return patterns[pattern] || pattern;
}

function formatBehaviorType(type: string): string {
  const types: Record<string, string> = {
    exchange_aggregator: 'Exchange Aggregator',
    defi_user: 'DeFi User',
    whale: 'Whale',
    retail: 'Retail',
  };
  return types[type] || type;
}

function getRiskClass(score: number): string {
  if (score >= 70) return 'risk-high';
  if (score >= 40) return 'risk-medium';
  return 'risk-low';
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'confidence-high';
  if (confidence >= 0.5) return 'confidence-medium';
  return 'confidence-low';
}
</script>

<style scoped>
.address-clustering {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.controls {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.control-group input,
.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.analyze-btn,
.check-btn {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-end;
}

.analyze-btn:disabled,
.check-btn:disabled {
  background: #999;
  cursor: not-allowed;
}

.relationship-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.relationship-section h3 {
  margin-bottom: 16px;
}

.relationship-inputs {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.relationship-inputs input {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.relationship-inputs .vs {
  color: #999;
  font-weight: 500;
}

.relationship-result {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-type {
  font-weight: 600;
  text-transform: capitalize;
}

.confidence-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.confidence-high {
  background: #dcfce7;
  color: #166534;
}

.confidence-medium {
  background: #fef3c7;
  color: #92400e;
}

.confidence-low {
  background: #fee2e2;
  color: #991b1b;
}

.analysis-text {
  color: #444;
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric {
  background: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
}

.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.flag {
  background: #e0e7ff;
  color: #4338ca;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.cluster-results {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-value.cluster-type {
  font-size: 18px;
  color: #4f46e5;
}

.stat-value.risk-high {
  color: #dc2626;
}

.stat-value.risk-medium {
  color: #f59e0b;
}

.stat-value.risk-low {
  color: #22c55e;
}

.analysis-section,
.members-section {
  margin-bottom: 24px;
}

.analysis-section h3,
.members-section h3 {
  margin-bottom: 16px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-label {
  font-size: 14px;
  color: #666;
  min-width: 150px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s;
}

.analysis-value {
  font-weight: 600;
  min-width: 80px;
}

.flags-section {
  margin-top: 16px;
}

.flags-section h4 {
  margin-bottom: 8px;
}

.flags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flag-item {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.members-table {
  overflow-x: auto;
}

.members-table table {
  width: 100%;
  border-collapse: collapse;
}

.members-table th,
.members-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.members-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.member-row:hover {
  background: #f8f9fa;
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address {
  font-family: monospace;
}

.seed-badge {
  background: #4f46e5;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.exchange {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.contract {
  background: #fce7f3;
  color: #9d174d;
}

.type-badge.deployer {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.eoa {
  background: #d1fae5;
  color: #065f46;
}

.confidence-bar {
  width: 60px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.confidence-fill {
  height: 100%;
  background: #22c55e;
}

.confidence-value {
  font-size: 13px;
  color: #666;
}

.hubs-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.hubs-section h3 {
  margin-bottom: 16px;
}

.hubs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.hub-card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.hub-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
}

.hub-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.hub-type {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
  margin-bottom: 4px;
}

.hub-address {
  font-family: monospace;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.hub-connections {
  font-size: 13px;
  color: #4f46e5;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .overview-stats,
  .metrics-grid,
  .analysis-grid,
  .hubs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .controls {
    flex-direction: column;
  }
  
  .control-group input,
  .control-group select {
    min-width: 100%;
  }
}
</style>
