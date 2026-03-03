<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface ChainInfo {
  chain: string
  chainId: number
  name: string
  symbol: string
  explorer: string
  nativeToken: string
  color: string
}

interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  decimals: number
  valueUSD: number
  logoUrl?: string
}

interface WalletBalance {
  chain: string
  chainId: number
  address: string
  nativeBalance: string
  nativeValueUSD: number
  tokens: TokenBalance[]
  totalValueUSD: number
}

interface ChainDistribution {
  chain: string
  valueUSD: number
  percentage: number
}

interface TokenDistribution {
  symbol: string
  valueUSD: number
  percentage: number
}

const address = ref('')
const loading = ref(false)
const chains = ref<ChainInfo[]>([])
const selectedChains = ref<string[]>([])
const balances = ref<WalletBalance[]>([])
const portfolio = ref<{
  totalValueUSD: number
  chainDistribution: ChainDistribution[]
  tokenDistribution: TokenDistribution[]
} | null>(null)

const chainColors: Record<string, string> = {
  ethereum: '#627EEA',
  polygon: '#8247E5',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  bsc: '#F3BA2F',
  avalanche: '#E84142',
  base: '#0052FF',
}

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const fetchChains = async () => {
  try {
    const res = await fetch('/api/web3/cross-chain-wallet/chains')
    const data = await res.json()
    if (data.success) {
      chains.value = data.data
      selectedChains.value = chains.value.map(c => c.chain)
    }
  } catch (error) {
    console.error('Failed to fetch chains:', error)
  }
}

const fetchBalances = async () => {
  if (!address.value) return
  
  loading.value = true
  try {
    const chainsParam = selectedChains.value.join(',')
    const res = await fetch(`/api/web3/cross-chain-wallet/balance/${address.value}?chains=${chainsParam}`)
    const data = await res.json()
    if (data.success) {
      balances.value = data.data
    }

    const portfolioRes = await fetch(`/api/web3/cross-chain-wallet/portfolio/${address.value}`)
    const portfolioData = await portfolioRes.json()
    if (portfolioData.success) {
      portfolio.value = portfolioData.data
    }
  } catch (error) {
    console.error('Failed to fetch balances:', error)
  } finally {
    loading.value = false
  }
}

const totalPortfolioValue = computed(() => {
  return balances.value.reduce((sum, b) => sum + b.totalValueUSD, 0)
})

const topChains = computed(() => {
  if (!portfolio.value) return []
  return portfolio.value.chainDistribution.slice(0, 5)
})

const topTokens = computed(() => {
  if (!portfolio.value) return []
  return portfolio.value.tokenDistribution.slice(0, 8)
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    fetchBalances()
  }
}

onMounted(() => {
  fetchChains()
})
</script>

