<template>
  <div class="cross-chain-token-mapper">
    <div class="header-section">
      <h2>🔗 Cross-chain Token Mapper</h2>
      <p class="subtitle">Track token addresses across multiple blockchains</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="Search by symbol or name (e.g., USDC, ETH)..."
        size="large"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Chain Filter -->
    <div class="chain-filter">
      <span class="filter-label">Filter by Chain:</span>
      <el-select v-model="selectedChain" placeholder="All Chains" clearable @change="handleChainChange">
        <el-option
          v-for="chain in supportedChains"
          :key="chain"
          :label="chain"
          :value="chain"
        >
          <span class="chain-option">
            <span class="chain-icon">{{ getChainIcon(chain) }}</span>
            {{ chain }}
          </span>
        </el-option>
      </el-select>
    </div>

    <!-- Popular Tokens -->
    <div v-if="!searchQuery && !selectedChain" class="popular-tokens">
      <h3>🔥 Popular Tokens</h3>
      <div class="token-grid">
        <div
          v-for="token in popularTokens"
          :key="token.symbol"
          class="token-card"
          @click="selectToken(token.symbol)"
        >
          <div class="token-symbol">{{ token.symbol }}</div>
          <div class="token-name">{{ token.name }}</div>
          <div class="token-chains">{{ token.chainCount }} chains</div>
          <div class="token-price">${{ token.price?.toFixed(2) || 'N/A' }}</div>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchQuery && searchResults.length" class="search-results">
      <h3>Search Results</h3>
      <div class="token-list">
        <div
          v-for="token in searchResults"
          :key="token.symbol"
          class="token-row"
          @click="selectToken(token.symbol)"
        >
          <div class="token-info">
            <span class="symbol">{{ token.symbol }}</span>
            <span class="name">{{ token.name }}</span>
          </div>
          <div class="chain-count">{{ Object.keys(token.addresses).length }} chains</div>
        </div>
      </div>
    </div>

    <!-- Chain Tokens -->
    <div v-if="selectedChain && chainTokens.length" class="chain-tokens">
      <h3>{{ selectedChain }} Tokens</h3>
      <div class="token-list">
        <div
          v-for="token in chainTokens"
          :key="token.symbol"
          class="token-row"
          @click="selectToken(token.symbol)"
        >
          <div class="token-info">
            <span class="symbol">{{ token.symbol }}</span>
            <span class="name">{{ token.name }}</span>
          </div>
          <div class="token-address">
            <el-tooltip :content="token.address" placement="top">
              <span class="address">{{ shortenAddress(token.address) }}</span>
            </el-tooltip>
            <el-button type="primary" link @click.stop="copyAddress(token.address)">
              <CopyDocument />
            </el-button>
          </div>
          <div class="token-price">${{ token.price?.toFixed(2) || 'N/A' }}</div>
        </div>
      </div>
    </div>

    <!-- Token Detail Modal -->
    <el-dialog
      v-model="showTokenModal"
      :title="`${selectedTokenData?.symbol} - Cross-chain Addresses`"
      width="700px"
    >
      <div v-if="selectedTokenData" class="token-detail">
        <div class="token-header">
          <div class="token-title">
            <h3>{{ selectedTokenData.symbol }}</h3>
            <span class="token-full-name">{{ selectedTokenData.name }}</span>
          </div>
          <div class="token-price-tag">
            <span class="price">${{ selectedTokenData.price?.toFixed(2) || 'N/A' }}</span>
            <span class="label">Current Price</span>
          </div>
        </div>

        <div class="chains-section">
          <h4>Available on {{ selectedTokenData.chains?.length }} Chains</h4>
          <el-table :data="selectedTokenData.chains" style="width: 100%">
            <el-table-column prop="chain" label="Chain" width="120">
              <template #default="{ row }">
                <span class="chain-cell">
                  <span class="chain-icon">{{ getChainIcon(row.chain) }}</span>
                  {{ row.chain }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="chainId" label="Chain ID" width="100" />
            <el-table-column label="Address">
              <template #default="{ row }">
                <div class="address-cell">
                  <el-tooltip :content="row.address" placement="top">
                    <span class="address">{{ shortenAddress(row.address) }}</span>
                  </el-tooltip>
                  <el-button type="primary" link @click="copyAddress(row.address)">
                    <CopyDocument />
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="isNative" label="Type" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isNative ? 'success' : 'info'" size="small">
                  {{ row.isNative ? 'Native' : 'Wrapped' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="comparison-chart">
          <h4>Price Comparison</h4>
          <div class="price-bars">
            <div
              v-for="chain in selectedTokenData.chains"
              :key="chain.chain"
              class="price-bar-item"
            >
              <span class="chain-name">{{ chain.chain }}</span>
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{ width: getPriceBarWidth(chain.price) }"
                ></div>
              </div>
              <span class="price-value">${{ chain.price?.toFixed(2) || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, CopyDocument } from '@element-plus/icons-vue'
import { request } from '@/service/request'

// State
const searchQuery = ref('')
const selectedChain = ref('')
const supportedChains = ref<string[]>([])
const popularTokens = ref<any[]>([])
const searchResults = ref<any[]>([])
const chainTokens = ref<any[]>([])
const showTokenModal = ref(false)
const selectedTokenData = ref<any>(null)

// Chain icons mapping
const chainIcons: { [key: string]: string } = {
  ethereum: '🔷',
  polygon: '🟣',
  arbitrum: '🔵',
  optimism: '🔴',
  base: '🔵',
  avalanche: '🔺',
  bsc: '🟡',
}

// Methods
function getChainIcon(chain: string): string {
  return chainIcons[chain] || '⛓️'
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

async function copyAddress(address: string) {
  try {
    await navigator.clipboard.writeText(address)
    ElMessage.success('Address copied!')
  } catch {
    ElMessage.error('Failed to copy')
  }
}

function getPriceBarWidth(price: number): string {
  const maxPrice = 70000 // WBTC price as reference
  const percentage = Math.min((price / maxPrice) * 100, 100)
  return `${percentage}%`
}

async function loadSupportedChains() {
  try {
    const res = await request.get('/cross-chain-token-mapper/chains')
    supportedChains.value = res.data
  } catch (error) {
    console.error('Failed to load chains:', error)
    supportedChains.value = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc']
  }
}

async function loadPopularTokens() {
  try {
    const res = await request.get('/cross-chain-token-mapper/tokens/popular')
    popularTokens.value = res.data
  } catch (error) {
    console.error('Failed to load popular tokens:', error)
  }
}

async function handleSearch() {
  if (!searchQuery.value) {
    searchResults.value = []
    return
  }
  try {
    const res = await request.get('/cross-chain-token-mapper/tokens/search', {
      params: { q: searchQuery.value }
    })
    searchResults.value = res.data
  } catch (error) {
    console.error('Failed to search tokens:', error)
    searchResults.value = []
  }
}

async function handleChainChange() {
  if (!selectedChain.value) {
    chainTokens.value = []
    return
  }
  try {
    const res = await request.get(`/cross-chain-token-mapper/chain/${selectedChain.value}/tokens`)
    chainTokens.value = res.data
  } catch (error) {
    console.error('Failed to load chain tokens:', error)
    chainTokens.value = []
  }
}

async function selectToken(symbol: string) {
  try {
    const res = await request.get(`/cross-chain-token-mapper/tokens/${symbol}`)
    selectedTokenData.value = res.data
    showTokenModal.value = true
  } catch (error) {
    console.error('Failed to load token details:', error)
    ElMessage.error('Failed to load token details')
  }
}

// Lifecycle
onMounted(() => {
  loadSupportedChains()
  loadPopularTokens()
})
</script>

<style scoped>
.cross-chain-token-mapper {
  padding: 20px;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  color: #666;
  margin: 0;
}

.search-section {
  margin-bottom: 16px;
}

.chain-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-label {
  font-weight: 500;
  color: #333;
}

.chain-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chain-icon {
  font-size: 16px;
}

.popular-tokens,
.search-results,
.chain-tokens {
  margin-bottom: 24px;
}

.popular-tokens h3,
.search-results h3,
.chain-tokens h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.token-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.token-card {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.token-card:hover {
  background: #e4e7ed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.token-symbol {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.token-name {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.token-chains {
  font-size: 12px;
  color: #409eff;
}

.token-price {
  font-size: 14px;
  font-weight: 500;
  color: #67c23a;
  margin-top: 8px;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.token-row:hover {
  background: #e4e7ed;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-info .symbol {
  font-weight: 600;
  color: #303133;
}

.token-info .name {
  color: #909399;
  font-size: 14px;
}

.chain-count,
.token-address {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address {
  font-family: monospace;
  font-size: 13px;
  color: #409eff;
}

.token-price {
  font-weight: 500;
  color: #67c23a;
}

/* Modal Styles */
.token-detail {
  padding: 0;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.token-title h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
}

.token-full-name {
  color: #909399;
}

.token-price-tag {
  text-align: right;
}

.token-price-tag .price {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #67c23a;
}

.token-price-tag .label {
  font-size: 12px;
  color: #909399;
}

.chains-section {
  margin-bottom: 24px;
}

.chains-section h4 {
  margin: 0 0 12px 0;
}

.chain-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comparison-chart h4 {
  margin: 0 0 12px 0;
}

.price-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-bar-item .chain-name {
  width: 80px;
  font-size: 13px;
  color: #606266;
}

.bar-container {
  flex: 1;
  height: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 4px;
  transition: width 0.3s;
}

.price-value {
  width: 80px;
  text-align: right;
  font-weight: 500;
}
</style>
