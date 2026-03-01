<script setup lang="ts">
import { ref, computed } from 'vue'

// Types
interface RiskFactor {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

interface HoneypotAnalysis {
  isHoneypot: boolean
  sellTax: number
  buyTax: number
  transferDelay: number
  canTransfer: boolean
}

interface AuditStatus {
  isAudited: boolean
  auditFirms: string[]
  auditReportUrl?: string
}

interface TokenSafetyResult {
  address: string
  symbol: string
  name: string
  isScam: boolean
  riskScore: number
  riskFactors: RiskFactor[]
  tokenAge: number
  holderCount: number
  totalSupply: string
  isMintable: boolean
  isPaused: boolean
  ownerAddress: string
  topHoldersPercent: number
  honeypotRisk: HoneypotAnalysis
  auditStatus: AuditStatus
}

// State
const tokenAddress = ref('')
const chainId = ref(1)
const isLoading = ref(false)
const result = ref<TokenSafetyResult | null>(null)
const error = ref('')

// Computed
const riskLevel = computed(() => {
  if (!result.value) return ''
  const score = result.value.riskScore
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
})

const riskColor = computed(() => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  }
  return colors[riskLevel.value] || '#6b7280'
})

const severityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  }
  return colors[severity] || '#6b7280'
}

// Methods
const checkToken = async () => {
  if (!tokenAddress.value) {
    error.value = 'Please enter a token address'
    return
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.value)) {
    error.value = 'Invalid Ethereum address format'
    return
  }

  isLoading.value = true
  error.value = ''
  result.value = null

  try {
    const response = await fetch('/api/web3/token-safety/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: tokenAddress.value,
        chainId: chainId.value,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to check token')
    }

    result.value = await response.json()
  } catch (e) {
    error.value = 'Failed to check token safety. Please try again.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const formatAddress = (addr: string) => {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const clearResult = () => {
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="token-safety-checker">
    <div class="header">
      <h2>🔍 Token Safety Checker</h2>
      <p class="subtitle">Check if a token is safe before trading</p>
    </div>

    <div class="search-form">
      <div class="input-group">
        <select v-model="chainId" class="chain-select">
          <option :value="1">Ethereum</option>
          <option :value="5">Goerli (Testnet)</option>
        </select>
        
        <input
          v-model="tokenAddress"
          type="text"
          placeholder="Enter token address (0x...)"
          class="address-input"
          @keyup.enter="checkToken"
        />
        
        <button 
          @click="checkToken" 
          :disabled="isLoading"
          class="check-btn"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Check</span>
        </button>
      </div>
      
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>

    <div v-if="result" class="result-container">
      <!-- Risk Score Banner -->
      <div 
        class="risk-banner"
        :style="{ backgroundColor: `${riskColor}20`, borderColor: riskColor }"
      >
        <div class="risk-score">
          <span class="score-label">Risk Score</span>
          <span class="score-value" :style="{ color: riskColor }">
            {{ result.riskScore }}/100
          </span>
        </div>
        
        <div class="risk-verdict">
          <span 
            class="verdict-badge"
            :style="{ backgroundColor: riskColor }"
          >
            {{ result.isScam ? '⚠️ SCAM' : '✅ SAFE' }}
          </span>
          <span class="verdict-text">
            {{ result.isScam ? 'High risk detected!' : 'No major risks detected' }}
          </span>
        </div>
      </div>

      <!-- Token Info -->
      <div class="token-info">
        <div class="token-header">
          <h3>{{ result.name }}</h3>
          <span class="token-symbol">{{ result.symbol }}</span>
        </div>
        
        <div class="token-address">
          <span class="label">Address:</span>
          <code>{{ result.address }}</code>
          <button @click="navigator.clipboard.writeText(result.address)" class="copy-btn">
            📋
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Token Age</span>
            <span class="stat-value">{{ result.tokenAge }} days</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Holders</span>
            <span class="stat-value">{{ formatNumber(result.holderCount) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Top 10 Holders</span>
            <span class="stat-value">{{ result.topHoldersPercent.toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Audit Status</span>
            <span class="stat-value" :class="{ audited: result.auditStatus.isAudited }">
              {{ result.auditStatus.isAudited ? '✅ Audited' : '❌ Not Audited' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Honeypot Analysis -->
      <div class="analysis-section honeypot">
        <h4>🍯 Honeypot Analysis</h4>
        <div class="honeypot-grid">
          <div class="honeypot-item">
            <span class="item-label">Honeypot Risk</span>
            <span 
              class="item-value"
              :class="{ danger: result.honeypotRisk.isHoneypot }"
            >
              {{ result.honeypotRisk.isHoneypot ? '❌ HIGH' : '✅ Low' }}
            </span>
          </div>
          <div class="honeypot-item">
            <span class="item-label">Sell Tax</span>
            <span 
              class="item-value"
              :class="{ danger: result.honeypotRisk.sellTax > 10 }"
            >
              {{ result.honeypotRisk.sellTax }}%
            </span>
          </div>
          <div class="honeypot-item">
            <span class="item-label">Buy Tax</span>
            <span class="item-value">{{ result.honeypotRisk.buyTax }}%</span>
          </div>
          <div class="honeypot-item">
            <span class="item-label">Can Transfer</span>
            <span class="item-value">
              {{ result.honeypotRisk.canTransfer ? '✅ Yes' : '❌ No' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Risk Factors -->
      <div v-if="result.riskFactors.length > 0" class="analysis-section risks">
        <h4>⚠️ Risk Factors</h4>
        <div class="risk-factors">
          <div 
            v-for="(factor, index) in result.riskFactors" 
            :key="index"
            class="risk-factor"
            :style="{ borderLeftColor: severityColor(factor.severity) }"
          >
            <span 
              class="severity-badge"
              :style="{ backgroundColor: severityColor(factor.severity) }"
            >
              {{ factor.severity.toUpperCase() }}
            </span>
            <div class="factor-content">
              <span class="factor-type">{{ factor.type }}</span>
              <p class="factor-description">{{ factor.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contract Details -->
      <div class="analysis-section contract">
        <h4>📄 Contract Details</h4>
        <div class="contract-details">
          <div class="detail-row">
            <span class="detail-label">Mintable</span>
            <span class="detail-value" :class="{ warning: result.isMintable }">
              {{ result.isMintable ? '⚠️ Yes' : '✅ No' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pausable</span>
            <span class="detail-value" :class="{ warning: result.isPaused }">
              {{ result.isPaused ? '⚠️ Yes' : '✅ No' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Owner</span>
            <code class="detail-value">{{ formatAddress(result.ownerAddress) }}</code>
          </div>
        </div>
      </div>

      <button @click="clearResult" class="clear-btn">Check Another Token</button>
    </div>

    <!-- Tips -->
    <div class="tips-section">
      <h4>💡 Safety Tips</h4>
      <ul>
        <li>Always check the token's age - new tokens are higher risk</li>
        <li>High holder concentration can indicate pump and dump schemes</li>
        <li>Tokens with high sell tax may be honeypots</li>
        <li>Check if the contract is audited by reputable firms</li>
        <li>Be wary of tokens with mintable or pausable functions</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.token-safety-checker {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
}

.search-form {
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.chain-select {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
}

.address-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.check-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.check-btn:hover:not(:disabled) {
  background: #2563eb;
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
}

.result-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.risk-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-left: 4px solid;
  background: #f9fafb;
}

.risk-score {
  display: flex;
  flex-direction: column;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}

.score-value {
  font-size: 32px;
  font-weight: 700;
}

.risk-verdict {
  display: flex;
  align-items: center;
  gap: 12px;
}

.verdict-badge {
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.verdict-text {
  color: #374151;
  font-size: 14px;
}

.token-info {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.token-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.token-header h3 {
  font-size: 20px;
  font-weight: 600;
}

.token-symbol {
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.token-address {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}

.token-address code {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
}

.stat-value.audited {
  color: #22c55e;
}

.analysis-section {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.analysis-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.honeypot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.honeypot-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 12px;
  color: #6b7280;
}

.item-value {
  font-size: 14px;
  font-weight: 600;
}

.item-value.danger {
  color: #ef4444;
}

.risk-factors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-factor {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-left: 4px solid;
  border-radius: 0 8px 8px 0;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  height: fit-content;
}

.factor-content {
  flex: 1;
}

.factor-type {
  font-size: 14px;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.factor-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.contract-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: #6b7280;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.detail-value.warning {
  color: #f97316;
}

.clear-btn {
  width: 100%;
  padding: 12px;
  background: #f3f4f6;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #e5e7eb;
}

.tips-section {
  margin-top: 24px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 12px;
}

.tips-section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #0369a1;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
}

.tips-section li {
  font-size: 14px;
  color: #075985;
  margin-bottom: 8px;
}

.tips-section li:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .stats-grid,
  .honeypot-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .input-group {
    flex-direction: column;
  }

  .risk-banner {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
