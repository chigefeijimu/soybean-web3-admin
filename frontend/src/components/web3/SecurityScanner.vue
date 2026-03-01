<template>
  <div class="security-scanner">
    <div class="scanner-header">
      <h2><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
      Smart Contract Security Scanner</h2>
      <p class="subtitle">Analyze smart contracts for common vulnerabilities and security issues</p>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <div class="input-group">
        <label>Contract Address</label>
        <input 
          v-model="contractAddress" 
          type="text" 
          placeholder="0x..."
          class="address-input"
        />
      </div>
      <div class="input-group">
        <label>Blockchain</label>
        <select v-model="selectedChain" class="chain-select">
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
      </div>
      <button @click="analyzeContract" :disabled="!contractAddress || isAnalyzing" class="analyze-btn">
        <span v-if="isAnalyzing" class="loading-spinner"></span>
        <span v-else>{{ isAnalyzing ? 'Analyzing...' : 'Analyze Contract' }}</span>
      </button>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="results-section">
      <!-- Score Card -->
      <div class="score-card" :class="result.riskLevel">
        <div class="score-circle">
          <svg viewBox="0 0 36 36" class="score-chart">
            <path class="score-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path class="score-fill"
              :stroke-dasharray="`${result.securityScore}, 100`"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="score-value">{{ result.securityScore }}</div>
        </div>
        <div class="score-info">
          <h3>Security Score</h3>
          <span class="risk-badge" :class="result.riskLevel">{{ result.riskLevel.toUpperCase() }} RISK</span>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary-card">
        <h3>Analysis Summary</h3>
        <p>{{ result.summary }}</p>
      </div>

      <!-- Issues List -->
      <div class="issues-section">
        <h3>Security Issues Found ({{ result.issues.length }})</h3>
        <div class="issues-list">
          <div 
            v-for="(issue, index) in result.issues" 
            :key="index" 
            class="issue-card"
            :class="issue.severity"
          >
            <div class="issue-header">
              <span class="severity-badge" :class="issue.severity">{{ issue.severity }}</span>
              <span class="category">{{ issue.category }}</span>
            </div>
            <h4>{{ issue.title }}</h4>
            <p>{{ issue.description }}</p>
            <div class="recommendation">
              <strong>Recommendation:</strong> {{ issue.recommendation }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Known Vulnerabilities Reference -->
    <div class="vulnerabilities-ref">
      <h3 @click="showVulnerabilities = !showVulnerabilities" class="toggle-header">
        <svg :class="{ rotated: showVulnerabilities }" class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        Common Smart Contract Vulnerabilities Reference
      </h3>
      <div v-if="showVulnerabilities" class="vuln-list">
        <div v-for="vuln in knownVulnerabilities" :key="vuln.id" class="vuln-item">
          <div class="vuln-header">
            <span class="severity-badge" :class="vuln.severity">{{ vuln.severity }}</span>
            <strong>{{ vuln.title }}</strong>
          </div>
          <p>{{ vuln.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  title: string
  description: string
  location?: string
  recommendation: string
}

interface ContractSecurityResponse {
  contractAddress: string
  chainId: number
  analysisTimestamp: string
  securityScore: number
  issues: SecurityIssue[]
  summary: string
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
}

interface Vulnerability {
  id: string
  severity: string
  title: string
  description: string
}

const contractAddress = ref('')
const selectedChain = ref(1)
const isAnalyzing = ref(false)
const result = ref<ContractSecurityResponse | null>(null)
const showVulnerabilities = ref(false)
const knownVulnerabilities = ref<Vulnerability[]>([])

const chains = [
  { id: 1, name: 'Ethereum' },
  { id: 56, name: 'BNB Smart Chain' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum One' },
  { id: 10, name: 'Optimism' },
  { id: 8453, name: 'Base' },
  { id: 43114, name: 'Avalanche' },
]

const analyzeContract = async () => {
  if (!contractAddress.value) return
  
  isAnalyzing.value = true
  result.value = null
  
  try {
    const response = await fetch('/api/web3/security/analyze-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress: contractAddress.value,
        chainId: selectedChain.value,
      }),
    })
    
    if (response.ok) {
      result.value = await response.json()
    }
  } catch (error) {
    console.error('Analysis failed:', error)
  } finally {
    isAnalyzing.value = false
  }
}

const fetchKnownVulnerabilities = async () => {
  try {
    const response = await fetch('/api/web3/security/known-vulnerabilities')
    if (response.ok) {
      const data = await response.json()
      knownVulnerabilities.value = data.vulnerabilities
    }
  } catch (error) {
    console.error('Failed to fetch vulnerabilities:', error)
  }
}

fetchKnownVulnerabilities()
</script>

<style scoped>
.security-scanner {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.scanner-header {
  margin-bottom: 32px;
}

.scanner-header h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.scanner-header .icon {
  width: 32px;
  height: 32px;
  color: #6366f1;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.input-section {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 32px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.input-group {
  flex: 1;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.analyze-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 160px;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.score-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.score-card.critical { border-left: 4px solid #ef4444; }
.score-card.high { border-left: 4px solid #f97316; }
.score-card.medium { border-left: 4px solid #eab308; }
.score-card.low { border-left: 4px solid #22c55e; }
.score-card.safe { border-left: 4px solid #10b981; }

.score-circle {
  position: relative;
  width: 100px;
  height: 100px;
}

.score-chart {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3;
}

.score-fill {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
}

.score-card.critical .score-fill { stroke: #ef4444; }
.score-card.high .score-fill { stroke: #f97316; }
.score-card.medium .score-fill { stroke: #eab308; }
.score-card.low .score-fill { stroke: #22c55e; }
.score-card.safe .score-fill { stroke: #10b981; }

@keyframes progress {
  from { stroke-dasharray: 0, 100; }
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.score-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1a1a2e;
}

.risk-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.critical { background: #fee2e2; color: #dc2626; }
.risk-badge.high { background: #ffedd5; color: #ea580c; }
.risk-badge.medium { background: #fef9c3; color: #ca8a04; }
.risk-badge.low { background: #dcfce7; color: #16a34a; }
.risk-badge.safe { background: #d1fae5; color: #059669; }

.summary-card {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 24px;
}

.summary-card h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1a1a2e;
}

.summary-card p {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.issues-section h3 {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: #1a1a2e;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.issue-card.critical { border-left: 4px solid #ef4444; }
.issue-card.high { border-left: 4px solid #f97316; }
.issue-card.medium { border-left: 4px solid #eab308; }
.issue-card.low { border-left: 4px solid #22c55e; }
.issue-card.info { border-left: 4px solid #3b82f6; }

.issue-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.critical { background: #fee2e2; color: #dc2626; }
.severity-badge.high { background: #ffedd5; color: #ea580c; }
.severity-badge.medium { background: #fef9c3; color: #ca8a04; }
.severity-badge.low { background: #dcfce7; color: #16a34a; }
.severity-badge.info { background: #dbeafe; color: #2563eb; }

.category {
  font-size: 12px;
  color: #6b7280;
}

.issue-card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1a1a2e;
}

.issue-card p {
  margin: 0 0 12px 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
}

.recommendation {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 13px;
  color: #0369a1;
}

.recommendation strong {
  display: block;
  margin-bottom: 4px;
}

.vulnerabilities-ref {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.toggle-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 16px;
  color: #374151;
  user-select: none;
}

.toggle-header:hover {
  color: #1a1a2e;
}

.chevron {
  width: 20px;
  height: 20px;
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.vuln-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.vuln-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.vuln-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.vuln-item p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
