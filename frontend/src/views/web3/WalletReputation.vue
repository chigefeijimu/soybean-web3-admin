<template>
  <div class="wallet-reputation">
    <div class="header">
      <h2>🏆 Wallet Reputation - 钱包声誉评分</h2>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="">全部链</option>
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
          <option value="bsc">BSC</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <button @click="refreshData" :disabled="loading" class="btn-refresh">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <input 
        v-model="searchAddress" 
        placeholder="输入钱包地址查询声誉..." 
        class="search-input"
        @keyup.enter="searchReputation"
      />
      <button @click="searchReputation" :disabled="loading || !searchAddress" class="btn-search">
        🔍 查询
      </button>
    </div>

    <!-- Reputation Result -->
    <div v-if="reputation" class="reputation-result">
      <div class="reputation-header">
        <div class="score-circle" :class="reputation.grade">
          <div class="score-value">{{ reputation.score }}</div>
          <div class="score-grade">{{ reputation.grade }}</div>
        </div>
        <div class="reputation-info">
          <h3>{{ reputation.level }}</h3>
          <div class="address-display">{{ formatAddress(reputation.address) }}</div>
          <div class="chain-badge">{{ reputation.chain }}</div>
          <div class="risk-badge" :class="reputation.risk">
            风险: {{ reputation.risk }}
          </div>
        </div>
      </div>

      <div class="description">
        {{ reputation.description }}
      </div>

      <!-- Factors -->
      <div class="factors-section">
        <h4>📊 声誉因素分析</h4>
        <div class="factors-grid">
          <div class="factor-item">
            <div class="factor-label">钱包年龄</div>
            <div class="factor-value">{{ reputation.factors.walletAge }} 天</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(reputation.factors.walletAge / 15, 100) + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">交易数量</div>
            <div class="factor-value">{{ formatNumber(reputation.factors.transactionCount) }}</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(reputation.factors.transactionCount / 50, 100) + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">总交易量</div>
            <div class="factor-value">${{ formatNumber(reputation.factors.totalVolume) }}</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(reputation.factors.totalVolume / 100000, 100) + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">DeFi交互</div>
            <div class="factor-value">{{ reputation.factors.defiInteractions }}</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(reputation.factors.defiInteractions / 2, 100) + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">NFT活动</div>
            <div class="factor-value">{{ reputation.factors.nftActivity }}</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(reputation.factors.nftActivity / 0.5, 100) + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">多样性</div>
            <div class="factor-value">{{ reputation.factors.diversity }} 协议</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(reputation.factors.diversity / 0.15, 100) + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">活跃规律性</div>
            <div class="factor-value">{{ reputation.factors.regularity }}%</div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: reputation.factors.regularity + '%' }"></div>
            </div>
          </div>
          <div class="factor-item">
            <div class="factor-label">收益历史</div>
            <div class="factor-value" :class="{ positive: reputation.factors.profitHistory > 0, negative: reputation.factors.profitHistory < 0 }">
              {{ reputation.factors.profitHistory > 0 ? '+' : '' }}${{ formatNumber(reputation.factors.profitHistory) }}
            </div>
            <div class="factor-bar">
              <div class="factor-fill" :style="{ width: Math.min(Math.abs(reputation.factors.profitHistory) / 2500, 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section">
        <h4>💡 优化建议</h4>
        <ul class="recommendations-list">
          <li v-for="(rec, index) in reputation.recommendations" :key="index">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="leaderboard-section">
      <div class="section-header">
        <h3>🏅 声誉排行榜</h3>
        <button @click="loadLeaderboard" :disabled="loading" class="btn-small">
          刷新榜单
        </button>
      </div>
      <div v-if="leaderboard.length > 0" class="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>地址</th>
              <th>评分</th>
              <th>等级</th>
              <th>风险</th>
              <th>链</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in leaderboard" :key="item.address" @click="viewWallet(item.address)">
              <td>{{ index + 1 }}</td>
              <td class="address-cell">{{ formatAddress(item.address) }}</td>
              <td class="score-cell">
                <span class="score-badge" :class="item.grade">{{ item.score }}</span>
              </td>
              <td>
                <span class="level-badge" :class="item.grade">{{ item.level }}</span>
              </td>
              <td>
                <span class="risk-badge" :class="item.risk">{{ item.risk }}</span>
              </td>
              <td>{{ item.chain }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Compare Section -->
    <div class="compare-section">
      <h3>⚖️ 钱包对比</h3>
      <div class="compare-input">
        <input 
          v-model="compareAddresses" 
          placeholder="输入钱包地址，多个用逗号分隔..." 
          class="search-input"
        />
        <button @click="compareWallets" :disabled="loading || !compareAddresses" class="btn-search">
          对比
        </button>
      </div>

      <div v-if="comparisonResult" class="comparison-result">
        <div class="comparison-summary">
          <div class="summary-item">
            <span class="label">最高分:</span>
            <span class="value">{{ comparisonResult.comparison.highestScore.score }}</span>
            <span class="address">{{ formatAddress(comparisonResult.comparison.highestScore.address) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">最低分:</span>
            <span class="value">{{ comparisonResult.comparison.lowestScore.score }}</span>
            <span class="address">{{ formatAddress(comparisonResult.comparison.lowestScore.address) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">平均分:</span>
            <span class="value">{{ comparisonResult.comparison.averageScore }}</span>
          </div>
          <div class="summary-item">
            <span class="label">分差:</span>
            <span class="value">{{ comparisonResult.comparison.scoreDifference }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ReputationFactors {
  walletAge: number
  transactionCount: number
  totalVolume: number
  defiInteractions: number
  nftActivity: number
  diversity: number
  regularity: number
  profitHistory: number
}

interface ReputationScore {
  address: string
  score: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  level: string
  factors: ReputationFactors
  risk: 'low' | 'medium' | 'high'
  description: string
  recommendations: string[]
  chain: string
  calculatedAt: string
}

interface ComparisonResult {
  wallets: ReputationScore[]
  comparison: {
    highestScore: { address: string; score: number }
    lowestScore: { address: string; score: number }
    averageScore: number
    scoreDifference: number
  }
}

const loading = ref(false)
const selectedChain = ref('')
const searchAddress = ref('')
const reputation = ref<ReputationScore | null>(null)
const leaderboard = ref<ReputationScore[]>([])
const compareAddresses = ref('')
const comparisonResult = ref<ComparisonResult | null>(null)

const API_BASE = '/api/web3/wallet-reputation'

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatNumber = (num: number) => {
  if (!num && num !== 0) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(2)
}

const searchReputation = async () => {
  if (!searchAddress.value) return
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/score/${searchAddress.value}`)
    reputation.value = await response.json()
  } catch (error) {
    console.error('Failed to fetch reputation:', error)
  } finally {
    loading.value = false
  }
}

const loadLeaderboard = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/leaderboard?limit=10`)
    const data = await response.json()
    leaderboard.value = data.leaderboard
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
  } finally {
    loading.value = false
  }
}

const compareWallets = async () => {
  if (!compareAddresses.value) return
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/compare?addresses=${encodeURIComponent(compareAddresses.value)}`)
    comparisonResult.value = await response.json()
  } catch (error) {
    console.error('Failed to compare wallets:', error)
  } finally {
    loading.value = false
  }
}

const viewWallet = (address: string) => {
  searchAddress.value = address
  searchReputation()
}

const refreshData = () => {
  if (searchAddress.value) {
    searchReputation()
  }
  loadLeaderboard()
}

onMounted(() => {
  loadLeaderboard()
})
</script>

<style scoped>
.wallet-reputation {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.chain-select, .btn-refresh, .btn-search, .btn-small {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.chain-select:disabled, .btn-refresh:disabled, .btn-search:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.reputation-result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.reputation-header {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.score-circle.S { background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); }
.score-circle.A { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); }
.score-circle.B { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
.score-circle.C { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
.score-circle.D { background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); }
.score-circle.F { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }

.score-value {
  font-size: 36px;
  font-weight: bold;
}

.score-grade {
  font-size: 24px;
  font-weight: bold;
}

.reputation-info h3 {
  margin: 0 0 8px 0;
  font-size: 28px;
}

.address-display {
  font-family: monospace;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.chain-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e0e7ff;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
}

.risk-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.risk-badge.low { background: #dcfce7; color: #166534; }
.risk-badge.medium { background: #fef3c7; color: #92400e; }
.risk-badge.high { background: #fee2e2; color: #991b1b; }

.description {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
}

.factors-section, .recommendations-section {
  margin-bottom: 20px;
}

.factors-section h4, .recommendations-section h4 {
  margin: 0 0 16px 0;
}

.factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.factor-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
}

.factor-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.factor-value {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.factor-value.positive { color: #22c55e; }
.factor-value.negative { color: #ef4444; }

.factor-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.factor-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations-list li {
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
}

.leaderboard-section, .compare-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.leaderboard-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  font-weight: 600;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

tr:hover {
  background: #f9fafb;
}

.address-cell {
  font-family: monospace;
  font-size: 12px;
}

.score-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
}

.score-badge.S { background: #fef08a; color: #92400e; }
.score-badge.A { background: #bbf7d0; color: #166534; }
.score-badge.B { background: #bfdbfe; color: #1e40af; }
.score-badge.C { background: #fde68a; color: #92400e; }
.score-badge.D { background: #fed7aa; color: #9a3412; }
.score-badge.F { background: #fecaca; color: #991b1b; }

.level-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.level-badge.S, .level-badge.A { background: #dcfce7; color: #166534; }
.level-badge.B { background: #dbeafe; color: #1e40af; }
.level-badge.C, .level-badge.D { background: #fef3c7; color: #92400e; }
.level-badge.F { background: #fee2e2; color: #991b1b; }

.compare-input {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.comparison-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.summary-item .address {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}
</style>
