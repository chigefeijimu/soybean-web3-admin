<template>
  <div class="token-approval-manager">
    <div class="header-section">
      <h2>🔐 Token Approval Manager</h2>
      <p class="subtitle">View and manage your token approvals across DeFi protocols</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="input-group">
        <input
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address (0x...)"
          class="address-input"
          @keyup.enter="fetchApprovals"
        />
        <select v-model="selectedChain" class="chain-select">
          <option :value="1">Ethereum</option>
          <option :value="137">Polygon</option>
          <option :value="56">BSC</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
        </select>
        <button @click="fetchApprovals" :disabled="loading" class="search-btn">
          {{ loading ? 'Scanning...' : '🔍 Scan Approvals' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Scanning blockchain for token approvals...</p>
    </div>

    <!-- Results Section -->
    <div v-else-if="approvals.length > 0" class="results-section">
      <!-- Risk Summary -->
      <div class="risk-summary">
        <div class="risk-card high">
          <span class="risk-count">{{ riskSummary.high }}</span>
          <span class="risk-label">High Risk</span>
        </div>
        <div class="risk-card medium">
          <span class="risk-count">{{ riskSummary.medium }}</span>
          <span class="risk-label">Medium Risk</span>
        </div>
        <div class="risk-card low">
          <span class="risk-count">{{ riskSummary.low }}</span>
          <span class="risk-label">Low Risk</span>
        </div>
        <div class="risk-card total">
          <span class="risk-count">{{ approvals.length }}</span>
          <span class="risk-label">Total Approvals</span>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button 
          :class="['tab', { active: activeFilter === 'all' }]" 
          @click="activeFilter = 'all'"
        >
          All ({{ approvals.length }})
        </button>
        <button 
          :class="['tab', { active: activeFilter === 'high' }]" 
          @click="activeFilter = 'high'"
        >
          🔴 High Risk ({{ riskSummary.high }})
        </button>
        <button 
          :class="['tab', { active: activeFilter === 'medium' }]" 
          @click="activeFilter = 'medium'"
        >
          🟡 Medium ({{ riskSummary.medium }})
        </button>
        <button 
          :class="['tab', { active: activeFilter === 'low' }]" 
          @click="activeFilter = 'low'"
        >
          🟢 Low Risk ({{ riskSummary.low }})
        </button>
      </div>

      <!-- Approvals List -->
      <div class="approvals-list">
        <div 
          v-for="(approval, index) in filteredApprovals" 
          :key="index"
          :class="['approval-card', approval.risk_level]"
        >
          <div class="approval-header">
            <div class="token-info">
              <span class="token-symbol">{{ approval.token_symbol }}</span>
              <span class="token-name">{{ approval.token_name }}</span>
            </div>
            <span :class="['risk-badge', approval.risk_level]">
              {{ approval.risk_level.toUpperCase() }}
            </span>
          </div>
          
          <div class="approval-details">
            <div class="detail-row">
              <span class="label">Token:</span>
              <span class="value address">{{ truncateAddress(approval.token_address) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Spender:</span>
              <span class="value">
                {{ approval.spender_name || 'Unknown Protocol' }}
                <span class="address">{{ truncateAddress(approval.spender) }}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Allowance:</span>
              <span class="value">
                {{ approval.is_infinite ? '♾️ Unlimited' : formatAmount(approval.allowance, approval.token_decimals) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Approved:</span>
              <span class="value">{{ approval.age_days }} days ago</span>
            </div>
          </div>

          <div class="approval-actions">
            <button @click="viewSpenderDetails(approval.spender)" class="action-btn info">
              ℹ️ Protocol Info
            </button>
            <button 
              v-if="approval.is_infinite || approval.age_days > 180"
              @click="revokeApproval(approval)" 
              class="action-btn revoke"
            >
              🚫 Revoke
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="searched" class="empty-state">
      <p>✅ No approvals found for this wallet</p>
    </div>

    <!-- Spender Details Modal -->
    <div v-if="showSpenderModal" class="modal-overlay" @click="showSpenderModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Protocol Information</h3>
          <button @click="showSpenderModal = false" class="close-btn">×</button>
        </div>
        <div v-if="spenderInfo" class="modal-body">
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">{{ spenderInfo.name || 'Unknown' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Address:</span>
            <span class="value address">{{ spenderInfo.address }}</span>
          </div>
          <div class="info-row">
            <span class="label">Category:</span>
            <span class="value">{{ spenderInfo.category || 'Unknown' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Risk Score:</span>
            <span :class="['risk-badge', spenderInfo.risk_score]">
              {{ spenderInfo.risk_score || 'N/A' }}
            </span>
          </div>
          <div class="info-row">
            <span class="label">Description:</span>
            <span class="value">{{ spenderInfo.description || 'No description available' }}</span>
          </div>
          <div v-if="spenderInfo.website" class="info-row">
            <span class="label">Website:</span>
            <a :href="spenderInfo.website" target="_blank" class="link">{{ spenderInfo.website }}</a>
          </div>
        </div>
        <div v-else class="modal-body">
          <p>No information available for this protocol</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface TokenApproval {
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  spender: string;
  spender_name: string | null;
  allowance: string;
  is_infinite: boolean;
  approved_at: number;
  age_days: number;
  risk_level: string;
}

const walletAddress = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const searched = ref(false);
const approvals = ref<TokenApproval[]>([]);
const activeFilter = ref('all');
const showSpenderModal = ref(false);
const spenderInfo = ref<any>(null);

const riskSummary = computed(() => {
  const summary = { high: 0, medium: 0, low: 0 };
  approvals.value.forEach(a => {
    if (a.risk_level === 'high') summary.high++;
    else if (a.risk_level === 'medium') summary.medium++;
    else summary.low++;
  });
  return summary;
});

const filteredApprovals = computed(() => {
  if (activeFilter.value === 'all') return approvals.value;
  return approvals.value.filter(a => a.risk_level === activeFilter.value);
});

function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(amount: string, decimals: number): string {
  try {
    const value = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = value / divisor;
    const fractional = value % divisor;
    if (fractional === 0n) {
      return whole.toString();
    }
    return `${whole}.${fractional.toString().padStart(decimals, '0').slice(0, 4)}`;
  } catch {
    return amount;
  }
}

async function fetchApprovals() {
  if (!walletAddress.value) {
    alert('Please enter a wallet address');
    return;
  }
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.value)) {
    alert('Invalid wallet address format');
    return;
  }

  loading.value = true;
  searched.value = true;
  
  try {
    const response = await fetch(`/api/web3/approvals?owner=${walletAddress.value}&chain_id=${selectedChain.value}`);
    const result = await response.json();
    
    if (result.success) {
      approvals.value = result.data.approvals || [];
      alert(`Found ${approvals.value.length} token approvals`);
    } else {
      alert(result.msg || 'Failed to fetch approvals');
      approvals.value = [];
    }
  } catch (error) {
    console.error('Error fetching approvals:', error);
    alert('Failed to connect to server');
    approvals.value = [];
  } finally {
    loading.value = false;
  }
}

async function viewSpenderDetails(spenderAddress: string) {
  try {
    const response = await fetch(`/api/web3/spender/${spenderAddress}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      spenderInfo.value = result.data;
      showSpenderModal.value = true;
    } else {
      alert('No information available for this protocol');
    }
  } catch (error) {
    console.error('Error fetching spender info:', error);
    alert('Failed to fetch protocol info');
  }
}

function revokeApproval(approval: TokenApproval) {
  alert(`Revoke approval for ${approval.token_symbol} - ${approval.spender_name || approval.spender}\n\nNote: In production, this would trigger a wallet signature to revoke the approval.`);
  // In production, would trigger wallet signature to revoke
}
</script>

<style scoped>
.token-approval-manager {
  padding: 20px;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #fff;
}

.subtitle {
  color: #888;
  margin: 0;
}

.search-section {
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
}

.address-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.chain-select {
  padding: 12px 16px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.search-btn {
  padding: 12px 24px;
  background: #4f46e5;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #4338ca;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.risk-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.risk-card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid #333;
}

.risk-card.high { border-color: #ef4444; }
.risk-card.medium { border-color: #f59e0b; }
.risk-card.low { border-color: #22c55e; }

.risk-count {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.risk-card.high .risk-count { color: #ef4444; }
.risk-card.medium .risk-count { color: #f59e0b; }
.risk-card.low .risk-count { color: #22c55e; }

.risk-label {
  color: #888;
  font-size: 14px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 16px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 20px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  border-color: #4f46e5;
}

.tab.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}

.approvals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.approval-card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #333;
}

.approval-card.high { border-color: #ef4444; }
.approval-card.medium { border-color: #f59e0b; }
.approval-card.low { border-color: #22c55e; }

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.token-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.token-symbol {
  font-weight: bold;
  font-size: 18px;
  color: #fff;
}

.token-name {
  color: #888;
  font-size: 14px;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.risk-badge.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.risk-badge.low { background: rgba(34, 197, 94, 0.2); color: #22c55e; }

.approval-details {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  gap: 12px;
}

.detail-row .label {
  color: #666;
  min-width: 80px;
}

.detail-row .value {
  color: #fff;
}

.detail-row .address {
  font-family: monospace;
  color: #888;
}

.approval-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn.info {
  background: #333;
  color: #fff;
}

.action-btn.info:hover {
  background: #444;
}

.action-btn.revoke {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn.revoke:hover {
  background: rgba(239, 68, 68, 0.3);
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #22c55e;
  font-size: 18px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.info-row .label {
  color: #666;
  min-width: 100px;
}

.info-row .value {
  color: #fff;
}

.info-row .link {
  color: #4f46e5;
}

@media (max-width: 768px) {
  .risk-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .approval-actions {
    flex-direction: column;
  }
}
</style>
