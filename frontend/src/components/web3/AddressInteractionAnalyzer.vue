<template>
  <div class="address-interaction-analyzer">
    <div class="header">
      <h2>🔗 Address Interaction Analyzer</h2>
      <p class="subtitle">Analyze relationships between two blockchain addresses</p>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <div class="address-inputs">
        <div class="input-group">
          <label>Address 1</label>
          <input
            v-model="address1"
            type="text"
            placeholder="0x..."
            class="address-input"
          />
        </div>
        <div class="vs-badge">↔</div>
        <div class="input-group">
          <label>Address 2</label>
          <input
            v-model="address2"
            type="text"
            placeholder="0x..."
            class="address-input"
          />
        </div>
      </div>

      <div class="controls">
        <select v-model="selectedChain" class="chain-select">
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
        <button @click="analyzeInteraction" :disabled="loading || !isValidAddress" class="analyze-btn">
          {{ loading ? 'Analyzing...' : 'Analyze 🔍' }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="results">
      <!-- Relationship Card -->
      <div class="relationship-card" :class="getRelationshipClass(result.relationship)">
        <div class="relationship-header">
          <span class="relationship-icon">{{ getRelationshipIcon(result.relationship) }}</span>
          <span class="relationship-label">{{ result.relationship }}</span>
        </div>
        <div class="confidence-bar">
          <div class="confidence-label">Confidence</div>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: (result.confidence * 100) + '%' }"></div>
          </div>
          <span class="confidence-value">{{ Math.round(result.confidence * 100) }}%</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ result.details.totalTransactions }}</div>
            <div class="stat-label">Total Transactions</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatValue(result.details.totalValue) }}</div>
            <div class="stat-label">Total Value (ETH)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📤</div>
          <div class="stat-content">
            <div class="stat-value">{{ result.details.address1ToAddress2 }}</div>
            <div class="stat-label">Address1 → Address2</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📥</div>
          <div class="stat-content">
            <div class="stat-value">{{ result.details.address2ToAddress1 }}</div>
            <div class="stat-label">Address2 → Address1</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatDate(result.details.firstInteraction) }}</div>
            <div class="stat-label">First Interaction</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatDate(result.details.lastInteraction) }}</div>
            <div class="stat-label">Last Interaction</div>
          </div>
        </div>
      </div>

      <!-- Shared Contracts -->
      <div v-if="result.sharedContracts && result.sharedContracts.length > 0" class="shared-contracts">
        <h3>🔗 Shared Contracts ({{ result.sharedContracts.length }})</h3>
        <div class="contracts-list">
          <div v-for="(contract, index) in result.sharedContracts.slice(0, 10)" :key="index" class="contract-item">
            <code>{{ shortenAddress(contract) }}</code>
            <button @click="copyAddress(contract)" class="copy-btn">📋</button>
          </div>
          <div v-if="result.sharedContracts.length > 10" class="more-contracts">
            + {{ result.sharedContracts.length - 10 }} more contracts
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="timeline-section">
        <div class="timeline-header">
          <h3>📜 Interaction Timeline</h3>
          <button @click="loadTimeline" :disabled="timelineLoading" class="refresh-btn">
            {{ timelineLoading ? 'Loading...' : 'Refresh ↻' }}
          </button>
        </div>

        <div v-if="timeline.length > 0" class="timeline">
          <div v-for="event in timeline" :key="event.hash" class="timeline-item">
            <div class="timeline-marker" :class="event.type"></div>
            <div class="timeline-content">
              <div class="timeline-header-row">
                <span class="event-type">{{ getEventTypeLabel(event.type) }}</span>
                <span class="event-time">{{ formatDateTime(event.timestamp) }}</span>
              </div>
              <div class="event-addresses">
                <span class="from">{{ shortenAddress(event.from) }}</span>
                <span class="arrow">→</span>
                <span class="to">{{ shortenAddress(event.to) }}</span>
              </div>
              <div class="event-value">{{ formatValue(event.value) }} ETH</div>
              <a :href="getEtherscanLink(event.hash)" target="_blank" class="tx-link">
                View on Etherscan ↗
              </a>
            </div>
          </div>
        </div>
        <div v-else-if="!timelineLoading" class="no-data">
          No interaction timeline found
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface InteractionResult {
  relationship: string;
  confidence: number;
  details: {
    totalTransactions: number;
    totalValue: string;
    firstInteraction: number;
    lastInteraction: number;
    interactionFrequency: number;
    address1ToAddress2: number;
    address2ToAddress1: number;
    commonContracts: string[];
  };
  sharedContracts: string[];
}

