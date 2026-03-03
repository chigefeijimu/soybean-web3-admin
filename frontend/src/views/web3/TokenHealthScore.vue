<template>
  <div class="token-health-score">
    <div class="header">
      <h2>🎯 Token Health Score</h2>
      <p class="subtitle">Comprehensive token health analysis across multiple dimensions</p>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards" v-if="summary">
      <div class="summary-card">
        <div class="card-title">Tokens Analyzed</div>
        <div class="card-value">{{ summary.totalAnalyzed }}</div>
      </div>
      <div class="summary-card">
        <div class="card-title">Average Score</div>
        <div class="card-value">{{ summary.averageScore }}</div>
      </div>
      <div class="summary-card success">
        <div class="card-title">Low Risk</div>
        <div class="card-value">{{ summary.lowRiskCount }}</div>
      </div>
      <div class="summary-card warning">
        <div class="card-title">Medium Risk</div>
        <div class="card-value">{{ summary.mediumRiskCount }}</div>
      </div>
      <div class="summary-card danger">
        <div class="card-title">High Risk</div>
        <div class="card-value">{{ summary.highRiskCount }}</div>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchSymbol" 
          placeholder="Enter token symbol (e.g., ETH, BTC, USDC)"
          @keyup.enter="searchToken"
        />
        <select v-model="selectedChain">
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <button @click="searchToken" :disabled="loading">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
      <div class="quick-buttons">
        <button 
          v-for="token in quickTokens" 
          :key="token"
          @click="quickSearch(token)"
          class="quick-btn"
        >
          {{ token }}
        </button>
      </div>
    </div>

    <!-- Token Health Result -->
    <div v-if="tokenHealth" class="result-section">
      <!-- Overall Score Card -->
      <div class="score-card" :class="getRiskClass(tokenHealth.riskLevel)">
        <div class="score-main">
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" stroke-width="8"/>
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                :stroke="getScoreColor(tokenHealth.overallScore)" 
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${tokenHealth.overallScore * 2.83} 283`"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="score-text">
              <div class="score-value">{{ tokenHealth.overallScore }}</div>
              <div class="score-grade">{{ tokenHealth.healthGrade }}</div>
            </div>
          </div>
          <div class="score-info">
            <h3>{{ tokenHealth.name }} ({{ tokenHealth.symbol }})</h3>
            <p class="chain">Chain: {{ tokenHealth.chain }}</p>
            <p class="risk" :class="tokenHealth.riskLevel">
              Risk Level: {{ tokenHealth.riskLevel.toUpperCase() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Score Breakdown -->
      <div class="score-breakdown">
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Liquidity</span>
            <span class="score">{{ tokenHealth.liquidity.liquidityScore }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{width: tokenHealth.liquidity.liquidityScore + '%', background: getScoreColor(tokenHealth.liquidity.liquidityScore)}"></div>
          </div>
          <p class="breakdown-info">{{ tokenHealth.liquidity.assessment }}</p>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Security</span>
            <span class="score">{{ tokenHealth.security.securityScore }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{width: tokenHealth.security.securityScore + '%', background: getScoreColor(tokenHealth.security.securityScore)}"></div>
          </div>
          <p class="breakdown-info">{{ tokenHealth.security.assessment }}</p>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Market Performance</span>
            <span class="score">{{ tokenHealth.market.performanceScore }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{width: tokenHealth.market.performanceScore + '%', background: getScoreColor(tokenHealth.market.performanceScore)}"></div>
          </div>
          <p class="breakdown-info">{{ tokenHealth.market.assessment }}</p>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Holder Distribution</span>
            <span class="score">{{ tokenHealth.holders.distributionScore }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{width: tokenHealth.holders.distributionScore + '%', background: getScoreColor(tokenHealth.holders.distributionScore)}"></div>
          </div>
          <p class="breakdown-info">Top 10: {{ tokenHealth.holders.top10Percent }}% | Risk: {{ tokenHealth.holders.riskLevel }}</p>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>Social Activity</span>
            <span class="score">{{ tokenHealth.social.socialScore }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{width: tokenHealth.social.socialScore + '%', background: getScoreColor(tokenHealth.social.socialScore)}"></div>
          </div>
          <p class="breakdown-info">{{ tokenHealth.social.activityLevel }} | {{ tokenHealth.social.integrationCount }} integrations</p>
        </div>
      </div>

      <!-- Detailed Analysis -->
      <div class="detail-grid">
        <!-- Liquidity Details -->
        <div class="detail-card">
          <h4>💧 Liquidity Analysis</h4>
          <div class="detail-stats">
            <div class="stat">
              <span class="label">Total Liquidity</span>
              <span class="value">${{ formatNumber(tokenHealth.liquidity.totalLiquidity) }}</span>
            </div>
            <div class="stat">
              <span class="label">24h Volume</span>
              <span class="value">${{ formatNumber(tokenHealth.liquidity.volume24h) }}</span>
            </div>
            <div class="stat">
              <span class="label">LV Ratio</span>
              <span class="value">{{ tokenHealth.liquidity.liquidityVolumeRatio }}</span>
            </div>
            <div class="stat">
              <span class="label">Providers</span>
              <span class="value">{{ formatNumber(tokenHealth.liquidity.providerCount) }}</span>
            </div>
          </div>
        </div>

        <!-- Security Details -->
        <div class="detail-card">
          <h4>🔒 Security Analysis</h4>
          <div class="security-flags">
            <span class="flag" :class="{ active: tokenHealth.security.isVerified }">Verified: {{ tokenHealth.security.isVerified ? '✅' : '❌' }}</span>
            <span class="flag" :class="{ danger: tokenHealth.security.hasMintable }">Mintable: {{ tokenHealth.security.hasMintable ? '⚠️' : '✅' }}</span>
            <span class="flag" :class="{ danger: tokenHealth.security.hasBlacklist }">Blacklist: {{ tokenHealth.security.hasBlacklist ? '⚠️' : '✅' }}</span>
            <span class="flag" :class="{ danger: tokenHealth.security.hasPausable }">Pausable: {{ tokenHealth.security.hasPausable ? '⚠️' : '✅' }}</span>
            <span class="flag" :class="{ danger: tokenHealth.security.isHoneypot }">Honeypot: {{ tokenHealth.security.isHoneypot ? '⚠️✅' : '❌' }}</span>
          </div>
        </div>

        <!-- Market Details -->
        <div class="detail-card">
          <h4>📈 Market Performance</h4>
          <div class="detail-stats">
            <div class="stat">
              <span class="label">24h Change</span>
              <span class="value" :class="tokenHealth.market.priceChange24h >= 0 ? 'positive' : 'negative'">
                {{ tokenHealth.market.priceChange24h >= 0 ? '+' : '' }}{{ tokenHealth.market.priceChange24h }}%
              </span>
            </div>
            <div class="stat">
              <span class="label">7d Change</span>
              <span class="value" :class="tokenHealth.market.priceChange7d >= 0 ? 'positive' : 'negative'">
                {{ tokenHealth.market.priceChange7d >= 0 ? '+' : '' }}{{ tokenHealth.market.priceChange7d }}%
              </span>
            </div>
            <div class="stat">
              <span class="label">Market Cap</span>
              <span class="value">${{ formatNumber(tokenHealth.market.marketCap) }}</span>
            </div>
            <div class="stat">
              <span class="label">Volatility</span>
              <span class="value">{{ tokenHealth.market.volatility }}%</span>
            </div>
          </div>
        </div>

        <!-- Holder Details -->
        <div class="detail-card">
          <h4>👥 Holder Distribution</h4>
          <div class="detail-stats">
            <div class="stat">
              <span class="label">Total Holders</span>
              <span class="value">{{ formatNumber(tokenHealth.holders.totalHolders) }}</span>
            </div>
            <div class="stat">
              <span class="label">Top 10%</span>
              <span class="value">{{ tokenHealth.holders.top10Percent }}%</span>
            </div>
            <div class="stat">
              <span class="label">Top 25%</span>
              <span class="value">{{ tokenHealth.holders.top25Percent }}%</span>
            </div>
            <div class="stat">
              <span class="label">Gini Coefficient</span>
              <span class="value">{{ tokenHealth.holders.giniCoefficient }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Factors -->
      <div v-if="tokenHealth.riskFactors.length > 0" class="risk-factors">
        <h4>⚠️ Risk Factors</h4>
        <ul>
          <li v-for="(factor, idx) in tokenHealth.riskFactors" :key="idx">{{ factor }}</li>
        </ul>
      </div>

      <!-- Positive Factors -->
      <div v-if="tokenHealth.positiveFactors.length > 0" class="positive-factors">
        <h4>✅ Positive Factors</h4>
        <ul>
          <li v-for="(factor, idx) in tokenHealth.positiveFactors" :key="idx">{{ factor }}</li>
        </ul>
      </div>

      <!-- Recommendations -->
      <div v-if="tokenHealth.recommendations.length > 0" class="recommendations">
        <h4>💡 Recommendations</h4>
        <ul>
          <li v-for="(rec, idx) in tokenHealth.recommendations" :key="idx">{{ rec }}</li>
        </ul>
      </div>
    </div>

    <!-- Top Healthy / Most Risky -->
    <div v-if="summary" class="ranking-section">
      <div class="ranking-card">
        <h4>🏆 Top Healthy Tokens</h4>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Chain</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="token in summary.topHealthy" :key="token.symbol">
              <td>{{ token.symbol }}</td>
              <td>{{ token.chain }}</td>
              <td class="score-cell">{{ token.score }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="ranking-card warning">
        <h4>⚠️ Most Risky Tokens</h4>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Chain</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="token in summary.mostRisky" :key="token.symbol">
              <td>{{ token.symbol }}</td>
              <td>{{ token.chain }}</td>
              <td class="score-cell danger">{{ token.score }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface TokenHealth {
  symbol: string
  name: string
  chain: string
  contractAddress: string
  overallScore: number
  healthGrade: string
  riskLevel: string
  liquidity: {
    liquidityScore: number
    totalLiquidity: number
    volume24h: number
    liquidityVolumeRatio: number
    providerCount: number
    concentrationRisk: string
    assessment: string
  }
  holders: {
    top10Percent: number
    top25Percent: number
    top50Percent: number
    giniCoefficient: number
    totalHolders: number
    distributionScore: number
    riskLevel: string
  }
  security: {
    securityScore: number
    isVerified: boolean
    isProxy: boolean
    hasPausable: boolean
    hasMintable: boolean
    hasBlacklist: boolean
    ownerIsZero: boolean
    isHoneypot: boolean
    hasCooldown: boolean
    hasTransferDelay: boolean
    assessment: string
  }
  market: {
    performanceScore: number
    priceChange24h: number
    priceChange7d: number
    priceChange30d: number
    volatility: number
    volatilityLevel: string
    marketCap: number
    volume24h: number
    volumeMcRatio: number
    assessment: string
  }
  social: {
    socialScore: number
    twitterFollowers: number
    discordMembers: number
    redditSubscribers: number
    githubStars: number
    integrationCount: number
    activityLevel: string
    assessment: string
  }
  riskFactors: string[]
  positiveFactors: string[]
  recommendations: string[]
  timestamp: string
}

interface Summary {
  totalAnalyzed: number
  averageScore: number
  lowRiskCount: number
  mediumRiskCount: number
  highRiskCount: number
  criticalRiskCount: number
  topHealthy: { symbol: string; score: number; chain: string }[]
  mostRisky: { symbol: string; score: number; chain: string }[]
}

const searchSymbol = ref('')
const selectedChain = ref('ethereum')
const loading = ref(false)
const tokenHealth = ref<TokenHealth | null>(null)
const summary = ref<Summary | null>(null)
const quickTokens = ['ETH', 'BTC', 'USDC', 'UNI', 'AAVE', 'LINK', 'CRV', 'LDO']

const getScoreColor = (score: number): string => {
  if (score >= 70) return '#22c55e'
  if (score >= 50) return '#eab308'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

const getRiskClass = (risk: string): string => {
  if (risk === 'low') return 'low-risk'
  if (risk === 'medium') return 'medium-risk'
  if (risk === 'high') return 'high-risk'
  return 'critical-risk'
}

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const searchToken = async () => {
  if (!searchSymbol.value) return
  loading.value = true
  try {
    const response = await fetch(`/api/web3/token-health/health?symbol=${searchSymbol.value.toUpperCase()}&chain=${selectedChain.value}`)
    const data = await response.json()
    tokenHealth.value = data
  } catch (error) {
    console.error('Error fetching token health:', error)
  } finally {
    loading.value = false
  }
}

const quickSearch = (symbol: string) => {
  searchSymbol.value = symbol
  searchToken()
}

const fetchSummary = async () => {
  try {
    const response = await fetch('/api/web3/token-health/summary')
    summary.value = await response.json()
  } catch (error) {
    console.error('Error fetching summary:', error)
  }
}

onMounted(() => {
  fetchSummary()
})
</script>

<style scoped>
.token-health-score {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin: 5px 0 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.summary-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.summary-card.success {
  background: #dcfce7;
}

.summary-card.warning {
  background: #fef3c7;
}

.summary-card.danger {
  background: #fee2e2;
}

.card-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
}

.search-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-box input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-box select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-box button {
  padding: 10px 25px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.search-box button:disabled {
  background: #93c5fd;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.quick-btn:hover {
  background: #e5e7eb;
}

.result-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.score-card {
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
}

.score-card.low-risk {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

.score-card.medium-risk {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.score-card.high-risk {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.score-card.critical-risk {
  background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%);
}

.score-main {
  display: flex;
  align-items: center;
  gap: 30px;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-circle svg {
  width: 100%;
  height: 100%;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
}

.score-grade {
  font-size: 18px;
  color: #666;
}

.score-info h3 {
  margin: 0 0 10px;
}

.score-info .chain {
  color: #666;
  margin: 5px 0;
}

.score-info .risk {
  font-weight: bold;
}

.score-info .risk.low { color: #16a34a; }
.score-info .risk.medium { color: #ca8a04; }
.score-info .risk.high { color: #dc2626; }
.score-info .risk.critical { color: #b91c1c; }

.score-breakdown {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.breakdown-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.breakdown-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 500;
}

.breakdown-header .score {
  font-weight: bold;
  color: #3b82f6;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.breakdown-info {
  font-size: 11px;
  color: #666;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.detail-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.detail-card h4 {
  margin: 0 0 15px;
  font-size: 14px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 11px;
  color: #666;
}

.stat .value {
  font-size: 14px;
  font-weight: 500;
}

.stat .value.positive { color: #16a34a; }
.stat .value.negative { color: #dc2626; }

.security-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flag {
  font-size: 12px;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
}

.flag.danger {
  background: #fee2e2;
}

.risk-factors, .positive-factors, .recommendations {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.risk-factors h4 { color: #dc2626; margin: 0 0 10px; }
.positive-factors h4 { color: #16a34a; margin: 0 0 10px; }
.recommendations h4 { color: #3b82f6; margin: 0 0 10px; }

.risk-factors ul, .positive-factors ul, .recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.risk-factors li, .positive-factors li, .recommendations li {
  margin-bottom: 5px;
  font-size: 13px;
}

.ranking-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.ranking-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
}

.ranking-card.warning {
  background: #fef3c7;
}

.ranking-card h4 {
  margin: 0 0 15px;
}

.ranking-card table {
  width: 100%;
  border-collapse: collapse;
}

.ranking-card th, .ranking-card td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.ranking-card th {
  font-size: 12px;
  color: #666;
}

.score-cell {
  font-weight: bold;
  color: #22c55e;
}

.score-cell.danger {
  color: #ef4444;
}
</style>
