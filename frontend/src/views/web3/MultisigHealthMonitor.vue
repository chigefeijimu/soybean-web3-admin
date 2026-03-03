<template>
  <div class="multisig-health-monitor">
    <div class="header">
      <h1>🔐 Multi-sig Wallet Health Monitor</h1>
      <p class="subtitle">Monitor and analyze multi-sig wallet health and security</p>
    </div>

    <!-- Chain Selection -->
    <div class="chain-selector card">
      <div class="form-group">
        <label>Select Chain</label>
        <select v-model="selectedChain" @change="loadData">
          <option v-for="chain in chains" :key="chain.chainId" :value="chain.chainId">
            {{ chain.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Wallet Address</label>
        <input 
          v-model="walletAddress" 
          placeholder="0x..." 
          @keyup.enter="loadData"
        />
      </div>
      <button class="btn primary" @click="loadData" :disabled="loading">
        {{ loading ? 'Loading...' : 'Analyze Wallet' }}
      </button>
    </div>

    <!-- Health Overview -->
    <div v-if="healthReport" class="health-overview">
      <!-- Health Score Card -->
      <div class="score-card card" :class="getScoreClass(healthReport.healthGrade)">
        <div class="score-circle">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="45" />
            <circle 
              class="progress" 
              cx="50" 
              cy="50" 
              r="45" 
              :stroke-dasharray="`${healthReport.healthMetrics.overallScore * 2.83} 283`"
            />
          </svg>
          <div class="score-value">
            <span class="grade">{{ healthReport.healthGrade }}</span>
            <span class="score">{{ healthReport.healthMetrics.overallScore }}</span>
          </div>
        </div>
        <h3>Health Score</h3>
      </div>

      <!-- Wallet Info -->
      <div class="wallet-info card">
        <h3>Wallet Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Address</span>
            <span class="value address">{{ truncateAddress(healthReport.address) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Chain</span>
            <span class="value">{{ healthReport.chainName }}</span>
          </div>
          <div class="info-item">
            <span class="label">Threshold</span>
            <span class="value">{{ healthReport.threshold }} of {{ healthReport.ownerCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">Owners</span>
            <span class="value">{{ healthReport.ownerCount }}</span>
          </div>
        </div>
      </div>

      <!-- Risk Factors -->
      <div v-if="healthReport.healthMetrics.riskFactors.length > 0" class="risk-factors card">
        <h3>⚠️ Risk Factors</h3>
        <div class="risk-list">
          <div 
            v-for="(risk, index) in healthReport.healthMetrics.riskFactors" 
            :key="index" 
            class="risk-item"
            :class="risk.severity"
          >
            <div class="risk-header">
              <span class="risk-type">{{ formatRiskType(risk.type) }}</span>
              <span class="risk-severity" :class="risk.severity">{{ risk.severity.toUpperCase() }}</span>
            </div>
            <p class="risk-description">{{ risk.description }}</p>
            <p class="risk-recommendation">💡 {{ risk.recommendation }}</p>
          </div>
        </div>
      </div>

      <!-- Signer Activity -->
      <div class="signer-activity card">
        <h3>👥 Signer Activity</h3>
        <div class="signers-table">
          <table>
            <thead>
              <tr>
                <th>Signer</th>
                <th>Transactions Signed</th>
                <th>Last Signed</th>
                <th>Activity Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="signer in healthReport.healthMetrics.signerActivity" :key="signer.address">
                <td class="address">{{ truncateAddress(signer.address) }}</td>
                <td>{{ signer.transactionsSigned }}</td>
                <td>{{ formatDate(signer.lastSignedAt) }}</td>
                <td>
                  <div class="score-bar">
                    <div class="bar-fill" :style="{ width: signer.activityScore + '%' }" :class="getScoreClassByScore(signer.activityScore)"></div>
                    <span>{{ signer.activityScore }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations card">
        <h3>📋 Recommendations</h3>
        <ul>
          <li v-for="(rec, index) in healthReport.recommendations" :key="index">
            {{ rec }}
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="actions card">
        <button class="btn secondary" @click="viewTransactions">View Transactions</button>
        <button class="btn secondary" @click="viewTrends">View Trends</button>
        <button class="btn secondary" @click="compareWallets">Compare Wallets</button>
      </div>
    </div>

    <!-- Transactions Panel -->
    <div v-if="showTransactions" class="transactions-panel card">
      <div class="panel-header">
        <h3>📜 Transaction History</h3>
        <button class="btn close" @click="showTransactions = false">×</button>
      </div>
      <div v-if="transactions.length > 0" class="tx-list">
        <div v-for="tx in transactions" :key="tx.hash" class="tx-item">
          <div class="tx-hash">{{ truncateAddress(tx.hash) }}</div>
          <div class="tx-details">
            <span>Value: {{ formatValue(tx.value) }} ETH</span>
            <span>Gas: {{ tx.gasUsed }}</span>
            <span :class="tx.isError ? 'error' : 'success'">
              {{ tx.isError ? 'Failed' : 'Success' }}
            </span>
          </div>
        </div>
      </div>
      <p v-else>No transactions found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '/@/utils'

const loading = ref(false)
const walletAddress = ref('')
const selectedChain = ref(1)
const chains = ref<{ chainId: number; name: string }[]>([])
const healthReport = ref<any>(null)
const transactions = ref<any[]>([])
const showTransactions = ref(false)

onMounted(async () => {
  await loadChains()
})

async function loadChains() {
  try {
    const res = await get('/web3/multisig-health/chains')
    chains.value = res
  } catch (e) {
    console.error('Failed to load chains', e)
  }
}

async function loadData() {
  if (!walletAddress.value) return
  
  loading.value = true
  try {
    const res = await get(`/web3/multisig-health/health/${walletAddress.value}?chainId=${selectedChain.value}`)
    healthReport.value = res
  } catch (e) {
    console.error('Failed to load wallet health', e)
  } finally {
    loading.value = false
  }
}

async function viewTransactions() {
  try {
    const res = await get(`/web3/multisig-health/transactions/${walletAddress.value}?chainId=${selectedChain.value}`)
    transactions.value = res.transactions || []
    showTransactions.value = true
  } catch (e) {
    console.error('Failed to load transactions', e)
  }
}

function viewTrends() {
  console.log('View trends')
}

function compareWallets() {
  console.log('Compare wallets')
}

function truncateAddress(address: string) {
  if (!address) return ''
  return address.slice(0, 6) + '...' + address.slice(-4)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString()
}

function formatValue(value: string) {
  return (parseInt(value) / 1e18).toFixed(4)
}

function formatRiskType(type: string) {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getScoreClass(grade: string) {
  const scoreMap: Record<string, string> = {
    'A+': 'excellent', 'A': 'excellent',
    'B+': 'good', 'B': 'good',
    'C': 'average',
    'D': 'poor', 'F': 'critical'
  }
  return scoreMap[grade] || 'average'
}

function getScoreClassByScore(score: number) {
  if (score >= 70) return 'excellent'
  if (score >= 50) return 'good'
  if (score >= 30) return 'average'
  return 'poor'
}
</script>

<style scoped>
.multisig-health-monitor {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chain-selector {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 300px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn.primary {
  background: #4f46e5;
  color: white;
}

.btn.primary:hover {
  background: #4338ca;
}

.btn.primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn.secondary:hover {
  background: #e5e7eb;
}

.health-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.score-card {
  text-align: center;
}

.score-circle {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 16px;
}

.score-circle svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.score-circle circle {
  fill: none;
  stroke-width: 8;
}

.score-circle .bg {
  stroke: #e5e7eb;
}

.score-circle .progress {
  stroke: #4f46e5;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value .grade {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.score-value .score {
  font-size: 14px;
  color: #666;
}

.wallet-info h3,
.risk-factors h3,
.signer-activity h3,
.recommendations h3 {
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #666;
}

.info-item .value {
  font-weight: 600;
}

.info-item .value.address {
  font-family: monospace;
  font-size: 12px;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.risk-item.critical { border-left: 4px solid #dc2626; }
.risk-item.high { border-left: 4px solid #f59e0b; }
.risk-item.medium { border-left: 4px solid #fbbf24; }
.risk-item.low { border-left: 4px solid #22c55e; }

.risk-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.risk-type {
  font-weight: 600;
}

.risk-severity {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.risk-severity.critical { background: #fee2e2; color: #dc2626; }
.risk-severity.high { background: #fef3c7; color: #f59e0b; }
.risk-severity.medium { background: #fef3c7; color: #d97706; }
.risk-severity.low { background: #dcfce7; color: #16a34a; }

.risk-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.risk-recommendation {
  font-size: 13px;
  color: #4b5563;
}

.signers-table table {
  width: 100%;
  border-collapse: collapse;
}

.signers-table th,
.signers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.signers-table th {
  font-weight: 600;
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.signers-table td.address {
  font-family: monospace;
  font-size: 12px;
}

.score-bar {
  position: relative;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.score-bar .bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s;
}

.score-bar .bar-fill.excellent { background: #22c55e; }
.score-bar .bar-fill.good { background: #4f46e5; }
.score-bar .bar-fill.average { background: #f59e0b; }
.score-bar .bar-fill.poor { background: #dc2626; }

.score-bar span {
  position: relative;
  z-index: 1;
  display: block;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
  font-weight: 600;
}

.recommendations ul {
  list-style: none;
  padding: 0;
}

.recommendations li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.recommendations li:last-child {
  border-bottom: none;
}

.actions {
  display: flex;
  gap: 12px;
}

.transactions-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tx-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.tx-hash {
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 4px;
}

.tx-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.tx-details .error { color: #dc2626; }
.tx-details .success { color: #22c55e; }

.excellent .progress { stroke: #22c55e; }
.good .progress { stroke: #4f46e5; }
.average .progress { stroke: #f59e0b; }
.poor .progress { stroke: #dc2626; }
</style>