interface TimelineEvent {
  type: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

const address1 = ref('');
const address2 = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const timelineLoading = ref(false);
const result = ref<InteractionResult | null>(null);
const timeline = ref<TimelineEvent[]>([]);
const error = ref('');

const chains = [
  { id: 1, name: 'Ethereum' },
  { id: 5, name: 'Goerli' },
  { id: 137, name: 'Polygon' },
  { id: 80001, name: 'Mumbai' },
  { id: 42161, name: 'Arbitrum' },
  { id: 421613, name: 'Arbitrum Goerli' },
];

const isValidAddress = computed(() => {
  return (
    address1.value.startsWith('0x') &&
    address2.value.startsWith('0x') &&
    address1.value.length >= 40 &&
    address2.value.length >= 40
  );
});

async function analyzeInteraction() {
  if (!isValidAddress.value) {
    error.value = 'Please enter valid Ethereum addresses';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(
      `/api/web3/address-interaction/analyze?address1=${address1.value}&address2=${address2.value}&chainId=${selectedChain.value}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to analyze interaction');
    }
    
    result.value = await response.json();
    await loadTimeline();
  } catch (e: any) {
    error.value = e.message || 'An error occurred during analysis';
    console.error('Analysis error:', e);
  } finally {
    loading.value = false;
  }
}

async function loadTimeline() {
  if (!address1.value || !address2.value) return;

  timelineLoading.value = true;

  try {
    const response = await fetch(
      `/api/web3/address-interaction/timeline?address1=${address1.value}&address2=${address2.value}&chainId=${selectedChain.value}&limit=20`
    );
    
    if (!response.ok) {
      throw new Error('Failed to load timeline');
    }
    
    timeline.value = await response.json();
  } catch (e: any) {
    console.error('Timeline error:', e);
  } finally {
    timelineLoading.value = false;
  }
}

function getRelationshipClass(relationship: string): string {
  if (relationship.includes('Frequent')) return 'frequent';
  if (relationship.includes('Bidirectional')) return 'bidirectional';
  if (relationship.includes('One-way')) return 'one-way';
  if (relationship.includes('No')) return 'none';
  return 'indirect';
}

function getRelationshipIcon(relationship: string): string {
  if (relationship.includes('Frequent')) return '🔥';
  if (relationship.includes('Bidirectional')) return '🔄';
  if (relationship.includes('One-way sender')) return '📤';
  if (relationship.includes('One-way receiver')) return '📥';
  if (relationship.includes('No')) return '❌';
  return '🔗';
}

function formatValue(value: string): string {
  const num = parseFloat(value) / 1e18;
  return num.toFixed(6);
}

function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString();
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function copyAddress(address: string) {
  navigator.clipboard.writeText(address);
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    transfer: 'ETH Transfer',
    swap: 'Swap',
    contract_call: 'Contract Call',
    token_transfer: 'Token Transfer',
  };
  return labels[type] || type;
}

function getEtherscanLink(hash: string): string {
  const baseUrls: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    80001: 'https://mumbai.polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    421613: 'https://goerli.arbiscan.io/tx/',
  };
  return `${baseUrls[selectedChain.value] || baseUrls[1]}${hash}`;
}
</script>

<style scoped>
.address-interaction-analyzer {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  margin: 5px 0 0;
  color: #666;
  font-size: 14px;
}

.input-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.address-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.input-group {
  flex: 1;
  max-width: 350px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.address-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
}

.vs-badge {
  font-size: 24px;
  color: #666;
  font-weight: bold;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.chain-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.analyze-btn {
  padding: 10px 25px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #4338ca;
}

.analyze-btn:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.relationship-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4f46e5;
}

.relationship-card.frequent {
  border-left-color: #ef4444;
}

.relationship-card.bidirectional {
  border-left-color: #22c55e;
}

.relationship-card.one-way {
  border-left-color: #f59e0b;
}

.relationship-card.none {
  border-left-color: #9ca3af;
}

.relationship-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.relationship-icon {
  font-size: 24px;
}

.relationship-label {
  font-size: 18px;
  font-weight: 600;
}

.confidence-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.confidence-label {
  font-size: 14px;
  color: #666;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.confidence-value {
  font-size: 14px;
  font-weight: 500;
  color: #4f46e5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #111;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.shared-contracts {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.shared-contracts h3 {
  margin: 0 0 15px;
  font-size: 16px;
}

.contracts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contract-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 6px;
}

.contract-item code {
  font-size: 12px;
  font-family: monospace;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
}

.more-contracts {
  font-size: 12px;
  color: #666;
  padding: 6px 10px;
}

.timeline-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.timeline-header h3 {
  margin: 0;
  font-size: 16px;
}

.refresh-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.timeline-item {
  display: flex;
  gap: 15px;
}

.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4f46e5;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-marker.transfer {
  background: #22c55e;
}

.timeline-marker.swap {
  background: #f59e0b;
}

.timeline-marker.contract_call {
  background: #4f46e5;
}

.timeline-content {
  flex: 1;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.timeline-header-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-type {
  font-weight: 600;
  font-size: 14px;
}

.event-time {
  font-size: 12px;
  color: #666;
}

.event-addresses {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-family: monospace;
  margin-bottom: 5px;
}

.arrow {
  color: #666;
}

.event-value {
  font-size: 13px;
  color: #22c55e;
  font-weight: 500;
  margin-bottom: 8px;
}

.tx-link {
  font-size: 12px;
  color: #4f46e5;
  text-decoration: none;
}

.tx-link:hover {
  text-decoration: underline;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 30px;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
}
</style>