<template>
  <div class="cross-chain-wallet">
    <div class="header">
      <h1>🔗 Cross-chain Wallet Manager</h1>
      <p>Unified multi-chain wallet portfolio management</p>
    </div>

    <div class="search-section">
      <div class="search-box">
        <input
          v-model="address"
          type="text"
          placeholder="Enter wallet address (e.g., 0x...)"
          @keydown="handleKeydown"
        />
        <button class="btn-primary" @click="fetchBalances" :disabled="loading || !address">
          {{ loading ? 'Loading...' : 'Analyze' }}
        </button>
      </div>

      <div class="chain-filters">
        <label v-for="chain in chains" :key="chain.chain" class="chain-checkbox">
          <input
            type="checkbox"
            v-model="selectedChains"
            :value="chain.chain"
          />
          <span class="chain-badge" :style="{ borderColor: chain.color }">
            <span class="chain-dot" :style="{ backgroundColor: chain.color }"></span>
            {{ chain.name }}
          </span>
        </label>
      </div>
    </div>

    <div v-if="portfolio" class="portfolio-summary">
      <div class="total-value-card">
        <div class="value-label">Total Portfolio Value</div>
        <div class="value-amount">{{ formatUSD(portfolio.totalValueUSD) }}</div>
        <div class="chain-count">{{ balances.length }} chains tracked</div>
      </div>

      <div class="distribution-grid">
        <div class="distribution-card">
          <h3>🌐 Chain Distribution</h3>
          <div class="distribution-list">
            <div
              v-for="item in topChains"
              :key="item.chain"
              class="distribution-item"
            >
              <div class="item-label">
                <span class="chain-dot" :style="{ backgroundColor: chainColors[item.chain] || '#666' }"></span>
                {{ item.chain }}
              </div>
              <div class="item-value">
                <span class="usd-value">{{ formatUSD(item.valueUSD) }}</span>
                <span class="percentage">{{ item.percentage.toFixed(1) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${item.percentage}%`,
                    backgroundColor: chainColors[item.chain] || '#666'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="distribution-card">
          <h3>🪙 Token Distribution</h3>
          <div class="distribution-list">
            <div
              v-for="item in topTokens"
              :key="item.symbol"
              class="distribution-item"
            >
              <div class="item-label">{{ item.symbol }}</div>
              <div class="item-value">
                <span class="usd-value">{{ formatUSD(item.valueUSD) }}</span>
                <span class="percentage">{{ item.percentage.toFixed(1) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${item.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="balances.length > 0" class="balances-grid">
      <div
        v-for="balance in balances"
        :key="balance.chain"
        class="balance-card"
        :style="{ borderTopColor: chainColors[balance.chain] || '#666' }"
      >
        <div class="card-header">
          <span class="chain-name">
            <span class="chain-dot lg" :style="{ backgroundColor: chainColors[balance.chain] || '#666' }"></span>
            {{ balance.chain }}
          </span>
          <span class="chain-value">{{ formatUSD(balance.totalValueUSD) }}</span>
        </div>

        <div class="native-balance">
          <span class="label">Native</span>
          <span class="value">{{ balance.nativeBalance }} ({{ formatUSD(balance.nativeValueUSD) }})</span>
        </div>

        <div v-if="balance.tokens.length > 0" class="token-list">
          <div class="token-header">Tokens</div>
          <div v-for="token in balance.tokens" :key="token.symbol" class="token-item">
            <span class="token-symbol">{{ token.symbol }}</span>
            <span class="token-balance">{{ parseFloat(token.balance).toLocaleString() }}</span>
            <span class="token-value">{{ formatUSD(token.valueUSD) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && !portfolio && address" class="empty-state">
      <p>No portfolio data found. Try a different address.</p>
    </div>
  </div>
</template>

<style scoped>
.cross-chain-wallet {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #1a1a2e;
}

.header p {
  color: #666;
  font-size: 14px;
}

.search-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #627EEA;
}

.btn-primary {
  padding: 12px 24px;
  background: #627EEA;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.chain-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chain-checkbox {
  cursor: pointer;
}

.chain-checkbox input {
  display: none;
}

.chain-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 2px solid transparent;
  border-radius: 20px;
  font-size: 13px;
  background: #f5f5f5;
  transition: all 0.2s;
}

.chain-checkbox input:checked + .chain-badge {
  background: #e8f0fe;
}

.chain-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chain-dot.lg {
  width: 12px;
  height: 12px;
}

.portfolio-summary {
  margin-bottom: 24px;
}

.total-value-card {
  background: linear-gradient(135deg, #627EEA 0%, #4F46E5 100%);
  color: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  margin-bottom: 20px;
}

.value-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.value-amount {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 8px;
}

.chain-count {
  font-size: 13px;
  opacity: 0.8;
}

.distribution-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.distribution-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.distribution-card h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
}

.item-value {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.usd-value {
  font-weight: 500;
  color: #333;
}

.percentage {
  color: #888;
}

.progress-bar {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #627EEA;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.balances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.balance-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border-top: 4px solid #627EEA;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chain-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  text-transform: capitalize;
}

.chain-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.native-balance {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.native-balance .label {
  color: #888;
}

.token-list {
  margin-top: 12px;
}

.token-header {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.token-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid #f5f5f5;
}

.token-symbol {
  font-weight: 500;
}

.token-balance {
  color: #666;
}

.token-value {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

@media (max-width: 768px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }
}
</style>
