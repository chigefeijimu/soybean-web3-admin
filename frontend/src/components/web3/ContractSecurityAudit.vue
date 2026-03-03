<template>
  <div class="contract-security-audit">
    <div class="header-section">
      <h2>🔍 Smart Contract Security Audit</h2>
      <p class="subtitle">Analyze smart contracts for security vulnerabilities and get detailed audit reports</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label>Contract Address</label>
          <input
            v-model="contractAddress"
            type="text"
            placeholder="0x..."
            class="text-input"
            @keyup.enter="auditContract"
          />
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="selectedChain" class="select-input">
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="bsc">BSC</option>
            <option value="base">Base</option>
            <option value="avalanche">Avalanche</option>
          </select>
        </div>
        <button class="btn btn-primary" @click="auditContract" :disabled="loading">
          {{ loading ? 'Auditing...' : '🔍 Audit Contract' }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="auditResult" class="results-section">
      <!-- Score Card -->
      <div class="score-cards">
        <div class="score-card" :class="riskLevelClass">
          <div class="score-icon">⚠️</div>
          <div class="score-value">{{ auditResult.overallScore }}</div>
          <div class="score-label">Security Score</div>
          <span class="risk-badge" :class="'risk-' + auditResult.riskLevel">
            {{ auditResult.riskLevel.toUpperCase() }}
          </span>
        </div>
        <div class="info-card">
          <div class="info-title">Contract Type</div>
          <div class="info-value">{{ auditResult.contractType }}</div>
          <div class="info-detail">{{ auditResult.contractVerified ? '✅ Verified' : '⚠️ Unverified' }}</div>
        </div>
        <div class="info-card">
          <div class="info-title">Access Control</div>
          <div class="info-value">{{ auditResult.accessControl.ownershipType }}</div>
          <div class="info-detail">Risk: {{ auditResult.accessControl.risk }}</div>
        </div>
        <div class="info-card">
          <div class="info-title">Gas Optimization</div>
          <div class="info-value">{{ auditResult.gasAnalysis.optimizationScore }}</div>
          <div class="info-detail">{{ auditResult.gasAnalysis.suggestions.length }} suggestions</div>
        </div>
      </div>

      <!-- Vulnerabilities -->
      <div class="result-card" v-if="auditResult.vulnerabilities.length > 0">
        <div class="card-header">
          <span>⚠️ Vulnerabilities Found ({{ auditResult.vulnerabilities.length }})</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Vulnerability</th>
              <th>Category</th>
              <th>Description</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in auditResult.vulnerabilities" :key="v.id">
              <td><span class="severity-badge" :class="'severity-' + v.severity">{{ v.severity }}</span></td>
              <td>{{ v.name }}</td>
              <td>{{ v.category }}</td>
              <td>{{ v.description }}</td>
              <td>{{ v.recommendation }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="result-card" v-else>
        <div class="success-result">
          <div class="success-icon">✅</div>
          <div class="success-title">No Vulnerabilities Found</div>
          <div class="success-text">This contract appears to be secure based on our analysis</div>
        </div>
      </div>

      <!-- Access Control Analysis -->
      <div class="result-card">
        <div class="card-header">
          <span>🔐 Access Control Analysis</span>
        </div>
        <div class="analysis-grid">
          <div class="analysis-item">
            <span class="label">Ownership Type:</span>
            <span class="value">{{ auditResult.accessControl.ownershipType }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Pausable:</span>
            <span class="value">{{ auditResult.accessControl.pausable ? 'Yes' : 'No' }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Upgradeable:</span>
            <span class="value">{{ auditResult.accessControl.upgradeable ? 'Yes' : 'No' }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Mintable:</span>
            <span class="value">{{ auditResult.accessControl.mintable ? 'Yes' : 'No' }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Burnable:</span>
            <span class="value">{{ auditResult.accessControl.burnable ? 'Yes' : 'No' }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Has Access Control:</span>
            <span class="value">{{ auditResult.accessControl.hasAccessControl ? 'Yes' : 'No' }}</span>
          </div>
        </div>
        <div class="roles-section" v-if="auditResult.accessControl.rolesDefined.length > 0">
          <span class="label">Defined Roles:</span>
          <span class="role-tag" v-for="role in auditResult.accessControl.rolesDefined" :key="role">
            {{ role }}
          </span>
        </div>
      </div>

      <!-- Gas Optimization -->
      <div class="result-card">
        <div class="card-header">
          <span>⛽ Gas Optimization ({{ auditResult.gasAnalysis.optimizationScore }}/100)</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: auditResult.gasAnalysis.optimizationScore + '%' }" :class="getProgressClass(auditResult.gasAnalysis.optimizationScore)"></div>
        </div>
        <div class="gas-info">
          <div class="analysis-item">
            <span class="label">Estimated Deploy Gas:</span>
            <span class="value">{{ auditResult.gasAnalysis.estimatedDeployGas.toLocaleString() }}</span>
          </div>
        </div>
        <div class="suggestions" v-if="auditResult.gasAnalysis.suggestions.length > 0">
          <h4>💡 Optimization Suggestions:</h4>
          <ul>
            <li v-for="(suggestion, index) in auditResult.gasAnalysis.suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Code Quality -->
      <div class="result-card">
        <div class="card-header">
          <span>📝 Code Quality Analysis ({{ auditResult.codeQuality.score }}/100)</span>
        </div>
        <div class="analysis-grid">
          <div class="analysis-item">
            <span class="label">Solidity Version:</span>
            <span class="value">{{ auditResult.codeQuality.solidityVersion }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Lines of Code:</span>
            <span class="value">{{ auditResult.codeQuality.linesOfCode }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Documentation:</span>
            <span class="value">{{ auditResult.codeQuality.hasDocumentation ? '✅' : '❌' }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Tests:</span>
            <span class="value">{{ auditResult.codeQuality.hasTests ? '✅' : '❌' }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">License:</span>
            <span class="value">{{ auditResult.codeQuality.licenseIdentified ? '✅' : '❌' }}</span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="result-card" v-if="auditResult.recommendations.length > 0">
        <div class="card-header">
          <span>📋 Security Recommendations</span>
        </div>
        <ul class="recommendations-list">
          <li v-for="(rec, index) in auditResult.recommendations" :key="index">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Batch Audit -->
    <div class="batch-audit-card">
      <div class="card-header">
        <span>📦 Batch Audit</span>
      </div>
      <div class="batch-form">
        <textarea
          v-model="batchAddresses"
          class="textarea-input"
          placeholder="Enter multiple addresses (one per line)"
          rows="4"
        ></textarea>
        <button class="btn btn-primary" @click="batchAudit" :disabled="batchLoading">
          {{ batchLoading ? 'Auditing...' : 'Batch Audit' }}
        </button>
      </div>
      <div v-if="batchResult" class="batch-results">
        <div class="batch-stats">
          <div class="batch-stat">
            <div class="batch-stat-value">{{ batchResult.summary.totalAudited }}</div>
            <div class="batch-stat-label">Total Audited</div>
          </div>
          <div class="batch-stat">
            <div class="batch-stat-value">{{ batchResult.summary.averageScore }}</div>
            <div class="batch-stat-label">Average Score</div>
          </div>
          <div class="batch-stat">
            <div class="batch-stat-value batch-danger">{{ batchResult.summary.riskDistribution.critical + batchResult.summary.riskDistribution.high }}</div>
            <div class="batch-stat-label">High Risk</div>
          </div>
          <div class="batch-stat">
            <div class="batch-stat-value batch-safe">{{ batchResult.summary.riskDistribution.safe + batchResult.summary.riskDistribution.low }}</div>
            <div class="batch-stat-label">Safe/Low Risk</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Common Issues -->
    <div class="common-issues-card">
      <div class="card-header">
        <span>📊 Common Security Issues on {{ selectedChain }}</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Occurrences</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="issue in commonIssues" :key="issue.issue">
            <td>{{ issue.issue }}</td>
            <td>{{ issue.count.toLocaleString() }}</td>
            <td><span class="severity-badge" :class="'severity-' + issue.severity">{{ issue.severity }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { contractSecurityAuditApi } from '@/service/api/web3'

interface Vulnerability {
  id: string
  name: string
  category: string
  severity: string
  description: string
  recommendation: string
}

interface AccessControl {
  ownershipType: string
  pausable: boolean
  upgradeable: boolean
  mintable: boolean
  burnable: boolean
  hasAccessControl: boolean
  rolesDefined: string[]
  risk: string
}

interface GasAnalysis {
  estimatedDeployGas: number
  optimizationScore: number
  suggestions: string[]
}

interface CodeQuality {
  hasDocumentation: boolean
  hasTests: boolean
  licenseIdentified: boolean
  solidityVersion: string
  linesOfCode: number
  score: number
}

interface AuditResult {
  address: string
  chain: string
  timestamp: number
  contractVerified: boolean
  hasProxy: boolean
  proxyAdmin: string | null
  contractType: string
  owner: string | null
  ownershipStatus: string
  vulnerabilities: Vulnerability[]
  gasAnalysis: GasAnalysis
  accessControl: AccessControl
  overallScore: number
  riskLevel: string
  recommendations: string[]
  codeQuality: CodeQuality
}

const contractAddress = ref('')
const selectedChain = ref('ethereum')
const loading = ref(false)
const auditResult = ref<AuditResult | null>(null)
const batchAddresses = ref('')
const batchLoading = ref(false)
const batchResult = ref<any>(null)
const commonIssues = ref<any[]>([])

const riskLevelClass = computed(() => {
  if (!auditResult.value) return ''
  const level = auditResult.value.riskLevel
  return 'risk-' + level
})

const getSeverityClass = (severity: string) => {
  return 'severity-' + severity
}

const getProgressClass = (percentage: number) => {
  if (percentage >= 70) return 'progress-good'
  if (percentage >= 40) return 'progress-medium'
  return 'progress-bad'
}

const auditContract = async () => {
  if (!contractAddress.value) {
    alert('Please enter a contract address')
    return
  }
  
  loading.value = true
  try {
    const result = await contractSecurityAuditApi.auditContract({
      address: contractAddress.value,
      chain: selectedChain.value
    })
    auditResult.value = result
  } catch (error: any) {
    alert(error.message || 'Audit failed')
  } finally {
    loading.value = false
  }
}

const batchAudit = async () => {
  if (!batchAddresses.value) {
    alert('Please enter addresses to batch audit')
    return
  }
  
  const addresses = batchAddresses.value.split('\n').map(a => a.trim()).filter(a => a)
  if (addresses.length === 0) {
    alert('Please enter valid addresses')
    return
  }
  
  batchLoading.value = true
  try {
    const result = await contractSecurityAuditApi.batchAudit({
      addresses,
      chain: selectedChain.value
    })
    batchResult.value = result
  } catch (error: any) {
    alert(error.message || 'Batch audit failed')
  } finally {
    batchLoading.value = false
  }
}

const loadCommonIssues = async () => {
  try {
    const result = await contractSecurityAuditApi.getCommonIssues(selectedChain.value)
    commonIssues.value = result
  } catch (error) {
    console.error('Failed to load common issues', error)
  }
}

onMounted(() => {
  loadCommonIssues()
})
</script>

<style scoped>
.contract-security-audit {
  padding: 20px;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.search-section {
  margin-bottom: 24px;
}

.search-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.text-input, .select-input, .textarea-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.text-input:focus, .select-input:focus, .textarea-input:focus {
  outline: none;
  border-color: #409eff;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results-section {
  margin-bottom: 24px;
}

.score-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.score-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: white;
}

.score-card.risk-safe {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.score-card.risk-low {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.score-card.risk-medium {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.score-card.risk-high {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.score-card.risk-critical {
  background: linear-gradient(135deg, #f56c6c 0%, #d73a49 100%);
}

.score-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.score-value {
  font-size: 48px;
  font-weight: bold;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.risk-safe, .risk-badge.risk-low {
  background: rgba(255,255,255,0.2);
}

.risk-badge.risk-medium {
  background: rgba(230,162,60,0.3);
}

.risk-badge.risk-high, .risk-badge.risk-critical {
  background: rgba(245,108,108,0.3);
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.info-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.info-detail {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.data-table tr:hover {
  background: #f5f7fa;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.severity-critical, .severity-high {
  background: #f56c6c;
  color: white;
}

.severity-medium {
  background: #e6a23c;
  color: white;
}

.severity-low, .severity-info {
  background: #909399;
  color: white;
}

.success-result {
  text-align: center;
  padding: 40px;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 8px;
}

.success-text {
  color: #909399;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.analysis-item {
  margin-bottom: 12px;
}

.analysis-item .label {
  color: #909399;
  margin-right: 8px;
}

.analysis-item .value {
  color: #303133;
  font-weight: 500;
}

.roles-section {
  margin-top: 16px;
}

.role-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #f0f2f5;
  border-radius: 4px;
  margin-left: 8px;
  font-size: 12px;
}

.progress-bar {
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  margin: 16px 0;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-good {
  background: #67c23a;
}

.progress-medium {
  background: #e6a23c;
}

.progress-bad {
  background: #f56c6c;
}

.suggestions {
  margin-top: 16px;
}

.suggestions h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions li {
  margin-bottom: 4px;
  color: #606266;
}

.recommendations-list {
  padding-left: 20px;
}

.recommendations-list li {
  margin-bottom: 8px;
  color: #606266;
}

.batch-audit-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.batch-form {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.batch-form .textarea-input {
  flex: 1;
}

.batch-results {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.batch-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.batch-stat {
  text-align: center;
}

.batch-stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.batch-stat-value.batch-danger {
  color: #f56c6c;
}

.batch-stat-value.batch-safe {
  color: #67c23a;
}

.batch-stat-label {
  font-size: 12px;
  color: #909399;
}

.common-issues-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

@media (max-width: 768px) {
  .score-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .analysis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .batch-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
