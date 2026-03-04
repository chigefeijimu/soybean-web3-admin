<template>
  <div class="defi-position-monitor">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>🔄 Cross-chain DeFi Position Monitor</h1>
        <p class="subtitle">Real-time monitoring of your DeFi positions across multiple chains</p>
      </div>
      <div class="header-actions">
        <a-input-search
          v-model:value="walletAddress"
          placeholder="Enter wallet address"
          style="width: 400px"
          size="large"
          @search="loadPortfolio"
          enter-button="Monitor"
        />
      </div>
    </div>

    <!-- Loading State -->
    <a-spin v-if="loading" size="large" class="loading-container">
      <div class="loading-content">
        <a-icon type="loading" spin />
        <p>Loading positions...</p>
      </div>
    </a-spin>

    <!-- Content -->
    <div v-else-if="portfolio" class="content">
      <!-- Portfolio Summary Cards -->
      <a-row :gutter="[16, 16]" class="summary-cards">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="summary-card total-value">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <div class="card-label">Total Value</div>
              <div class="card-value">${{ formatNumber(portfolio.total_value_usd) }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="summary-card net-value">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <div class="card-label">Net Value</div>
              <div class="card-value">${{ formatNumber(portfolio.net_value_usd) }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="summary-card total-debt" :class="{ 'warning': portfolio.total_debt_usd > 0 }">
            <div class="card-icon">💳</div>
            <div class="card-content">
              <div class="card-label">Total Debt</div>
              <div class="card-value">${{ formatNumber(portfolio.total_debt_usd) }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="summary-card avg-apy">
            <div class="card-icon">📈</div>
            <div class="card-content">
              <div class="card-label">Avg. APY</div>
              <div class="card-value">{{ portfolio.total_apy.toFixed(2) }}%</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- Risk Level and Stats -->
      <a-row :gutter="[16, 16]" class="stats-row">
        <a-col :xs="24" :lg="16">
          <a-card title="Portfolio Distribution" class="distribution-card">
            <a-tabs v-model="activeTab">
              <a-tab-pane key="chains" tab="By Chain">
                <div class="distribution-list">
                  <div 
                    v-for="chain in portfolio.chain_distribution" 
                    :key="chain.chain_id"
                    class="distribution-item"
                  >
                    <div class="item-info">
                      <span class="chain-icon">{{ getChainIcon(chain.chain_id) }}</span>
                      <span class="chain-name">{{ chain.chain_name }}</span>
                    </div>
                    <div class="item-stats">
                      <span class="value">${{ formatNumber(chain.value_usd) }}</span>
                      <span class="percentage">{{ chain.percentage.toFixed(1) }}%</span>
                    </div>
                    <a-progress 
                      :percent="chain.percentage" 
                      :show-info="false"
                      :stroke-color="getChainColor(chain.chain_id)"
                      size="small"
                    />
                  </div>
                </div>
              </a-tab-pane>
              <a-tab-pane key="protocols" tab="By Protocol">
                <div class="distribution-list">
                  <div 
                    v-for="protocol in portfolio.protocol_distribution" 
                    :key="protocol.protocol_id"
                    class="distribution-item"
                  >
                    <div class="item-info">
                      <span class="protocol-icon">{{ getProtocolIcon(protocol.protocol_id) }}</span>
                      <span class="protocol-name">{{ protocol.protocol_name }}</span>
                    </div>
                    <div class="item-stats">
                      <span class="value">${{ formatNumber(protocol.value_usd) }}</span>
                      <span class="percentage">{{ protocol.percentage.toFixed(1) }}%</span>
                    </div>
                    <a-progress 
                      :percent="protocol.percentage" 
                      :show-info="false"
                      size="small"
                    />
                  </div>
                </div>
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="Risk Assessment" class="risk-card">
            <div class="risk-indicator" :class="portfolio.risk_level.toLowerCase()">
              <div class="risk-icon">
                <span v-if="portfolio.risk_level === 'Low'">🟢</span>
                <span v-else-if="portfolio.risk_level === 'Medium'">🟡</span>
                <span v-else-if="portfolio.risk_level === 'High'">🟠</span>
                <span v-else>🔴</span>
              </div>
              <div class="risk-label">{{ portfolio.risk_level }} Risk</div>
            </div>
            <div class="risk-stats">
              <div class="stat-item">
                <span class="stat-label">Positions</span>
                <span class="stat-value">{{ portfolio.positions_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Chains</span>
                <span class="stat-value">{{ portfolio.chains_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Protocols</span>
                <span class="stat-value">{{ portfolio.protocols_count }}</span>
              </div>
            </div>
          </a-card>

          <!-- Alerts -->
          <a-card v-if="alerts.length > 0" title="Active Alerts" class="alerts-card" :class="{ 'has-critical': hasCriticalAlert }">
            <div class="alerts-list">
              <div 
                v-for="alert in alerts.slice(0, 5)" 
                :key="alert.id"
                class="alert-item"
                :class="alert.severity.toLowerCase()"
              >
                <a-icon :type="getAlertIcon(alert.severity)" />
                <span class="alert-message">{{ alert.message }}</span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- Positions List -->
      <a-card title="Active Positions" class="positions-card">
        <template #extra>
          <a-select
            v-model="chainFilter"
            placeholder="Filter by chain"
            style="width: 150px"
            allowClear
            @change="filterPositions"
          >
            <a-select-option v-for="chain in portfolio.chain_distribution" :key="chain.chain_id" :value="chain.chain_id">
              {{ chain.chain_name }}
            </a-select-option>
          </a-select>
        </template>
        
        <a-table
          :columns="positionColumns"
          :data-source="filteredPositions"
          :pagination="{ pageSize: 10 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'protocol'">
              <div class="protocol-cell">
                <span class="protocol-icon">{{ getProtocolIcon(record.protocol_id) }}</span>
                <div class="protocol-info">
                  <span class="protocol-name">{{ record.protocol_name }}</span>
                  <span class="chain-badge">{{ record.chain_name }}</span>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'value'">
              <div class="value-cell">
                <span class="main-value">${{ formatNumber(record.total_value_usd) }}</span>
                <span v-if="record.debt_value" class="debt-value">
                  (Debt: ${{ formatNumber(record.debt_value) }})
                </span>
              </div>
            </template>
            <template v-else-if="column.key === 'health'">
              <div v-if="record.health_factor" class="health-cell">
                <a-progress 
                  :percent="Math.min(record.health_factor * 33.33, 100)" 
                  :stroke-color="getHealthColor(record.health_factor)"
                  size="small"
                  style="width: 80px"
                />
                <span class="health-value">{{ record.health_factor.toFixed(2) }}</span>
              </div>
              <span v-else class="na">N/A</span>
            </template>
            <template v-else-if="column.key === 'apy'">
              <span v-if="record.apy" class="apy-value positive">
                {{ record.apy.toFixed(2) }}%
              </span>
              <span v-else class="na">-</span>
            </template>
            <template v-else-if="column.key === 'rewards'">
              <a-badge 
                v-if="record.rewards.some(r => r.claimable && r.value_usd > 0)"
                :count="record.rewards.filter(r => r.claimable && r.value_usd > 0).length"
                :number-style="{ backgroundColor: '#52c41a' }"
              >
                <a-button size="small">Claim</a-button>
              </a-badge>
              <span v-else class="na">-</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>

      <!-- Position Details Modal -->
      <a-modal
        v-model:visible="detailsVisible"
        :title="selectedPosition?.protocol_name"
        width="700px"
        :footer="null"
      >
        <div v-if="selectedPosition" class="position-details">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="Protocol">{{ selectedPosition.protocol_name }}</a-descriptions-item>
            <a-descriptions-item label="Chain">{{ selectedPosition.chain_name }}</a-descriptions-item>
            <a-descriptions-item label="Position Type">{{ selectedPosition.position_type }}</a-descriptions-item>
            <a-descriptions-item label="Status">
              <a-tag :color="getStatusColor(selectedPosition.status)">{{ selectedPosition.status }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="Total Value">${{ formatNumber(selectedPosition.total_value_usd) }}</a-descriptions-item>
            <a-descriptions-item label="APY" v-if="selectedPosition.apy">{{ selectedPosition.apy.toFixed(2) }}%</a-descriptions-item>
            <a-descriptions-item label="Health Factor" v-if="selectedPosition.health_factor">
              <a-tag :color="getHealthTagColor(selectedPosition.health_factor)">
                {{ selectedPosition.health_factor.toFixed(2) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="Debt" v-if="selectedPosition.debt_value">
              ${{ formatNumber(selectedPosition.debt_value) }}
            </a-descriptions-item>
            <a-descriptions-item label="Last Updated">{{ formatDate(selectedPosition.last_updated) }}</a-descriptions-item>
          </a-descriptions>

          <h4 class="tokens-title">Tokens</h4>
          <a-table
            :columns="tokenColumns"
            :data-source="selectedPosition.tokens"
            size="small"
            :pagination="false"
            row-key="address"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'balance'">
                {{ record.balance.toFixed(6) }} {{ record.symbol }}
              </template>
              <template v-else-if="column.key === 'value'">
                ${{ formatNumber(record.value_usd) }}
              </template>
              <template v-else-if="column.key === 'flags'>
                <a-tag v-if="record.is_collateral" color="blue">Collateral</a-tag>
                <a-tag v-if="record.is_debt" color="red">Debt</a-tag>
              </template>
            </template>
          </a-table>

          <div v-if="selectedPosition.rewards.length > 0">
            <h4 class="tokens-title">Claimable Rewards</h4>
            <div class="rewards-list">
              <div v-for="reward in selectedPosition.rewards" :key="reward.symbol" class="reward-item">
                <span class="reward-symbol">{{ reward.symbol }}</span>
                <span class="reward-amount">{{ reward.amount.toFixed(4) }}</span>
                <span class="reward-value">${{ formatNumber(reward.value_usd) }}</span>
                <a-tag v-if="reward.claimable" color="green">Claimable</a-tag>
              </div>
            </div>
          </div>
        </div>
      </a-modal>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <a-icon type="wallet" class="empty-icon" />
      <h2>Enter a wallet address to monitor</h2>
      <p>Track your DeFi positions across multiple chains in real-time</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getPortfolioSummary,
  getAlerts,
  getSupportedChains,
  getSupportedProtocols,
  type PortfolioSummary,
  type DefiPosition,
  type PositionAlert,
  type ChainInfo,
  type ProtocolInfo
} from '@/service/defiPositionMonitor'

// State
const walletAddress = ref('')
const loading = ref(false)
const portfolio = ref<PortfolioSummary | null>(null)
const alerts = ref<PositionAlert[]>([])
const chains = ref<ChainInfo[]>([])
const protocols = ref<ProtocolInfo[]>([])
const chainFilter = ref<number | null>(null)
const activeTab = ref('chains')
const detailsVisible = ref(false)
const selectedPosition = ref<DefiPosition | null>(null)

// Table columns
const positionColumns = [
  { title: 'Protocol', key: 'protocol', width: 200 },
  { title: 'Type', dataIndex: 'position_type', key: 'type', width: 100 },
  { title: 'Value', key: 'value', width: 180 },
  { title: 'Health Factor', key: 'health', width: 150 },
  { title: 'APY', key: 'apy', width: 100 },
  { title: 'Rewards', key: 'rewards', width: 100 },
  { title: 'Status', key: 'status', width: 100 },
]

const tokenColumns = [
  { title: 'Token', dataIndex: 'symbol', key: 'symbol', width: 100 },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Balance', key: 'balance', width: 180 },
  { title: 'Value', key: 'value', width: 120 },
  { title: 'Flags', key: 'flags', width: 150 },
]

// Computed
const filteredPositions = computed(() => {
  if (!portfolio.value) return []
  if (!chainFilter.value) return portfolio.value.positions
  return portfolio.value.positions.filter(p => p.chain_id === chainFilter.value)
})

const hasCriticalAlert = computed(() => {
  return alerts.value.some(a => a.severity === 'Critical')
})

// Methods
async function loadPortfolio() {
  if (!walletAddress.value) return
  
  loading.value = true
  try {
    const [portfolioData, alertsData] = await Promise.all([
      getPortfolioSummary(walletAddress.value),
      getAlerts(walletAddress.value)
    ])
    portfolio.value = portfolioData
    alerts.value = alertsData
  } catch (error) {
    console.error('Failed to load portfolio:', error)
  } finally {
    loading.value = false
  }
}

function filterPositions() {
  // Filter handled by computed
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K'
  }
  return value.toFixed(2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function getChainIcon(chainId: number): string {
  const icons: Record<number, string> = {
    1: '🔷',
    137: '🔴',
    42161: '🔵',
    10: '🔴',
    56: '🟡',
    8453: '🔵',
    43114: '🔺',
  }
  return icons[chainId] || '⛓️'
}

function getChainColor(chainId: number): string {
  const colors: Record<number, string> = {
    1: '#627EEA',
    137: '#8247E5',
    42161: '#28A0F0',
    10: '#FF0420',
    56: '#F3BA2F',
    8453: '#0052FF',
    43114: '#E84142',
  }
  return colors[chainId] || '#666'
}

function getProtocolIcon(protocolId: string): string {
  const icons: Record<string, string> = {
    'aave_v3': '🦁',
    'compound_v3': '🍊',
    'uniswap_v3': '🦄',
    'uniswap_v2': '🦄',
    'sushiswap': '🍣',
    'pancakeswap_v3': '🥞',
    'lido': '🟢',
    'rocket_pool': '🚀',
    'gmx': '🦁',
    'velodrome': '🏎️',
    'aerodrome': '💨',
    'trader_joe': '☕',
  }
  return icons[protocolId] || '📊'
}

function getHealthColor(healthFactor: number): string {
  if (healthFactor < 1.1) return '#ff4d4f'
  if (healthFactor < 1.5) return '#faad14'
  if (healthFactor < 2.0) return '#1890ff'
  return '#52c41a'
}

function getHealthTagColor(healthFactor: number): string {
  if (healthFactor < 1.1) return 'red'
  if (healthFactor < 1.5) return 'orange'
  if (healthFactor < 2.0) return 'blue'
  return 'green'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Active': 'green',
    'Closing': 'orange',
    'Liquidated': 'red',
    'Unknown': 'default',
  }
  return colors[status] || 'default'
}

function getAlertIcon(severity: string): string {
  const icons: Record<string, string> = {
    'Info': 'info-circle',
    'Warning': 'warning',
    'Critical': 'exclamation-circle',
  }
  return icons[severity] || 'info-circle'
}

function showPositionDetails(position: DefiPosition) {
  selectedPosition.value = position
  detailsVisible.value = true
}

// Lifecycle
onMounted(async () => {
  try {
    const [chainsData, protocolsData] = await Promise.all([
      getSupportedChains(),
      getSupportedProtocols()
    ])
    chains.value = chainsData
    protocols.value = protocolsData
  } catch (error) {
    console.error('Failed to load chains/protocols:', error)
  }
})
</script>

<style scoped>
.defi-position-monitor {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0;
  color: #666;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
}

.loading-content p {
  margin-top: 16px;
}

.summary-cards {
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card .card-icon {
  font-size: 32px;
}

.summary-card .card-content {
  flex: 1;
}

.summary-card .card-label {
  font-size: 14px;
  color: #666;
}

.summary-card .card-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.summary-card.total-value .card-value {
  color: #1890ff;
}

.summary-card.net-value .card-value {
  color: #52c41a;
}

.summary-card.total-debt .card-value {
  color: #ff4d4f;
}

.summary-card.warning .card-value {
  color: #faad14;
}

.summary-card.avg-apy .card-value {
  color: #722ed1;
}

.stats-row {
  margin-bottom: 16px;
}

.distribution-card,
.risk-card,
.alerts-card {
  margin-bottom: 16px;
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

.distribution-item .item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.distribution-item .chain-icon,
.distribution-item .protocol-icon {
  font-size: 18px;
}

.distribution-item .chain-name,
.distribution-item .protocol-name {
  font-weight: 500;
}

.distribution-item .item-stats {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.distribution-item .value {
  font-weight: 500;
  color: #333;
}

.risk-card .risk-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.risk-indicator.low {
  background: #f6ffed;
}

.risk-indicator.medium {
  background: #fffbe6;
}

.risk-indicator.high {
  background: #fff7e6;
}

.risk-indicator.critical {
  background: #fff1f0;
}

.risk-indicator .risk-icon {
  font-size: 48px;
}

.risk-indicator .risk-label {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 600;
}

.risk-stats {
  display: flex;
  justify-content: space-around;
}

.risk-stats .stat-item {
  text-align: center;
}

.risk-stats .stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.risk-stats .stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.alerts-card.has-critical {
  border-color: #ff4d4f;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.alert-item.info {
  background: #e6f7ff;
}

.alert-item.warning {
  background: #fffbe6;
}

.alert-item.critical {
  background: #fff1f0;
}

.protocol-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.protocol-cell .protocol-icon {
  font-size: 20px;
}

.protocol-cell .protocol-info {
  display: flex;
  flex-direction: column;
}

.protocol-cell .chain-badge {
  font-size: 11px;
  color: #666;
}

.value-cell .main-value {
  font-weight: 500;
}

.value-cell .debt-value {
  font-size: 12px;
  color: #ff4d4f;
}

.health-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-value {
  font-weight: 500;
}

.apy-value.positive {
  color: #52c41a;
  font-weight: 500;
}

.na {
  color: #999;
}

.positions-card {
  margin-top: 16px;
}

.position-details .tokens-title {
  margin: 16px 0 8px;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.reward-symbol {
  font-weight: 500;
  min-width: 60px;
}

.reward-amount {
  flex: 1;
}

.reward-value {
  color: #52c41a;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-state .empty-icon {
  font-size: 64px;
  color: #d9d9d9;
}

.empty-state h2 {
  margin: 24px 0 8px;
  color: #333;
}

.empty-state p {
  color: #666;
}
</style>
